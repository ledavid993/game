'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/game/ThemeToggle';

export default function GameLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="snowfall">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                fontSize: `${Math.random() * 0.8 + 0.8}rem`,
              }}
            >
              ❄
            </div>
          ))}
        </div>
      </div>

      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-8xl font-bold text-white mb-8 tv-display">
            🎄 Christmas Murder Mystery 🔪
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-2xl text-white mb-12 max-w-3xl mx-auto"
          >
            A thrilling party game where players must survive the night while murderers strike from the shadows.
            Perfect for your Christmas party!
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col md:flex-row gap-6 items-center"
        >
          <Link href="/game/host">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass p-8 rounded-xl text-center min-w-[300px] group hover:bg-white hover:bg-opacity-20 transition-all duration-300"
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                📺
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Host Game</h2>
              <p className="text-white text-opacity-80">
                Set up and control the game from your computer/TV
              </p>
            </motion.button>
          </Link>

          <div className="text-white text-4xl font-bold">OR</div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass p-8 rounded-xl text-center min-w-[300px]"
          >
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-3xl font-bold text-white mb-2">Join Game</h2>
            <p className="text-white text-opacity-80 mb-4">
              Scan QR code or use the link provided by your host
            </p>
            <div className="text-sm text-yellow-300 bg-yellow-900/30 rounded-lg p-3">
              💡 Players join via their phone browsers
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-16 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-6">How to Play</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            <div className="glass p-6 rounded-xl">
              <div className="text-4xl mb-3">👥</div>
              <h4 className="text-xl font-semibold text-white mb-2">1. Setup</h4>
              <p className="text-white text-opacity-80 text-sm">
                Host adds player names and starts the game. 2 random players become murderers.
              </p>
            </div>

            <div className="glass p-6 rounded-xl">
              <div className="text-4xl mb-3">🔪</div>
              <h4 className="text-xl font-semibold text-white mb-2">2. Hunt</h4>
              <p className="text-white text-opacity-80 text-sm">
                Murderers secretly eliminate civilians with a 10-minute cooldown between kills.
              </p>
            </div>

            <div className="glass p-6 rounded-xl">
              <div className="text-4xl mb-3">🎉</div>
              <h4 className="text-xl font-semibold text-white mb-2">3. Victory</h4>
              <p className="text-white text-opacity-80 text-sm">
                Murderers win if they equal civilians. Civilians win if all murderers are caught.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="glass p-6 rounded-xl max-w-2xl">
            <h4 className="text-xl font-semibold text-white mb-3">🎮 Game Features</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-white text-opacity-80">
              <div>✅ Real-time updates</div>
              <div>✅ Mobile responsive</div>
              <div>✅ Local WiFi play</div>
              <div>✅ Christmas theme</div>
              <div>✅ Cooldown system</div>
              <div>✅ Live kill feed</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}