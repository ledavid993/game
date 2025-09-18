'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface GameSettingsData {
  maxPlayers: number
  cooldownMinutes: number
  murdererCount: number
}

interface GameSettingsProps {
  settings: GameSettingsData
  onSettingsChange: (settings: GameSettingsData) => void
  playerCount?: number
  disabled?: boolean
}

export function GameSettings({
  settings,
  onSettingsChange,
  playerCount = 0,
  disabled = false
}: GameSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSettingChange = (key: keyof GameSettingsData, value: number | string) => {
    const newSettings = { ...settings, [key]: value }

    // Auto-adjust murderer count if it's too high for player count
    if (key === 'murdererCount' || key === 'maxPlayers') {
      const maxMurderers = Math.floor(Math.max(1, (key === 'maxPlayers' ? value as number : settings.maxPlayers) / 3))
      if (newSettings.murdererCount > maxMurderers) {
        newSettings.murdererCount = maxMurderers
      }
    }

    onSettingsChange(newSettings)
  }

  const maxMurderersForCurrentPlayers = Math.floor(Math.max(1, settings.maxPlayers / 3))
  const recommendedMurderers = Math.floor(Math.max(1, playerCount / 3))

  return (
    <div className="manor-card space-y-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 -m-2 rounded-lg hover:bg-white/5 transition-colors"
        disabled={disabled}
      >
        <h3 className="font-manor text-[clamp(1rem,2.5vw,1.125rem)] uppercase tracking-wider text-manor-candle">
          Game Settings
        </h3>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-manor-parchment/60"
        >
          ▼
        </motion.div>
      </button>

      {/* Quick Summary */}
      {!isExpanded && (
        <div className="grid grid-cols-2 gap-4 text-[clamp(0.75rem,1.5vw,0.875rem)] text-manor-parchment/80">
          <div>
            <span className="text-manor-candle">Max Players:</span> {settings.maxPlayers}
          </div>
          <div>
            <span className="text-manor-candle">Murderers:</span> {settings.murdererCount}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 overflow-hidden"
          >
            {/* Max Players */}
            <div className="space-y-2">
              <label className="block text-[clamp(0.75rem,1.5vw,0.875rem)] font-medium text-manor-parchment/90">
                Maximum Players
                <span className="text-manor-parchment/60 text-xs ml-2">(1-1000)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={settings.maxPlayers}
                  onChange={(e) => handleSettingChange('maxPlayers', parseInt(e.target.value) || 1)}
                  disabled={disabled}
                  className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-manor-shadow/60 text-manor-candle focus:outline-none focus:ring-2 focus:border-manor-wine/50 focus:ring-manor-wine/30 disabled:opacity-50"
                />
                <div className="flex gap-1">
                  {[20, 50, 100, 500].map(preset => (
                    <button
                      key={preset}
                      onClick={() => handleSettingChange('maxPlayers', preset)}
                      disabled={disabled}
                      className="px-2 py-1 text-xs rounded border border-white/20 text-manor-parchment/80 hover:text-manor-candle hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Murderer Count */}
            <div className="space-y-2">
              <label className="block text-[clamp(0.75rem,1.5vw,0.875rem)] font-medium text-manor-parchment/90">
                Number of Murderers
                <span className="text-manor-parchment/60 text-xs ml-2">
                  (max {maxMurderersForCurrentPlayers} for {settings.maxPlayers} players)
                </span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={maxMurderersForCurrentPlayers}
                  value={settings.murdererCount}
                  onChange={(e) => handleSettingChange('murdererCount', parseInt(e.target.value) || 1)}
                  disabled={disabled}
                  className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-manor-shadow/60 text-manor-candle focus:outline-none focus:ring-2 focus:border-manor-wine/50 focus:ring-manor-wine/30 disabled:opacity-50"
                />
                {playerCount > 0 && recommendedMurderers !== settings.murdererCount && (
                  <button
                    onClick={() => handleSettingChange('murdererCount', recommendedMurderers)}
                    disabled={disabled}
                    className="px-3 py-1 text-xs rounded border border-green-500/30 text-green-400 hover:text-green-300 hover:bg-green-900/20 transition-colors disabled:opacity-50"
                  >
                    Use {recommendedMurderers} (recommended)
                  </button>
                )}
              </div>

              {/* Validation message for murderer count vs assigned players */}
              {playerCount > 0 && settings.murdererCount > playerCount && (
                <div className="text-xs text-red-400 bg-red-900/20 border border-red-500/30 rounded px-2 py-1">
                  ⚠️ Need {settings.murdererCount - playerCount} more players for {settings.murdererCount} murderers
                </div>
              )}
              {playerCount > 0 && settings.murdererCount <= playerCount && (
                <div className="text-xs text-green-400 bg-green-900/20 border border-green-500/30 rounded px-2 py-1">
                  ✓ Ready to assign {settings.murdererCount} murderer{settings.murdererCount > 1 ? 's' : ''} to {playerCount} players
                </div>
              )}
            </div>

            {/* Cooldown Timer */}
            <div className="space-y-2">
              <label className="block text-[clamp(0.75rem,1.5vw,0.875rem)] font-medium text-manor-parchment/90">
                Cooldown Between Kills (minutes)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={settings.cooldownMinutes}
                  onChange={(e) => handleSettingChange('cooldownMinutes', parseInt(e.target.value) || 0)}
                  disabled={disabled}
                  className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-manor-shadow/60 text-manor-candle focus:outline-none focus:ring-2 focus:border-manor-wine/50 focus:ring-manor-wine/30 disabled:opacity-50"
                />
                <div className="flex gap-1">
                  {[5, 10, 15, 30].map(preset => (
                    <button
                      key={preset}
                      onClick={() => handleSettingChange('cooldownMinutes', preset)}
                      disabled={disabled}
                      className="px-2 py-1 text-xs rounded border border-white/20 text-manor-parchment/80 hover:text-manor-candle hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      {preset}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}