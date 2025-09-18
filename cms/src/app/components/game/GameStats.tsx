'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { SerializedGameState } from '@/app/lib/game/types'

interface GameStatsProps {
  gameState: SerializedGameState
}

export function GameStats({ gameState }: GameStatsProps) {
  const { stats, isActive, settings } = gameState

  const formatDuration = (ms?: number) => {
    if (!ms) return '—'
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const status = (() => {
    if (stats.gameEnded) return { text: 'Performance Concluded', tone: 'text-red-300', badge: '🏁' }
    if (isActive) return { text: 'Performance In Progress', tone: 'text-green-300', badge: '🎭' }
    return { text: 'Lobby Gathering', tone: 'text-amber-300', badge: '🛋️' }
  })()

  const progressAlive = stats.totalPlayers > 0 ? (stats.alivePlayers / stats.totalPlayers) * 100 : 0
  const progressDead = stats.totalPlayers > 0 ? (stats.deadPlayers / stats.totalPlayers) * 100 : 0

  const rows = [
    {
      label: 'Alive Guests',
      value: stats.alivePlayers,
      accent: 'bg-green-500/20 text-green-300',
      border: 'border-green-500/30',
      progress: progressAlive,
    },
    {
      label: 'Departed Guests',
      value: stats.deadPlayers,
      accent: 'bg-red-500/15 text-red-300',
      border: 'border-red-500/30',
      progress: progressDead,
    },
  ]

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 via-transparent to-transparent p-4 text-center"
      >
        <div className="flex items-center justify-center gap-2 text-lg font-semibold uppercase tracking-[0.3em] text-manor-parchment/70">
          <span>{status.badge}</span>
          <span className={status.tone}>{status.text}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-manor-parchment/60">
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-xs uppercase tracking-[0.3em]">Duration</div>
            <div className="mt-1 text-manor-candle font-semibold">
              {formatDuration(stats.duration)}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-xs uppercase tracking-[0.3em]">Murderers</div>
            <div className="mt-1 text-manor-candle font-semibold">
              {stats.murderers}/{settings.murdererCount}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-3">
        {rows.map((row, idx) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * idx, duration: 0.35 }}
            className={`rounded-xl border ${row.border} bg-black/30 p-4`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.3em] text-manor-parchment/60">
                {row.label}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${row.accent}`}>
                {row.value}
              </div>
            </div>
            {row.progress !== undefined && (
              <div className="mt-3 h-2 rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-manor-wine to-manor-candle"
                  style={{ width: `${Math.min(100, Math.max(0, row.progress))}%` }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="rounded-xl border border-white/10 bg-black/20 p-4 text-center"
      >
        <div className="text-xs uppercase tracking-[0.3em] text-manor-parchment/60">
          Total Kills
        </div>
        <div className="mt-1 text-xl font-semibold text-manor-candle">{stats.totalKills}</div>
      </motion.div>
    </div>
  )
}
