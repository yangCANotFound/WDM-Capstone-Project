/**
 * routes/projectRoutes.js   —  mounted at /api/projects
 *
 *  GET    /api/projects        public
 *  GET    /api/projects/:id    public
 *  POST   /api/projects        protected (+ admin-only assumption)
 *  PUT    /api/projects/:id    protected (+ admin-only assumption)
 *  DELETE /api/projects/:id    protected (+ admin-only assumption)
 */
const express = require('express');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, requireNonEmptyBody } = require('../middleware/validate');

const router = express.Router();

// Field rules shared by POST and PUT.
const projectRules = {
  title: { required: true, type: 'string', trim: true, maxLength: 120 },
  description: { required: true, type: 'string', trim: true, maxLength: 2000 },
  imageUrl: { type: 'string', trim: true }, // optional
  repoUrl: { type: 'string', trim: true }, // optional
  liveUrl: { type: 'string', trim: true }, // optional
};
// On PUT only supplied fields are checked; make the two required ones optional.
const projectUpdateRules = {
  ...projectRules,
  title: { ...projectRules.title, required: false },
  description: { ...projectRules.description, required: false },
};

router
  .route('/')
  .get(getProjects)
  .post(protect, authorize('admin'), validate(projectRules), createProject);

router
  .route('/:id')
  .get(getProjectById)
  .put(protect, authorize('admin'), requireNonEmptyBody, validate(projectUpdateRules), updateProject)
  .delete(protect, authorize('admin'), deleteProject);

module.exports = router;
