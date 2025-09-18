'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useSocket } from './useSocket'
import { PlayerStatusGrid } from './PlayerStatusGrid'
import { GameStats } from './GameStats'
import { LiveFeed } from './LiveFeed'
import type { SerializedGameState } from '@/app/lib/game/types'

interface GameStatusScreenProps {
  initialGameState: SerializedGameState
}

export default function GameStatusScreen({ initialGameState }: GameStatusScreenProps) {
  const { gameState, isConnected } = useSocket()
  const [currentState, setCurrentState] = useState<SerializedGameState>(initialGameState)
  const [playerFilter, setPlayerFilter] = useState<'all' | 'alive' | 'dead'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (gameState) {
      setCurrentState(gameState)
    }
  }, [gameState])

  const activeState = currentState
  const aliveCount = activeState.stats.alivePlayers
  const deadCount = activeState.stats.deadPlayers
  const totalPlayers = activeState.stats.totalPlayers

  const filteredPlayers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return activeState.players.filter((player) => {
      if (playerFilter === 'alive' && !player.isAlive) return false
      if (playerFilter === 'dead' && player.isAlive) return false

      if (!term) return true
      return (
        player.name.toLowerCase().includes(term) ||
        player.id.toLowerCase().includes(term)
      )
    })
  }, [activeState.players, playerFilter, searchTerm])

  return (
    <div className="w-screen h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(177,54,30,0.2),_transparent_55%),linear-gradient(140deg,_rgba(9,11,16,0.96)_0%,_rgba(17,22,34,0.92)_55%,_rgba(4,5,9,0.98)_100%)]">
      <div className="absolute inset-0 opacity-20" aria-hidden>
        <div className="h-full w-full bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')]" />
      </div>

      <div className="absolute top-5 right-6 z-30">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.25em]
            border ${isConnected ? 'border-green-500/30 bg-green-900/40 text-green-300' : 'border-red-500/30 bg-red-900/40 text-red-300'}
          `}
        >
          <span className="text-lg">{isConnected ? '🟢' : '🔴'}</span>
          {isConnected ? 'Live Connection' : 'Offline'}
        </motion.div>
      </div>

      <div className="relative z-20 h-full flex flex-col">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-shrink-0 px-6 py-8 text-center border-b border-white/10 backdrop-blur"
        >
          <h1 className="font-manor text-[clamp(1.8rem,3vw,2.6rem)] uppercase tracking-[0.4em] text-manor-candle mb-4">
            Manor Status Board
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm uppercase tracking-[0.3em] text-manor-parchment/70">
            <span className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
              🆔 Game Code: <span className="text-manor-candle">{activeState.id}</span>
            </span>
            <span className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
              {activeState.stats.gameEnded ? '🏁 Performance Concluded' : activeState.isActive ? '🎭 Performance In Progress' : '🛋️ Lobby Gathering'}
            </span>
            <span className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
              ⏱ Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </motion.header>

        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 px-6 py-6 overflow-hidden">
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

              <motion.section
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-lg shadow-xl flex-1 min-h-[18rem] overflow-hidden"
              >
                <LiveFeed killEvents={activeState.killEvents || []} className="bg-transparent h-full" highlightNewEvent={false} />
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
                  <h2 className="font-manor text-[clamp(1.2rem,2.1vw,1.6rem)] uppercase tracking-[0.3em] text-manor-candle">
                    Guest Registry
                  </h2>
                  <p className="text-sm text-manor-parchment/70 mt-1">
                    {totalPlayers} guests · {aliveCount} alive · {deadCount} departed
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
                    {(['all', 'alive', 'dead'] as const).map((option) => {
                      const label = option === 'all'
                        ? `All (${totalPlayers})`
                        : option === 'alive'
                          ? `Alive (${aliveCount})`
                          : `Departed (${deadCount})`
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
                />
              </div>
            </motion.section>
          </div>
        </div>

        <motion.footer
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-shrink-0 px-6 py-5 border-t border-white/10 text-center text-xs uppercase tracking-[0.35em] text-manor-parchment/50 backdrop-blur"
        >
          Whispered status relayed in real time.
        </motion.footer>
      </div>
    </div>
  )
}
