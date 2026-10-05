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
        // 랜딩(simfle)
        sf: { ink: 'var(--sf-ink)', sub: 'var(--sf-sub)', body: 'var(--sf-body)', line: 'var(--sf-line)', soft: 'var(--sf-soft)', dim: 'var(--sf-dim)', accent: 'var(--sf-accent)' },
      },
      fontFamily: {
        plex: ['"IBM Plex Sans KR"', '"Apple SD Gothic Neo"', '"Malgun Gothic"', 'sans-serif'],
        plexmono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
