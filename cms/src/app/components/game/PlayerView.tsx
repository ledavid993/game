'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import toast from 'react-hot-toast'

import { useSocket } from './useSocket'
import type { CooldownStatus, KillAttemptResult, KillEvent, Player } from '@/app/lib/game/types'
import { ROLE_LABELS, isMurdererRole } from '@/app/lib/game/roles'
import { RoleSpecificActions, VotingInterface } from './RoleActions'
import { RoleCard } from './RoleCard'

const entranceVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

interface PlayerViewProps {
  playerId: string
  className?: string
}

export function PlayerView({ playerId, className = '' }: PlayerViewProps) {
  const { isConnected, gameState, joinGame, onPlayerKilled, onKillAttemptResult, onGameEnded } =
    useSocket()

  const [player, setPlayer] = useState<Player | null>(null)
  const [cooldownStatus, setCooldownStatus] = useState<CooldownStatus | null>(null)
  const [availableTargets, setAvailableTargets] = useState<Player[]>([])
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [isKilling, setIsKilling] = useState(false)
  const [cooldownTimer, setCooldownTimer] = useState(0)
  const [gameCode, setGameCode] = useState<string | null>(null)
  const [isLoadingPlayer, setIsLoadingPlayer] = useState(true)

  // Function to refresh player data when needed
  const refreshPlayerData = async () => {
    if (!playerId) return

    try {
      const response = await fetch(
        `/api/v1/game/state?playerCode=${encodeURIComponent(playerId)}`,
      )
      const data = await response.json()

      if (response.ok && data.success) {
        if (data.playerData) {
          setCooldownStatus(data.playerData.cooldownStatus)
          if (data.playerData.player) {
            setPlayer(data.playerData.player)
          }
        }

        if (data.gameState?.players) {
          setAvailableTargets(data.gameState.players)
          const currentPlayer = data.gameState.players.find((p: Player) => p.id === playerId)
          if (currentPlayer) {
            setPlayer(currentPlayer)
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing player data:', error)
    }
  }

  useEffect(() => {
    if (isConnected && playerId) {
      joinGame(playerId)
    }
  }, [isConnected, playerId, joinGame])

  useEffect(() => {
    if (gameState && playerId) {
      setGameCode(gameState.id)
      const currentPlayer = gameState.players.find((p: Player) => p.id === playerId)
      setPlayer(currentPlayer || null)

      // Set all players as available targets for voting (will be filtered in components)
      setAvailableTargets(gameState.players)
    }
  }, [gameState, playerId])

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!playerId) {
        setIsLoadingPlayer(false)
        return
      }

      setIsLoadingPlayer(true)

      try {
        const response = await fetch(
          `/api/v1/game/state?playerCode=${encodeURIComponent(playerId)}`,
        )
        const data = await response.json()

        if (response.ok && data.success) {
          if (data.gameState?.id) {
            setGameCode(data.gameState.id)
          }

          if (data.playerData) {
            setCooldownStatus(data.playerData.cooldownStatus)

            // Set the player from the API response
            if (data.playerData.player) {
              setPlayer(data.playerData.player)
            }
          }

          // Also set the player from the gameState if available
          if (data.gameState?.players) {
            const currentPlayer = data.gameState.players.find((p: Player) => p.id === playerId)
            if (currentPlayer) {
              setPlayer(currentPlayer)
            }
            setAvailableTargets(data.gameState.players)
          }
        } else if (data.error) {
          console.warn('Player state error:', data.error)
        }
      } catch (error) {
        console.error('Error fetching player data:', error)
      } finally {
        setIsLoadingPlayer(false)
      }
    }

    fetchPlayerData()
  }, [playerId])

  useEffect(() => {
    const cleanupKilled = onPlayerKilled((killEvent: KillEvent) => {
      if (killEvent.victim === player?.name) {
        toast.error('💀 You have been discovered.', {
          duration: 5000,
          position: 'top-center',
        })
      } else {
        toast.error(`💀 ${killEvent.message}`, {
          duration: 3200,
        })
      }
    })

    const cleanupResult = onKillAttemptResult((result: KillAttemptResult) => {
      if (result.success) {
        toast.success(`✅ ${result.message}`, {
          duration: 3200,
        })
      } else {
        toast.error(`❌ ${result.message}`, {
          duration: 3200,
        })
      }
    })

    const cleanupEnded = onGameEnded((winner: 'murderers' | 'civilians') => {
      const isWinner =
        (player && isMurdererRole(player.role) && winner === 'murderers') ||
        (player && !isMurdererRole(player.role) && winner === 'civilians')

      toast.success(isWinner ? `🎉 Your faction prevails.` : `😢 Defeat. The ${winner} triumph.`, {
        duration: 8000,
        position: 'top-center',
      })
    })

    return () => {
      cleanupKilled()
      cleanupResult()
      cleanupEnded()
    }
  }, [onPlayerKilled, onKillAttemptResult, onGameEnded, player])

  const handleKill = async () => {
    if (!selectedTarget || !player || isKilling || !gameCode) return

    setIsKilling(true)

    try {
      const response = await fetch('/api/v1/game/kill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameCode,
          murdererCode: player.id,
          victimCode: selectedTarget,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        toast.error(`❌ ${result.message || 'Your blade misses its mark.'}`, { duration: 4000 })
      } else {
        toast.success(`✅ ${result.message}`, { duration: 4000 })
        setSelectedTarget('')
      }
    } catch (error) {
      console.error('Error sending kill attempt:', error)
      const message = error instanceof Error ? error.message : 'Kill attempt failed'
      toast.error(message)
    } finally {
      setIsKilling(false)
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(200)
    }
  }

  useEffect(() => {
    if (!cooldownStatus) {
      setCooldownTimer(0)
      return
    }

    setCooldownTimer(cooldownStatus.remainingSeconds)
    if (cooldownStatus.remainingSeconds <= 0) return

    const interval = setInterval(() => {
      setCooldownTimer((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [cooldownStatus])

  // Refresh cooldown status for murderers periodically (less aggressive)
  useEffect(() => {
    if (!player || !isMurdererRole(player.role) || !playerId) return

    const refreshCooldown = async () => {
      try {
        const response = await fetch(
          `/api/v1/game/state?playerCode=${encodeURIComponent(playerId)}`,
        )
        const data = await response.json()

        if (response.ok && data.success && data.playerData) {
          setCooldownStatus(data.playerData.cooldownStatus)
        }
      } catch (error) {
        // Silently fail, not critical
      }
    }

    // Only refresh cooldown every 30 seconds for murderers
    const interval = setInterval(refreshCooldown, 30000)
    return () => clearInterval(interval)
  }, [player, playerId])

  const narrativeStatus = useMemo(() => {
    if (!player) return 'Awaiting assignment'
    if (!player.isAlive) return 'Your story ends here. Stay silent.'
    if (isMurdererRole(player.role)) return 'Move quietly. Choose carefully.'
    return `Embrace your ${ROLE_LABELS[player.role]} duties.`
  }, [player])

  if (!isConnected) {
    return (
      <div className={`min-h-screen ${className}`}>
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(177,54,30,0.25),_transparent_55%),_linear-gradient(160deg,_#090b10,_#040508)] p-6">
          <div className="manor-card text-center">
            <div className="text-6xl mb-4">🔄</div>
            <p className="font-manor text-xl uppercase tracking-[0.25em] text-manor-candle">
              Summoning the manor...
            </p>
            <p className="mt-2 font-body text-sm text-manor-parchment/80">
              Keep this window open while we secure your place by the fire.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoadingPlayer) {
    return (
      <div className={`min-h-screen ${className}`}>
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(177,54,30,0.25),_transparent_55%),_linear-gradient(160deg,_#090b10,_#040508)] p-6">
          <div className="manor-card text-center">
            <div className="text-6xl mb-4">🔄</div>
            <p className="font-manor text-xl uppercase tracking-[0.25em] text-manor-candle">
              Loading your role...
            </p>
            <p className="mt-2 font-body text-sm text-manor-parchment/80">
              Preparing your place in the manor.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className={`min-h-screen ${className}`}>
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(177,54,30,0.25),_transparent_55%),_linear-gradient(160deg,_#090b10,_#040508)] p-6">
          <div className="manor-card text-center">
            <div className="text-6xl mb-4">❓</div>
            <p className="font-manor text-xl uppercase tracking-[0.25em] text-manor-candle">
              Invitation Pending
            </p>
            <p className="mt-2 font-body text-sm text-manor-parchment/80">
              The host may have restarted the séance. Wait for a new link or refresh once more.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(177,54,30,0.16),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(64,19,31,0.28),transparent_55%),linear-gradient(170deg,rgba(9,11,16,0.95)_0%,rgba(16,19,27,0.92)_40%,rgba(6,7,10,0.98)_100%)]" />
      <div className="absolute inset-0 opacity-10" aria-hidden>
        <div className="h-full w-full bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')]" />
      </div>

      <div className="relative z-10 flex flex-col">
        <RoleCard
          player={player}
          narrativeStatus={narrativeStatus}
          cooldownStatus={cooldownStatus}
          cooldownTimer={cooldownTimer}
          showScrollIndicator={true}
          gameCode={gameCode || undefined}
          availableTargets={availableTargets}
        />

        {/* Voting Section - Only visible to alive players */}
        {player.isAlive && (
          <div className="mx-auto max-w-5xl w-full px-6 md:px-10 py-6">
            <motion.section
              initial="hidden"
              animate="visible"
              variants={entranceVariants}
              transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
              className="manor-card space-y-4"
            >
              <VotingInterface
                player={player}
                gameCode={gameCode || ''}
                availableTargets={availableTargets}
                onActionComplete={refreshPlayerData}
              />
            </motion.section>
          </div>
        )}

        {/* Role-specific Actions Section */}
        <div className="mx-auto max-w-5xl w-full px-6 md:px-10 pb-6 space-y-6">
            {isMurdererRole(player.role) && player.isAlive && (
              <motion.section
                initial="hidden"
                animate="visible"
                variants={entranceVariants}
                transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                className="manor-card space-y-4"
              >
                <h2 className="font-manor text-lg uppercase tracking-[0.25em] text-manor-candle">
                  Select a Target
                </h2>
                {availableTargets.length === 0 ? (
                  <p className="font-body text-sm text-manor-parchment/70">
                    No viable guests remain. Await further developments.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {availableTargets.map((target) => (
                      <button
                        key={target.id}
                        className={`rounded-2xl border p-4 text-left transition hover:border-[rgba(177,54,30,0.5)] ${
                          selectedTarget === target.id
                            ? 'border-[rgba(177,54,30,0.8)] bg-manor-wine/30'
                            : 'border-white/10 bg-black/20'
                        }`}
                        onClick={() => setSelectedTarget(target.id)}
                      >
                        <p className="font-manor text-base uppercase tracking-[0.2em] text-manor-candle">
                          {target.name}
                        </p>
                        <p className="font-body text-xs text-manor-parchment/60">
                          Status: {target.isAlive ? 'Alive' : 'Unknown'}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  className={`btn-danger w-full ${
                    !selectedTarget || cooldownTimer > 0 || isKilling
                      ? 'cursor-not-allowed opacity-60'
                      : ''
                  }`}
                  onClick={handleKill}
                  disabled={!selectedTarget || cooldownTimer > 0 || isKilling}
                >
                  {cooldownTimer > 0
                    ? `Cooldown: ${Math.floor(cooldownTimer / 60)}m ${cooldownTimer % 60}s`
                    : isKilling
                      ? 'Striking...'
                      : 'Strike from the shadows'}
                </button>
              </motion.section>
            )}

            {!isMurdererRole(player.role) && player.isAlive && (
              <motion.section
                initial="hidden"
                animate="visible"
                variants={entranceVariants}
                transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                className="manor-card space-y-4"
              >
                <RoleSpecificActions
                  player={player}
                  gameCode={gameCode || ''}
                  availableTargets={gameState?.players || []}
                  onActionComplete={refreshPlayerData}
                />
              </motion.section>
            )}

            {!player.isAlive && (
              <motion.section
                initial="hidden"
                animate="visible"
                variants={entranceVariants}
                transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
                className="manor-card space-y-3 border-dashed border-white/20 bg-black/10"
              >
                <h2 className="font-manor text-lg uppercase tracking-[0.25em] text-manor-candle">
                  You Are a Whisper
                </h2>
                <p className="font-body text-sm text-manor-parchment/75 md:text-base">
                  Though your physical form has fallen, you may still observe proceedings. Share no
                  secrets unless the host invites your spirit to intervene.
                </p>
              </motion.section>
            )}
        </div>
      </div>
    </div>
  )
}
