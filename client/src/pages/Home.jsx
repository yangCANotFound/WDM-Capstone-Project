/**
 * src/pages/Home.jsx  —  "/" (Home / About Me)
 * ---------------------------------------------------------------------------
 * Lab 19 style About page: profile picture + introduction + skill list,
 * followed by a "Recent work" strip fetched from GET /api/projects so the
 * landing page still proves the live API integration (Capstone requirement).
 *
 * States handled explicitly: Loading (skeleton) / Error (with retry) / Empty.
 * ---------------------------------------------------------------------------
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import ProjectCard from '../components/ProjectCard.jsx';
import { CardGridSkeleton, ErrorMessage } from '../components/Loader.jsx';
import { site } from '../data/site.js';

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // ---- GET /api/projects (public) ----
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

  return (
    <div className="container-page py-8">
      {/* ================= About ================= */}
      <section id="about" className="pb-6">
        <h2 className="mb-4 text-[26px] text-blue-700">About me</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
          {/* Profile picture */}
          <img
            src="/assets/profile.svg"
            alt={`Profile picture of ${site.fullName}`}
            width="240"
            height="240"
            className="profile-image block h-auto w-full max-w-[220px] rounded-lg border border-[#64748b] bg-white"
          />

          <div className="min-w-0">
            <p className="mt-0 text-base">{site.intro}</p>
            <p className="mt-3 text-base">{site.tagline}</p>

            <p className="mt-4 text-sm text-slate-500">
              {site.title} · {site.location}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/projects" className="btn-primary">
                See my projects
              </Link>
              <Link to="/contact" className="btn-secondary">
                Contact me
              </Link>
              <a
                href={site.github}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Skills — Lab 19 style list, grouped */}
        <h3 className="mt-8 mb-3 text-xl text-blue-700">Skills I am practising</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {site.skills.map((group) => (
            <div key={group.group} className="card p-4">
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                {group.group}
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ================= Recent work (live API) ================= */}
      <section className="border-t border-slate-200 pt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="mb-1">Recent work</h2>            <p className="muted">Loaded live from GET /api/projects</p>
          </div>
          <Link to="/projects" className="link text-sm">
            All projects →
          </Link>
        </div>

        {loading && <CardGridSkeleton count={3} />}

        {!loading && error && <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

        {!loading && !error && projects.length === 0 && (
          <p className="muted">No projects published yet — log in as admin to add the first one.</p>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((p) => (
              <ProjectCard key={p._id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
