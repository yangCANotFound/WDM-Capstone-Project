/**
 * src/components/Header.jsx
 * ---------------------------------------------------------------------------
 * Phase 8/9 — the persistent, AUTH-AWARE navigation bar.
 *
 * Behaviour required by the spec:
 *   - not logged in : "Login" + "Register" links
 *   - logged in     : "Admin Dashboard" link + "Logout" button + the username
 *
 * It consumes the Auth Context directly (no prop drilling) and uses NavLink so
 * the active route is highlighted. Props:
 *   - (none required) it reads everything from useAuth()
 * ---------------------------------------------------------------------------
 */
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/projects', label: 'Projects' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
];

function NavItem({ to, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-slate-100'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false); // useState for UI state

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    closeMobile();
    toast.info('You have been logged out.');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        {/* ---- Brand ---- */}
        <Link to="/" className="flex items-center gap-2.5" onClick={closeMobile}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900 text-white">
            <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
              <path
                d="M20 42 L30 20 L38 34 L44 24 L48 42"
                fill="none"
                stroke="#598cff"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-base font-extrabold tracking-tight text-ink-900">
            Alex Chen<span className="text-brand-600">.</span>
          </span>
        </Link>

        {/* ---- Desktop nav ---- */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((l) => (
            <NavItem key={l.to} {...l} />
          ))}
        </nav>

        {/* ---- Desktop auth area (auth-aware) ---- */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold ${
                    isActive ? 'bg-ink-900 text-white' : 'bg-ink-900 text-white hover:bg-ink-700'
                  }`
                }
              >
                Admin Dashboard
              </NavLink>
              <span className="ml-1 hidden items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 lg:flex">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[11px] font-bold uppercase text-white">
                  {user?.username?.[0] || '?'}
                </span>
                <span className="text-xs font-semibold text-ink-700">{user?.username}</span>
              </span>
              <button type="button" onClick={handleLogout} className="btn-secondary btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </div>

        {/* ---- Mobile hamburger ---- */}
        <button
          type="button"
          className="btn-ghost md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ---- Mobile drawer ---- */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav className="container-page flex flex-col gap-1 py-3" aria-label="Mobile navigation">
            {NAV_LINKS.map((l) => (
              <NavItem key={l.to} {...l} onClick={closeMobile} />
            ))}

            <div className="mt-2 border-t border-slate-200 pt-3">
              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <p className="px-3 text-xs text-ink-500">
                    Logged in as <span className="font-semibold text-ink-800">{user?.username}</span>
                  </p>
                  <Link to="/admin" className="btn-primary" onClick={closeMobile}>
                    Admin Dashboard
                  </Link>
                  <button type="button" className="btn-secondary" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" className="btn-secondary" onClick={closeMobile}>
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary" onClick={closeMobile}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
