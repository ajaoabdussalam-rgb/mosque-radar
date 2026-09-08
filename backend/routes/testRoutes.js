const express = require('express');
const router = express.Router();

// GET /api/test — Health check endpoint to verify the API is running
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mosque Radar API is running',
  });
});

module.exports = router;
