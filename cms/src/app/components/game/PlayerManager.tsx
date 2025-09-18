'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayerCard, type PlayerData } from './PlayerCard'
import { generateUsername } from '@/lib/game/usernameGenerator'
import toast from 'react-hot-toast'

interface PlayerManagerProps {
  onPlayersChange: (players: PlayerData[]) => void
  maxPlayers?: number
  disabled?: boolean
}

export function PlayerManager({
  onPlayersChange,
  maxPlayers = 100,
  disabled = false
}: PlayerManagerProps) {
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [newPlayerName, setNewPlayerName] = useState('')

  // Generate sample players for quick testing
  const samplePlayers: Omit<PlayerData, 'id' | 'username'>[] = [
    { name: 'Eleanor Glass', phone: '+1 555-0100', email: 'eleanor@email.com' },
    { name: 'Victor North', phone: '+1 555-0101', email: 'victor@email.com' },
    { name: 'Adelaide Finch', phone: '+1 555-0102', email: 'adelaide@email.com' },
    { name: 'Henry Wolfe', phone: '+1 555-0103', email: 'henry@email.com' },
    { name: 'Cordelia Blackwood', phone: '+1 555-0104', email: 'cordelia@email.com' },
    { name: 'Sebastian Grey', phone: '+1 555-0105', email: 'sebastian@email.com' }
  ]

  // Get all existing usernames for uniqueness check
  const existingUsernames = players.map(p => p.username)

  // Notify parent component when players change
  useEffect(() => {
    onPlayersChange(players)
  }, [players, onPlayersChange])

  const addPlayer = useCallback(async (playerData: Omit<PlayerData, 'id' | 'username'>) => {
    if (!playerData.name.trim()) {
      toast.error('Player name is required')
      return
    }

    if (players.length >= maxPlayers) {
      toast.error(`Maximum ${maxPlayers} players allowed`)
      return
    }

    // Check for duplicate names
    if (players.some(p => p.name.toLowerCase() === playerData.name.toLowerCase())) {
      toast.error('Player name already exists')
      return
    }

    const newPlayer: PlayerData = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username: generateUsername({ excludeList: existingUsernames }),
      ...playerData
    }

    try {
      const response = await fetch(`/api/v1/game/players?_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ player: newPlayer })
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

        setPlayers(prev => [...prev, savedPlayer])
        setNewPlayerName('')
        toast.success(`${playerData.name} added to guest list`)
      } else {
        throw new Error(data.error || 'Failed to add player')
      }
    } catch (error) {
      console.error('Error adding player:', error)
      const message = error instanceof Error ? error.message : 'Failed to add player'
      toast.error(message)
    }
  }, [players, maxPlayers, existingUsernames])

  const updatePlayer = useCallback((updatedPlayer: PlayerData) => {
    setPlayers(prev =>
      prev.map(player =>
        player.id === updatedPlayer.id ? updatedPlayer : player
      )
    )
  }, [])

  const removePlayer = useCallback(async (playerId: string) => {
    const player = players.find(p => p.id === playerId)
    if (!player) return

    try {
      const response = await fetch(`/api/v1/game/players?playerCode=${encodeURIComponent(playerId)}&_t=${Date.now()}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      const data = await response.json()

      if (data.success) {
        setPlayers(prev => prev.filter(p => p.id !== playerId))
        toast.success(`${player.name} removed from guest list`)
      } else {
        throw new Error(data.error || 'Failed to remove player')
      }
    } catch (error) {
      console.error('Error removing player:', error)
      const message = error instanceof Error ? error.message : 'Failed to remove player'
      toast.error(message)
    }
  }, [players])

  const clearAllPlayers = useCallback(() => {
    setPlayers([])
    toast.success('All players removed')
  }, [])

  const addSamplePlayers = useCallback(() => {
    const playersToAdd = samplePlayers.slice(0, Math.min(6, maxPlayers))
    const newPlayers: PlayerData[] = playersToAdd.map((playerData, index) => ({
      id: `sample-${Date.now()}-${index}`,
      username: generateUsername({ excludeList: [...existingUsernames] }),
      ...playerData
    }))

    setPlayers(newPlayers)
    toast.success(`Added ${newPlayers.length} sample players`)
  }, [maxPlayers, existingUsernames])

  const bulkImportPlayers = useCallback((text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const newPlayers: PlayerData[] = []

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim())
      if (parts.length === 0 || !parts[0]) continue

      const [name, phone, email] = parts

      // Skip if name already exists
      if (players.some(p => p.name.toLowerCase() === name.toLowerCase()) ||
          newPlayers.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        continue
      }

      if (players.length + newPlayers.length >= maxPlayers) break

      newPlayers.push({
        id: `import-${Date.now()}-${newPlayers.length}`,
        name,
        username: generateUsername({ excludeList: [...existingUsernames, ...newPlayers.map(p => p.username)] }),
        phone: phone || undefined,
        email: email || undefined
      })
    }

    if (newPlayers.length > 0) {
      setPlayers(prev => [...prev, ...newPlayers])
      toast.success(`Imported ${newPlayers.length} players`)
    } else {
      toast.error('No valid players found to import')
    }
  }, [players, maxPlayers, existingUsernames])

  const handleAddPlayer = useCallback(() => {
    if (newPlayerName.trim()) {
      addPlayer({ name: newPlayerName.trim() })
    }
  }, [newPlayerName, addPlayer])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPlayer()
    }
  }, [handleAddPlayer])

  const canAddMore = players.length < maxPlayers

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-manor text-[clamp(1.125rem,3vw,1.5rem)] uppercase tracking-[0.25em] text-manor-candle mb-2">
          Manor Guest Registry
        </h2>
        <div className="flex items-center justify-center gap-4 text-[clamp(0.75rem,1.5vw,0.875rem)]">
          <span className="font-medium text-manor-candle">
            {players.length} {players.length === 1 ? 'Guest' : 'Guests'}
          </span>
          <span className="text-manor-parchment/60">
            Max: {maxPlayers}
          </span>
        </div>
      </div>

      {/* Add Player Section */}
      {!disabled && canAddMore && (
        <div className="manor-card space-y-4">
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

          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => {
                const textarea = document.createElement('textarea')
                textarea.placeholder = 'Paste player list here (one per line, format: Name, Phone, Email)'
                textarea.className = 'w-full h-24 p-2 bg-manor-shadow rounded border border-white/10 text-manor-candle placeholder:text-manor-parchment/40'

                const modal = document.createElement('div')
                modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
                modal.innerHTML = `
                  <div class="bg-manor-midnight border border-white/10 rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 class="text-manor-candle font-manor text-lg mb-4">Bulk Import Players</h3>
                    <p class="text-manor-parchment/80 text-sm mb-4">Format: Name, Phone, Email (one per line)</p>
                  </div>
                `
                modal.firstElementChild?.appendChild(textarea)

                const buttonDiv = document.createElement('div')
                buttonDiv.className = 'flex gap-2 mt-4'
                buttonDiv.innerHTML = `
                  <button class="btn-primary flex-1">Import</button>
                  <button class="btn-secondary">Cancel</button>
                `
                modal.firstElementChild?.appendChild(buttonDiv)

                const [importBtn, cancelBtn] = buttonDiv.querySelectorAll('button')
                importBtn.onclick = () => {
                  bulkImportPlayers(textarea.value)
                  document.body.removeChild(modal)
                }
                cancelBtn.onclick = () => document.body.removeChild(modal)

                document.body.appendChild(modal)
              }}
              className="px-3 py-1 text-xs rounded border border-white/20 text-manor-parchment/80 hover:text-manor-candle hover:bg-white/5 transition-colors"
            >
              📋 Bulk Import
            </button>

            <button
              onClick={addSamplePlayers}
              className="px-3 py-1 text-xs rounded border border-white/20 text-manor-parchment/80 hover:text-manor-candle hover:bg-white/5 transition-colors"
            >
              🎭 Add Demo Players
            </button>

            {players.length > 0 && (
              <button
                onClick={clearAllPlayers}
                className="px-3 py-1 text-xs rounded border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
              >
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Players List */}
      <div className="space-y-4">
        <AnimatePresence>
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onUpdate={updatePlayer}
              onRemove={removePlayer}
              existingUsernames={existingUsernames}
              canRemove={!disabled && players.length > 0}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {players.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">👻</div>
          <h3 className="font-manor text-lg text-manor-candle mb-2">The Manor Awaits Guests</h3>
          <p className="text-manor-parchment/70 text-sm">
            Add players to begin preparing the mystery
          </p>
        </motion.div>
      )}
    </div>
  )
}