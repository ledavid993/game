import type { PlayerRole } from './roles'

export interface RoleDistribution {
  murderers: number
  detectives: number
  revivers: number
  bodyguards: number
  vigilantes: number
  trolls: number
}

export interface RoleCooldowns {
  murdererKillCooldown: number
  detectiveInvestigateCooldown: number
  reviverReviveCooldown: number
  bodyguardProtectionDuration: number
  vigilanteMaxKills: number
  trollMimicCooldown: number
}

export interface EnhancedGameSettings {
  maxPlayers: number
  cooldownMinutes: number // Legacy field for backwards compatibility
  murdererCount: number // Legacy field for backwards compatibility
  roleDistribution: RoleDistribution
  roleCooldowns: RoleCooldowns
}

export interface RoleInfo {
  key: keyof RoleDistribution
  role: PlayerRole
  name: string
  displayName: string
  description: string
  emoji: string
  color: string
  abilities: string[]
  isSpecial: boolean
}

export const ROLE_INFO: Record<keyof RoleDistribution, RoleInfo> = {
  murderers: {
    key: 'murderers',
    role: 'murderer',
    name: 'Murderer',
    displayName: 'Krampus',
    description: 'Eliminate other players to win. Can kill with a cooldown.',
    emoji: '🎭',
    color: 'red',
    abilities: ['Kill Players'],
    isSpecial: true,
  },
  detectives: {
    key: 'detectives',
    role: 'detective',
    name: 'Detective',
    displayName: 'Candy Cane',
    description: 'Investigate players to reveal their true roles.',
    emoji: '🍭',
    color: 'blue',
    abilities: ['Investigate Role'],
    isSpecial: true,
  },
  revivers: {
    key: 'revivers',
    role: 'reviver',
    name: 'Reviver',
    displayName: 'Sugarplum',
    description: 'Bring eliminated players back to life.',
    emoji: '🧚',
    color: 'green',
    abilities: ['Revive Dead Players'],
    isSpecial: true,
  },
  bodyguards: {
    key: 'bodyguards',
    role: 'bodyguard',
    name: 'Bodyguard',
    displayName: 'Nutcracker',
    description: 'Protect players from being eliminated.',
    emoji: '🥜',
    color: 'yellow',
    abilities: ['Protect Players'],
    isSpecial: true,
  },
  vigilantes: {
    key: 'vigilantes',
    role: 'vigilante',
    name: 'Vigilante',
    displayName: 'North Star',
    description: 'Eliminate suspected murderers. Wrong guess = you die!',
    emoji: '⭐',
    color: 'orange',
    abilities: ['Kill Suspected Murderers'],
    isSpecial: true,
  },
  trolls: {
    key: 'trolls',
    role: 'troll',
    name: 'Grinch',
    displayName: 'The Grinch',
    description: 'Mimic other players\' abilities. Dangerous but powerful!',
    emoji: '👹',
    color: 'purple',
    abilities: ['Mimic Abilities'],
    isSpecial: true,
  },
}

export const DEFAULT_ROLE_DISTRIBUTION: RoleDistribution = {
  murderers: 1,
  detectives: 0,
  revivers: 0,
  bodyguards: 0,
  vigilantes: 0,
  trolls: 0,
}

export const DEFAULT_ROLE_COOLDOWNS: RoleCooldowns = {
  murdererKillCooldown: 10,
  detectiveInvestigateCooldown: 15,
  reviverReviveCooldown: 15,
  bodyguardProtectionDuration: 30,
  vigilanteMaxKills: 1,
  trollMimicCooldown: 10,
}

export const GAME_PRESETS = {
  SMALL_GAME: {
    name: 'Small Game (5-10 players)',
    maxPlayers: 10,
    roleDistribution: {
      murderers: 1,
      detectives: 1,
      revivers: 0,
      bodyguards: 1,
      vigilantes: 0,
      trolls: 0,
    },
    roleCooldowns: DEFAULT_ROLE_COOLDOWNS,
  },
  MEDIUM_GAME: {
    name: 'Medium Game (10-25 players)',
    maxPlayers: 25,
    roleDistribution: {
      murderers: 2,
      detectives: 1,
      revivers: 1,
      bodyguards: 1,
      vigilantes: 1,
      trolls: 1,
    },
    roleCooldowns: DEFAULT_ROLE_COOLDOWNS,
  },
  LARGE_GAME: {
    name: 'Large Game (25-50 players)',
    maxPlayers: 50,
    roleDistribution: {
      murderers: 3,
      detectives: 2,
      revivers: 1,
      bodyguards: 2,
      vigilantes: 1,
      trolls: 1,
    },
    roleCooldowns: DEFAULT_ROLE_COOLDOWNS,
  },
  MASSIVE_GAME: {
    name: 'Massive Game (50+ players)',
    maxPlayers: 100,
    roleDistribution: {
      murderers: 5,
      detectives: 3,
      revivers: 2,
      bodyguards: 3,
      vigilantes: 2,
      trolls: 2,
    },
    roleCooldowns: DEFAULT_ROLE_COOLDOWNS,
  },
}

export const COOLDOWN_PRESETS = {
  FAST_PACE: {
    name: 'Fast Pace',
    description: 'Quick games with reduced cooldowns',
    multiplier: 0.5,
  },
  NORMAL: {
    name: 'Normal',
    description: 'Balanced gameplay experience',
    multiplier: 1.0,
  },
  STRATEGIC: {
    name: 'Strategic',
    description: 'Longer games with increased cooldowns',
    multiplier: 1.5,
  },
}

export function getTotalSpecialRoles(distribution: RoleDistribution): number {
  return Object.entries(distribution).reduce((total, [key, count]) => {
    return total + count
  }, 0)
}

export function getCivilianCount(distribution: RoleDistribution, maxPlayers: number): number {
  const specialRoles = getTotalSpecialRoles(distribution)
  return Math.max(0, maxPlayers - specialRoles)
}

export function validateRoleDistribution(
  distribution: RoleDistribution,
  maxPlayers: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check minimum murderers
  if (distribution.murderers < 1) {
    errors.push('Must have at least 1 murderer')
  }

  // Check total doesn't exceed max players
  const totalSpecialRoles = getTotalSpecialRoles(distribution)
  if (totalSpecialRoles > maxPlayers) {
    errors.push(`Total special roles (${totalSpecialRoles}) exceeds max players (${maxPlayers})`)
  }

  // Check reasonable distribution for game balance
  const murdererRatio = distribution.murderers / maxPlayers
  if (murdererRatio > 0.5) {
    errors.push('Too many murderers for balanced gameplay')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function applyCooldownPreset(
  baseCooldowns: RoleCooldowns,
  preset: keyof typeof COOLDOWN_PRESETS
): RoleCooldowns {
  const multiplier = COOLDOWN_PRESETS[preset].multiplier

  return {
    murdererKillCooldown: Math.round(baseCooldowns.murdererKillCooldown * multiplier),
    detectiveInvestigateCooldown: Math.round(baseCooldowns.detectiveInvestigateCooldown * multiplier),
    reviverReviveCooldown: Math.round(baseCooldowns.reviverReviveCooldown * multiplier),
    bodyguardProtectionDuration: Math.round(baseCooldowns.bodyguardProtectionDuration * multiplier),
    vigilanteMaxKills: baseCooldowns.vigilanteMaxKills, // Don't modify max kills
    trollMimicCooldown: Math.round(baseCooldowns.trollMimicCooldown * multiplier),
  }
}

export function getRecommendedDistribution(playerCount: number): RoleDistribution {
  if (playerCount <= 10) {
    return GAME_PRESETS.SMALL_GAME.roleDistribution
  } else if (playerCount <= 25) {
    return GAME_PRESETS.MEDIUM_GAME.roleDistribution
  } else if (playerCount <= 50) {
    return GAME_PRESETS.LARGE_GAME.roleDistribution
  } else {
    return GAME_PRESETS.MASSIVE_GAME.roleDistribution
  }
}