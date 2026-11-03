/**
 * models/Message.js
 * ---------------------------------------------------------------------------
 * Required schema (spec Phase 1):
 *   name    (String, required)
 *   email   (String, required)
 *   message (String, required)
 *   timestamps (auto-generated)
 *
 * Created by the PUBLIC endpoint POST /api/contact (no auth needed), so the
 * email field carries a format `match` and the body carries a max length.
 * ---------------------------------------------------------------------------
 */
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name must be at most 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [5, 'Message must be at least 5 characters'],
      maxlength: [2000, 'Message must be at most 2000 characters'],
    },
    // Optional bookkeeping for the very small admin inbox
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
