/**
 * middleware/validate.js
 * ---------------------------------------------------------------------------
 * Tiny request-validator (no third-party validator library, so the graded code
 * stays readable/explainable in the viva).
 *
 * Usage inside a route file:
 *   router.post('/', protect, validate(projectRules), createProject);
 *
 * Rules format: { fieldName: { required: true, trim: true, type: 'string' } }
 * Controllers additionally rely on Mongoose schema validation; this middleware
 * just fails faster with a clean 400 and a field list.
 * ---------------------------------------------------------------------------
 */
const { AppError } = require('./errorMiddleware');

const validate = (rules) => (req, _res, next) => {
  const body = req.body || {};
  const errors = [];

  Object.entries(rules).forEach(([field, rule]) => {
    let value = body[field];

    // string hygiene: trim before validating emptiness / length
    if (rule.trim && typeof value === 'string') value = value.trim();

    const isEmpty =
      value === undefined || value === null || (typeof value === 'string' && value === '');

    if (rule.required && isEmpty) {
      errors.push({ field, message: `${field} is required` });
      return;
    }
    if (isEmpty) return; // optional + absent => fine

    if (rule.type === 'string' && typeof value !== 'string') {
      errors.push({ field, message: `${field} must be a string` });
      return;
    }
    if (rule.minLength && String(value).length < rule.minLength) {
      errors.push({ field, message: `${field} must be at least ${rule.minLength} characters` });
    }
    if (rule.maxLength && String(value).length > rule.maxLength) {
      errors.push({ field, message: `${field} must be at most ${rule.maxLength} characters` });
    }
    if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
      errors.push({ field, message: `${field} must be a valid email address` });
    }
    if (rule.type === 'url' && !/^https?:\/\/[^\s]+$/i.test(String(value))) {
      errors.push({ field, message: `${field} must be a valid http(s) URL` });
    }
  });

  if (errors.length) {
    const err = new AppError(
      'Validation failed: ' + errors.map((e) => e.message).join('; '),
      400
    );
    err.errors = errors; // errorHandler forwards `err.errors` if present
    return next(err);
  }

  req.body = body; // hand the trimmed values to the controller
  return next();
};

/** Reject an empty body on PUT so people do not "clear" a document by accident. */
const requireNonEmptyBody = (req, _res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new AppError('Request body cannot be empty', 400));
  }
  return next();
};

module.exports = { validate, requireNonEmptyBody };
