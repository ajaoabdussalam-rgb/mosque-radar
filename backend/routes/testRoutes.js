const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

// GET /api/test or /api/health — Production health check endpoint
router.get('/', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    success: true,
    message: 'Mosque Radar API is running',
    status: isDbConnected ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      connected: isDbConnected,
      readyState: mongoose.connection.readyState
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
