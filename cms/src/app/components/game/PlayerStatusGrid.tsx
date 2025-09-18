'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Player } from '@/app/lib/game/types'

interface PlayerStatusGridProps {
  players: Player[]
  showRoles?: boolean
  emptyMessage?: string
}

export function PlayerStatusGrid({ players, showRoles = false, emptyMessage }: PlayerStatusGridProps) {
  const alivePlayers = players.filter((player) => player.isAlive)
  const deadPlayers = players.filter((player) => !player.isAlive)

  const sortedPlayers = [...alivePlayers, ...deadPlayers]

  if (sortedPlayers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-6 py-12 text-center">
        <div className="max-w-sm">
          <div className="text-5xl mb-3">🕯️</div>
          <p className="text-manor-parchment/70 text-sm leading-relaxed">{emptyMessage ?? 'No guests to display right now.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 p-6">
      {sortedPlayers.map((player, index) => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.25 }}
          className={`
            relative rounded-xl border-2 p-4 text-center transition-all duration-300
            ${player.isAlive
              ? 'border-green-500/40 bg-green-900/20 shadow-lg shadow-green-500/10 hover:border-green-400/70'
              : 'border-red-500/40 bg-red-900/15 shadow-lg shadow-red-500/10 opacity-80'}
            backdrop-blur-sm
          `}
        >
          <div className="text-3xl mb-3">{player.isAlive ? '😶' : '💀'}</div>
          <div className="font-body text-sm font-semibold text-manor-candle mb-1 truncate">
            {player.name}
          </div>
          <div className={`text-xs uppercase tracking-[0.35em] font-bold ${player.isAlive ? 'text-green-300' : 'text-red-300'}`}>
            {player.isAlive ? 'Alive' : 'Departed'}
          </div>
          {(!player.isAlive || showRoles) && (
            <div className="text-xs text-manor-parchment/60 mt-2">
              {player.role === 'murderer' ? '🔪 Murderer' : '👤 Civilian'}
            </div>
          )}
          {player.isAlive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 animate-ping" />
          )}
        </motion.div>
      ))}
    </div>
  )
}
