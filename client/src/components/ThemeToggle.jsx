/**
 * src/components/ThemeToggle.jsx
 * ---------------------------------------------------------------------------
 * Lab 19 style theme switch, driven by ThemeContext (no props).
 * Rendered in the Header on every page.
 * ---------------------------------------------------------------------------
 */
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle({ className = '' }) {
  const { dark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={dark}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex items-center gap-1.5 rounded-md border border-slate-400/60
                  bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white
                  transition-colors hover:bg-white/20 ${className}`}
    >
      <span aria-hidden="true">{dark ? '☀' : '☾'}</span>
      <span>{dark ? 'Light theme' : 'Dark theme'}</span>
    </button>
  );
}
