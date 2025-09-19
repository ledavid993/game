import type { GameEvent } from '@/app/components/game/LiveFeed'

export class LiveFeedManager {
  private static instance: LiveFeedManager | null = null
  private listeners: Set<(event: GameEvent) => void> = new Set()

  static getInstance(): LiveFeedManager {
    if (!LiveFeedManager.instance) {
      LiveFeedManager.instance = new LiveFeedManager()
    }
    return LiveFeedManager.instance
  }

  addListener(callback: (event: GameEvent) => void): void {
    this.listeners.add(callback)
  }

  removeListener(callback: (event: GameEvent) => void): void {
    this.listeners.delete(callback)
  }

  addEvent(event: GameEvent): void {
    // Add to localStorage directly
    const stored = localStorage.getItem('gameEvents')
    let events: GameEvent[] = []

    if (stored) {
      try {
        events = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse stored events:', e)
      }
    }

    // Check if event already exists
    if (!events.find(e => e.id === event.id)) {
      events.push(event)

      // Keep only last 50 events
      const sortedEvents = events
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-50)

      localStorage.setItem('gameEvents', JSON.stringify(sortedEvents))

      // Notify all listeners
      this.listeners.forEach(callback => callback(event))
    }
  }

  clearEvents(): void {
    localStorage.removeItem('gameEvents')
    // Notify listeners that events were cleared
    this.listeners.forEach(callback => callback({
      id: 'clear_events',
      type: 'win',
      timestamp: Date.now(),
      message: 'Events cleared'
    }))
  }
}

// Convenience functions for creating events
export function addKillEvent(murdererName: string, victimName: string, successful: boolean = true): void {
  const event: GameEvent = {
    id: `kill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'kill',
    timestamp: Date.now(),
    message: successful
      ? `${murdererName} eliminated ${victimName}`
      : `${murdererName} failed to eliminate ${victimName}`,
    actor: murdererName,
    target: victimName,
    successful
  }

  LiveFeedManager.getInstance().addEvent(event)
}

export function addAbilityEvent(actorName: string, abilityName: string, targetName?: string, successful: boolean = true, reason?: string): void {
  const event: GameEvent = {
    id: `ability_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'ability_used',
    timestamp: Date.now(),
    message: successful
      ? `${actorName} used ${abilityName}${targetName ? ` on ${targetName}` : ''}`
      : `${actorName} failed to use ${abilityName}${targetName ? ` on ${targetName}` : ''}${reason ? `: ${reason}` : ''}`,
    actor: actorName,
    target: targetName,
    abilityName,
    successful
  }

  LiveFeedManager.getInstance().addEvent(event)
}

export function addCooldownReadyEvent(playerName: string, abilityName: string): void {
  const event: GameEvent = {
    id: `cooldown_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'cooldown_ready',
    timestamp: Date.now(),
    message: `${playerName}'s ${abilityName} ability is ready`,
    actor: playerName,
    abilityName
  }

  LiveFeedManager.getInstance().addEvent(event)
}

export function addGameEvent(message: string, type: GameEvent['type'] = 'join'): void {
  const event: GameEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: Date.now(),
    message
  }

  LiveFeedManager.getInstance().addEvent(event)
}