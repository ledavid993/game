'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from './useSocket'
import { Player, CooldownStatus, KillAttemptResult } from '@/app/lib/game/types'
import toast from 'react-hot-toast'

interface PlayerViewProps {
  playerId: string
  className?: string
}

export function PlayerView({ playerId, className = '' }: PlayerViewProps) {
  const {
    isConnected,
    gameState,
    joinGame,
    killPlayer,
    onPlayerKilled,
    onKillAttemptResult,
    onGameEnded,
  } = useSocket()

  const [player, setPlayer] = useState<Player | null>(null)
  const [cooldownStatus, setCooldownStatus] = useState<CooldownStatus | null>(null)
  const [availableTargets, setAvailableTargets] = useState<Player[]>([])
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [isKilling, setIsKilling] = useState(false)
  const [cooldownTimer, setCooldownTimer] = useState<number>(0)

  useEffect(() => {
    if (isConnected && playerId) {
      joinGame(playerId)
    }
  }, [isConnected, playerId, joinGame])

  useEffect(() => {
    if (gameState && playerId) {
      const currentPlayer = gameState.players.find((p) => p.id === playerId)
      setPlayer(currentPlayer || null)

      // Get available targets for murderers
      if (currentPlayer?.role === 'murderer' && currentPlayer.isAlive) {
        const targets = gameState.players.filter((p) => p.id !== playerId && p.isAlive)
        setAvailableTargets(targets)
      } else {
        setAvailableTargets([])
      }
    }
  }, [gameState, playerId])

  useEffect(() => {
    // Fetch player-specific data including cooldown
    const fetchPlayerData = async () => {
      if (!playerId) return

      try {
        const response = await fetch(`/api/v1/game/state?playerId=${playerId}`)
        const data = await response.json()

        if (data.playerData) {
          setCooldownStatus(data.playerData.cooldownStatus)
          setAvailableTargets(data.playerData.availableTargets)
        }
      } catch (error) {
        console.error('Error fetching player data:', error)
      }
    }

    fetchPlayerData()
    const interval = setInterval(fetchPlayerData, 1000) // Update every second for cooldown

    return () => clearInterval(interval)
  }, [playerId, gameState])

  useEffect(() => {
    // Set up event listeners
    const cleanupKilled = onPlayerKilled((killEvent) => {
      if (killEvent.victim === player?.name) {
        toast.error('💀 You have been killed!', {
          duration: 5000,
          position: 'top-center',
        })
      } else {
        toast.error(`💀 ${killEvent.message}`, {
          duration: 3000,
        })
      }
    })

    const cleanupResult = onKillAttemptResult((result: KillAttemptResult) => {
      setIsKilling(false)
      setSelectedTarget('')

      if (result.success) {
        toast.success(`✅ ${result.message}`, {
          duration: 4000,
        })
      } else {
        toast.error(`❌ ${result.message}`, {
          duration: 4000,
        })
      }
    })

    const cleanupEnded = onGameEnded((winner) => {
      const isWinner =
        (player?.role === 'murderer' && winner === 'murderers') ||
        (player?.role === 'civilian' && winner === 'civilians')

      toast.success(
        isWinner
          ? `🎉 You Win! ${winner.toUpperCase()} VICTORY!`
          : `😢 You Lose! ${winner.toUpperCase()} WIN!`,
        {
          duration: 8000,
          position: 'top-center',
        },
      )
    })

    return () => {
      cleanupKilled()
      cleanupResult()
      cleanupEnded()
    }
  }, [onPlayerKilled, onKillAttemptResult, onGameEnded, player])

  const handleKill = async () => {
    if (!selectedTarget || !player || isKilling) return

    setIsKilling(true)
    killPlayer(player.id, selectedTarget)

    // Add haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(200)
    }
  }

  const formatCooldownTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getPlayerStatusEmoji = (): string => {
    if (!player) return '❓'
    if (!player.isAlive) return '💀'
    if (player.role === 'murderer') return '🔪'
    return '🧑‍🎄'
  }

  const getPlayerStatusColor = (): string => {
    if (!player) return 'bg-gray-900'
    if (!player.isAlive) return 'bg-gray-900'
    if (player.role === 'murderer') return 'bg-red-900'
    return 'bg-green-900'
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen-mobile bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🔄</div>
          <p className="text-xl">Connecting to game...</p>
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen-mobile bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">❓</div>
          <p className="text-xl">Player not found</p>
          <p className="text-sm text-gray-400 mt-2">Game may not have started yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen-mobile ${getPlayerStatusColor()} ${className}`}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="snowfall">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                fontSize: `${Math.random() * 0.5 + 0.5}rem`,
              }}
            >
              ❄
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-8xl mb-4">{getPlayerStatusEmoji()}</div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome, {player.name}!</h1>
          <div
            className={`inline-block px-4 py-2 rounded-full text-lg font-semibold ${
              player.isAlive ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}
          >
            {player.isAlive ? 'ALIVE' : 'DEAD'}
          </div>
        </motion.div>

        {/* Connection Status */}
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300' : 'bg-red-300'}`}
            />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Role Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/30 backdrop-blur-sm rounded-xl p-6 mb-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Your Role</h2>
            <div
              className={`text-6xl mb-4 ${
                player.role === 'murderer' ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {player.role === 'murderer' ? '🔪' : '🧑‍🎄'}
            </div>
            <p
              className={`text-xl font-semibold ${
                player.role === 'murderer' ? 'text-red-300' : 'text-green-300'
              }`}
            >
              {player.role === 'murderer' ? 'MURDERER' : 'CIVILIAN'}
            </p>
            <p className="text-sm text-gray-300 mt-2">
              {player.role === 'murderer'
                ? 'Eliminate civilians, but avoid suspicion!'
                : 'Stay alive and help identify the murderers!'}
            </p>
          </div>
        </motion.div>

        {/* Game Status */}
        {gameState && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 backdrop-blur-sm rounded-xl p-4 mb-6"
          >
            <h3 className="text-lg font-semibold text-white mb-2 text-center">Game Status</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl text-green-400">{gameState.stats.alivePlayers}</div>
                <div className="text-xs text-gray-400">Alive</div>
              </div>
              <div>
                <div className="text-2xl text-red-400">{gameState.stats.deadPlayers}</div>
                <div className="text-xs text-gray-400">Dead</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Murderer Controls */}
        {player.role === 'murderer' && player.isAlive && gameState?.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 backdrop-blur-sm rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-red-300 mb-4 text-center">🔪 Murder Controls</h3>

            {/* Cooldown Display */}
            {cooldownStatus && !cooldownStatus.canKill && (
              <div className="mb-4">
                <div className="text-center text-yellow-300 mb-2">⏳ Cooldown Active</div>
                <div className="cooldown-timer">
                  <div
                    className="cooldown-progress"
                    style={{
                      width: `${((10 * 60 - cooldownStatus.remainingSeconds) / (10 * 60)) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-center text-sm text-gray-300 mt-1">
                  {formatCooldownTime(cooldownStatus.remainingSeconds)} remaining
                </div>
              </div>
            )}

            {/* Target Selection */}
            {availableTargets.length > 0 && cooldownStatus?.canKill && (
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-semibold mb-2">
                    Select Target:
                  </label>
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="w-full p-3 text-lg rounded-lg bg-black/50 text-white border border-red-500/50 focus:border-red-400 focus:outline-none mobile-touch"
                  >
                    <option value="">Choose a victim...</option>
                    {availableTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.name}
                      </option>
                    ))}
                  </select>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleKill}
                  disabled={!selectedTarget || isKilling}
                  className="w-full mobile-touch bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg text-xl shadow-lg transition-all duration-200"
                >
                  {isKilling ? '🔄 Killing...' : '🔪 KILL'}
                </motion.button>
              </div>
            )}

            {availableTargets.length === 0 && (
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">🎉</div>
                <p>No targets available</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Civilian Info */}
        {player.role === 'civilian' && player.isAlive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 backdrop-blur-sm rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-green-300 mb-4 text-center">
              🧑‍🎄 Civilian Status
            </h3>
            <div className="text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <p className="text-white">Stay vigilant!</p>
              <p className="text-sm text-gray-300 mt-2">
                Watch for suspicious behavior and try to survive until the murderers are caught.
              </p>
            </div>
          </motion.div>
        )}

        {/* Dead Player Display */}
        {!player.isAlive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 backdrop-blur-sm rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-gray-300 mb-4 text-center">💀 You Are Dead</h3>
            <div className="text-center">
              <div className="text-4xl mb-4">👻</div>
              <p className="text-white">You have been eliminated!</p>
              <p className="text-sm text-gray-300 mt-2">
                You can watch the rest of the game unfold, but cannot take any actions.
              </p>
            </div>
          </motion.div>
        )}

        {/* Game Not Active */}
        {!gameState?.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 backdrop-blur-sm rounded-xl p-6"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-white text-lg">Game Not Active</p>
              <p className="text-sm text-gray-300 mt-2">
                Waiting for the host to start the game...
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
