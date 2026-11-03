/**
 * src/pages/Blog.jsx  —  "/blog"  (public)
 * ---------------------------------------------------------------------------
 * useEffect -> GET /api/blog ; useState -> posts / loading / error / tag filter.
 * The first post is rendered as a "featured" card (prop featured=true).
 * ---------------------------------------------------------------------------
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import BlogPostCard from '../components/BlogPostCard.jsx';
import { EmptyState, ErrorMessage, Loader } from '../components/Loader.jsx';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.getPosts(controller.signal);
        if (active) setPosts(res.data ?? []);
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

  // Unique tags across all posts for the filter bar.
  const allTags = useMemo(() => {
    const set = new Set();
    posts.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return [...set].sort();
  }, [posts]);

  const visible = useMemo(
    () => (activeTag ? posts.filter((p) => (p.tags || []).includes(activeTag)) : posts),
    [posts, activeTag]
  );

  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-600">Writing</p>
        <h1 className="section-title mt-1">The Blog</h1>
        <p className="muted mt-2 max-w-xl">
          Notes on building full-stack applications, from MongoDB schema design to React state.
        </p>
      </header>

      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTag('')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTag === '' ? 'bg-ink-900 text-white' : 'bg-slate-100 text-ink-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTag(t === activeTag ? '' : t)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTag === t ? 'bg-ink-900 text-white' : 'bg-slate-100 text-ink-700 hover:bg-slate-200'
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* ---------- Conditional rendering ---------- */}
      {loading && <Loader label="Loading articles…" />}

      {!loading && error && <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

      {!loading && !error && visible.length === 0 && (
        <EmptyState
          title="No articles yet"
          description="Once a post is created in the Admin Dashboard it appears here instantly."
          action={
            <Link to="/admin" className="btn-primary mt-2">
              Write the first post
            </Link>
          }
        />
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {visible.map((p, i) => (
            <BlogPostCard key={p._id} post={p} featured={i === 0 && !activeTag} />
          ))}
        </div>
      )}
    </div>
  );
}
