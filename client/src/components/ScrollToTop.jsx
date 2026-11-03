/**
 * src/components/ScrollToTop.jsx
 * ---------------------------------------------------------------------------
 * React Router does not reset scroll on navigation in an SPA. This tiny
 * component fixes that (UX polish) — mounted once inside App.
 * ---------------------------------------------------------------------------
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);

  return null;
}
