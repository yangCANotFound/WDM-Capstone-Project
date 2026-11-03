/** @type {import('tailwindcss').Config} */
export default {
  // `dark` is driven by a class on <html>, set by ThemeContext (Lab 19 behaviour).
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ------------------------------------------------------------------
        // `brand` is mapped onto the Lab 19 blue scale, so the existing
        // `text-brand-600` / `bg-brand-50` utilities across the pages render
        // in the Lab 19 palette without touching every file.
        // ------------------------------------------------------------------
        brand: {
          50: '#eff6ff', // blue-50
          100: '#dbeafe', // blue-100
          200: '#bfdbfe', // blue-200
          300: '#93c5fd', // blue-300
          400: '#60a5fa', // blue-400
          500: '#3b82f6', // blue-500
          600: '#2563eb', // blue-600
          700: '#1d4ed8', // blue-700  <- Lab 19 heading / link colour
          800: '#1e40af', // blue-800
          900: '#1e3a8a', // blue-900
        },
        // `ink` re-mapped onto Tailwind slate so body copy stays legible and
        // matches the Lab 19 page text colour (#172033).
        ink: {
          900: '#172033',
          800: '#1e293b',
          700: '#334155',
          500: '#64748b',
          300: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06)',
        lift: '0 8px 20px rgba(16,24,40,.12)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up .35s ease-out both',
      },
    },
  },
  plugins: [],
};
