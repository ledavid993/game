'use client'

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { generateUsername, formatUsername, cleanUsername, isValidUsername } from '@/lib/game/usernameGenerator'

export interface PlayerData {
  id: string
  name: string
  username: string
  phone?: string
  email?: string
  assignmentCode?: string
  gamesPlayed?: number
}

interface PlayerCardProps {
  player: PlayerData
  onUpdate: (player: PlayerData) => void
  onRemove: (id: string) => void
  existingUsernames: string[]
  canRemove?: boolean
}

export function PlayerCard({
  player,
  onUpdate,
  onRemove,
  existingUsernames,
  canRemove = true
}: PlayerCardProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateEmail = (email: string): boolean => {
    if (!email) return true // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Optional field
    // Allow various phone formats: +1-555-123-4567, (555) 123-4567, 555.123.4567, etc.
    const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{10,}$/
    return phoneRegex.test(phone)
  }

  const handleFieldChange = useCallback((field: keyof PlayerData, value: string) => {
    const newErrors = { ...errors }

    // Validate based on field
    if (field === 'email') {
      if (!validateEmail(value)) {
        newErrors.email = 'Please enter a valid email address'
      } else {
        delete newErrors.email
      }
    }

    if (field === 'phone') {
      if (!validatePhone(value)) {
        newErrors.phone = 'Please enter a valid phone number'
      } else {
        delete newErrors.phone
      }
    }

    if (field === 'username') {
      const cleanedUsername = cleanUsername(value)
      if (!isValidUsername(cleanedUsername)) {
        newErrors.username = 'Username must be 3-20 characters, letters and numbers only'
      } else if (existingUsernames.filter(u => u !== player.username).includes(cleanedUsername)) {
        newErrors.username = 'This username is already taken'
      } else {
        delete newErrors.username
      }
    }

    if (field === 'name') {
      if (!value.trim()) {
        newErrors.name = 'Name is required'
      } else {
        delete newErrors.name
      }
    }

    setErrors(newErrors)

    // Update the player data
    const updatedPlayer = { ...player, [field]: value }
    onUpdate(updatedPlayer)
  }, [player, onUpdate, errors, existingUsernames])

  const regenerateUsername = useCallback(() => {
    const newUsername = generateUsername({
      excludeList: existingUsernames.filter(u => u !== player.username),
      maxLength: 20
    })
    handleFieldChange('username', newUsername)
  }, [existingUsernames, player.username, handleFieldChange])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="manor-card space-y-4 relative"
    >
      {/* Remove Button */}
      {canRemove && (
        <button
          onClick={() => onRemove(player.id)}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-red-900/50 hover:bg-red-900/80 text-red-400 hover:text-red-300 transition-colors flex items-center justify-center text-sm font-bold"
          aria-label={`Remove ${player.name}`}
        >
          ×
        </button>
      )}

      <div className="pr-8">
        <h3 className="font-manor text-[clamp(1rem,2.5vw,1.125rem)] uppercase tracking-wider text-manor-candle mb-3">
          Guest {existingUsernames.indexOf(player.username) + 1}
        </h3>

        {/* Name Field */}
        <div className="space-y-2">
          <label className="block text-[clamp(0.75rem,1.5vw,0.875rem)] font-medium text-manor-parchment/90">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={player.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="Eleanor Glass"
            className={`w-full px-3 py-2 rounded-lg border bg-manor-shadow/60 text-manor-candle placeholder:text-manor-parchment/40 focus:outline-none focus:ring-2 transition-colors ${
              errors.name
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                : 'border-white/10 focus:border-manor-wine/50 focus:ring-manor-wine/30'
            }`}
          />
          {errors.name && (
            <p className="text-red-400 text-xs">{errors.name}</p>
          )}
        </div>

        {/* Username Field */}
        <div className="space-y-2">
          <label className="block text-[clamp(0.75rem,1.5vw,0.875rem)] font-medium text-manor-parchment/90">
            Username
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formatUsername(player.username)}
              onChange={(e) => handleFieldChange('username', cleanUsername(e.target.value))}
              placeholder="@MysticRaven"
              className={`flex-1 px-3 py-2 rounded-lg border bg-manor-shadow/60 text-manor-candle placeholder:text-manor-parchment/40 focus:outline-none focus:ring-2 transition-colors ${
                errors.username
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                  : 'border-white/10 focus:border-manor-wine/50 focus:ring-manor-wine/30'
              }`}
            />
            <button
              onClick={regenerateUsername}
              className="px-3 py-2 rounded-lg border border-white/10 bg-manor-shadow/40 text-manor-parchment/80 hover:text-manor-candle hover:bg-manor-shadow/60 transition-colors text-xs"
              title="Generate new username"
            >
              🎲
            </button>
          </div>
          {errors.username && (
            <p className="text-red-400 text-xs">{errors.username}</p>
          )}
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <label className="block text-[clamp(0.75rem,1.5vw,0.875rem)] font-medium text-manor-parchment/90">
            Phone <span className="text-manor-parchment/50 text-xs">(optional)</span>
          </label>
          <input
            type="tel"
            value={player.phone || ''}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            placeholder="+1 555-123-4567"
            className={`w-full px-3 py-2 rounded-lg border bg-manor-shadow/60 text-manor-candle placeholder:text-manor-parchment/40 focus:outline-none focus:ring-2 transition-colors ${
              errors.phone
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                : 'border-white/10 focus:border-manor-wine/50 focus:ring-manor-wine/30'
            }`}
          />
          {errors.phone && (
            <p className="text-red-400 text-xs">{errors.phone}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label className="block text-[clamp(0.75rem,1.5vw,0.875rem)] font-medium text-manor-parchment/90">
            Email <span className="text-manor-parchment/50 text-xs">(optional)</span>
          </label>
          <input
            type="email"
            value={player.email || ''}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="eleanor@email.com"
            className={`w-full px-3 py-2 rounded-lg border bg-manor-shadow/60 text-manor-candle placeholder:text-manor-parchment/40 focus:outline-none focus:ring-2 transition-colors ${
              errors.email
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                : 'border-white/10 focus:border-manor-wine/50 focus:ring-manor-wine/30'
            }`}
          />
          {errors.email && (
            <p className="text-red-400 text-xs">{errors.email}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
