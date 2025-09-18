'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSocket } from './useSocket'
import { LiveFeed } from './LiveFeed'
import { PlayerGrid } from './PlayerGrid'
import { SerializedGameState, StartGameRequest } from '@/lib/game/types'
import toast from 'react-hot-toast'

interface HostDashboardProps {
  className?: string
}

export function HostDashboard({ className = '' }: HostDashboardProps) {
  const {
    isConnected,
    gameState,
    joinAsHost,
    onPlayerKilled,
    onPlayerJoined,
    onGameStarted,
    onGameEnded,
  } = useSocket()

  const [playerNames, setPlayerNames] = useState<string>('')
  const [isStartingGame, setIsStartingGame] = useState(false)
  const [playerLinks, setPlayerLinks] = useState<Record<string, string>>({})
  const [showQRCodes, setShowQRCodes] = useState(false)
  const [gameCode, setGameCode] = useState<string | null>(null)

  useEffect(() => {
    // Join as host when connected and a game is active
    if (isConnected && gameCode) {
      joinAsHost(gameCode)
    }
  }, [isConnected, joinAsHost, gameCode])

  useEffect(() => {
    // Set up event listeners
    const cleanupKilled = onPlayerKilled((killEvent) => {
      toast.error(`💀 ${killEvent.message}`, {
        duration: 4000,
        position: 'top-right',
      })
    })

    const cleanupJoined = onPlayerJoined((player) => {
      toast.success(`👥 ${player.name} joined the game!`, {
        duration: 3000,
        position: 'top-right',
      })
    })

    const cleanupStarted = onGameStarted((state) => {
      toast.success('🎉 Game started!', {
        duration: 3000,
        position: 'top-right',
      })
    })

    const cleanupEnded = onGameEnded((winner) => {
      toast.success(`🎉 ${winner.toUpperCase()} WIN!`, {
        duration: 6000,
        position: 'top-center',
      })
    })

    return () => {
      cleanupKilled()
      cleanupJoined()
      cleanupStarted()
      cleanupEnded()
    }
  }, [onPlayerKilled, onPlayerJoined, onGameStarted, onGameEnded])

  const handleStartGame = async () => {
    const names = playerNames
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0)

    if (names.length < 3) {
      toast.error('At least 3 players are required!')
      return
    }

    setIsStartingGame(true)

    try {
      const response = await fetch('/api/v1/game/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerNames: names,
          settings: {
            cooldownMinutes: 10,
            maxPlayers: 20,
            murdererCount: Math.min(2, Math.floor(names.length / 3)),
            theme: 'christmas',
          },
          hostDisplayName: 'Host',
        } as StartGameRequest),
      })

      const data = await response.json()

      if (data.success) {
        setPlayerLinks(data.playerLinks)
        if (data.game?.id) {
          setGameCode(data.game.id)
        }
        toast.success('Game started successfully!')
      } else {
        throw new Error(data.error || 'Failed to start game')
      }
    } catch (error: any) {
      console.error('Error starting game:', error)
      toast.error(error.message || 'Failed to start game')
    } finally {
      setIsStartingGame(false)
    }
  }

  const handleResetGame = async () => {
    try {
      if (!gameCode) {
        toast.error('No active game to reset')
        return
      }

      const response = await fetch(`/api/v1/game/state?gameCode=${encodeURIComponent(gameCode)}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPlayerNames('')
        setPlayerLinks({})
        setGameCode(null)
        toast.success('Game reset successfully!')
      } else {
        throw new Error('Failed to reset game')
      }
    } catch (error: any) {
      console.error('Error resetting game:', error)
      toast.error(error.message || 'Failed to reset game')
    }
  }

  const copyPlayerLink = (playerCode: string, playerName: string) => {
    const link = playerLinks[playerCode]
    if (link) {
      navigator.clipboard.writeText(link)
      toast.success(`Link copied for ${playerName}!`)
    }
  }

  const getLocalIP = () => {
    // This is a placeholder - in a real app you'd get the actual local IP
    return window.location.hostname
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 ${className}`}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="snowfall">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                fontSize: `${Math.random() * 0.8 + 0.8}rem`,
              }}
            >
              ❄
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-6xl font-bold text-white mb-4 tv-display">
            🎄 Christmas Murder Mystery 🔪
          </h1>
          <div className="flex items-center justify-center gap-4 text-white">
            <div
              className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}
            >
              <div
                className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
              />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            {gameState?.isActive && (
              <div className="text-yellow-400">
                🎮 Game Active - {gameState.stats.alivePlayers} alive
              </div>
            )}
          </div>
        </motion.header>

        {/* Game Setup */}
        {!gameState?.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-8"
          >
            <div className="glass p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">🎮 Start New Game</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-white text-lg font-semibold mb-2">
                    Player Names (comma separated):
                  </label>
                  <textarea
                    value={playerNames}
                    onChange={(e) => setPlayerNames(e.target.value)}
                    placeholder="Alice, Bob, Charlie, Diana, Eve..."
                    className="w-full p-4 text-lg rounded-lg bg-white bg-opacity-10 text-white placeholder-gray-300 border border-white border-opacity-20 focus:border-white focus:border-opacity-40 focus:outline-none"
                    rows={3}
                  />
                  <p className="text-sm text-gray-300 mt-1">
                    Minimum 3 players required. 2 will be randomly assigned as murderers.
                  </p>
                </div>

                <button
                  onClick={handleStartGame}
                  disabled={isStartingGame || !playerNames.trim()}
                  className="w-full btn-primary text-xl py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStartingGame ? 'Starting Game...' : '🎯 Start Game'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Player Links */}
        {Object.keys(playerLinks).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto mb-8"
          >
            <div className="glass p-6 rounded-xl">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">📱 Player Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gameState?.players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-white bg-opacity-10 p-4 rounded-lg border border-white border-opacity-20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">{player.name}</span>
                      <button
                        onClick={() => copyPlayerLink(player.id, player.name)}
                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        Copy Link
                      </button>
                    </div>
                    <div className="text-xs text-gray-300 mt-1 break-all">
                      {playerLinks[player.id]}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-gray-300 text-sm mt-4">
                Share these links with players so they can join on their phones
              </p>
            </div>
          </motion.div>
        )}

        {/* Main Dashboard */}
        {gameState && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Players Panel */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <div className="glass p-6 rounded-xl h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-white">
                    👥 Players ({gameState.stats.alivePlayers}/{gameState.stats.totalPlayers})
                  </h2>
                  <div className="text-white text-right">
                    <div className="text-lg">🔪 {gameState.stats.murderers} murderers</div>
                    <div className="text-lg">🧑‍🎄 {gameState.stats.civilians} civilians</div>
                  </div>
                </div>

                <PlayerGrid
                  players={gameState.players}
                  showRoles={true}
                  className="h-96 overflow-y-auto"
                />
              </div>
            </motion.div>

            {/* Live Feed */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <LiveFeed killEvents={gameState.killEvents} className="h-full" />
            </motion.div>
          </div>
        )}

        {/* Game Controls */}
        {gameState && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mt-8"
          >
            <div className="glass p-6 rounded-xl">
              <div className="flex justify-center gap-4">
                <button onClick={handleResetGame} className="btn-danger">
                  🔄 Reset Game
                </button>
                {!gameState.isActive && gameState.endTime && (
                  <button
                    onClick={() => {
                      setPlayerNames('')
                      setPlayerLinks({})
                    }}
                    className="btn-secondary"
                  >
                    🎮 New Game
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
