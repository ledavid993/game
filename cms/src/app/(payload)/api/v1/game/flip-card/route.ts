import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { playerCode, gameCode } = await request.json()

    if (!playerCode || !gameCode) {
      return NextResponse.json(
        { success: false, message: 'Player code and game code are required' },
        { status: 400 }
      )
    }

    // Find the game
    const games = await payload.find({
      collection: 'games',
      where: {
        code: {
          equals: gameCode,
        },
      },
      limit: 1,
    })

    if (games.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Game not found' },
        { status: 404 }
      )
    }

    const game = games.docs[0]

    // Find the game player
    const gamePlayers = await payload.find({
      collection: 'game-players',
      where: {
        and: [
          {
            game: {
              equals: game.id,
            },
          },
          {
            playerCode: {
              equals: playerCode,
            },
          },
        ],
      },
      limit: 1,
    })

    if (gamePlayers.docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Player not found in this game' },
        { status: 404 }
      )
    }

    const gamePlayer = gamePlayers.docs[0]

    // Check current card state and reveals remaining
    const revealsRemaining = gamePlayer.cardRevealsRemaining ?? 3
    const isCurrentlyRevealed = gamePlayer.isCardRevealed ?? false

    // If trying to hide the card (flip to mystery) but no reveals remaining
    if (isCurrentlyRevealed && revealsRemaining <= 0) {
      return NextResponse.json(
        { success: false, message: 'No more reveals remaining - card is locked in revealed state' },
        { status: 400 }
      )
    }

    // Toggle the card state and decrement reveals remaining when hiding the card
    const newRevealedState = !isCurrentlyRevealed
    const newRevealsRemaining = newRevealedState ? revealsRemaining : Math.max(revealsRemaining - 1, 0)

    // Update the game player
    await payload.update({
      collection: 'game-players',
      id: gamePlayer.id,
      data: {
        isCardRevealed: newRevealedState,
        cardRevealsRemaining: newRevealsRemaining,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Card flipped successfully',
      data: {
        isCardRevealed: newRevealedState,
        cardRevealsRemaining: newRevealsRemaining,
      },
    })
  } catch (error) {
    console.error('Error flipping card:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}