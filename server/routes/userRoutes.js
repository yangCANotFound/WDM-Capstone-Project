/**
 * routes/userRoutes.js   —  mounted at /api/users
 *
 *  POST /api/users/register   public
 *  POST /api/users/login      public
 *  GET  /api/users/me         protected
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  registerUser,
  loginUser,
  getMe,
  validate,
  registerRules,
  loginRules,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Brute-force protection on the two credential endpoints only.
// (Render's shared proxy IPs need trust proxy, which app.js sets.)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // 30 attempts / IP / 10 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 10 minutes.',
  },
});

router.post('/register', authLimiter, validate(registerRules), registerUser);
router.post('/login', authLimiter, validate(loginRules), loginUser);
router.get('/me', protect, getMe);

module.exports = router;
