const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * Exits the process with a clear message if the connection fails
 * or if the URI is missing/placeholder.
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  // Detect missing or placeholder connection string
  if (!mongoURI || mongoURI === 'your_mongodb_connection_string_here') {
    console.error('');
    console.error('========================================');
    console.error('  MONGO_URI is not configured.');
    console.error('  Please set a valid MongoDB connection');
    console.error('  string in backend/.env');
    console.error('========================================');
    console.error('');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoURI);
    // Log the host only — never log the full URI (it may contain credentials)
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
