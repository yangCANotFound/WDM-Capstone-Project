/**
 * src/pages/Projects.jsx  —  "/projects"  (public)
 * ---------------------------------------------------------------------------
 * Phase 7 "API Integration (Read)" requirement, implemented explicitly:
 *   useEffect   -> api.getProjects()  (GET /api/projects)
 *   useState    -> projects, loading, error, search
 *   conditional rendering -> Loading (skeleton) / Error (with retry) / Empty / Grid
 * ---------------------------------------------------------------------------
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import ProjectCard from '../components/ProjectCard.jsx';
import { CardGridSkeleton, EmptyState, ErrorMessage } from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Projects() {
  // ---- state ----
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const { isAuthenticated } = useAuth();

  // ---- data fetch: GET /api/projects ----
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.getProjects(controller.signal);
        if (active) setProjects(res.data ?? []);
      } catch (err) {
        if (err.name !== 'AbortError' && active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  // Client-side filter (the API returns the full list).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }, [projects, search]);

  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-brand-600">Portfolio</p>
          <h1 className="section-title mt-1">Projects</h1>
          <p className="muted mt-2 max-w-xl">
            Everything I have shipped, fetched from a live MongoDB Atlas database through{' '}
            <code className="font-mono text-xs">GET /api/projects</code>.
          </p>
        </div>

        {isAuthenticated && (
          <Link to="/admin" className="btn-secondary">
            Manage in Admin →
          </Link>
        )}
      </header>

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <label htmlFor="project-search" className="sr-only">
          Search projects
        </label>
        <input
          id="project-search"
          type="search"
          className="input"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ---------- Conditional rendering ---------- */}
      {loading && <CardGridSkeleton count={6} />}

      {!loading && error && <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title={projects.length === 0 ? 'No projects yet' : 'No matches'}
          description={
            projects.length === 0
              ? 'The admin has not published any projects yet. Log in and add one from the dashboard.'
              : `Nothing matched “${search}”. Try a different keyword.`
          }
          action={
            projects.length === 0 ? (
              <Link to="/admin" className="btn-primary mt-2">
                Open Admin Dashboard
              </Link>
            ) : (
              <button type="button" className="btn-secondary mt-2" onClick={() => setSearch('')}>
                Clear search
              </button>
            )
          }
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <p className="muted mb-4">
            Showing {filtered.length} of {projects.length} project{projects.length === 1 ? '' : 's'}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <ProjectCard key={p._id} project={p} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
