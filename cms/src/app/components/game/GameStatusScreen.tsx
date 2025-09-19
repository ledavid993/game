'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useSocket } from './useSocket'
import { PlayerStatusGrid } from './PlayerStatusGrid'
import { GameStats } from './GameStats'
import { LiveFeed } from './LiveFeed'
import { VotingResults } from './VotingResults'
import type { SerializedGameState } from '@/app/lib/game/types'

interface GameStatusScreenProps {
  initialGameState: SerializedGameState
}

export default function GameStatusScreen({ initialGameState }: GameStatusScreenProps) {
  const { gameState, isConnected } = useSocket()
  const [currentState, setCurrentState] = useState<SerializedGameState>(initialGameState)
  const [playerFilter, setPlayerFilter] = useState<'all' | 'alive' | 'dead'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const stateFingerprintRef = useRef<string>('')

  // Generate stable snowflake and star data that won't change on re-renders
  const snowflakeData = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      fontSize: Math.random() * 12 + 16,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 10,
      xMovement: Math.random() * 100 - 50,
    })), []
  )

  const starData = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      fontSize: Math.random() * 8 + 12,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    })), []
  )

  useEffect(() => {
    if (gameState) {
      setCurrentState(gameState)
    }
  }, [gameState])

  const activeState = currentState
  useEffect(() => {
    const fingerprint = JSON.stringify({
      id: currentState.id,
      isActive: currentState.isActive,
      stats: currentState.stats,
      players: currentState.players.map((player) => ({
        id: player.id,
        isAlive: player.isAlive,
        role: player.role,
      })),
      killEvents: currentState.killEvents?.map((event) => event.id) ?? [],
    })
    stateFingerprintRef.current = fingerprint
  }, [currentState])
  const aliveCount = activeState.stats.alivePlayers
  const deadCount = activeState.stats.deadPlayers
  const totalPlayers = activeState.stats.totalPlayers

  const filteredPlayers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return activeState.players.filter((player) => {
      if (playerFilter === 'alive' && !player.isAlive) return false
      if (playerFilter === 'dead' && player.isAlive) return false

      if (!term) return true
      return player.name.toLowerCase().includes(term) || player.id.toLowerCase().includes(term)
    })
  }, [activeState.players, playerFilter, searchTerm])

  useEffect(() => {
    let cancelled = false
    let timeoutId: ReturnType<typeof window.setTimeout>

    const poll = async () => {
      try {
        const response = await fetch(`/api/v1/game/state?gameCode=GAME_MAIN&_t=${Date.now()}`, {
          cache: 'no-store',
        })
        if (!response.ok) return
        const data = await response.json()
        if (data.success && data.gameState) {
          const nextState = data.gameState as SerializedGameState
          const nextFingerprint = JSON.stringify({
            id: nextState.id,
            isActive: nextState.isActive,
            stats: nextState.stats,
            players: nextState.players.map((player) => ({
              id: player.id,
              isAlive: player.isAlive,
              role: player.role,
            })),
            killEvents: nextState.killEvents?.map((event) => event.id) ?? [],
          })
          if (nextFingerprint !== stateFingerprintRef.current && !cancelled) {
            setCurrentState(nextState)
          }
        }
      } catch (error) {
        console.warn('Failed to poll game status', error)
      } finally {
        if (!cancelled) {
          timeoutId = window.setTimeout(poll, 5000)
        }
      }
    }

    timeoutId = window.setTimeout(poll, 5000)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [])

  const playerDensity =
    filteredPlayers.length >= 60 ? 'ultra' : filteredPlayers.length >= 30 ? 'dense' : 'normal'

  return (
    <div className="w-screen h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.15),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.1),_transparent_45%),linear-gradient(140deg,_rgba(9,11,16,0.96)_0%,_rgba(17,22,34,0.92)_55%,_rgba(4,5,9,0.98)_100%)]">
      {/* Christmas Snowflakes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-50" aria-hidden>
        {snowflakeData.map((snowflake) => (
          <motion.div
            key={snowflake.id}
            className="absolute text-white/60"
            style={{
              left: `${snowflake.left}%`,
              fontSize: `${snowflake.fontSize}px`,
            }}
            initial={{ y: -20, rotate: 0 }}
            animate={{
              y: window.innerHeight + 20,
              rotate: 360,
              x: [0, snowflake.xMovement],
            }}
            transition={{
              duration: snowflake.duration,
              repeat: Infinity,
              ease: "linear",
              delay: snowflake.delay,
            }}
          >
            ❄️
          </motion.div>
        ))}
      </div>

      {/* Christmas Decorations */}
      <div className="absolute inset-0 pointer-events-none z-40" aria-hidden>
        {/* Top left Christmas tree */}
        <div className="absolute top-4 left-4 text-green-400/80 text-4xl">🎄</div>
        {/* Top right wreath */}
        <div className="absolute top-4 right-4 text-green-400/80 text-4xl">🎁</div>
        {/* Bottom left star */}
        <div className="absolute bottom-4 left-4 text-yellow-400/80 text-3xl">⭐</div>
        {/* Bottom right bells */}
        <div className="absolute bottom-4 right-4 text-yellow-400/80 text-3xl">🔔</div>

        {/* Holly decorations in corners */}
        <div className="absolute top-16 left-16 text-green-400/70 text-2xl">🍃</div>
        <div className="absolute top-16 right-16 text-red-400/70 text-xl">🎀</div>
        <div className="absolute bottom-16 left-16 text-red-400/70 text-xl">🍎</div>
        <div className="absolute bottom-16 right-16 text-green-400/70 text-2xl">🌿</div>

        {/* Twinkling stars */}
        {starData.map((star) => (
          <motion.div
            key={`star-${star.id}`}
            className="absolute text-yellow-200/80"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              fontSize: `${star.fontSize}px`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>

      <div className="absolute inset-0 opacity-20" aria-hidden>
        <div className="h-full w-full bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')]" />
      </div>

      <div className="relative z-20 h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col gap-6 px-6 py-6 overflow-hidden">
            {/* Voting Results Section */}
            <motion.section
              initial={{ opacity: 0, y: -25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-lg shadow-xl flex flex-col overflow-hidden"
            >
              <VotingResults gameId={activeState.id} aliveCount={aliveCount} />
            </motion.section>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 overflow-hidden">
              <div className="flex flex-col gap-6 overflow-hidden">
                <motion.section
                  initial={{ opacity: 0, x: -25 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-lg shadow-xl"
                >
                  <div className="p-5">
                    <GameStats gameState={activeState} />
                  </div>
                </motion.section>
              </div>

              <motion.section
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-lg shadow-xl flex flex-col overflow-hidden"
              >
                <div className="border-b border-white/10 px-6 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h2 className="font-manor text-[clamp(1.2rem,2.1vw,1.6rem)] uppercase tracking-[0.3em] text-manor-candle flex items-center gap-3">
                      🎄 Guest Registry 🎄
                    </h2>
                    <p className="text-sm text-manor-parchment/70 mt-1 flex items-center gap-2">
                      ❄️ {totalPlayers} guests · {aliveCount} alive · {deadCount} departed ❄️
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
                      {(['all', 'alive', 'dead'] as const).map((option) => {
                        const label =
                          option === 'all'
                            ? `🎁 All (${totalPlayers})`
                            : option === 'alive'
                              ? `🎄 Alive (${aliveCount})`
                              : `❄️ Departed (${deadCount})`
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setPlayerFilter(option)}
                            className={`px-3 py-1.5 text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.3em] rounded-full transition-colors ${
                              playerFilter === option
                                ? 'bg-manor-wine text-manor-candle shadow-inner'
                                : 'text-manor-parchment/70 hover:text-manor-candle'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search players..."
                        className="w-full sm:w-56 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-manor-candle placeholder:text-manor-parchment/40 focus:outline-none focus:ring-2 focus:border-manor-wine/40 focus:ring-manor-wine/25"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-2.5 text-manor-parchment/60 hover:text-manor-candle"
                          aria-label="Clear player search"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <PlayerStatusGrid
                    players={filteredPlayers}
                    showRoles={activeState.stats.gameEnded}
                    emptyMessage={
                      searchTerm
                        ? `No guests match “${searchTerm}”.`
                        : playerFilter === 'alive'
                          ? 'All guests have fallen.'
                          : playerFilter === 'dead'
                            ? 'No recorded casualties.'
                            : 'No guests in the manor.'
                    }
                    density={playerDensity}
                  />
                </div>
              </motion.section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
