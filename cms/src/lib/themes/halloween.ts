import { Theme } from './types';

export const halloweenTheme: Theme = {
  name: 'halloween',
  displayName: '🎃 Halloween',
  colors: {
    primary: '#ff6b35',       // Orange
    secondary: '#2d1b69',     // Purple
    accent: '#ffa500',        // Bright orange
    background: '#1a1a1a',    // Dark
    text: '#f8f8f8',          // Light gray
    murderer: '#dc2626',      // Red
    civilian: '#16a34a',      // Green
    dead: '#6b7280',          // Gray
  },
  decorations: {
    backgroundEffect: 'bats',
    particles: {
      count: 30,
      symbol: '🦇',
      size: '1.5rem',
      duration: 15,
    },
    sounds: {
      kill: '/sounds/halloween/scream.mp3',
      join: '/sounds/halloween/thunder.mp3',
      victory: '/sounds/halloween/evil-laugh.mp3',
      background: '/sounds/halloween/spooky.mp3',
    },
  },
  typography: {
    fontFamily: '"Creepster", "Inter", sans-serif',
    fontSize: {
      mobile: '1rem',
      tablet: '1.25rem',
      desktop: '1.5rem',
      tv: '2rem',
    },
  },
};