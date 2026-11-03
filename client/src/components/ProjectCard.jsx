/**
 * src/components/ProjectCard.jsx
 * ---------------------------------------------------------------------------
 * Reusable card for one portfolio project. Receives ONE prop `project`
 * (shape returned by GET /api/projects, including the populated `user`).
 * The card never fetches — data flows parent -> child via props.
 * ---------------------------------------------------------------------------
 */
import { Link } from 'react-router-dom';

const FALLBACK_IMG =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
       <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
         <stop offset="0" stop-color="#1f47f5"/><stop offset="1" stop-color="#0b1020"/>
       </linearGradient></defs>
       <rect width="800" height="450" fill="url(#g)"/>
       <text x="50%" y="52%" fill="#ffffff" font-family="sans-serif" font-size="42"
             font-weight="700" text-anchor="middle">Portfolio Project</text>
     </svg>`
  );

export default function ProjectCard({ project, index = 0 }) {
  const { title, description, imageUrl, repoUrl, liveUrl, user, createdAt } = project;

  return (
    <article
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lift animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
    >
      {/* Media */}
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <img
          src={imageUrl || FALLBACK_IMG}
          alt={`Screenshot of ${title}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMG; // broken imageUrl must not break the grid
          }}
        />
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-ink-900 shadow-sm hover:bg-white"
          >
            Live demo ↗
          </a>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-ink-900">{title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-500">{description}</p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="truncate text-xs text-ink-300">
            by <span className="font-semibold text-ink-500">{user?.username || 'Admin'}</span>
            {createdAt ? ` · ${new Date(createdAt).toLocaleDateString()}` : ''}
          </span>
          <div className="flex shrink-0 gap-2">
            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary btn-sm"
                aria-label={`${title} source code`}
              >
                Code
              </a>
            )}
            <Link to="/contact" className="btn-ghost btn-sm">
              Ask me
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
