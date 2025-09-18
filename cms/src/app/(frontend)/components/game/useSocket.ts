'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

import type {
  KillAttemptResult,
  KillEvent,
  Player,
  SerializedGameState,
  SocketEvents,
} from '@/app/(frontend)/lib/game/types'

type Cleanup = () => void

function resolveSocketUrl(): string | undefined {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return undefined
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [gameState, setGameState] = useState<SerializedGameState | null>(null)

  useEffect(() => {
    const socketUrl = resolveSocketUrl()

    if (!socketUrl) {
      console.warn('Socket connection skipped: no URL configured.')
      return undefined
    }

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })

    socketRef.current = socket

    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)
    const handleGameState = (state: SerializedGameState) => setGameState(state)

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('game-state', handleGameState)
    socket.on('error', (message: string) => console.error('Socket error:', message))

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('game-state', handleGameState)
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const emit = (event: keyof SocketEvents, payload?: unknown) => {
    if (!socketRef.current) return
    socketRef.current.emit(event, payload)
  }

  const joinGame = (playerId: string) => emit('join-game', playerId)
  const joinAsHost = () => emit('host-join')
  const killPlayer = (murderer: string, victim: string) =>
    emit('kill-attempt', { murderer, victim })
  const requestGameState = () => emit('request-game-state')

  const registerListener = <Payload>(
    event: keyof SocketEvents,
    callback: (payload: Payload) => void,
  ): Cleanup => {
    const socket = socketRef.current
    if (!socket) {
      return () => undefined
    }

    socket.on(event, callback as (...args: unknown[]) => void)
    return () => {
      socket.off(event, callback as (...args: unknown[]) => void)
    }
  }

  const onPlayerKilled = (callback: (killEvent: KillEvent) => void) =>
    registerListener('player-killed', callback)
  const onPlayerJoined = (callback: (player: Player) => void) =>
    registerListener('player-joined', callback)
  const onGameStarted = (callback: (state: SerializedGameState) => void) =>
    registerListener('game-started', callback)
  const onGameEnded = (callback: (winner: 'murderers' | 'civilians') => void) =>
    registerListener('game-ended', callback)
  const onKillAttemptResult = (callback: (result: KillAttemptResult) => void) =>
    registerListener('kill-attempt-result', callback)

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
  }
}
