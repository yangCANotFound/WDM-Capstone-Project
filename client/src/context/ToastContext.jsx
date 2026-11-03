/**
 * src/context/ToastContext.jsx
 * ---------------------------------------------------------------------------
 * Small global notification system (pure UX polish).
 * exposeToast() -> toast.success('Saved') / toast.error('Failed')
 * Components call useToast() to show a message after a create/update/delete.
 * ---------------------------------------------------------------------------
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const ICONS = { success: '✓', error: '✕', info: 'i' };
const STYLES = {
  success: 'border-emerald-200 bg-white text-emerald-800',
  error: 'border-red-200 bg-white text-red-700',
  info: 'border-brand-200 bg-white text-brand-800',
};
const ICON_STYLES = {
  success: 'bg-emerald-100 text-emerald-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-brand-100 text-brand-700',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message, duration = 3500) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((list) => [...list.slice(-3), { id, type, message }]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast: {
        success: (m) => push('success', m),
        error: (m) => push('error', m),
        info: (m) => push('info', m),
      },
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Fixed stack, top-right, above everything */}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-lift animate-fade-in-up ${STYLES[t.type]}`}
          >
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${ICON_STYLES[t.type]}`}
            >
              {ICONS[t.type]}
            </span>
            <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside a <ToastProvider>');
  return ctx.toast;
}

export default ToastContext;
