import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/game/payloadGameService'
import type { Game, GamePlayer, Vote } from '@/payload-types'

const SINGLE_GAME_CODE = 'GAME_MAIN'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetCode, voterCode } = body

    if (!targetCode) {
      return NextResponse.json({ success: false, error: 'Target code is required' }, { status: 400 })
    }

    if (!voterCode) {
      return NextResponse.json({ success: false, error: 'Voter code is required' }, { status: 400 })
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

    // Find the voter player
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

    if (voterResult.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'Voter not found in this game' }, { status: 404 })
    }

    const voter = voterResult.docs[0]

    // Check if voter is alive
    if (!voter.isAlive) {
      return NextResponse.json({ success: false, error: 'Dead players cannot vote' }, { status: 400 })
    }

    // Check if this voter has already voted in this game
    const existingPlayerVote = (await payload.find({
      collection: 'player-votes',
      where: {
        and: [
          { game: { equals: game.id } },
          { voter: { equals: voter.id } }
        ]
      },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: any[] }

    if (existingPlayerVote.docs.length > 0) {
      return NextResponse.json({ success: false, error: 'You have already voted in this round' }, { status: 400 })
    }

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

    // Check if target is alive
    if (!target.isAlive) {
      return NextResponse.json({ success: false, error: 'Cannot vote for eliminated players' }, { status: 400 })
    }

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

    // Create individual player vote record
    await payload.create({
      collection: 'player-votes',
      data: {
        game: game.id,
        voter: voter.id,
        target: target.id,
      },
    })

    // Check if player has reached 70% of alive players (elimination threshold)
    const alivePlayersResult = (await payload.find({
      collection: 'game-players',
      where: {
        and: [
          { game: { equals: game.id } },
          { isAlive: { equals: true } }
        ]
      },
      depth: 0,
      limit: 1000,
    })) as unknown as { docs: GamePlayer[] }

    const aliveCount = alivePlayersResult.docs.length
    const eliminationThreshold = Math.ceil(aliveCount * 0.7) // 70% threshold

    if (newCount >= eliminationThreshold && aliveCount > 0) {
      // Get player name for elimination message
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

      // Eliminate the player
      await payload.update({
        collection: 'game-players',
        id: target.id,
        data: {
          isAlive: false,
        },
      })

      // Clear all votes
      const allVotesResult = (await payload.find({
        collection: 'votes',
        where: { game: { equals: game.id } },
        depth: 0,
        limit: 1000,
      })) as unknown as { docs: Vote[] }

      for (const vote of allVotesResult.docs) {
        await payload.delete({
          collection: 'votes',
          id: vote.id,
        })
      }

      const allPlayerVotesResult = (await payload.find({
        collection: 'player-votes',
        where: { game: { equals: game.id } },
        depth: 0,
        limit: 1000,
      })) as unknown as { docs: any[] }

      for (const playerVote of allPlayerVotesResult.docs) {
        await payload.delete({
          collection: 'player-votes',
          id: playerVote.id,
        })
      }

      return NextResponse.json({
        success: true,
        eliminated: true,
        message: `${playerName} eliminated by majority vote (${newCount}/${aliveCount} votes = ${Math.round((newCount/aliveCount)*100)}%). All votes cleared.`,
        eliminatedPlayer: {
          code: targetCode,
          name: playerName,
          percentage: Math.round((newCount/aliveCount)*100),
        },
        voteCount: newCount,
        threshold: eliminationThreshold,
        aliveCount: aliveCount,
      })
    }

    return NextResponse.json({
      success: true,
      eliminated: false,
      message: `Vote added for ${target.displayName || target.playerCode} (${newCount}/${aliveCount} = ${Math.round((newCount/aliveCount)*100)}%)`,
      voteCount: newCount,
      percentage: aliveCount > 0 ? Math.round((newCount/aliveCount)*100) : 0,
      threshold: eliminationThreshold,
      aliveCount: aliveCount,
    })
  } catch (error) {
    console.error('Error incrementing vote:', error)
    const message = error instanceof Error ? error.message : 'Failed to increment vote'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}