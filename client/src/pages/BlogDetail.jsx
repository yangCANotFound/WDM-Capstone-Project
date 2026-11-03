/**
 * src/pages/BlogDetail.jsx  —  "/blog/:id"  (public route, auth-aware actions)
 * ---------------------------------------------------------------------------
 * Data:
 *   useEffect + useParams -> GET /api/blog/:id
 *   (the API response already includes author {username} and comments[] because
 *    the controller uses a nested virtual populate)
 * Actions:
 *   logged in  -> CommentForm posts to POST /api/blog/:postId/comments
 *                 and the new comment is appended to local state (no refetch)
 *   logged out -> prompt to log in
 *   author     -> Edit / Delete links to the Admin Dashboard
 * ---------------------------------------------------------------------------
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import CommentForm from '../components/CommentForm.jsx';
import CommentList from '../components/CommentList.jsx';
import { ErrorMessage, Loader } from '../components/Loader.jsx';

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // ---- fetch post (GET /api/blog/:id) ----
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    (async () => {
      setLoading(true);
      setError('');
      setPost(null);
      try {
        const res = await api.getPost(id, controller.signal);
        if (!active) return;
        setPost(res.data);
        // Comments arrive populated inside the post (author.username).
        setComments(res.data.comments ?? []);
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
  }, [id, reloadKey]);

  /** Called by CommentForm after a successful POST. */
  const handleCommentCreated = (created) => {
    setComments((prev) => [...prev, created]);
  };

  const handleDelete = async () => {
    // Confirmation + protected DELETE. Author-only rule is enforced server-side.
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this article permanently?')) return;
    try {
      await api.deletePost(id);
      navigate('/blog');
    } catch (err) {
      setError(err.message);
    }
  };

  // ---- conditional rendering ----
  if (loading) return <Loader label="Loading article…" />;

  if (error) {
    return (
      <div className="container-page py-16">
        <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        <Link to="/blog" className="link mt-6 inline-block text-sm">
          ← Back to all articles
        </Link>
      </div>
    );
  }

  if (!post) return null;

  const isAuthor = Boolean(user?._id && (post.author?._id === user._id || post.author === user._id));

  return (
    <article className="container-page max-w-3xl py-12 md:py-16">
      <Link to="/blog" className="muted inline-flex items-center gap-1 hover:text-brand-600">
        ← All articles
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-300">
          <span className="badge">{post.author?.username || 'Author'}</span>
          <span>{formatDate(post.createdAt)}</span>
          {post.updatedAt && post.updatedAt !== post.createdAt && <span>· updated</span>}
        </div>

        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-4xl">
          {post.title}
        </h1>

        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <li key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-ink-500">
                #{t}
              </li>
            ))}
          </ul>
        )}

        {/* Author-only management shortcuts */}
        {isAuthor && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/admin#blog" className="btn-secondary btn-sm">
              Edit in Admin
            </Link>
            <button type="button" className="btn-danger btn-sm" onClick={handleDelete}>
              Delete post
            </button>
          </div>
        )}
      </header>

      {/* Body: preserve author line breaks */}
      <div className="prose-p mt-8 space-y-5 text-[15.5px] leading-8 text-ink-700">
        {post.content.split(/\n{2,}/).map((para, i) => (
          <p key={i} className="whitespace-pre-line">
            {para}
          </p>
        ))}
      </div>

      {/* ---- Comments ---- */}
      <section className="mt-14 border-t border-slate-200 pt-10">
        <h2 className="text-xl font-bold text-ink-900">
          Comments <span className="ml-1 text-sm font-semibold text-ink-300">({comments.length})</span>
        </h2>

        <div className="mt-6 space-y-6">
          {isAuthenticated ? (
            <CommentForm postId={post._id} onCreated={handleCommentCreated} />
          ) : (
            <div className="alert-info flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">Log in to join the discussion.</p>
              <div className="flex gap-2">
                <Link to="/login" state={{ from: `/blog/${post._id}` }} className="btn-primary btn-sm">
                  Log in
                </Link>
                <Link to="/register" className="btn-secondary btn-sm">
                  Create account
                </Link>
              </div>
            </div>
          )}

          <CommentList comments={comments} />
        </div>
      </section>
    </article>
  );
}
