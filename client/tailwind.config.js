/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: 'var(--color-bg-primary)',
          surface: 'var(--color-bg-surface)',
          card: 'var(--color-card-bg)',
          border: 'var(--color-card-border)',
        },
        emeraldAccent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          muted: 'var(--color-accent-muted)',
        },
      },
    },
  },
  plugins: [],
};
