'use client'

import React, { useEffect, useState, useRef } from 'react'
import { KillEvent } from '@/app/lib/game/types'
import { LiveFeedManager } from '@/app/lib/game/liveFeedEvents'

export interface GameEvent {
  id: string
  type: 'kill' | 'ability_used' | 'cooldown_ready' | 'investigation' | 'revival' | 'protection' | 'join' | 'win'
  timestamp: number
  message: string
  actor?: string
  target?: string
  abilityName?: string
  successful?: boolean
}

interface LiveFeedProps {
  killEvents?: KillEvent[]
  gameEvents?: GameEvent[]
  onPlayerKilled?: (killEvent: KillEvent) => void
  onGameEvent?: (gameEvent: GameEvent) => void
  className?: string
  maxEvents?: number
  highlightNewEvent?: boolean
}

export function LiveFeed({
  killEvents = [],
  gameEvents = [],
  className = '',
  maxEvents = 50,
}: LiveFeedProps) {
  const [allEvents, setAllEvents] = useState<GameEvent[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lastEventCountRef = useRef(0)

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem('gameEvents')
    if (stored) {
      try {
        setAllEvents(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored events:', e)
      }
    }

    // Subscribe to live feed manager for real-time updates
    const manager = LiveFeedManager.getInstance()
    const handleNewEvent = (event: GameEvent) => {
      if (event.id === 'clear_events') {
        setAllEvents([])
        return
      }

      setAllEvents(prev => {
        // Avoid duplicates
        if (prev.find(e => e.id === event.id)) return prev

        const updated = [...prev, event]
        return updated
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-maxEvents)
      })
    }

    manager.addListener(handleNewEvent)

    return () => {
      manager.removeListener(handleNewEvent)
    }
  }, [maxEvents])

  useEffect(() => {
    // Convert kill events to game events
    const convertedKillEvents: GameEvent[] = killEvents.map(killEvent => ({
      id: killEvent.id,
      type: 'kill' as const,
      timestamp: killEvent.timestamp,
      message: killEvent.message,
      actor: killEvent.murderer,
      target: killEvent.victim,
      successful: killEvent.successful
    }))

    // Combine all events
    const newEvents = [...convertedKillEvents, ...gameEvents]

    if (newEvents.length > 0) {
      setAllEvents(prev => {
        // Add new events that don't already exist
        const updated = [...prev]

        newEvents.forEach(newEvent => {
          if (!updated.find(e => e.id === newEvent.id)) {
            updated.push(newEvent)
          }
        })

        // Sort by timestamp and limit
        const sorted = updated
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-maxEvents)

        // Save to localStorage
        localStorage.setItem('gameEvents', JSON.stringify(sorted))

        return sorted
      })
    }
  }, [killEvents, gameEvents, maxEvents])

  // Auto-scroll to bottom when new events are added
  useEffect(() => {
    if (allEvents.length > lastEventCountRef.current) {
      lastEventCountRef.current = allEvents.length

      // Scroll to bottom with a small delay to ensure DOM is updated
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
      }, 100)
    }
  }, [allEvents.length])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className={`bg-gray-900 rounded-xl p-6 h-full ${className}`}>
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Live Feed</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">LIVE</span>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="h-96 overflow-y-auto space-y-2 text-sm"
      >
        {allEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Waiting for events...</p>
          </div>
        ) : (
          allEvents.map((event) => (
            <div
              key={event.id}
              className="p-2 rounded bg-gray-800/50 border border-gray-700/50"
            >
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 mt-0.5 min-w-fit">
                  {formatTime(event.timestamp)}
                </span>
                <span className="text-gray-300 flex-1 leading-relaxed">
                  {event.message}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}