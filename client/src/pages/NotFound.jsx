/**
 * src/pages/NotFound.jsx  —  "*" fallback route
 * Renders for any URL that React Router does not know (inside the SPA).
 * ---------------------------------------------------------------------------
 */
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
      <div>
        <p className="font-mono text-6xl font-extrabold text-brand-200">404</p>
        <h1 className="mt-4 text-2xl font-bold text-ink-900">This page does not exist</h1>
        <p className="muted mt-2">
          The link may be broken, or the page may have been moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="btn-primary">
            Back home
          </Link>
          <Link to="/blog" className="btn-secondary">
            Read the blog
          </Link>
        </div>
      </div>
    </div>
  );
}
