export const SUPPORT_ROLES = [
  'reviver',
  'detective',
  'bodyguard',
  'nurse',
  'vigilante',
  'doctor',
  'troll',
] as const

export type SupportRole = typeof SUPPORT_ROLES[number]
export type PlayerRole = 'murderer' | 'civilian' | SupportRole

export const ROLE_LABELS: Record<PlayerRole, string> = {
  murderer: 'Krampus',
  civilian: 'Snowbound',
  reviver: 'Sugarplum',
  detective: 'Candy Cane',
  bodyguard: 'Nutcracker',
  nurse: 'Gingerbread',
  vigilante: 'North Star',
  doctor: 'Arctic Elf',
  troll: 'The Grinch',
}

export const ROLE_OUTLINE: Record<PlayerRole, 'murderer' | 'support'> = {
  murderer: 'murderer',
  civilian: 'support',
  reviver: 'support',
  detective: 'support',
  bodyguard: 'support',
  nurse: 'support',
  vigilante: 'support',
  doctor: 'support',
  troll: 'support',
}

export const ALL_ROLES: PlayerRole[] = ['murderer', 'civilian', ...SUPPORT_ROLES]

export const isMurdererRole = (role: PlayerRole): boolean => role === 'murderer'

export const isSupportRole = (role: PlayerRole): boolean => ROLE_OUTLINE[role] === 'support'
