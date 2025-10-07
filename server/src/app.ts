import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

export const app = express();
export const PORT = process.env.PORT || 5000;
export const CLIENT_DIST_PATH = path.join(__dirname, '../../client/dist');

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON bodies
app.use(express.static(CLIENT_DIST_PATH)); // Serve static files from client/dist

// Message type definition
interface Message {
  id: number;
  username: string;
  message: string;
  timestamp: string;
  reactions: { [emoji: string]: string[] };
}

// Messages file path - store outside src to avoid dirtying repo
// Go up one level from server directory to project root
const DATA_DIR = path.join(process.cwd(), '../data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions for message persistence
function readMessages(): Message[] {
  try {
    const data = readFileSync(MESSAGES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeMessages(messages: Message[]): void {
  try {
    writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error('Error writing messages:', error);
    throw error;
  }
}

// Basic route
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the Mentat API!' });
});

// Get all messages
app.get('/api/messages', (req: Request, res: Response) => {
  const messages = readMessages();
  res.json(messages);
});

// Post a new message
app.post('/api/messages', (req: Request, res: Response) => {
  const { username, message } = req.body;

  const usernameSafe = String(username || '').trim();
  const messageSafe = String(message || '').trim();

  if (!usernameSafe || !messageSafe) {
    return res.status(400).json({ error: 'Username and message are required' });
  }

  try {
    const messages = readMessages();
    const newMessage: Message = {
      id: Date.now(),
      username: usernameSafe,
      message: messageSafe,
      timestamp: new Date().toISOString(),
      reactions: {},
    };

    messages.push(newMessage);
    writeMessages(messages);

    res.json(newMessage);
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Add a reaction to a message
app.post('/api/messages/:id/react', (req: Request, res: Response) => {
  const { id } = req.params;
  const { emoji, username } = req.body;

  const emojiSafe = String(emoji || '').trim();
  const usernameSafe = String(username || '').trim();

  if (!emojiSafe || !usernameSafe) {
    return res.status(400).json({ error: 'Emoji and username are required' });
  }

  try {
    const messages = readMessages();
    const message = messages.find((m) => m.id === parseInt(id));

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (!message.reactions) {
      message.reactions = {};
    }

    if (!message.reactions[emojiSafe]) {
      message.reactions[emojiSafe] = [];
    }

    // Toggle reaction - remove if already exists, add if not
    const userIndex = message.reactions[emojiSafe].indexOf(usernameSafe);
    if (userIndex > -1) {
      message.reactions[emojiSafe].splice(userIndex, 1);
      // Remove emoji key if no users left
      if (message.reactions[emojiSafe].length === 0) {
        delete message.reactions[emojiSafe];
      }
    } else {
      message.reactions[emojiSafe].push(usernameSafe);
    }

    writeMessages(messages);
    res.json(message);
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Serve React app or fallback page
app.get('*', (req: Request, res: Response) => {
  const indexPath = path.join(CLIENT_DIST_PATH, 'index.html');

  // Check if the built client exists
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Serve a simple fallback page when the client hasn't been built
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mentat Template JS</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              line-height: 1.6;
            }
            a { color: #0066cc; }
          </style>
        </head>
        <body>
          <h1>Mentat Template JS</h1>
          <p>Everything is working correctly.</p>
          <p>This route renders the built project from the <code>/dist</code> directory, but there's currently nothing there.</p>
          <p>You can ask Mentat to build the project to see the React app here, or build it yourself with <code>npm run build</code>.</p>
          <p><a href="/api">Go to API endpoint</a></p>
        </body>
      </html>
    `);
  }
});
