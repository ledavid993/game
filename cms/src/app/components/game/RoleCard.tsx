'use client'

import React, { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import type { CooldownStatus, Player } from '@/app/lib/game/types'
import { ROLE_LABELS, isMurdererRole } from '@/app/lib/game/roles'

const entranceVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

interface RoleCardProps {
  player: Player
  narrativeStatus: string
  cooldownStatus: CooldownStatus | null
  cooldownTimer: number
  onFlip?: (isFlipped: boolean) => void
}

const getRoleEmoji = (role: string) => {
  const roleEmojis = {
    murderer: '🎭',
    civilian: '❄️',
    detective: '🍭',
    reviver: '🧚',
    bodyguard: '🥜',
    nurse: '🍪',
    vigilante: '⭐',
    doctor: '🧊',
  }
  return roleEmojis[role as keyof typeof roleEmojis] || '❓'
}

const getRoleColors = (role: string) => {
  const roleColors = {
    murderer: 'from-red-500/30 via-red-600/20 to-red-800/30',
    civilian: 'from-gray-500/30 via-gray-600/20 to-gray-800/30',
    detective: 'from-blue-500/30 via-blue-600/20 to-blue-800/30',
    reviver: 'from-green-500/30 via-green-600/20 to-green-800/30',
    bodyguard: 'from-yellow-500/30 via-yellow-600/20 to-yellow-800/30',
    nurse: 'from-cyan-500/30 via-cyan-600/20 to-cyan-800/30',
    vigilante: 'from-red-500/30 via-orange-600/20 to-red-800/30',
    doctor: 'from-cyan-500/30 via-blue-600/20 to-cyan-800/30',
  }
  return (
    roleColors[role as keyof typeof roleColors] || 'from-gray-500/30 via-gray-600/20 to-gray-800/30'
  )
}

export function RoleCard({
  player,
  narrativeStatus,
  cooldownStatus,
  cooldownTimer,
  onFlip,
}: RoleCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => {
    const newFlippedState = !isFlipped
    setIsFlipped(newFlippedState)
    onFlip?.(newFlippedState)
  }

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={entranceVariants}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="perspective-1000 w-full h-screen relative"
    >
      <div className="relative w-full h-full cursor-pointer" onClick={handleFlip}>
        {/* Card Container */}
        <div className="absolute inset-0 w-full h-full">
          {/* Front of Card (Mystery) - Shows by default */}
          <div
            className={`absolute inset-0 w-full h-full border border-white/20 bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-800/90 shadow-2xl ${
              !isFlipped ? 'opacity-100 z-20' : 'opacity-0 z-10'
            }`}
            style={{
              transition: 'opacity 0.6s ease-in-out',
            }}
          >
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="text-8xl mb-6">🎭</div>
              <h2 className="font-manor text-4xl uppercase tracking-[0.25em] text-white mb-4">
                Mystery Role
              </h2>
              <p className="text-manor-parchment/70 text-lg">Click to reveal your identity</p>
            </div>
          </div>

          {/* Back of Card (Revealed Role) - Shows when flipped */}
          <div
            className={`absolute inset-0 w-full h-full border border-white/30 shadow-2xl ${
              isFlipped
                ? `opacity-100 z-20 bg-gradient-to-br ${getRoleColors(player.role)} backdrop-blur-sm animate-pulse`
                : 'opacity-0 z-10 bg-gradient-to-br from-gray-900/90 via-black/95 to-gray-800/90'
            }`}
            style={{
              transition: 'opacity 0.6s ease-in-out',
              backgroundImage: isFlipped
                ? 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)'
                : 'none',
            }}
          >
            {/* Holographic overlay when revealed */}
            {isFlipped && (
              <div
                className="absolute inset-0 rounded-2xl opacity-50"
                style={{
                  background:
                    'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%), linear-gradient(-45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                  backgroundSize: '20px 20px',
                  animation: 'shimmer 2s infinite linear',
                }}
              />
            )}

            <div className="relative z-10 flex h-full flex-col justify-center items-center p-8 text-center">
              {/* Role Icon */}
              <div className="text-9xl mb-8">{getRoleEmoji(player.role)}</div>

              {/* Player Name */}
              <h1 className="font-manor text-6xl uppercase tracking-[0.25em] text-white mb-6 leading-tight">
                {player.name}
              </h1>

              {/* Role Label */}
              <div className="inline-block rounded-full border border-white/30 bg-black/40 px-8 py-4 font-body text-2xl uppercase tracking-[0.3em] text-white/90 mb-8">
                {(ROLE_LABELS[player.role] ?? player.role).toUpperCase()}
              </div>

              {/* Status */}
              <div
                className={`inline-block rounded-full px-8 py-4 font-body text-xl font-semibold mb-6 ${
                  player.isAlive
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {player.isAlive ? '✓ ALIVE' : '💀 ELIMINATED'}
              </div>

              {/* Narrative */}
              <p className="font-body text-xl text-white/90 max-w-2xl mb-8">{narrativeStatus}</p>

              {/* Cooldown (for murderers) */}
              {cooldownStatus && isMurdererRole(player.role) && (
                <div className="rounded-xl border border-red-500/30 bg-red-900/20 p-6 text-center">
                  <p className="font-body text-lg uppercase tracking-[0.35em] text-red-300/80 mb-2">
                    Murderer Cooldown
                  </p>
                  <p className="font-manor text-4xl text-red-200">
                    {cooldownTimer > 0
                      ? `${Math.floor(cooldownTimer / 60)}:${(cooldownTimer % 60).toString().padStart(2, '0')}`
                      : 'Blade Ready'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        @keyframes shimmer {
          0% {
            background-position:
              -100% 0,
              100% 0;
          }
          100% {
            background-position:
              100% 0,
              -100% 0;
          }
        }
      `}</style>
    </motion.section>
  )
}
