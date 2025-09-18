import type { CollectionConfig } from 'payload'

const syncGameFromVoter = async ({ data, req }: any) => {
  if (!data || !req?.payload) return data

  const voterValue = data.voter
  if (!voterValue) return data

  const voterId =
    typeof voterValue === 'string'
      ? voterValue
      : typeof voterValue === 'object' && voterValue !== null
        ? voterValue.id ?? voterValue.value
        : undefined

  if (!voterId) return data

  try {
    const voterPlayer = await req.payload.findByID({
      collection: 'game-players',
      id: voterId,
      depth: 0,
    })

    if (voterPlayer?.game) {
      data.game = voterPlayer.game
    }
  } catch (error) {
    req.payload.logger?.error?.('Failed to resolve voter player for vote relation', error)
    throw new Error('Unable to resolve voter player in this game session')
  }

  return data
}

export const PlayerVotes: CollectionConfig = {
  slug: 'player-votes',
  labels: {
    singular: 'Player Vote',
    plural: 'Player Votes',
  },
  admin: {
    useAsTitle: 'voter',
    defaultColumns: ['game', 'voter', 'target', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    beforeValidate: [syncGameFromVoter],
    beforeChange: [syncGameFromVoter],
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
        description: 'Derived automatically from the voter game session player',
      },
    },
    {
      name: 'voter',
      type: 'relationship',
      relationTo: 'game-players',
      required: true,
      index: true,
      admin: {
        description: 'Player who cast the vote',
      },
    },
    {
      name: 'target',
      type: 'relationship',
      relationTo: 'game-players',
      required: true,
      index: true,
      admin: {
        description: 'Player receiving the vote',
      },
    },
  ],
  timestamps: true,
}