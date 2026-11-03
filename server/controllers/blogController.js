/**
 * controllers/blogController.js
 * ---------------------------------------------------------------------------
 * Phase 4 — Blog endpoints + Phase 3 author authorization.
 *
 *   GET    /api/blog        public     all posts, populate author username
 *   GET    /api/blog/:id    public     one post, populate author + its comments
 *   POST   /api/blog        protected  author = req.user._id
 *   PUT    /api/blog/:id    protected AND authorized (author only)
 *   DELETE /api/blog/:id    protected AND authorized (author only)
 *
 * populate() cheat-sheet (explained in detail in the viva):
 *   .populate('author', 'username')              -> 2nd arg = projection (field pick)
 *   .populate({ path: 'author', select: 'username email' })
 *   .populate({                                    <- nested / virtual populate
 *      path: 'comments',
 *      populate: { path: 'author', select: 'username' },
 *   })
 * ---------------------------------------------------------------------------
 */
const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const { AppError, asyncHandler } = require('../middleware/errorMiddleware');

// The exact field projection the spec asks for on lists: "author's username".
const AUTHOR_FIELDS = 'username';

/** Writable fields for a post (author/id/timestamps are never client-controlled). */
const pickPostFields = (body = {}) =>
  ['title', 'content', 'excerpt', 'tags'].reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});

// GET /api/blog
const getPosts = asyncHandler(async (_req, res) => {
  const posts = await BlogPost.find({})
    .populate('author', AUTHOR_FIELDS) // <-- "populated with the author's username"
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: posts.length, data: posts });
});

// GET /api/blog/:id
const getPostById = asyncHandler(async (req, res) => {
  const post = await BlogPost.findById(req.params.id)
    .populate('author', AUTHOR_FIELDS)
    // Virtual populate: every Comment whose `post` equals this post's _id,
    // and each comment's author reduced to its username.
    .populate({
      path: 'comments',
      select: 'body author createdAt',
      options: { sort: { createdAt: 1 } }, // oldest first = natural reading order
      populate: { path: 'author', select: AUTHOR_FIELDS },
    });

  if (!post) {
    throw new AppError(`Blog post not found with id ${req.params.id}`, 404);
  }

  res.status(200).json({ success: true, data: post });
});

// POST /api/blog   (protected)
const createPost = asyncHandler(async (req, res) => {
  const post = await BlogPost.create({
    ...pickPostFields(req.body),
    author: req.user._id, // <-- association with req.user
  });

  const populated = await post.populate('author', AUTHOR_FIELDS);

  res.status(201).json({
    success: true,
    message: 'Blog post created successfully',
    data: populated,
  });
});

// PUT /api/blog/:id   (protected + author only)
const updatePost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post) {
    throw new AppError(`Blog post not found with id ${req.params.id}`, 404);
  }

  // ---- AUTHORUTHORIZATION: only the original author may edit ----
  // post.author is an ObjectId; req.user._id too. Use .equals() (or .toString()),
  // NOT ===  (two different ObjectId instances are never reference-equal).
  if (!post.author.equals(req.user._id)) {
    throw new AppError('Not authorized: only the author can update this post', 403);
  }

  Object.assign(post, pickPostFields(req.body));
  await post.save(); // runs schema validation (required title/content ...)

  const populated = await post.populate('author', AUTHOR_FIELDS);

  res.status(200).json({
    success: true,
    message: 'Blog post updated successfully',
    data: populated,
  });
});

// DELETE /api/blog/:id   (protected + author only)
const deletePost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post) {
    throw new AppError(`Blog post not found with id ${req.params.id}`, 404);
  }

  if (!post.author.equals(req.user._id)) {
    throw new AppError('Not authorized: only the author can delete this post', 403);
  }

  await post.deleteOne();

  // Cascading clean-up: comments of a deleted post must not be orphaned.
  await Comment.deleteMany({ post: post._id });

  res.status(200).json({
    success: true,
    message: 'Blog post and its comments deleted successfully',
    data: { _id: post._id },
  });
});

module.exports = { getPosts, getPostById, createPost, updatePost, deletePost };
