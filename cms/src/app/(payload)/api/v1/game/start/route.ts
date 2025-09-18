import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { createGameSession } from '@/lib/game/payloadGameService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { players, playerNames, settings, hostDisplayName } = body ?? {};

    console.log('API received body:', body);
    console.log('API received players:', players);
    console.log('API received playerNames:', playerNames);

    const reqHeaders = await headers();
    const forwardedHost = reqHeaders.get('x-forwarded-host');
    const protocol = reqHeaders.get('x-forwarded-proto') ?? 'http';
    const host = forwardedHost ?? reqHeaders.get('host') ?? 'localhost:3000';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `${protocol}://${host}`;

    // Support both new player structure and legacy playerNames for backward compatibility
    const gameData = players
      ? { players, settings, hostDisplayName, baseUrl }
      : { playerNames, settings, hostDisplayName, baseUrl };

    const { game, playerLinks } = await createGameSession(gameData);

    return NextResponse.json({
      success: true,
      message: 'Game started successfully',
      game,
      playerLinks,
    });
  } catch (error) {
    console.error('Error starting game session', error);
    const message = error instanceof Error ? error.message : 'Failed to start game';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
