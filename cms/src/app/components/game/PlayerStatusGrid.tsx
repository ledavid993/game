'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Player } from '@/app/lib/game/types'

interface PlayerStatusGridProps {
  players: Player[]
  showRoles?: boolean
}

export function PlayerStatusGrid({ players, showRoles = false }: PlayerStatusGridProps) {
  const alivePlayers = players.filter(p => p.isAlive)
  const deadPlayers = players.filter(p => !p.isAlive)

  // Sort: alive players first, then dead players
  const sortedPlayers = [...alivePlayers, ...deadPlayers]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
      {sortedPlayers.map((player, index) => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className={`
            relative rounded-lg border-2 p-3 text-center transition-all duration-300
            ${player.isAlive
              ? 'border-green-500/50 bg-green-900/20 shadow-green-500/10'
              : 'border-red-500/50 bg-red-900/20 shadow-red-500/10 opacity-75'
            }
            shadow-lg backdrop-blur-sm
          `}
        >
          {/* Status Icon */}
          <div className="text-3xl mb-2">
            {player.isAlive ? '😶' : '💀'}
          </div>

          {/* Player Name */}
          <div className="font-body text-sm font-semibold text-manor-candle mb-1 truncate">
            {player.name}
          </div>

          {/* Status */}
          <div className={`text-xs uppercase tracking-wider font-bold ${
            player.isAlive ? 'text-green-400' : 'text-red-400'
          }`}>
            {player.isAlive ? 'Alive' : 'Dead'}
          </div>

          {/* Role (shown for dead players or when showRoles is true) */}
          {(!player.isAlive || showRoles) && (
            <div className="text-xs text-manor-parchment/60 mt-1">
              {player.role === 'murderer' ? '🔪 Murderer' : '👤 Civilian'}
            </div>
          )}

          {/* Alive indicator pulse */}
          {player.isAlive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          )}
        </motion.div>
      ))}
    </div>
  )
}