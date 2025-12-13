import type { Payload } from 'payload'
import type { GamePlayer, Game, PlayerRegistry } from '@/payload-types'
import type {
  AbilityResult,
  AbilityStatus,
  RoleAbility,
  DetectiveInvestigationResult,
  ReviverResult,
  ProtectionResult,
  VigilanteResult,
  GrinchMimicResult,
  GameAbilitySettings,
} from './types'
import { ABILITY_TYPES } from './types'
import type { PlayerRole } from '@/app/lib/game/roles'
import { isMurdererRole } from '@/app/lib/game/roles'
import { getPayloadClient } from '../payloadGameService'

export class MurdererKillAbility implements RoleAbility {
  name = ABILITY_TYPES.KILL
  role: PlayerRole = 'murderer'
  cooldownMinutes = 10
  requiresTarget = true

  async canUse(actor: GamePlayer, game: Game): Promise<AbilityStatus> {
    if (!actor.isAlive) {
      return { canUse: false, reason: 'Dead players cannot kill' }
    }

    const settings = game.settings as GameAbilitySettings
    const cooldownMs = (settings?.cooldownMinutes || this.cooldownMinutes) * 60 * 1000

    if (actor.lastKillAt) {
      const timeSinceLastKill = Date.now() - new Date(actor.lastKillAt).getTime()
      if (timeSinceLastKill < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastKill) / 1000)
        return {
          canUse: false,
          reason: `Wait ${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s before killing again`,
          cooldownRemaining: remainingSeconds
        }
      }
    }

    return { canUse: true }
  }

  async execute(actor: GamePlayer, game: Game, target?: GamePlayer): Promise<AbilityResult> {
    if (!target) {
      return { success: false, message: 'Target is required for kill ability' }
    }

    if (!target.isAlive) {
      return { success: false, message: 'Target is already dead' }
    }

    if (actor.playerCode === target.playerCode) {
      return { success: false, message: 'Cannot kill yourself' }
    }

    // Check if target is protected by bodyguard
    if (target.protectedBy && target.protectionExpiresAt) {
      const now = new Date()
      const protectionExpiry = new Date(target.protectionExpiresAt)
      if (now < protectionExpiry) {
        const payload = await getPayloadClient()
        const targetName = await this.getPlayerName(target)
        const actorName = await this.getPlayerName(actor)

        // Create failed kill event
        const killEvent = {
          id: `kill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          eventId: `kill_${Date.now()}`,
          murdererName: actorName,
          victimName: targetName,
          timestamp: new Date().toISOString(),
          message: `${actorName} attempted to eliminate ${targetName} but they were protected`,
          successful: false,
        }

        // Add kill event to game
        await payload.update({
          collection: 'games',
          id: game.id,
          data: {
            killEvents: [...(game.killEvents || []), killEvent],
          },
        })

        // Don't reveal WHY the kill failed - just say it failed
        return { success: false, message: 'Your target slipped away into the shadows...' }
      }
    }

    const payload = await getPayloadClient()

    // Kill the target
    await payload.update({
      collection: 'game-players',
      id: target.id,
      data: { isAlive: false },
    })

    // Update murderer's cooldown
    const settings = game.settings as GameAbilitySettings
    const cooldownMs = (settings?.cooldownMinutes || this.cooldownMinutes) * 60 * 1000
    const cooldownExpiry = new Date(Date.now() + cooldownMs)

    await payload.update({
      collection: 'game-players',
      id: actor.id,
      data: {
        lastKillAt: new Date().toISOString(),
        kills: (actor.kills || 0) + 1,
      },
    })

    const targetName = await this.getPlayerName(target)
    const actorName = await this.getPlayerName(actor)

    // Create kill event in the game's killEvents array
    const killEvent = {
      id: `kill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId: `kill_${Date.now()}`,
      murdererName: actorName,
      victimName: targetName,
      timestamp: new Date().toISOString(),
      message: `${actorName} eliminated ${targetName}`,
      successful: true,
    }

    // Add kill event to game
    await payload.update({
      collection: 'games',
      id: game.id,
      data: {
        killEvents: [...(game.killEvents || []), killEvent],
      },
    })

    return {
      success: true,
      message: `${actorName} successfully killed ${targetName}!`,
      cooldownExpiry,
      abilityUsed: this.name,
    }
  }

  getCooldownExpiry(actor: GamePlayer, game: Game): Date | null {
    if (!actor.lastKillAt) return null

    const settings = game.settings as GameAbilitySettings
    const cooldownMs = (settings?.cooldownMinutes || this.cooldownMinutes) * 60 * 1000
    return new Date(new Date(actor.lastKillAt).getTime() + cooldownMs)
  }

  getRemainingUses(): null {
    return null // Unlimited uses (just cooldown)
  }

  private async getPlayerName(player: GamePlayer): Promise<string> {
    if (!player.player) return player.playerCode || 'Unknown Player'

    const payload = await getPayloadClient()
    try {
      const registryPlayerId = typeof player.player === 'string' ? player.player : player.player.id
      const registryPlayer = await payload.findByID({
        collection: 'player-registry',
        id: registryPlayerId,
        depth: 0,
      }) as PlayerRegistry
      return registryPlayer.displayName || player.playerCode || 'Unknown Player'
    } catch {
      return player.playerCode || 'Unknown Player'
    }
  }
}

export class DetectiveInvestigateAbility implements RoleAbility {
  name = ABILITY_TYPES.INVESTIGATE
  role: PlayerRole = 'detective'
  cooldownMinutes = 5
  requiresTarget = true

  async canUse(actor: GamePlayer, game: Game): Promise<AbilityStatus> {
    if (!actor.isAlive) {
      return { canUse: false, reason: 'Dead players cannot investigate' }
    }

    const cooldowns = (actor.abilityCooldowns as Record<string, string>) || {}
    const cooldownExpiry = cooldowns[this.name]

    if (cooldownExpiry) {
      const now = Date.now()
      const expiry = new Date(cooldownExpiry).getTime()
      if (now < expiry) {
        const remainingSeconds = Math.ceil((expiry - now) / 1000)
        return {
          canUse: false,
          reason: `Investigation on cooldown for ${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s`,
          cooldownRemaining: remainingSeconds
        }
      }
    }

    return { canUse: true }
  }

  async execute(actor: GamePlayer, game: Game, target?: GamePlayer): Promise<DetectiveInvestigationResult> {
    if (!target) {
      return { success: false, message: 'Target is required for investigation' }
    }

    if (!target.isAlive) {
      return { success: false, message: 'Cannot investigate dead players' }
    }

    if (actor.playerCode === target.playerCode) {
      return { success: false, message: 'Cannot investigate yourself' }
    }

    const payload = await getPayloadClient()
    const targetName = await this.getPlayerName(target)

    // Add to investigated players list
    const investigatedPlayers = actor.investigatedPlayers || []
    investigatedPlayers.push({
      playerCode: target.playerCode,
      investigatedAt: new Date().toISOString(),
    })

    await payload.update({
      collection: 'game-players',
      id: actor.id,
      data: { investigatedPlayers },
    })

    const settings = game.settings as GameAbilitySettings
    const cooldownMs = (settings?.detectiveCooldownMinutes || this.cooldownMinutes) * 60 * 1000
    const cooldownExpiry = new Date(Date.now() + cooldownMs)

    const roleLabel = target.role === 'murderer' ? 'Krampus (MURDERER)' : `${target.role} (Innocent)`

    return {
      success: true,
      message: `Investigation complete: ${targetName} is ${roleLabel}`,
      targetRole: target.role as PlayerRole,
      targetName,
      cooldownExpiry,
      abilityUsed: this.name,
    }
  }

  getCooldownExpiry(actor: GamePlayer, game: Game): Date | null {
    const cooldowns = (actor.abilityCooldowns as Record<string, string>) || {}
    const cooldownExpiry = cooldowns[this.name]
    return cooldownExpiry ? new Date(cooldownExpiry) : null
  }

  getRemainingUses(): null {
    return null // Unlimited uses (just cooldown)
  }

  private async getPlayerName(player: GamePlayer): Promise<string> {
    if (!player.player) return player.playerCode || 'Unknown Player'

    const payload = await getPayloadClient()
    try {
      const registryPlayerId = typeof player.player === 'string' ? player.player : player.player.id
      const registryPlayer = await payload.findByID({
        collection: 'player-registry',
        id: registryPlayerId,
        depth: 0,
      }) as PlayerRegistry
      return registryPlayer.displayName || player.playerCode || 'Unknown Player'
    } catch {
      return player.playerCode || 'Unknown Player'
    }
  }
}

export class ReviverReviveAbility implements RoleAbility {
  name = ABILITY_TYPES.REVIVE
  role: PlayerRole = 'reviver'
  cooldownMinutes = 15
  requiresTarget = true

  async canUse(actor: GamePlayer, game: Game): Promise<AbilityStatus> {
    if (!actor.isAlive) {
      return { canUse: false, reason: 'Dead players cannot revive' }
    }

    const cooldowns = (actor.abilityCooldowns as Record<string, string>) || {}
    const cooldownExpiry = cooldowns[this.name]

    if (cooldownExpiry) {
      const now = Date.now()
      const expiry = new Date(cooldownExpiry).getTime()
      if (now < expiry) {
        const remainingSeconds = Math.ceil((expiry - now) / 1000)
        return {
          canUse: false,
          reason: `Revival on cooldown for ${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s`,
          cooldownRemaining: remainingSeconds
        }
      }
    }

    return { canUse: true }
  }

  async execute(actor: GamePlayer, game: Game, target?: GamePlayer): Promise<ReviverResult> {
    if (!target) {
      return { success: false, message: 'Target is required for revival' }
    }

    if (target.isAlive) {
      return { success: false, message: 'Target is already alive' }
    }

    const payload = await getPayloadClient()
    const targetName = await this.getPlayerName(target)

    // Revive the target
    await payload.update({
      collection: 'game-players',
      id: target.id,
      data: { isAlive: true },
    })

    // Add to revived players list
    const revivedPlayers = actor.revivedPlayers || []
    revivedPlayers.push({
      playerCode: target.playerCode,
      revivedAt: new Date().toISOString(),
    })

    await payload.update({
      collection: 'game-players',
      id: actor.id,
      data: { revivedPlayers },
    })

    const settings = game.settings as GameAbilitySettings
    const cooldownMs = (settings?.reviverCooldownMinutes || this.cooldownMinutes) * 60 * 1000
    const cooldownExpiry = new Date(Date.now() + cooldownMs)

    return {
      success: true,
      message: `${targetName} has been revived! They return to the manor.`,
      revivedPlayer: targetName,
      cooldownExpiry,
      abilityUsed: this.name,
    }
  }

  getCooldownExpiry(actor: GamePlayer, game: Game): Date | null {
    const cooldowns = (actor.abilityCooldowns as Record<string, string>) || {}
    const cooldownExpiry = cooldowns[this.name]
    return cooldownExpiry ? new Date(cooldownExpiry) : null
  }

  getRemainingUses(): null {
    return null // Unlimited uses (just cooldown)
  }

  private async getPlayerName(player: GamePlayer): Promise<string> {
    if (!player.player) return player.playerCode || 'Unknown Player'

    const payload = await getPayloadClient()
    try {
      const registryPlayerId = typeof player.player === 'string' ? player.player : player.player.id
      const registryPlayer = await payload.findByID({
        collection: 'player-registry',
        id: registryPlayerId,
        depth: 0,
      }) as PlayerRegistry
      return registryPlayer.displayName || player.playerCode || 'Unknown Player'
    } catch {
      return player.playerCode || 'Unknown Player'
    }
  }
}

export class BodyguardProtectAbility implements RoleAbility {
  name = ABILITY_TYPES.PROTECT
  role: PlayerRole = 'bodyguard'
  cooldownMinutes = 0 // No cooldown, but can only protect one at a time
  requiresTarget = true

  async canUse(actor: GamePlayer): Promise<AbilityStatus> {
    if (!actor.isAlive) {
      return { canUse: false, reason: 'Dead players cannot protect' }
    }

    return { canUse: true }
  }

  async execute(actor: GamePlayer, game: Game, target?: GamePlayer): Promise<ProtectionResult> {
    if (!target) {
      return { success: false, message: 'Target is required for protection' }
    }

    if (!target.isAlive) {
      return { success: false, message: 'Cannot protect dead players' }
    }

    if (actor.playerCode === target.playerCode) {
      return { success: false, message: 'Cannot protect yourself' }
    }

    const payload = await getPayloadClient()
    const targetName = await this.getPlayerName(target)

    const settings = game.settings as GameAbilitySettings
    const protectionDurationMs = (settings?.bodyguardProtectionDurationMinutes || 30) * 60 * 1000
    const protectionExpiry = new Date(Date.now() + protectionDurationMs)

    // Set protection on target
    await payload.update({
      collection: 'game-players',
      id: target.id,
      data: {
        protectedBy: actor.id,
        protectionExpiresAt: protectionExpiry.toISOString(),
      },
    })

    return {
      success: true,
      message: `${targetName} is now under your protection for ${Math.floor(protectionDurationMs / 60000)} minutes.`,
      protectedPlayer: targetName,
      protectionExpiry,
      abilityUsed: this.name,
    }
  }

  getCooldownExpiry(): null {
    return null // No cooldown
  }

  getRemainingUses(): null {
    return null // Unlimited uses
  }

  private async getPlayerName(player: GamePlayer): Promise<string> {
    if (!player.player) return player.playerCode || 'Unknown Player'

    const payload = await getPayloadClient()
    try {
      const registryPlayerId = typeof player.player === 'string' ? player.player : player.player.id
      const registryPlayer = await payload.findByID({
        collection: 'player-registry',
        id: registryPlayerId,
        depth: 0,
      }) as PlayerRegistry
      return registryPlayer.displayName || player.playerCode || 'Unknown Player'
    } catch {
      return player.playerCode || 'Unknown Player'
    }
  }
}

export class VigilanteKillAbility implements RoleAbility {
  name = ABILITY_TYPES.VIGILANTE_KILL
  role: PlayerRole = 'vigilante'
  cooldownMinutes = 0
  maxUses = 1
  requiresTarget = true

  async canUse(actor: GamePlayer, game: Game): Promise<AbilityStatus> {
    if (!actor.isAlive) {
      return { canUse: false, reason: 'Dead players cannot use vigilante kill' }
    }

    const settings = game.settings as GameAbilitySettings
    const maxKills = settings?.vigilanteMaxKills || this.maxUses
    const currentKills = actor.vigilanteKills || 0

    if (currentKills >= maxKills) {
      return { canUse: false, reason: 'You have used all your vigilante kills' }
    }

    return { canUse: true, usesRemaining: maxKills - currentKills }
  }

  async execute(actor: GamePlayer, game: Game, target?: GamePlayer): Promise<VigilanteResult> {
    if (!target) {
      return { success: false, message: 'Target is required for vigilante kill' }
    }

    if (!target.isAlive) {
      return { success: false, message: 'Target is already dead' }
    }

    if (actor.playerCode === target.playerCode) {
      return { success: false, message: 'Cannot kill yourself' }
    }

    const payload = await getPayloadClient()
    const targetName = await this.getPlayerName(target)
    const actorName = await this.getPlayerName(actor)

    // Check if target is a murderer
    const targetIsMurderer = isMurdererRole(target.role as PlayerRole)

    if (targetIsMurderer) {
      // Success - kill the murderer
      await payload.update({
        collection: 'game-players',
        id: target.id,
        data: { isAlive: false },
      })

      await payload.update({
        collection: 'game-players',
        id: actor.id,
        data: { vigilanteKills: (actor.vigilanteKills || 0) + 1 },
      })

      return {
        success: true,
        message: `Success! ${targetName} was indeed a murderer and has been eliminated.`,
        targetWasMurderer: true,
        vigilanteDied: false,
        abilityUsed: this.name,
      }
    } else {
      // Failed - kill the vigilante instead
      await payload.update({
        collection: 'game-players',
        id: actor.id,
        data: {
          isAlive: false,
          vigilanteKills: (actor.vigilanteKills || 0) + 1,
        },
      })

      return {
        success: true,
        message: `You were wrong! ${targetName} was innocent. You have been eliminated for your mistake.`,
        targetWasMurderer: false,
        vigilanteDied: true,
        abilityUsed: this.name,
      }
    }
  }

  getCooldownExpiry(): null {
    return null // No cooldown
  }

  getRemainingUses(actor: GamePlayer): number {
    const currentKills = actor.vigilanteKills || 0
    return Math.max(0, this.maxUses - currentKills)
  }

  private async getPlayerName(player: GamePlayer): Promise<string> {
    if (!player.player) return player.playerCode || 'Unknown Player'

    const payload = await getPayloadClient()
    try {
      const registryPlayerId = typeof player.player === 'string' ? player.player : player.player.id
      const registryPlayer = await payload.findByID({
        collection: 'player-registry',
        id: registryPlayerId,
        depth: 0,
      }) as PlayerRegistry
      return registryPlayer.displayName || player.playerCode || 'Unknown Player'
    } catch {
      return player.playerCode || 'Unknown Player'
    }
  }
}

export class GrinchMimicAbility implements RoleAbility {
  name = ABILITY_TYPES.GRINCH_MIMIC
  role: PlayerRole = 'troll'
  cooldownMinutes = 10
  requiresTarget = true

  async canUse(actor: GamePlayer, game: Game): Promise<AbilityStatus> {
    if (!actor.isAlive) {
      return { canUse: false, reason: 'Dead players cannot mimic abilities' }
    }

    const cooldowns = (actor.abilityCooldowns as Record<string, string>) || {}
    const cooldownExpiry = cooldowns[this.name]

    if (cooldownExpiry) {
      const now = Date.now()
      const expiry = new Date(cooldownExpiry).getTime()
      if (now < expiry) {
        const remainingSeconds = Math.ceil((expiry - now) / 1000)
        return {
          canUse: false,
          reason: `Mimic on cooldown for ${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s`,
          cooldownRemaining: remainingSeconds
        }
      }
    }

    return { canUse: true }
  }

  async execute(actor: GamePlayer, game: Game, target?: GamePlayer): Promise<GrinchMimicResult> {
    if (!target) {
      return { success: false, message: 'Target is required for mimic ability' }
    }

    if (!target.isAlive) {
      return { success: false, message: 'Cannot mimic dead players' }
    }

    if (actor.playerCode === target.playerCode) {
      return { success: false, message: 'Cannot mimic yourself' }
    }

    // Check if already mimicked this player
    const mimickedPlayers = actor.grinchMimickedPlayers || []
    const alreadyMimicked = mimickedPlayers.some(m => m.playerCode === target.playerCode)

    if (alreadyMimicked) {
      return { success: false, message: 'You have already mimicked this player' }
    }

    const payload = await getPayloadClient()
    const targetName = await this.getPlayerName(target)

    // If target is a murderer, the grinch dies
    if (isMurdererRole(target.role as PlayerRole)) {
      await payload.update({
        collection: 'game-players',
        id: actor.id,
        data: { isAlive: false },
      })

      return {
        success: true,
        message: `Fatal mistake! ${targetName} was a murderer. You have been eliminated.`,
        mimickedAbility: 'kill',
        mimicSuccess: false,
        abilityUsed: this.name,
      }
    }

    // Add to mimicked players list
    const newMimickedPlayers = [...mimickedPlayers, {
      playerCode: target.playerCode,
      mimickedAbility: target.role,
      mimickedAt: new Date().toISOString(),
    }]

    await payload.update({
      collection: 'game-players',
      id: actor.id,
      data: { grinchMimickedPlayers: newMimickedPlayers },
    })

    const settings = game.settings as GameAbilitySettings
    const cooldownMs = (settings?.grinchCooldownMinutes || this.cooldownMinutes) * 60 * 1000
    const cooldownExpiry = new Date(Date.now() + cooldownMs)

    return {
      success: true,
      message: `You have successfully mimicked ${targetName}'s ${target.role} ability! You can now use it once.`,
      mimickedAbility: target.role,
      originalTarget: targetName,
      mimicSuccess: true,
      cooldownExpiry,
      abilityUsed: this.name,
    }
  }

  getCooldownExpiry(actor: GamePlayer, game: Game): Date | null {
    const cooldowns = (actor.abilityCooldowns as Record<string, string>) || {}
    const cooldownExpiry = cooldowns[this.name]
    return cooldownExpiry ? new Date(cooldownExpiry) : null
  }

  getRemainingUses(): null {
    return null // No specific use limit, but can't mimic same player twice
  }

  private async getPlayerName(player: GamePlayer): Promise<string> {
    if (!player.player) return player.playerCode || 'Unknown Player'

    const payload = await getPayloadClient()
    try {
      const registryPlayerId = typeof player.player === 'string' ? player.player : player.player.id
      const registryPlayer = await payload.findByID({
        collection: 'player-registry',
        id: registryPlayerId,
        depth: 0,
      }) as PlayerRegistry
      return registryPlayer.displayName || player.playerCode || 'Unknown Player'
    } catch {
      return player.playerCode || 'Unknown Player'
    }
  }
}