'use client'

import React, { useState, useEffect } from 'react'
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
  showScrollIndicator?: boolean
  gameCode?: string
  availableTargets?: Player[]
}

const getRoleEmoji = (role: string) => {
  const roleEmojis = {
    murderer: '🎭',
    civilian: '❄️',
    detective: '🍭',
    reviver: '🧚',
    bodyguard: '🥜',
    vigilante: '⭐',
    troll: '👹',
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
    vigilante: 'from-red-500/30 via-orange-600/20 to-red-800/30',
    troll: 'from-green-500/30 via-purple-600/20 to-green-800/30',
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
  showScrollIndicator = false,
  gameCode,
  availableTargets = [],
}: RoleCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [revealsRemaining, setRevealsRemaining] = useState(player.cardRevealsRemaining ?? 3)
  const [showTargets, setShowTargets] = useState(false)

  // Sync reveals remaining with player data
  useEffect(() => {
    setRevealsRemaining(player.cardRevealsRemaining ?? 3)
  }, [player.cardRevealsRemaining])

  const isMurderer = isMurdererRole(player.role)
  const possibleTargets = isMurderer
    ? availableTargets.filter(p => p.isAlive && p.id !== player.id)
    : []

  const handleRevealClick = () => {
    if (isMurderer) {
      setShowTargets(!showTargets)
    }
    // For non-murderers, button does nothing
  }

  // Auto-hide card after 10 seconds when revealed and decrement reveals
  useEffect(() => {
    if (isFlipped && gameCode) {
      const timer = setTimeout(async () => {
        // Call API to decrement reveal count
        try {
          const response = await fetch('/api/v1/game/flip-card', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              playerCode: player.id,
              gameCode: gameCode,
            }),
          })

          const result = await response.json()
          if (response.ok && result.success) {
            setRevealsRemaining(result.data.cardRevealsRemaining)
          }
        } catch (error) {
          console.error('Error auto-hiding card:', error)
        }

        setIsFlipped(false)
        onFlip?.(false)
      }, 10000) // 10 seconds

      return () => clearTimeout(timer)
    }
  }, [isFlipped, gameCode, player.id, onFlip])

  const handleFlip = async () => {
    if (isFlipping || !gameCode) return

    // Dead players cannot reveal their role
    if (!player.isAlive) {
      return
    }

    // Only allow revealing the card - hiding will happen automatically after 10 seconds
    if (isFlipped) {
      // Card is already revealed, just wait for auto-hide
      return
    }

    // Check if player has reveals remaining
    if (revealsRemaining <= 0) {
      // Show error message that no reveals are left
      return
    }

    setIsFlipping(true)

    try {
      // Only reveal the card, never manually hide it
      setIsFlipped(true)
      onFlip?.(true)
    } catch (error) {
      console.error('Error flipping card:', error)
    } finally {
      setIsFlipping(false)
    }
  }

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={entranceVariants}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="perspective-1000 w-full h-screen relative"
    >
      <div
        className={`relative w-full h-full ${
          isFlipping ? 'cursor-wait' :
          isFlipped ? 'cursor-default' :
          !player.isAlive ? 'cursor-not-allowed' :
          revealsRemaining <= 0 ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={handleFlip}
      >
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
              <p className="text-manor-parchment/70 text-lg">
                {revealsRemaining > 0 ? 'Click to reveal your identity' : 'No more reveals remaining'}
              </p>
              {revealsRemaining > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-manor-parchment/50 text-sm">
                    Reveals remaining: {revealsRemaining}
                  </p>
                  <p className="text-manor-parchment/40 text-xs">
                    Will auto-hide after 10 seconds
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-red-300/60 text-sm">
                  You have used all your reveals
                </p>
              )}
            </div>
          </div>

          {/* Back of Card (Revealed Role) - Shows when flipped */}
          <div
            className={`absolute inset-0 w-full h-full border border-white/30 shadow-2xl ${
              isFlipped
                ? `opacity-100 z-20`
                : 'opacity-0 z-10'
            }`}
            style={{
              transition: 'opacity 0.6s ease-in-out',
              background: isFlipped
                ? `linear-gradient(135deg,
                    #1a1a2e 0%,
                    #16213e 15%,
                    #0f3460 30%,
                    #533483 45%,
                    #16213e 60%,
                    #1a1a2e 75%,
                    #0f3460 90%,
                    #1a1a2e 100%),
                   radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 40%),
                   radial-gradient(circle at 80% 70%, rgba(255,255,255,0.15) 0%, transparent 40%),
                   radial-gradient(circle at 40% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`
                : 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
            }}
          >
            {/* Glossy overlay when revealed */}
            {isFlipped && (
              <div
                className="absolute inset-0"
                style={{
                  background: `
                    linear-gradient(135deg,
                      transparent 0%,
                      rgba(255,255,255,0.1) 25%,
                      rgba(255,255,255,0.2) 50%,
                      rgba(255,255,255,0.1) 75%,
                      transparent 100%)`,
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

              {/* Reveal Button */}
              {player.isAlive && (
                <div className="mb-6 relative">
                  <button
                    onClick={handleRevealClick}
                    className={`px-6 py-3 rounded-xl font-semibold uppercase tracking-wider transition-all ${
                      isMurderer
                        ? 'bg-red-600/80 hover:bg-red-500/80 text-white cursor-pointer shadow-lg shadow-red-500/30'
                        : 'bg-gray-600/50 text-gray-300 cursor-default'
                    }`}
                  >
                    {isMurderer ? 'Reveal Targets' : 'Revealed'}
                  </button>

                  {/* Targets Dropdown for Murderers */}
                  {showTargets && isMurderer && possibleTargets.length > 0 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 bg-black/90 border border-red-500/50 rounded-xl p-4 z-50 min-w-64 max-h-48 overflow-y-auto">
                      <div className="text-sm text-red-300 font-semibold mb-3 text-center">Available Targets:</div>
                      <div className="space-y-2">
                        {possibleTargets.map(target => (
                          <div key={target.id} className="text-sm text-white py-1 px-2 bg-red-900/30 rounded border border-red-500/30">
                            • {target.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}


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


          {/* Scroll Down Indicator on Card */}
          {showScrollIndicator && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="flex flex-col items-center text-white/80"
              >
                <p className="text-sm font-manor uppercase tracking-[0.2em] mb-2">Scroll to Vote</p>
                <div className="text-2xl">⬇️</div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </motion.section>
  )
}
