import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/game/payloadGameService';
import type { Game, GamePlayer, PlayerRegistry } from '@/payload-types';

const SINGLE_GAME_CODE = 'GAME_MAIN';

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadClient();

    // Get the single game session
    const existingGames = (await payload.find({
      collection: 'games',
      where: { code: { equals: SINGLE_GAME_CODE } },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: Game[] };

    if (existingGames.docs.length === 0) {
      return NextResponse.json({
        success: true,
        players: []
      });
    }

    const game = existingGames.docs[0];

    // Fetch all assigned players for this game with player details
    const gamePlayersResult = (await payload.find({
      collection: 'game-players',
      where: { game: { equals: game.id } },
      depth: 1, // Include player relationship data
      limit: 1000,
      sort: 'createdAt',
    })) as unknown as { docs: GamePlayer[] };

    const assignedPlayers = gamePlayersResult.docs.map((gamePlayer) => {
      const player = gamePlayer.player as PlayerRegistry;
      return {
        id: player.playerCode,
        name: player.displayName,
        username: player.username,
        phone: player.phone,
        email: player.email,
        gamesPlayed: player.gamesPlayed || 0,
        assignmentCode: gamePlayer.playerCode,
      };
    });

    return NextResponse.json({
      success: true,
      players: assignedPlayers,
    });
  } catch (error) {
    console.error('Error fetching assigned players:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch assigned players';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
