import React from 'react'
import { requireAuth } from '@/lib/auth'
import { getSerializedGameState } from '@/lib/game/payloadGameService'
import { HostDashboardWrapper } from '@/app/components/game/HostDashboardWrapper'

// Force this page to be dynamic (no caching)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HostPage() {
  // Require authentication to access this page
  await requireAuth()

  // Load the active game session
  let gameState = null
  try {
    gameState = await getSerializedGameState({ gameCode: 'GAME_MAIN' })
  } catch (error) {
    // No active game session exists yet, that's okay
    console.log('No active game session found:', error)
  }

  return <HostDashboardWrapper initialGameState={gameState} />
}
