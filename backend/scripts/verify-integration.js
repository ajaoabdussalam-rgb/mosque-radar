const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Mosque = require('../models/Mosque');
const User = require('../models/User');
const connectDB = require('../config/db');

const BASE_URL = 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, options);
  let json;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  return { status: response.status, ok: response.ok, body: json, headers: response.headers };
}

async function runTests() {
  console.log('=== Mosque Radar End-to-End Integration, Auth, Moderation & Security Verification ===\n');
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

  let createdMosqueId = null;
  let secondMosqueId = null;
  let testUserId = null;

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

    // 2b. Phase 9 Text Search Verification
    const sampleTerm = directory.body.data[0].name.split(' ')[0];
    const searchRes = await request(`/api/mosques?search=${encodeURIComponent(sampleTerm)}`);
    assert(searchRes.ok && Array.isArray(searchRes.body.data) && searchRes.body.data.length > 0, `Text search GET /api/mosques?search=${sampleTerm} returns matching records (found ${searchRes.body?.data?.length})`);

    const noMatchRes = await request('/api/mosques?search=xyznonexistentterm999');
    assert(noMatchRes.ok && Array.isArray(noMatchRes.body.data) && noMatchRes.body.data.length === 0, 'Text search with nonexistent query returns empty array');

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

    // ==========================================
    // Phase 10: Authentication & Authorization Tests
    // ==========================================
    console.log('\n--- Phase 10: Authentication & Authorization ---');

    const testTimestamp = Date.now();
    const testUserEmail = `testuser_${testTimestamp}@mosqueradar.test`;
    const testUserPassword = 'TestPassword123!';

    // 5. User Registration
    const registerRes = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Test User',
        email: testUserEmail,
        password: testUserPassword
      })
    });
    assert(registerRes.status === 201 && registerRes.body.token && registerRes.body.user?.email === testUserEmail, 'User registration POST /api/auth/register creates user & returns JWT token');
    testUserId = registerRes.body?.user?._id;
    const userToken = registerRes.body?.token;

    // 6. Duplicate Registration Protection
    const duplicateRegisterRes = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Test User',
        email: testUserEmail,
        password: testUserPassword
      })
    });
    assert(duplicateRegisterRes.status === 400 && duplicateRegisterRes.body.success === false, 'Duplicate email registration correctly rejected with 400 Bad Request');

    // 7. User Login
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: testUserPassword
      })
    });
    assert(loginRes.status === 200 && loginRes.body.token, 'User login POST /api/auth/login succeeds with valid credentials');

    // 8. Invalid Login Credentials Protection
    const badLoginRes = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'WrongPassword456!'
      })
    });
    assert(badLoginRes.status === 401 && badLoginRes.body.success === false, 'Invalid login password rejected with 401 Unauthorized');

    // 9. Authenticated Profile Fetch
    const meRes = await request('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert(meRes.status === 200 && meRes.body.user?.email === testUserEmail, 'Profile fetch GET /api/auth/me returns authenticated user details');

    // 10. Missing Token Protection
    const unauthMeRes = await request('/api/auth/me');
    assert(unauthMeRes.status === 401 && unauthMeRes.body.success === false, 'Unauthenticated request to GET /api/auth/me rejected with 401 Unauthorized');

    // 11. Role-Based Authorization: Regular user blocked from moderation queue
    const userBlockedQueueRes = await request('/api/mosques/moderation/queue', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert(userBlockedQueueRes.status === 403 && userBlockedQueueRes.body.success === false, 'Regular user accessing moderation queue is forbidden (403)');

    // 12. Moderator Login
    const modLoginRes = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'mod@mosqueradar.com',
        password: 'Mod123!'
      })
    });
    assert(modLoginRes.status === 200 && modLoginRes.body.user?.role === 'moderator', 'Moderator login succeeds with role "moderator"');
    const modToken = modLoginRes.body?.token;

    // 13. Moderator Access to Queue
    const modQueueRes = await request('/api/mosques/moderation/queue', {
      headers: { 'Authorization': `Bearer ${modToken}` }
    });
    assert(modQueueRes.status === 200 && Array.isArray(modQueueRes.body.data), 'Moderator successfully accesses moderation queue (200 OK)');

    // 14. Authenticated Community Submission
    const testSubmission = {
      name: 'Integration Test Mosque ' + testTimestamp,
      address: 'Plot 42 Innovation Drive, Yaba, Lagos',
      latitude: 6.5173,
      longitude: 3.3712,
      submittedBy: 'Automated Test Runner',
      images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80']
    };

    const submitRes = await request('/api/mosques', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(testSubmission)
    });

    assert(submitRes.ok && submitRes.body.success === true, 'Authenticated community submission POST /api/mosques creates record');
    assert(submitRes.body.data.status === 'pending', 'Untrusted submission status forced to "pending"');
    assert(submitRes.body.data.createdBy === testUserId, 'Submission accurately attaches createdBy user reference');
    createdMosqueId = submitRes.body.data._id;

    // 15. Moderator Queue Contains Submission
    const updatedQueue = await request('/api/mosques/moderation/queue', {
      headers: { 'Authorization': `Bearer ${modToken}` }
    });
    const inQueue = updatedQueue.body?.data?.some(m => m._id === createdMosqueId);
    assert(inQueue, 'Submitted mosque appears in moderation queue GET /api/mosques/moderation/queue');

    // ==========================================
    // Phase 11: Admin & Moderation Tests
    // ==========================================
    console.log('\n--- Phase 11: Admin & Moderation Governance ---');

    // 16. Duplicate Check Unauthenticated Rejection
    const unauthDupRes = await request('/api/mosques/moderation/duplicates?lat=6.5173&lng=3.3712');
    assert(unauthDupRes.status === 401, 'Unauthenticated access to GET /api/mosques/moderation/duplicates rejected with 401');

    // 17. Duplicate Check Regular User Forbidden
    const forbiddenDupRes = await request('/api/mosques/moderation/duplicates?lat=6.5173&lng=3.3712', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert(forbiddenDupRes.status === 403, 'Regular user access to GET /api/mosques/moderation/duplicates forbidden with 403');

    // 18. Duplicate Proximity Check
    const dupCheckRes = await request(`/api/mosques/moderation/duplicates?lat=6.5174&lng=3.3713&radius=500`, {
      headers: { 'Authorization': `Bearer ${modToken}` }
    });
    const foundTestDup = dupCheckRes.body?.data?.some(m => m._id === createdMosqueId);
    assert(dupCheckRes.status === 200 && foundTestDup, 'Duplicate detection detects nearby mosque within 500m proximity');

    // 19. Duplicate Name Check
    const dupNameRes = await request(`/api/mosques/moderation/duplicates?name=Integration%20Test`, {
      headers: { 'Authorization': `Bearer ${modToken}` }
    });
    const foundNameDup = dupNameRes.body?.data?.some(m => m._id === createdMosqueId);
    assert(dupNameRes.status === 200 && foundNameDup, 'Duplicate detection detects matching mosque by name similarity');

    // 20. Inline Edit Before Verification
    const editRes = await request(`/api/mosques/${createdMosqueId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Corrected Mosque Name ' + testTimestamp,
        address: 'Plot 42 Innovation Drive, Suite B, Yaba, Lagos'
      })
    });
    assert(editRes.status === 200 && editRes.body.data.name.startsWith('Corrected Mosque Name'), 'Inline edit PATCH /api/mosques/:id updates mosque details');

    // 21. Rejection requires reason
    const emptyRejectRes = await request(`/api/mosques/${createdMosqueId}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${modToken}`
      },
      body: JSON.stringify({
        status: 'rejected',
        rejectionReason: '   '
      })
    });
    assert(emptyRejectRes.status === 400 && emptyRejectRes.body.success === false, 'Rejection without reason correctly rejected with 400 Bad Request');

    // 22. Moderator Decision: Approve Submission
    const verifyRes = await request(`/api/mosques/${createdMosqueId}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${modToken}`
      },
      body: JSON.stringify({
        status: 'verified',
        verifiedBy: 'Integration Test Mod'
      })
    });
    assert(verifyRes.ok && verifyRes.body.data.status === 'verified', 'Moderator PATCH /api/mosques/:id/verify approves record');

    // 23. Moderation Status Filtering (Verified Tab)
    const verifiedQueueRes = await request('/api/mosques/moderation/queue?status=verified', {
      headers: { 'Authorization': `Bearer ${modToken}` }
    });
    const containsVerified = verifiedQueueRes.body?.data?.some(m => m._id === createdMosqueId);
    assert(verifiedQueueRes.status === 200 && containsVerified, 'Moderation queue filter ?status=verified lists verified submissions');

    // 24. Rejection Workflow Test on a second submission
    const secondSubmitRes = await request('/api/mosques', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        name: 'Rejected Candidate ' + testTimestamp,
        address: 'Demolished Structure, Ikeja, Lagos',
        latitude: 6.6012,
        longitude: 3.3512,
        submittedBy: 'Automated Test Runner'
      })
    });
    secondMosqueId = secondSubmitRes.body?.data?._id;

    const rejectRes = await request(`/api/mosques/${secondMosqueId}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${modToken}`
      },
      body: JSON.stringify({
        status: 'rejected',
        rejectionReason: 'Confirmed building is no longer an active prayer space.',
        verifiedBy: 'Integration Test Mod'
      })
    });
    assert(rejectRes.status === 200 && rejectRes.body.data.status === 'rejected' && Boolean(rejectRes.body.data.rejectionReason), 'Moderator rejects submission with mandatory audit reason');

    // 25. Moderation Status Filtering (Rejected Tab)
    const rejectedQueueRes = await request('/api/mosques/moderation/queue?status=rejected', {
      headers: { 'Authorization': `Bearer ${modToken}` }
    });
    const containsRejected = rejectedQueueRes.body?.data?.some(m => m._id === secondMosqueId);
    assert(rejectedQueueRes.status === 200 && containsRejected, 'Moderation queue filter ?status=rejected lists rejected submissions');

    // 26. Re-query public directory: verify approved is visible, rejected is NOT visible
    const recheckDir = await request('/api/mosques?limit=50');
    const approvedIsLive = recheckDir.body.data.some(m => m._id === createdMosqueId);
    const rejectedExcluded = !recheckDir.body.data.some(m => m._id === secondMosqueId);
    assert(approvedIsLive && rejectedExcluded, 'Public directory includes newly approved mosque and strictly excludes rejected mosque');

    // 27. User Submissions Tracking
    const mySubmissionsRes = await request('/api/auth/my-submissions', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const foundInMySubmissions = mySubmissionsRes.body?.data?.some(m => m._id === createdMosqueId);
    assert(mySubmissionsRes.status === 200 && foundInMySubmissions, 'User profile tracking GET /api/auth/my-submissions lists submitted mosques');

    // ==========================================
    // Phase 12: Security & Production Hardening
    // ==========================================
    console.log('\n--- Phase 12: Security & Production Hardening ---');

    // 28. Helmet Security Headers Check
    const helmetCheck = await request('/api/test');
    const nosniffHeader = helmetCheck.headers.get('x-content-type-options');
    const corpHeader = helmetCheck.headers.get('cross-origin-resource-policy');
    const frameHeader = helmetCheck.headers.get('x-frame-options');

    assert(
      nosniffHeader === 'nosniff',
      `Helmet security header X-Content-Type-Options: nosniff present (found "${nosniffHeader}")`
    );
    assert(
      corpHeader === 'cross-origin',
      `Cross-Origin-Resource-Policy allows safe cross-origin image loads (found "${corpHeader}")`
    );
    assert(
      frameHeader === 'SAMEORIGIN',
      `Clickjacking protection header X-Frame-Options: SAMEORIGIN present (found "${frameHeader}")`
    );

    // 29. Rate Limiting Headers Check
    const rateLimitHeader = helmetCheck.headers.get('ratelimit-limit');
    assert(
      Boolean(rateLimitHeader),
      `Standard RateLimit-Limit header attached to API requests (limit: ${rateLimitHeader})`
    );

    // 30. NoSQL Operator Injection Defense ($ operator in body keys)
    const nosqlBodyAttack = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: { '$gt': '' },
        password: 'Password123!'
      })
    });
    assert(
      nosqlBodyAttack.status === 400 && nosqlBodyAttack.body.success === false,
      'NoSQL injection payload with $ operator rejected with 400 Bad Request'
    );

    // 31. NoSQL Operator Injection Defense ($ operator in query params)
    const nosqlQueryAttack = await request('/api/mosques?$where=maliciousFunction');
    assert(
      nosqlQueryAttack.status === 400 && nosqlQueryAttack.body.success === false,
      'NoSQL query injection with $ operator rejected with 400 Bad Request'
    );

    // 32. CORS Options Preflight Check
    const corsPreflight = await fetch(`${BASE_URL}/api/mosques`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST'
      }
    });
    const allowOrigin = corsPreflight.headers.get('access-control-allow-origin');
    assert(
      Boolean(allowOrigin),
      `CORS headers configured on preflight (access-control-allow-origin: ${allowOrigin})`
    );

    // Clean up test records
    await connectDB();
    if (createdMosqueId) {
      await Mosque.findByIdAndDelete(createdMosqueId);
    }
    if (secondMosqueId) {
      await Mosque.findByIdAndDelete(secondMosqueId);
    }
    if (testUserId) {
      await User.findByIdAndDelete(testUserId);
    }
    await mongoose.connection.close();
    console.log('🧹 Cleaned up temporary test mosque and user records.');

    console.log(`\n==============================================`);
    console.log(`Test Summary: ${passed}/${total} passed`);
    console.log(`==============================================\n`);

    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Integration test failed with unhandled error:', err);
    try {
      await connectDB();
      if (createdMosqueId) await Mosque.findByIdAndDelete(createdMosqueId);
      if (secondMosqueId) await Mosque.findByIdAndDelete(secondMosqueId);
      if (testUserId) await User.findByIdAndDelete(testUserId);
      await mongoose.connection.close();
    } catch {
      // Ignore cleanup error on catch
    }
    process.exit(1);
  }
}

runTests();
