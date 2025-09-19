import type { PlayerRole } from '@/app/lib/game/roles'
import type { GamePlayer, Game } from '@/payload-types'

export interface AbilityResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
  cooldownExpiry?: Date
  abilityUsed?: string
}

export interface AbilityStatus {
  canUse: boolean
  reason?: string
  cooldownRemaining?: number
  usesRemaining?: number
}

export interface AbilityEvent {
  type: string
  actor: GamePlayer
  target?: GamePlayer
  ability: string
  result: AbilityResult
  timestamp: Date
  gameId: string
}

export interface AbilityObserver {
  onAbilityUsed(event: AbilityEvent): Promise<void>
}

export interface RoleAbility {
  name: string
  role: PlayerRole
  cooldownMinutes: number
  maxUses?: number
  requiresTarget: boolean

  canUse(actor: GamePlayer, game: Game): Promise<AbilityStatus>
  execute(actor: GamePlayer, game: Game, target?: GamePlayer): Promise<AbilityResult>
  getCooldownExpiry(actor: GamePlayer, game: Game): Date | null
  getRemainingUses(actor: GamePlayer): number | null
}

export interface AbilityConfig {
  name: string
  role: PlayerRole
  cooldownMinutes: number
  maxUses?: number
  requiresTarget: boolean
}

export interface GrinchMimicResult extends AbilityResult {
  mimickedAbility?: string
  originalTarget?: string
  mimicSuccess?: boolean
}

export interface DetectiveInvestigationResult extends AbilityResult {
  targetRole?: PlayerRole
  targetName?: string
}

export interface ProtectionResult extends AbilityResult {
  protectionExpiry?: Date
  protectedPlayer?: string
}

export interface ReviverResult extends AbilityResult {
  revivedPlayer?: string
}

export interface VigilanteResult extends AbilityResult {
  targetWasMurderer?: boolean
  vigilanteDied?: boolean
}

// Ability type constants
export const ABILITY_TYPES = {
  KILL: 'kill',
  INVESTIGATE: 'investigate',
  REVIVE: 'revive',
  PROTECT: 'protect',
  VIGILANTE_KILL: 'vigilante_kill',
  GRINCH_MIMIC: 'grinch_mimic',
  HEAL: 'heal',
} as const

export type AbilityType = typeof ABILITY_TYPES[keyof typeof ABILITY_TYPES]

// Event type constants for observer pattern
export const ABILITY_EVENTS = {
  ABILITY_USED: 'ability_used',
  ABILITY_FAILED: 'ability_failed',
  PLAYER_KILLED: 'player_killed',
  PLAYER_REVIVED: 'player_revived',
  PLAYER_PROTECTED: 'player_protected',
  PLAYER_INVESTIGATED: 'player_investigated',
  GAME_STATE_CHANGED: 'game_state_changed',
} as const

export type AbilityEventType = typeof ABILITY_EVENTS[keyof typeof ABILITY_EVENTS]

// Cooldown tracking interface
export interface CooldownTracker {
  [abilityType: string]: string // ISO date string
}

// Ability usage tracking interface
export interface AbilityUsageTracker {
  [abilityType: string]: number
}

// Game settings extensions for abilities
export interface GameAbilitySettings {
  cooldownMinutes: number
  reviverCooldownMinutes: number
  detectiveCooldownMinutes: number
  vigilanteMaxKills: number
  bodyguardProtectionDurationMinutes: number
  grinchCooldownMinutes: number
}