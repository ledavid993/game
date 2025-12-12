import { getPayloadClient } from './payloadGameService'
import { sendEmail, isEmailConfigured } from '../email'
import type { GamePlayer, PlayerRegistry } from '@/payload-types'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

interface NotifyResult {
  sent: number
  failed: number
  skipped: number
  details: Array<{
    playerCode: string
    playerName: string
    email?: string
    status: 'sent' | 'failed' | 'skipped'
    error?: string
  }>
}

/**
 * Generate HTML email template for player invitation
 */
function generateEmailHtml(playerName: string, playerUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0b0f; font-family: Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0b0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; background: linear-gradient(180deg, #1a1c24 0%, #10121a 100%); border: 1px solid rgba(177, 54, 30, 0.3); border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 24px 16px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <div style="font-size: 32px; margin-bottom: 8px;">🎭</div>
              <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.2em; color: #d4a574; text-transform: uppercase;">Manor of Whispers</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <p style="margin: 0 0 16px; font-size: 14px; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(212, 165, 116, 0.6); text-align: center;">
                You've Been Summoned
              </p>
              <p style="margin: 0 0 24px; font-size: 18px; color: #e8dcc8; text-align: center;">
                <strong>${playerName}</strong>, your presence is requested at the manor.
              </p>
              <p style="margin: 0 0 32px; font-size: 14px; color: rgba(232, 220, 200, 0.7); text-align: center;">
                A mysterious gathering awaits. Your identity and role shall be revealed upon arrival.
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${playerUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(180deg, #8b2f1a 0%, #5c1f12 100%); border: 1px solid rgba(177, 54, 30, 0.5); border-radius: 8px; color: #d4a574; text-decoration: none; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: bold;">
                      Enter the Manor
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0 0 8px; font-size: 12px; color: rgba(232, 220, 200, 0.5);">
                Or copy this link:
              </p>
              <p style="margin: 0; font-size: 11px; color: rgba(232, 220, 200, 0.4); word-break: break-all;">
                ${playerUrl}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Send game URL email to players who haven't received it yet
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

  if (!isEmailConfigured()) {
    return result
  }

  const payload = await getPayloadClient()

  // Build query to find players who need notification
  // Use not_equals: true to match both false and undefined/null
  const whereClause: Record<string, unknown> = {
    game: { equals: gameId },
    smsSent: { not_equals: true },
  }

  // If specific player IDs provided, filter to those
  if (playerIds && playerIds.length > 0) {
    whereClause.id = { in: playerIds }
  }

  // Fetch game players with their registry data (for email addresses)
  const gamePlayersResult = await payload.find({
    collection: 'game-players',
    where: whereClause,
    depth: 1, // Include PlayerRegistry data
    limit: 1000,
  })

  const gamePlayers = gamePlayersResult.docs as unknown as GamePlayer[]

  for (const gamePlayer of gamePlayers) {
    const playerRegistry = gamePlayer.player as PlayerRegistry | null

    // Skip if no registry data
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

    if (!playerRegistry.email) {
      result.skipped++
      result.details.push({
        playerCode: gamePlayer.playerCode,
        playerName: playerRegistry.displayName,
        status: 'skipped',
        error: 'No email address',
      })
      continue
    }

    // Construct the player URL
    const playerUrl = `${baseUrl.replace(/\/$/, '')}/game/play/${gamePlayer.playerCode}`

    // Generate email HTML
    const emailHtml = generateEmailHtml(playerRegistry.displayName, playerUrl)

    // Send the email
    const emailResult = await sendEmail(
      playerRegistry.email,
      "You've Been Summoned to the Manor",
      emailHtml
    )

    if (emailResult.success) {
      // Update the player record to mark notification as sent
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
        email: playerRegistry.email,
        status: 'sent',
      })
    } else {
      result.failed++
      result.details.push({
        playerCode: gamePlayer.playerCode,
        playerName: playerRegistry.displayName,
        email: playerRegistry.email,
        status: 'failed',
        error: emailResult.error,
      })
    }
  }

  return result
}

/**
 * Send email to a single player (used for late joiners)
 */
export async function sendPlayerUrl(gamePlayerId: string | number): Promise<boolean> {
  const result = await sendPlayerUrls('', [String(gamePlayerId)])
  return result.sent > 0
}
