import type { CollectionConfig } from 'payload'

export const GamePlayers: CollectionConfig = {
  slug: 'game-players',
  labels: {
    singular: 'Game Player',
    plural: 'Game Players',
  },
  admin: {
    useAsTitle: 'playerCode',
    defaultColumns: ['player', 'playerCode', 'role', 'isAlive', 'game', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'game',
      type: 'relationship',
      relationTo: 'games',
      required: true,
      index: true,
    },
    {
      name: 'player',
      type: 'relationship',
      relationTo: 'player-registry',
      required: true,
      index: true,
      admin: {
        description: 'Reference to the player in the registry',
      },
    },
    {
      name: 'joinedAt',
      type: 'date',
      hooks: {
        beforeChange: [({ value }) => value ?? new Date().toISOString()],
      },
    },
    {
      name: 'playerCode',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique code for this player in this specific game session',
      },
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'civilian',
      options: [
        { label: 'Snowbound', value: 'civilian' },
        { label: 'Krampus', value: 'murderer' },
        { label: 'Sugarplum', value: 'reviver' },
        { label: 'Candy Cane', value: 'detective' },
        { label: 'Nutcracker', value: 'bodyguard' },
        { label: 'North Star', value: 'vigilante' },
        { label: 'The Grinch', value: 'troll' },
      ],
    },
    {
      name: 'isAlive',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'deviceType',
      type: 'select',
      options: [
        { label: 'Unknown', value: 'unknown' },
        { label: 'Mobile', value: 'mobile' },
        { label: 'Desktop', value: 'desktop' },
        { label: 'TV', value: 'tv' },
      ],
      defaultValue: 'unknown',
    },
    {
      name: 'socketId',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'cooldownExpiresAt',
      type: 'date',
    },
    {
      name: 'lastKillAt',
      type: 'date',
    },
    {
      name: 'kills',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'cardRevealsRemaining',
      type: 'number',
      defaultValue: 3,
      min: 0,
      admin: {
        description: 'Number of times this player can still reveal their card (flip it back to mystery)',
      },
    },
    {
      name: 'isCardRevealed',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether the card is currently showing the role (true) or mystery side (false)',
      },
    },
    {
      name: 'abilityUses',
      type: 'json',
      defaultValue: {},
      admin: {
        description: 'Tracks ability usage count per type (e.g., {"investigate": 2, "revive": 1})',
      },
    },
    {
      name: 'abilityCooldowns',
      type: 'json',
      defaultValue: {},
      admin: {
        description: 'Tracks cooldown expiry timestamps per ability type',
      },
    },
    {
      name: 'protectedBy',
      type: 'relationship',
      relationTo: 'game-players',
      admin: {
        description: 'Player who is currently protecting this player (bodyguard)',
      },
    },
    {
      name: 'investigatedPlayers',
      type: 'array',
      fields: [
        {
          name: 'playerCode',
          type: 'text',
          required: true,
        },
        {
          name: 'investigatedAt',
          type: 'date',
          required: true,
        },
      ],
      admin: {
        description: 'List of players investigated by this detective',
      },
    },
    {
      name: 'revivedPlayers',
      type: 'array',
      fields: [
        {
          name: 'playerCode',
          type: 'text',
          required: true,
        },
        {
          name: 'revivedAt',
          type: 'date',
          required: true,
        },
      ],
      admin: {
        description: 'List of players revived by this reviver',
      },
    },
    {
      name: 'vigilanteKills',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Number of vigilante kills used',
      },
    },
    {
      name: 'grinchMimickedPlayers',
      type: 'array',
      fields: [
        {
          name: 'playerCode',
          type: 'text',
          required: true,
        },
        {
          name: 'mimickedAbility',
          type: 'text',
          required: true,
        },
        {
          name: 'mimickedAt',
          type: 'date',
          required: true,
        },
      ],
      admin: {
        description: 'List of players whose abilities were mimicked by this grinch',
      },
    },
    {
      name: 'lastAbilityUsedAt',
      type: 'date',
      admin: {
        description: 'Timestamp of when this player last used any ability',
      },
    },
    {
      name: 'protectionExpiresAt',
      type: 'date',
      admin: {
        description: 'When bodyguard protection expires for this player',
      },
    },
    {
      name: 'smsSent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the game URL SMS has been sent to this player',
      },
    },
    {
      name: 'smsSentAt',
      type: 'date',
      admin: {
        description: 'When the game URL SMS was sent to this player',
      },
    },
  ],
  timestamps: true,
}
