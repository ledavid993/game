'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = "Summoning the spirits..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-black">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(177,54,30,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(64,19,31,0.28),transparent_55%),linear-gradient(170deg,rgba(9,11,16,0.95)_0%,rgba(16,19,27,0.92)_40%,rgba(6,7,10,0.98)_100%)]" />
        <div className="h-full w-full bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-10" />
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Manor Logo/Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-6xl text-manor-candle"
        >
          🏚️
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="font-manor text-3xl md:text-4xl uppercase tracking-[0.3em] text-manor-candle text-center"
        >
          Host Control Theatre
        </motion.h1>

        {/* Loading animation - floating orbs */}
        <div className="relative w-24 h-24">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-manor-wine rounded-full"
              style={{
                left: '50%',
                top: '50%',
                marginLeft: '-6px',
                marginTop: '-6px',
              }}
              animate={{
                x: [0, 30 * Math.cos((i * 2 * Math.PI) / 3), 0],
                y: [0, 30 * Math.sin((i * 2 * Math.PI) / 3), 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Center glow */}
          <motion.div
            className="absolute w-2 h-2 bg-manor-candle rounded-full"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: '-4px',
              marginTop: '-4px',
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Loading message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="font-body text-manor-parchment/80 text-center max-w-md"
        >
          {message}
        </motion.p>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex space-x-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-manor-parchment/60 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}