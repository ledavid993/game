import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/game/payloadGameService'
import type { Game, GamePlayer } from '@/payload-types'

const SINGLE_GAME_CODE = 'GAME_MAIN'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerCode = searchParams.get('playerCode')

    if (!playerCode) {
      return NextResponse.json({ success: false, error: 'Player code is required' }, { status: 400 })
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

    // Find the player
    const playerResult = (await payload.find({
      collection: 'game-players',
      where: {
        and: [
          { game: { equals: game.id } },
          { playerCode: { equals: playerCode } }
        ]
      },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: GamePlayer[] }

    if (playerResult.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'Player not found in this game' }, { status: 404 })
    }

    const player = playerResult.docs[0]

    // Check if this player has already voted in this game
    const existingPlayerVote = (await payload.find({
      collection: 'player-votes',
      where: {
        and: [
          { game: { equals: game.id } },
          { voter: { equals: player.id } }
        ]
      },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: any[] }

    const hasVoted = existingPlayerVote.docs.length > 0

    return NextResponse.json({
      success: true,
      hasVoted,
      playerCode,
      gameId: game.id,
    })
  } catch (error) {
    console.error('Error checking vote status:', error)
    const message = error instanceof Error ? error.message : 'Failed to check vote status'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}