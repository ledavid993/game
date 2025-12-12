'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type {
  RoleDistribution,
  RoleCooldowns,
  EnhancedGameSettings,
} from '@/app/lib/game/gameSettings'
import {
  DEFAULT_ROLE_DISTRIBUTION,
  DEFAULT_ROLE_COOLDOWNS,
  validateRoleDistribution,
  getCivilianCount,
} from '@/app/lib/game/gameSettings'
import { RoleDistribution as RoleDistributionComponent } from './RoleDistribution'
import { CooldownSettings } from './CooldownSettings'

export interface GameSettingsData {
  maxPlayers: number
  cooldownMinutes: number
  murdererCount: number
  roleDistribution?: RoleDistribution
  roleCooldowns?: RoleCooldowns
}

interface GameSettingsProps {
  settings: GameSettingsData
  onSettingsChange: (settings: GameSettingsData) => void
  playerCount?: number
  disabled?: boolean
}

type TabType = 'basic' | 'roles' | 'cooldowns'

export function GameSettings({
  settings,
  onSettingsChange,
  playerCount = 0,
  disabled = false
}: GameSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('basic')

  // Ensure we have default values for the new fields
  const roleDistribution = settings.roleDistribution || DEFAULT_ROLE_DISTRIBUTION
  const roleCooldowns = settings.roleCooldowns || DEFAULT_ROLE_COOLDOWNS

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

  const handleRoleDistributionChange = (newDistribution: RoleDistribution) => {
    onSettingsChange({
      ...settings,
      roleDistribution: newDistribution,
      murdererCount: newDistribution.murderers, // Keep legacy field in sync
    })
  }

  const handleRoleCooldownsChange = (newCooldowns: RoleCooldowns) => {
    onSettingsChange({
      ...settings,
      roleCooldowns: newCooldowns,
      cooldownMinutes: newCooldowns.murdererKillCooldown, // Keep legacy field in sync
    })
  }

  const maxMurderersForCurrentPlayers = Math.floor(Math.max(1, settings.maxPlayers / 3))
  const recommendedMurderers = Math.floor(Math.max(1, playerCount / 3))
  const validation = validateRoleDistribution(roleDistribution, settings.maxPlayers)
  const civilianCount = getCivilianCount(roleDistribution, settings.maxPlayers)

  const tabs = [
    { id: 'basic', label: 'Basic', icon: '⚙️' },
    { id: 'roles', label: 'Roles', icon: '👥' },
    { id: 'cooldowns', label: 'Abilities', icon: '⏱️' },
  ] as const

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[clamp(0.75rem,1.5vw,0.875rem)] text-manor-parchment/80">
          <div>
            <span className="text-manor-candle">Max Players:</span> {settings.maxPlayers}
          </div>
          <div>
            <span className="text-manor-candle">Special Roles:</span> {roleDistribution.murderers + roleDistribution.detectives + roleDistribution.revivers + roleDistribution.bodyguards + roleDistribution.vigilantes + roleDistribution.trolls}
          </div>
          <div>
            <span className="text-manor-candle">Civilians:</span> {civilianCount}
          </div>
          <div className={`${validation.isValid ? 'text-green-400' : 'text-red-400'}`}>
            {validation.isValid ? '✓ Valid' : '⚠️ Issues'}
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
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={disabled}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-manor text-sm uppercase tracking-wider ${
                    activeTab === tab.id
                      ? 'bg-manor-wine/30 text-manor-candle border border-manor-wine/50'
                      : 'bg-white/5 text-manor-parchment/80 hover:bg-white/10 hover:text-manor-candle border border-white/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
              {activeTab === 'basic' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
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

                  {/* Quick Legacy Controls */}
                  <div className="space-y-2">
                    <label className="block text-[clamp(0.75rem,1.5vw,0.875rem)] font-medium text-manor-parchment/90">
                      Quick Setup - Number of Murderers
                      <span className="text-manor-parchment/60 text-xs ml-2">
                        (Use Roles tab for advanced configuration)
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={maxMurderersForCurrentPlayers}
                        value={roleDistribution.murderers}
                        onChange={(e) => {
                          const newCount = parseInt(e.target.value) || 1
                          handleRoleDistributionChange({
                            ...roleDistribution,
                            murderers: newCount,
                          })
                        }}
                        disabled={disabled}
                        className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-manor-shadow/60 text-manor-candle focus:outline-none focus:ring-2 focus:border-manor-wine/50 focus:ring-manor-wine/30 disabled:opacity-50"
                      />
                      {playerCount > 0 && recommendedMurderers !== roleDistribution.murderers && (
                        <button
                          onClick={() => handleRoleDistributionChange({
                            ...roleDistribution,
                            murderers: recommendedMurderers,
                          })}
                          disabled={disabled}
                          className="px-3 py-1 text-xs rounded border border-green-500/30 text-green-400 hover:text-green-300 hover:bg-green-900/20 transition-colors disabled:opacity-50"
                        >
                          Use {recommendedMurderers} (recommended)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Game Summary */}
                  <div className="rounded-lg border border-white/20 bg-white/5 p-4">
                    <h4 className="font-manor font-semibold text-manor-candle mb-3">Game Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold text-manor-candle">{settings.maxPlayers}</div>
                        <div className="text-xs text-manor-parchment/60">Max Players</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-red-300">{roleDistribution.murderers}</div>
                        <div className="text-xs text-manor-parchment/60">Murderers</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-300">
                          {roleDistribution.detectives + roleDistribution.revivers + roleDistribution.bodyguards + roleDistribution.vigilantes + roleDistribution.trolls}
                        </div>
                        <div className="text-xs text-manor-parchment/60">Special Roles</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-300">{civilianCount}</div>
                        <div className="text-xs text-manor-parchment/60">Civilians</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'roles' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <RoleDistributionComponent
                    distribution={roleDistribution}
                    maxPlayers={settings.maxPlayers}
                    onDistributionChange={handleRoleDistributionChange}
                    disabled={disabled}
                  />
                </motion.div>
              )}

              {activeTab === 'cooldowns' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CooldownSettings
                    cooldowns={roleCooldowns}
                    onCooldownsChange={handleRoleCooldownsChange}
                    disabled={disabled}
                  />
                </motion.div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}