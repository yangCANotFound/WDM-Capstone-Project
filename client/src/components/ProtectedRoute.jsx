/**
 * src/components/ProtectedRoute.jsx
 * ---------------------------------------------------------------------------
 * Phase 8 — the /admin guard.
 *
 *   - while the stored session is being verified (`booting`) -> full-screen loader
 *     (prevents a flash of /login when the user refreshes /admin)
 *   - not authenticated -> <Navigate to="/login"> with state.from = "/admin",
 *     so LoginPage can send the user back after a successful login
 *   - authenticated -> render children
 *
 * Props: { children }  — the element(s) to protect.
 * ---------------------------------------------------------------------------
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, booting } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <div className="grid min-h-[60vh] place-items-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3 text-ink-500">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
          <p className="text-sm">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // `replace` keeps the redirect out of the browser history stack.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Supports both <ProtectedRoute><Admin/></ProtectedRoute> and layout usage.
  return children ?? <Outlet />;
}
