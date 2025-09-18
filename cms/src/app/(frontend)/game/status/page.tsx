import React from 'react'
import { getSerializedGameState } from '@/lib/game/payloadGameService'
import GameStatusScreen from '@/app/components/game/GameStatusScreen'

export default async function GameStatusPage() {
  // Load the active game session
  let gameState = null
  try {
    gameState = await getSerializedGameState({ gameCode: 'GAME_MAIN' })
  } catch (_error) {
    // No active game session exists
    console.log('No active game session found')
  }

  if (!gameState) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-manor-midnight text-manor-candle">
        <div className="text-center">
          <div className="text-6xl mb-4">🏚️</div>
          <h1 className="font-manor text-2xl uppercase tracking-wider mb-2">Manor is Empty</h1>
          <p className="text-manor-parchment/70">No active game session found</p>
        </div>
      </div>
    )
  }

  return <GameStatusScreen initialGameState={gameState} />
}