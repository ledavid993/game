import type { CollectionConfig } from 'payload';

export const Games: CollectionConfig = {
  slug: 'games',
  labels: {
    singular: 'Game Session',
    plural: 'Game Sessions',
  },
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'status', 'murdererCount', 'cooldownMinutes', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'lobby',
      options: [
        { label: 'Lobby', value: 'lobby' },
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'hostSocketId',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'settings',
      type: 'group',
      fields: [
        {
          name: 'cooldownMinutes',
          type: 'number',
          required: true,
          defaultValue: 10,
          min: 0,
        },
        {
          name: 'maxPlayers',
          type: 'number',
          required: true,
          defaultValue: 20,
          min: 3,
        },
        {
          name: 'murdererCount',
          type: 'number',
          required: true,
          defaultValue: 2,
          min: 1,
        },
        {
          name: 'theme',
          type: 'select',
          defaultValue: 'christmas',
          options: [
            { label: 'Christmas', value: 'christmas' },
            { label: 'Halloween', value: 'halloween' },
          ],
        },
      ],
    },
    {
      name: 'startedAt',
      type: 'date',
    },
    {
      name: 'endedAt',
      type: 'date',
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
