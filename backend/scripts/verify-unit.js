const assert = require('assert');
const sanitizeInput = require('../middleware/sanitizeInput');
const { authorize } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

console.log('=== Mosque Radar Backend Isolated Unit Tests ===\n');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
  }
}

async function asyncTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
  }
}

// -------------------------------------------------------------
// 1. Haversine Spherical Distance Calculation Unit Tests
// -------------------------------------------------------------
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's mean radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

test('Haversine: Same coordinate returns 0 meters distance', () => {
  const dist = haversineDistanceMeters(6.4531, 3.3886, 6.4531, 3.3886);
  assert.strictEqual(dist, 0);
});

test('Haversine: Accurate distance calculation between Lagos Central and Lekki Central (~11.1km)', () => {
  // Lagos Central Mosque: 6.4531, 3.3886
  // Lekki Central Mosque: 6.4474, 3.4883
  const dist = haversineDistanceMeters(6.4531, 3.3886, 6.4474, 3.4883);
  // Expected distance is ~11,040 meters (+/- 100m)
  assert(dist > 10900 && dist < 11200, `Expected ~11.04km, got ${dist}m`);
});

test('Haversine: Quarter globe distance calculation (Equator to North Pole ~10,000km)', () => {
  const dist = haversineDistanceMeters(0, 0, 90, 0);
  // Expected 1/4 circumference = ~10,007 km
  assert(dist > 9900000 && dist < 10100000, `Expected ~10,000km, got ${dist}m`);
});

// -------------------------------------------------------------
// 2. Coordinate Range & GeoJSON Point Validation Unit Tests
// -------------------------------------------------------------
function validateCoordinates(coords) {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lng, lat] = coords;
  if (typeof lng !== 'number' || typeof lat !== 'number') return false;
  if (isNaN(lng) || isNaN(lat)) return false;
  if (lng < -180 || lng > 180) return false;
  if (lat < -90 || lat > 90) return false;
  return true;
}

test('Coordinates: Valid GeoJSON [lng, lat] passes', () => {
  assert.strictEqual(validateCoordinates([3.3886, 6.4531]), true);
  assert.strictEqual(validateCoordinates([-0.1654, 51.5284]), true);
  assert.strictEqual(validateCoordinates([180, 90]), true);
  assert.strictEqual(validateCoordinates([-180, -90]), true);
});

test('Coordinates: Latitude out of range (> 90 or < -90) rejected', () => {
  assert.strictEqual(validateCoordinates([3.3886, 91]), false);
  assert.strictEqual(validateCoordinates([3.3886, -91]), false);
});

test('Coordinates: Longitude out of range (> 180 or < -180) rejected', () => {
  assert.strictEqual(validateCoordinates([181, 6.4531]), false);
  assert.strictEqual(validateCoordinates([-181, 6.4531]), false);
});

test('Coordinates: Non-array or invalid types rejected', () => {
  assert.strictEqual(validateCoordinates(null), false);
  assert.strictEqual(validateCoordinates('3.3886, 6.4531'), false);
  assert.strictEqual(validateCoordinates([NaN, 6.4531]), false);
  assert.strictEqual(validateCoordinates([3.3886]), false);
  assert.strictEqual(validateCoordinates([3.3886, 6.4531, 100]), false);
});

// -------------------------------------------------------------
// 3. NoSQL Injection Sanitizer Unit Tests
// -------------------------------------------------------------
test('Sanitizer: Rejects $ operator in body keys', () => {
  const req = {
    body: { email: { $gt: '' } },
    query: {},
    params: {}
  };
  let statusCode = null;
  let responseJson = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          responseJson = data;
        }
      };
    }
  };
  let nextCalled = false;
  sanitizeInput(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(statusCode, 400);
  assert.strictEqual(nextCalled, false);
  assert.strictEqual(responseJson.success, false);
});

test('Sanitizer: Rejects dot (.) operator path in body keys', () => {
  const req = {
    body: { 'user.role': 'admin' },
    query: {},
    params: {}
  };
  let statusCode = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return { json: () => {} };
    }
  };
  let nextCalled = false;
  sanitizeInput(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(statusCode, 400);
  assert.strictEqual(nextCalled, false);
});

test('Sanitizer: Passes safe alphanumeric and nested objects', () => {
  const req = {
    body: {
      name: 'Lekki Central Mosque',
      address: 'Lekki Phase 1',
      location: {
        type: 'Point',
        coordinates: [3.4883, 6.4474]
      }
    },
    query: { radius: '5000' },
    params: { id: '60c72b2f9b1d8b2bad000001' }
  };
  let nextCalled = false;
  const res = {
    status: () => ({ json: () => {} })
  };
  sanitizeInput(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true);
});

// -------------------------------------------------------------
// 4. Role-Based Authorization Middleware Unit Tests
// -------------------------------------------------------------
test('Authorize: Allows matching user role (admin)', () => {
  const middleware = authorize('moderator', 'admin');
  const req = { user: { role: 'admin' } };
  let nextCalled = false;
  const res = {};
  middleware(req, res, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true);
});

test('Authorize: Allows matching user role (moderator)', () => {
  const middleware = authorize('moderator', 'admin');
  const req = { user: { role: 'moderator' } };
  let nextCalled = false;
  const res = {};
  middleware(req, res, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true);
});

test('Authorize: Rejects non-privileged user role with 403 Forbidden', () => {
  const middleware = authorize('moderator', 'admin');
  const req = { user: { role: 'user' } };
  let statusCode = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return { json: () => {} };
    }
  };
  let nextCalled = false;
  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(statusCode, 403);
  assert.strictEqual(nextCalled, false);
});

// -------------------------------------------------------------
// 5. Password Hashing & Verification Unit Tests
// -------------------------------------------------------------
async function runAsyncUnitTests() {
  await asyncTest('Bcrypt: Password hashing produces valid hash & verifies match', async () => {
    const rawPassword = 'SecretMosquePassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    const isMatch = await bcrypt.compare(rawPassword, hash);
    const isWrongMatch = await bcrypt.compare('IncorrectPassword', hash);

    assert.strictEqual(isMatch, true);
    assert.strictEqual(isWrongMatch, false);
  });

  console.log(`\n==============================================`);
  console.log(`Unit Test Summary: ${passed}/${total} passed`);
  console.log(`==============================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runAsyncUnitTests();
