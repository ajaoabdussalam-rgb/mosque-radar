/**
 * Middleware to sanitize and validate community mosque submission payloads.
 *
 * Core Principle: ALL incoming client payloads are treated as UNTRUSTED input.
 * - Enforces required fields and character length limits.
 * - Strips dangerous HTML tags and trims whitespace.
 * - Strictly validates geographic coordinates within WGS84 bounds:
 *     longitude: [-180, 180], latitude: [-90, 90]
 * - Strips unauthorized fields (e.g., status, verifiedAt, _id).
 * - Returns structured, actionable field-level validation error maps.
 */

// Helper to strip script/style tags with content, then any remaining HTML tags
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags AND their content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Strip style tags AND their content
    .replace(/<[^>]+>/g, '') // Strip remaining HTML tags
    .trim();
};

const validateSubmission = (req, res, next) => {
  const errors = {};
  const body = req.body || {};

  // 1. Name validation
  const rawName = body.name;
  if (!rawName || typeof rawName !== 'string' || !rawName.trim()) {
    errors.name = 'Mosque name is required';
  } else {
    const cleanedName = sanitizeString(rawName);
    if (cleanedName.length < 2 || cleanedName.length > 120) {
      errors.name = 'Mosque name must be between 2 and 120 characters';
    }
  }

  // 2. Address validation
  const rawAddress = body.address;
  if (!rawAddress || typeof rawAddress !== 'string' || !rawAddress.trim()) {
    errors.address = 'Mosque address or location description is required';
  } else {
    const cleanedAddress = sanitizeString(rawAddress);
    if (cleanedAddress.length < 3 || cleanedAddress.length > 250) {
      errors.address = 'Address must be between 3 and 250 characters';
    }
  }

  // 3. Geographic Coordinates validation
  let lng;
  let lat;

  if (body.location && Array.isArray(body.location.coordinates)) {
    lng = Number(body.location.coordinates[0]);
    lat = Number(body.location.coordinates[1]);
  } else if (Array.isArray(body.coordinates)) {
    lng = Number(body.coordinates[0]);
    lat = Number(body.coordinates[1]);
  } else {
    const rawLng = body.longitude !== undefined ? body.longitude : body.lng;
    const rawLat = body.latitude !== undefined ? body.latitude : body.lat;
    if (rawLng !== undefined) lng = Number(rawLng);
    if (rawLat !== undefined) lat = Number(rawLat);
  }

  if (lng === undefined || lat === undefined || !Number.isFinite(lng) || !Number.isFinite(lat)) {
    errors.coordinates = 'Valid geographic coordinates (longitude and latitude) are required';
  } else {
    if (lng < -180 || lng > 180) {
      errors.longitude = 'Longitude must be between -180 and 180 degrees';
    }
    if (lat < -90 || lat > 90) {
      errors.latitude = 'Latitude must be between -90 and 90 degrees';
    }
  }

  // 4. Images validation (optional, max 5)
  let cleanedImages = [];
  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) {
      errors.images = 'Images must be provided as an array of URL strings';
    } else if (body.images.length > 5) {
      errors.images = 'A maximum of 5 images can be submitted';
    } else {
      for (let i = 0; i < body.images.length; i++) {
        const img = body.images[i];
        if (typeof img !== 'string' || !img.trim()) {
          errors.images = 'Each image entry must be a non-empty URL string';
          break;
        }
        cleanedImages.push(img.trim());
      }
    }
  }

  // 5. Submitter metadata (optional, max 60 chars)
  let cleanedSubmitter = 'anonymous';
  if (body.submittedBy && typeof body.submittedBy === 'string') {
    const s = sanitizeString(body.submittedBy);
    if (s.length > 60) {
      errors.submittedBy = 'Submitter identifier cannot exceed 60 characters';
    } else if (s.length > 0) {
      cleanedSubmitter = s;
    }
  }

  // If any validation errors occurred, return actionable 400 Bad Request
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Mosque submission validation failed',
      errors
    });
  }

  // Attach strictly sanitized, trusted payload to the request
  // Notice: 'status' is never accepted from client and is intentionally omitted here
  req.sanitizedSubmission = {
    name: sanitizeString(rawName),
    address: sanitizeString(rawAddress),
    location: {
      type: 'Point',
      coordinates: [lng, lat] // [longitude, latitude] GeoJSON standard
    },
    images: cleanedImages,
    submittedBy: cleanedSubmitter
  };

  next();
};

module.exports = validateSubmission;
