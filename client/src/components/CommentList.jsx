/**
 * src/components/CommentList.jsx
 * ---------------------------------------------------------------------------
 * Presentational list of comments. One prop: `comments` (array).
 * Each comment's `author` was populated by the API to { _id, username }.
 * ---------------------------------------------------------------------------
 */
const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(iso).toLocaleDateString();
};

export default function CommentList({ comments = [] }) {
  if (!comments.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-ink-300">
        No comments yet — be the first to share your thoughts.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <li key={c._id} className="card p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold uppercase text-brand-700">
              {c.author?.username?.[0] || '?'}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">{c.author?.username || 'Unknown user'}</p>
              <p className="text-xs text-ink-300">{timeAgo(c.createdAt)}</p>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">{c.body}</p>
        </li>
      ))}
    </ul>
  );
}
