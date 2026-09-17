const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const helmet = require('helmet');
const connectDB = require('./config/db');
const testRoutes = require('./routes/testRoutes');
const mosqueRoutes = require('./routes/mosqueRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const sanitizeInput = require('./middleware/sanitizeInput');
const { apiLimiter } = require('./middleware/rateLimiter');

// --- Create Express app ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Security Headers (Helmet) ---
// Configured with cross-origin resource policy so static images in /uploads can render across origins
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// --- CORS ---
// Uses CLIENT_URL from .env when set, otherwise allows all origins (development default).
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// --- Body parsing ---
app.use(express.json({ limit: '10mb' }));

// --- NoSQL Injection Defense ---
app.use(sanitizeInput);

// --- Rate Limiting ---
app.use('/api', apiLimiter);

// --- Static file serving for uploads ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes ---
app.use('/api/test', testRoutes);
app.use('/api/health', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/mosques', mosqueRoutes);
app.use('/api/upload', uploadRoutes);

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
