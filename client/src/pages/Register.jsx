/**
 * src/pages/Register.jsx  —  "/register"  (public)
 * ---------------------------------------------------------------------------
 * Controlled form -> AuthContext.register(username, email, password)
 *   -> POST /api/users/register (bcrypt hashing happens on the SERVER)
 *   -> the API returns a JWT, so the user is logged in immediately.
 *
 * Client-side rules mirror the schema: username >= 3, valid email,
 * password >= 6 (the spec's minlength) and confirm-password match.
 * ---------------------------------------------------------------------------
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { AuthField } from './Login.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) navigate('/admin', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => () => clearError(), [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (form.username.trim().length < 3) errs.username = 'Username must be at least 3 characters';
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const user = await register(form.username.trim(), form.email.trim(), form.password);
      toast.success(`Account created — welcome, ${user.username}!`);
      navigate('/admin', { replace: true });
    } catch {
      /* message shown via AuthContext.error */
    }
  };

  // Simple password strength meter (1–4).
  const strength = (() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 6) s += 1;
    if (p.length >= 10) s += 1;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s += 1;
    if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s += 1;
    return s;
  })();
  const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500'][strength];

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Create your account</h1>
          <p className="muted mt-1">Passwords are hashed with bcrypt on the server.</p>

          {error && <div className="alert-error mt-5">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            <AuthField
              id="username"
              label="Username"
              value={form.username}
              onChange={handleChange}
              error={fieldErrors.username}
              placeholder="alexchen"
              autoComplete="username"
            />
            <AuthField
              id="email"
              label="Email address"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={fieldErrors.email}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <div>
              <AuthField
                id="password"
                label="Password"
                type="password"
                value={form.password}
                onChange={handleChange}
                error={fieldErrors.password}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-1.5 flex-1 gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <span
                        key={n}
                        className={`h-full flex-1 rounded-full ${n <= strength ? strengthColor : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                  <span className="w-16 text-right text-[11px] font-semibold text-ink-300">
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>
            <AuthField
              id="confirm"
              label="Confirm password"
              type="password"
              value={form.confirm}
              onChange={handleChange}
              error={fieldErrors.confirm}
              placeholder="Repeat your password"
              autoComplete="new-password"
            />

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Already registered?{' '}
            <Link to="/login" className="link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
