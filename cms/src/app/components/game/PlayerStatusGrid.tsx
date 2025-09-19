'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Player } from '@/app/lib/game/types'
import { ROLE_LABELS, isMurdererRole } from '@/app/lib/game/roles'

type PlayerDensity = 'normal' | 'dense' | 'ultra'

interface PlayerStatusGridProps {
  players: Player[]
  showRoles?: boolean
  emptyMessage?: string
  density?: PlayerDensity
}

const densityStyles: Record<
  PlayerDensity,
  {
    grid: string
    cardPadding: string
    emojiSize: string
    nameSize: string
    statusSize: string
    murdererSize: string
  }
> = {
  normal: {
    grid: 'gap-3 px-4 sm:px-6 py-5 sm:py-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
    cardPadding: 'p-4',
    emojiSize: 'text-3xl',
    nameSize: 'text-sm',
    statusSize: 'text-xs tracking-[0.35em]',
    murdererSize: 'text-xs',
  },
  dense: {
    grid: 'gap-2 sm:gap-2.5 px-4 sm:px-6 py-4 sm:py-5 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7',
    cardPadding: 'p-3 sm:p-3.5',
    emojiSize: 'text-2xl sm:text-[1.7rem]',
    nameSize: 'text-xs sm:text-sm',
    statusSize: 'text-[0.6rem] sm:text-[0.7rem] tracking-[0.3em]',
    murdererSize: 'text-[0.6rem]',
  },
  ultra: {
    grid: 'gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10',
    cardPadding: 'py-2.5 sm:py-3',
    emojiSize: 'text-xl sm:text-2xl',
    nameSize: 'text-[0.6rem] sm:text-xs',
    statusSize: 'text-[0.5rem] sm:text-[0.55rem] tracking-[0.35em]',
    murdererSize: 'text-[0.5rem]',
  },
}

export function PlayerStatusGrid({
  players,
  showRoles = false,
  emptyMessage,
  density = 'normal',
}: PlayerStatusGridProps) {
  const alivePlayers = players.filter((player) => player.isAlive)
  const deadPlayers = players.filter((player) => !player.isAlive)

  // Sort each group by display name alphabetically
  const sortedAlivePlayers = alivePlayers.sort((a, b) => a.name.localeCompare(b.name))
  const sortedDeadPlayers = deadPlayers.sort((a, b) => a.name.localeCompare(b.name))

  const sortedPlayers = [...sortedAlivePlayers, ...sortedDeadPlayers]
  const styles = densityStyles[density]
  const isUltra = density === 'ultra'

  if (sortedPlayers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-6 py-12 text-center">
        <div className="max-w-sm">
          <div className="text-5xl mb-3">🕯️</div>
          <p className="text-manor-parchment/70 text-sm leading-relaxed">
            {emptyMessage ?? 'No guests to display right now.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid ${styles.grid}`}>
      {sortedPlayers.map((player, index) => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.25 }}
          className={`
            relative rounded-xl border-2 ${styles.cardPadding} text-center transition-all duration-300
            ${
              player.isAlive
                ? 'border-green-500/40 bg-green-900/20 shadow-lg shadow-green-500/10 hover:border-green-400/70'
                : 'border-red-500/40 bg-red-900/15 shadow-lg shadow-red-500/10 opacity-80'
            }
            backdrop-blur-sm
          `}
        >
          <div className={`${styles.emojiSize} ${isUltra ? 'mb-1.5' : 'mb-2 sm:mb-3'}`}>
            {player.isAlive ? '😶' : '💀'}
          </div>
          <div
            className={`relative overflow-hidden font-body ${styles.nameSize} font-semibold text-manor-candle mb-1 ${
              density !== 'normal' ? 'px-1' : ''
            }`}
          >
            {(() => {
              const threshold = density === 'ultra' ? 8 : density === 'dense' ? 10 : 14
              const shouldScroll = player.name.length > threshold

              if (!shouldScroll) {
                return <span className="block whitespace-nowrap">{player.name}</span>
              }

              const marqueeDuration = Math.max(2.5, player.name.length * 0.25)
              const marqueeSegment = `${player.name}\u00A0\u00A0`
              const marqueeStyle = {
                ['--marquee-duration' as const]: `${marqueeDuration}s`,
              }

              return (
                <div className="player-marquee-container">
                  <div className="player-marquee-track" style={marqueeStyle}>
                    {[0, 1].map((dup) => (
                      <span
                        key={`${player.id}-marquee-${dup}`}
                        aria-hidden={dup > 0}
                        className="player-marquee-segment"
                      >
                        {marqueeSegment}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
          <div
            className={`uppercase font-bold ${styles.statusSize} ${player.isAlive ? 'text-green-300' : 'text-red-300'} ${isUltra ? 'font-medium tracking-[0.25em]' : ''}`}
            style={isUltra ? { transform: 'scale(0.9)', transformOrigin: 'center' } : undefined}
          >
            {player.isAlive ? 'Alive' : 'Departed'}
          </div>
          {(() => {
            const baseLabel = ROLE_LABELS[player.role] ?? player.role
            if (!baseLabel) return null

            if (!player.isAlive && isMurdererRole(player.role)) {
              return (
                <div className={`${styles.murdererSize} text-manor-parchment/60 mt-2`}>
                  🔪 Revealed {baseLabel}
                </div>
              )
            }
          })()}
          {player.isAlive && !isUltra && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 animate-ping" />
          )}
        </motion.div>
      ))}
      <style jsx>{`
        .player-marquee-container {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .player-marquee-track {
          display: inline-flex;
          align-items: center;
          min-width: 100%;
          will-change: transform;
          animation-name: player-status-marquee;
          animation-duration: var(--marquee-duration, 3s);
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .player-marquee-segment {
          white-space: nowrap;
          padding-right: 1.5rem;
        }

        @keyframes player-status-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  )
}

export default PlayerStatusGrid
