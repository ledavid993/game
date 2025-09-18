import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient, generateCode } from '@/lib/game/payloadGameService';
import type { PlayerRegistry } from '@/payload-types';

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadClient();

    // Fetch all active players from registry
    const playersResult = (await payload.find({
      collection: 'player-registry',
      where: { isActive: { equals: true } },
      depth: 0,
      limit: 1000,
      sort: 'displayName',
    })) as unknown as { docs: PlayerRegistry[] };

    const players = playersResult.docs.map(player => ({
      id: player.playerCode,
      name: player.displayName,
      username: player.username,
      phone: player.phone,
      email: player.email,
      gamesPlayed: player.gamesPlayed || 0,
    }));

    return NextResponse.json({
      success: true,
      players,
    });
  } catch (error) {
    console.error('Error fetching players from registry:', error);
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

    // Check for duplicate username
    const existingPlayer = (await payload.find({
      collection: 'player-registry',
      where: { username: { equals: player.username } },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: PlayerRegistry[] };

    if (existingPlayer.docs.length > 0) {
      return NextResponse.json({ success: false, error: 'Username already exists' }, { status: 400 });
    }

    // Create the player in registry
    const createdPlayer = (await payload.create({
      collection: 'player-registry',
      data: {
        displayName: player.name,
        username: player.username,
        playerCode: generateCode('PLAYER', 8),
        phone: player.phone || undefined,
        email: player.email || undefined,
        isActive: true,
        gamesPlayed: 0,
      },
    })) as unknown as PlayerRegistry;

    return NextResponse.json({
      success: true,
      player: {
        id: createdPlayer.playerCode,
        name: createdPlayer.displayName,
        username: createdPlayer.username,
        phone: createdPlayer.phone,
        email: createdPlayer.email,
        gamesPlayed: createdPlayer.gamesPlayed || 0,
      },
    });
  } catch (error) {
    console.error('Error adding player to registry:', error);
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
      collection: 'player-registry',
      where: { playerCode: { equals: playerCode } },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: PlayerRegistry[] };

    if (playerResult.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 });
    }

    // Instead of deleting, mark as inactive
    await payload.update({
      collection: 'player-registry',
      id: String(playerResult.docs[0].id),
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing player from registry:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove player';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}