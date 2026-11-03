/**
 * server.js
 * ---------------------------------------------------------------------------
 * Boot sequence:
 *   1) load .env (dotenv)
 *   2) validate required secrets
 *   3) connect to MongoDB Atlas
 *   4) listen on PORT (Render assigns process.env.PORT automatically)
 *   5) graceful shutdown on SIGTERM/SIGINT
 * ---------------------------------------------------------------------------
 */
// dotenv must be configured before ANY module reads process.env
require('dotenv').config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
// Fail fast on missing configuration (common deployment mistake #1)
// ---------------------------------------------------------------------------
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key] || !process.env[key].trim());
if (missing.length) {
  // eslint-disable-next-line no-console
  console.error(
    `[boot] Missing required environment variable(s): ${missing.join(', ')}.\n` +
      '       Locally: copy .env.example -> .env and fill it in.\n' +
      '       On Render: Dashboard -> Environment -> add the variables.'
  );
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  // eslint-disable-next-line no-console
  console.warn('[boot] WARNING: JWT_SECRET should be at least 32 characters for production.');
}

const start = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`[boot] API listening on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
      // eslint-disable-next-line no-console
      console.log(`[boot] Allowed CORS origins: ${process.env.ALLOWED_ORIGINS || '(defaults: localhost:5173, localhost:3000)'}`);
    });

    const shutdown = async (signal) => {
      // eslint-disable-next-line no-console
      console.log(`\n[boot] ${signal} received — shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
      // Hard exit if connections do not drain within 10s
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[boot] Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
