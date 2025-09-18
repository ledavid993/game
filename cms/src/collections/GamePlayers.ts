import type { CollectionConfig } from 'payload';

export const GamePlayers: CollectionConfig = {
  slug: 'game-players',
  labels: {
    singular: 'Game Player',
    plural: 'Game Players',
  },
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'role', 'isAlive', 'game', 'updatedAt'],
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
      name: 'joinedAt',
      type: 'date',
      hooks: {
        beforeChange: [({ value }) => value ?? new Date().toISOString()],
      },
    },
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    {
      name: 'playerCode',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'civilian',
      options: [
        { label: 'Civilian', value: 'civilian' },
        { label: 'Murderer', value: 'murderer' },
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
};
