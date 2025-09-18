import {
  Player,
  GameState,
  KillEvent,
  GameSettings,
  KillAttemptResult,
  CooldownStatus,
  GameStats,
  SerializedGameState,
  GameError,
  GameErrorCodes,
  StartGameRequest,
} from './types'
import { SUPPORT_ROLES, isMurdererRole } from './roles'

export class GameManager {
  private static instance: GameManager;
  private gameState: GameState;

  private constructor() {
    this.gameState = this.createInitialGameState();
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  private createInitialGameState(): GameState {
    return {
      id: this.generateGameId(),
      isActive: false,
      players: new Map<string, Player>(),
      killEvents: [],
      settings: {
        cooldownMinutes: 10,
        maxPlayers: 20,
        murdererCount: 2,
        theme: 'christmas',
      },
    };
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePlayerId(name: string): string {
    return `player_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
  }

  public startGame(request: StartGameRequest): SerializedGameState {
    const { playerNames, settings } = request;

    // Validate player count
    if (playerNames.length < 3) {
      throw new GameError(
        GameErrorCodes.INVALID_PLAYER_COUNT,
        'At least 3 players are required to start a game',
        400
      );
    }

    if (playerNames.length > (settings?.maxPlayers || this.gameState.settings.maxPlayers)) {
      throw new GameError(
        GameErrorCodes.INVALID_PLAYER_COUNT,
        `Maximum ${settings?.maxPlayers || this.gameState.settings.maxPlayers} players allowed`,
        400
      );
    }

    // Check for duplicate names
    const uniqueNames = new Set(playerNames.map(name => name.toLowerCase().trim()));
    if (uniqueNames.size !== playerNames.length) {
      throw new GameError(
        GameErrorCodes.DUPLICATE_PLAYER_NAME,
        'Player names must be unique',
        400
      );
    }

    if (this.gameState.isActive) {
      throw new GameError(
        GameErrorCodes.GAME_ALREADY_STARTED,
        'Game is already active',
        400
      );
    }

    // Reset game state
    this.gameState = this.createInitialGameState();

    // Apply custom settings
    if (settings) {
      this.gameState.settings = { ...this.gameState.settings, ...settings };
    }

    // Create players
    const players = playerNames.map(name => this.createPlayer(name.trim()));

    // Assign roles
    this.assignRoles(players);

    // Add players to game state
    players.forEach(player => {
      this.gameState.players.set(player.id, player);
    });

    // Start the game
    this.gameState.isActive = true;
    this.gameState.startTime = Date.now();

    return this.serializeGameState();
  }

  private createPlayer(name: string): Player {
    return {
      id: this.generatePlayerId(name),
      name,
      role: 'civilian', // Default role, will be assigned later
      isAlive: true,
      joinedAt: Date.now(),
    };
  }

  private assignRoles(players: Player[]): void {
    const requestedMurderers = this.gameState.settings.murdererCount;

    if (requestedMurderers > players.length) {
      throw new Error(`Cannot assign ${requestedMurderers} murderers to ${players.length} players. Murderer count must be less than or equal to player count.`);
    }

    if (requestedMurderers < 1) {
      throw new Error('Must have at least 1 murderer');
    }

    // Shuffle players array
    const shuffled = [...players].sort(() => Math.random() - 0.5)

    let supportIndex = 0

    for (let i = 0; i < shuffled.length; i++) {
      if (i < requestedMurderers) {
        shuffled[i].role = 'murderer'
      } else if (supportIndex < SUPPORT_ROLES.length) {
        shuffled[i].role = SUPPORT_ROLES[supportIndex]
        supportIndex += 1
      } else {
        shuffled[i].role = 'civilian'
      }
    }
  }

  public killPlayer(murderer: string, victim: string): KillAttemptResult {
    // Validate game is active
    if (!this.gameState.isActive) {
      throw new GameError(
        GameErrorCodes.GAME_NOT_ACTIVE,
        'Game is not currently active',
        400
      );
    }

    // Get murderer player
    const murdererPlayer = this.getPlayerById(murderer);
    if (!murdererPlayer) {
      throw new GameError(
        GameErrorCodes.PLAYER_NOT_FOUND,
        'Murderer not found',
        404
      );
    }

    // Validate murderer role
    if (!isMurdererRole(murdererPlayer.role)) {
      throw new GameError(
        GameErrorCodes.INVALID_ROLE,
        'Only murderers can kill other players',
        403
      );
    }

    // Check if murderer is alive
    if (!murdererPlayer.isAlive) {
      throw new GameError(
        GameErrorCodes.PLAYER_NOT_FOUND,
        'Dead players cannot perform actions',
        403
      );
    }

    // Get victim player
    const victimPlayer = this.getPlayerById(victim);
    if (!victimPlayer) {
      throw new GameError(
        GameErrorCodes.PLAYER_NOT_FOUND,
        'Target player not found',
        404
      );
    }

    // Validate victim is alive
    if (!victimPlayer.isAlive) {
      return {
        success: false,
        message: `${victimPlayer.name} is already dead!`,
      };
    }

    // Cannot kill self
    if (murderer === victim) {
      return {
        success: false,
        message: 'You cannot kill yourself!',
      };
    }

    // Check cooldown
    const cooldownStatus = this.getCooldownStatus(murderer);
    if (!cooldownStatus.canKill) {
      return {
        success: false,
        message: `Wait ${cooldownStatus.remainingMinutes}m ${cooldownStatus.remainingSeconds % 60}s before killing again`,
        cooldownRemaining: cooldownStatus.remainingSeconds,
      };
    }

    // Execute the kill
    victimPlayer.isAlive = false;
    murdererPlayer.lastKillTime = Date.now();

    // Create kill event
    const killEvent: KillEvent = {
      id: `kill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      murderer: murdererPlayer.name,
      victim: victimPlayer.name,
      timestamp: Date.now(),
      successful: true,
      message: `💀 ${victimPlayer.name} was killed by ${murdererPlayer.name}!`,
    };

    this.gameState.killEvents.push(killEvent);

    // Check for game end conditions
    this.checkGameEndConditions();

    return {
      success: true,
      message: `You successfully killed ${victimPlayer.name}!`,
      killEvent,
    };
  }

  public getCooldownStatus(playerId: string): CooldownStatus {
    const player = this.getPlayerById(playerId);
    if (!player || !player.lastKillTime) {
      return {
        canKill: true,
        remainingSeconds: 0,
        remainingMinutes: 0,
      };
    }

    const cooldownMs = this.gameState.settings.cooldownMinutes * 60 * 1000;
    const timeSinceLastKill = Date.now() - player.lastKillTime;
    const remainingMs = Math.max(0, cooldownMs - timeSinceLastKill);
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);

    return {
      canKill: remainingMs <= 0,
      remainingSeconds,
      remainingMinutes,
      lastKillTime: player.lastKillTime,
    };
  }

  private checkGameEndConditions(): void {
    const stats = this.getGameStats();

    // Murderers win if they equal or outnumber civilians
    if (stats.murderers >= stats.civilians && stats.civilians > 0) {
      this.endGame('murderers');
      return;
    }

    // Civilians win if all murderers are dead
    const aliveMurderers = Array.from(this.gameState.players.values())
      .filter(p => isMurdererRole(p.role) && p.isAlive)

    if (aliveMurderers.length === 0) {
      this.endGame('civilians');
    }
  }

  private endGame(winner: 'murderers' | 'civilians'): void {
    this.gameState.isActive = false;
    this.gameState.endTime = Date.now();

    // Create victory event
    const victoryEvent: KillEvent = {
      id: `victory_${Date.now()}`,
      murderer: 'system',
      victim: 'game',
      timestamp: Date.now(),
      successful: true,
      message: `🎉 ${winner.toUpperCase()} WIN! Game Over!`,
    };

    this.gameState.killEvents.push(victoryEvent);
  }

  public getGameState(): SerializedGameState {
    return this.serializeGameState();
  }

  public getPlayerState(playerId: string): Player | null {
    return this.getPlayerById(playerId);
  }

  private getPlayerById(playerId: string): Player | null {
    return this.gameState.players.get(playerId) || null;
  }

  public updatePlayerSocket(playerId: string, socketId: string): void {
    const player = this.getPlayerById(playerId);
    if (player) {
      player.socketId = socketId;
    }
  }

  public removePlayerSocket(socketId: string): void {
    Array.from(this.gameState.players.values()).forEach(player => {
      if (player.socketId === socketId) {
        player.socketId = undefined;
      }
    });
  }

  public getGameStats(): GameStats {
    const players = Array.from(this.gameState.players.values());
    const alivePlayers = players.filter(p => p.isAlive);
    const deadPlayers = players.filter(p => !p.isAlive);
    const murderers = alivePlayers.filter(p => isMurdererRole(p.role))
    const civilians = alivePlayers.filter(p => !isMurdererRole(p.role))

    return {
      totalPlayers: players.length,
      alivePlayers: alivePlayers.length,
      deadPlayers: deadPlayers.length,
      murderers: murderers.length,
      civilians: civilians.length,
      totalKills: this.gameState.killEvents.filter(e => e.successful).length,
      gameStarted: this.gameState.isActive || !!this.gameState.endTime,
      gameEnded: !!this.gameState.endTime,
      duration: this.gameState.startTime
        ? (this.gameState.endTime || Date.now()) - this.gameState.startTime
        : undefined,
    };
  }

  public resetGame(): void {
    this.gameState = this.createInitialGameState();
  }

  public updateGameSettings(settings: Partial<GameSettings>): void {
    this.gameState.settings = { ...this.gameState.settings, ...settings };
  }

  private serializeGameState(): SerializedGameState {
    return {
      id: this.gameState.id,
      isActive: this.gameState.isActive,
      players: Array.from(this.gameState.players.values()),
      startTime: this.gameState.startTime,
      endTime: this.gameState.endTime,
      killEvents: this.gameState.killEvents,
      settings: this.gameState.settings,
      stats: this.getGameStats(),
    };
  }

  public getAvailableTargets(playerId: string): Player[] {
    const player = this.getPlayerById(playerId);
    if (!player || !isMurdererRole(player.role) || !player.isAlive) {
      return [];
    }

    return Array.from(this.gameState.players.values())
      .filter(p => p.id !== playerId && p.isAlive);
  }

  public getPlayerLinks(): Map<string, string> {
    const links = new Map<string, string>();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    Array.from(this.gameState.players.values()).forEach(player => {
      links.set(player.id, `${baseUrl}/game/play/${player.id}`);
    });

    return links;
  }
}
