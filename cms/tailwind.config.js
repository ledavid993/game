import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // root-level app/
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', // src/ if you actually use it
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        christmas: {
          red: '#c41e3a',
          green: '#165b33',
          gold: '#ffd700',
          snow: '#f8f4e6',
          dark: '#0f172a',
        },
        murderer: '#dc2626',
        civilian: '#16a34a',
        dead: '#6b7280',
        manor: {
          midnight: '#0b0f16',
          wine: '#4b1126',
          ember: '#b1361e',
          candle: '#f7d7a1',
          parchment: '#d8c7a1',
          moss: '#3f4f44',
        },
      },
      fontFamily: {
        manor: ['var(--font-cinzel)', 'serif'],
        gothic: ['var(--font-fell)', 'serif'],
        body: ['var(--font-lato)', 'sans-serif'],
      },
      animation: {
        snowfall: 'snowfall 10s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        snowfall: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)' },
        },
      },
      screens: {
        tv: '1200px',
      },
    },
  },
  plugins: [forms, typography],
}
