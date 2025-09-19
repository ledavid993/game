import { randomBytes } from 'crypto'

import configPromise from '@payload-config'
import type { Payload } from 'payload'
import { getPayload } from 'payload'

import type { Game, GamePlayer } from '@/payload-types'
import type { Server as IOServer } from 'socket.io'
import type {
  CooldownStatus,
  KillAttemptResult,
  KillEvent,
  Player,
  SerializedGameState,
} from '@/app/lib/game/types'
import { SUPPORT_ROLES, type PlayerRole, isMurdererRole } from '@/app/lib/game/roles'

const SINGLE_GAME_CODE = 'GAME_MAIN'

interface PlayerInput {
  id: string
  name: string
  username: string
  phone?: string
  email?: string
}

interface StartGameOptions {
  players?: PlayerInput[]
  playerNames?: string[]
  settings?: Partial<Game['settings']>
  hostDisplayName?: string
  baseUrl: string
}

interface GameStateOptions {
  gameCode?: string | null
  playerCode?: string | null
}

interface KillAttemptOptions {
  gameCode: string
  murdererCode: string
  victimCode: string
}

interface ResetGameOptions {
  gameCode: string
}

interface SerializedStateWithPlayer extends SerializedGameState {
  playerData?: {
    player: Player
    cooldownStatus: CooldownStatus
    availableTargets: Player[]
  } | null
}

let payloadClient: Payload | null = null

export async function getPayloadClient(): Promise<Payload> {
  if (!payloadClient) {
    payloadClient = await getPayload({ config: await configPromise })
  }
  return payloadClient
}

export function generateCode(prefix: string, length = 6): string {
  const bytes = randomBytes(length)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let token = ''
  for (let i = 0; i < length; i++) {
    token += alphabet[bytes[i] % alphabet.length]
  }
  return `${prefix}_${token}`
}

type PlayerSeed = {
  game: Game['id']
  displayName: string
  username: string
  playerCode: string
  phone?: string
  email?: string
  role?: PlayerRole
  isAlive?: boolean
  joinedAt?: string
  kills?: number
}

function assignRoles<T extends PlayerSeed>(players: T[], murdererCount: number): T[] {
  if (murdererCount > players.length) {
    throw new Error(
      `Cannot assign ${murdererCount} murderers to ${players.length} players. Murderer count must be less than or equal to player count.`,
    )
  }

  if (murdererCount < 1) {
    throw new Error('Must have at least 1 murderer')
  }

  const shuffled = [...players]
  shuffled.sort(() => Math.random() - 0.5)

  let supportIndex = 0

  for (let i = 0; i < shuffled.length; i++) {
    if (i < murdererCount) {
      shuffled[i].role = 'murderer'
    } else if (supportIndex < SUPPORT_ROLES.length) {
      shuffled[i].role = SUPPORT_ROLES[supportIndex]
      supportIndex += 1
    } else {
      shuffled[i].role = 'civilian'
    }
  }

  return shuffled
}

function toPlayer(doc: GamePlayer): Player {
  const joinedAt = doc.joinedAt ? new Date(doc.joinedAt).getTime() : Date.now()

  // Extract player name from the related PlayerRegistry
  const playerName =
    typeof doc.player === 'object' && doc.player ? doc.player.displayName : doc.playerCode // fallback to playerCode if no name available

  return {
    id: doc.playerCode,
    name: playerName,
    role: doc.role ?? 'civilian',
    isAlive: doc.isAlive ?? true,
    lastKillTime: doc.lastKillAt ? new Date(doc.lastKillAt).getTime() : undefined,
    socketId: doc.socketId ?? undefined,
    deviceType: doc.deviceType && doc.deviceType !== 'unknown' ? doc.deviceType : undefined,
    joinedAt,
    cardRevealsRemaining: doc.cardRevealsRemaining ?? 3,
    isCardRevealed: doc.isCardRevealed ?? false,
  }
}

function serializeKillEvents(game: Game | null): KillEvent[] {
  if (!game?.killEvents || !Array.isArray(game.killEvents)) {
    return []
  }

  return game.killEvents
    .map((event) => ({
      id: event?.eventId ?? generateCode('event', 8),
      murderer: event?.murdererName ?? 'Unknown',
      victim: event?.victimName ?? 'Unknown',
      timestamp: event?.timestamp ? new Date(event.timestamp).getTime() : Date.now(),
      successful: event?.successful ?? true,
      message: event?.message ?? 'Elimination recorded',
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
}

function calculateStats(game: Game, players: GamePlayer[]): SerializedGameState['stats'] {
  const alivePlayers = players.filter((p) => p.isAlive)
  const deadPlayers = players.filter((p) => !p.isAlive)
  const murderers = alivePlayers.filter((p) => isMurdererRole((p.role ?? 'civilian') as PlayerRole))
  const allies = alivePlayers.filter((p) => !isMurdererRole((p.role ?? 'civilian') as PlayerRole))
  const killEvents = serializeKillEvents(game)

  const startedAt = game.startedAt ? new Date(game.startedAt).getTime() : undefined
  const endedAt = game.endedAt ? new Date(game.endedAt).getTime() : undefined

  const duration = startedAt ? (endedAt ?? Date.now()) - startedAt : undefined

  return {
    totalPlayers: players.length,
    alivePlayers: alivePlayers.length,
    deadPlayers: deadPlayers.length,
    murderers: murderers.length,
    civilians: allies.length,
    totalKills: killEvents.filter((event) => event.successful).length,
    gameStarted: !!startedAt,
    gameEnded: !!endedAt || game.status === 'completed',
    duration,
  }
}

function calculateCooldownStatus(player: GamePlayer, game: Game): CooldownStatus {
  const now = Date.now()
  const cooldownMillis = Math.max(game.settings?.cooldownMinutes ?? 10, 0) * 60 * 1000
  const cooldownExpiresAt = player.cooldownExpiresAt
    ? new Date(player.cooldownExpiresAt).getTime()
    : player.lastKillAt
      ? new Date(player.lastKillAt).getTime() + cooldownMillis
      : 0
  const remainingMillis = Math.max(0, cooldownExpiresAt - now)
  const remainingSeconds = Math.ceil(remainingMillis / 1000)

  return {
    canKill: remainingMillis <= 0,
    remainingSeconds,
    remainingMinutes: Math.ceil(remainingSeconds / 60),
    lastKillTime: player.lastKillAt ? new Date(player.lastKillAt).getTime() : undefined,
  }
}

async function serializeGameStateInternal(
  game: Game,
  players: GamePlayer[],
): Promise<SerializedGameState> {
  const startTime = game.startedAt ? new Date(game.startedAt).getTime() : undefined
  const endTime = game.endedAt ? new Date(game.endedAt).getTime() : undefined

  const serializedPlayers = players.map(toPlayer)

  return {
    id: game.code,
    isActive: game.status === 'active',
    players: serializedPlayers,
    startTime,
    endTime,
    killEvents: serializeKillEvents(game),
    settings: {
      cooldownMinutes: game.settings?.cooldownMinutes ?? 10,
      maxPlayers: game.settings?.maxPlayers ?? 20,
      murdererCount: game.settings?.murdererCount ?? 1,
      theme: (game.settings?.theme as 'christmas' | 'halloween' | 'classic') ?? 'christmas',
    },
    stats: calculateStats(game, players),
  }
}

async function getGameAndPlayers(
  payload: Payload,
  game: Game,
): Promise<{ game: Game; players: GamePlayer[] }> {
  const playersResult = (await payload.find({
    collection: 'game-players',
    where: {
      game: {
        equals: game.id,
      },
    },
    depth: 1, // Load player relationship data
    limit: 100,
  })) as unknown as { docs: GamePlayer[] }

  return {
    game,
    players: playersResult.docs,
  }
}

export async function createGameSession({
  players,
  playerNames,
  settings,
  hostDisplayName,
  baseUrl,
}: StartGameOptions) {
  const payload = await getPayloadClient()

  let finalPlayers: PlayerInput[]

  // Handle new player structure
  if (players && Array.isArray(players)) {
    if (players.length < 1) {
      throw new Error('At least 1 player is required to begin')
    }

    // Validate player data
    const invalidPlayers = players.filter((p) => !p.name.trim() || !p.username.trim())
    if (invalidPlayers.length > 0) {
      throw new Error('All players must have a name and username')
    }

    finalPlayers = players
  }
  // Handle legacy playerNames structure
  else if (playerNames && Array.isArray(playerNames)) {
    if (playerNames.length < 1) {
      throw new Error('At least 1 player is required to begin')
    }

    const trimmedNames = playerNames.map((name) => name.trim()).filter((name) => name.length > 0)

    if (trimmedNames.length < 1) {
      throw new Error('At least 1 valid player name is required')
    }

    // Convert legacy format to new structure
    finalPlayers = trimmedNames.map((name, index) => ({
      id: `legacy-${index}`,
      name,
      username: `Player${index + 1}`,
    }))
  } else {
    throw new Error('Either players or playerNames must be provided')
  }

  const now = new Date().toISOString()
  const murdererCount = settings?.murdererCount ?? 1

  const existingGames = (await payload.find({
    collection: 'games',
    depth: 0,
    limit: 1,
    sort: '-updatedAt',
  })) as unknown as { docs: Game[] }

  let game: Game

  if (existingGames.docs.length > 0) {
    const current = existingGames.docs[0] as Game

    await payload.update({
      collection: 'games',
      id: String(current.id),
      data: {
        code: SINGLE_GAME_CODE,
        status: 'active',
        hostDisplayName: hostDisplayName ?? 'Host',
        startedAt: now,
        endedAt: null,
        settings: {
          cooldownMinutes: settings?.cooldownMinutes ?? 10,
          maxPlayers: settings?.maxPlayers ?? 20,
          murdererCount,
          theme: settings?.theme ?? 'christmas',
        },
        killEvents: [],
      },
    })

    const existingPlayers = (await payload.find({
      collection: 'game-players',
      where: {
        game: {
          equals: current.id,
        },
      },
      depth: 0,
      limit: 1000,
    })) as unknown as { docs: GamePlayer[] }

    await Promise.all(
      existingPlayers.docs.map(async (player) => {
        return payload.delete({
          collection: 'game-players',
          id: String(player.id),
        })
      }),
    )

    game = (await payload.findByID({
      collection: 'games',
      id: String(current.id),
      depth: 0,
    })) as unknown as Game
  } else {
    game = (await payload.create({
      collection: 'games',
      data: {
        code: SINGLE_GAME_CODE,
        status: 'active',
        hostDisplayName: hostDisplayName ?? 'Host',
        startedAt: now,
        settings: {
          cooldownMinutes: settings?.cooldownMinutes ?? 10,
          maxPlayers: settings?.maxPlayers ?? 20,
          murdererCount,
          theme: settings?.theme ?? 'christmas',
        },
        killEvents: [],
      },
    })) as unknown as Game
  }

  const playersToCreate: PlayerSeed[] = finalPlayers.map((player) => ({
    game: game.id,
    displayName: player.name,
    username: player.username,
    playerCode: generateCode('PLAYER', 8),
    phone: player.phone || undefined,
    email: player.email || undefined,
    role: 'civilian',
    isAlive: true,
    joinedAt: now,
    kills: 0,
  }))

  const assignedPlayers = assignRoles(playersToCreate, murdererCount)

  const createdPlayers: GamePlayer[] = []

  for (const player of assignedPlayers) {
    try {
      const created = (await payload.create({
        collection: 'game-players',
        data: {
          ...player,
        },
      })) as unknown as GamePlayer
      createdPlayers.push(created)
    } catch (error) {
      console.error('Error creating player:', error)
      throw error
    }
  }

  const serializedState = await serializeGameStateInternal(game, createdPlayers)

  const playerLinks: Record<string, string> = {}
  createdPlayers.forEach((player) => {
    playerLinks[player.playerCode] = `${baseUrl.replace(/\/$/, '')}/game/play/${player.playerCode}`
  })

  return {
    game: serializedState,
    playerLinks,
  }
}

export async function getSerializedGameState({
  gameCode,
  playerCode,
}: GameStateOptions): Promise<SerializedStateWithPlayer> {
  const payload = await getPayloadClient()

  if (!gameCode && !playerCode) {
    throw new Error('Either gameCode or playerCode must be provided')
  }

  let game: Game | null = null
  let playerDoc: GamePlayer | null = null

  if (playerCode) {
    const playerResult = (await payload.find({
      collection: 'game-players',
      where: {
        playerCode: {
          equals: playerCode,
        },
      },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: GamePlayer[] }

    if (playerResult.docs.length === 0) {
      throw new Error('Player not found')
    }

    playerDoc = playerResult.docs[0] as GamePlayer
    game = (await payload.findByID({
      collection: 'games',
      id: String(playerDoc.game),
      depth: 0,
    })) as unknown as Game
  }

  if (!game && gameCode) {
    const gameResult = (await payload.find({
      collection: 'games',
      where: {
        code: {
          equals: gameCode,
        },
      },
      depth: 0,
      limit: 1,
    })) as unknown as { docs: Game[] }

    if (gameResult.docs.length === 0) {
      throw new Error('Game not found')
    }

    game = gameResult.docs[0] as Game
  }

  if (!game) {
    const fallback = (await payload.find({
      collection: 'games',
      where: {
        status: {
          equals: 'active',
        },
      },
      sort: '-updatedAt',
      depth: 0,
      limit: 1,
    })) as unknown as { docs: Game[] }

    if (fallback.docs.length === 0) {
      throw new Error('Unable to resolve game state')
    }

    game = fallback.docs[0] as Game
  }

  const { players } = await getGameAndPlayers(await getPayloadClient(), game)
  const serialized = await serializeGameStateInternal(game, players)

  if (playerDoc) {
    const player = players.find((p) => p.playerCode === playerDoc?.playerCode)
    if (!player) {
      throw new Error('Player not found in game')
    }

    const cooldownStatus = calculateCooldownStatus(player, game)
    const availableTargets = players
      .filter((p) => p.playerCode !== player.playerCode && p.isAlive)
      .map(toPlayer)

    return {
      ...serialized,
      playerData: {
        player: toPlayer(player),
        cooldownStatus,
        availableTargets,
      },
    }
  }

  return serialized
}

function getSocketServer(): IOServer | undefined {
  return (globalThis as unknown as { server?: { io?: IOServer } }).server?.io
}

function emitToGame(gameCode: string, event: string, payload: unknown) {
  const io = getSocketServer()
  if (!io) return
  io.to(`game-${gameCode}`).emit(event, payload)
}

export async function resetGame({ gameCode }: ResetGameOptions) {
  const payload = await getPayloadClient()

  const gameResult = (await payload.find({
    collection: 'games',
    where: {
      code: {
        equals: gameCode,
      },
    },
    depth: 0,
    limit: 1,
  })) as unknown as { docs: Game[] }

  if (gameResult.docs.length === 0) {
    throw new Error('Game not found')
  }

  const game = gameResult.docs[0] as Game

  // First: Remove all game-player associations (but keep players in registry)
  const existingPlayers = (await payload.find({
    collection: 'game-players',
    where: {
      game: {
        equals: game.id,
      },
    },
    depth: 0,
    limit: 1000,
  })) as unknown as { docs: GamePlayer[] }

  await Promise.all(
    existingPlayers.docs.map(async (player) => {
      return payload.delete({
        collection: 'game-players',
        id: String(player.id),
      })
    }),
  )

  // Second: Delete the entire game session
  await payload.delete({
    collection: 'games',
    id: String(game.id),
  })

  emitToGame(gameCode, 'game-ended', 'reset')
}

export async function recordKillAttempt({
  gameCode,
  murdererCode,
  victimCode,
}: KillAttemptOptions): Promise<KillAttemptResult> {
  const payload = await getPayloadClient()

  const gameResult = (await payload.find({
    collection: 'games',
    where: {
      code: {
        equals: gameCode,
      },
    },
    depth: 0,
    limit: 1,
  })) as unknown as { docs: Game[] }

  if (gameResult.docs.length === 0) {
    throw new Error('Game not found')
  }

  const game = gameResult.docs[0] as Game

  if (game.status !== 'active') {
    return {
      success: false,
      message: 'Game is not active',
    }
  }

  const playersResult = (await payload.find({
    collection: 'game-players',
    where: {
      playerCode: {
        in: [murdererCode, victimCode],
      },
    },
    depth: 0,
    limit: 2,
  })) as unknown as { docs: GamePlayer[] }

  if (playersResult.docs.length < 2) {
    return {
      success: false,
      message: 'Player not found',
    }
  }

  const murdererDoc = playersResult.docs.find((p) => p.playerCode === murdererCode) as GamePlayer
  const victimDoc = playersResult.docs.find((p) => p.playerCode === victimCode) as GamePlayer

  if (!murdererDoc || !victimDoc) {
    return {
      success: false,
      message: 'Player not found',
    }
  }

  if (murdererDoc.role !== 'murderer') {
    return {
      success: false,
      message: 'Only murderers can kill',
    }
  }

  if (!murdererDoc.isAlive) {
    return {
      success: false,
      message: 'You are dead and cannot act',
    }
  }

  if (!victimDoc.isAlive) {
    return {
      success: false,
      message: `${victimDoc.displayName} is already dead`,
    }
  }

  if (murdererDoc.playerCode === victimDoc.playerCode) {
    return {
      success: false,
      message: 'You cannot kill yourself',
    }
  }

  const cooldownStatus = calculateCooldownStatus(murdererDoc, game)
  if (!cooldownStatus.canKill) {
    return {
      success: false,
      message: `Wait ${cooldownStatus.remainingMinutes}m ${cooldownStatus.remainingSeconds % 60}s before killing again`,
      cooldownRemaining: cooldownStatus.remainingSeconds,
    }
  }

  const now = new Date().toISOString()

  await payload.update({
    collection: 'game-players',
    id: String(victimDoc.id),
    data: {
      isAlive: false,
    },
  })

  await payload.update({
    collection: 'game-players',
    id: String(murdererDoc.id),
    data: {
      lastKillAt: now,
      cooldownExpiresAt: new Date(
        Date.now() + (game.settings?.cooldownMinutes ?? 10) * 60 * 1000,
      ).toISOString(),
      kills: (murdererDoc.kills ?? 0) + 1,
    },
  })

  const updatedVictim = (await payload.findByID({
    collection: 'game-players',
    id: String(victimDoc.id),
    depth: 0,
  })) as unknown as GamePlayer

  const updatedMurderer = (await payload.findByID({
    collection: 'game-players',
    id: String(murdererDoc.id),
    depth: 0,
  })) as unknown as GamePlayer

  const killEventId = generateCode('KILL', 8)
  const killMessage = `💀 ${victimDoc.displayName} was eliminated by ${murdererDoc.displayName}`

  await payload.update({
    collection: 'games',
    id: String(game.id),
    data: {
      killEvents: [
        ...(game.killEvents ?? []),
        {
          eventId: killEventId,
          murdererName: updatedMurderer.displayName,
          victimName: updatedVictim.displayName,
          timestamp: now,
          successful: true,
          message: killMessage,
        },
      ],
    },
  })

  const updatedGame = (await payload.findByID({
    collection: 'games',
    id: String(game.id),
    depth: 0,
  })) as unknown as Game

  const { players } = await getGameAndPlayers(payload, updatedGame)
  const serializedState = await serializeGameStateInternal(updatedGame, players)

  const aliveMurderers = players.filter(
    (p) => isMurdererRole((p.role ?? 'civilian') as PlayerRole) && p.isAlive,
  )
  const aliveSupport = players.filter(
    (p) => !isMurdererRole((p.role ?? 'civilian') as PlayerRole) && p.isAlive,
  )

  let winner: 'murderers' | 'civilians' | null = null

  if (aliveMurderers.length === 0) {
    winner = 'civilians'
  } else if (aliveMurderers.length >= aliveSupport.length && aliveSupport.length > 0) {
    winner = 'murderers'
  }

  emitToGame(gameCode, 'player-killed', {
    id: killEventId,
    murderer: updatedMurderer.displayName,
    victim: updatedVictim.displayName,
    timestamp: Date.now(),
    successful: true,
    message: killMessage,
  })

  emitToGame(gameCode, 'game-state', serializedState)

  if (winner) {
    await payload.update({
      collection: 'games',
      id: String(game.id),
      data: {
        status: 'completed',
        endedAt: new Date().toISOString(),
      },
    })

    emitToGame(gameCode, 'game-ended', winner)
  }

  return {
    success: true,
    message: `You successfully killed ${updatedVictim.displayName}!`,
    killEvent: {
      id: killEventId,
      murderer: updatedMurderer.displayName,
      victim: updatedVictim.displayName,
      message: killMessage,
      successful: true,
      timestamp: Date.now(),
    },
  }
}

export async function updateHostSocket(gameCode: string, socketId: string) {
  const payload = await getPayloadClient()
  const gameResult = (await payload.find({
    collection: 'games',
    where: {
      code: {
        equals: gameCode,
      },
    },
    depth: 0,
    limit: 1,
  })) as unknown as { docs: Game[] }

  if (gameResult.docs.length === 0) {
    return
  }

  const game = gameResult.docs[0] as Game

  await payload.update({
    collection: 'games',
    id: String(game.id),
    data: {
      hostSocketId: socketId,
    },
  })
}

export async function updatePlayerSocket(playerCode: string, socketId: string) {
  const payload = await getPayloadClient()
  const playerResult = (await payload.find({
    collection: 'game-players',
    where: {
      playerCode: {
        equals: playerCode,
      },
    },
    depth: 0,
    limit: 1,
  })) as unknown as { docs: GamePlayer[] }

  if (playerResult.docs.length === 0) {
    return
  }

  const player = playerResult.docs[0] as GamePlayer

  await payload.update({
    collection: 'game-players',
    id: String(player.id),
    data: {
      socketId,
    },
  })
}

export async function clearSocket(socketId: string) {
  const payload = await getPayloadClient()
  const players = (await payload.find({
    collection: 'game-players',
    where: {
      socketId: {
        equals: socketId,
      },
    },
    depth: 0,
    limit: 20,
  })) as unknown as { docs: GamePlayer[] }

  await Promise.all(
    players.docs.map((doc) =>
      payload.update({
        collection: 'game-players',
        id: String(doc.id),
        data: { socketId: null },
      }),
    ),
  )
}
