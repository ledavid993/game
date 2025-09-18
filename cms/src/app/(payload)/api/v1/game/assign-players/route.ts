import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient, generateCode } from '@/lib/game/payloadGameService';
import type { Game, GamePlayer, PlayerRegistry } from '@/payload-types';

const SINGLE_GAME_CODE = 'GAME_MAIN';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerCodes } = body; // Array of player codes to assign to the game

    if (!playerCodes || !Array.isArray(playerCodes) || playerCodes.length === 0) {
      return NextResponse.json({ success: false, error: 'Player codes array required' }, { status: 400 });
    }

    const payload = await getPayloadClient();

    // Get or create the single game session
    let game: Game;
    const existingGames = (await payload.find({
      collection: 'games',
      where: { code: { equals: SINGLE_GAME_CODE } },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: Game[] };

    if (existingGames.docs.length > 0) {
      game = existingGames.docs[0];
    } else {
      // Create new game session in lobby status
      game = (await payload.create({
        collection: 'games',
        data: {
          code: SINGLE_GAME_CODE,
          status: 'lobby',
          hostDisplayName: 'Host',
          settings: {
            cooldownMinutes: 10,
            maxPlayers: 100,
            murdererCount: 1,
          },
          killEvents: [],
        },
      })) as unknown as Game;
    }


    // Get players from registry
    const playersResult = (await payload.find({
      collection: 'player-registry',
      where: {
        playerCode: { in: playerCodes },
        isActive: { equals: true }
      },
      depth: 0,
      limit: 1000,
    })) as unknown as { docs: PlayerRegistry[] };

    if (playersResult.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid players found in registry' }, { status: 404 });
    }

    // Check for already assigned players
    const existingAssignments = (await payload.find({
      collection: 'game-players',
      where: { game: { equals: game.id } },
      depth: 0,
      limit: 1000,
    })) as unknown as { docs: GamePlayer[] };

    const alreadyAssignedPlayerIds = new Set(existingAssignments.docs.map(gp =>
      typeof gp.player === 'object' ? gp.player.id : gp.player
    ));

    // Filter out already assigned players
    const playersToAssign = playersResult.docs.filter(player =>
      !alreadyAssignedPlayerIds.has(player.id)
    );

    if (playersToAssign.length === 0) {
      return NextResponse.json({
        success: true,
        assigned: 0,
        skipped: playerCodes.length,
        message: 'All selected players are already assigned to the game'
      });
    }

    // Create game-player assignments
    const assignedPlayers: GamePlayer[] = [];
    const assignedPlayerDetails: Array<{
      id: string;
      name: string;
      username: string;
      phone?: string | null;
      email?: string | null;
      gamesPlayed: number;
      assignmentCode: string;
    }> = [];
    for (const player of playersToAssign) {
      const gamePlayerCode = generateCode('GP', 8);

      const gamePlayer = (await payload.create({
        collection: 'game-players',
        data: {
          game: game.id,
          player: player.id,
          playerCode: gamePlayerCode,
          role: 'civilian',
          isAlive: true,
          joinedAt: new Date().toISOString(),
          kills: 0,
        },
      })) as unknown as GamePlayer;

      assignedPlayers.push(gamePlayer);
      assignedPlayerDetails.push({
        id: player.playerCode,
        name: player.displayName,
        username: player.username,
        phone: player.phone ?? undefined,
        email: player.email ?? undefined,
        gamesPlayed: player.gamesPlayed || 0,
        assignmentCode: gamePlayer.playerCode,
      });
    }

    return NextResponse.json({
      success: true,
      assigned: assignedPlayers.length,
      skipped: playerCodes.length - assignedPlayers.length,
      players: assignedPlayerDetails,
    });
  } catch (error) {
    console.error('Error assigning players to game:', error);
    const message = error instanceof Error ? error.message : 'Failed to assign players';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerCode = searchParams.get('playerCode');

    if (!playerCode) {
      return NextResponse.json({ success: false, error: 'Player code required' }, { status: 400 });
    }

    const payload = await getPayloadClient();

    // Find the game-player assignment
    const gamePlayerResult = (await payload.find({
      collection: 'game-players',
      where: { playerCode: { equals: playerCode } },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: GamePlayer[] };

    let assignment = gamePlayerResult.docs[0];

    if (!assignment) {
      // Fallback for legacy clients that send the registry player code instead of assignment code
      const registryResult = (await payload.find({
        collection: 'player-registry',
        where: { playerCode: { equals: playerCode } },
        depth: 0,
        limit: 1,
      })) as unknown as { docs: PlayerRegistry[] };

      if (registryResult.docs.length === 0) {
        return NextResponse.json({ success: false, error: 'Player assignment not found' }, { status: 404 });
      }

      const playerId = registryResult.docs[0].id;

      const assignmentByPlayer = (await payload.find({
        collection: 'game-players',
        where: { player: { equals: playerId } },
        depth: 0,
        limit: 1,
      })) as unknown as { docs: GamePlayer[] };

      if (assignmentByPlayer.docs.length === 0) {
        return NextResponse.json({ success: false, error: 'Player assignment not found' }, { status: 404 });
      }

      assignment = assignmentByPlayer.docs[0];
    }

    // Remove the game-player assignment (but keep player in registry)
    await payload.delete({
      collection: 'game-players',
      id: String(assignment.id),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing player from game:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove player from game';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
