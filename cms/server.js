import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Game Manager setup (simplified for server.js)
  let gameState = {
    isActive: false,
    players: new Map(),
    killEvents: [],
    settings: {
      cooldownMinutes: 10,
      maxPlayers: 20,
      murdererCount: 2,
      theme: 'christmas',
    },
  }

  // Helper functions
  function generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  function generatePlayerId(name) {
    return `player_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`
  }

  function assignRoles(players) {
    const shuffled = [...players].sort(() => Math.random() - 0.5)
    const murdererCount = Math.min(gameState.settings.murdererCount, Math.floor(players.length / 3))

    for (let i = 0; i < murdererCount; i++) {
      shuffled[i].role = 'murderer'
    }
  }

  function getGameStats() {
    const players = Array.from(gameState.players.values())
    const alivePlayers = players.filter((p) => p.isAlive)
    const deadPlayers = players.filter((p) => !p.isAlive)
    const murderers = alivePlayers.filter((p) => p.role === 'murderer')
    const civilians = alivePlayers.filter((p) => p.role === 'civilian')

    return {
      totalPlayers: players.length,
      alivePlayers: alivePlayers.length,
      deadPlayers: deadPlayers.length,
      murderers: murderers.length,
      civilians: civilians.length,
      totalKills: gameState.killEvents.filter((e) => e.successful).length,
      gameStarted: gameState.isActive || !!gameState.endTime,
      gameEnded: !!gameState.endTime,
    }
  }

  function serializeGameState() {
    return {
      id: gameState.id || generateGameId(),
      isActive: gameState.isActive,
      players: Array.from(gameState.players.values()),
      startTime: gameState.startTime,
      endTime: gameState.endTime,
      killEvents: gameState.killEvents,
      settings: gameState.settings,
      stats: getGameStats(),
    }
  }

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)

    // Handle player joining game
    socket.on('join-game', (playerId) => {
      try {
        console.log(`Player ${playerId} joining game`)

        const player = gameState.players.get(playerId)
        if (player) {
          player.socketId = socket.id
        }

        socket.join('game-room')

        const serializedState = serializeGameState()
        socket.emit('game-state', serializedState)

        if (player) {
          socket.to('game-room').emit('player-joined', player)
        }
      } catch (error) {
        console.error('Error joining game:', error)
        socket.emit('error', error.message || 'Failed to join game')
      }
    })

    // Handle host joining
    socket.on('host-join', () => {
      try {
        socket.join('game-room')
        socket.join('host-room')

        const serializedState = serializeGameState()
        socket.emit('game-state', serializedState)
      } catch (error) {
        console.error('Error host joining:', error)
        socket.emit('error', 'Failed to join as host')
      }
    })

    // Handle kill attempts
    socket.on('kill-attempt', (data) => {
      try {
        console.log(`Kill attempt: ${data.murderer} -> ${data.victim}`)

        const murderer = gameState.players.get(data.murderer)
        const victim = gameState.players.get(data.victim)

        if (!murderer || !victim) {
          socket.emit('kill-attempt-result', {
            success: false,
            message: 'Player not found',
          })
          return
        }

        if (murderer.role !== 'murderer') {
          socket.emit('kill-attempt-result', {
            success: false,
            message: 'Only murderers can kill',
          })
          return
        }

        if (!victim.isAlive) {
          socket.emit('kill-attempt-result', {
            success: false,
            message: `${victim.name} is already dead!`,
          })
          return
        }

        // Check cooldown
        const cooldownMs = gameState.settings.cooldownMinutes * 60 * 1000
        const timeSinceLastKill = Date.now() - (murderer.lastKillTime || 0)

        if (murderer.lastKillTime && timeSinceLastKill < cooldownMs) {
          const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastKill) / 1000)
          const remainingMinutes = Math.ceil(remainingSeconds / 60)

          socket.emit('kill-attempt-result', {
            success: false,
            message: `Wait ${remainingMinutes}m ${remainingSeconds % 60}s before killing again`,
            cooldownRemaining: remainingSeconds,
          })
          return
        }

        // Execute kill
        victim.isAlive = false
        murderer.lastKillTime = Date.now()

        const killEvent = {
          id: `kill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          murderer: murderer.name,
          victim: victim.name,
          timestamp: Date.now(),
          successful: true,
          message: `💀 ${victim.name} was killed by ${murderer.name}!`,
        }

        gameState.killEvents.push(killEvent)

        socket.emit('kill-attempt-result', {
          success: true,
          message: `You successfully killed ${victim.name}!`,
          killEvent,
        })

        // Broadcast to all players
        io.to('game-room').emit('player-killed', killEvent)

        const serializedState = serializeGameState()
        io.to('game-room').emit('game-state', serializedState)

        // Check game end conditions
        const stats = getGameStats()
        if (stats.murderers >= stats.civilians && stats.civilians > 0) {
          gameState.isActive = false
          gameState.endTime = Date.now()
          io.to('game-room').emit('game-ended', 'murderers')
        } else if (stats.murderers === 0) {
          gameState.isActive = false
          gameState.endTime = Date.now()
          io.to('game-room').emit('game-ended', 'civilians')
        }
      } catch (error) {
        console.error('Error processing kill attempt:', error)
        socket.emit('kill-attempt-result', {
          success: false,
          message: error.message || 'Kill attempt failed',
        })
      }
    })

    // Handle game state requests
    socket.on('request-game-state', () => {
      try {
        const serializedState = serializeGameState()
        socket.emit('game-state', serializedState)
      } catch (error) {
        console.error('Error getting game state:', error)
        socket.emit('error', 'Failed to get game state')
      }
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)

      // Remove socket ID from players
      Array.from(gameState.players.values()).forEach((player) => {
        if (player.socketId === socket.id) {
          player.socketId = undefined
        }
      })
    })
  })

  // Store gameState and helper functions for API routes
  httpServer.gameState = gameState
  httpServer.generatePlayerId = generatePlayerId
  httpServer.assignRoles = assignRoles
  httpServer.serializeGameState = serializeGameState
  httpServer.io = io

  // Make server available globally for API routes
  globalThis.server = httpServer

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Socket.IO server is running`)
  })
})
