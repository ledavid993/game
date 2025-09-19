import type { Payload } from 'payload'
import type { GamePlayer, Game } from '@/payload-types'
import type {
  AbilityEvent,
  AbilityEventType,
  AbilityObserver,
  AbilityResult,
  RoleAbility,
} from './types'
import { ABILITY_TYPES, ABILITY_EVENTS } from './types'
import type { PlayerRole } from '@/app/lib/game/roles'

export class AbilityManager {
  private static instance: AbilityManager | null = null
  private observers: Map<AbilityEventType, AbilityObserver[]> = new Map()
  private abilities: Map<PlayerRole, RoleAbility[]> = new Map()

  static getInstance(): AbilityManager {
    if (!AbilityManager.instance) {
      AbilityManager.instance = new AbilityManager()
    }
    return AbilityManager.instance
  }

  private constructor() {
    // Initialize observer maps
    Object.values(ABILITY_EVENTS).forEach(event => {
      this.observers.set(event as AbilityEventType, [])
    })
  }

  /**
   * Register an observer for a specific ability event
   */
  registerObserver(eventType: AbilityEventType, observer: AbilityObserver): void {
    const observers = this.observers.get(eventType) || []
    observers.push(observer)
    this.observers.set(eventType, observers)
  }

  /**
   * Unregister an observer
   */
  unregisterObserver(eventType: AbilityEventType, observer: AbilityObserver): void {
    const observers = this.observers.get(eventType) || []
    const index = observers.indexOf(observer)
    if (index > -1) {
      observers.splice(index, 1)
    }
  }

  /**
   * Notify all observers of an ability event
   */
  private async notifyObservers(eventType: AbilityEventType, event: AbilityEvent): Promise<void> {
    const observers = this.observers.get(eventType) || []
    await Promise.all(observers.map(observer => observer.onAbilityUsed(event)))
  }

  /**
   * Register an ability for a specific role
   */
  registerAbility(role: PlayerRole, ability: RoleAbility): void {
    const roleAbilities = this.abilities.get(role) || []
    roleAbilities.push(ability)
    this.abilities.set(role, roleAbilities)
  }

  /**
   * Get all abilities for a specific role
   */
  getAbilitiesForRole(role: PlayerRole): RoleAbility[] {
    return this.abilities.get(role) || []
  }

  /**
   * Get a specific ability by name and role
   */
  getAbility(role: PlayerRole, abilityName: string): RoleAbility | null {
    const abilities = this.getAbilitiesForRole(role)
    return abilities.find(ability => ability.name === abilityName) || null
  }

  /**
   * Execute an ability and notify observers
   */
  async executeAbility(
    payload: Payload,
    abilityName: string,
    actor: GamePlayer,
    game: Game,
    target?: GamePlayer
  ): Promise<AbilityResult> {
    try {
      const ability = this.getAbility(actor.role as PlayerRole, abilityName)

      if (!ability) {
        return {
          success: false,
          message: `Ability ${abilityName} not found for role ${actor.role}`,
        }
      }

      // Check if the actor can use this ability
      const status = await ability.canUse(actor, game)
      if (!status.canUse) {
        return {
          success: false,
          message: status.reason || 'Cannot use this ability',
        }
      }

      // Execute the ability
      const result = await ability.execute(actor, game, target)

      // Update ability tracking in database if successful
      if (result.success) {
        await this.updateAbilityTracking(payload, actor, ability, result)
      }

      // Create ability event
      const abilityEvent: AbilityEvent = {
        type: result.success ? ABILITY_EVENTS.ABILITY_USED : ABILITY_EVENTS.ABILITY_FAILED,
        actor,
        target,
        ability: abilityName,
        result,
        timestamp: new Date(),
        gameId: game.id,
      }

      // Notify observers
      await this.notifyObservers(abilityEvent.type as AbilityEventType, abilityEvent)

      return result
    } catch (error) {
      console.error('Error executing ability:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Update ability tracking in the database
   */
  private async updateAbilityTracking(
    payload: Payload,
    actor: GamePlayer,
    ability: RoleAbility,
    result: AbilityResult
  ): Promise<void> {
    // Update ability uses
    const currentUses = (actor.abilityUses as Record<string, number>) || {}
    currentUses[ability.name] = (currentUses[ability.name] || 0) + 1

    // Update cooldowns if applicable
    const currentCooldowns = (actor.abilityCooldowns as Record<string, string>) || {}
    if (result.cooldownExpiry) {
      currentCooldowns[ability.name] = result.cooldownExpiry.toISOString()
    }

    // Update player record
    await payload.update({
      collection: 'game-players',
      id: actor.id,
      data: {
        abilityUses: currentUses,
        abilityCooldowns: currentCooldowns,
        lastAbilityUsedAt: new Date().toISOString(),
      },
    })
  }

  /**
   * Check if a player can use a specific ability
   */
  async canUseAbility(
    actor: GamePlayer,
    game: Game,
    abilityName: string
  ): Promise<{ canUse: boolean; reason?: string; cooldownRemaining?: number }> {
    const ability = this.getAbility(actor.role as PlayerRole, abilityName)

    if (!ability) {
      return { canUse: false, reason: 'Ability not found' }
    }

    if (!actor.isAlive) {
      return { canUse: false, reason: 'Dead players cannot use abilities' }
    }

    return await ability.canUse(actor, game)
  }

  /**
   * Get remaining cooldown for an ability
   */
  getRemainingCooldown(actor: GamePlayer, abilityName: string): number {
    const cooldowns = (actor.abilityCooldowns as Record<string, string>) || {}
    const cooldownExpiry = cooldowns[abilityName]

    if (!cooldownExpiry) return 0

    const expiryTime = new Date(cooldownExpiry).getTime()
    const now = Date.now()

    return Math.max(0, Math.floor((expiryTime - now) / 1000))
  }

  /**
   * Get remaining uses for an ability
   */
  getRemainingUses(actor: GamePlayer, abilityName: string): number | null {
    const ability = this.getAbility(actor.role as PlayerRole, abilityName)

    if (!ability || !ability.maxUses) return null

    const uses = (actor.abilityUses as Record<string, number>) || {}
    const usedCount = uses[abilityName] || 0

    return Math.max(0, ability.maxUses - usedCount)
  }

  /**
   * Clear all cooldowns for a player (useful for testing or admin actions)
   */
  async clearCooldowns(payload: Payload, actor: GamePlayer): Promise<void> {
    await payload.update({
      collection: 'game-players',
      id: actor.id,
      data: {
        abilityCooldowns: {},
      },
    })
  }

  /**
   * Reset all ability uses for a player (useful for new game rounds)
   */
  async resetAbilityUses(payload: Payload, actor: GamePlayer): Promise<void> {
    await payload.update({
      collection: 'game-players',
      id: actor.id,
      data: {
        abilityUses: {},
        abilityCooldowns: {},
        investigatedPlayers: [],
        revivedPlayers: [],
        vigilanteKills: 0,
        grinchMimickedPlayers: [],
        protectedBy: null,
        protectionExpiresAt: null,
      },
    })
  }
}