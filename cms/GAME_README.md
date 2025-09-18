# 🎄 Christmas Murder Mystery Game 🔪

A thrilling real-time party game perfect for Christmas gatherings! Players are secretly assigned roles as murderers or civilians, with murderers trying to eliminate everyone while staying hidden.

## 🎮 Game Overview

- **Players**: 3-20 people
- **Roles**: 2 murderers, rest are civilians
- **Objective**:
  - **Murderers**: Eliminate civilians without being caught
  - **Civilians**: Survive and identify the murderers
- **Features**: Real-time updates, 10-minute cooldown between kills, mobile-responsive design

## 🚀 Quick Start

### 1. Start the Server
```bash
pnpm install
pnpm run dev
```

The server will start at `http://localhost:3000`

### 2. Host Setup (TV/Computer)
- Navigate to `http://localhost:3000/game/host`
- Enter player names (comma-separated)
- Click "Start Game"
- Share the generated player links with participants

### 3. Players Join (Mobile/Phone)
- Each player opens their unique link on their phone
- Players will see their assigned role (murderer or civilian)
- Game begins immediately!

## 📱 How to Play

### For the Host
1. **Setup**: Enter all player names and start the game
2. **Monitor**: Watch the live feed on your TV/computer screen
3. **Observe**: See real-time kill notifications and player status
4. **Control**: Reset or start new games as needed

### For Murderers 🔪
1. **Secret Role**: You're one of 2 murderers - keep it secret!
2. **Eliminate**: Select targets from your phone and kill them
3. **Cooldown**: Wait 10 minutes between each kill
4. **Win Condition**: Eliminate enough civilians to equal your numbers

### For Civilians 🧑‍🎄
1. **Survive**: Stay alive and watch for suspicious behavior
2. **Observe**: Pay attention to who disappears and when
3. **Deduce**: Try to figure out who the murderers are
4. **Win Condition**: Survive until all murderers are identified

## 🎯 Game Features

### Real-Time Gameplay
- **Live Feed**: Instant notifications when players are eliminated
- **WebSocket**: Real-time updates across all devices
- **Status Tracking**: See who's alive, dead, and online

### Mobile-Optimized
- **Responsive Design**: Perfect for phones, tablets, and TVs
- **Touch Controls**: Large, easy-to-use buttons for mobile
- **Haptic Feedback**: Vibration on kill actions (mobile)

### Themeable Interface
- **Christmas Theme**: Snow effects, festive colors, holiday emojis
- **Halloween Theme**: Bats, spooky colors, scary atmosphere
- **Theme Toggle**: Switch themes instantly during gameplay

### Smart Cooldown System
- **10-Minute Timer**: Prevents spam killing
- **Individual Tracking**: Each murderer has their own cooldown
- **Visual Feedback**: Clear countdown display and error messages

## 🌐 Network Setup

### Local WiFi Play
1. **Host Setup**: Run the server on your laptop/computer
2. **Find IP**: Note your computer's local IP address (e.g., 192.168.1.42)
3. **Share Links**: Players connect to `http://[YOUR-IP]:3000/game/play/[playerId]`
4. **Same Network**: All devices must be on the same WiFi

### Getting Your IP Address
```bash
# Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

## 🎄 Game Rules

### Victory Conditions
- **Murderers Win**: When murderers equal or outnumber civilians
- **Civilians Win**: When all murderers are eliminated/identified

### Restrictions
- Murderers cannot kill themselves
- Cannot kill already dead players
- Must respect the 10-minute cooldown
- Only murderers can perform kill actions

### Game Flow
1. **Setup Phase**: Host enters names, roles are assigned randomly
2. **Active Phase**: Murderers can eliminate targets with cooldown
3. **End Phase**: Game ends when victory condition is met
4. **Reset**: Host can start a new game with the same or different players

## 🛠 Technical Details

### Built With
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Real-time**: Socket.IO for WebSocket connections
- **Animations**: Framer Motion for smooth effects
- **Backend**: Node.js custom server with game logic

### File Structure
```
cms/
├── server.js                          # Custom Socket.IO server
├── src/
│   ├── app/(frontend)/game/
│   │   ├── page.tsx                    # Game landing page
│   │   ├── host/page.tsx               # Host dashboard
│   │   └── play/[playerId]/page.tsx    # Player interface
│   ├── components/game/
│   │   ├── HostDashboard.tsx           # TV display component
│   │   ├── PlayerView.tsx              # Mobile player interface
│   │   ├── LiveFeed.tsx                # Real-time kill feed
│   │   └── ThemeToggle.tsx             # Theme switcher
│   ├── lib/game/
│   │   ├── types.ts                    # Game type definitions
│   │   └── GameManager.ts              # Core game logic
│   └── api/game/                       # REST API endpoints
└── README.md
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_BASE_URL=http://localhost:3000
PORT=3000
```

## 🎮 Game Variations

### Small Groups (3-6 players)
- 1 murderer recommended
- Faster, more intense gameplay
- Higher chance of civilian victory

### Medium Groups (7-12 players)
- 2 murderers (default)
- Balanced gameplay
- Good mix of strategy and chaos

### Large Groups (13-20 players)
- 2-3 murderers depending on size
- Longer games with more complexity
- Multiple strategies possible

## 🔧 Troubleshooting

### Common Issues

**Players can't connect:**
- Check that all devices are on the same WiFi
- Verify the host's IP address is correct
- Make sure firewall isn't blocking port 3000

**Game not updating:**
- Refresh the player's browser
- Check Socket.IO connection status
- Restart the server if needed

**Cooldown not working:**
- Server maintains the timer
- Check console for error messages
- Ensure system clock is correct

### Performance Tips
- Use modern browsers (Chrome, Safari, Firefox)
- Ensure stable WiFi connection
- Close unnecessary browser tabs
- Host on a reliable computer/laptop

## 🎉 Party Tips

### Setup Recommendations
- **TV Display**: Connect laptop to TV for everyone to see the live feed
- **Lighting**: Dim lights for atmosphere
- **Seating**: Arrange so players can't easily see each other's phones
- **Rules**: Explain the game before starting

### Social Elements
- **Acting**: Encourage players to act normally when eliminated
- **Discussion**: Allow (controlled) discussion between rounds
- **Multiple Games**: Play several rounds with different player combinations
- **Prizes**: Consider small prizes for winning teams

### Theme Integration
- **Christmas Party**: Use Christmas music and decorations
- **Halloween Party**: Switch to Halloween theme with spooky atmosphere
- **Costumes**: Encourage themed costumes for immersion

## 📝 Development

### Running in Development
```bash
pnpm install
pnpm run dev          # Starts custom server with Socket.IO
pnpm run dev:next     # Starts regular Next.js dev server
pnpm run build        # Builds for production
```

### Adding New Features
- Game logic: Edit `src/lib/game/GameManager.ts`
- UI components: Add to `src/components/game/`
- API endpoints: Create in `src/app/api/game/`
- Socket events: Modify `server.js`

## 🎯 Future Enhancements

- [ ] Voice chat integration
- [ ] Spectator mode for eliminated players
- [ ] Game replay system
- [ ] Custom role types (detective, medic, etc.)
- [ ] Tournament bracket system
- [ ] Sound effects and background music
- [ ] Player avatars and customization
- [ ] Advanced statistics tracking

---

**Have fun and happy holidays!** 🎄🔪🎉

For technical support or feature requests, check the project repository or create an issue.