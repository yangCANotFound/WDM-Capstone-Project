/**
 * src/components/Header.jsx
 * ---------------------------------------------------------------------------
 * Persistent navigation bar in the Lab 19 style: solid slate-800 band,
 * bold site name on the left, underlined white links, theme toggle on the right.
 *
 * It stays AUTH-AWARE (Capstone requirement):
 *   - logged out -> "Login" + "Register"
 *   - logged in  -> "Admin Dashboard" + username + "Logout"
 *
 * Responsive: below `md` the links collapse into a hamburger drawer so the
 * site stays usable on a phone.
 * ---------------------------------------------------------------------------
 */
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { site } from '../data/site.js';
import ThemeToggle from './ThemeToggle.jsx';

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
        `px-2.5 py-1.5 text-sm font-medium text-white underline-offset-4 transition-colors ${
          isActive ? 'underline decoration-2' : 'hover:underline hover:decoration-1'
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    closeMobile();
    toast.info('You have been logged out.');
    navigate('/');
  };

  return (
    <header className="bg-slate-800 text-white">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" onClick={closeMobile} className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-700 text-sm font-extrabold text-white">
            {site.initials}
          </span>
          <span className="text-xl font-bold text-white">{site.fullName}</span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Main navigation" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <NavItem {...l} />
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop right side: theme + auth-aware controls */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <NavLink
                to="/admin"
                className="rounded-md border border-blue-400 bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
              >
                Admin Dashboard
              </NavLink>
              <span className="hidden text-xs text-slate-300 lg:inline">{user?.username}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-400 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-white underline-offset-4 hover:underline"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-md border border-blue-400 bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="rounded-md border border-slate-400 px-2.5 py-1.5 text-sm font-semibold text-white"
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-slate-600 bg-slate-800 md:hidden"
        >
          <ul className="container-page flex flex-col gap-1 py-3">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <NavItem {...l} onClick={closeMobile} />
              </li>
            ))}
            <li className="mt-2 border-t border-slate-600 pt-3">
              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-slate-300">
                    Logged in as <span className="font-semibold text-white">{user?.username}</span>
                  </p>
                  <Link
                    to="/admin"
                    onClick={closeMobile}
                    className="rounded-md bg-blue-700 px-3 py-2 text-center text-sm font-semibold text-white"
                  >
                    Admin Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-md border border-slate-400 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="flex-1 rounded-md border border-slate-400 px-3 py-2 text-center text-sm font-semibold text-white"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobile}
                    className="flex-1 rounded-md bg-blue-700 px-3 py-2 text-center text-sm font-semibold text-white"
                  >
                    Register
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
