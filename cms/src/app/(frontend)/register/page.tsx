'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

interface FormData {
  name: string
  phone: string
  email: string
}

interface FormErrors {
  name?: string
  phone?: string
  email?: string
}

interface RegisteredPlayer {
  displayName: string
  username: string
  playerCode: string
}

const validateEmail = (email: string): boolean => {
  if (!email) return true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhone = (phone: string): boolean => {
  if (!phone) return true
  const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{10,}$/
  return phoneRegex.test(phone)
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registeredPlayer, setRegisteredPlayer] = useState<RegisteredPlayer | null>(null)

  const validateField = useCallback((field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        return undefined
      case 'email':
        if (value && !validateEmail(value)) return 'Please enter a valid email address'
        return undefined
      case 'phone':
        if (value && !validatePhone(value)) return 'Please enter a valid phone number'
        return undefined
      default:
        return undefined
    }
  }, [])

  const handleChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      const error = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: error }))
    },
    [validateField]
  )

  const handleBlur = useCallback(
    (field: keyof FormData) => {
      const error = validateField(field, formData[field])
      setErrors((prev) => ({ ...prev, [field]: error }))
    },
    [formData, validateField]
  )

  const isFormValid = formData.name.trim().length >= 2 && !errors.email && !errors.phone

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/v1/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setRegisteredPlayer(data.player)
        setFormData({ name: '', phone: '', email: '' })
        toast.success('Registration successful!')
      } else {
        toast.error(data.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegisterAnother = () => {
    setRegisteredPlayer(null)
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(177,54,30,0.2),_transparent_55%),linear-gradient(140deg,_rgba(9,11,16,0.96)_0%,_rgba(17,22,34,0.92)_55%,_rgba(4,5,9,0.98)_100%)]">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(9,11,16,0.95)',
            color: '#f7d7a1',
            border: '1px solid rgba(177,54,30,0.4)',
          },
        }}
      />

      <div className="absolute inset-0 opacity-20" aria-hidden>
        <div className="h-full w-full bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')]" />
      </div>

      <div className="relative z-10 min-h-screen px-4 sm:px-6 py-8 sm:py-12 md:py-16 flex flex-col items-center">
        <motion.div
          className="flex flex-col items-center text-center space-y-4 sm:space-y-6 mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <motion.h1
              className="font-manor text-[clamp(1.5rem,6vw,3rem)] uppercase tracking-[0.3em] text-manor-candle"
              variants={fadeUp}
              transition={{ delay: 0.1, duration: 0.8, ease: 'easeOut' }}
            >
              Manor of Whispers
            </motion.h1>
          </Link>
          <motion.div
            className="manor-divider max-w-[200px]"
            variants={fadeUp}
            transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
          />
          <motion.p
            className="font-body text-xs uppercase tracking-[0.35em] text-manor-parchment/70"
            variants={fadeUp}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          >
            Guest Registration
          </motion.p>
        </motion.div>

        <motion.div
          className="w-full max-w-md"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
        >
          {registeredPlayer ? (
            <div className="manor-card space-y-6 text-center">
              <div className="text-5xl">✓</div>
              <h2 className="font-manor text-2xl uppercase tracking-[0.2em] text-manor-candle">
                Welcome to the Manor
              </h2>
              <div className="space-y-4">
                <p className="font-body text-manor-parchment/90">
                  <span className="text-manor-candle font-semibold">{registeredPlayer.displayName}</span>, you have been added to the guest registry.
                </p>
                <div className="rounded-lg border border-[rgba(177,54,30,0.4)] bg-manor-wine/20 px-4 py-3">
                  <p className="font-body text-xs uppercase tracking-wider text-manor-parchment/70 mb-1">
                    Your Manor Identity
                  </p>
                  <p className="font-manor text-lg text-manor-candle">@{registeredPlayer.username}</p>
                </div>
                <p className="font-body text-sm text-manor-parchment/70">
                  The host will summon you when the investigation begins.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button onClick={handleRegisterAnother} className="btn-primary w-full">
                  Register Another Guest
                </button>
                <Link href="/" className="btn-secondary w-full text-center">
                  Return to Manor
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="manor-card space-y-6">
              <h2 className="font-manor text-2xl uppercase tracking-[0.2em] text-manor-candle text-center">
                Enter Your Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block font-body text-sm uppercase tracking-wider text-manor-parchment/80 mb-2"
                  >
                    Name <span className="text-manor-ember">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    placeholder="Enter your name"
                    className={`w-full px-4 py-3 rounded-lg border bg-manor-shadow/60 text-manor-candle placeholder:text-manor-parchment/40 focus:outline-none focus:ring-2 transition-colors ${
                      errors.name
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                        : 'border-white/10 focus:border-manor-wine/50 focus:ring-manor-wine/30'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block font-body text-sm uppercase tracking-wider text-manor-parchment/80 mb-2"
                  >
                    Phone <span className="text-manor-parchment/50">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    placeholder="Enter your phone number"
                    className={`w-full px-4 py-3 rounded-lg border bg-manor-shadow/60 text-manor-candle placeholder:text-manor-parchment/40 focus:outline-none focus:ring-2 transition-colors ${
                      errors.phone
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                        : 'border-white/10 focus:border-manor-wine/50 focus:ring-manor-wine/30'
                    }`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block font-body text-sm uppercase tracking-wider text-manor-parchment/80 mb-2"
                  >
                    Email <span className="text-manor-parchment/50">(optional)</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="Enter your email address"
                    className={`w-full px-4 py-3 rounded-lg border bg-manor-shadow/60 text-manor-candle placeholder:text-manor-parchment/40 focus:outline-none focus:ring-2 transition-colors ${
                      errors.email
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                        : 'border-white/10 focus:border-manor-wine/50 focus:ring-manor-wine/30'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>

              <p className="font-body text-xs text-manor-parchment/60 text-center">
                Your information will be added to the guest registry for game sessions.
              </p>
            </form>
          )}
        </motion.div>

        <motion.div
          className="mt-8"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
        >
          <Link
            href="/"
            className="font-body text-sm text-manor-parchment/60 hover:text-manor-candle transition-colors"
          >
            ← Back to Manor
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
