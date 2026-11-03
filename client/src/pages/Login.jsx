/**
 * src/pages/Login.jsx  —  "/login"  (public)
 * ---------------------------------------------------------------------------
 * Controlled form -> AuthContext.login(email, password)
 *   -> POST /api/users/login -> stores { token, user } in Context + localStorage
 *
 * After success it redirects to:
 *   - location.state.from (set by ProtectedRoute when /admin was blocked), or
 *   - "/admin" (the natural landing page for a logged-in admin).
 * ---------------------------------------------------------------------------
 */
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/** Small presentational field so the two auth pages stay consistent. */
export function AuthField({ id, label, type = 'text', value, onChange, error, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        className="input"
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export default function Login() {
  const { login, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const redirectTo = location.state?.from || '/admin';

  // Already logged in? Skip the form.
  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  // Leaving the page clears any stale error from the context.
  useEffect(() => () => clearError(), [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.username}!`);
      navigate(redirectTo, { replace: true });
    } catch {
      /* the message is shown from AuthContext.error */
    }
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Welcome back</h1>
          <p className="muted mt-1">Log in to manage your projects and blog.</p>

          {location.state?.from && (
            <div className="alert-info mt-5 text-xs">
              Please log in to access <span className="font-mono">{location.state.from}</span>.
            </div>
          )}
          {error && <div className="alert-error mt-5">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            <AuthField
              id="email"
              label="Email address"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={fieldErrors.email}
              placeholder="admin@portfolio.dev"
              autoComplete="email"
            />
            <AuthField
              id="password"
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={fieldErrors.password}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Don’t have an account?{' '}
            <Link to="/register" className="link">
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-ink-300">
          Demo: use the admin account you created with <code className="font-mono">npm run seed</code>.
        </p>
      </div>
    </div>
  );
}
