/**
 * src/pages/AdminDashboard.jsx  —  "/admin"  (PROTECTED route)
 * ---------------------------------------------------------------------------
 * Render only happens when ProtectedRoute confirms authentication, but every
 * request below still goes through `api.*` which attaches
 * `Authorization: Bearer <token>` via the fetch wrapper in src/api/client.js —
 * so POST / PUT / DELETE are all authenticated calls.
 *
 * Features
 *   - KPI cards (projects, posts, comments, unread messages)
 *   - Tabbed management: Projects | Blog Posts | Messages
 *   - Projects: Create (POST /api/projects), Update (PUT /api/projects/:id),
 *               Delete (DELETE /api/projects/:id)  — forms in a Modal
 *   - Posts:    Create (POST /api/blog),     Update (PUT /api/blog/:id),
 *               Delete (DELETE /api/blog/:id)
 *   - Messages: read inbox (GET /api/contact, extra endpoint)
 *   - Every mutation re-syncs the list from the API so the UI never lies.
 * ---------------------------------------------------------------------------
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { EmptyState, ErrorMessage, Loader } from '../components/Loader.jsx';

/* =========================================================================
   Form building blocks (controlled inputs driven by props)
   ========================================================================= */
function Field({ id, label, value, onChange, error, hint, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {rest.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        id={id}
        name={id}
        className="input"
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {hint && !error && <p className="mt-1 text-xs text-ink-300">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function TextAreaField({ id, label, value, onChange, error, hint, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {rest.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        name={id}
        className="textarea"
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {hint && !error && <p className="mt-1 text-xs text-ink-300">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

/* Initial shapes --------------------------------------------------------- */
const EMPTY_PROJECT = { title: '', description: '', imageUrl: '', repoUrl: '', liveUrl: '' };
const EMPTY_POST = { title: '', content: '', tags: '' };

const URL_RE = /^https?:\/\/[^\s]+$/i;

/* =========================================================================
   Main component
   ========================================================================= */
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();

  // ---- data state ----
  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ---- UI state ----
  const [tab, setTab] = useState(location.hash === '#blog' ? 'blog' : 'projects');
  const [reloadKey, setReloadKey] = useState(0);

  // ---- project editor state ----
  const [projectModal, setProjectModal] = useState({ open: false, mode: 'create', id: null });
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT);
  const [projectErrors, setProjectErrors] = useState({});
  const [savingProject, setSavingProject] = useState(false);

  // ---- post editor state ----
  const [postModal, setPostModal] = useState({ open: false, mode: 'create', id: null });
  const [postForm, setPostForm] = useState(EMPTY_POST);
  const [postErrors, setPostErrors] = useState({});
  const [savingPost, setSavingPost] = useState(false);

  // ---- delete confirmation state ----
  const [confirm, setConfirm] = useState({ open: false, kind: null, id: null, label: '', deleting: false });

  /* -----------------------------------------------------------------------
     Load everything in parallel (Promise.all) with per-section error handling.
     ----------------------------------------------------------------------- */
  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setError('');
      try {
        // GET /api/projects and GET /api/blog are public; GET /api/contact needs
        // the JWT (it is the admin inbox). allSettled keeps the page usable if
        // the inbox endpoint is unavailable.
        const [pRes, bRes, mRes] = await Promise.allSettled([
          api.getProjects(),
          api.getPosts(),
          api.getMessages(),
        ]);

        if (!active) return;

        if (pRes.status === 'rejected') throw pRes.reason;
        if (bRes.status === 'rejected') throw bRes.reason;

        setProjects(pRes.value.data ?? []);
        setPosts(bRes.value.data ?? []);
        setMessages(mRes.status === 'fulfilled' ? mRes.value.data ?? [] : []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  /* =======================================================================
     PROJECT handlers — POST / PUT / DELETE /api/projects
     ======================================================================= */
  const openCreateProject = () => {
    setProjectForm(EMPTY_PROJECT);
    setProjectErrors({});
    setProjectModal({ open: true, mode: 'create', id: null });
  };

  const openEditProject = (project) => {
    setProjectForm({
      title: project.title ?? '',
      description: project.description ?? '',
      imageUrl: project.imageUrl ?? '',
      repoUrl: project.repoUrl ?? '',
      liveUrl: project.liveUrl ?? '',
    });
    setProjectErrors({});
    setProjectModal({ open: true, mode: 'edit', id: project._id });
  };

  const closeProjectModal = () => setProjectModal((m) => ({ ...m, open: false }));

  const validateProject = () => {
    const errs = {};
    if (!projectForm.title.trim()) errs.title = 'Title is required';
    if (!projectForm.description.trim()) errs.description = 'Description is required';
    ['imageUrl', 'repoUrl', 'liveUrl'].forEach((key) => {
      const v = projectForm[key].trim();
      if (v && !URL_RE.test(v)) errs[key] = 'Must start with http:// or https://';
    });
    setProjectErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitProject = async (e) => {
    e.preventDefault();
    if (!validateProject()) return;

    const payload = {
      title: projectForm.title.trim(),
      description: projectForm.description.trim(),
      imageUrl: projectForm.imageUrl.trim(),
      repoUrl: projectForm.repoUrl.trim(),
      liveUrl: projectForm.liveUrl.trim(),
    };

    setSavingProject(true);
    try {
      if (projectModal.mode === 'create') {
        // POST /api/projects  (Authorization: Bearer <token>)
        await api.createProject(payload);
        toast.success('Project created.');
      } else {
        // PUT /api/projects/:id  (Authorization: Bearer <token>)
        await api.updateProject(projectModal.id, payload);
        toast.success('Project updated.');
      }
      closeProjectModal();
      refresh();
    } catch (err) {
      setProjectErrors({ _form: err.message });
      toast.error(err.message);
    } finally {
      setSavingProject(false);
    }
  };

  /* =======================================================================
     POST handlers — POST / PUT / DELETE /api/blog
     ======================================================================= */
  const openCreatePost = () => {
    setPostForm(EMPTY_POST);
    setPostErrors({});
    setPostModal({ open: true, mode: 'create', id: null });
  };

  const openEditPost = (post) => {
    setPostForm({
      title: post.title ?? '',
      content: post.content ?? '',
      tags: (post.tags || []).join(', '),
    });
    setPostErrors({});
    setPostModal({ open: true, mode: 'edit', id: post._id });
  };

  const closePostModal = () => setPostModal((m) => ({ ...m, open: false }));

  const validatePost = () => {
    const errs = {};
    if (!postForm.title.trim()) errs.title = 'Title is required';
    if (!postForm.content.trim()) errs.content = 'Content is required';
    setPostErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitPost = async (e) => {
    e.preventDefault();
    if (!validatePost()) return;

    const payload = {
      title: postForm.title.trim(),
      content: postForm.content.trim(),
      tags: postForm.tags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean),
    };

    setSavingPost(true);
    try {
      if (postModal.mode === 'create') {
        // POST /api/blog — the server sets author = req.user._id
        await api.createPost(payload);
        toast.success('Blog post created.');
      } else {
        // PUT /api/blog/:id — the server enforces "author only" (403 otherwise)
        await api.updatePost(postModal.id, payload);
        toast.success('Blog post updated.');
      }
      closePostModal();
      refresh();
    } catch (err) {
      setPostErrors({ _form: err.message });
      toast.error(err.message);
    } finally {
      setSavingPost(false);
    }
  };

  /* =======================================================================
     DELETE handler (shared by projects and posts)
     ======================================================================= */
  const askDelete = (kind, id, label) =>
    setConfirm({ open: true, kind, id, label, deleting: false });

  const runDelete = async () => {
    setConfirm((c) => ({ ...c, deleting: true }));
    try {
      if (confirm.kind === 'project') {
        await api.deleteProject(confirm.id); // DELETE /api/projects/:id
        toast.success('Project deleted.');
      } else {
        await api.deletePost(confirm.id); // DELETE /api/blog/:id
        toast.success('Blog post deleted.');
      }
      setConfirm({ open: false, kind: null, id: null, label: '', deleting: false });
      refresh();
    } catch (err) {
      toast.error(err.message);
      setConfirm((c) => ({ ...c, deleting: false }));
    }
  };

  /* =======================================================================
     Derived values for the KPI cards
     ======================================================================= */
  const stats = useMemo(
    () => [
      { label: 'Projects', value: projects.length, to: '/projects' },
      { label: 'Blog posts', value: posts.length, to: '/blog' },
      {
        label: 'Comments',
        value: posts.reduce((sum, p) => sum + (p.commentCount ?? 0), 0),
        to: null,
        hint: 'per-post count on detail pages',
      },
      { label: 'Messages', value: messages.length, to: null },
    ],
    [projects, posts, messages]
  );

  /* =======================================================================
     Render
     ======================================================================= */
  return (
    <div className="container-page py-10 md:py-14">
      {/* ---------------- Header ---------------- */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-brand-600">Admin</p>
          <h1 className="section-title mt-1">Dashboard</h1>
          <p className="muted mt-2">
            Signed in as <span className="font-semibold text-ink-700">{user?.username}</span>{' '}
            <span className="font-mono text-xs">({user?.email})</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/" className="btn-secondary btn-sm">
            View site
          </Link>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => {
              logout();
              toast.info('Logged out.');
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ---------------- KPI cards ---------------- */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-300">{s.label}</p>
            {/* While loading, show a skeleton instead of a misleading 0 */}
            {loading ? (
              <div className="mt-2 h-9 w-12 skeleton" aria-hidden="true" />
            ) : (
              <p className="mt-2 text-3xl font-extrabold text-ink-900">{s.value}</p>
            )}
            {s.to && (
              <Link to={s.to} className="mt-1 inline-block text-xs font-semibold text-brand-600 hover:underline">
                View public page →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* ---------------- Tabs ---------------- */}
      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1">
        {[
          { key: 'projects', label: `Projects (${projects.length})` },
          { key: 'blog', label: `Blog Posts (${posts.length})` },
          { key: 'messages', label: `Messages (${messages.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <Loader label="Loading dashboard data…" />}
      {!loading && error && <ErrorMessage message={error} onRetry={refresh} />}

      {/* ================= PROJECTS TAB ================= */}
      {!loading && !error && tab === 'projects' && (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink-900">Manage projects</h2>
            <button type="button" className="btn-primary" onClick={openCreateProject}>
              + New project
            </button>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Create your first portfolio project — it appears on /projects immediately."
              action={
                <button type="button" className="btn-primary mt-2" onClick={openCreateProject}>
                  Create project
                </button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {projects.map((p) => (
                <li key={p._id} className="card flex flex-wrap items-center gap-4 p-4">
                  <img
                    src={p.imageUrl || 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2280%22%3E%3Crect width=%22120%22 height=%2280%22 fill=%22%23e2e8f0%22/%3E%3C/svg%3E'}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.style.visibility = 'hidden';
                    }}
                  />
                  <div className="min-w-[12rem] flex-1">
                    <p className="font-semibold text-ink-900">{p.title}</p>
                    <p className="line-clamp-1 text-xs text-ink-500">{p.description}</p>
                    <p className="mt-1 text-[11px] text-ink-300">
                      {new Date(p.createdAt).toLocaleString()} · by {p.user?.username || 'unknown'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary btn-sm" onClick={() => openEditProject(p)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      onClick={() => askDelete('project', p._id, p.title)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ================= BLOG TAB ================= */}
      {!loading && !error && tab === 'blog' && (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink-900">Manage blog posts</h2>
            <button type="button" className="btn-primary" onClick={openCreatePost}>
              + New post
            </button>
          </div>

          {posts.length === 0 ? (
            <EmptyState
              title="No blog posts yet"
              description="Write your first article. It will be published to /blog right away."
              action={
                <button type="button" className="btn-primary mt-2" onClick={openCreatePost}>
                  Write a post
                </button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {posts.map((p) => (
                <li key={p._id} className="card flex flex-wrap items-center gap-4 p-4">
                  <div className="min-w-[12rem] flex-1">
                    <Link to={`/blog/${p._id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                      {p.title}
                    </Link>
                    <p className="line-clamp-1 text-xs text-ink-500">{p.content}</p>
                    <p className="mt-1 text-[11px] text-ink-300">
                      {new Date(p.createdAt).toLocaleString()} · by {p.author?.username || 'unknown'}
                      {p.tags?.length ? ` · #${p.tags.join(' #')}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary btn-sm" onClick={() => openEditPost(p)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      onClick={() => askDelete('post', p._id, p.title)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ================= MESSAGES TAB ================= */}
      {!loading && !error && tab === 'messages' && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-ink-900">Contact inbox</h2>
          <p className="muted mb-4">
            Messages submitted through the public form — read from{' '}
            <code className="font-mono text-xs">GET /api/contact</code>.
          </p>
          {messages.length === 0 ? (
            <EmptyState
              title="Inbox is empty"
              description="Submit the contact form on /contact to see a message appear here."
              action={
                <Link to="/contact" className="btn-secondary mt-2">
                  Open contact form
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li key={m._id} className="card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink-900">
                      {m.name} <span className="font-normal text-ink-500">&lt;{m.email}&gt;</span>
                    </p>
                    <span className="text-[11px] text-ink-300">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-ink-700">{m.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ================= PROJECT MODAL ================= */}
      <Modal
        open={projectModal.open}
        title={projectModal.mode === 'create' ? 'Create project' : 'Edit project'}
        onClose={closeProjectModal}
      >
        <form onSubmit={submitProject} noValidate className="space-y-4">
          {projectErrors._form && <div className="alert-error">{projectErrors._form}</div>}

          <Field
            id="title"
            label="Title"
            required
            maxLength={120}
            value={projectForm.title}
            error={projectErrors.title}
            onChange={(e) => {
              setProjectForm((f) => ({ ...f, title: e.target.value }));
              setProjectErrors((er) => ({ ...er, title: '' }));
            }}
          />
          <TextAreaField
            id="description"
            label="Description"
            required
            rows={4}
            maxLength={2000}
            value={projectForm.description}
            error={projectErrors.description}
            onChange={(e) => {
              setProjectForm((f) => ({ ...f, description: e.target.value }));
              setProjectErrors((er) => ({ ...er, description: '' }));
            }}
          />
          <Field
            id="imageUrl"
            label="Image URL"
            placeholder="https://…/screenshot.png"
            value={projectForm.imageUrl}
            error={projectErrors.imageUrl}
            hint="Optional. Leave empty to use the built-in placeholder."
            onChange={(e) => {
              setProjectForm((f) => ({ ...f, imageUrl: e.target.value }));
              setProjectErrors((er) => ({ ...er, imageUrl: '' }));
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="repoUrl"
              label="Repository URL"
              placeholder="https://github.com/…"
              value={projectForm.repoUrl}
              error={projectErrors.repoUrl}
              onChange={(e) => {
                setProjectForm((f) => ({ ...f, repoUrl: e.target.value }));
                setProjectErrors((er) => ({ ...er, repoUrl: '' }));
              }}
            />
            <Field
              id="liveUrl"
              label="Live URL"
              placeholder="https://…"
              value={projectForm.liveUrl}
              error={projectErrors.liveUrl}
              onChange={(e) => {
                setProjectForm((f) => ({ ...f, liveUrl: e.target.value }));
                setProjectErrors((er) => ({ ...er, liveUrl: '' }));
              }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={closeProjectModal} disabled={savingProject}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={savingProject}>
              {savingProject ? 'Saving…' : projectModal.mode === 'create' ? 'Create project' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= POST MODAL ================= */}
      <Modal
        open={postModal.open}
        title={postModal.mode === 'create' ? 'Create blog post' : 'Edit blog post'}
        onClose={closePostModal}
      >
        <form onSubmit={submitPost} noValidate className="space-y-4">
          {postErrors._form && <div className="alert-error">{postErrors._form}</div>}

          <Field
            id="title"
            label="Title"
            required
            maxLength={150}
            value={postForm.title}
            error={postErrors.title}
            onChange={(e) => {
              setPostForm((f) => ({ ...f, title: e.target.value }));
              setPostErrors((er) => ({ ...er, title: '' }));
            }}
          />
          <TextAreaField
            id="content"
            label="Content"
            required
            rows={10}
            value={postForm.content}
            error={postErrors.content}
            hint="Separate paragraphs with a blank line."
            onChange={(e) => {
              setPostForm((f) => ({ ...f, content: e.target.value }));
              setPostErrors((er) => ({ ...er, content: '' }));
            }}
          />
          <Field
            id="tags"
            label="Tags"
            placeholder="react, node, mongodb"
            value={postForm.tags}
            error={postErrors.tags}
            hint="Comma separated, optional."
            onChange={(e) => setPostForm((f) => ({ ...f, tags: e.target.value }))}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={closePostModal} disabled={savingPost}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={savingPost}>
              {savingPost ? 'Saving…' : postModal.mode === 'create' ? 'Publish post' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= DELETE CONFIRMATION ================= */}
      <ConfirmDialog
        open={confirm.open}
        title={`Delete ${confirm.kind === 'project' ? 'project' : 'blog post'}?`}
        message={`“${confirm.label}” will be permanently removed${
          confirm.kind === 'post' ? ' together with all of its comments' : ''
        }. This cannot be undone.`}
        loading={confirm.deleting}
        onCancel={() => setConfirm({ open: false, kind: null, id: null, label: '', deleting: false })}
        onConfirm={runDelete}
      />
    </div>
  );
}
