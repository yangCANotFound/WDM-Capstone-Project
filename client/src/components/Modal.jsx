/**
 * src/components/Modal.jsx
 * ---------------------------------------------------------------------------
 * Accessible modal used by the Admin Dashboard for Create/Edit forms.
 * Props:
 *   open     (bool)      - visibility
 *   title    (string)    - heading
 *   onClose  (fn)        - called on backdrop click / Esc / ✕
 *   children (node)      - the form
 * Renders into a fixed overlay; body scroll is locked while open.
 * ---------------------------------------------------------------------------
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, title, onClose, children, size = 'lg' }) {
  // Close on Escape + lock body scroll while open (useEffect cleanup restores it).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-ink-900/50 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        // Only close when the backdrop itself is clicked (not the panel).
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`card my-4 w-full ${widths[size]} animate-fade-in-up`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-ink-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-slate-100"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
