import type { CollectionConfig } from 'payload'

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
      name: 'hostDisplayName',
      type: 'text',
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
          defaultValue: 100,
          min: 1,
          max: 1000,
          admin: {
            description: 'Maximum number of players allowed in the game (1-1000)',
          },
        },
        {
          name: 'murdererCount',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 1,
          admin: {
            description: 'Legacy field - use roleDistribution instead',
          },
        },
        {
          name: 'roleDistribution',
          type: 'group',
          fields: [
            {
              name: 'murderers',
              type: 'number',
              required: true,
              defaultValue: 1,
              min: 1,
              admin: {
                description: 'Number of murderers in the game',
              },
            },
            {
              name: 'detectives',
              type: 'number',
              required: true,
              defaultValue: 0,
              min: 0,
              admin: {
                description: 'Number of detectives in the game',
              },
            },
            {
              name: 'revivers',
              type: 'number',
              required: true,
              defaultValue: 0,
              min: 0,
              admin: {
                description: 'Number of revivers in the game',
              },
            },
            {
              name: 'bodyguards',
              type: 'number',
              required: true,
              defaultValue: 0,
              min: 0,
              admin: {
                description: 'Number of bodyguards in the game',
              },
            },
            {
              name: 'vigilantes',
              type: 'number',
              required: true,
              defaultValue: 0,
              min: 0,
              admin: {
                description: 'Number of vigilantes in the game',
              },
            },
            {
              name: 'nurses',
              type: 'number',
              required: true,
              defaultValue: 0,
              min: 0,
              admin: {
                description: 'Number of nurses in the game',
              },
            },
            {
              name: 'doctors',
              type: 'number',
              required: true,
              defaultValue: 0,
              min: 0,
              admin: {
                description: 'Number of doctors in the game',
              },
            },
            {
              name: 'trolls',
              type: 'number',
              required: true,
              defaultValue: 0,
              min: 0,
              admin: {
                description: 'Number of grinch/trolls in the game',
              },
            },
          ],
          admin: {
            description: 'Configure the number of each role in the game. Civilians will fill remaining slots.',
          },
        },
        {
          name: 'roleCooldowns',
          type: 'group',
          fields: [
            {
              name: 'murdererKillCooldown',
              type: 'number',
              required: true,
              defaultValue: 10,
              min: 0,
              max: 60,
              admin: {
                description: 'Cooldown in minutes between murderer kills',
              },
            },
            {
              name: 'detectiveInvestigateCooldown',
              type: 'number',
              required: true,
              defaultValue: 5,
              min: 0,
              max: 60,
              admin: {
                description: 'Cooldown in minutes between detective investigations',
              },
            },
            {
              name: 'reviverReviveCooldown',
              type: 'number',
              required: true,
              defaultValue: 15,
              min: 0,
              max: 60,
              admin: {
                description: 'Cooldown in minutes between reviver abilities',
              },
            },
            {
              name: 'bodyguardProtectionDuration',
              type: 'number',
              required: true,
              defaultValue: 30,
              min: 5,
              max: 120,
              admin: {
                description: 'How long bodyguard protection lasts in minutes',
              },
            },
            {
              name: 'vigilanteMaxKills',
              type: 'number',
              required: true,
              defaultValue: 1,
              min: 0,
              max: 10,
              admin: {
                description: 'Maximum number of kills a vigilante can make',
              },
            },
            {
              name: 'nurseHealCooldown',
              type: 'number',
              required: true,
              defaultValue: 20,
              min: 0,
              max: 60,
              admin: {
                description: 'Cooldown in minutes between nurse healing abilities',
              },
            },
            {
              name: 'doctorHealCooldown',
              type: 'number',
              required: true,
              defaultValue: 25,
              min: 0,
              max: 60,
              admin: {
                description: 'Cooldown in minutes between doctor healing abilities',
              },
            },
            {
              name: 'trollMimicCooldown',
              type: 'number',
              required: true,
              defaultValue: 10,
              min: 0,
              max: 60,
              admin: {
                description: 'Cooldown in minutes between grinch mimic abilities',
              },
            },
          ],
          admin: {
            description: 'Configure individual ability cooldowns for each role',
          },
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
      name: 'killEvents',
      type: 'array',
      fields: [
        {
          name: 'eventId',
          type: 'text',
          required: true,
        },
        {
          name: 'murdererName',
          type: 'text',
        },
        {
          name: 'victimName',
          type: 'text',
        },
        {
          name: 'timestamp',
          type: 'date',
          required: true,
        },
        {
          name: 'message',
          type: 'text',
        },
        {
          name: 'successful',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
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
}
