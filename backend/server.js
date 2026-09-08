const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const testRoutes = require('./routes/testRoutes');
const mosqueRoutes = require('./routes/mosqueRoutes');
const errorHandler = require('./middleware/errorHandler');

// --- Create Express app ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS ---
// Uses CLIENT_URL from .env when set, otherwise allows all origins (development default).
// Restrict this to the real frontend origin before deploying to production.
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
};
app.use(cors(corsOptions));

// --- Body parsing ---
app.use(express.json());

// --- Routes ---
app.use('/api/test', testRoutes);
app.use('/api/mosques', mosqueRoutes);

// --- Global error handler (must be registered after all routes) ---
app.use(errorHandler);

// --- Startup sequence ---
// 1. Connect to MongoDB
// 2. Only start the Express server after the database connection succeeds
// If the database connection fails, connectDB will exit the process
// with a clear error message — the server will never start without a database.
const startServer = async () => {
  await connectDB();

  return app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
