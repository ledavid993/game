import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { murdererCode, victimCode } = body ?? {};

    if (!murdererCode || !victimCode) {
      return NextResponse.json(
        { success: false, error: 'murdererCode and victimCode are required' },
        { status: 400 },
      );
    }

    // Redirect to the new ability API
    const abilityResponse = await fetch(new URL('/api/v1/game/ability', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerCode: murdererCode,
        abilityName: 'kill',
        targetCode: victimCode,
      }),
    });

    const result = await abilityResponse.json();
    const status = abilityResponse.status;

    return NextResponse.json(result, { status });
  } catch (error) {
    console.error('Error recording kill attempt', error);
    const message = error instanceof Error ? error.message : 'Kill attempt failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
