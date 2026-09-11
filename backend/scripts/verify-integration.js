const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const http = require('http');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, options);
  const json = await response.json();
  return { status: response.status, ok: response.ok, body: json };
}

async function runTests() {
  console.log('=== Mosque Radar Phase 8 End-to-End Integration Verification ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
    }
  }

  try {
    // 1. Health check
    const health = await request('/api/test');
    assert(health.ok && health.body.success === true, 'Health check GET /api/test responds with success: true');

    // 2. Directory Listing
    const directory = await request('/api/mosques');
    assert(directory.ok && Array.isArray(directory.body.data) && directory.body.data.length > 0, `Directory GET /api/mosques returns live verified records (found ${directory.body?.data?.length})`);

    // Verify all records returned are verified
    const allVerified = directory.body.data.every(m => m.status === 'verified');
    assert(allVerified, 'Public directory strictly excludes unverified records');

    // 3. Proximity Search with dynamic distance calculation
    const nearby = await request('/api/mosques/nearby?lat=6.5244&lng=3.3792&radius=15000');
    assert(nearby.ok && Array.isArray(nearby.body.data) && nearby.body.data.length > 0, `Proximity search GET /api/mosques/nearby returns nearby mosques (found ${nearby.body?.data?.length})`);

    const hasDistances = nearby.body.data.every(m => typeof m.distanceKm === 'number' && typeof m.distanceMeters === 'number');
    assert(hasDistances, 'Nearby mosques include dynamically calculated distanceKm and distanceMeters');

    // Verify sorted ascending by distance
    let isSorted = true;
    for (let i = 1; i < nearby.body.data.length; i++) {
      if (nearby.body.data[i].distanceMeters < nearby.body.data[i - 1].distanceMeters) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, 'Nearby mosques are sorted strictly nearest-to-farthest');

    // 4. Single Mosque Lookup
    const sampleId = directory.body.data[0]._id;
    const detail = await request(`/api/mosques/${sampleId}`);
    assert(detail.ok && detail.body.data && detail.body.data._id === sampleId, `Single mosque lookup GET /api/mosques/:id returns requested document (${detail.body?.data?.name})`);

    // 5. Community Submission
    const testSubmission = {
      name: 'Integration Test Mosque ' + Date.now(),
      address: 'Plot 42 Innovation Drive, Yaba, Lagos',
      latitude: 6.5173,
      longitude: 3.3712,
      submittedBy: 'Automated Test Runner',
      images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80']
    };

    const submitRes = await request('/api/mosques', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSubmission)
    });

    assert(submitRes.ok && submitRes.body.success === true, 'Community submission POST /api/mosques creates record');
    assert(submitRes.body.data.status === 'pending', 'Untrusted submission status forced to "pending"');
    const createdId = submitRes.body.data._id;

    // 6. Moderation Queue
    const queue = await request('/api/mosques/moderation/queue');
    const inQueue = queue.body.data.some(m => m._id === createdId);
    assert(inQueue, 'Submitted mosque appears in moderation queue GET /api/mosques/moderation/queue');

    // 7. Verify / Approve Submission
    const verifyRes = await request(`/api/mosques/${createdId}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'verified',
        verifiedBy: 'Integration Test Mod'
      })
    });
    assert(verifyRes.ok && verifyRes.body.data.status === 'verified', 'Moderation PATCH /api/mosques/:id/verify approves record');

    // 8. Re-query public directory: verify newly approved mosque now appears!
    const recheckDir = await request('/api/mosques?limit=50');
    const nowVisible = recheckDir.body.data.some(m => m._id === createdId);
    assert(nowVisible, 'Approved mosque is now live in public directory');

    // 9. Clean up test record so database stays pristine
    const Mosque = require('../models/Mosque');
    const connectDB = require('../config/db');
    await connectDB();
    await Mosque.findByIdAndDelete(createdId);
    console.log('🧹 Cleaned up temporary test record.');

    console.log(`\n==============================================`);
    console.log(`Test Summary: ${passed}/${total} passed`);
    console.log(`==============================================\n`);

    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Integration test failed with unhandled error:', err);
    process.exit(1);
  }
}

runTests();
