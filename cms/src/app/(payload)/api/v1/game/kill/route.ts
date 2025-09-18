import { NextRequest, NextResponse } from 'next/server';

import { recordKillAttempt } from '@/lib/game/payloadGameService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameCode, murdererCode, victimCode } = body ?? {};

    if (!gameCode || !murdererCode || !victimCode) {
      return NextResponse.json(
        { success: false, error: 'gameCode, murdererCode, and victimCode are required' },
        { status: 400 },
      );
    }

    const result = await recordKillAttempt({ gameCode, murdererCode, victimCode });

    const status = result.success ? 200 : 400;
    return NextResponse.json({ success: result.success, ...result }, { status });
  } catch (error) {
    console.error('Error recording kill attempt', error);
    const message = error instanceof Error ? error.message : 'Kill attempt failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
