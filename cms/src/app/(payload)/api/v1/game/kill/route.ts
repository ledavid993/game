import { NextRequest, NextResponse } from 'next/server'
import { GameManager } from '@/app/(frontend)/lib/game/GameManager'
import { broadcastToGame } from '@/app/(frontend)/lib/game/socket'

interface KillRequest {
  murderer: string
  victim: string
}

export async function POST(request: NextRequest) {
  try {
    const body: KillRequest = await request.json()
    const { murderer, victim } = body

    // Validate request
    if (!murderer || !victim) {
      return NextResponse.json({ error: 'Murderer and victim IDs are required' }, { status: 400 })
    }

    if (typeof murderer !== 'string' || typeof victim !== 'string') {
      return NextResponse.json({ error: 'Murderer and victim must be strings' }, { status: 400 })
    }

    const gameManager = GameManager.getInstance()
    const result = gameManager.killPlayer(murderer, victim)

    if (result.success && result.killEvent) {
      // Broadcast kill event to all players
      broadcastToGame('player-killed', result.killEvent)

      // Send updated game state
      const gameState = gameManager.getGameState()
      broadcastToGame('game-state', gameState)

      // Check if game ended
      if (!gameState.isActive && gameState.endTime) {
        const stats = gameManager.getGameStats()
        const winner = gameState.killEvents[gameState.killEvents.length - 1]?.message.includes(
          'MURDERERS',
        )
          ? 'murderers'
          : 'civilians'
        broadcastToGame('game-ended', winner)
      }
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      cooldownRemaining: result.cooldownRemaining,
      killEvent: result.killEvent,
    })
  } catch (error: any) {
    console.error('Error processing kill:', error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Kill attempt failed',
        code: error.code || 'UNKNOWN_ERROR',
      },
      { status: error.statusCode || 500 },
    )
  }
}

// Get cooldown status for a player
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
    }

    const gameManager = GameManager.getInstance()
    const cooldownStatus = gameManager.getCooldownStatus(playerId)
    const availableTargets = gameManager.getAvailableTargets(playerId)

    return NextResponse.json({
      cooldownStatus,
      availableTargets,
      canKill: cooldownStatus.canKill,
    })
  } catch (error: any) {
    console.error('Error getting cooldown status:', error)

    return NextResponse.json({ error: 'Failed to get cooldown status' }, { status: 500 })
  }
}
