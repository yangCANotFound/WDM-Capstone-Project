/**
 * models/Comment.js
 * ---------------------------------------------------------------------------
 * Required schema (spec Phase 1):
 *   body   (String, required)
 *   author (ObjectId, ref 'User',     required)
 *   post   (ObjectId, ref 'BlogPost', required)
 *   timestamps (auto-generated)
 *
 * Relationships (two refs = the join table of the blog):
 *   Comment.author --> User._id
 *   Comment.post   --> BlogPost._id
 * ---------------------------------------------------------------------------
 */
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: [true, 'Comment body is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [1000, 'Comment must be at most 1000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A comment must have an author'],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogPost',
      required: [true, 'A comment must belong to a post'],
      index: true,
    },
  },
  { timestamps: true }
);

// Fast "all comments of one post, newest last" — the GET /api/blog/:postId/comments query.
commentSchema.index({ post: 1, createdAt: 1 });

commentSchema.set('toJSON', { virtuals: true, versionKey: false });

module.exports = mongoose.model('Comment', commentSchema);
