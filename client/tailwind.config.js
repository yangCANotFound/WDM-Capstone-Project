/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette used across buttons, links, badges.
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb5ff',
          400: '#598cff',
          500: '#3364ff',
          600: '#1f47f5',
          700: '#1836e1',
          800: '#1a2fb6',
          900: '#1b2e8f',
        },
        ink: {
          900: '#0b1020',
          800: '#141a2e',
          700: '#1f2740',
          500: '#4b556b',
          300: '#8b93a7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)',
        lift: '0 12px 32px rgba(16,24,40,.14)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up .45s ease-out both',
      },
    },
  },
  plugins: [],
};
