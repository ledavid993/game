'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { RoleCooldowns } from '@/app/lib/game/gameSettings'
import {
  ROLE_INFO,
  DEFAULT_ROLE_COOLDOWNS,
  COOLDOWN_PRESETS,
  applyCooldownPreset,
} from '@/app/lib/game/gameSettings'

interface CooldownSettingsProps {
  cooldowns: RoleCooldowns
  onCooldownsChange: (cooldowns: RoleCooldowns) => void
  disabled?: boolean
}

interface CooldownSliderProps {
  label: string
  description: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  emoji: string
  color: string
  onChange: (value: number) => void
  disabled?: boolean
}

function CooldownSlider({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  unit,
  emoji,
  color,
  onChange,
  disabled,
}: CooldownSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  const colorClasses = {
    red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    orange: 'from-orange-500 to-orange-600',
    cyan: 'from-cyan-500 to-cyan-600',
    purple: 'from-purple-500 to-purple-600',
  }

  const borderClasses = {
    red: 'border-red-500/30 bg-red-900/20',
    blue: 'border-blue-500/30 bg-blue-900/20',
    green: 'border-green-500/30 bg-green-900/20',
    yellow: 'border-yellow-500/30 bg-yellow-900/20',
    orange: 'border-orange-500/30 bg-orange-900/20',
    cyan: 'border-cyan-500/30 bg-cyan-900/20',
    purple: 'border-purple-500/30 bg-purple-900/20',
  }

  return (
    <motion.div
      layout
      className={`rounded-lg border-2 p-4 transition-all ${
        borderClasses[color as keyof typeof borderClasses]
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className="font-manor text-sm font-semibold uppercase tracking-wider text-white">
              {label}
            </h3>
            <p className="text-xs text-white/60">{description}</p>
          </div>
        </div>

        {/* Value Display */}
        <div className="text-right">
          <div className="text-lg font-bold text-white">
            {value}
            <span className="text-sm text-white/60 ml-1">{unit}</span>
          </div>
          {unit === 'minutes' && value > 0 && (
            <div className="text-xs text-white/50">
              {Math.floor(value / 60)}h {value % 60}m
            </div>
          )}
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, rgb(var(--color-${color})) 0%, rgb(var(--color-${color})) ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`,
            }}
          />
          <style jsx>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: linear-gradient(45deg, ${colorClasses[color as keyof typeof colorClasses]});
              cursor: pointer;
              border: 2px solid white;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
            }
            .slider::-moz-range-thumb {
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: linear-gradient(45deg, ${colorClasses[color as keyof typeof colorClasses]});
              cursor: pointer;
              border: 2px solid white;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
            }
          `}</style>
        </div>

        {/* Preset Values */}
        <div className="flex justify-between text-xs text-white/40">
          <span>{min}{unit === 'minutes' ? 'm' : unit}</span>
          <span>{Math.floor((min + max) / 2)}{unit === 'minutes' ? 'm' : unit}</span>
          <span>{max}{unit === 'minutes' ? 'm' : unit}</span>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex gap-2 mt-3">
        {unit === 'minutes' && (
          <>
            <button
              onClick={() => onChange(5)}
              disabled={disabled}
              className="px-2 py-1 text-xs rounded border border-white/20 hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              Fast (5m)
            </button>
            <button
              onClick={() => onChange(15)}
              disabled={disabled}
              className="px-2 py-1 text-xs rounded border border-white/20 hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              Normal (15m)
            </button>
            <button
              onClick={() => onChange(30)}
              disabled={disabled}
              className="px-2 py-1 text-xs rounded border border-white/20 hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              Slow (30m)
            </button>
          </>
        )}
        {unit !== 'minutes' && label.includes('Max') && (
          <>
            <button
              onClick={() => onChange(1)}
              disabled={disabled}
              className="px-2 py-1 text-xs rounded border border-white/20 hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              Once
            </button>
            <button
              onClick={() => onChange(3)}
              disabled={disabled}
              className="px-2 py-1 text-xs rounded border border-white/20 hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              Moderate
            </button>
            <button
              onClick={() => onChange(5)}
              disabled={disabled}
              className="px-2 py-1 text-xs rounded border border-white/20 hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              Many
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}

export function CooldownSettings({
  cooldowns,
  onCooldownsChange,
  disabled = false,
}: CooldownSettingsProps) {
  const updateCooldown = (key: keyof RoleCooldowns, value: number) => {
    onCooldownsChange({
      ...cooldowns,
      [key]: value,
    })
  }

  const applyPreset = (presetKey: keyof typeof COOLDOWN_PRESETS) => {
    if (disabled) return

    const newCooldowns = applyCooldownPreset(DEFAULT_ROLE_COOLDOWNS, presetKey)
    onCooldownsChange(newCooldowns)
  }

  const resetToDefaults = () => {
    if (disabled) return
    onCooldownsChange(DEFAULT_ROLE_COOLDOWNS)
  }

  const cooldownConfigs = [
    {
      key: 'murdererKillCooldown' as keyof RoleCooldowns,
      label: 'Murderer Kill',
      description: 'Time between kills',
      min: 0,
      max: 60,
      unit: 'minutes',
      emoji: ROLE_INFO.murderers.emoji,
      color: ROLE_INFO.murderers.color,
    },
    {
      key: 'detectiveInvestigateCooldown' as keyof RoleCooldowns,
      label: 'Detective Investigate',
      description: 'Time between investigations',
      min: 0,
      max: 60,
      unit: 'minutes',
      emoji: ROLE_INFO.detectives.emoji,
      color: ROLE_INFO.detectives.color,
    },
    {
      key: 'reviverReviveCooldown' as keyof RoleCooldowns,
      label: 'Reviver Revive',
      description: 'Time between revivals',
      min: 0,
      max: 60,
      unit: 'minutes',
      emoji: ROLE_INFO.revivers.emoji,
      color: ROLE_INFO.revivers.color,
    },
    {
      key: 'bodyguardProtectionDuration' as keyof RoleCooldowns,
      label: 'Bodyguard Protection',
      description: 'How long protection lasts',
      min: 5,
      max: 120,
      unit: 'minutes',
      emoji: ROLE_INFO.bodyguards.emoji,
      color: ROLE_INFO.bodyguards.color,
    },
    {
      key: 'vigilanteMaxKills' as keyof RoleCooldowns,
      label: 'Vigilante Max Kills',
      description: 'Maximum elimination attempts',
      min: 0,
      max: 10,
      unit: 'kills',
      emoji: ROLE_INFO.vigilantes.emoji,
      color: ROLE_INFO.vigilantes.color,
    },
    {
      key: 'nurseHealCooldown' as keyof RoleCooldowns,
      label: 'Nurse Heal',
      description: 'Time between healing',
      min: 0,
      max: 60,
      unit: 'minutes',
      emoji: ROLE_INFO.nurses.emoji,
      color: ROLE_INFO.nurses.color,
    },
    {
      key: 'doctorHealCooldown' as keyof RoleCooldowns,
      label: 'Doctor Heal',
      description: 'Time between advanced healing',
      min: 0,
      max: 60,
      unit: 'minutes',
      emoji: ROLE_INFO.doctors.emoji,
      color: ROLE_INFO.doctors.color,
    },
    {
      key: 'trollMimicCooldown' as keyof RoleCooldowns,
      label: 'Grinch Mimic',
      description: 'Time between mimicking abilities',
      min: 0,
      max: 60,
      unit: 'minutes',
      emoji: ROLE_INFO.trolls.emoji,
      color: ROLE_INFO.trolls.color,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Global Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-manor text-lg uppercase tracking-wider text-manor-candle">
            Cooldown Presets
          </h3>
          <button
            onClick={resetToDefaults}
            disabled={disabled}
            className="px-3 py-1 text-sm rounded border border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset to Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(COOLDOWN_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key as keyof typeof COOLDOWN_PRESETS)}
              disabled={disabled}
              className="p-4 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
            >
              <div className="font-manor font-semibold text-manor-candle">{preset.name}</div>
              <div className="text-sm text-manor-parchment/80 mt-1">{preset.description}</div>
              <div className="text-xs text-manor-parchment/60 mt-2">
                {preset.multiplier === 1 ? 'Default' : `${preset.multiplier}x`} speed
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Individual Cooldown Settings */}
      <div className="space-y-3">
        <h3 className="font-manor text-lg uppercase tracking-wider text-manor-candle">
          Individual Settings
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cooldownConfigs.map((config) => (
            <CooldownSlider
              key={config.key}
              label={config.label}
              description={config.description}
              value={cooldowns[config.key]}
              min={config.min}
              max={config.max}
              unit={config.unit}
              emoji={config.emoji}
              color={config.color}
              onChange={(value) => updateCooldown(config.key, value)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {/* Game Pace Summary */}
      <div className="rounded-lg border border-white/20 bg-white/5 p-4">
        <h4 className="font-manor font-semibold text-manor-candle mb-3">Game Pace Summary</h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-red-300">{cooldowns.murdererKillCooldown}m</div>
            <div className="text-xs text-manor-parchment/60">Kill Cooldown</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-300">{cooldowns.detectiveInvestigateCooldown}m</div>
            <div className="text-xs text-manor-parchment/60">Investigation</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-300">{cooldowns.reviverReviveCooldown}m</div>
            <div className="text-xs text-manor-parchment/60">Revival</div>
          </div>
          <div>
            <div className="text-xl font-bold text-orange-300">{cooldowns.vigilanteMaxKills}</div>
            <div className="text-xs text-manor-parchment/60">Vigilante Kills</div>
          </div>
        </div>

        {/* Game Pace Indicator */}
        <div className="mt-4 p-3 rounded-lg bg-black/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-manor-candle">Game Pace:</span>
            <span className="text-sm text-manor-parchment">
              {(() => {
                const avgCooldown = (
                  cooldowns.murdererKillCooldown +
                  cooldowns.detectiveInvestigateCooldown +
                  cooldowns.reviverReviveCooldown
                ) / 3

                if (avgCooldown < 8) return '🏃‍♂️ Fast'
                if (avgCooldown < 18) return '🚶‍♂️ Normal'
                return '🐌 Strategic'
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}