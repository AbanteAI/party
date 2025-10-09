import { Server, Socket } from 'socket.io';

interface Player {
  id: string;
  name: string;
  snake: { x: number; y: number }[];
  direction: { dx: number; dy: number };
  color: string;
  score: number;
  kills: number;
  alive: boolean;
}

interface GameRoom {
  id: string;
  players: Map<string, Player>;
  foods: { x: number; y: number; type: string }[];
  gameLoop: NodeJS.Timeout | null;
  gridSize: number;
  tileCount: number;
}

const rooms = new Map<string, GameRoom>();
const COLORS = [
  '#4CAF50',
  '#2196F3',
  '#FF9800',
  '#E91E63',
  '#9C27B0',
  '#00BCD4',
  '#FFEB3B',
  '#FF5722',
  '#795548',
  '#607D8B',
  '#8BC34A',
  '#FFC107',
  '#673AB7',
  '#3F51B5',
  '#009688',
  '#CDDC39',
  '#FF6F00',
  '#C2185B',
  '#7B1FA2',
  '#0097A7',
];

export function setupMultiplayerGame(io: Server) {
  // Create default room
  const defaultRoom = createRoom('default');
  rooms.set('default', defaultRoom);

  io.on('connection', (socket: Socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('join_game', (playerName: string) => {
      // Join default room (auto-matchmaking)
      const room = rooms.get('default')!;

      // Check if room is full
      if (room.players.size >= 20) {
        socket.emit('room_full');
        return;
      }

      // Create player
      const player: Player = {
        id: socket.id,
        name: playerName || `Player${room.players.size + 1}`,
        snake: [
          {
            x: Math.floor(Math.random() * room.tileCount),
            y: Math.floor(Math.random() * room.tileCount),
          },
        ],
        direction: { dx: 0, dy: 0 },
        color: COLORS[room.players.size % COLORS.length],
        score: 0,
        kills: 0,
        alive: true,
      };

      room.players.set(socket.id, player);
      socket.join('default');

      // Send initial game state
      socket.emit('game_joined', {
        playerId: socket.id,
        player: player,
        gameState: getGameState(room),
      });

      // Broadcast new player to others
      socket.to('default').emit('player_joined', player);

      // Start game loop if not running
      if (!room.gameLoop) {
        startGameLoop(room, io);
      }
    });

    socket.on('player_move', (direction: { dx: number; dy: number }) => {
      const room = rooms.get('default');
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player || !player.alive) return;

      // Prevent 180-degree turns
      if (
        (direction.dx !== 0 && player.direction.dx !== 0) ||
        (direction.dy !== 0 && player.direction.dy !== 0)
      ) {
        return;
      }

      player.direction = direction;
    });

    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      const room = rooms.get('default');
      if (!room) return;

      room.players.delete(socket.id);
      io.to('default').emit('player_left', socket.id);

      // Stop game loop if no players
      if (room.players.size === 0 && room.gameLoop) {
        clearInterval(room.gameLoop);
        room.gameLoop = null;
      }
    });
  });
}

function createRoom(id: string): GameRoom {
  const gridSize = 20;
  const tileCount = 20;

  return {
    id,
    players: new Map(),
    foods: [
      { x: 15, y: 15, type: 'apple' },
      { x: 5, y: 5, type: 'banana' },
    ],
    gameLoop: null,
    gridSize,
    tileCount,
  };
}

function startGameLoop(room: GameRoom, io: Server) {
  room.gameLoop = setInterval(() => {
    updateGame(room, io);
  }, 100); // 100ms = 10 FPS
}

function updateGame(room: GameRoom, io: Server) {
  // Move all players
  room.players.forEach((player) => {
    if (
      !player.alive ||
      (player.direction.dx === 0 && player.direction.dy === 0)
    )
      return;

    const head = player.snake[0];
    const newHead = {
      x: head.x + player.direction.dx,
      y: head.y + player.direction.dy,
    };

    // Check wall collision
    if (
      newHead.x < 0 ||
      newHead.x >= room.tileCount ||
      newHead.y < 0 ||
      newHead.y >= room.tileCount
    ) {
      player.alive = false;
      io.to('default').emit('player_died', {
        playerId: player.id,
        killer: null,
      });
      return;
    }

    // Check self collision
    for (let i = 1; i < player.snake.length; i++) {
      if (newHead.x === player.snake[i].x && newHead.y === player.snake[i].y) {
        player.alive = false;
        io.to('default').emit('player_died', {
          playerId: player.id,
          killer: null,
        });
        return;
      }
    }

    // Check collision with other players
    let killedBy: string | null = null;
    room.players.forEach((otherPlayer) => {
      if (otherPlayer.id === player.id || !otherPlayer.alive) return;

      for (const segment of otherPlayer.snake) {
        if (newHead.x === segment.x && newHead.y === segment.y) {
          player.alive = false;
          killedBy = otherPlayer.id;
          otherPlayer.kills++;
        }
      }
    });

    if (!player.alive) {
      io.to('default').emit('player_died', {
        playerId: player.id,
        killer: killedBy,
      });
      return;
    }

    player.snake.unshift(newHead);

    // Check food collision
    let ateFood = false;
    for (let i = 0; i < room.foods.length; i++) {
      if (newHead.x === room.foods[i].x && newHead.y === room.foods[i].y) {
        player.score++;
        ateFood = true;
        // Respawn food
        room.foods[i] = {
          x: Math.floor(Math.random() * room.tileCount),
          y: Math.floor(Math.random() * room.tileCount),
          type: room.foods[i].type,
        };
        break;
      }
    }

    if (!ateFood) {
      player.snake.pop();
    }
  });

  // Broadcast game state
  io.to('default').emit('game_update', getGameState(room));
}

interface PlayerState {
  id: string;
  name: string;
  snake: { x: number; y: number }[];
  color: string;
  score: number;
  kills: number;
  alive: boolean;
}

function getGameState(room: GameRoom) {
  const players: PlayerState[] = [];
  room.players.forEach((player) => {
    players.push({
      id: player.id,
      name: player.name,
      snake: player.snake,
      color: player.color,
      score: player.score,
      kills: player.kills,
      alive: player.alive,
    });
  });

  return {
    players,
    foods: room.foods,
  };
}
