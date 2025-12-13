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
import type { PlayerRole } from '@/app/lib/game/roles'
import { addAbilityEvent } from '@/app/lib/game/liveFeedEvents'

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

export async function POST(request: NextRequest) {
  try {
    initializeAbilities()

    const body = await request.json()
    const { playerCode, abilityName, targetCode } = body

    if (!playerCode || !abilityName) {
      return NextResponse.json(
        { success: false, error: 'Player code and ability name are required' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { success: false, error: 'No active game session found' },
        { status: 404 }
      )
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
      depth: 1,
      limit: 1,
    })) as unknown as { docs: GamePlayer[] }

    if (actorResult.docs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Player not found in this game' },
        { status: 404 }
      )
    }

    const actor = actorResult.docs[0]

    if (!actor.isAlive) {
      return NextResponse.json(
        { success: false, error: 'Dead players cannot use abilities' },
        { status: 400 }
      )
    }

    // Find target if specified
    let target: GamePlayer | undefined

    if (targetCode) {
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
        return NextResponse.json(
          { success: false, error: 'Target not found' },
          { status: 404 }
        )
      }

      target = targetResult.docs[0]
    }

    // Check if the ability requires a target
    const manager = AbilityManager.getInstance()
    const ability = manager.getAbility(actor.role as PlayerRole, abilityName)

    if (!ability) {
      return NextResponse.json(
        { success: false, error: `Ability ${abilityName} not found for role ${actor.role}` },
        { status: 400 }
      )
    }

    if (ability.requiresTarget && !target) {
      return NextResponse.json(
        { success: false, error: 'This ability requires a target' },
        { status: 400 }
      )
    }

    // Execute the ability
    const result = await manager.executeAbility(payload, abilityName, actor, game, target)

    // Add event to LiveFeed immediately
    addAbilityEvent(
      actor.displayName,
      abilityName,
      target?.displayName,
      result.success,
      result.success ? undefined : result.message
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data,
        abilityUsed: result.abilityUsed,
        cooldownExpiry: result.cooldownExpiry?.toISOString(),
        targetRole: result.targetRole,
        targetName: result.targetName,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error processing ability:', error)
    const message = error instanceof Error ? error.message : 'Failed to process ability'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    initializeAbilities()

    const { searchParams } = new URL(request.url)
    const playerCode = searchParams.get('playerCode')
    const abilityName = searchParams.get('abilityName')

    if (!playerCode) {
      return NextResponse.json(
        { success: false, error: 'Player code is required' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { success: false, error: 'No active game session found' },
        { status: 404 }
      )
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
      return NextResponse.json(
        { success: false, error: 'Player not found in this game' },
        { status: 404 }
      )
    }

    const player = playerResult.docs[0]
    const manager = AbilityManager.getInstance()

    if (abilityName) {
      // Get status for specific ability
      const status = await manager.canUseAbility(player, game, abilityName)
      const cooldownRemaining = manager.getRemainingCooldown(player, abilityName)
      const usesRemaining = manager.getRemainingUses(player, abilityName)

      return NextResponse.json({
        success: true,
        abilityName,
        canUse: status.canUse,
        reason: status.reason,
        cooldownRemaining,
        usesRemaining,
      })
    } else {
      // Get status for all abilities for this player's role
      const abilities = manager.getAbilitiesForRole(player.role as PlayerRole)
      const abilityStatuses = await Promise.all(
        abilities.map(async (ability) => {
          const status = await manager.canUseAbility(player, game, ability.name)
          const cooldownRemaining = manager.getRemainingCooldown(player, ability.name)
          const usesRemaining = manager.getRemainingUses(player, ability.name)

          return {
            name: ability.name,
            canUse: status.canUse,
            reason: status.reason,
            cooldownRemaining,
            usesRemaining,
            requiresTarget: ability.requiresTarget,
          }
        })
      )

      return NextResponse.json({
        success: true,
        playerRole: player.role,
        abilities: abilityStatuses,
      })
    }
  } catch (error) {
    console.error('Error getting ability status:', error)
    const message = error instanceof Error ? error.message : 'Failed to get ability status'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}