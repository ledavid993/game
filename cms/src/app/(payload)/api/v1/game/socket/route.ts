import { NextRequest, NextResponse } from 'next/server'
import { initializeSocket } from '@/app/(frontend)/lib/game/socket'

export async function GET(request: NextRequest) {
  try {
    // This endpoint is used to ensure Socket.IO is initialized
    // The actual Socket.IO connection happens through the server setup
    return NextResponse.json({
      status: 'Socket.IO server is available',
      endpoint: '/socket.io/',
    })
  } catch (error: any) {
    console.error('Error with Socket.IO:', error)

    return NextResponse.json({ error: 'Socket.IO server error' }, { status: 500 })
  }
}
