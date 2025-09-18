import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
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
      },
      animation: {
        'snowfall': 'snowfall 10s linear infinite',
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
        'tv': '1200px',
      },
    },
  },
  plugins: [forms, typography],
}
