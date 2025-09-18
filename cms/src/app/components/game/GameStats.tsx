'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { SerializedGameState } from '@/app/lib/game/types'

interface GameStatsProps {
  gameState: SerializedGameState
}

export function GameStats({ gameState }: GameStatsProps) {
  const { stats, isActive } = gameState

  const formatDuration = (ms?: number) => {
    if (!ms) return '—'
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const getGameStatus = () => {
    if (stats.gameEnded) return { text: 'Completed', color: 'text-red-500', icon: '🏁' }
    if (isActive) return { text: 'In Progress', color: 'text-green-500', icon: '🎭' }
    return { text: 'Lobby', color: 'text-yellow-500', icon: '⏳' }
  }

  const status = getGameStatus()

  const statCards = [
    {
      value: stats.alivePlayers,
      label: 'Alive',
      color: 'text-green-500',
      icon: '😶',
      bgColor: 'bg-green-900/20 border-green-500/30'
    },
    {
      value: stats.deadPlayers,
      label: 'Dead',
      color: 'text-red-500',
      icon: '💀',
      bgColor: 'bg-red-900/20 border-red-500/30'
    },
    {
      value: stats.murderers,
      label: 'Murderers',
      color: 'text-orange-500',
      icon: '🔪',
      bgColor: 'bg-orange-900/20 border-orange-500/30'
    },
    {
      value: stats.civilians,
      label: 'Civilians',
      color: 'text-blue-500',
      icon: '👤',
      bgColor: 'bg-blue-900/20 border-blue-500/30'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Game Status */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className={`text-2xl ${status.color} font-bold flex items-center justify-center gap-2`}>
          <span className="text-3xl">{status.icon}</span>
          {status.text}
        </div>
        {stats.duration && (
          <div className="text-sm text-manor-parchment/70 mt-1">
            Duration: {formatDuration(stats.duration)}
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={`
              rounded-lg border p-4 text-center backdrop-blur-sm
              ${stat.bgColor}
            `}
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-2xl font-bold ${stat.color} mb-1`}>
              {stat.value}
            </div>
            <div className="text-xs uppercase tracking-wider text-manor-parchment/80">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 gap-3 text-center"
      >
        <div className="rounded-lg border border-manor-wine/30 bg-manor-wine/10 p-3">
          <div className="text-lg font-bold text-manor-candle">{stats.totalKills}</div>
          <div className="text-xs uppercase tracking-wider text-manor-parchment/80">Total Kills</div>
        </div>
        <div className="rounded-lg border border-manor-wine/30 bg-manor-wine/10 p-3">
          <div className="text-lg font-bold text-manor-candle">{stats.totalPlayers}</div>
          <div className="text-xs uppercase tracking-wider text-manor-parchment/80">Total Players</div>
        </div>
      </motion.div>
    </div>
  )
}