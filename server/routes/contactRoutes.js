/**
 * routes/contactRoutes.js   —  mounted at /api/contact
 *
 *  POST  /api/contact              public   (the portfolio contact form)
 *  GET   /api/contact              protected  admin inbox (extra)
 *  PATCH /api/contact/:id/read     protected  (extra)
 */
const express = require('express');
const {
  createMessage,
  getMessages,
  markMessageRead,
} = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');

const router = express.Router();

const contactRules = {
  name: { required: true, type: 'string', trim: true, maxLength: 80 },
  email: { required: true, type: 'string', trim: true, type: 'email' },
  message: { required: true, type: 'string', trim: true, minLength: 5, maxLength: 2000 },
};

router
  .route('/')
  .get(protect, getMessages) // admin inbox
  .post(validate(contactRules), createMessage); // public

router.patch('/:id/read', protect, markMessageRead);

module.exports = router;
