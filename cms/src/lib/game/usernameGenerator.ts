// Manor-themed username generator for mystery game players

const adjectives = [
  'Crimson', 'Shadow', 'Velvet', 'Gothic', 'Mystic', 'Silent', 'Noble', 'Clever',
  'Phantom', 'Midnight', 'Silver', 'Ancient', 'Mysterious', 'Elegant', 'Sinister', 'Ethereal',
  'Haunted', 'Regal', 'Wicked', 'Enchanted', 'Darkened', 'Ghostly', 'Forbidden', 'Hidden',
  'Cursed', 'Twisted', 'Whispering', 'Brooding', 'Ornate', 'Secretive', 'Eerie', 'Macabre'
]

const nouns = [
  'Raven', 'Wolf', 'Serpent', 'Phoenix', 'Dragon', 'Owl', 'Fox', 'Phantom',
  'Rose', 'Thorn', 'Crown', 'Blade', 'Mirror', 'Candle', 'Key', 'Door',
  'Chamber', 'Tower', 'Veil', 'Jewel', 'Scroll', 'Tome', 'Crypt', 'Gargoyle',
  'Spider', 'Moth', 'Bat', 'Cat', 'Raven', 'Skull', 'Bones', 'Ash'
]

export interface UsernameGeneratorOptions {
  excludeList?: string[]
  prefix?: string
  maxLength?: number
}

/**
 * Generates a manor-themed username with format: [prefix]AdjectiveNoun
 */
export function generateUsername(options: UsernameGeneratorOptions = {}): string {
  const { excludeList = [], prefix = '', maxLength = 20 } = options

  let attempts = 0
  const maxAttempts = 50

  while (attempts < maxAttempts) {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const username = `${prefix}${adjective}${noun}`

    // Check length constraint
    if (maxLength && username.length > maxLength) {
      attempts++
      continue
    }

    // Check if username is unique
    if (!excludeList.includes(username.toLowerCase())) {
      return username
    }

    attempts++
  }

  // Fallback: add random number if we can't find a unique combination
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const randomNum = Math.floor(Math.random() * 999) + 1

  return `${prefix}${adjective}${noun}${randomNum}`
}

/**
 * Generates multiple unique usernames
 */
export function generateMultipleUsernames(count: number, options: UsernameGeneratorOptions = {}): string[] {
  const usernames: string[] = []
  const excludeList = [...(options.excludeList || [])]

  for (let i = 0; i < count; i++) {
    const username = generateUsername({ ...options, excludeList })
    usernames.push(username)
    excludeList.push(username.toLowerCase())
  }

  return usernames
}

/**
 * Validates if a username follows the expected pattern
 */
export function isValidUsername(username: string): boolean {
  // Basic validation: 3-20 characters, alphanumeric, no spaces
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

/**
 * Formats username with @ prefix for display
 */
export function formatUsername(username: string): string {
  return username.startsWith('@') ? username : `@${username}`
}

/**
 * Removes @ prefix from username for storage
 */
export function cleanUsername(username: string): string {
  return username.startsWith('@') ? username.slice(1) : username
}