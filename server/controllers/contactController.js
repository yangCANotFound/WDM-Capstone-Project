/**
 * controllers/contactController.js
 * ---------------------------------------------------------------------------
 * Phase 4 — Portfolio contact form (PUBLIC endpoint).
 *   POST /api/contact        public   save a Message document
 *   GET  /api/contact        protected (admin inbox — extra, for the viva demo)
 *   PATCH /api/contact/:id/read  protected  mark a message as read (extra)
 *
 * The POST status code is 201 Created; the response echoes only a safe summary,
 * never the stored document, so spam scripts learn nothing.
 * ---------------------------------------------------------------------------
 */
const Message = require('../models/Message');
const { AppError, asyncHandler } = require('../middleware/errorMiddleware');

// POST /api/contact   (public)
const createMessage = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  const saved = await Message.create({ name, email, message });

  res.status(201).json({
    success: true,
    message: 'Thank you! Your message has been received.',
    data: { id: saved._id, createdAt: saved.createdAt },
  });
});

// GET /api/contact   (protected — admin inbox)
const getMessages = asyncHandler(async (_req, res) => {
  const messages = await Message.find({}).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: messages.length, data: messages });
});

// PATCH /api/contact/:id/read   (protected)
const markMessageRead = asyncHandler(async (req, res) => {
  const updated = await Message.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true, runValidators: true }
  );
  if (!updated) {
    throw new AppError(`Message not found with id ${req.params.id}`, 404);
  }
  res.status(200).json({ success: true, data: updated });
});

module.exports = { createMessage, getMessages, markMessageRead };
