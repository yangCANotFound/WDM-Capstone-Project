/**
 * middleware/authMiddleware.js
 * ---------------------------------------------------------------------------
 * Phase 3 — Authorization.
 *
 * protect : verifies "Authorization: Bearer <token>", loads the user from the
 *           DB and attaches it as `req.user`. Every protected route uses it.
 * authorize(...roles) : optional role gate (kept for the "projects are
 *           admin-only" assumption; every registered user is an 'admin' by
 *           default, which is why registering a user grants project admin rights).
 * ---------------------------------------------------------------------------
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, asyncHandler } = require('./errorMiddleware');

/**
 * @desc  Verify JWT and attach the authenticated user to req.user
 * @returns 401 when header missing / malformed / invalid / expired / user deleted
 */
const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  // 1) Header must exist and start with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Not authorized: no token provided', 401);
  }

  // 2) Extract the raw token ("Bearer eyJhbGciOi..." -> "eyJhbGciOi...")
  const token = authHeader.split(' ')[1].trim();
  if (!token) {
    throw new AppError('Not authorized: empty token', 401);
  }

  // 3) Verify signature + expiry. Throws JsonWebTokenError / TokenExpiredError,
  //    which errorHandler converts into a 401 JSON response.
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // The payload is { id, iat, exp } — `id` is the user's _id (Phase 2 requirement).
  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    // Valid signature but the user was deleted afterwards.
    throw new AppError('Not authorized: user no longer exists', 401);
  }

  req.user = user; // <-- the whole point of this middleware
  next();
});

/**
 * @desc  Restrict a route to a set of roles. Must be used AFTER protect().
 * @example router.delete('/:id', protect, authorize('admin'), deleteProject)
 */
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized: no user on request', 401));
  }
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError(
        `User role '${req.user.role}' is not authorized to access this route`,
        403
      )
    );
  }
  return next();
};

module.exports = { protect, authorize };
