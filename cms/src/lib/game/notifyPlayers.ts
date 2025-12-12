import { getPayloadClient } from './payloadGameService'
import { sendSMS, isTwilioConfigured } from '../twilio'
import type { GamePlayer, PlayerRegistry } from '@/payload-types'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

interface NotifyResult {
  sent: number
  failed: number
  skipped: number
  details: Array<{
    playerCode: string
    playerName: string
    phone?: string
    status: 'sent' | 'failed' | 'skipped'
    error?: string
  }>
}

/**
 * Send game URL SMS to players who haven't received it yet
 * @param gameId - The game ID (not gameCode)
 * @param playerIds - Optional array of specific player IDs to notify (for late joiners)
 */
export async function sendPlayerUrls(
  gameId: string | number,
  playerIds?: string[],
): Promise<NotifyResult> {
  const result: NotifyResult = {
    sent: 0,
    failed: 0,
    skipped: 0,
    details: [],
  }

  if (!isTwilioConfigured()) {
    return result
  }

  const payload = await getPayloadClient()

  // Build query to find players who need SMS
  // Use not_equals: true to match both false and undefined/null
  const whereClause: Record<string, unknown> = {
    game: { equals: gameId },
    smsSent: { not_equals: true },
  }

  // If specific player IDs provided, filter to those
  if (playerIds && playerIds.length > 0) {
    whereClause.id = { in: playerIds }
  }

  // Fetch game players with their registry data (for phone numbers)
  const gamePlayersResult = await payload.find({
    collection: 'game-players',
    where: whereClause,
    depth: 1, // Include PlayerRegistry data
    limit: 1000,
  })

  const gamePlayers = gamePlayersResult.docs as unknown as GamePlayer[]

  for (const gamePlayer of gamePlayers) {
    const playerRegistry = gamePlayer.player as PlayerRegistry | null

    // Skip if no registry data or no phone number
    if (
      !playerRegistry ||
      typeof playerRegistry === 'string' ||
      typeof playerRegistry === 'number'
    ) {
      result.skipped++
      result.details.push({
        playerCode: gamePlayer.playerCode,
        playerName: 'Unknown',
        status: 'skipped',
        error: 'Player registry data not found',
      })
      continue
    }

    if (!playerRegistry.phone) {
      result.skipped++
      result.details.push({
        playerCode: gamePlayer.playerCode,
        playerName: playerRegistry.displayName,
        status: 'skipped',
        error: 'No phone number',
      })
      continue
    }

    // Construct the player URL
    const playerUrl = `${baseUrl.replace(/\/$/, '')}/game/play/${gamePlayer.playerCode}`

    // Compose the message
    const message = `🎭 Manor of Whispers

${playerRegistry.displayName}, you've been summoned!

Join the game: ${playerUrl}

Your identity awaits...`

    // Send the SMS
    const smsResult = await sendSMS(playerRegistry.phone, message)

    if (smsResult.success) {
      // Update the player record to mark SMS as sent
      await payload.update({
        collection: 'game-players',
        id: gamePlayer.id,
        data: {
          smsSent: true,
          smsSentAt: new Date().toISOString(),
        },
      })

      result.sent++
      result.details.push({
        playerCode: gamePlayer.playerCode,
        playerName: playerRegistry.displayName,
        phone: playerRegistry.phone,
        status: 'sent',
      })
    } else {
      result.failed++
      result.details.push({
        playerCode: gamePlayer.playerCode,
        playerName: playerRegistry.displayName,
        phone: playerRegistry.phone,
        status: 'failed',
        error: smsResult.error,
      })
    }
  }

  return result
}

/**
 * Send SMS to a single player (used for late joiners)
 */
export async function sendPlayerUrl(gamePlayerId: string | number): Promise<boolean> {
  const result = await sendPlayerUrls('', [String(gamePlayerId)])
  return result.sent > 0
}
