import { Theme } from './types';

export const christmasTheme: Theme = {
  name: 'christmas',
  displayName: '🎄 Christmas',
  colors: {
    primary: '#c41e3a',      // Christmas red
    secondary: '#165b33',     // Christmas green
    accent: '#ffd700',        // Gold
    background: '#f8f4e6',    // Snow white
    text: '#0f172a',          // Dark slate
    murderer: '#dc2626',      // Red
    civilian: '#16a34a',      // Green
    dead: '#6b7280',          // Gray
  },
  decorations: {
    backgroundEffect: 'snowfall',
    particles: {
      count: 50,
      symbol: '❄',
      size: '1rem',
      duration: 10,
    },
    sounds: {
      kill: '/sounds/christmas/sleigh-bell.mp3',
      join: '/sounds/christmas/jingle.mp3',
      victory: '/sounds/christmas/victory.mp3',
      background: '/sounds/christmas/background.mp3',
    },
  },
  typography: {
    fontFamily: '"Mountains of Christmas", "Inter", sans-serif',
    fontSize: {
      mobile: '1rem',
      tablet: '1.25rem',
      desktop: '1.5rem',
      tv: '2rem',
    },
  },
};