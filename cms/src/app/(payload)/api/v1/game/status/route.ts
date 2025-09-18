import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/game/payloadGameService';
import type { Game, GamePlayer, PlayerRegistry } from '@/payload-types';

const SINGLE_GAME_CODE = 'GAME_MAIN';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, settings } = body;

    if (status && !['lobby', 'active'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Valid status required (lobby/active)' }, { status: 400 });
    }

    const payload = await getPayloadClient();

    const gameResult = (await payload.find({
      collection: 'games',
      where: { code: { equals: SINGLE_GAME_CODE } },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: Game[] };

    if (gameResult.docs.length === 0) {
      return NextResponse.json({ success: false, error: 'Game session not found' }, { status: 404 });
    }

    const game = gameResult.docs[0];
    const updateData: any = {};

    // Update status if provided
    if (status) {
      // If changing to active, validate and assign roles
      if (status === 'active' && game.status !== 'active') {
        // Get all assigned players for this game
        const gamePlayersResult = (await payload.find({
          collection: 'game-players',
          where: { game: { equals: game.id } },
          depth: 1,
          limit: 1000,
        })) as unknown as { docs: GamePlayer[] };

        const assignedPlayers = gamePlayersResult.docs;

        if (assignedPlayers.length === 0) {
          return NextResponse.json({ success: false, error: 'Cannot activate game: No players assigned' }, { status: 400 });
        }

        const murdererCount = game.settings?.murdererCount || 1;

        if (murdererCount > assignedPlayers.length) {
          return NextResponse.json({
            success: false,
            error: `Cannot activate game: Need ${murdererCount} murderers but only ${assignedPlayers.length} players assigned`
          }, { status: 400 });
        }

        // Assign roles to players
        const shuffledPlayers = [...assignedPlayers].sort(() => Math.random() - 0.5);

        // Update each player with their assigned role
        for (let i = 0; i < shuffledPlayers.length; i++) {
          const player = shuffledPlayers[i];
          const role = i < murdererCount ? 'murderer' : 'civilian';

          await payload.update({
            collection: 'game-players',
            id: String(player.id),
            data: { role }
          });
        }

        updateData.startedAt = new Date().toISOString();
      }

      updateData.status = status;
    }

    // Update settings if provided
    if (settings) {
      updateData.settings = {
        ...game.settings,
        ...settings
      };
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length > 0) {
      await payload.update({
        collection: 'games',
        id: String(game.id),
        data: updateData,
      });
    }

    return NextResponse.json({ success: true, status, settings: updateData.settings });
  } catch (error) {
    console.error('Error updating game status:', error);
    const message = error instanceof Error ? error.message : 'Failed to update status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}