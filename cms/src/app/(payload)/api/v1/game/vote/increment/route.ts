import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/game/payloadGameService'
import type { Game, GamePlayer, Vote } from '@/payload-types'

const SINGLE_GAME_CODE = 'GAME_MAIN'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetCode } = body

    if (!targetCode) {
      return NextResponse.json({ success: false, error: 'Target code is required' }, { status: 400 })
    }

    const payload = await getPayloadClient()

    // Get the game
    const existingGames = (await payload.find({
      collection: 'games',
      where: { code: { equals: SINGLE_GAME_CODE } },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: Game[] }

    if (existingGames.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'No active game session found' }, { status: 404 })
    }

    const game = existingGames.docs[0]

    // Find the target player
    const targetResult = (await payload.find({
      collection: 'game-players',
      where: {
        and: [
          { game: { equals: game.id } },
          { playerCode: { equals: targetCode } }
        ]
      },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: GamePlayer[] }

    if (targetResult.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'Target not found in this game' }, { status: 404 })
    }

    const target = targetResult.docs[0]

    // Find or create vote count record
    const existingVotesResult = (await payload.find({
      collection: 'votes',
      where: {
        and: [
          { game: { equals: game.id } },
          { target: { equals: target.id } }
        ]
      },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: Vote[] }

    let newCount = 1
    if (existingVotesResult.docs.length > 0) {
      // Update existing vote count
      const voteRecord = existingVotesResult.docs[0]
      newCount = (voteRecord.count || 0) + 1
      await payload.update({
        collection: 'votes',
        id: voteRecord.id,
        data: {
          count: newCount,
        },
      })
    } else {
      // Create new vote count record
      await payload.create({
        collection: 'votes',
        data: {
          game: game.id,
          target: target.id,
          count: 1,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Vote added for ${target.displayName || target.playerCode} (Total: ${newCount})`,
      voteCount: newCount,
    })
  } catch (error) {
    console.error('Error incrementing vote:', error)
    const message = error instanceof Error ? error.message : 'Failed to increment vote'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}