'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import toast from 'react-hot-toast'

import { useSocket } from './useSocket'
import type { CooldownStatus, KillAttemptResult, KillEvent, Player } from '@/app/lib/game/types'

const entranceVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

interface PlayerViewProps {
  playerId: string
  className?: string
}

export function PlayerView({ playerId, className = '' }: PlayerViewProps) {
  const { isConnected, gameState, joinGame, onPlayerKilled, onKillAttemptResult, onGameEnded } = useSocket()

  const [player, setPlayer] = useState<Player | null>(null)
  const [cooldownStatus, setCooldownStatus] = useState<CooldownStatus | null>(null)
  const [availableTargets, setAvailableTargets] = useState<Player[]>([])
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [isKilling, setIsKilling] = useState(false)
  const [cooldownTimer, setCooldownTimer] = useState(0)
  const [gameCode, setGameCode] = useState<string | null>(null)

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

      if (currentPlayer?.role === 'murderer' && currentPlayer.isAlive) {
        setAvailableTargets(gameState.players.filter((target: Player) => target.id !== playerId && target.isAlive))
      } else {
        setAvailableTargets([])
      }
    }
  }, [gameState, playerId])

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!playerId) return

      try {
        const response = await fetch(`/api/v1/game/state?playerCode=${encodeURIComponent(playerId)}`)
        const data = await response.json()

        if (response.ok && data.success) {
          if (data.gameState?.id) {
            setGameCode(data.gameState.id)
          }

          if (data.playerData) {
            setCooldownStatus(data.playerData.cooldownStatus)
            setAvailableTargets(data.playerData.availableTargets)
          }
        } else if (data.error) {
          console.warn('Player state error:', data.error)
        }
      } catch (error) {
        console.error('Error fetching player data:', error)
      }
    }

    fetchPlayerData()
    const interval = setInterval(fetchPlayerData, 1200)

    return () => clearInterval(interval)
  }, [playerId, gameState])

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
        (player?.role === 'murderer' && winner === 'murderers') ||
        (player?.role === 'civilian' && winner === 'civilians')

      toast.success(
        isWinner ? `🎉 Your faction prevails.` : `😢 Defeat. The ${winner} triumph.`,
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
    } catch (error: any) {
      console.error('Error sending kill attempt:', error)
      toast.error(error.message || 'Kill attempt failed')
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
  }, [cooldownStatus?.remainingSeconds])

  const narrativeStatus = useMemo(() => {
    if (!player) return 'Awaiting assignment'
    if (!player.isAlive) return 'Your story ends here. Stay silent.'
    if (player.role === 'murderer') return 'Move quietly. Choose carefully.'
    return 'Observe, listen, and survive.'
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

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6 md:p-10">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={entranceVariants}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="manor-card manor-card--accent space-y-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-body text-xs uppercase tracking-[0.45em] text-manor-parchment/60">
                Your Persona
              </p>
              <h1 className="font-manor text-3xl uppercase tracking-[0.25em] text-manor-candle md:text-4xl">
                {player.name}
              </h1>
            </div>
            <div className="rounded-full border border-white/10 px-4 py-2 font-body text-sm uppercase tracking-[0.3em] text-manor-parchment/70">
              {player.role === 'murderer' ? 'MURDERER' : 'CIVILIAN'} · {player.isAlive ? 'ALIVE' : 'ELIMINATED'}
            </div>
          </div>
          <p className="font-body text-sm text-manor-parchment/80 md:text-base">{narrativeStatus}</p>
          {cooldownStatus && player.role === 'murderer' && (
            <div className="rounded-xl border border-[rgba(177,54,30,0.3)] bg-manor-wine/20 p-4">
              <p className="font-body text-xs uppercase tracking-[0.35em] text-manor-parchment/60">
                Murderer Cooldown
              </p>
              <p className="font-manor text-xl text-manor-candle">
                {cooldownTimer > 0
                  ? `${Math.floor(cooldownTimer / 60)}:${(cooldownTimer % 60).toString().padStart(2, '0')}`
                  : 'Blade Ready'}
              </p>
            </div>
          )}
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={entranceVariants}
          transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
          className="manor-card space-y-4"
        >
          <h2 className="font-manor text-lg uppercase tracking-[0.25em] text-manor-candle">
            Tonight’s Brief
          </h2>
          {player.role === 'murderer' ? (
            <ul className="space-y-3 font-body text-sm text-manor-parchment/80 md:text-base">
              <li>• Pretend innocence. Watch your cooldown. Strike when shadows swallow the room.</li>
              <li>• Victims must be alive and unsuspecting. Consecutive kills demand patience.</li>
              <li>• If a civilian count matches yours, the manor crowns you triumphant.</li>
            </ul>
          ) : (
            <ul className="space-y-3 font-body text-sm text-manor-parchment/80 md:text-base">
              <li>• Share whispers discreetly. Your survival depends on information, not force.</li>
              <li>• Study the incident ledger. Patterns betray the murderer’s rhythm.</li>
              <li>• The manor will proclaim victory if all murderers fall.</li>
            </ul>
          )}
        </motion.section>

        {player.role === 'murderer' && player.isAlive && (
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
                    <p className="font-body text-xs text-manor-parchment/60">Status: {target.isAlive ? 'Alive' : 'Unknown'}</p>
                  </button>
                ))}
              </div>
            )}
            <button
              className={`btn-danger w-full ${
                !selectedTarget || cooldownTimer > 0 || isKilling ? 'cursor-not-allowed opacity-60' : ''
              }`}
              onClick={handleKill}
              disabled={!selectedTarget || cooldownTimer > 0 || isKilling}
            >
              {cooldownTimer > 0 ? 'Blade cooling...' : isKilling ? 'Striking...' : 'Strike from the shadows'}
            </button>
          </motion.section>
        )}

        {player.role !== 'murderer' && player.isAlive && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={entranceVariants}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            className="manor-card space-y-4"
          >
            <h2 className="font-manor text-lg uppercase tracking-[0.25em] text-manor-candle">
              Keep Notes
            </h2>
            <p className="font-body text-sm text-manor-parchment/80 md:text-base">
              Watch the live feed for every incident. Discuss suspicions quietly and keep an eye on
              guests who rarely speak. When in doubt, create a collective theory before time expires.
            </p>
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
              Though your physical form has fallen, you may still observe proceedings. Share no secrets
              unless the host invites your spirit to intervene.
            </p>
          </motion.section>
        )}
      </div>
    </div>
  )
}
