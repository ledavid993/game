'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import toast from 'react-hot-toast'

import { Navbar } from './Navbar'
import { LiveFeed } from './LiveFeed'
import { PlayerGrid } from './PlayerGrid'
import { CollapsiblePlayerList } from './CollapsiblePlayerList'
import { AssignedPlayersList } from './AssignedPlayersList'
import { GameSettings, type GameSettingsData } from './GameSettings'
import { LoadingScreen } from './LoadingScreen'
import { useSocket } from './useSocket'
import type { PlayerData } from './PlayerCard'
import type { KillEvent, Player, SerializedGameState, StartGameRequest } from '@/app/lib/game/types'

type PlayerLinkInfo = {
  id: string
  name: string
  username?: string
  link: string
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

interface HostDashboardProps {
  className?: string
}

export function HostDashboard({ className = '' }: HostDashboardProps) {
  const {
    isConnected,
    gameState,
    joinAsHost,
    onPlayerKilled,
    onPlayerJoined,
    onGameStarted,
    onGameEnded,
  } = useSocket()

  const [players, setPlayers] = useState<PlayerData[]>([])
  const [assignedPlayers, setAssignedPlayers] = useState<PlayerData[]>([])
  const [gameSettings, setGameSettings] = useState<GameSettingsData>({
    maxPlayers: 100,
    cooldownMinutes: 10,
    murdererCount: 1,
  })

  // Save settings to database when they change
  const saveGameSettings = useCallback(async (newSettings: GameSettingsData) => {
    try {
      const response = await fetch(`/api/v1/game/status?_t=${Date.now()}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        body: JSON.stringify({ settings: newSettings }),
      })

      const data = await response.json()
      if (!data.success) {
        console.warn('Failed to save game settings:', data.error)
      }
    } catch (error) {
      console.warn('Error saving game settings:', error)
    }
  }, [])

  // Update settings locally and save to database
  const handleGameSettingsChange = useCallback(
    (newSettings: GameSettingsData) => {
      setGameSettings(newSettings)
      saveGameSettings(newSettings)
    },
    [saveGameSettings],
  )
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [appOrigin, setAppOrigin] = useState('')
  const [playerLinkSearch, setPlayerLinkSearch] = useState('')
  const [playerMenuState, setPlayerMenuState] = useState<{
    player: Player
    position: { top: number; left: number }
  } | null>(null)
  const [isPlayerActionPending, setIsPlayerActionPending] = useState(false)
  const [gameCode, setGameCode] = useState<string | null>(null)
  const [currentState, setCurrentState] = useState<SerializedGameState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('Summoning the spirits...')

  useEffect(() => {
    if (typeof window === 'undefined') return
    setAppOrigin(window.location.origin.replace(/\/$/, ''))
  }, [])

  const resolvePlayerIdentity = useCallback(
    (playerId: string, fallbackName: string): { name: string; username?: string } => {
      const assigned = assignedPlayers.find((player) => player.id === playerId)
      if (assigned) {
        return { name: assigned.name, username: assigned.username }
      }

      const registry = players.find((player) => player.id === playerId)
      if (registry) {
        return { name: registry.name, username: registry.username }
      }

      return { name: fallbackName || playerId }
    },
    [assignedPlayers, players],
  )

  const playerLinks = useMemo(() => {
    if (!currentState || !appOrigin) return {}

    const links: Record<string, PlayerLinkInfo> = {}
    currentState.players.forEach((player) => {
      const identity = resolvePlayerIdentity(player.id, player.name)
      links[player.id] = {
        id: player.id,
        name: identity.name,
        username: identity.username,
        link: `${appOrigin}/game/play/${player.id}`,
      }
    })
    return links
  }, [currentState, appOrigin, resolvePlayerIdentity])

  const filteredPlayerLinks = useMemo(() => {
    const entries = Object.values(playerLinks)
    if (!playerLinkSearch.trim()) return entries

    const term = playerLinkSearch.toLowerCase()
    return entries.filter((info) =>
      info.name.toLowerCase().includes(term) ||
      (info.username && info.username.toLowerCase().includes(term)) ||
      info.id.toLowerCase().includes(term)
    )
  }, [playerLinks, playerLinkSearch])

  useEffect(() => {
    if (isConnected) {
      joinAsHost()
    }
  }, [isConnected, joinAsHost])

  useEffect(() => {
    const cleanupKilled = onPlayerKilled((killEvent: KillEvent) => {
      toast.error(`💀 ${killEvent.message}`, {
        duration: 4000,
      })
    })

    const cleanupJoined = onPlayerJoined((player: Player) => {
      toast.success(`👥 ${player.name} joined the manor.`, {
        duration: 3200,
      })
    })

    const cleanupStarted = onGameStarted((state: SerializedGameState) => {
      toast.success('🎭 The performance begins.', {
        duration: 3000,
      })
      setGameCode(state.id)
      setCurrentState(state)
    })

    const cleanupEnded = onGameEnded((winner: 'murderers' | 'civilians') => {
      toast.success(`🎉 ${winner.toUpperCase()} CLAIM VICTORY`, {
        duration: 6000,
      })
    })

    return () => {
      cleanupKilled()
      cleanupJoined()
      cleanupStarted()
      cleanupEnded()
    }
  }, [onPlayerKilled, onPlayerJoined, onGameStarted, onGameEnded])

  // Load game state and players on component mount
  useEffect(() => {
    const fetchGameData = async () => {
      setIsLoading(true)
      setLoadingMessage('Connecting to the manor...')

      try {
        // Fetch game state
        const stateResponse = await fetch(
          `/api/v1/game/state?gameCode=GAME_MAIN&_t=${Date.now()}`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          },
        )

        if (stateResponse.ok) {
          const stateData = await stateResponse.json()
          if (stateData.success && stateData.gameState) {
            const state = stateData.gameState as SerializedGameState
            console.log('Fetched existing state:', state)
            setCurrentState(state)
            setGameCode(state.id)

            // Update game settings from the loaded state
            if (state.settings) {
              setGameSettings({
                maxPlayers: state.settings.maxPlayers,
                cooldownMinutes: state.settings.cooldownMinutes,
                murdererCount: state.settings.murdererCount,
              })
            }
          }
        }

        setLoadingMessage('Gathering the guest registry...')

        // Fetch all players from the registry
        const playersResponse = await fetch(`/api/v1/players?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        })

        if (playersResponse.ok) {
          const playersData = await playersResponse.json()
          if (playersData.success && playersData.players) {
            console.log('Fetched players from registry:', playersData.players)
            setPlayers(playersData.players)
          }
        }

        setLoadingMessage('Reviewing current game assignments...')

        // Fetch assigned players for the current game
        const assignedResponse = await fetch(`/api/v1/game/assigned-players?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        })

        if (assignedResponse.ok) {
          const assignedData = await assignedResponse.json()
          if (assignedData.success && assignedData.players) {
            console.log('Fetched assigned players:', assignedData.players)
            setAssignedPlayers(assignedData.players)
          }
        }

        setLoadingMessage('Preparing the stage...')
        // Small delay to show the final loading message
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.warn('Failed to fetch game data', error)
        setLoadingMessage('Encountered spirits in the manor...')
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } finally {
        setIsLoading(false)
      }
    }

    fetchGameData()
  }, [])

  useEffect(() => {
    if (gameState) {
      setCurrentState(gameState)
      setGameCode(gameState.id)
    }
  }, [gameState])

  const activeState = currentState ?? gameState ?? null

  // Debug logging
  useEffect(() => {
    if (activeState) {
      console.log('Active state updated:', activeState)
      console.log('Active state players:', activeState.players)
    }
  }, [activeState])

  const handleStatusToggle = async () => {
    if (isUpdatingStatus) return

    setIsUpdatingStatus(true)

    try {
      let stateForUpdate: SerializedGameState | null = currentState

      if (!stateForUpdate) {
        const stateResponse = await fetch(
          `/api/v1/game/state?gameCode=GAME_MAIN&_t=${Date.now()}`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          },
        )

        if (stateResponse.ok) {
          const stateData = await stateResponse.json()
          if (stateData.success && stateData.gameState) {
            stateForUpdate = stateData.gameState as SerializedGameState
            setCurrentState(stateForUpdate)
            setGameCode(stateForUpdate.id)
          }
        }
      }

      if (!stateForUpdate) {
        toast.error('Unable to update game state. Try refreshing the manor view.')
        return
      }

      const newStatus = stateForUpdate.isActive ? 'lobby' : 'active'

      const response = await fetch(`/api/v1/game/status?_t=${Date.now()}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(newStatus === 'active' ? 'Game activated!' : 'Game moved to lobby')

        // If we just activated the game, immediately fetch updated data
        if (newStatus === 'active') {
          // Fetch updated game state with assigned roles
          const stateResponse = await fetch(
            `/api/v1/game/state?gameCode=GAME_MAIN&_t=${Date.now()}`,
            {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
              },
            },
          )

          if (stateResponse.ok) {
            const stateData = await stateResponse.json()
            if (stateData.success && stateData.gameState) {
              const state = stateData.gameState as SerializedGameState
              console.log('Fetched updated state after activation:', state)
              setCurrentState(state)
              setGameCode(state.id)
            }
          }

          // Fetch assigned players with updated roles
          const assignedResponse = await fetch(`/api/v1/game/assigned-players?_t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          })

          if (assignedResponse.ok) {
            const assignedData = await assignedResponse.json()
            if (assignedData.success && assignedData.players) {
              console.log('Fetched updated assigned players with roles:', assignedData.players)
              setAssignedPlayers(assignedData.players)
            }
          }
        } else {
          setCurrentState((prev) => (prev ? { ...prev, isActive: false } : prev))
        }
      } else {
        throw new Error(data.error || 'Failed to update game status')
      }
    } catch (error) {
      console.error('Error updating game status:', error)
      const message = error instanceof Error ? error.message : 'Failed to update game status'
      toast.error(message)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleResetGame = async () => {
    try {
      // Use the constant game code instead of dynamic gameCode
      const SINGLE_GAME_CODE = 'GAME_MAIN'

      const response = await fetch(
        `/api/v1/game/state?gameCode=${encodeURIComponent(SINGLE_GAME_CODE)}&_t=${Date.now()}`,
        {
          method: 'DELETE',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        },
      )

      if (response.ok) {
        setAssignedPlayers([])
        setGameCode(null)
        setCurrentState(null)
        toast.success('Game reset - players preserved in registry')
      } else {
        throw new Error('Failed to reset game')
      }
    } catch (error) {
      console.error('Error resetting game:', error)
      const message = error instanceof Error ? error.message : 'Failed to reset game'
      toast.error(message)
    }
  }

  const copyPlayerLink = (playerCode: string) => {
    const info = playerLinks[playerCode]
    if (info) {
      navigator.clipboard.writeText(info.link)
      toast.success(`Invitation copied for ${info.name}!`)
    }
  }

  const handleActivePlayerClick = useCallback((player: Player, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const scrollY = window.scrollY || document.documentElement.scrollTop
    const scrollX = window.scrollX || document.documentElement.scrollLeft
    const menuWidth = 240
    const menuHeight = 180

    let left = rect.left + scrollX
    let top = rect.bottom + scrollY + 8

    if (left + menuWidth > scrollX + window.innerWidth) {
      left = scrollX + window.innerWidth - menuWidth - 16
    }

    if (top + menuHeight > scrollY + window.innerHeight) {
      top = rect.top + scrollY - menuHeight - 16
    }

    setPlayerMenuState({ player, position: { top: Math.max(top, scrollY + 16), left: Math.max(left, scrollX + 16) } })
  }, [])

  useEffect(() => {
    if (!playerMenuState) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPlayerMenuState(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [playerMenuState])

  const recalcStats = useCallback(
    (playersList: SerializedGameState['players'], prevStats: SerializedGameState['stats']) => {
      const alivePlayers = playersList.filter((player) => player.isAlive).length
      const deadPlayers = playersList.length - alivePlayers
      const murdererCount = playersList.filter((player) => player.role === 'murderer').length
      const civilianCount = playersList.filter((player) => player.role === 'civilian').length

      return {
        ...prevStats,
        totalPlayers: playersList.length,
        alivePlayers,
        deadPlayers,
        murderers: murdererCount,
        civilians: civilianCount,
      }
    },
    [],
  )

  const runPlayerAdminAction = useCallback(
    async (player: Player, action: 'change-role' | 'remove' | 'kill', role?: 'murderer' | 'civilian') => {
      setIsPlayerActionPending(true)
      try {
        const response = await fetch('/api/v1/game/player-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerCode: player.id,
            action,
            role,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Action failed')
        }

        setCurrentState((prev) => {
          if (!prev) return prev

          let updatedPlayers = prev.players

          if (action === 'remove') {
            updatedPlayers = prev.players.filter((p) => p.id !== player.id)
          } else if (action === 'kill') {
            updatedPlayers = prev.players.map((p) =>
              p.id === player.id
                ? { ...p, isAlive: false }
                : p,
            )
          } else if (action === 'change-role' && role) {
            updatedPlayers = prev.players.map((p) =>
              p.id === player.id
                ? { ...p, role }
                : p,
            )
          }

          return {
            ...prev,
            players: updatedPlayers,
            stats: recalcStats(updatedPlayers as SerializedGameState['players'], prev.stats),
          }
        })

        if (action === 'remove') {
          setAssignedPlayers((prev) => prev.filter((p) => p.id !== player.id))
        }

        if (action === 'change-role' && role) {
          toast.success(`${player.name} role set to ${role}`)
        } else if (action === 'remove') {
          toast.success(`${player.name} removed from the game`)
        } else if (action === 'kill') {
          toast.success(`${player.name} marked as eliminated`)
        }

        setPlayerMenuState(null)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Action failed'
        toast.error(message)
      } finally {
        setIsPlayerActionPending(false)
      }
    },
    [recalcStats, setAssignedPlayers],
  )

  // Show loading screen while fetching data
  if (isLoading) {
    return <LoadingScreen message={loadingMessage} />
  }

  return (
    <div className={`h-screen w-full flex flex-col  ${className}`}>
      <Navbar />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(177,54,30,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(64,19,31,0.28),transparent_55%),linear-gradient(170deg,rgba(9,11,16,0.95)_0%,rgba(16,19,27,0.92)_40%,rgba(6,7,10,0.98)_100%)]" />
      <div className="absolute inset-0 opacity-10" aria-hidden>
        <div className="h-full w-full bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden pt-14 sm:pt-16 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col h-full ">
          <motion.header
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center mb-4 sm:mb-6 flex-shrink-0"
          >
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <p className="font-body text-[clamp(0.625rem,1.5vw,0.75rem)] uppercase tracking-[0.45em] text-manor-parchment/60">
                The Ballroom Awaits
              </p>
              <h1 className="font-manor text-[clamp(1.25rem,4vw,2.5rem)] uppercase tracking-[0.28em] text-manor-candle">
                Host Control Theatre
              </h1>
            </div>
            <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 font-body text-[clamp(0.75rem,1.5vw,0.875rem)] text-manor-parchment/75">
              <span
                className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}
              >
                <span
                  className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-500'}`}
                />
                {isConnected ? 'Manor link established' : 'Attempting to reach the manor...'}
              </span>
              {activeState?.isActive && (
                <span className="rounded-full border border-[rgba(177,54,30,0.4)] px-2 sm:px-3 py-1 text-manor-candle/90">
                  Game Active · {activeState.stats.alivePlayers} guests breathing
                </span>
              )}
              {!activeState?.isActive && <span>Stage a séance to begin the experience.</span>}
            </div>

            {/* Game Settings Summary in Header */}
            {currentState && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 font-body text-[clamp(0.625rem,1.2vw,0.75rem)] text-manor-parchment/60">
                <span>
                  Max Players: <span className="text-manor-candle">{gameSettings.maxPlayers}</span>
                </span>
                <span>
                  Murderers: <span className="text-manor-candle">{gameSettings.murdererCount}</span>
                </span>
                <span>
                  Cooldown:{' '}
                  <span className="text-manor-candle">{gameSettings.cooldownMinutes}m</span>
                </span>
                <span>
                  Status:{' '}
                  <span
                    className={`text-manor-candle ${currentState?.isActive ? 'text-green-400' : 'text-yellow-400'}`}
                  >
                    {currentState?.isActive ? 'Active' : 'Lobby'}
                  </span>
                </span>
              </div>
            )}
          </motion.header>

          {/* Three-column layout for better organization */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            className="mx-auto w-full max-w-[90rem] mb-6"
          >
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1fr] gap-6 h-[66vh]">
              {/* Left Column - Player Registry */}
              <div className="h-full  scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <div className="space-y-6 p-1">
                  <CollapsiblePlayerList
                    players={players}
                    onPlayersChange={setPlayers}
                    maxPlayers={gameSettings.maxPlayers}
                    disabled={false}
                  />
                </div>
              </div>

              {/* Middle Column - Game Settings & Assigned Players */}
              <div className="h-full scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <div className="space-y-6 p-1">
                  <AssignedPlayersList
                    registryPlayers={players}
                    assignedPlayers={assignedPlayers}
                    onAssignedPlayersChange={setAssignedPlayers}
                    maxPlayers={gameSettings.maxPlayers}
                    disabled={false}
                  />
                </div>
              </div>

              {/* Right Column - Game Status & Stats */}
              <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <div className="space-y-6 p-1">
                  {/* Game Settings - only show when not active */}
                  {!currentState?.isActive && (
                    <GameSettings
                      settings={gameSettings}
                      onSettingsChange={handleGameSettingsChange}
                      playerCount={assignedPlayers.length}
                      disabled={isUpdatingStatus}
                    />
                  )}
                  {/* Game Status Summary */}
                  <div className="manor-card">
                    <h3 className="font-manor text-lg uppercase tracking-[0.25em] text-manor-candle mb-4">
                      Game Status
                    </h3>

                    {/* Status Toggle Button */}
                    <div className="mb-4">
                      <button
                        className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                          currentState?.isActive
                            ? 'bg-manor-wine/80 text-manor-candle border border-manor-wine/50 cursor-not-allowed opacity-80'
                            : assignedPlayers.length === 0 ||
                                gameSettings.murdererCount > assignedPlayers.length
                              ? 'bg-gray-600 text-gray-300 border border-gray-500 cursor-not-allowed opacity-70'
                              : 'bg-green-600 hover:bg-green-700 text-white border border-green-500'
                        } ${isUpdatingStatus ? 'cursor-not-allowed opacity-70' : ''}`}
                        onClick={handleStatusToggle}
                        disabled={
                          isUpdatingStatus ||
                          currentState?.isActive ||
                          assignedPlayers.length === 0 ||
                          gameSettings.murdererCount > assignedPlayers.length
                        }
                      >
                        {isUpdatingStatus ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.div
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            Updating...
                          </span>
                        ) : currentState?.isActive ? (
                          <span className="flex items-center justify-center gap-2">
                            🎭 Performance in Progress
                          </span>
                        ) : assignedPlayers.length === 0 ? (
                          'Assign Players First'
                        ) : gameSettings.murdererCount > assignedPlayers.length ? (
                          `Need ${gameSettings.murdererCount - assignedPlayers.length} More Players`
                        ) : (
                          'Begin the Performance'
                        )}
                      </button>
                      <p className="mt-2 font-body text-xs text-center uppercase tracking-[0.3em] text-manor-parchment/60">
                        {currentState?.isActive
                          ? 'The show has begun - guests are performing their roles'
                          : assignedPlayers.length === 0
                            ? 'Add players to the guest list first'
                            : gameSettings.murdererCount > assignedPlayers.length
                              ? `Need ${gameSettings.murdererCount} total players for ${gameSettings.murdererCount} murderers`
                              : 'Ready to raise the curtain and assign roles'}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="text-manor-parchment/80">Status:</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            currentState?.isActive
                              ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                              : 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
                          }`}
                        >
                          {currentState?.isActive ? 'Active' : 'Lobby'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-manor-parchment/80">Assigned Players:</span>
                        <span className="text-manor-candle font-medium">
                          {assignedPlayers.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-manor-parchment/80">Registry Total:</span>
                        <span className="text-manor-parchment/60 font-medium">
                          {players.length}
                        </span>
                      </div>
                      {currentState?.isActive && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-manor-parchment/80">Alive:</span>
                            <span className="text-green-400 font-medium">
                              {currentState.stats.alivePlayers}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-manor-parchment/80">Departed:</span>
                            <span className="text-red-400 font-medium">
                              {currentState.stats.deadPlayers}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-manor-parchment/80">Murderers:</span>
                            <span className="text-manor-wine font-medium">
                              {currentState.stats.murderers}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {currentState && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <button className="btn-danger w-full" onClick={handleResetGame}>
                          Reset Game
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Live Feed Section - Full width under the three columns */}
          {activeState && (
            <motion.section
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
              transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
              className="mx-auto w-full max-w-[90rem] mb-6"
            >
              <div className="manor-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-manor text-xl uppercase tracking-[0.25em] text-manor-candle">
                    Live Chronicle
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={`w-2 h-2 rounded-full ${activeState.isActive ? 'bg-green-400' : 'bg-gray-500'}`}
                    />
                    <span className="text-manor-parchment/80">
                      {activeState.isActive ? 'Broadcasting' : 'Awaiting Performance'}
                    </span>
                  </div>
                </div>
                <LiveFeed
                  killEvents={activeState?.killEvents || []}
                  onPlayerKilled={() => undefined}
                  className="bg-transparent"
                />
              </div>
            </motion.section>
          )}

          {/* Active Game Player Grid - only when game is active */}
          {activeState?.isActive && activeState.players.length > 0 && (
            <motion.section
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
              transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
              className="mx-auto w-full max-w-[90rem] mb-6"
            >
              <div className="manor-card">
                <div className="mb-4">
                  <h3 className="font-manor text-xl uppercase tracking-[0.25em] text-manor-candle mb-2">
                    Active Players
                  </h3>
                  <p className="font-body text-sm text-manor-parchment/80">
                    Live status of all players in the manor
                  </p>
                </div>
                <PlayerGrid
                  players={activeState.players as SerializedGameState['players']}
                  showRoles={true}
                  onPlayerClick={handleActivePlayerClick}
                />
              </div>
            </motion.section>
          )}

          {/* Player Links Section - only show when game is active and has players */}
          {Object.keys(playerLinks).length > 0 && currentState?.isActive && (
            <motion.section
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
              transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
              className="mx-auto w-full max-w-[90rem] mb-6"
            >
              <div className="manor-card space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h3 className="font-manor text-xl uppercase tracking-[0.25em] text-manor-candle">
                    Player Access Links
                  </h3>
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      value={playerLinkSearch}
                      onChange={(event) => setPlayerLinkSearch(event.target.value)}
                      placeholder="Search by name or username..."
                      className="w-full rounded-lg border border-white/10 bg-manor-shadow/50 px-3 py-2 text-sm text-manor-candle placeholder:text-manor-parchment/40 focus:outline-none focus:ring-2 focus:border-manor-wine/50 focus:ring-manor-wine/30"
                    />
                    {playerLinkSearch && (
                      <button
                        type="button"
                        onClick={() => setPlayerLinkSearch('')}
                        className="absolute right-3 top-2.5 text-manor-parchment/60 hover:text-manor-candle"
                        aria-label="Clear player link search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredPlayerLinks.map((info) => (
                    <div
                      key={info.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-manor text-base uppercase tracking-[0.2em] text-manor-candle font-semibold">
                            {info.name}
                          </p>
                          {info.username && (
                            <p className="font-body text-sm text-manor-candle font-semibold">@{info.username}</p>
                          )}
                          <p className="text-xs text-manor-parchment/60">Code: {info.id}</p>
                        </div>
                        <button
                          className="text-xs text-manor-parchment/70 transition hover:text-manor-candle"
                          onClick={() => copyPlayerLink(info.id)}
                        >
                          Copy
                        </button>
                      </div>
                      <p className="mt-2 break-words font-body text-xs text-manor-parchment/60">
                        {info.link}
                      </p>
                    </div>
                  ))}
                </div>
                {filteredPlayerLinks.length === 0 && (
                  <p className="text-sm text-manor-parchment/60 italic">
                    No players match “{playerLinkSearch}”.
                  </p>
                )}
              </div>
            </motion.section>
          )}

          {playerMenuState && (
            <div
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]"
              onClick={() => {
                if (!isPlayerActionPending) {
                  setPlayerMenuState(null)
                }
              }}
            >
              <div
                className="absolute w-[240px] rounded-xl border border-white/10 bg-[#10121a]/95 shadow-2xl"
                style={{
                  top: playerMenuState.position.top,
                  left: playerMenuState.position.left,
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="font-manor text-sm uppercase tracking-[0.28em] text-manor-candle">
                    {playerMenuState.player.name}
                  </p>
                  <p className="text-xs text-manor-parchment/60 mt-1">
                    {playerMenuState.player.id}
                  </p>
                </div>
                <div className="py-2">
                  {playerMenuState.player.role !== 'murderer' && (
                    <button
                      disabled={isPlayerActionPending}
                      onClick={() => runPlayerAdminAction(playerMenuState.player, 'change-role', 'murderer')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 text-manor-candle disabled:opacity-50"
                    >
                      Set as Murderer
                    </button>
                  )}
                  {playerMenuState.player.role !== 'civilian' && (
                    <button
                      disabled={isPlayerActionPending}
                      onClick={() => runPlayerAdminAction(playerMenuState.player, 'change-role', 'civilian')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 text-manor-candle disabled:opacity-50"
                    >
                      Set as Civilian
                    </button>
                  )}
                  {playerMenuState.player.isAlive && (
                    <button
                      disabled={isPlayerActionPending}
                      onClick={() => runPlayerAdminAction(playerMenuState.player, 'kill')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-900/30 text-red-300 disabled:opacity-50"
                    >
                      Mark as Dead
                    </button>
                  )}
                  <button
                    disabled={isPlayerActionPending}
                    onClick={() => runPlayerAdminAction(playerMenuState.player, 'remove')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-900/30 text-red-400 disabled:opacity-50"
                  >
                    Remove from Game
                  </button>
                </div>
                <div className="border-t border-white/10 px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => !isPlayerActionPending && setPlayerMenuState(null)}
                    className="text-xs uppercase tracking-[0.25em] text-manor-parchment/60 hover:text-manor-candle"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
