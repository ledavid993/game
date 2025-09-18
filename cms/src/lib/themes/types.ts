export interface Theme {
  name: string;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    murderer: string;
    civilian: string;
    dead: string;
  };
  decorations: {
    backgroundEffect: 'snowfall' | 'bats' | 'none';
    particles?: {
      count: number;
      symbol: string;
      size: string;
      duration: number;
    };
    sounds?: {
      kill?: string;
      join?: string;
      victory?: string;
      background?: string;
    };
  };
  typography: {
    fontFamily: string;
    fontSize: {
      mobile: string;
      tablet: string;
      desktop: string;
      tv: string;
    };
  };
}