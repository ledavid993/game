import { PlayerRole } from './roles'

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  isAlive: boolean;
  lastKillTime?: number;
  socketId?: string;
  deviceType?: 'mobile' | 'desktop' | 'tv';
  joinedAt: number;
  cardRevealsRemaining?: number;
  isCardRevealed?: boolean;
}

export interface GameState {
  id: string;
  isActive: boolean;
  players: Map<string, Player>;
  startTime?: number;
  endTime?: number;
  killEvents: KillEvent[];
  settings: GameSettings;
}

export interface KillEvent {
  id: string;
  murderer: string;
  victim: string;
  timestamp: number;
  successful: boolean;
  message: string;
}

export interface GameSettings {
  cooldownMinutes: number;
  maxPlayers: number;
  murdererCount: number;
  theme: 'christmas' | 'halloween' | 'classic';
}

export interface KillAttemptResult {
  success: boolean;
  message: string;
  cooldownRemaining?: number;
  killEvent?: KillEvent;
}

export interface CooldownStatus {
  canKill: boolean;
  remainingSeconds: number;
  remainingMinutes: number;
  lastKillTime?: number;
}

export interface GameStats {
  totalPlayers: number;
  alivePlayers: number;
  deadPlayers: number;
  murderers: number;
  civilians: number;
  totalKills: number;
  gameStarted: boolean;
  gameEnded: boolean;
  duration?: number;
}

export interface SocketEvents {
  // Client to server events
  'join-game': (playerId: string) => void;
  'kill-attempt': (data: { murderer: string; victim: string }) => void;
  'request-game-state': () => void;
  'host-join': () => void;

  // Server to client events
  'game-state': (state: SerializedGameState) => void;
  'player-killed': (killEvent: KillEvent) => void;
  'kill-attempt-result': (result: KillAttemptResult) => void;
  'game-started': (state: SerializedGameState) => void;
  'game-ended': (winner: 'murderers' | 'civilians') => void;
  'player-joined': (player: Player) => void;
  'error': (message: string) => void;
}

// Serialized version for JSON transmission
export interface SerializedGameState {
  id: string;
  isActive: boolean;
  players: Player[];
  startTime?: number;
  endTime?: number;
  killEvents: KillEvent[];
  settings: GameSettings;
  stats: GameStats;
}

export interface ThemeConfig {
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
  decorations?: {
    backgroundEffect?: 'snowfall' | 'bats' | 'none';
    sounds?: {
      kill?: string;
      join?: string;
      victory?: string;
    };
  };
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'tv';
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
}

export interface JoinGameRequest {
  playerName: string;
  deviceInfo?: DeviceInfo;
}

export interface StartGameRequest {
  playerNames: string[];
  settings?: Partial<GameSettings>;
}

export interface HostDashboardData {
  gameState: SerializedGameState;
  playerLinks: Map<string, string>;
  qrCodes?: Map<string, string>;
}

// Error types
export class GameError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export const GameErrorCodes = {
  GAME_NOT_ACTIVE: 'GAME_NOT_ACTIVE',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  INVALID_ROLE: 'INVALID_ROLE',
  COOLDOWN_ACTIVE: 'COOLDOWN_ACTIVE',
  TARGET_ALREADY_DEAD: 'TARGET_ALREADY_DEAD',
  CANNOT_KILL_SELF: 'CANNOT_KILL_SELF',
  GAME_ALREADY_STARTED: 'GAME_ALREADY_STARTED',
  INVALID_PLAYER_COUNT: 'INVALID_PLAYER_COUNT',
  DUPLICATE_PLAYER_NAME: 'DUPLICATE_PLAYER_NAME',
} as const;

export type GameErrorCode = typeof GameErrorCodes[keyof typeof GameErrorCodes];
