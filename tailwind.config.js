/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        ink: 'var(--text)',
        muted: 'var(--muted)',
        highlight: 'var(--highlight)',
        line: 'var(--border)',
      },
    },
  },
  plugins: [],
}
