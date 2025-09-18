│ │ Christmas Party Murder Game - Complete Implementation Plan (Within CMS) │ │
│ │ │ │
│ │ Overview │ │
│ │ │ │
│ │ Build a fully responsive Christmas murder mystery game inside the existing Payload CMS/Next.js project with TypeScript, Tailwind CSS, and themeable design for both TV │ │
│ │ display and mobile devices. │ │
│ │ │ │
│ │ Project Architecture │ │
│ │ │ │
│ │ cms/ │ │
│ │ ├── src/ │ │
│ │ │ ├── app/ │ │
│ │ │ │ ├── (frontend)/ │ │
│ │ │ │ │ ├── game/ # Murder game routes │ │
│ │ │ │ │ │ ├── layout.tsx # Game layout with theme provider │ │
│ │ │ │ │ │ ├── page.tsx # Landing/join page │ │
│ │ │ │ │ │ ├── host/ │ │
│ │ │ │ │ │ │ └── page.tsx # Host control panel (TV display) │ │
│ │ │ │ │ │ └── play/ │ │
│ │ │ │ │ │ └── [playerId]/ │ │
│ │ │ │ │ │ └── page.tsx # Player interface (mobile) │ │
│ │ │ │ │ └── globals.css # Tailwind + custom theme CSS │ │
│ │ │ │ └── api/ │ │
│ │ │ │ └── game/ # Game API endpoints │ │
│ │ │ │ ├── socket/ │ │
│ │ │ │ │ └── route.ts # WebSocket connection │ │
│ │ │ │ ├── start/ │ │
│ │ │ │ │ └── route.ts # Start game endpoint │ │
│ │ │ │ ├── kill/ │ │
│ │ │ │ │ └── route.ts # Kill action endpoint │ │
│ │ │ │ └── state/ │ │
│ │ │ │ └── route.ts # Get game state │ │
│ │ │ ├── lib/ │ │
│ │ │ │ ├── game/ │ │
│ │ │ │ │ ├── GameManager.ts # Core game logic │ │
│ │ │ │ │ ├── types.ts # Game types/interfaces │ │
│ │ │ │ │ └── socket.ts # Socket.IO server setup │ │
│ │ │ │ └── themes/ │ │
│ │ │ │ ├── christmas.ts # Christmas theme config │ │
│ │ │ │ ├── halloween.ts # Alternative theme │ │
│ │ │ │ └── types.ts # Theme interface │ │
│ │ │ └── components/ │ │
│ │ │ └── game/ │ │
│ │ │ ├── HostDashboard.tsx # TV display component │ │
│ │ │ ├── PlayerView.tsx # Mobile player interface │ │
│ │ │ ├── LiveFeed.tsx # Real-time kill feed │ │
│ │ │ ├── ThemeToggle.tsx # Theme switcher │ │
│ │ │ └── ResponsiveWrapper.tsx # Responsive container │ │
│ │ │ │
│ │ 1. Core Game Components │ │
│ │ │ │
│ │ GameManager.ts - Singleton pattern for game state: │ │
│ │ class GameManager { │ │
│ │ private players: Map<string, Player> │ │
│ │ private gameState: GameState │ │
│ │ private cooldowns: Map<string, number> │ │
│ │ │ │
│ │ assignRoles(playerNames: string[]): void │ │
│ │ killPlayer(murderer: string, victim: string): KillResult │ │
│ │ validateCooldown(murderer: string): CooldownStatus │ │
│ │ broadcastUpdate(): void │ │
│ │ } │ │
│ │ │ │
│ │ Player Types: │ │
│ │ interface Player { │ │
│ │ id: string │ │
│ │ name: string │ │
│ │ role: 'murderer' | 'civilian' │ │
│ │ isAlive: boolean │ │
│ │ lastKillTime?: number │ │
│ │ deviceType?: 'mobile' | 'desktop' | 'tv' │ │
│ │ } │ │
│ │ │ │
│ │ 2. Responsive UI Design │ │
│ │ │ │
│ │ Tailwind Configuration: │ │
│ │ - Install: tailwindcss, @tailwindcss/forms, @tailwindcss/typography │ │
│ │ - Configure breakpoints for mobile/tablet/TV │ │
│ │ - CSS variables for themeable colors │ │
│ │ │ │
│ │ Theme System: │ │
│ │ interface Theme { │ │
│ │ name: string │ │
│ │ colors: { │ │
│ │ primary: string │ │
│ │ secondary: string │ │
│ │ background: string │ │
│ │ murderer: string │ │
│ │ civilian: string │ │
│ │ dead: string │ │
│ │ } │ │
│ │ decorations: { │ │
│ │ backgroundPattern?: string │ │
│ │ animations?: string[] │ │
│ │ } │ │
│ │ } │ │
│ │ │ │
│ │ Responsive Layouts: │ │
│ │ - Mobile (<768px): Single column, touch-optimized │ │
│ │ - Tablet (768-1024px): Two columns │ │
│ │ - TV/Desktop (>1024px): Multi-panel dashboard │ │
│ │ │ │
│ │ 3. Frontend Components │ │
│ │ │ │
│ │ Host Dashboard (TV Display): │ │
│ │ - Full-screen grid layout │ │
│ │ - Live player status grid with avatars │ │
│ │ - Real-time kill feed with animations │ │
│ │ - Game statistics panel │ │
│ │ - QR codes for player join links │ │
│ │ - Large, readable fonts for TV viewing │ │
│ │ │ │
│ │ Player Mobile Interface: │ │
│ │ - Touch-friendly buttons │ │
│ │ - Swipe gestures for target selection │ │
│ │ - Cooldown timer visualization │ │
│ │ - Role reveal animation │ │
│ │ - Vibration feedback on actions │ │
│ │ │ │
│ │ Live Feed Component: │ │
│ │ - WebSocket subscription │ │
│ │ - Animated entry/exit transitions │ │
│ │ - Christmas-themed kill messages │ │
│ │ - Sound effects (optional) │ │
│ │ │ │
│ │ 4. Real-time Communication │ │
│ │ │ │
│ │ Socket.IO Integration: │ │
│ │ // Server setup │ │
│ │ import { Server } from 'socket.io' │ │
│ │ │ │
│ │ io.on('connection', (socket) => { │ │
│ │ socket.on('joinGame', (playerId) => {}) │ │
│ │ socket.on('killAttempt', (data) => {}) │ │
│ │ io.emit('playerKilled', killEvent) │ │
│ │ io.emit('gameUpdate', gameState) │ │
│ │ }) │ │
│ │ │ │
│ │ // Client hooks │ │
│ │ useEffect(() => { │ │
│ │ socket.on('playerKilled', handleKillUpdate) │ │
│ │ socket.on('gameUpdate', handleStateUpdate) │ │
│ │ }, []) │ │
│ │ │ │
│ │ 5. API Routes │ │
│ │ │ │
│ │ POST /api/game/start: │ │
│ │ - Initialize game with player list │ │
│ │ - Assign roles (2 murderers) │ │
│ │ - Return player access tokens │ │
│ │ │ │
│ │ POST /api/game/kill: │ │
│ │ - Validate murderer identity │ │
│ │ - Check cooldown (10 minutes) │ │
│ │ - Update game state │ │
│ │ - Broadcast via WebSocket │ │
│ │ │ │
│ │ GET /api/game/state: │ │
│ │ - Return current game state │ │
│ │ - Filter based on requester role │ │
│ │ │ │
│ │ 6. Theme Implementation │ │
│ │ │ │
│ │ Christmas Theme (Default): │ │
│ │ :root { │ │
│ │ --color-primary: #c41e3a; /_ Christmas red _/ │ │
│ │ --color-secondary: #165b33; /_ Christmas green _/ │ │
│ │ --color-background: #f8f4e6; /_ Snow white _/ │ │
│ │ --color-accent: #ffd700; /_ Gold _/ │ │
│ │ } │ │
│ │ │ │
│ │ /_ Snowfall animation _/ │ │
│ │ @keyframes snowfall { │ │
│ │ from { transform: translateY(-100vh); } │ │
│ │ to { transform: translateY(100vh); } │ │
│ │ } │ │
│ │ │ │
│ │ Theme Toggle Feature: │ │
│ │ - Store preference in localStorage │ │
│ │ - Dynamic CSS variable updates │ │
│ │ - Smooth transitions between themes │ │
│ │ │ │
│ │ 7. Mobile/TV Optimization │ │
│ │ │ │
│ │ TV Display Features: │ │
│ │ - High contrast mode │ │
│ │ - Large text (min 24px) │ │
│ │ - Auto-refresh on connection loss │ │
│ │ - Fullscreen API support │ │
│ │ - Landscape orientation lock │ │
│ │ │ │
│ │ Mobile Features: │ │
│ │ - PWA manifest for app-like experience │ │
│ │ - Offline detection │ │
│ │ - Battery-saving dark mode │ │
│ │ - Haptic feedback │ │
│ │ - Portrait/landscape support │ │
│ │ │ │
│ │ 8. Installation & Setup │ │
│ │ │ │
│ │ Dependencies to add: │ │
│ │ { │ │
│ │ "socket.io": "^4.x", │ │
│ │ "socket.io-client": "^4.x", │ │
│ │ "tailwindcss": "^3.x", │ │
│ │ "@tailwindcss/forms": "^0.5.x", │ │
│ │ "framer-motion": "^11.x", │ │
│ │ "zustand": "^4.x", │ │
│ │ "react-hot-toast": "^2.x" │ │
│ │ } │ │
│ │ │ │
│ │ Environment Variables: │ │
│ │ NEXT_PUBLIC_SOCKET_URL=http://localhost:3000 │ │
│ │ NEXT_PUBLIC_GAME_SECRET=your-secret-key │ │
│ │ │ │
│ │ 9. Running Instructions │ │
│ │ │ │
│ │ 1. Install dependencies: npm install │ │
│ │ 2. Start development: npm run dev │ │
│ │ 3. Access host dashboard: http://[IP]:3000/game/host │ │
│ │ 4. Players join via: http://[IP]:3000/game/play/[playerId] │ │
│ │ 5. Network setup: All devices on same WiFi │ │
│ │ │ │
│ │ 10. Key Features Summary │ │
│ │ │ │
│ │ - ✅ TypeScript throughout │ │
│ │ - ✅ Responsive design (mobile/tablet/TV) │ │
│ │ - ✅ Real-time WebSocket updates │ │
│ │ - ✅ 10-minute murderer cooldown │ │
│ │ - ✅ Themeable design system │ │
│ │ - ✅ Tailwind CSS styling │ │
│ │ - ✅ Local network play │ │
│ │ - ✅ Persistent game state │ │
│ │ - ✅ Christmas theme (switchable) │ │
│ │ - ✅ TV-optimized host display │ │
│ │ - ✅ Mobile-optimized player view │ │
│ │ │ │
│ │ This implementation leverages the existing Next.js/Payload CMS infrastructure while creating a complete, responsive murder mystery game perfect for Christmas parties.
