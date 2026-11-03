/**
 * routes/blogRoutes.js   —  mounted at /api/blog
 *
 *  GET    /api/blog                    public
 *  GET    /api/blog/:id                public  (author + comments populated)
 *  POST   /api/blog                    protected
 *  PUT    /api/blog/:id                protected + author only  (checked in controller)
 *  DELETE /api/blog/:id                protected + author only  (checked in controller)
 *  GET    /api/blog/:postId/comments   public
 *  POST   /api/blog/:postId/comments   protected
 *
 * Ordering note: '/:postId/comments' is a two-segment path so it can never be
 * swallowed by '/:id'. It is mounted BEFORE the '/:id' chain purely for clarity.
 */
const express = require('express');
const {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} = require('../controllers/blogController');
const { getComments, createComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { validate, requireNonEmptyBody } = require('../middleware/validate');

const router = express.Router();

// Field rules
const postRules = {
  title: { required: true, type: 'string', trim: true, maxLength: 150 },
  content: { required: true, type: 'string', trim: true },
};
const postUpdateRules = {
  title: { ...postRules.title, required: false },
  content: { ...postRules.content, required: false },
};
const commentRules = {
  body: { required: true, type: 'string', trim: true, minLength: 1, maxLength: 1000 },
};

// ---- Nested comment routes -------------------------------------------------
// mergeParams:true is required so :postId from this router reaches the handlers.
router
  .route('/:postId/comments')
  .get(getComments)
  .post(protect, validate(commentRules), createComment);

// ---- Post routes -----------------------------------------------------------
router.route('/').get(getPosts).post(protect, validate(postRules), createPost);

router
  .route('/:id')
  .get(getPostById)
  .put(protect, requireNonEmptyBody, validate(postUpdateRules), updatePost)
  .delete(protect, deletePost);

module.exports = router;
