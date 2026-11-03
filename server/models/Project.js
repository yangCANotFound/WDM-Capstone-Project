/**
 * models/Project.js
 * ---------------------------------------------------------------------------
 * Required schema (spec Phase 1):
 *   title       (String, required)
 *   description (String, required)
 *   imageUrl    (String, optional)
 *   repoUrl     (String, optional)
 *   liveUrl     (String, optional)
 *   user        (ObjectId, ref 'User', required)
 *
 * Relationship: Project.user --(ref)--> User._id  (owner of the project)
 * ---------------------------------------------------------------------------
 */
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
      // Optional: an empty string means "no image", so no `required` here.
    },
    repoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    liveUrl: {
      type: String,
      trim: true,
      default: '',
    },
    // The owner. Cast to ObjectId and validated by `ref` when populate() runs.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A project must belong to a user'],
      index: true,
    },
  },
  { timestamps: true }
);

// Newest first on the public gallery — matches the GET /api/projects sort.
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
