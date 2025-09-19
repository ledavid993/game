import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/game/payloadGameService'
import { AbilityManager } from '@/lib/game/abilities/AbilityManager'
import {
  MurdererKillAbility,
  DetectiveInvestigateAbility,
  ReviverReviveAbility,
  BodyguardProtectAbility,
  VigilanteKillAbility,
  GrinchMimicAbility,
} from '@/lib/game/abilities/RoleAbilities'
import type { Game, GamePlayer } from '@/payload-types'

const SINGLE_GAME_CODE = 'GAME_MAIN'

// Initialize abilities on first use
let abilitiesInitialized = false

function initializeAbilities() {
  if (abilitiesInitialized) return

  const manager = AbilityManager.getInstance()

  // Register all role abilities
  manager.registerAbility('murderer', new MurdererKillAbility())
  manager.registerAbility('detective', new DetectiveInvestigateAbility())
  manager.registerAbility('reviver', new ReviverReviveAbility())
  manager.registerAbility('bodyguard', new BodyguardProtectAbility())
  manager.registerAbility('vigilante', new VigilanteKillAbility())
  manager.registerAbility('troll', new GrinchMimicAbility())

  abilitiesInitialized = true
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')

    if (!playerId) {
      return NextResponse.json({ success: false, error: 'Player ID is required' }, { status: 400 })
    }

    // Initialize abilities
    initializeAbilities()

    const payload = await getPayloadClient()

    // Get the game
    const gameResult = (await payload.find({
      collection: 'games',
      where: { code: { equals: SINGLE_GAME_CODE } },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: Game[] }

    if (gameResult.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 })
    }

    const game = gameResult.docs[0]

    // Get the player
    const playerResult = (await payload.find({
      collection: 'game-players',
      where: {
        game: { equals: game.id },
        playerCode: { equals: playerId }
      },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: GamePlayer[] }

    if (playerResult.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 })
    }

    const player = playerResult.docs[0]

    // Get ability status using AbilityManager
    const manager = AbilityManager.getInstance()

    // Map role to ability name
    const roleToAbilityMap: Record<string, string> = {
      'murderer': 'kill',
      'detective': 'investigate',
      'reviver': 'revive',
      'bodyguard': 'protect',
      'vigilante': 'vigilante_kill',
      'nurse': 'heal',
      'doctor': 'heal',
      'troll': 'grinch_mimic'
    }

    const abilityName = roleToAbilityMap[player.role as string]
    if (!abilityName) {
      return NextResponse.json({
        success: true,
        abilityStatus: { canUse: false, reason: 'No special abilities' },
        player: {
          id: player.playerCode,
          name: player.displayName,
          role: player.role,
          isAlive: player.isAlive,
        }
      })
    }

    const abilityStatus = await manager.canUseAbility(player, game, abilityName)

    return NextResponse.json({
      success: true,
      abilityStatus,
      player: {
        id: player.playerCode,
        name: player.displayName,
        role: player.role,
        isAlive: player.isAlive,
      }
    })

  } catch (error) {
    console.error('Error getting player ability status:', error)
    const message = error instanceof Error ? error.message : 'Failed to get player status'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}