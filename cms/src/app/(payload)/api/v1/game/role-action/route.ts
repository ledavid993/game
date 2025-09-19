import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/game/payloadGameService'
import type { Game, GamePlayer, PlayerRegistry } from '@/payload-types'

const SINGLE_GAME_CODE = 'GAME_MAIN'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameCode, playerCode, action, targetCode } = body

    if (!playerCode || !action) {
      return NextResponse.json({ success: false, error: 'Player code and action are required' }, { status: 400 })
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

    // Find the acting player
    const actorResult = (await payload.find({
      collection: 'game-players',
      where: {
        and: [
          { game: { equals: game.id } },
          { playerCode: { equals: playerCode } }
        ]
      },
      depth: 1, // Include player registry relationship
      limit: 1,
    })) as unknown as { docs: GamePlayer[] }

    if (actorResult.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'Player not found in this game' }, { status: 404 })
    }

    const actor = actorResult.docs[0]

    if (!actor.isAlive) {
      return NextResponse.json({ success: false, error: 'Dead players cannot use abilities' }, { status: 400 })
    }

    // Get actor's name for messages
    let actorName = actor.displayName || actor.playerCode || 'Unknown Player'
    if (actor.player) {
      try {
        const registryPlayerId = typeof actor.player === 'string' ? actor.player : actor.player.id
        const registryPlayer = await payload.findByID({
          collection: 'player-registry',
          id: registryPlayerId,
          depth: 0,
        }) as PlayerRegistry
        actorName = registryPlayer.displayName || actorName
      } catch (error) {
        console.warn('Failed to get actor registry name:', error)
      }
    }

    // Handle different role actions
    switch (action) {
      case 'investigate': {
        if (actor.role !== 'detective') {
          return NextResponse.json({ success: false, error: 'Only detectives can investigate' }, { status: 403 })
        }

        if (!targetCode) {
          return NextResponse.json({ success: false, error: 'Target required for investigation' }, { status: 400 })
        }

        // Find target player
        const targetResult = (await payload.find({
          collection: 'game-players',
          where: {
            and: [
              { game: { equals: game.id } },
              { playerCode: { equals: targetCode } }
            ]
          },
          depth: 1,
          limit: 1,
        })) as unknown as { docs: GamePlayer[] }

        if (targetResult.docs.length === 0) {
          return NextResponse.json({ success: false, error: 'Target not found' }, { status: 404 })
        }

        const target = targetResult.docs[0]
        let targetName = target.displayName || target.playerCode || 'Unknown Player'

        if (target.player) {
          try {
            const registryPlayerId = typeof target.player === 'string' ? target.player : target.player.id
            const registryPlayer = await payload.findByID({
              collection: 'player-registry',
              id: registryPlayerId,
              depth: 0,
            }) as PlayerRegistry
            targetName = registryPlayer.displayName || targetName
          } catch (error) {
            console.warn('Failed to get target registry name:', error)
          }
        }

        const roleLabel = {
          'murderer': 'Krampus (MURDERER)',
          'civilian': 'Snowbound (Civilian)',
          'detective': 'Candy Cane (Detective)',
          'reviver': 'Sugarplum (Reviver)',
          'bodyguard': 'Nutcracker (Bodyguard)',
          'nurse': 'Gingerbread (Nurse)',
          'vigilante': 'North Star (Vigilante)',
          'doctor': 'Arctic Elf (Doctor)',
        }[target.role] || target.role

        return NextResponse.json({
          success: true,
          message: `Investigation complete: ${targetName} is ${roleLabel}`,
          investigationResult: {
            targetName,
            targetRole: target.role,
            roleLabel,
          }
        })
      }

      case 'revive': {
        if (actor.role !== 'reviver') {
          return NextResponse.json({ success: false, error: 'Only revivers can revive players' }, { status: 403 })
        }

        if (!targetCode) {
          return NextResponse.json({ success: false, error: 'Target required for revival' }, { status: 400 })
        }

        // Find target player
        const targetResult = (await payload.find({
          collection: 'game-players',
          where: {
            and: [
              { game: { equals: game.id } },
              { playerCode: { equals: targetCode } }
            ]
          },
          depth: 1,
          limit: 1,
        })) as unknown as { docs: GamePlayer[] }

        if (targetResult.docs.length === 0) {
          return NextResponse.json({ success: false, error: 'Target not found' }, { status: 404 })
        }

        const target = targetResult.docs[0]

        if (target.isAlive) {
          return NextResponse.json({ success: false, error: 'Target is already alive' }, { status: 400 })
        }

        let targetName = target.displayName || target.playerCode || 'Unknown Player'
        if (target.player) {
          try {
            const registryPlayerId = typeof target.player === 'string' ? target.player : target.player.id
            const registryPlayer = await payload.findByID({
              collection: 'player-registry',
              id: registryPlayerId,
              depth: 0,
            }) as PlayerRegistry
            targetName = registryPlayer.displayName || targetName
          } catch (error) {
            console.warn('Failed to get target registry name:', error)
          }
        }

        // Revive the player
        await payload.update({
          collection: 'game-players',
          id: target.id,
          data: { isAlive: true },
        })

        return NextResponse.json({
          success: true,
          message: `${targetName} has been revived by ${actorName}! They return to the manor.`,
        })
      }

      case 'protect': {
        if (actor.role !== 'bodyguard') {
          return NextResponse.json({ success: false, error: 'Only bodyguards can protect players' }, { status: 403 })
        }

        if (!targetCode) {
          return NextResponse.json({ success: false, error: 'Target required for protection' }, { status: 400 })
        }

        // Find target player
        const targetResult = (await payload.find({
          collection: 'game-players',
          where: {
            and: [
              { game: { equals: game.id } },
              { playerCode: { equals: targetCode } }
            ]
          },
          depth: 1,
          limit: 1,
        })) as unknown as { docs: GamePlayer[] }

        if (targetResult.docs.length === 0) {
          return NextResponse.json({ success: false, error: 'Target not found' }, { status: 404 })
        }

        const target = targetResult.docs[0]

        if (!target.isAlive) {
          return NextResponse.json({ success: false, error: 'Cannot protect eliminated players' }, { status: 400 })
        }

        let targetName = target.displayName || target.playerCode || 'Unknown Player'
        if (target.player) {
          try {
            const registryPlayerId = typeof target.player === 'string' ? target.player : target.player.id
            const registryPlayer = await payload.findByID({
              collection: 'player-registry',
              id: registryPlayerId,
              depth: 0,
            }) as PlayerRegistry
            targetName = registryPlayer.displayName || targetName
          } catch (error) {
            console.warn('Failed to get target registry name:', error)
          }
        }

        // For now, just return success message. In a full implementation,
        // you'd store the protection status somewhere
        return NextResponse.json({
          success: true,
          message: `${targetName} is now under your protection for this round.`,
        })
      }

      case 'vigilante_kill': {
        if (actor.role !== 'vigilante') {
          return NextResponse.json({ success: false, error: 'Only vigilantes can use this ability' }, { status: 403 })
        }

        if (!targetCode) {
          return NextResponse.json({ success: false, error: 'Target required for elimination' }, { status: 400 })
        }

        // Find target player
        const targetResult = (await payload.find({
          collection: 'game-players',
          where: {
            and: [
              { game: { equals: game.id } },
              { playerCode: { equals: targetCode } }
            ]
          },
          depth: 1,
          limit: 1,
        })) as unknown as { docs: GamePlayer[] }

        if (targetResult.docs.length === 0) {
          return NextResponse.json({ success: false, error: 'Target not found' }, { status: 404 })
        }

        const target = targetResult.docs[0]

        if (!target.isAlive) {
          return NextResponse.json({ success: false, error: 'Target is already eliminated' }, { status: 400 })
        }

        let targetName = target.displayName || target.playerCode || 'Unknown Player'
        if (target.player) {
          try {
            const registryPlayerId = typeof target.player === 'string' ? target.player : target.player.id
            const registryPlayer = await payload.findByID({
              collection: 'player-registry',
              id: registryPlayerId,
              depth: 0,
            }) as PlayerRegistry
            targetName = registryPlayer.displayName || targetName
          } catch (error) {
            console.warn('Failed to get target registry name:', error)
          }
        }

        // Check if target is actually a murderer
        if (target.role === 'murderer') {
          // Success - eliminate the murderer
          await payload.update({
            collection: 'game-players',
            id: target.id,
            data: { isAlive: false },
          })

          return NextResponse.json({
            success: true,
            message: `Success! ${targetName} was indeed a murderer and has been eliminated.`,
          })
        } else {
          // Failed - eliminate the vigilante instead
          await payload.update({
            collection: 'game-players',
            id: actor.id,
            data: { isAlive: false },
          })

          return NextResponse.json({
            success: true,
            message: `You were wrong! ${targetName} was innocent. You have been eliminated for your mistake.`,
          })
        }
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing role action:', error)
    const message = error instanceof Error ? error.message : 'Failed to process role action'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}