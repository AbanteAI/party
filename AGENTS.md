# Agent Guide for Mentat Party

This document provides essential information for AI agents working on this repository.

## Repository Overview

This is the **Mentat Party** repository - a public experiment where anyone can chat with AI agents and collaboratively build features. The repo contains:

- **Client**: React 19 + TypeScript + Vite (chat interface, snake game, polls, stock ticker)
- **Server**: Express + TypeScript (REST API for messages, polls, leaderboards)
- **Snake Game**: Standalone game with 100+ features (particles, trails, achievements)

## Critical Setup Steps

### 1. Branch Awareness

⚠️ **IMPORTANT**: The `main` branch contains only the template. All features are on the `mentat-1` branch!

```bash
# Always check which branch you're on
git branch

# If on main, switch to mentat-1
git checkout mentat-1
```

### 2. Install Dependencies

```bash
# Install all dependencies (runs for both client and server)
npm install
```

### 3. Build the Client

⚠️ **CRITICAL**: The client MUST be built for port 5000 to work!

```bash
cd client
npm run build
```

This creates the `client/dist` directory that the Express server serves.

### 4. Start Development Servers

```bash
# Option 1: Start both servers (from root)
npm run dev

# Option 2: Start individually
cd server && npm run dev  # Port 5000
cd client && npm run dev  # Port 5173
```

## Port Configuration

- **Port 5173**: Vite dev server (hot reload, development)
- **Port 5000**: Express server (serves built client + API)
- **Port 5174**: Snake game standalone server

**For users to see the app**: They need to access port 5000 (which serves the built client).

## Common Issues

### Issue: "Mentat Template JS" on Port 5000

**Cause**: Client hasn't been built
**Solution**: Run `cd client && npm run build`

### Issue: Blank Page on Port 5173

**Cause**: Port forwarding issues or missing dependencies
**Solution**:

1. Check dependencies: `cd client && npm install`
2. Use port 5000 instead (more reliable)

### Issue: "Module not found" errors

**Cause**: Dependencies not installed or wrong branch
**Solution**:

1. Verify you're on `mentat-1` branch
2. Run `npm install` in root, client, and server directories

## Development Workflow

### Making Changes

1. **Always work on `mentat-1` branch**
2. Make your changes
3. Test locally
4. **Rebuild client if you changed client code**: `cd client && npm run build`
5. Commit and push

### Testing Changes

```bash
# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

## Key Files and Directories

```
.
├── client/               # React frontend
│   ├── src/
│   │   ├── App.tsx      # Main chat interface
│   │   ├── Router.tsx   # Routing (/, /snake)
│   │   └── Snake.tsx    # Snake game component
│   └── dist/            # Built client (MUST exist for port 5000!)
├── server/              # Express backend
│   └── src/
│       ├── app.ts       # Express app setup
│       └── server.ts    # Server entry point
├── snake/               # Standalone snake game
│   └── index.html       # Snake game with 100+ features
└── .mentat/
    ├── setup.sh         # Run on agent start
    ├── format.sh        # Run before commits
    └── preview/         # Auto-start scripts
```

## Features Overview

### Chat Interface (Main App)

- Real-time messaging
- Emoji reactions
- Polls with voting
- Stock ticker (AAPL, TSLA, etc.)
- User profiles with localStorage

### Snake Game

- 100+ feature variables
- Particle effects on food collection
- Snake trails with fade
- Dynamic background (changes with score)
- 10 achievements
- Custom snake skins (rainbow, fire, ocean, forest)
- Animated food
- Game statistics tracking
- Leaderboard integration

## API Endpoints

- `GET /api/messages` - Get all messages
- `POST /api/messages` - Send a message
- `POST /api/messages/:id/react` - Add reaction
- `GET /api/polls` - Get all polls
- `POST /api/polls` - Create a poll
- `POST /api/polls/:id/vote` - Vote on a poll
- `GET /api/stock/:symbol` - Get stock data
- `GET /api/snake/scores` - Get snake leaderboard
- `POST /api/snake/scores` - Submit snake score

## Mentat Scripts

### .mentat/setup.sh

Runs automatically when agents start. Installs dependencies for both client and server.

### .mentat/format.sh

Runs automatically before commits. Formats code with Prettier and fixes linting issues.

### .mentat/preview/ scripts

Auto-start scripts for development servers:

- `0-server.sh` - Starts Express server (port 5000)
- `1-client.sh` - Starts Vite dev server (port 5173)
- `2-snake.sh` - Starts snake game server (port 5174)

## Tips for Agents

1. **Always verify the branch** before making changes
2. **Build the client** after making frontend changes
3. **Test on port 5000** - it's more reliable for users
4. **Check logs** if something isn't working: `../logs/shell/`
5. **Use diagnostic tools**: TypeScript, ESLint, tests
6. **Document your changes** in commit messages
7. **Preserve existing features** when adding new ones

## Getting Help

If you encounter issues:

1. Check this document first
2. Run diagnostics: `npm test`, `npm run lint`
3. Check if dependencies are installed: `npm install`
4. Verify you're on the right branch: `git branch`
5. Check if client is built: `ls client/dist`

## Credits

- Snake game features by @mcgdj (GitHub)
- Chat interface and infrastructure by various contributors
- Mentat system by AbanteAI

---

**Remember**: This is a public experiment. Be helpful, be creative, and have fun! 🎉
