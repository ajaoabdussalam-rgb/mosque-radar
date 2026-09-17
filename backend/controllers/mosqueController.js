const mongoose = require('mongoose');
const Mosque = require('../models/Mosque');

/**
 * Normalizes input coordinates into GeoJSON format.
 * Accepts:
 *   - location: { type: 'Point', coordinates: [lng, lat] }
 *   - coordinates: [lng, lat]
 *   - longitude/lng and latitude/lat at root
 */
const parseLocationInput = (body) => {
  if (body.location && Array.isArray(body.location.coordinates)) {
    return {
      type: 'Point',
      coordinates: [
        Number(body.location.coordinates[0]),
        Number(body.location.coordinates[1])
      ]
    };
  }

  if (Array.isArray(body.coordinates)) {
    return {
      type: 'Point',
      coordinates: [
        Number(body.coordinates[0]),
        Number(body.coordinates[1])
      ]
    };
  }

  const lng = body.longitude !== undefined ? body.longitude : body.lng;
  const lat = body.latitude !== undefined ? body.latitude : body.lat;

  if (lng !== undefined && lat !== undefined) {
    return {
      type: 'Point',
      coordinates: [Number(lng), Number(lat)]
    };
  }

  return undefined;
};

/**
 * @desc    Get all mosques (supports status filter and pagination)
 * @route   GET /api/mosques
 * @access  Public
 */
const getMosques = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    // Filter by status if specified.
    // If status='all', do not filter by status.
    // Otherwise, default to 'verified' for public safety per roadmap.
    if (req.query.status) {
      if (req.query.status !== 'all') {
        filter.status = req.query.status;
      }
    } else {
      filter.status = 'verified';
    }

    // Text search: when a search query is provided, apply MongoDB $text search
    const searchTerm = req.query.search ? req.query.search.trim() : '';
    if (searchTerm) {
      filter.$text = { $search: searchTerm };
    }

    // Build the query
    let query = Mosque.find(filter);

    // When searching, project and sort by text relevance score
    if (searchTerm) {
      query = query
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const [mosques, total] = await Promise.all([
      query
        .skip(skip)
        .limit(limit)
        .lean(),
      Mosque.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: mosques.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      data: mosques
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single mosque by ID
 * @route   GET /api/mosques/:id
 * @access  Public
 */
const getMosqueById = async (req, res, next) => {
  try {
    const mosque = await Mosque.findById(req.params.id);

    if (!mosque) {
      return res.status(404).json({
        success: false,
        message: 'Mosque not found'
      });
    }

    res.status(200).json({
      success: true,
      data: mosque
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a new mosque submission
 * @route   POST /api/mosques
 * @access  Public (untrusted input; status always forced to 'pending')
 */
const createMosque = async (req, res, next) => {
  try {
    const submission = req.sanitizedSubmission || {
      name: req.body.name,
      address: req.body.address,
      location: parseLocationInput(req.body),
      images: Array.isArray(req.body.images) ? req.body.images : [],
      submittedBy: req.body.submittedBy || 'anonymous'
    };

    if (!submission.location) {
      return res.status(400).json({
        success: false,
        message: 'Valid geographic coordinates are required ([longitude, latitude])'
      });
    }

    // Untrusted Input Rule:
    // Clients cannot self-verify or set moderation metadata on creation.
    const createdBy = req.user ? req.user._id : undefined;
    const submittedBy = (req.user && (!submission.submittedBy || submission.submittedBy === 'anonymous'))
      ? req.user.name
      : (submission.submittedBy || 'anonymous');

    const newMosque = new Mosque({
      name: submission.name,
      address: submission.address,
      location: submission.location,
      images: submission.images,
      submittedBy,
      createdBy,
      status: 'pending' // Enforce pending status unconditionally
    });

    const savedMosque = await newMosque.save();

    res.status(201).json({
      success: true,
      data: savedMosque
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update mosque details (excluding verification status)
 * @route   PATCH /api/mosques/:id
 * @access  Public (general edits; verification status changes restricted to moderation)
 */
const updateMosque = async (req, res, next) => {
  try {
    const mosque = await Mosque.findById(req.params.id);

    if (!mosque) {
      return res.status(404).json({
        success: false,
        message: 'Mosque not found'
      });
    }

    // Disallow altering status or moderation fields via generic update route
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.address !== undefined) updates.address = req.body.address;
    if (req.body.images !== undefined && Array.isArray(req.body.images)) {
      updates.images = req.body.images;
    }

    const location = parseLocationInput(req.body);
    if (location) {
      updates.location = location;
    }

    const updatedMosque = await Mosque.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedMosque
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Find nearby mosques using geospatial queries ($geoNear)
 * @route   GET /api/mosques/nearby
 * @access  Public
 * @query   lat (Number), lng (Number), radius (Number, meters, default: 10000), limit (Number, default: 20), status (String, default: 'verified')
 */
const getNearbyMosques = async (req, res, next) => {
  try {
    const latRaw = req.query.lat !== undefined ? req.query.lat : req.query.latitude;
    const lngRaw = req.query.lng !== undefined ? req.query.lng : (req.query.lon !== undefined ? req.query.lon : req.query.longitude);

    if (latRaw === undefined || lngRaw === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude (lat) and Longitude (lng) query parameters are required'
      });
    }

    const lat = parseFloat(latRaw);
    const lng = parseFloat(lngRaw);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates must be valid numbers: latitude between -90 and 90, longitude between -180 and 180'
      });
    }

    // Radius in meters: default 10,000m (10km), max 100,000m (100km)
    let maxDistance = 10000;
    if (req.query.radiusKm !== undefined) {
      const parsedKm = parseFloat(req.query.radiusKm);
      if (!isNaN(parsedKm) && parsedKm > 0) {
        maxDistance = parsedKm * 1000;
      }
    } else if (req.query.radius !== undefined) {
      const parsedRadius = parseFloat(req.query.radius);
      if (!isNaN(parsedRadius) && parsedRadius > 0) {
        maxDistance = parsedRadius;
      }
    }

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    // Status filter: default to 'verified' for public queries
    const statusFilter = {};
    if (req.query.status) {
      if (req.query.status !== 'all') {
        statusFilter.status = req.query.status;
      }
    } else {
      statusFilter.status = 'verified';
    }

    // $geoNear aggregation
    // GeoJSON point coordinates: [longitude, latitude]
    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          distanceField: 'distanceMeters',
          maxDistance: maxDistance,
          spherical: true,
          query: statusFilter
        }
      },
      {
        $limit: limit
      },
      {
        $addFields: {
          distanceKm: {
            $round: [{ $divide: ['$distanceMeters', 1000] }, 2]
          },
          distanceMeters: {
            $round: ['$distanceMeters', 0]
          }
        }
      }
    ];

    const mosques = await Mosque.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: mosques.length,
      searchCenter: {
        latitude: lat,
        longitude: lng
      },
      radiusMeters: maxDistance,
      data: mosques
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get mosques for moderation (defaults to pending, supports status filtering)
 * @route   GET /api/mosques/moderation/queue
 * @access  Moderator / Admin
 */
const getPendingMosques = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const requestedStatus = req.query.status || 'pending';
    const filter = {};
    if (requestedStatus !== 'all') {
      filter.status = requestedStatus;
    }

    const sortOrder = requestedStatus === 'pending' ? { createdAt: 1 } : { updatedAt: -1 };

    const [mosques, total] = await Promise.all([
      Mosque.find(filter)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      Mosque.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: mosques.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      data: mosques
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Check potential duplicate mosques by proximity and/or name
 * @route   GET /api/mosques/moderation/duplicates
 * @access  Moderator / Admin
 */
const checkDuplicates = async (req, res, next) => {
  try {
    const { lat, lng, name, excludeId } = req.query;
    const radiusMeters = Math.min(5000, Math.max(50, parseInt(req.query.radius, 10) || 500)); // default 500m

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const hasValidCoords =
      !isNaN(parsedLat) &&
      !isNaN(parsedLng) &&
      parsedLat >= -90 &&
      parsedLat <= 90 &&
      parsedLng >= -180 &&
      parsedLng <= 180;

    let geoMatches = [];
    if (hasValidCoords) {
      const geoFilter = {};
      if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
        geoFilter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
      }

      geoMatches = await Mosque.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parsedLng, parsedLat]
            },
            distanceField: 'distanceMeters',
            maxDistance: radiusMeters,
            spherical: true,
            query: geoFilter
          }
        },
        { $limit: 5 },
        {
          $addFields: {
            distanceMeters: { $round: ['$distanceMeters', 0] },
            distanceKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 2] },
            matchType: 'proximity'
          }
        }
      ]);
    }

    let nameMatches = [];
    if (name && name.trim().length >= 3) {
      const trimmedName = name.trim();
      const nameFilter = {
        name: { $regex: trimmedName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), $options: 'i' }
      };
      if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
        nameFilter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
      }

      // Exclude documents already captured in geoMatches
      const geoIds = geoMatches.map((m) => m._id.toString());
      if (geoIds.length > 0) {
        nameFilter._id = {
          ...nameFilter._id,
          $nin: geoIds.map((id) => new mongoose.Types.ObjectId(id))
        };
      }

      const foundByName = await Mosque.find(nameFilter).limit(5).lean();
      nameMatches = foundByName.map((m) => ({
        ...m,
        matchType: 'name'
      }));
    }

    const duplicates = [...geoMatches, ...nameMatches];

    res.status(200).json({
      success: true,
      count: duplicates.length,
      data: duplicates
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Verify or reject a community-submitted mosque
 * @route   PATCH /api/mosques/:id/verify
 * @access  Moderator / Admin
 */
const verifyMosque = async (req, res, next) => {
  try {
    const { status, verifiedBy, rejectionReason } = req.body;

    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status is required and must be either "verified" or "rejected"'
      });
    }

    if (status === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required when rejecting a mosque submission'
      });
    }

    const mosque = await Mosque.findById(req.params.id);

    if (!mosque) {
      return res.status(404).json({
        success: false,
        message: 'Mosque not found'
      });
    }

    // Apply verification state transition & audit fields
    mosque.status = status;
    mosque.verifiedAt = new Date();
    mosque.verifiedBy = (verifiedBy && typeof verifiedBy === 'string' && verifiedBy.trim())
      ? verifiedBy.trim()
      : 'moderator';

    if (status === 'rejected') {
      mosque.rejectionReason = rejectionReason.trim();
    } else {
      mosque.rejectionReason = undefined; // Clear previous rejection reason if re-verifying
    }

    const savedMosque = await mosque.save();

    res.status(200).json({
      success: true,
      data: savedMosque
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMosques,
  getNearbyMosques,
  getPendingMosques,
  checkDuplicates,
  getMosqueById,
  createMosque,
  updateMosque,
  verifyMosque
};
