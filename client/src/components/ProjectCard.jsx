/**
 * src/components/ProjectCard.jsx
 * ---------------------------------------------------------------------------
 * Lab 19 style card for one project: bordered box, image on top, bold title,
 * short description, then "View details" + "View repository" links.
 *
 * Props:
 *   project — one item from GET /api/projects (user populated)
 *   index   — optional, used only for a staggered fade-in
 * The card never fetches; data flows parent -> child through props.
 * ---------------------------------------------------------------------------
 */
import { Link } from 'react-router-dom';

/** Placeholder used when a project has no imageUrl or the image fails. */
const FALLBACK_IMG =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
       <rect width="640" height="360" fill="#e2e8f0"/>
       <text x="50%" y="52%" fill="#64748b" font-family="Arial, sans-serif"
             font-size="26" font-weight="700" text-anchor="middle">Project image</text>
     </svg>`
  );

export default function ProjectCard({ project }) {
  const { title, description, imageUrl, repoUrl, liveUrl, user, createdAt } = project;

  return (
    <article className="card flex min-w-0 flex-col overflow-hidden">
      {/* Media */}
      <div className="aspect-[16/9] w-full overflow-hidden border-b border-[#64748b] bg-slate-100">
        <img
          src={imageUrl || FALLBACK_IMG}
          alt={`Screenshot of ${title}`}
          loading="lazy"
          width="640"
          height="360"
          className="block h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMG;
          }}
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-xl font-bold break-words">{title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed">{description}</p>

        <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <li>
            <Link to="/projects" className="underline underline-offset-4">
              View details
            </Link>
          </li>
          {repoUrl && (
            <li>
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                View repository
              </a>
            </li>
          )}
          {liveUrl && (
            <li>
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                Live demo
              </a>
            </li>
          )}
        </ul>

        <p className="mt-3 border-t border-slate-200 pt-2 text-xs text-slate-500">
          by {user?.username || 'Admin'}
          {createdAt ? ` · ${new Date(createdAt).toLocaleDateString()}` : ''}
        </p>
      </div>
    </article>
  );
}
