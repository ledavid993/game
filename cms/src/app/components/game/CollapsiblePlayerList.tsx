'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayerCard, type PlayerData } from './PlayerCard'
import { generateUsername } from '@/lib/game/usernameGenerator'
import toast from 'react-hot-toast'

interface CollapsiblePlayerListProps {
  players: PlayerData[]
  onPlayersChange: (players: PlayerData[]) => void
  maxPlayers?: number
  disabled?: boolean
}

export function CollapsiblePlayerList({
  players,
  onPlayersChange,
  maxPlayers = 100,
  disabled = false,
}: CollapsiblePlayerListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [isAdding, setIsAdding] = useState(false)

  // Get all existing usernames for uniqueness check
  const existingUsernames = players.map((p) => p.username)

  // Filter players based on search term
  const filteredPlayers = useMemo(() => {
    if (!searchTerm.trim()) return players

    const term = searchTerm.toLowerCase()
    return players.filter(
      (player) =>
        player.name.toLowerCase().includes(term) || player.username.toLowerCase().includes(term),
    )
  }, [players, searchTerm])

  const addPlayer = useCallback(
    async (playerData: Omit<PlayerData, 'id' | 'username'>) => {
      if (!playerData.name.trim()) {
        toast.error('Player name is required')
        return
      }

      if (players.length >= maxPlayers) {
        toast.error(`Maximum ${maxPlayers} players allowed`)
        return
      }

      setIsAdding(true)

      // Check for duplicate names
      if (players.some((p) => p.name.toLowerCase() === playerData.name.toLowerCase())) {
        toast.error('Player name already exists')
        return
      }

      const newPlayer: PlayerData = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username: generateUsername({ excludeList: existingUsernames }),
        ...playerData,
      }

      try {
        const response = await fetch(`/api/v1/players?_t=${Date.now()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          body: JSON.stringify({ player: newPlayer }),
        })

        const data = await response.json()

        if (data.success) {
          const savedPlayer: PlayerData = {
            id: data.player.id,
            name: data.player.name,
            username: data.player.username,
            phone: data.player.phone,
            email: data.player.email,
          }

          // Smart update: append the new player
          onPlayersChange((prevPlayers) => [...prevPlayers, savedPlayer])
          setNewPlayerName('')
          toast.success(`${playerData.name} added to guest list`)
        } else {
          throw new Error(data.error || 'Failed to add player')
        }
      } catch (error) {
        console.error('Error adding player:', error)
        const message = error instanceof Error ? error.message : 'Failed to add player'
        toast.error(message)
      } finally {
        setIsAdding(false)
      }
    },
    [players, maxPlayers, existingUsernames, onPlayersChange],
  )

  const updatePlayer = useCallback(
    (updatedPlayer: PlayerData) => {
      // Smart update: update only the specific player
      onPlayersChange((prevPlayers) =>
        prevPlayers.map((player) => (player.id === updatedPlayer.id ? updatedPlayer : player)),
      )
    },
    [onPlayersChange],
  )

  const removePlayer = useCallback(
    async (playerId: string) => {
      const player = players.find((p) => p.id === playerId)
      if (!player) return

      setLoadingStates((prev) => ({ ...prev, [playerId]: true }))

      try {
        const response = await fetch(
          `/api/v1/players?playerCode=${encodeURIComponent(playerId)}&_t=${Date.now()}`,
          {
            method: 'DELETE',
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          },
        )

        const data = await response.json()

        if (data.success) {
          // Smart update: filter out only the removed player
          onPlayersChange((prevPlayers) => prevPlayers.filter((p) => p.id !== playerId))
          toast.success(`${player.name} removed from guest list`)
        } else {
          throw new Error(data.error || 'Failed to remove player')
        }
      } catch (error) {
        console.error('Error removing player:', error)
        const message = error instanceof Error ? error.message : 'Failed to remove player'
        toast.error(message)
      } finally {
        setLoadingStates((prev) => {
          const newState = { ...prev }
          delete newState[playerId]
          return newState
        })
      }
    },
    [players, onPlayersChange],
  )

  const handleAddPlayer = useCallback(() => {
    if (newPlayerName.trim()) {
      addPlayer({ name: newPlayerName.trim() })
    }
  }, [newPlayerName, addPlayer])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleAddPlayer()
      }
    },
    [handleAddPlayer],
  )

  const clearAllPlayers = useCallback(async () => {
    // For now, just clear the UI - could add batch delete API later
    onPlayersChange([])
    toast.success('All players removed')
  }, [onPlayersChange])

  const canAddMore = players.length < maxPlayers

  return (
    <div className="manor-card space-y-4 h-full">
      {/* Header with collapse toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 -m-2 rounded-lg hover:bg-white/5 transition-colors"
        disabled={disabled}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-manor text-[clamp(1rem,2.5vw,1.125rem)] uppercase tracking-wider text-manor-candle">
            Guest Registry
          </h3>
          <span className="px-2 py-1 text-xs rounded-full bg-manor-wine/20 text-manor-candle border border-manor-wine/30">
            {players.length} / {maxPlayers}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-manor-parchment/60"
        >
          ▼
        </motion.div>
      </button>

      {/* Quick summary when collapsed */}
      {!isExpanded && players.length > 0 && (
        <div className="text-[clamp(0.75rem,1.5vw,0.875rem)] text-manor-parchment/80 ">
          <div className="flex flex-wrap gap-2">
            {players.slice(0, 3).map((player) => (
              <span key={player.id} className="px-2 py-1 bg-manor-shadow/40 rounded text-xs">
                {player.name}
              </span>
            ))}
            {players.length > 3 && (
              <span className="px-2 py-1 bg-manor-shadow/40 rounded text-xs text-manor-parchment/60">
                +{players.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Search bar */}
            {players.length > 0 && (
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or username..."
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

            {/* Add player section */}
            {!disabled && canAddMore && (
              <div className="space-y-3 p-3 border border-white/10 rounded-lg bg-manor-shadow/20">
                <h4 className="font-medium text-manor-candle text-sm">Add New Guest</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter player name..."
                    className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-manor-shadow/60 text-manor-candle placeholder:text-manor-parchment/40 focus:outline-none focus:ring-2 focus:border-manor-wine/50 focus:ring-manor-wine/30"
                  />
                  <button
                    onClick={handleAddPlayer}
                    disabled={!newPlayerName.trim()}
                    className="px-4 py-2 rounded-lg bg-manor-wine/30 hover:bg-manor-wine/50 text-manor-candle border border-manor-wine/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Players list */}
            {filteredPlayers.length > 0 ? (
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                <AnimatePresence>
                  {filteredPlayers.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onUpdate={updatePlayer}
                      onRemove={removePlayer}
                      existingUsernames={existingUsernames}
                      canRemove={!disabled}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : searchTerm ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-manor-parchment/70">No players found matching "{searchTerm}"</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">👻</div>
                <p className="text-manor-parchment/70">No guests in the manor yet</p>
                <p className="text-manor-parchment/50 text-sm mt-1">
                  Add players to begin the mystery
                </p>
              </div>
            )}

            {/* Bulk actions */}
            {!disabled && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                {players.length > 0 && (
                  <button
                    onClick={clearAllPlayers}
                    className="px-3 py-1 text-xs rounded border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
                  >
                    🗑️ Clear All
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
