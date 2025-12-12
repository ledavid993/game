# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Murderer Hobo is a real-time party game where players are assigned secret roles (murderers or civilians). Hosts run a TV dashboard while players join from their phones. Built with Next.js 15, Payload CMS 3, and Socket.IO for real-time communication.

## Commands

All commands run from the `cms/` directory:

```bash
pnpm install          # Install dependencies
pnpm dev              # Start custom server with Socket.IO (primary dev mode)
pnpm dev:next         # Start Next.js dev server only (no Socket.IO)
pnpm build            # Build for production
pnpm lint             # Run ESLint
pnpm test             # Run all tests (unit + e2e)
pnpm test:int         # Run unit tests only (Vitest)
pnpm test:e2e         # Run e2e tests only (Playwright)
pnpm generate:types   # Regenerate Payload TypeScript types
```

## Architecture

### Custom Server (`cms/server.js`)
The entry point runs a custom Node.js server that:
- Wraps Next.js with an HTTP server
- Initializes Socket.IO for real-time WebSocket connections
- Manages in-memory game state (players, kill events, settings)
- Exposes `globalThis.server` for API routes to access game state and Socket.IO

### Route Groups
- `src/app/(frontend)/` - Public game routes (landing, host dashboard, player views)
- `src/app/(payload)/` - Payload CMS admin panel and API routes

### Key Game Routes
- `/` - Landing page
- `/game/host` - Host dashboard (TV display)
- `/game/play/[playerId]` - Individual player interface (mobile)
- `/game/status` - Game status display

### Game Components (`src/app/components/game/`)
- `HostDashboard.tsx` - Main host UI with player management, live feed, game controls
- `PlayerView.tsx` - Mobile player interface showing role and actions
- `RoleActions.tsx` - Murderer kill actions with cooldown handling
- `LiveFeed.tsx` - Real-time kill feed display
- `useSocket.ts` - Socket.IO hook for real-time communication

### Game Logic (`src/lib/game/`)
- `payloadGameService.ts` - Core game service integrating with Payload CMS
- `abilities/` - Player ability implementations
- `usernameGenerator.ts` - Random username generation

### Payload Collections (`src/collections/`)
- `Games.ts` - Game sessions
- `GamePlayers.ts` - Players within games
- `PlayerRegistry.ts` - Persistent player registry
- `Votes.ts`, `PlayerVotes.ts` - Voting system

### State Management
- Zustand for client-side state
- Socket.IO events for real-time sync between clients
- Server-side game state in `server.js` (in-memory)

## Environment Variables

Required in `cms/.env`:
- `DATABASE_URI` - PostgreSQL connection string
- `PAYLOAD_SECRET` - Session encryption secret
- `NEXT_PUBLIC_BASE_URL` - Public URL (default: http://localhost:3000)
- `NEXT_PUBLIC_SOCKET_URL` - WebSocket URL (usually same as BASE_URL)

## Testing

- Unit tests: `tests/int/*.int.spec.ts` (Vitest with jsdom)
- E2E tests: `tests/e2e/*.e2e.spec.ts` (Playwright)
- Playwright starts dev server automatically via `webServer` config
