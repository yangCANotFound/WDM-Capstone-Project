/**
 * controllers/projectController.js
 * ---------------------------------------------------------------------------
 * Phase 4 — Portfolio project endpoints (full CRUD).
 *   GET    /api/projects      public     list, newest first, populate owner
 *   GET    /api/projects/:id  public     single project
 *   POST   /api/projects      protected  req.user becomes project.user
 *   PUT    /api/projects/:id  protected  admin-only (all users are admin — see User.js)
 *   DELETE /api/projects/:id  protected  admin-only
 *
 * NB: the spec says "Project management is assumed to be admin-only". The
 * ownership field still records WHO created the project (`user: req.user._id`);
 * the admin gate lives in routes/projectRoutes.js via authorize('admin').
 * ---------------------------------------------------------------------------
 */
const Project = require('../models/Project');
const { AppError, asyncHandler } = require('../middleware/errorMiddleware');

// Whitelist of writable fields — prevents mass-assignment of `_id`, `user`, `createdAt`...
const PROJECT_FIELDS = ['title', 'description', 'imageUrl', 'repoUrl', 'liveUrl'];

/** Copy only the allowed keys that are actually present in the body. */
const pickProjectFields = (body = {}) =>
  PROJECT_FIELDS.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});

// GET /api/projects
const getProjects = asyncHandler(async (_req, res) => {
  const projects = await Project.find({})
    .populate('user', 'username email') // only these two fields of the owner
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects,
  });
});

// GET /api/projects/:id
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate('user', 'username email');

  // A malformed id throws CastError -> errorHandler -> 400. A valid but missing id -> 404.
  if (!project) {
    throw new AppError(`Project not found with id ${req.params.id}`, 404);
  }

  res.status(200).json({ success: true, data: project });
});

// POST /api/projects   (protected)
const createProject = asyncHandler(async (req, res) => {
  const project = await Project.create({
    ...pickProjectFields(req.body),
    user: req.user._id, // <-- association with the logged-in user (req.user from protect)
  });

  const populated = await project.populate('user', 'username email');

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: populated,
  });
});

// PUT /api/projects/:id   (protected)
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new AppError(`Project not found with id ${req.params.id}`, 404);
  }

  Object.assign(project, pickProjectFields(req.body));
  // save() (not findByIdAndUpdate) so Mongoose runs full schema validators.
  await project.save();

  const populated = await project.populate('user', 'username email');

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: populated,
  });
});

// DELETE /api/projects/:id   (protected)
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) {
    throw new AppError(`Project not found with id ${req.params.id}`, 404);
  }

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
    data: { _id: project._id },
  });
});

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
