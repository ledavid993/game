'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ThemeToggle } from './ThemeToggle'

const SNOWFLAKE_COUNT = 50

function getSnowflakeStyle(index: number) {
  const left = (index * 37) % 100
  const delay = (index * 83) % 1000 // hundredths of a second
  const size = 0.8 + ((index * 29) % 80) / 100

  return {
    left: `${left}%`,
    animationDelay: `${delay / 100}s`,
    fontSize: `${size}rem`,
  } as const
}

export function GameLanding() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-red-900 via-green-900 to-red-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="snowfall">
          {Array.from({ length: SNOWFLAKE_COUNT }).map((_, index) => (
            <div key={index} className="snowflake" style={getSnowflakeStyle(index)}>
              ❄
            </div>
          ))}
        </div>
      </div>

      <div className="fixed right-4 top-4 z-50 md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 text-center md:p-12">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <h1 className="text-balance text-5xl font-extrabold text-white md:text-7xl lg:text-8xl">
            🎄 Christmas Murder Mystery 🔪
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mx-auto max-w-3xl text-lg text-white/90 md:text-2xl"
          >
            A thrilling party game where players must survive the night while murderers strike from
            the shadows. Perfect for your Christmas party!
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-10 flex w-full max-w-4xl flex-col items-center gap-6 md:mt-16 md:flex-row"
        >
          <Link href="/game/host" className="w-full md:w-auto">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="glass group flex h-full flex-col items-center gap-4 p-8 text-center transition-all duration-300 hover:bg-white/10"
            >
              <div className="text-5xl transition-transform duration-300 group-hover:scale-110 md:text-6xl">
                📺
              </div>
              <h2 className="text-2xl font-semibold text-white md:text-3xl">Host Game</h2>
              <p className="text-sm text-white/80 md:text-base">
                Set up and control the game from your computer or TV.
              </p>
            </motion.div>
          </Link>

          <span className="text-2xl font-bold text-white md:text-3xl">OR</span>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="glass flex h-full flex-col items-center gap-4 p-8 text-center"
          >
            <div className="text-5xl md:text-6xl">📱</div>
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Join Game</h2>
            <p className="text-sm text-white/80 md:text-base">
              Scan the QR code or open the link shared by your host.
            </p>
            <div className="rounded-lg bg-yellow-900/30 p-3 text-sm text-yellow-300">
              💡 Best on your phone&apos;s browser
            </div>
          </motion.div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-16 w-full max-w-5xl"
        >
          <h3 className="mb-6 text-2xl font-semibold text-white md:text-3xl">How to Play</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <article className="glass space-y-3 p-6">
              <div className="text-4xl">👥</div>
              <h4 className="text-xl font-semibold text-white">1. Setup</h4>
              <p className="text-sm text-white/80">
                Host adds player names and starts the game. Two random players become the murderers.
              </p>
            </article>
            <article className="glass space-y-3 p-6">
              <div className="text-4xl">🔪</div>
              <h4 className="text-xl font-semibold text-white">2. Hunt</h4>
              <p className="text-sm text-white/80">
                Murderers secretly eliminate civilians with a cooldown between kills. Stay vigilant!
              </p>
            </article>
            <article className="glass space-y-3 p-6">
              <div className="text-4xl">🎉</div>
              <h4 className="text-xl font-semibold text-white">3. Victory</h4>
              <p className="text-sm text-white/80">
                Murderers win when they equal civilians. Civilians win when all murderers are
                caught.
              </p>
            </article>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="mt-12 w-full max-w-3xl"
        >
          <div className="glass space-y-4 p-6">
            <h4 className="text-xl font-semibold text-white md:text-2xl">🎮 Game Features</h4>
            <div className="grid grid-cols-2 gap-3 text-left text-sm text-white/80 md:text-base">
              <div>✅ Real-time updates</div>
              <div>✅ Mobile responsive</div>
              <div>✅ Local Wi-Fi play</div>
              <div>✅ Festive themes</div>
              <div>✅ Cooldown system</div>
              <div>✅ Live kill feed</div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

export default GameLanding
