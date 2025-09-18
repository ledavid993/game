import type { CollectionConfig } from 'payload';

export const PlayerRegistry: CollectionConfig = {
  slug: 'player-registry',
  labels: {
    singular: 'Player',
    plural: 'Player Registry',
  },
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'username', 'phone', 'email', 'updatedAt'],
    description: 'Persistent registry of all players that can be added to games',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the player',
      },
    },
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique username for the player (e.g., MysticRaven)',
      },
    },
    {
      name: 'playerCode',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique player code for game access',
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Optional phone number for notifications',
      },
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        description: 'Optional email address for notifications',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this player is available for games',
      },
    },
    {
      name: 'gamesPlayed',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Total number of games this player has participated in',
      },
    },
  ],
  timestamps: true,
};