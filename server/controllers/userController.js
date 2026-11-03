/**
 * controllers/userController.js  (also mounted as authController)
 * ---------------------------------------------------------------------------
 * Phase 2 — Authentication.
 *   POST /api/users/register : hash password with bcrypt -> create user -> return JWT
 *   POST /api/users/login    : find user -> bcrypt.compare -> return JWT
 *   GET  /api/users/me       : (protected) current user — used by AuthContext bootstrap
 *
 * The JWT payload contains the user's ID (`{ id: user._id }`) as required.
 * The token is signed with process.env.JWT_SECRET (dotenv) and expires after
 * JWT_EXPIRE (default 30d).
 * ---------------------------------------------------------------------------
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorMiddleware');
const { validate } = require('../middleware/validate');

/** Create a signed JWT whose payload carries the user id. */
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

/** Public shape of a user (never includes the password hash). */
const publicUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

// ---------------------------------------------------------------------------
// POST /api/users/register   (public)   body: { username, email, password }
// ---------------------------------------------------------------------------
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // 1) Friendly duplicate checks first (Mongo's 11000 error is the safety net).
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const field = existing.email === email ? 'email' : 'username';
    throw new AppError(`A user with this ${field} already exists`, 409);
  }

  // 2) Hash the password with bcrypt (10 salt rounds). Never store plain text.
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3) Persist
  const user = await User.create({
    username,
    email,
    password: hashedPassword, // already hashed -> User pre-save hook skips re-hashing
  });

  // 4) Return the JWT immediately so the SPA can log the user in right after sign-up.
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token: generateToken(user._id),
    user: publicUser(user),
  });
});

// ---------------------------------------------------------------------------
// POST /api/users/login      (public)   body: { email, password }
// ---------------------------------------------------------------------------
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // password has `select: false` in the schema -> must ask for it explicitly.
  const user = await User.findOne({ email }).select('+password');

  // Same generic message for "unknown email" and "wrong password" so an attacker
  // cannot enumerate registered accounts.
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token: generateToken(user._id),
    user: publicUser(user),
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/me          (protected)
// ---------------------------------------------------------------------------
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: publicUser(req.user) });
});

// Field rules reused by the router.
const registerRules = {
  username: { required: true, type: 'string', trim: true, minLength: 3, maxLength: 30 },
  email: { required: true, type: 'string', trim: true, type: 'email' },
  password: { required: true, type: 'string', minLength: 6 },
};
const loginRules = {
  email: { required: true, type: 'string', trim: true },
  password: { required: true, type: 'string' },
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  generateToken,
  validate,
  registerRules,
  loginRules,
};
