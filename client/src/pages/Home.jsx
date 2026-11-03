/**
 * src/pages/Home.jsx  —  "/" (Home / About Me)
 * ---------------------------------------------------------------------------
 * Public landing page: hero, about section, skills, and a "latest work"
 * preview fetched from GET /api/projects (loading / error / empty handled).
 * ---------------------------------------------------------------------------
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import ProjectCard from '../components/ProjectCard.jsx';
import { CardGridSkeleton, ErrorMessage } from '../components/Loader.jsx';

const SKILLS = [
  { group: 'Front-end', items: ['React', 'React Router', 'Context API', 'Tailwind CSS', 'Vite'] },
  { group: 'Back-end', items: ['Node.js', 'Express', 'Mongoose', 'JWT', 'REST design'] },
  { group: 'Data & Tools', items: ['MongoDB Atlas', 'Git', 'Render', 'Vercel', 'Postman'] },
];

const STATS = [
  { value: '5', label: 'Production APIs built' },
  { value: '12+', label: 'React apps shipped' },
  { value: '100%', label: 'Mobile responsive' },
];

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async () => {
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
    };
    load();

    // Cleanup aborts the request if the user navigates away mid-flight.
    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  return (
    <>
      {/* ================= Hero ================= */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(60rem 30rem at 15% -10%, #3364ff55, transparent), radial-gradient(40rem 25rem at 90% 10%, #598cff33, transparent)',
          }}
        />
        <div className="container-page relative grid gap-12 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-brand-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Available for freelance work
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Hi, I’m Alex — <br className="hidden sm:block" />
              I build full-stack <span className="text-brand-300">web products</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">
              Full-stack developer specialising in the React + Node.js + MongoDB stack. I design
              APIs that are secure by default, and interfaces that feel fast on every screen size.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/projects" className="btn-primary">
                View my projects
              </Link>
              <Link
                to="/contact"
                className="btn border border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                Contact me
              </Link>
            </div>
          </div>

          {/* Decorative code card */}
          <div className="hidden animate-fade-in-up md:block">
            <div className="rounded-2xl border border-white/10 bg-ink-800/80 p-5 shadow-lift backdrop-blur">
              <div className="mb-4 flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              </div>
              <pre className="overflow-x-auto font-mono text-[12.5px] leading-relaxed text-slate-300">
{`// server/middleware/authMiddleware.js
const protect = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token)
    throw new AppError('Not authorized', 401);

  const { id } = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(id).select('-password');
  next();
});`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Stats ================= */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page grid grid-cols-3 divide-x divide-slate-200 py-8">
          {STATS.map((s) => (
            <div key={s.label} className="px-2 text-center">
              <p className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-ink-500 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= About + skills ================= */}
      <section className="container-page py-16 md:py-20" id="about">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-600">About me</p>
            <h2 className="section-title mt-2">Developer, designer, problem solver.</h2>
          </div>
          <div className="space-y-5 text-sm leading-relaxed text-ink-500 lg:col-span-3">
            <p>
              I started with static HTML and grew into building complete products — from schema
              design and API security to accessibility and responsive layout. I care about the
              details that make software feel trustworthy: consistent error messages, protected
              routes, loading states instead of blank screens.
            </p>
            <p>
              Every project on this site is powered by the same REST API you can visit directly.
              Data lives in MongoDB Atlas, passwords are hashed with bcrypt, and sessions are
              JWT-based.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {SKILLS.map((s) => (
                <div key={s.group} className="card p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-300">{s.group}</p>
                  <ul className="mt-2 space-y-1">
                    {s.items.map((i) => (
                      <li key={i} className="text-sm font-medium text-ink-700">
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= Featured projects (API) ================= */}
      <section className="container-page pb-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="section-title">Recent work</h2>
            <p className="muted mt-1">Fetched live from <code className="font-mono text-xs">GET /api/projects</code></p>
          </div>
          <Link to="/projects" className="link text-sm">
            All projects →
          </Link>
        </div>

        {loading && <CardGridSkeleton count={3} />}
        {!loading && error && (
          <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        )}
        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((p, i) => (
              <ProjectCard key={p._id} project={p} index={i} />
            ))}
          </div>
        )}
        {!loading && !error && projects.length === 0 && (
          <p className="muted">No projects published yet — log in as admin to add the first one.</p>
        )}
      </section>
    </>
  );
}
