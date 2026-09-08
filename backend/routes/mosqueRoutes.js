const express = require('express');
const router = express.Router();

const {
  getMosques,
  getNearbyMosques,
  getMosqueById,
  createMosque,
  updateMosque
} = require('../controllers/mosqueController');

router.route('/')
  .get(getMosques)
  .post(createMosque);

// Proximity search must be registered before the /:id route parameter
router.get('/nearby', getNearbyMosques);

router.route('/:id')
  .get(getMosqueById)
  .patch(updateMosque);

module.exports = router;
