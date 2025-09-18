import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/game/payloadGameService'
import type { Game, GamePlayer, Vote, PlayerVote } from '@/payload-types'

const SINGLE_GAME_CODE = 'GAME_MAIN'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { voterCode, targetCode } = body

    if (!voterCode || !targetCode) {
      return NextResponse.json({ success: false, error: 'Voter and target codes are required' }, { status: 400 })
    }

    if (voterCode === targetCode) {
      return NextResponse.json({ success: false, error: 'Players cannot vote for themselves' }, { status: 400 })
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

    // Find the voter and target players
    const voterResult = (await payload.find({
      collection: 'game-players',
      where: {
        and: [
          { game: { equals: game.id } },
          { playerCode: { equals: voterCode } }
        ]
      },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: GamePlayer[] }

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

    if (voterResult.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'Voter not found in this game' }, { status: 404 })
    }

    if (targetResult.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'Target not found in this game' }, { status: 404 })
    }

    const voter = voterResult.docs[0]
    const target = targetResult.docs[0]

    // Check if voter has already voted
    const existingVoteResult = (await payload.find({
      collection: 'player-votes',
      where: {
        and: [
          { game: { equals: game.id } },
          { voter: { equals: voter.id } }
        ]
      },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: PlayerVote[] }

    if (existingVoteResult.docs.length > 0) {
      return NextResponse.json({ success: false, error: 'Player has already voted. Only one vote per player allowed.' }, { status: 400 })
    }

    // Create the player vote record
    await payload.create({
      collection: 'player-votes',
      data: {
        game: game.id,
        voter: voter.id,
        target: target.id,
      },
    })

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

    if (existingVotesResult.docs.length > 0) {
      // Update existing vote count
      const voteRecord = existingVotesResult.docs[0]
      await payload.update({
        collection: 'votes',
        id: voteRecord.id,
        data: {
          count: (voteRecord.count || 0) + 1,
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
      message: `Vote recorded for ${target.displayName || target.playerCode}`,
    })
  } catch (error) {
    console.error('Error recording vote:', error)
    const message = error instanceof Error ? error.message : 'Failed to record vote'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}