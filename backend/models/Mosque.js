const mongoose = require('mongoose');

const mosqueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Mosque name is required'],
      trim: true,
      minlength: [2, 'Mosque name must be at least 2 characters long'],
      maxlength: [120, 'Mosque name cannot exceed 120 characters']
    },
    address: {
      type: String,
      required: [true, 'Mosque address or location description is required'],
      trim: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      // GeoJSON standard: [longitude, latitude]
      // Notice: longitude comes first in GeoJSON, latitude comes second.
      coordinates: {
        type: [Number],
        required: [true, 'Geographic coordinates are required'],
        validate: {
          validator: function (coords) {
            return (
              Array.isArray(coords) &&
              coords.length === 2 &&
              typeof coords[0] === 'number' &&
              !isNaN(coords[0]) &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              typeof coords[1] === 'number' &&
              !isNaN(coords[1]) &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message:
            'Coordinates must be an array of [longitude, latitude] where longitude is between -180 and 180, and latitude is between -90 and 90'
        }
      }
    },
    images: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'verified', 'rejected'],
        message: '{VALUE} is not a valid verification status'
      },
      default: 'pending',
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedBy: {
      type: String,
      default: 'anonymous',
      trim: true
    },
    verifiedAt: {
      type: Date
    },
    verifiedBy: {
      type: String,
      trim: true
    },
    rejectionReason: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// 2dsphere index for geospatial proximity queries ($near, $geoNear, $geoWithin)
mosqueSchema.index({ location: '2dsphere' });

// Text index for full-text search on mosque name and address
mosqueSchema.index({ name: 'text', address: 'text' });

module.exports = mongoose.model('Mosque', mosqueSchema);
