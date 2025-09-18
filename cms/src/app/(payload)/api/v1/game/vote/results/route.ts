import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/game/payloadGameService'
import type { Game, Vote, GamePlayer } from '@/payload-types'

const SINGLE_GAME_CODE = 'GAME_MAIN'

export async function GET(request: NextRequest) {
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
      return NextResponse.json({
        success: true,
        votes: [],
        message: 'No active game session found'
      })
    }

    const game = existingGames.docs[0]

    // Get all votes for this game with target player information
    const votesResult = (await payload.find({
      collection: 'votes',
      where: { game: { equals: game.id } },
      depth: 1, // Include target relationship
      limit: 1000,
      sort: '-count', // Sort by count descending
    })) as unknown as { docs: Vote[] }

    // Transform the results
    const voteResults = await Promise.all(
      votesResult.docs.map(async (vote) => {
        let targetName = 'Unknown Player'
        let targetId = 'unknown'

        // Get target player details
        if (vote.target) {
          const targetPlayerId = typeof vote.target === 'string' ? vote.target : vote.target.id

          try {
            const targetPlayer = await payload.findByID({
              collection: 'game-players',
              id: targetPlayerId,
              depth: 0,
            }) as GamePlayer

            targetName = targetPlayer.displayName || targetPlayer.playerCode || 'Unknown Player'
            targetId = targetPlayer.playerCode || targetPlayerId
          } catch (error) {
            console.warn('Failed to get target player details:', error)
            targetId = targetPlayerId
          }
        }

        return {
          targetId,
          targetName,
          count: vote.count || 0,
        }
      })
    )

    // Filter out votes with 0 count and sort by count descending
    const filteredResults = voteResults
      .filter(result => result.count > 0)
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      votes: filteredResults,
      totalVotes: filteredResults.reduce((sum, vote) => sum + vote.count, 0),
    })
  } catch (error) {
    console.error('Error fetching voting results:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch voting results'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}