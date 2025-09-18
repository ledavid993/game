'use client'

import React from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'

import { ThemeToggle } from './ThemeToggle'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function GameLanding() {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(177,54,30,0.2),_transparent_55%),linear-gradient(140deg,_rgba(9,11,16,0.96)_0%,_rgba(17,22,34,0.92)_55%,_rgba(4,5,9,0.98)_100%)]">
      <div className="absolute inset-0 opacity-20" aria-hidden>
        <div className="h-full w-full bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 flex flex-col justify-center min-h-screen">
        <motion.div
          className="flex flex-col items-center text-center space-y-4 sm:space-y-6"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.h1
            className="font-manor text-[clamp(2rem,8vw,5rem)] uppercase tracking-[0.3em] text-manor-candle"
            variants={fadeUp}
            transition={{ delay: 0.1, duration: 0.8, ease: 'easeOut' }}
          >
            Manor of Whispers
          </motion.h1>
          <motion.p
            className="font-gothic text-[clamp(1rem,2.5vw,1.25rem)] leading-relaxed text-manor-parchment/90 max-w-3xl"
            variants={fadeUp}
            transition={{ delay: 0.25, duration: 0.8, ease: 'easeOut' }}
          >
            The storm has sealed every exit. Somewhere within the candle-lit halls, a killer moves
            in silence. Your guests must unravel the truth before the manor claims another soul.
          </motion.p>
          <motion.div
            className="manor-divider max-w-[320px]"
            variants={fadeUp}
            transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          />
          <motion.p
            className="font-body text-xs uppercase tracking-[0.35em] text-manor-parchment/70"
            variants={fadeUp}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          >
            A live, multi-screen murder mystery experience
          </motion.p>
        </motion.div>

        <div className="mt-8 sm:mt-12 grid w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-[1.1fr_0.05fr_1fr]">
          <motion.div
            className="group"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
          >
            <Link href="/game/host">
              <div className="manor-card manor-card--accent flex h-full flex-col items-center gap-4 text-center transition-transform duration-200 group-hover:-translate-y-1">
                <span className="text-5xl">📺</span>
                <h2 className="font-manor text-2xl uppercase tracking-[0.25em] text-manor-candle text-red-600">
                  Host from the Grand Hall
                </h2>
                <p className="font-body text-sm text-manor-parchment/85 md:text-base">
                  Cast the dashboard to your TV and direct the investigation with live dossiers,
                  kill reports, and atmospheric prompts.
                </p>
                <button className="btn-primary mt-2 w-full max-w-xs">Enter the Hall</button>
              </div>
            </Link>
          </motion.div>

          <div className="hidden items-center justify-center md:flex">
            <div className="manor-divider h-32 rotate-90" />
          </div>

          <motion.div
            className="manor-card flex h-full flex-col items-center gap-4 text-center transition-transform duration-200 hover:-translate-y-1"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
          >
            <span className="text-5xl">📱</span>
            <h2 className="font-manor text-2xl uppercase tracking-[0.25em] text-manor-candle">
              Join as a Suspect
            </h2>
            <p className="font-body text-sm text-manor-parchment/85 md:text-base">
              Scan the host’s sigil or accept their invitation. Every phone becomes a secret
              journal—follow orders, alibis, and sinister opportunities.
            </p>
            <div className="rounded-lg border border-[rgba(177,54,30,0.4)] bg-manor-wine/20 px-4 py-3 text-sm font-body text-manor-candle/80">
              💡 Tip: Add the page to your home screen for a full-screen dossier.
            </div>
          </motion.div>
        </div>

        <motion.section
          className="mt-16 grid w-full max-w-6xl gap-6 md:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
        >
          {[
            {
              icon: '🕯️',
              title: 'Curate the Guest List',
              description:
                'Name your guests and ignite the manor. Roles are woven in secret—only the chosen know their true nature.',
            },
            {
              icon: '🔪',
              title: 'Dance with Death',
              description:
                'Murderers strike from the dark with limited time between blows. Civilians must share whispers and connect dots.',
            },
            {
              icon: '📜',
              title: 'Write the Ending',
              description:
                'Survivors compose their testimonies while the manor tallies allegiances, betrayals, and lingering spirits.',
            },
          ].map((card, index) => (
            <motion.article
              key={card.title}
              variants={fadeUp}
              transition={{ delay: 0.9 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
              className="manor-card space-y-4 text-left"
            >
              <span className="text-3xl">{card.icon}</span>
              <h3 className="font-manor text-xl uppercase tracking-[0.2em] text-manor-candle">
                {card.title}
              </h3>
              <p className="font-body text-sm text-manor-parchment/85">{card.description}</p>
            </motion.article>
          ))}
        </motion.section>

        <motion.section
          className="mt-16 w-full max-w-5xl"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 1.1, duration: 0.8, ease: 'easeOut' }}
        >
          <div className="manor-card flex flex-col gap-4 md:flex-row md:gap-8">
            <div className="flex-1 space-y-3">
              <h4 className="font-manor text-lg uppercase tracking-[0.25em] text-manor-candle">
                Inside the Manor
              </h4>
              <ul className="space-y-2 font-body text-sm text-manor-parchment/85 md:text-base">
                <li>• Cinematic HUD for large displays, designed for candlelit rooms.</li>
                <li>• Mobile dossiers adapt to portrait & landscape for stealthy play.</li>
                <li>• Live feed renders as a leather-bound incident log.</li>
              </ul>
            </div>
            <div className="manor-divider md:hidden" />
            <div className="flex-1 space-y-3">
              <h4 className="font-manor text-lg uppercase tracking-[0.25em] text-manor-candle">
                Technical Hauntings
              </h4>
              <ul className="space-y-2 font-body text-sm text-manor-parchment/85 md:text-base">
                <li>• Real-time sockets keep every clue synchronized.</li>
                <li>• Responsive typography tailored to TVs, tablets, and phones.</li>
                <li>• Tailwind-crafted theming for quick seasonal reskins.</li>
              </ul>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
