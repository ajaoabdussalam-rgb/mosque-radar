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

    const [mosques, total] = await Promise.all([
      Mosque.find(filter)
        .sort({ createdAt: -1 })
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
    const { name, address, images, submittedBy } = req.body;

    const location = parseLocationInput(req.body);

    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Valid geographic coordinates are required ([longitude, latitude])'
      });
    }

    // Untrusted Input Rule:
    // Clients cannot self-verify or set moderation metadata on creation.
    const newMosque = new Mosque({
      name,
      address,
      location,
      images: Array.isArray(images) ? images : [],
      submittedBy: submittedBy || 'anonymous',
      status: 'pending' // Enforce pending status
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

module.exports = {
  getMosques,
  getNearbyMosques,
  getMosqueById,
  createMosque,
  updateMosque
};
