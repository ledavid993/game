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
        { label: 'Gingerbread', value: 'nurse' },
        { label: 'North Star', value: 'vigilante' },
        { label: 'Arctic Elf', value: 'doctor' },
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
  ],
  timestamps: true,
}
