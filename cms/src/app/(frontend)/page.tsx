import React from 'react'
import GameLanding from '@/app/components/game/GameLanding'
import GameStatusDisplay from '@/app/components/game/GameStatusDisplay'
import { getSerializedGameState } from '@/lib/game/payloadGameService'

// Force this page to be dynamic (no caching)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  // Load the active game session
  let gameState = null
  try {
    gameState = await getSerializedGameState({ gameCode: 'GAME_MAIN' })
  } catch (_error) {
    // No active game session exists
    console.log('No active game session found')
  }

  return (
    <>
      {gameState ? (
        <GameStatusDisplay initialGameState={gameState} />
      ) : (
        <GameLanding />
      )}
    </>
  )
}
