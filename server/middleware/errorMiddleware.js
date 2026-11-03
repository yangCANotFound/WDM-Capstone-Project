/**
 * middleware/errorMiddleware.js
 * ---------------------------------------------------------------------------
 * Central error handling (Rubric: Back-End #5 "Structure & Error Handling").
 *
 * Every error in the app funnels into ONE JSON shape:
 *
 *   { success: false, message: "Human readable message", errors?: [{field, message}] }
 *
 * - `notFound`     : turns any unmatched route into a 404 JSON response.
 * - `errorHandler` : the single Express error middleware (4 arguments).
 * - `AppError`     : small helper class so controllers can throw `new AppError(msg, 400)`.
 * - `asyncHandler` : wraps async controllers so rejected promises reach errorHandler
 *                    (Express 4 does not forward async rejections automatically).
 * ---------------------------------------------------------------------------
 */

/** Domain error with an HTTP status code attached. */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected errors from programming bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express 4 does not catch rejected promises from async handlers.
 * asyncHandler forwards them to `next(err)` -> errorHandler.
 * (Express 5 does this natively, but wrapping keeps the code portable.)
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/** 404 for any route that did not match. Must be mounted AFTER all routes. */
const notFound = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
};

/** Translate a Mongoose / JWT / Mongo / custom error into a JSON response. */
const errorHandler = (err, req, res, _next) => {
  // Start from the error as-is, then normalise known error types.
  let statusCode = err.statusCode || res.statusCode || 500;
  if (statusCode < 400) statusCode = 500; // a "200 statusCode + error" is a bug
  let message = err.message || 'Server Error';
  let errors = null;

  // 1) Mongoose: schema validation failed (required / minlength / unique-ish)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = 'Validation failed: ' + errors.map((e) => `${e.field} — ${e.message}`).join('; ');
  }

  // 2) Mongoose: CastError => malformed ObjectId in params/body (e.g. /api/blog/123)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: "${err.value}" is not a valid ObjectId`;
  }

  // 3) MongoDB: duplicate key (e.g. username/email already taken)
  //    With `unique: true` Mongo raises 11000 instead of a ValidationError.
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `${field} "${value}" is already taken`;
    errors = [{ field, message }];
  }

  // 4) JSON Web Token errors thrown by jsonwebtoken in protect()
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Not authorized: invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized: token expired, please log in again';
  }

  // 5) CORS rejection
  if (err.message && err.message.startsWith('Not allowed by CORS')) {
    statusCode = 403;
  }

  // 6) Malformed JSON body (express.json() throws a SyntaxError with .body)
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body too large';
  }

  // Log server errors (5xx) with stack; expected 4xx only as a one-liner.
  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', statusCode, message, '\n', err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    // Never leak stack traces to clients in production.
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

module.exports = { AppError, asyncHandler, notFound, errorHandler };
