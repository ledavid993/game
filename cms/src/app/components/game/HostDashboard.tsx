'use client'

import React, { useEffect, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import toast from 'react-hot-toast'

import { LiveFeed } from './LiveFeed'
import { PlayerGrid } from './PlayerGrid'
import { useSocket } from './useSocket'
import type {
  KillEvent,
  Player,
  SerializedGameState,
  StartGameRequest,
} from '@/app/lib/game/types'

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

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

  const [playerNames, setPlayerNames] = useState('')
  const [isStartingGame, setIsStartingGame] = useState(false)
  const [playerLinks, setPlayerLinks] = useState<Record<string, string>>({})
  const [showQRCodes, setShowQRCodes] = useState(false)
  const [gameCode, setGameCode] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected) {
      joinAsHost()
    }
  }, [isConnected, joinAsHost])

  useEffect(() => {
    const cleanupKilled = onPlayerKilled((killEvent: KillEvent) => {
      toast.error(`💀 ${killEvent.message}`, {
        duration: 4000,
        position: 'top-right',
      })
    })

    const cleanupJoined = onPlayerJoined((player: Player) => {
      toast.success(`👥 ${player.name} joined the manor.`, {
        duration: 3200,
        position: 'top-right',
      })
    })

    const cleanupStarted = onGameStarted((state: SerializedGameState) => {
      toast.success('🎭 The performance begins.', {
        duration: 3000,
        position: 'top-right',
      })
      setGameCode(state.id)
    })

    const cleanupEnded = onGameEnded((winner: 'murderers' | 'civilians') => {
      toast.success(`🎉 ${winner.toUpperCase()} CLAIM VICTORY`, {
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
      toast.error('At least three guests must enter the manor to begin.')
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
        toast.success('Guest invitations prepared.')
      } else {
        throw new Error(data.error || 'Failed to kindle the manor.')
      }
    } catch (error: any) {
      console.error('Error starting game:', error)
      toast.error(error.message || 'Failed to kindle the manor.')
    } finally {
      setIsStartingGame(false)
    }
  }

  const handleResetGame = async () => {
    try {
      if (!gameCode) {
        toast.error('No active session to dismiss.')
        return
      }

      const response = await fetch(`/api/v1/game/state?gameCode=${encodeURIComponent(gameCode)}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPlayerNames('')
        setPlayerLinks({})
        setGameCode(null)
        toast.success('The manor falls silent once more.')
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
      toast.success(`Invitation copied for ${playerName}!`)
    }
  }

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(177,54,30,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(64,19,31,0.28),transparent_55%),linear-gradient(170deg,rgba(9,11,16,0.95)_0%,rgba(16,19,27,0.92)_40%,rgba(6,7,10,0.98)_100%)]" />
      <div className="absolute inset-0 opacity-10" aria-hidden>
        <div className="h-full w-full bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]" />
      </div>

      <div className="relative z-10 space-y-10 p-6 md:p-10">
        <motion.header
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto flex max-w-6xl flex-col gap-6 text-center"
        >
          <div className="flex flex-col items-center gap-3">
            <p className="font-body text-xs uppercase tracking-[0.45em] text-manor-parchment/60">
              The Ballroom Awaits
            </p>
            <h1 className="font-manor text-4xl uppercase tracking-[0.28em] text-manor-candle md:text-5xl">
              Host Control Theatre
            </h1>
          </div>
          <div className="mx-auto flex flex-wrap items-center justify-center gap-4 font-body text-sm text-manor-parchment/75 md:text-base">
            <span className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-500'}`} />
              {isConnected ? 'Manor link established' : 'Attempting to reach the manor...'}
            </span>
            {gameState?.isActive && (
              <span className="rounded-full border border-manor-ember/40 px-3 py-1 text-manor-candle/90">
                Game Active · {gameState.stats.alivePlayers} guests breathing
              </span>
            )}
            {!gameState?.isActive && <span>Stage a séance to begin the experience.</span>}
          </div>
        </motion.header>

        {!gameState?.isActive && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            className="mx-auto w-full max-w-5xl"
          >
            <div className="manor-card manor-card--accent space-y-6">
              <div className="text-center">
                <h2 className="font-manor text-2xl uppercase tracking-[0.25em] text-manor-candle">
                  Compose Your Guest Ledger
                </h2>
                <p className="mt-2 font-body text-sm text-manor-parchment/80 md:text-base">
                  Whisper names separated by commas. The manor insists on at least three souls before the game can stir.
                </p>
              </div>
              <textarea
                value={playerNames}
                onChange={(event) => setPlayerNames(event.target.value)}
                placeholder="Eleanor Glass, Victor North, Adelaide Finch, Henry Wolfe"
                className="h-32 w-full rounded-xl border border-white/10 bg-manor-shadow/60 p-4 font-body text-sm text-manor-candle/85 placeholder:text-manor-parchment/40 focus:border-manor-ember/40 focus:outline-none focus:ring-2 focus:ring-manor-ember/30 md:text-base"
              />
              <div className="manor-divider" />
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <button
                  className={`btn-primary w-full md:w-auto ${isStartingGame ? 'cursor-not-allowed opacity-70' : ''}`}
                  onClick={handleStartGame}
                  disabled={isStartingGame}
                >
                  {isStartingGame ? 'Preparing the Estate...' : 'Invite Guests In'}
                </button>
                <p className="font-body text-xs uppercase tracking-[0.3em] text-manor-parchment/60">
                  Links appear below once the manor doors open.
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {Object.keys(playerLinks).length > 0 && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
            className="mx-auto w-full max-w-5xl"
          >
            <div className="manor-card space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-manor-candle">
                  Personalised Keys
                </h3>
                <button className="btn-secondary w-full md:w-auto" onClick={() => setShowQRCodes((prev) => !prev)}>
                  {showQRCodes ? 'Conceal QR Sigils' : 'Reveal QR Sigils'}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Object.entries(playerLinks).map(([playerId, link]) => (
                  <div key={playerId} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-body text-sm uppercase tracking-[0.3em] text-manor-candle/80">{playerId}</p>
                      <button
                        className="text-xs text-manor-parchment/70 transition hover:text-manor-candle"
                        onClick={() => copyPlayerLink(playerId, playerId)}
                      >
                        Copy link
                      </button>
                    </div>
                    <p className="mt-2 break-words font-body text-xs text-manor-parchment/60">{link}</p>
                    {showQRCodes && (
                      <div className="mt-4 flex justify-center">
                        <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-manor-ember/40 bg-white/95 text-xs font-semibold text-manor-wine">
                          QR CODE
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {gameState?.isActive && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
            className="mx-auto w-full max-w-6xl space-y-6"
          >
            <div className="manor-card manor-card--accent flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h3 className="font-manor text-xl uppercase tracking-[0.25em] text-manor-candle">
                  Real-Time Chronicle
                </h3>
                <p className="font-body text-sm text-manor-parchment/80 md:text-base">
                  Track allegiances, watch the incident ledger flicker, and keep your living guests calm while the manor whispers in their ears.
                </p>
              </div>
              <div className="flex flex-col gap-3 text-right">
                <div className="font-body text-sm text-manor-parchment/70">
                  <p>Total Guests: {gameState.stats.totalPlayers}</p>
                  <p>Alive: {gameState.stats.alivePlayers}</p>
                  <p>Departed: {gameState.stats.deadPlayers}</p>
                </div>
                <button className="btn-danger" onClick={handleResetGame}>
                  Close the Manor
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1fr]">
              <div className="manor-card">
                <PlayerGrid players={gameState.players as SerializedGameState['players']} />
              </div>
              <div className="manor-card">
                <LiveFeed
                  killEvents={gameState.killEvents}
                  onPlayerKilled={() => undefined}
                  className="bg-transparent"
                />
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}
