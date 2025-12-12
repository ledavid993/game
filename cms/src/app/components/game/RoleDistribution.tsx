'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { RoleDistribution as RoleDistributionType } from '@/app/lib/game/gameSettings'
import {
  ROLE_INFO,
  getCivilianCount,
  getTotalSpecialRoles,
  validateRoleDistribution,
  GAME_PRESETS,
} from '@/app/lib/game/gameSettings'

interface RoleDistributionProps {
  distribution: RoleDistributionType
  maxPlayers: number
  onDistributionChange: (distribution: RoleDistributionType) => void
  disabled?: boolean
}

interface RoleCardProps {
  roleKey: keyof RoleDistributionType
  count: number
  maxCount: number
  onCountChange: (count: number) => void
  disabled?: boolean
}

function RoleCard({ roleKey, count, maxCount, onCountChange, disabled }: RoleCardProps) {
  const roleInfo = ROLE_INFO[roleKey]
  const canDecrease = count > (roleKey === 'murderers' ? 1 : 0) // Murderers minimum is 1
  const canIncrease = count < maxCount

  const handleDecrease = () => {
    if (canDecrease && !disabled) {
      onCountChange(count - 1)
    }
  }

  const handleIncrease = () => {
    if (canIncrease && !disabled) {
      onCountChange(count + 1)
    }
  }

  const colorClasses = {
    red: 'border-red-500/30 bg-red-900/20 text-red-300',
    blue: 'border-blue-500/30 bg-blue-900/20 text-blue-300',
    green: 'border-green-500/30 bg-green-900/20 text-green-300',
    yellow: 'border-yellow-500/30 bg-yellow-900/20 text-yellow-300',
    orange: 'border-orange-500/30 bg-orange-900/20 text-orange-300',
    cyan: 'border-cyan-500/30 bg-cyan-900/20 text-cyan-300',
    purple: 'border-purple-500/30 bg-purple-900/20 text-purple-300',
  }

  return (
    <motion.div
      layout
      className={`rounded-lg border-2 p-3 transition-all ${
        colorClasses[roleInfo.color as keyof typeof colorClasses]
      } ${disabled ? 'opacity-50' : 'hover:border-opacity-50'}`}
    >
      {/* Role Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{roleInfo.emoji}</span>
          <div>
            <h3 className="font-manor text-xs font-semibold uppercase tracking-wider">
              {roleInfo.displayName}
            </h3>
            <p className="text-xs opacity-75">{roleInfo.name}</p>
          </div>
        </div>

        {/* Count Badge */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/20">
          <span className="font-bold text-sm">{count}</span>
        </div>
      </div>

      {/* Count Controls */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <button
          onClick={handleDecrease}
          disabled={!canDecrease || disabled}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="text-lg font-bold">-</span>
        </button>

        <div className="flex-1 text-center">
          <input
            type="number"
            min={roleKey === 'murderers' ? 1 : 0}
            max={maxCount}
            value={count}
            onChange={(e) => {
              const newCount = parseInt(e.target.value) || 0
              if (newCount >= (roleKey === 'murderers' ? 1 : 0) && newCount <= maxCount) {
                onCountChange(newCount)
              }
            }}
            disabled={disabled}
            className="w-16 px-2 py-1 text-center rounded border border-white/20 bg-white/10 text-white disabled:opacity-50"
          />
        </div>

        <button
          onClick={handleIncrease}
          disabled={!canIncrease || disabled}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="text-lg font-bold">+</span>
        </button>
      </div>

      {/* Role Description */}
      <p className="text-xs opacity-75 mb-1">{roleInfo.description}</p>

      {/* Abilities */}
      <div className="flex flex-wrap gap-1">
        {roleInfo.abilities.map((ability, index) => (
          <span
            key={index}
            className="px-2 py-1 text-xs rounded-full bg-white/10 border border-white/20"
          >
            {ability}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

export function RoleDistribution({
  distribution,
  maxPlayers,
  onDistributionChange,
  disabled = false,
}: RoleDistributionProps) {
  const totalSpecialRoles = getTotalSpecialRoles(distribution)
  const civilianCount = getCivilianCount(distribution, maxPlayers)
  const validation = validateRoleDistribution(distribution, maxPlayers)

  const updateRoleCount = (roleKey: keyof RoleDistributionType, count: number) => {
    onDistributionChange({
      ...distribution,
      [roleKey]: count,
    })
  }

  const applyPreset = (presetKey: keyof typeof GAME_PRESETS) => {
    if (disabled) return

    const preset = GAME_PRESETS[presetKey]
    onDistributionChange(preset.roleDistribution)
  }

  const resetToDefault = () => {
    if (disabled) return

    onDistributionChange({
      murderers: 1,
      detectives: 0,
      revivers: 0,
      bodyguards: 0,
      vigilantes: 0,
      trolls: 0,
    })
  }

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="space-y-3">
        <h3 className="font-manor text-sm uppercase tracking-wider text-manor-candle">
          Quick Presets
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(GAME_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key as keyof typeof GAME_PRESETS)}
              disabled={disabled}
              className="p-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
            >
              <div className="font-semibold text-sm text-manor-candle">{preset.name}</div>
              <div className="text-xs text-manor-parchment/60 mt-1">
                {preset.maxPlayers} players
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-white/20 bg-white/5 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-manor-candle">{totalSpecialRoles}</div>
            <div className="text-xs text-manor-parchment/60">Special Roles</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-300">{civilianCount}</div>
            <div className="text-xs text-manor-parchment/60">Civilians</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-manor-candle">{totalSpecialRoles + civilianCount}</div>
            <div className="text-xs text-manor-parchment/60">Total Assigned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-manor-parchment">{maxPlayers}</div>
            <div className="text-xs text-manor-parchment/60">Max Players</div>
          </div>
        </div>

        {/* Validation Messages */}
        {!validation.isValid && (
          <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-500/30">
            <h4 className="font-semibold text-red-300 mb-2">⚠️ Configuration Issues:</h4>
            <ul className="list-disc list-inside text-sm text-red-200 space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.isValid && (
          <div className="mt-4 p-3 rounded-lg bg-green-900/20 border border-green-500/30">
            <div className="flex items-center gap-2 text-green-300">
              <span>✅</span>
              <span className="font-semibold">Configuration Valid</span>
            </div>
          </div>
        )}
      </div>

      {/* Role Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-manor text-sm uppercase tracking-wider text-manor-candle">
            Role Distribution
          </h3>
          <button
            onClick={resetToDefault}
            disabled={disabled}
            className="px-3 py-1 text-sm rounded border border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset to Default
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(Object.keys(ROLE_INFO) as (keyof RoleDistributionType)[]).map((roleKey) => (
            <RoleCard
              key={roleKey}
              roleKey={roleKey}
              count={distribution[roleKey]}
              maxCount={maxPlayers}
              onCountChange={(count) => updateRoleCount(roleKey, count)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {/* Civilian Info */}
      <div className="rounded-lg border border-gray-500/30 bg-gray-900/20 p-3">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl">❄️</span>
          <div>
            <h3 className="font-manor text-xs font-semibold uppercase tracking-wider text-gray-300">
              Snowbound Citizens
            </h3>
            <p className="text-xs text-gray-400">Civilians</p>
          </div>
          <div className="ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/20">
            <span className="font-bold text-sm text-gray-300">{civilianCount}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Regular players with no special abilities. They win by finding and eliminating all murderers.
          The number of civilians is automatically calculated based on max players and special role count.
        </p>
      </div>
    </div>
  )
}