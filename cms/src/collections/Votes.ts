import type { CollectionConfig } from 'payload'

const syncGameFromTarget = async ({ data, req }: any) => {
  if (!data || !req?.payload) return data

  const targetValue = data.target
  if (!targetValue) return data

  const targetId =
    typeof targetValue === 'string'
      ? targetValue
      : typeof targetValue === 'object' && targetValue !== null
        ? targetValue.id ?? targetValue.value
        : undefined

  if (!targetId) return data

  try {
    const targetPlayer = await req.payload.findByID({
      collection: 'game-players',
      id: targetId,
      depth: 0,
    })

    if (targetPlayer?.game) {
      data.game = targetPlayer.game
    }
  } catch (error) {
    req.payload.logger?.error?.('Failed to resolve target player for vote', error)
    throw new Error('Unable to resolve targeted player in this game session')
  }

  return data
}

export const Votes: CollectionConfig = {
  slug: 'votes',
  labels: {
    singular: 'Vote',
    plural: 'Votes',
  },
  admin: {
    useAsTitle: 'target',
    defaultColumns: ['game', 'target', 'count', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    beforeValidate: [syncGameFromTarget],
    beforeChange: [syncGameFromTarget],
  },
  fields: [
    {
      name: 'game',
      type: 'relationship',
      relationTo: 'games',
      required: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Derived automatically from the targeted game session player',
      },
    },
    {
      name: 'target',
      type: 'relationship',
      relationTo: 'game-players',
      required: true,
      index: true,
      admin: {
        description: 'Player in this game session receiving the vote',
      },
    },
    {
      name: 'count',
      type: 'number',
      min: 1,
      defaultValue: 1,
    },
  ],
  timestamps: true,
}
