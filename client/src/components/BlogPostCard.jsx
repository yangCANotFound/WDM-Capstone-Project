/**
 * src/components/BlogPostCard.jsx
 * ---------------------------------------------------------------------------
 * Reusable card for one blog post. One prop `post` (shape from GET /api/blog,
 * with `author` populated to { _id, username }).
 * Also shows reading time and the tag list when present.
 * ---------------------------------------------------------------------------
 */
import { Link } from 'react-router-dom';

const readingTime = (text = '') => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

export default function BlogPostCard({ post, featured = false }) {
  const { _id, title, content = '', excerpt, tags = [], author, createdAt } = post;
  const preview = excerpt || content.replace(/\s+/g, ' ').slice(0, 180) + (content.length > 180 ? '…' : '');

  return (
    <article
      className={`card flex flex-col p-6 transition-shadow hover:shadow-lift animate-fade-in-up ${
        featured ? 'md:col-span-2 md:flex-row md:items-center md:gap-8' : ''
      }`}
    >
      <div className={featured ? 'flex-1' : ''}>
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-300">
          <span className="badge">{author?.username || 'Author'}</span>
          <span>{formatDate(createdAt)}</span>
          <span aria-hidden="true">·</span>
          <span>{readingTime(content)} min read</span>
        </div>

        <h3 className={`mt-3 font-bold leading-snug text-ink-900 ${featured ? 'text-2xl' : 'text-xl'}`}>
          <Link to={`/blog/${_id}`} className="hover:text-brand-700">
            {title}
          </Link>
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-ink-500">{preview}</p>

        {tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {tags.map((t) => (
              <li key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-ink-500">
                #{t}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={featured ? 'mt-5 md:mt-0' : 'mt-5'}>
        <Link to={`/blog/${_id}`} className={featured ? 'btn-primary' : 'btn-secondary btn-sm'}>
          Read article →
        </Link>
      </div>
    </article>
  );
}
