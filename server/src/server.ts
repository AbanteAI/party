import { createServer } from 'http';
import { Server } from 'socket.io';
import { app, PORT } from './app';
import { setupMultiplayerGame } from './multiplayer';

// Create HTTP server
const httpServer = createServer(app);

// Setup Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Setup multiplayer game logic
setupMultiplayerGame(io);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.io multiplayer enabled`);
});
