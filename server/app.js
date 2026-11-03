/**
 * app.js
 * ---------------------------------------------------------------------------
 * Express application factory — the "View/route dispatcher" layer.
 * It is separated from server.js so tests can import `app` without opening a port.
 *
 * Middleware order matters:
 *   helmet -> cors -> body parsers -> static -> rate limit -> routes -> 404 -> errors
 * ---------------------------------------------------------------------------
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const blogRoutes = require('./routes/blogRoutes');
const contactRoutes = require('./routes/contactRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Render/Heroku terminate TLS in front of the app; without this,
// express-rate-limit and req.ip would see the proxy IP for every client.
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// 1) Security headers (helmet) — Phase 5 requirement
// ---------------------------------------------------------------------------
app.use(
  helmet({
    // This API serves JSON; allow the React SPA (on another origin) to load
    // any images it embeds (e.g. project screenshots hosted elsewhere).
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // CSP is a front-end concern here
  })
);

// ---------------------------------------------------------------------------
// 2) CORS — the deployed SPA must be able to call this API from its own origin.
//    ALLOWED_ORIGINS is a comma-separated list, e.g.
//    https://my-portfolio.vercel.app,http://localhost:5173
// ---------------------------------------------------------------------------
const rawOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000'];
const allowedOrigins = rawOrigins.length ? rawOrigins : defaultOrigins;

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header => curl / Postman / server-to-server: allow.
      if (!origin) return callback(null, true);
      const clean = origin.replace(/\/$/, '');
      // '*' in ALLOWED_ORIGINS opens the API publicly (fine: it is a public portfolio API).
      if (allowedOrigins.includes('*') || allowedOrigins.includes(clean)) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false, // JWT travels in the Authorization header, not cookies
    maxAge: 86400,
  })
);

// ---------------------------------------------------------------------------
// 3) Body parsers
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
// Cookie parser kept so you can switch the token to an httpOnly cookie later.
app.use(require('cookie-parser')());

// ---------------------------------------------------------------------------
// 4) Tiny request logger (no extra dependency) — silenced during tests
//    Example line:  GET /api/blog 200 12ms
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      // eslint-disable-next-line no-console
      console.log(
        `[req] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`
      );
    });
    next();
  });
}

// ---------------------------------------------------------------------------
// 5) Global API rate limit (cheap DoS protection; auth routes have their own)
// ---------------------------------------------------------------------------
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please slow down.' },
  })
);

// ---------------------------------------------------------------------------
// 6) Health / root — useful to prove the deployment is alive during the demo.
// ---------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Capstone Portfolio & Blog API is running',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      projects: '/api/projects',
      blog: '/api/blog',
      contact: '/api/contact',
      health: '/api/health',
    },
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ---------------------------------------------------------------------------
// 7) Feature routes
// ---------------------------------------------------------------------------
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);

// ---------------------------------------------------------------------------
// 8) 404 + central error handler (always LAST)
// ---------------------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
