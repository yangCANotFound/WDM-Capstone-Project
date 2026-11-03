/**
 * controllers/commentController.js
 * ---------------------------------------------------------------------------
 * Phase 4 — Comment endpoints (nested resource under a post).
 *   GET  /api/blog/:postId/comments  public     all comments of a post
 *   POST /api/blog/:postId/comments  protected  post = :postId, author = req.user
 *
 * Mounted in routes/blogRoutes.js with { mergeParams: true } so that
 * :postId from the parent router is available on req.params here.
 * ---------------------------------------------------------------------------
 */
const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const { AppError, asyncHandler } = require('../middleware/errorMiddleware');

// GET /api/blog/:postId/comments
const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  // 404 if the parent post does not exist (otherwise we'd return [] for a typo
  // or a deleted post and the UI could not tell the difference).
  const postExists = await BlogPost.exists({ _id: postId });
  if (!postExists) {
    throw new AppError(`Blog post not found with id ${postId}`, 404);
  }

  const comments = await Comment.find({ post: postId })
    .populate('author', 'username') // which user wrote it
    .sort({ createdAt: 1 }); // oldest first

  res.status(200).json({ success: true, count: comments.length, data: comments });
});

// POST /api/blog/:postId/comments   (protected)
const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await BlogPost.findById(postId);
  if (!post) {
    throw new AppError(`Blog post not found with id ${postId}`, 404);
  }

  const comment = await Comment.create({
    body: (req.body.body || '').trim(),
    author: req.user._id, // logged-in user
    post: post._id, // the post from the URL
  });

  const populated = await comment.populate('author', 'username');

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: populated,
  });
});

module.exports = { getComments, createComment };
