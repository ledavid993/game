import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/game/payloadGameService'
import type { GamePlayer, PlayerRegistry } from '@/payload-types'
import { ALL_ROLES, type PlayerRole } from '@/app/lib/game/roles'

type PlayerAdminAction = 'change-role' | 'remove' | 'kill'

interface AdminRequestBody {
  playerCode?: string
  action?: PlayerAdminAction
  role?: PlayerRole
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const body = (await request.json()) as AdminRequestBody
    const { playerCode, action, role } = body

    if (!playerCode || !action) {
      return NextResponse.json({ success: false, error: 'playerCode and action are required' }, { status: 400 })
    }

    const gamePlayerResult = (await payload.find({
      collection: 'game-players',
      where: { playerCode: { equals: playerCode } },
      depth: 1,
      limit: 1,
    })) as unknown as { docs: GamePlayer[] }

    if (gamePlayerResult.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 })
    }

    const gamePlayer = gamePlayerResult.docs[0]

    switch (action) {
      case 'change-role': {
        if (!role || !ALL_ROLES.includes(role)) {
          return NextResponse.json({ success: false, error: 'role is required for change-role action' }, { status: 400 })
        }

        const updatedPlayer = (await payload.update({
          collection: 'game-players',
          id: String(gamePlayer.id),
          data: { role },
        })) as unknown as GamePlayer

        return NextResponse.json({ success: true, player: serializeGamePlayer(updatedPlayer) })
      }

      case 'remove': {
        await payload.delete({
          collection: 'game-players',
          id: String(gamePlayer.id),
        })

        return NextResponse.json({ success: true })
      }

      case 'kill': {
        const updatedPlayer = (await payload.update({
          collection: 'game-players',
          id: String(gamePlayer.id),
          data: {
            isAlive: false,
          },
        })) as unknown as GamePlayer

        return NextResponse.json({ success: true, player: serializeGamePlayer(updatedPlayer) })
      }

      default:
        return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Player admin action failed:', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

function serializeGamePlayer(gamePlayer: GamePlayer) {
  const registry = gamePlayer.player as PlayerRegistry | number | undefined

  return {
    id: gamePlayer.playerCode,
    role: gamePlayer.role,
    isAlive: gamePlayer.isAlive,
    playerId: typeof registry === 'object' ? registry.id : null,
    displayName: typeof registry === 'object' ? registry.displayName : null,
  }
}
