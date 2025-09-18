import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/game/payloadGameService';
import type { Game } from '@/payload-types';

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
      updateData.status = status;
      // If changing to active, set startedAt
      if (status === 'active' && game.status !== 'active') {
        updateData.startedAt = new Date().toISOString();
      }
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