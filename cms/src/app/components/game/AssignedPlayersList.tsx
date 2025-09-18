'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PlayerData } from './PlayerCard'
import toast from 'react-hot-toast'

interface AssignedPlayersListProps {
  registryPlayers: PlayerData[]
  assignedPlayers: PlayerData[]
  onAssignedPlayersChange: (players: PlayerData[]) => void
  maxPlayers?: number
  disabled?: boolean
}

export function AssignedPlayersList({
  registryPlayers,
  assignedPlayers,
  onAssignedPlayersChange,
  maxPlayers = 100,
  disabled = false
}: AssignedPlayersListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [isAssigningAll, setIsAssigningAll] = useState(false)
  const [isRemovingAll, setIsRemovingAll] = useState(false)

  // Filter available players (not already assigned)
  const availablePlayers = useMemo(() => {
    const assignedIds = new Set(assignedPlayers.map(p => p.id))
    return registryPlayers.filter(player => !assignedIds.has(player.id))
  }, [registryPlayers, assignedPlayers])

  // Filter assigned players based on search
  const filteredAssignedPlayers = useMemo(() => {
    if (!searchTerm.trim()) return assignedPlayers

    const term = searchTerm.toLowerCase()
    return assignedPlayers.filter(player =>
      player.name.toLowerCase().includes(term) ||
      player.username.toLowerCase().includes(term)
    )
  }, [assignedPlayers, searchTerm])

  const assignPlayer = useCallback(async (playerId: string) => {
    const player = registryPlayers.find(p => p.id === playerId)
    if (!player) return

    if (assignedPlayers.length >= maxPlayers) {
      toast.error(`Maximum ${maxPlayers} players allowed`)
      return
    }

    // Set loading state for this specific player
    setLoadingStates(prev => ({ ...prev, [playerId]: true }))

    try {
      const response = await fetch(`/api/v1/game/assign-players?_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ playerCodes: [playerId] })
      })

      const data = await response.json()

      if (data.success) {
        if (data.assigned === 0) {
          toast(`${player.name} is already assigned`, { icon: 'ℹ️' })
        } else {
          // Smart update: only add if actually assigned
          onAssignedPlayersChange(prevPlayers => [...prevPlayers, player])
          toast.success(`${player.name} assigned to game`)
        }
      } else {
        throw new Error(data.error || 'Failed to assign player')
      }
    } catch (error) {
      console.error('Error assigning player:', error)
      const message = error instanceof Error ? error.message : 'Failed to assign player'
      toast.error(message)
    } finally {
      // Clear loading state for this player
      setLoadingStates(prev => {
        const newState = { ...prev }
        delete newState[playerId]
        return newState
      })
    }
  }, [registryPlayers, assignedPlayers, maxPlayers, onAssignedPlayersChange])

  const removePlayer = useCallback(async (playerId: string) => {
    const player = assignedPlayers.find(p => p.id === playerId)
    if (!player) return

    // Set loading state for this specific player
    setLoadingStates(prev => ({ ...prev, [playerId]: true }))

    try {
      const response = await fetch(`/api/v1/game/assign-players?playerCode=${encodeURIComponent(playerId)}&_t=${Date.now()}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      const data = await response.json()

      if (data.success) {
        // Smart update: filter out only the removed player
        onAssignedPlayersChange(prevPlayers => prevPlayers.filter(p => p.id !== playerId))
        toast.success(`${player.name} removed from game`)
      } else {
        throw new Error(data.error || 'Failed to remove player')
      }
    } catch (error) {
      console.error('Error removing player:', error)
      const message = error instanceof Error ? error.message : 'Failed to remove player'
      toast.error(message)
    } finally {
      // Clear loading state for this player
      setLoadingStates(prev => {
        const newState = { ...prev }
        delete newState[playerId]
        return newState
      })
    }
  }, [assignedPlayers, onAssignedPlayersChange])

  const assignAllAvailable = useCallback(async () => {
    if (availablePlayers.length === 0) {
      toast.error('No available players to assign')
      return
    }

    const playersToAssign = availablePlayers.slice(0, maxPlayers - assignedPlayers.length)
    const playerCodes = playersToAssign.map(p => p.id)

    setIsAssigningAll(true)

    try {
      const response = await fetch(`/api/v1/game/assign-players?_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ playerCodes })
      })

      const data = await response.json()

      if (data.success) {
        if (data.assigned === 0) {
          toast(`All players already assigned`, { icon: 'ℹ️' })
        } else {
          // Smart update: only add the players that were actually assigned
          const actuallyAssigned = playersToAssign.slice(0, data.assigned)
          onAssignedPlayersChange(prevPlayers => [...prevPlayers, ...actuallyAssigned])
          toast.success(`${data.assigned} players assigned to game`)
        }
      } else {
        throw new Error(data.error || 'Failed to assign players')
      }
    } catch (error) {
      console.error('Error assigning players:', error)
      const message = error instanceof Error ? error.message : 'Failed to assign players'
      toast.error(message)
    } finally {
      setIsAssigningAll(false)
    }
  }, [availablePlayers, assignedPlayers, maxPlayers, onAssignedPlayersChange])

  const removeAllPlayers = useCallback(async () => {
    if (assignedPlayers.length === 0) return

    setIsRemovingAll(true)

    try {
      // Remove all assigned players
      await Promise.all(
        assignedPlayers.map(player =>
          fetch(`/api/v1/game/assign-players?playerCode=${encodeURIComponent(player.id)}&_t=${Date.now()}`, {
            method: 'DELETE',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
        )
      )

      onAssignedPlayersChange([])
      toast.success('All players removed from game')
    } catch (error) {
      console.error('Error removing all players:', error)
      toast.error('Failed to remove all players')
    } finally {
      setIsRemovingAll(false)
    }
  }, [assignedPlayers, onAssignedPlayersChange])

  return (
    <div className="manor-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-manor text-[clamp(1rem,2.5vw,1.125rem)] uppercase tracking-wider text-manor-candle">
            Game Players
          </h3>
          <span className="px-2 py-1 text-xs rounded-full bg-manor-wine/20 text-manor-candle border border-manor-wine/30">
            {assignedPlayers.length} / {maxPlayers}
          </span>
        </div>

        {/* Quick Actions */}
        {!disabled && (
          <div className="flex gap-2">
            {availablePlayers.length > 0 && (
              <button
                onClick={assignAllAvailable}
                disabled={isAssigningAll || disabled}
                className="px-3 py-1 text-xs rounded border border-green-500/30 text-green-400 hover:text-green-300 hover:bg-green-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAssigningAll ? 'Adding...' : `Add All (${availablePlayers.length})`}
              </button>
            )}
            {assignedPlayers.length > 0 && (
              <button
                onClick={removeAllPlayers}
                disabled={isRemovingAll || disabled}
                className="px-3 py-1 text-xs rounded border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRemovingAll ? 'Removing...' : 'Remove All'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search bar */}
      {assignedPlayers.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search assigned players..."
            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-manor-shadow/60 text-manor-candle placeholder:text-manor-parchment/40 focus:outline-none focus:ring-2 focus:border-manor-wine/50 focus:ring-manor-wine/30"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-manor-parchment/60 hover:text-manor-candle"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Available Players Quick Add */}
      {!disabled && availablePlayers.length > 0 && (
        <div className="border border-white/10 rounded-lg p-3 bg-manor-shadow/20">
          <h4 className="font-medium text-manor-candle text-sm mb-2">Available Players</h4>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {availablePlayers.slice(0, 10).map(player => (
              <button
                key={player.id}
                onClick={() => assignPlayer(player.id)}
                disabled={loadingStates[player.id] || disabled}
                className="px-2 py-1 text-xs rounded border border-white/20 text-manor-parchment/80 hover:text-manor-candle hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingStates[player.id] ? '...' : player.name}
              </button>
            ))}
            {availablePlayers.length > 10 && (
              <span className="px-2 py-1 text-xs text-manor-parchment/60">
                +{availablePlayers.length - 10} more...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Assigned Players List */}
      {filteredAssignedPlayers.length > 0 ? (
        <div className="max-h-96 overflow-y-auto space-y-2">
          <AnimatePresence>
            {filteredAssignedPlayers.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-manor-shadow/40"
              >
                <div>
                  <p className="font-medium text-manor-candle">{player.name}</p>
                  <p className="text-xs text-manor-parchment/70">@{player.username}</p>
                  {player.phone && (
                    <p className="text-xs text-manor-parchment/60">{player.phone}</p>
                  )}
                </div>
                {!disabled && (
                  <button
                    onClick={() => removePlayer(player.id)}
                    disabled={loadingStates[player.id]}
                    className="px-2 py-1 text-xs rounded border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingStates[player.id] ? 'Removing...' : 'Remove'}
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : searchTerm ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-manor-parchment/70">No assigned players found matching "{searchTerm}"</p>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎭</div>
          <p className="text-manor-parchment/70">No players assigned to this game</p>
          <p className="text-manor-parchment/50 text-sm mt-1">
            {availablePlayers.length > 0
              ? 'Add players from the registry to start the game'
              : 'No players available in registry'
            }
          </p>
        </div>
      )}
    </div>
  )
}