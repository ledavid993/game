import { NextRequest, NextResponse } from 'next/server';
import { GameManager } from '@/lib/game/GameManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    const gameManager = GameManager.getInstance();
    const gameState = gameManager.getGameState();

    let response: any = {
      gameState,
      stats: gameState.stats,
    };

    // If a specific player is requested, include their personal data
    if (playerId) {
      const player = gameManager.getPlayerState(playerId);
      if (player) {
        const cooldownStatus = gameManager.getCooldownStatus(playerId);
        const availableTargets = gameManager.getAvailableTargets(playerId);

        response.playerData = {
          player,
          cooldownStatus,
          availableTargets,
        };
      } else {
        return NextResponse.json(
          { error: 'Player not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error getting game state:', error);

    return NextResponse.json(
      { error: 'Failed to get game state' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const gameManager = GameManager.getInstance();
    gameManager.resetGame();

    return NextResponse.json({
      success: true,
      message: 'Game reset successfully',
    });

  } catch (error: any) {
    console.error('Error resetting game:', error);

    return NextResponse.json(
      { error: 'Failed to reset game' },
      { status: 500 }
    );
  }
}