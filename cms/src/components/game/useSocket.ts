'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SerializedGameState, KillEvent, Player, SocketEvents } from '@/lib/game/types';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<SerializedGameState | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    // Connection handlers
    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    // Game event handlers
    socket.on('game-state', (state: SerializedGameState) => {
      console.log('Game state updated:', state);
      setGameState(state);
    });

    socket.on('error', (error: string) => {
      console.error('Socket error:', error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const joinGame = (playerId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-game', playerId);
    }
  };

  const joinAsHost = () => {
    if (socketRef.current) {
      socketRef.current.emit('host-join');
    }
  };

  const killPlayer = (murderer: string, victim: string) => {
    if (socketRef.current) {
      socketRef.current.emit('kill-attempt', { murderer, victim });
    }
  };

  const requestGameState = () => {
    if (socketRef.current) {
      socketRef.current.emit('request-game-state');
    }
  };

  const onPlayerKilled = (callback: (killEvent: KillEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on('player-killed', callback);
      return () => socketRef.current?.off('player-killed', callback);
    }
    return () => {};
  };

  const onPlayerJoined = (callback: (player: Player) => void) => {
    if (socketRef.current) {
      socketRef.current.on('player-joined', callback);
      return () => socketRef.current?.off('player-joined', callback);
    }
    return () => {};
  };

  const onGameStarted = (callback: (state: SerializedGameState) => void) => {
    if (socketRef.current) {
      socketRef.current.on('game-started', callback);
      return () => socketRef.current?.off('game-started', callback);
    }
    return () => {};
  };

  const onGameEnded = (callback: (winner: 'murderers' | 'civilians') => void) => {
    if (socketRef.current) {
      socketRef.current.on('game-ended', callback);
      return () => socketRef.current?.off('game-ended', callback);
    }
    return () => {};
  };

  const onKillAttemptResult = (callback: (result: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('kill-attempt-result', callback);
      return () => socketRef.current?.off('kill-attempt-result', callback);
    }
    return () => {};
  };

  return {
    isConnected,
    gameState,
    joinGame,
    joinAsHost,
    killPlayer,
    requestGameState,
    onPlayerKilled,
    onPlayerJoined,
    onGameStarted,
    onGameEnded,
    onKillAttemptResult,
  };
}