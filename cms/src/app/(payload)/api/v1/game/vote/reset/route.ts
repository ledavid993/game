import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/game/payloadGameService'
import type { Game, Vote, PlayerVote } from '@/payload-types'

const SINGLE_GAME_CODE = 'GAME_MAIN'

export async function DELETE(request: NextRequest) {
  try {
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
      message: `Reset complete: deleted ${playerVotesResult.docs.length} player votes and ${votesResult.docs.length} vote records`,
      deletedPlayerVotes: playerVotesResult.docs.length,
      deletedVotes: votesResult.docs.length,
    })
  } catch (error) {
    console.error('Error resetting votes:', error)
    const message = error instanceof Error ? error.message : 'Failed to reset votes'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}