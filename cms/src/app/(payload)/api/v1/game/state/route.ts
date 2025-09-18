import { NextRequest, NextResponse } from 'next/server';

import { getSerializedGameState, resetGame } from '@/lib/game/payloadGameService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameCode = searchParams.get('gameCode');
  const playerCode = searchParams.get('playerCode');

  try {
    const state = await getSerializedGameState({ gameCode, playerCode });

    return NextResponse.json({
      success: true,
      gameState: state,
      playerData: 'playerData' in state ? state.playerData ?? null : null,
    });
  } catch (error) {
    console.error('Error fetching game state', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch game state';
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameCode = searchParams.get('gameCode');

  if (!gameCode) {
    return NextResponse.json({ success: false, error: 'gameCode is required' }, { status: 400 });
  }

  try {
    await resetGame({ gameCode });
    return NextResponse.json({ success: true, message: 'Game reset' });
  } catch (error) {
    console.error('Error resetting game', error);
    const message = error instanceof Error ? error.message : 'Failed to reset game';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
