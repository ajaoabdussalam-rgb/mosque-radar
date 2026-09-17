const express = require('express');
const router = express.Router();

const {
  getMosques,
  getNearbyMosques,
  getPendingMosques,
  checkDuplicates,
  getMosqueById,
  createMosque,
  updateMosque,
  verifyMosque
} = require('../controllers/mosqueController');

const validateSubmission = require('../middleware/validateSubmission');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');

router.route('/')
  .get(getMosques)
  .post(optionalAuth, validateSubmission, createMosque);

// Proximity search, moderation queue, and duplicate check must be registered before the /:id route parameter
router.get('/nearby', getNearbyMosques);
router.get('/moderation/queue', protect, authorize('moderator', 'admin'), getPendingMosques);
router.get('/moderation/duplicates', protect, authorize('moderator', 'admin'), checkDuplicates);

router.route('/:id')
  .get(getMosqueById)
  .patch(updateMosque);

// Verification and moderation decision endpoint (restricted to moderators and admins)
router.patch('/:id/verify', protect, authorize('moderator', 'admin'), verifyMosque);

module.exports = router;
