/**
 * config/db.js
 * ---------------------------------------------------------------------------
 * Single responsibility: open (and close) the MongoDB Atlas connection.
 * Keeping this in /config means no controller ever imports `mongoose` directly
 * for connection concerns — that is the "M" of MVC + the infrastructure layer.
 * ---------------------------------------------------------------------------
 */
const mongoose = require('mongoose');

// Mongoose 8 is `strictQuery` = false by default; we keep it explicit so that
// typos in query params do not silently return an empty array.
mongoose.set('strictQuery', false);

/**
 * Connect to MongoDB Atlas using process.env.MONGO_URI.
 * The URI is read from the environment (dotenv in server.js) so the
 * connection string is never committed to source control.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    // Fail loudly and early: an API without a database is not deployable.
    throw new Error(
      'MONGO_URI is not defined. Copy .env.example to .env and set MONGO_URI ' +
        '(MongoDB Atlas connection string).'
    );
  }

  const conn = await mongoose.connect(uri, {
    // Fail fast during connection instead of hanging a request for 30s.
    serverSelectionTimeoutMS: 10000,
    // Mongoose 8 defaults are fine for Atlas; kept explicit for readability.
    autoIndex: true,
  });

  // eslint-disable-next-line no-console
  console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

  mongoose.connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[db] MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('[db] MongoDB disconnected');
  });

  return conn;
};

/** Graceful shutdown helper used by server.js on SIGTERM/SIGINT. */
const disconnectDB = async () => {
  await mongoose.connection.close(false);
  // eslint-disable-next-line no-console
  console.log('[db] MongoDB connection closed');
};

module.exports = { connectDB, disconnectDB };
