import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/game/payloadGameService'
import type { Game, GamePlayer, Vote, PlayerVote } from '@/payload-types'

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
      depth: 1, // Include player registry relationship
      limit: 1,
    })) as unknown as { docs: GamePlayer[] }

    if (targetResult.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'Target not found in this game' }, { status: 404 })
    }

    const target = targetResult.docs[0]

    // Get player name for the message
    let playerName = target.displayName || target.playerCode || 'Unknown Player'
    if (target.player) {
      try {
        const registryPlayerId = typeof target.player === 'string' ? target.player : target.player.id
        const registryPlayer = await payload.findByID({
          collection: 'player-registry',
          id: registryPlayerId,
          depth: 0,
        })
        playerName = registryPlayer.displayName || playerName
      } catch (error) {
        console.warn('Failed to get registry player name:', error)
      }
    }

    // Mark player as eliminated (not alive)
    await payload.update({
      collection: 'game-players',
      id: target.id,
      data: {
        isAlive: false,
      },
    })

    // Delete all player votes for this game
    const playerVotesResult = (await payload.find({
      collection: 'player-votes',
      where: { game: { equals: game.id } },
      depth: 0,
      limit: 1000,
    })) as unknown as { docs: PlayerVote[] }

    for (const playerVote of playerVotesResult.docs) {
      await payload.delete({
        collection: 'player-votes',
        id: playerVote.id,
      })
    }

    // Delete all vote counts for this game
    const votesResult = (await payload.find({
      collection: 'votes',
      where: { game: { equals: game.id } },
      depth: 0,
      limit: 1000,
    })) as unknown as { docs: Vote[] }

    for (const vote of votesResult.docs) {
      await payload.delete({
        collection: 'votes',
        id: vote.id,
      })
    }

    return NextResponse.json({
      success: true,
      message: `${playerName} has been eliminated by majority vote. All votes cleared.`,
      eliminatedPlayer: {
        code: targetCode,
        name: playerName,
      },
      clearedVotes: votesResult.docs.length,
      clearedPlayerVotes: playerVotesResult.docs.length,
    })
  } catch (error) {
    console.error('Error eliminating player:', error)
    const message = error instanceof Error ? error.message : 'Failed to eliminate player'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}