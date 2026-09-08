const express = require('express');
const router = express.Router();

const {
  getMosques,
  getNearbyMosques,
  getPendingMosques,
  getMosqueById,
  createMosque,
  updateMosque,
  verifyMosque
} = require('../controllers/mosqueController');

const validateSubmission = require('../middleware/validateSubmission');

router.route('/')
  .get(getMosques)
  .post(validateSubmission, createMosque);

// Proximity search and moderation queue must be registered before the /:id route parameter
router.get('/nearby', getNearbyMosques);
router.get('/moderation/queue', getPendingMosques);

router.route('/:id')
  .get(getMosqueById)
  .patch(updateMosque);

// Verification and moderation decision endpoint
router.patch('/:id/verify', verifyMosque);

module.exports = router;
