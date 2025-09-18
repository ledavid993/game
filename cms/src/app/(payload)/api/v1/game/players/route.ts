import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient, generateCode } from '@/lib/game/payloadGameService';
import type { Game, GamePlayer } from '@/payload-types';

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

    // Fetch all players for this game
    const playersResult = (await payload.find({
      collection: 'game-players',
      where: { game: { equals: game.id } },
      depth: 0,
      limit: 1000,
      sort: 'createdAt',
    })) as unknown as { docs: GamePlayer[] };

    const players = playersResult.docs.map(player => ({
      id: player.playerCode,
      name: player.displayName,
      username: player.username,
      phone: player.phone,
      email: player.email,
    }));

    return NextResponse.json({
      success: true,
      players,
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch players';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { player } = body;

    if (!player?.name || !player?.username) {
      return NextResponse.json({ success: false, error: 'Player name and username required' }, { status: 400 });
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
            murdererCount: 2,
            theme: 'christmas',
          },
          killEvents: [],
        },
      })) as unknown as Game;
    }

    // Create the player
    const createdPlayer = (await payload.create({
      collection: 'game-players',
      data: {
        game: game.id,
        displayName: player.name,
        username: player.username,
        playerCode: generateCode('PLAYER', 8),
        phone: player.phone || undefined,
        email: player.email || undefined,
        role: 'civilian',
        isAlive: true,
        joinedAt: new Date().toISOString(),
        kills: 0,
      },
    })) as unknown as GamePlayer;

    return NextResponse.json({
      success: true,
      player: {
        id: createdPlayer.playerCode,
        name: createdPlayer.displayName,
        username: createdPlayer.username,
        phone: createdPlayer.phone,
        email: createdPlayer.email,
      },
    });
  } catch (error) {
    console.error('Error adding player:', error);
    const message = error instanceof Error ? error.message : 'Failed to add player';
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

    const playerResult = (await payload.find({
      collection: 'game-players',
      where: { playerCode: { equals: playerCode } },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: GamePlayer[] };

    if (playerResult.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 });
    }

    await payload.delete({
      collection: 'game-players',
      id: String(playerResult.docs[0].id),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting player:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete player';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}