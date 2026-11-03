/**
 * src/components/BlogPostCard.jsx
 * ---------------------------------------------------------------------------
 * Lab 19 style card for one blog post: bordered box, meta line, bold title,
 * excerpt, tags and a "Read article" link.
 *
 * Props:
 *   post     — one item from GET /api/blog (author populated to { username })
 *   featured — when true the card spans two columns on wide screens
 * ---------------------------------------------------------------------------
 */
import { Link } from 'react-router-dom';

const readingTime = (text = '') => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

export default function BlogPostCard({ post, featured = false }) {
  const { _id, title, content = '', excerpt, tags = [], author, createdAt } = post;
  const preview =
    excerpt || content.replace(/\s+/g, ' ').slice(0, 180) + (content.length > 180 ? '…' : '');

  return (
    <article className={`card flex min-w-0 flex-col p-4 ${featured ? 'md:col-span-2' : ''}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="badge">{author?.username || 'Author'}</span>
        <span>{formatDate(createdAt)}</span>
        <span aria-hidden="true">·</span>
        <span>{readingTime(content)} min read</span>
      </div>

      <h3 className="mt-2 text-xl font-bold break-words">
        <Link to={`/blog/${_id}`} className="underline-offset-4 hover:underline">
          {title}
        </Link>
      </h3>

      <p className="mt-2 flex-1 text-sm leading-relaxed">{preview}</p>

      {tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {tags.map((t) => (
            <li key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              #{t}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3">
        <Link to={`/blog/${_id}`} className="text-sm underline underline-offset-4">
          Read article →
        </Link>
      </p>
    </article>
  );
}
