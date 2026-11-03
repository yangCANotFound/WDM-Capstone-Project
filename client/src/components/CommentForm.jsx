/**
 * src/components/CommentForm.jsx
 * ---------------------------------------------------------------------------
 * Controlled form to POST /api/blog/:postId/comments.
 * Props:
 *   postId   (string) - the post being commented on
 *   onCreated(comment) - callback with the created (populated) comment,
 *                        so BlogDetail can append it to local state without refetching
 *
 * Uses useState for: body, submitting, error  (required by the spec).
 * Visible only when the Auth Context says the user is logged in; otherwise
 * BlogDetail renders a "log in to comment" prompt instead.
 * ---------------------------------------------------------------------------
 */
import { useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

export default function CommentForm({ postId, onCreated }) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) {
      setError('Please write a comment before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // Protected call: the fetch wrapper adds "Authorization: Bearer <token>".
      const res = await api.createComment(postId, { body: body.trim() });
      onCreated?.(res.data);
      setBody('');
      toast.success('Comment posted!');
    } catch (err) {
      // 403/401 come from the backend's protect middleware.
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5" noValidate>
      <label htmlFor="comment-body" className="label">
        Add a comment
      </label>
      <textarea
        id="comment-body"
        className="textarea"
        rows={4}
        maxLength={1000}
        placeholder="Share your thoughts…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'comment-error' : undefined}
        disabled={submitting}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-ink-300">{body.length}/1000</span>
        <button type="submit" className="btn-primary" disabled={submitting || !body.trim()}>
          {submitting ? 'Posting…' : 'Post comment'}
        </button>
      </div>
      {error && (
        <p id="comment-error" className="mt-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
