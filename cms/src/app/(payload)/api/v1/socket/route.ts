import { NextRequest, NextResponse } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { GameManager } from '@/app/lib/game/GameManager'

let io: SocketIOServer | null = null

export async function GET(request: NextRequest) {
  if (!io) {
    // This is a workaround for Next.js App Router
    // In production, you'd want to use a custom server
    const res = NextResponse.next() as any

    if (!res.socket?.server?.io) {
      console.log('Setting up Socket.IO server...')

      const httpServer = res.socket?.server
      if (httpServer) {
        io = new SocketIOServer(httpServer, {
          path: '/api/socket',
          addTrailingSlash: false,
          cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true,
          },
        })

        const gameManager = GameManager.getInstance()

        io.on('connection', (socket) => {
          console.log(`Client connected: ${socket.id}`)

          // Handle player joining game
          socket.on('join-game', (playerId: string) => {
            try {
              console.log(`Player ${playerId} joining game`)
              gameManager.updatePlayerSocket(playerId, socket.id)
              socket.join('game-room')

              const gameState = gameManager.getGameState()
              socket.emit('game-state', gameState)

              const player = gameManager.getPlayerState(playerId)
              if (player) {
                socket.to('game-room').emit('player-joined', player)
              }
            } catch (error) {
              console.error('Error joining game:', error)
              socket.emit('error', error instanceof Error ? error.message : 'Failed to join game')
            }
          })

          // Handle host joining
          socket.on('host-join', () => {
            try {
              console.log('Host joined')
              socket.join('game-room')
              socket.join('host-room')

              const gameState = gameManager.getGameState()
              socket.emit('game-state', gameState)
            } catch (error) {
              console.error('Error host joining:', error)
              socket.emit('error', 'Failed to join as host')
            }
          })

          // Handle kill attempts
          socket.on('kill-attempt', async (data: { murderer: string; victim: string }) => {
            try {
              console.log(`Kill attempt: ${data.murderer} -> ${data.victim}`)

              const result = gameManager.killPlayer(data.murderer, data.victim)
              socket.emit('kill-attempt-result', result)

              if (result.success && result.killEvent) {
                io!.to('game-room').emit('player-killed', result.killEvent)

                const gameState = gameManager.getGameState()
                io!.to('game-room').emit('game-state', gameState)

                if (!gameState.isActive && gameState.endTime) {
                  const winner = gameState.killEvents[
                    gameState.killEvents.length - 1
                  ]?.message.includes('MURDERERS')
                    ? 'murderers'
                    : 'civilians'
                  io!.to('game-room').emit('game-ended', winner)
                }
              }
            } catch (error) {
              console.error('Error processing kill attempt:', error)
              socket.emit('kill-attempt-result', {
                success: false,
                message: error instanceof Error ? error.message : 'Kill attempt failed',
              })
            }
          })

          // Handle game state requests
          socket.on('request-game-state', () => {
            try {
              const gameState = gameManager.getGameState()
              socket.emit('game-state', gameState)
            } catch (error) {
              console.error('Error getting game state:', error)
              socket.emit('error', 'Failed to get game state')
            }
          })

          // Handle disconnection
          socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`)
            gameManager.removePlayerSocket(socket.id)
            socket.leave('game-room')
            socket.leave('host-room')
          })
        })

        res.socket.server.io = io
      }
    } else {
      io = res.socket.server.io
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Socket.IO server initialized',
    socketPath: '/api/socket',
  })
}
