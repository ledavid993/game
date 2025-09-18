import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerNames, settings } = body;

    // Validate request
    if (!playerNames || !Array.isArray(playerNames) || playerNames.length === 0) {
      return NextResponse.json(
        { error: 'Player names are required' },
        { status: 400 }
      );
    }

    if (playerNames.length < 3) {
      return NextResponse.json(
        { error: 'At least 3 players are required' },
        { status: 400 }
      );
    }

    // Access the server's game state (this will be available from the custom server)
    const server = (globalThis as any).server;
    if (!server) {
      return NextResponse.json(
        { error: 'Server not available' },
        { status: 500 }
      );
    }

    const gameState = server.gameState;

    // Reset game state
    gameState.isActive = true;
    gameState.players = new Map();
    gameState.killEvents = [];
    gameState.startTime = Date.now();
    gameState.endTime = undefined;

    // Create players
    const players = playerNames.map((name: string) => ({
      id: server.generatePlayerId(name.trim()),
      name: name.trim(),
      role: 'civilian',
      isAlive: true,
      joinedAt: Date.now(),
    }));

    // Assign roles
    server.assignRoles(players);

    // Add players to game state
    players.forEach((player: any) => {
      gameState.players.set(player.id, player);
    });

    // Generate player links
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const playerLinks: Record<string, string> = {};

    players.forEach((player: any) => {
      playerLinks[player.id] = `${baseUrl}/game/play/${player.id}`;
    });

    const serializedState = server.serializeGameState();

    // Broadcast game started event
    server.io.to('game-room').emit('game-started', serializedState);

    return NextResponse.json({
      success: true,
      gameState: serializedState,
      playerLinks,
      message: 'Game started successfully',
    });

  } catch (error: any) {
    console.error('Error starting game:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to start game',
        code: error.code || 'UNKNOWN_ERROR',
      },
      { status: error.statusCode || 500 }
    );
  }
}

export async function GET() {
  try {
    const server = (globalThis as any).server;
    if (!server) {
      return NextResponse.json(
        { error: 'Server not available' },
        { status: 500 }
      );
    }

    const gameState = server.serializeGameState();

    return NextResponse.json({
      gameState,
      isActive: gameState.isActive,
      stats: gameState.stats,
    });

  } catch (error: any) {
    console.error('Error getting game state:', error);

    return NextResponse.json(
      { error: 'Failed to get game state' },
      { status: 500 }
    );
  }
}