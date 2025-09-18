import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { GameManager } from './GameManager';
import { SocketEvents } from './types';

let io: SocketIOServer | null = null;

export function initializeSocket(server: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  const gameManager = GameManager.getInstance();

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle player joining game
    socket.on('join-game', (playerId: string) => {
      try {
        console.log(`Player ${playerId} joining game`);

        // Update player socket ID
        gameManager.updatePlayerSocket(playerId, socket.id);

        // Join player to game room
        socket.join('game-room');

        // Send current game state to player
        const gameState = gameManager.getGameState();
        socket.emit('game-state', gameState);

        // Notify others that player joined
        const player = gameManager.getPlayerState(playerId);
        if (player) {
          socket.to('game-room').emit('player-joined', player);
        }

        console.log(`Player ${playerId} joined successfully`);
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('error', error instanceof Error ? error.message : 'Failed to join game');
      }
    });

    // Handle host joining
    socket.on('host-join', () => {
      try {
        console.log('Host joined');
        socket.join('game-room');
        socket.join('host-room');

        // Send current game state
        const gameState = gameManager.getGameState();
        socket.emit('game-state', gameState);
      } catch (error) {
        console.error('Error host joining:', error);
        socket.emit('error', 'Failed to join as host');
      }
    });

    // Handle kill attempts
    socket.on('kill-attempt', async (data: { murderer: string; victim: string }) => {
      try {
        console.log(`Kill attempt: ${data.murderer} -> ${data.victim}`);

        const result = gameManager.killPlayer(data.murderer, data.victim);

        // Send result to the murderer
        socket.emit('kill-attempt-result', result);

        if (result.success && result.killEvent) {
          // Broadcast kill event to all players
          io!.to('game-room').emit('player-killed', result.killEvent);

          // Send updated game state to all players
          const gameState = gameManager.getGameState();
          io!.to('game-room').emit('game-state', gameState);

          // Check if game ended
          if (!gameState.isActive && gameState.endTime) {
            const stats = gameManager.getGameStats();
            const winner = gameState.killEvents[gameState.killEvents.length - 1]?.message.includes('MURDERERS')
              ? 'murderers'
              : 'civilians';
            io!.to('game-room').emit('game-ended', winner);
          }
        }
      } catch (error) {
        console.error('Error processing kill attempt:', error);
        socket.emit('kill-attempt-result', {
          success: false,
          message: error instanceof Error ? error.message : 'Kill attempt failed',
        });
      }
    });

    // Handle game state requests
    socket.on('request-game-state', () => {
      try {
        const gameState = gameManager.getGameState();
        socket.emit('game-state', gameState);
      } catch (error) {
        console.error('Error getting game state:', error);
        socket.emit('error', 'Failed to get game state');
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);

      // Remove player socket association
      gameManager.removePlayerSocket(socket.id);

      // Leave all rooms
      socket.leave('game-room');
      socket.leave('host-room');
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export function broadcastToGame(event: keyof SocketEvents, data: any): void {
  if (io) {
    io.to('game-room').emit(event as any, data);
  }
}

export function broadcastToHost(event: keyof SocketEvents, data: any): void {
  if (io) {
    io.to('host-room').emit(event as any, data);
  }
}

export function emitToPlayer(socketId: string, event: keyof SocketEvents, data: any): void {
  if (io) {
    io.to(socketId).emit(event as any, data);
  }
}