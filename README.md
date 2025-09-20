# Murderer Hobo: Christmas Murder Mystery Game

A festive real-time party game built with Next.js, Payload CMS, and Socket.IO. Hosts run the TV dashboard while players join from their phones to discover (or hide) the murderers among them.

## Repository Layout

- `cms/` – Next.js + Payload CMS application, custom Socket.IO server, and Docker assets

All commands in this guide assume you are inside the `cms/` directory unless otherwise noted.

## Prerequisites

- **Node.js** 18.20+ or 20.9+
- **pnpm** 9 or 10 (enable via `corepack enable`)
- **Docker** and **Docker Compose** (optional, for containerised setup)
- A PostgreSQL or MongoDB instance (PostgreSQL is provided via `docker-compose.yml`)

## Environment Variables

Copy the example file and adjust it for your setup:

```bash
cp cms/.env.example cms/.env
```

Set the following keys in `cms/.env` (and optionally `.env.local` for framework defaults):

- `DATABASE_URI` – connection string for your database. Use `postgres://postgres:postgres@localhost:5432/murderhobo` when following the Docker instructions below.
- `PAYLOAD_SECRET` – random string used by Payload for session encryption.
- `NEXT_PUBLIC_BASE_URL` – base URL exposed to the browser (defaults to `http://localhost:3000`).
- `NEXT_PUBLIC_SOCKET_URL` – public WebSocket endpoint; usually matches `BASE_URL` in local development.

> Tip: when running via Docker Compose the `.env` file is loaded automatically. For local Node runs, create `.env.local` for frontend-specific values if you need to override defaults.

## Local Development (without Docker)

1. Install dependencies
   ```bash
   cd cms
   pnpm install
   ```
2. Ensure your database is running and that `DATABASE_URI` points to it (e.g. a local Postgres instance).
3. Start the custom game server
   ```bash
   pnpm dev
   ```
4. Open `http://localhost:3000` for the landing page and admin sign-in.

### Useful scripts

- `pnpm build` – compile the Next.js application for production
- `pnpm start` – serve the production build
- `pnpm lint` – run ESLint checks
- `pnpm test` – execute unit (Vitest) and E2E (Playwright) suites

## Docker Compose Setup

The repository includes `cms/docker-compose.yml` which launches the Next.js + Payload app alongside a PostgreSQL container.

```bash
cd cms
docker compose up --build
```

The first run will install dependencies inside the container and start the app at `http://localhost:3000`. Use `docker compose down` to stop the stack, and add `-d` to run it in the background.

### Customising Docker

- Update `DATABASE_URI` in `.env` if you rename the database, user, or password.
- Uncomment the MongoDB service in `docker-compose.yml` if you prefer Mongo; update `DATABASE_URI` to use the `mongo` hostname provided in the compose file comments.

## Playing the Game

All routes live under `http://<host>:3000/`.

### Host Flow (TV / Laptop)

1. Visit `/game/host` from a large screen.
2. Enter player names (comma separated) and start the session.
3. Share the generated links with each participant.
4. Monitor eliminations and session status in real time; reset to start a new round.

### Player Flow (Phone)

1. Open the personal link provided by the host (e.g. `/game/play/<playerId>`).
2. Review your secret role (murderer or civilian) and stay discreet.
3. Murderers trigger eliminations from their devices. Respect the 10-minute cooldown shown in the UI.
4. Civilians work together offline to deduce the killers; stay alive to win.

### Networking Tips

- When sharing across devices, ensure everyone is on the same Wi-Fi network.
- Hosts can broadcast over HDMI or Chromecast to make the dashboard visible to all players.
- To expose the game outside your LAN, tunnel the port (e.g. with `ngrok`) and set `NEXT_PUBLIC_BASE_URL`/`SOCKET_URL` to the public URL.

## Production Deployment

- Run `pnpm build` followed by `pnpm start` or deploy via Payload Cloud.
- Configure persistent object storage for uploads (S3-compatible) and a managed PostgreSQL/Mongo instance.
- Set `NODE_ENV=production` and provide strong secrets before going live.

Have fun and happy holidays!
