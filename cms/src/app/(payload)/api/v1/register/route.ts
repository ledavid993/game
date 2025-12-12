import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient, generateCode } from '@/lib/game/payloadGameService'
import { generateUsername } from '@/lib/game/usernameGenerator'
import type { PlayerRegistry } from '@/payload-types'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email } = body

    // Validate required name field
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name is required (minimum 2 characters)' },
        { status: 400 }
      )
    }

    // Validate optional email if provided
    if (email && !validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate optional phone if provided
    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number' },
        { status: 400 }
      )
    }

    const payload = await getPayloadClient()

    // Get existing usernames to avoid duplicates
    const existingPlayers = (await payload.find({
      collection: 'player-registry',
      depth: 0,
      limit: 1000,
    })) as unknown as { docs: PlayerRegistry[] }

    const existingUsernames = existingPlayers.docs.map((p) => p.username.toLowerCase())

    // Auto-generate unique username
    const username = generateUsername({ excludeList: existingUsernames })

    // Create the player in registry
    const createdPlayer = (await payload.create({
      collection: 'player-registry',
      data: {
        displayName: name.trim(),
        username,
        playerCode: generateCode('PLAYER', 8),
        phone: phone?.trim() || undefined,
        email: email?.trim() || undefined,
        isActive: true,
        gamesPlayed: 0,
      },
    })) as unknown as PlayerRegistry

    return NextResponse.json({
      success: true,
      player: {
        displayName: createdPlayer.displayName,
        username: createdPlayer.username,
        playerCode: createdPlayer.playerCode,
      },
    })
  } catch (error) {
    console.error('Error registering player:', error)
    const message = error instanceof Error ? error.message : 'Failed to register'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
