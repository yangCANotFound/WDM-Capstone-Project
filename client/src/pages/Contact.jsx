/**
 * src/pages/Contact.jsx  —  "/contact"  (public)
 * ---------------------------------------------------------------------------
 * Phase 7 "API Integration (Write)": a CONTROLLED form that POSTs to
 * POST /api/contact.
 *
 * Controlled form = every <input> has value={state} and onChange={setState}.
 * Client-side validation mirrors the schema rules (name max 80, valid email,
 * message >= 5 chars) so obvious mistakes are caught before the request.
 * ---------------------------------------------------------------------------
 */
import { useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { site } from '../data/site.js';

const EMPTY = { name: '', email: '', message: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  // ---- form state (controlled) ----
  const [form, setForm] = useState(EMPTY);
  // ---- request/UX state ----
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address';
    if (form.message.trim().length < 5) errs.message = 'Message must be at least 5 characters';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Public endpoint — no Authorization header is sent or needed.
      await api.sendContact({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      setForm(EMPTY);
      setSent(true);
      toast.success('Message sent! I’ll reply by email.');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page grid gap-12 py-12 md:py-16 lg:grid-cols-5">
      {/* ---- Left: intro ---- */}
      <aside className="lg:col-span-2">
        <h1 className="section-title mb-3">Contact</h1>
        <p className="text-base leading-relaxed">
          Have a project in mind, a question about the code, or just want to say hi? Send a message —
          it is stored in MongoDB via{' '}
          <code className="font-mono text-sm">POST /api/contact</code> and I will get back to you.
        </p>

        <ul className="mt-8 space-y-4">
          {[
            { icon: '✉', label: 'Email', value: site.email },
            { icon: '⌖', label: 'Location', value: site.location },
            { icon: '⏱', label: 'Response time', value: 'Usually within 24 hours' },
          ].map((item) => (
            <li key={item.label} className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                {item.icon}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-300">{item.label}</p>
                <p className="text-sm font-medium text-ink-700">{item.value}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* ---- Right: form ---- */}
      <div className="lg:col-span-3">
        <form onSubmit={handleSubmit} className="card p-6 sm:p-8" noValidate>
          <h2 className="text-lg font-bold text-ink-900">Send a message</h2>
          <p className="muted mt-1">All fields are required.</p>

          {sent && (
            <div className="alert-success mt-5 flex items-start justify-between gap-3" role="status">
              <p>✓ Thank you! Your message has been received.</p>
              <button type="button" className="text-xs font-semibold underline" onClick={() => setSent(false)}>
                Send another
              </button>
            </div>
          )}
          {error && <div className="alert-error mt-5">{error}</div>}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {/* Name */}
            <div>
              <label htmlFor="name" className="label">
                Your name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="input"
                placeholder="Jane Doe"
                maxLength={80}
                value={form.name}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.name)}
                autoComplete="name"
              />
              {fieldErrors.name && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                placeholder="jane@example.com"
                value={form.email}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.email)}
                autoComplete="email"
              />
              {fieldErrors.email && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.email}</p>}
            </div>

            {/* Message */}
            <div className="sm:col-span-2">
              <label htmlFor="message" className="label">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                className="textarea"
                rows={6}
                maxLength={2000}
                placeholder="Tell me about your project…"
                value={form.message}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.message)}
              />
              <div className="mt-1 flex justify-between">
                {fieldErrors.message ? (
                  <p className="text-xs font-medium text-red-600">{fieldErrors.message}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-ink-300">{form.message.length}/2000</span>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary mt-6 w-full sm:w-auto" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </div>
  );
}
