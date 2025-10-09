# Mentat Party

An experimental massively-multiplayer Mentat project featuring interactive games and AI chat.

## Features

- 🐍 **Snake Game** - Single-player and multiplayer snake with AI enemies
- 💬 **AI Chat** - OpenWebUI integration with Pollinations API
- 🎮 **Interactive Games** - More games coming soon!
- 🤖 **Mentat Integration** - AI-powered development and features

## Quick Start

### Running the Main App

```bash
npm install
npm run dev
```

### Running OpenWebUI (AI Chat)

```bash
docker-compose up -d
```

Then visit:

- Main App: http://localhost:5173
- Snake Game: http://localhost:5173/snake
- AI Chat: http://localhost:3000

## Getting Started

1. Create a new repository using this template. On the [repository page](https://github.com/AbanteAI/mentat-template-js), click "Use this template" on the top right, then select 'Create a new repository'.

2. On the next screen, choose a name for your project, then click 'Create repository'.

3. Install Mentat on your GitHub account, if you haven't already. See instructions [here](https://mentat.ai/docs).

4. Add the new repository to your Mentat Installation.

a. If you're installing Mentat for the first time, select your new repository on the 'Setup Installation' page.
b. If you've already installed Mentat, go to the [settings page](https://mentat.ai/settings) and click 'Manage Repositories', and select your new repository from the drop-down menu to add it to your installation.

5. If Mentat was installed properly, you should see an open GitHub issue in your new repository called 'MentatBot Setup'. This issue will guide you through advanced configuration.

You're all set! You can begin using Mentat by

- Creating a new issue and tagging '@MentatBot'
- Pushing PRs to your repository and having Mentat review them
- Chatting with Mentat about your project from the [Mentat website](https://mentat.ai)

## OpenWebUI Setup

OpenWebUI provides a chat interface powered by Pollinations AI.

### Configuration

1. Copy `.env.example` to `.env` (optional, defaults work out of the box)
2. Run `docker-compose up -d`
3. Access at http://localhost:3000

### Features

- Free AI chat via Pollinations API
- No API key required
- Multiple model support
- Clean, modern interface

### Customization

Edit `docker-compose.yml` to customize:

- Port (default: 3000)
- UI name and branding
- Authentication settings
- Model providers

## Project Structure

```
├── client/          # React frontend
├── server/          # Express backend
├── snake/           # Snake game
├── .mentat/         # Mentat configuration
└── docker-compose.yml  # OpenWebUI setup
```

## Development

- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code

## Docker Services

- **open-webui** - AI chat interface (port 3000)

To stop services:

```bash
docker-compose down
```

To view logs:

```bash
docker-compose logs -f
```
