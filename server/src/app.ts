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

// Proxy snake game requests to port 5174
app.use('/snake-game', async (req: Request, res: Response) => {
  try {
    const targetUrl = `http://localhost:5174${req.url}`;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'] || 'text/html',
      },
    });
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Snake proxy error:', error);
    res.status(500).send('Snake game unavailable');
  }
});

app.use(express.static(CLIENT_DIST_PATH)); // Serve static files from client/dist

// Simple request logging
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Message type definition
interface Message {
  id: number;
  username: string;
  message: string;
  timestamp: string;
  reactions: { [emoji: string]: string[] };
}

// Snake score type definition
interface SnakeScore {
  name: string;
  score: number;
  date: string;
}

// Typeracer score type definition
interface TyperacerScore {
  name: string;
  wpm: number;
  accuracy: number;
  date: string;
}

// Poll type definition
interface Poll {
  id: number;
  question: string;
  options: string[];
  votes: { [option: string]: string[] }; // option -> array of usernames
  createdBy: string;
  createdAt: string;
}

// Data file paths - store outside src to avoid dirtying repo
// Go up one level from server directory to project root
const DATA_DIR = path.join(process.cwd(), '../data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const SNAKE_SCORES_FILE = path.join(DATA_DIR, 'snake-scores.json');
const TYPERACER_SCORES_FILE = path.join(DATA_DIR, 'typeracer-scores.json');
const POLLS_FILE = path.join(DATA_DIR, 'polls.json');

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

// Helper functions for snake scores
function readSnakeScores(): SnakeScore[] {
  try {
    const data = readFileSync(SNAKE_SCORES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeSnakeScores(scores: SnakeScore[]): void {
  try {
    writeFileSync(SNAKE_SCORES_FILE, JSON.stringify(scores, null, 2));
  } catch (error) {
    console.error('Error writing snake scores:', error);
    throw error;
  }
}

// Helper functions for typeracer scores
function readTyperacerScores(): TyperacerScore[] {
  try {
    const data = readFileSync(TYPERACER_SCORES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeTyperacerScores(scores: TyperacerScore[]): void {
  try {
    writeFileSync(TYPERACER_SCORES_FILE, JSON.stringify(scores, null, 2));
  } catch (error) {
    console.error('Error writing typeracer scores:', error);
    throw error;
  }
}

// Helper functions for polls
function readPolls(): Poll[] {
  try {
    const data = readFileSync(POLLS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writePolls(polls: Poll[]): void {
  try {
    writeFileSync(POLLS_FILE, JSON.stringify(polls, null, 2));
  } catch (error) {
    console.error('Error writing polls:', error);
    throw error;
  }
}

function getUserHighScore(username: string): number {
  const scores = readSnakeScores();
  const userScores = scores.filter(
    (s) => s.name.toLowerCase() === username.toLowerCase()
  );
  return userScores.length > 0
    ? Math.max(...userScores.map((s) => s.score))
    : 0;
}

// Basic route
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the Mentat API!' });
});

// Get all messages (with snake scores)
app.get('/api/messages', (req: Request, res: Response) => {
  // Prevent caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const messages = readMessages();

  // Add snake high scores to messages
  const messagesWithScores = messages.map((msg) => ({
    ...msg,
    snakeScore: getUserHighScore(msg.username),
  }));

  res.json(messagesWithScores);
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

// Get snake leaderboard
app.get('/api/snake/scores', (req: Request, res: Response) => {
  const scores = readSnakeScores();
  // Sort by score descending and return top 10
  const topScores = scores.sort((a, b) => b.score - a.score).slice(0, 10);
  res.json(topScores);
});

// Post a new snake score
app.post('/api/snake/scores', (req: Request, res: Response) => {
  const { name, score } = req.body;

  const nameSafe = String(name || '').trim();
  const scoreSafe = parseInt(String(score || '0'));

  if (!nameSafe || scoreSafe <= 0) {
    return res.status(400).json({ error: 'Name and valid score are required' });
  }

  try {
    const scores = readSnakeScores();
    const newScore: SnakeScore = {
      name: nameSafe,
      score: scoreSafe,
      date: new Date().toISOString(),
    };

    scores.push(newScore);
    writeSnakeScores(scores);

    res.json(newScore);
  } catch (error) {
    console.error('Error posting snake score:', error);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

// Get typeracer leaderboard
app.get('/api/typeracer/scores', (req: Request, res: Response) => {
  const scores = readTyperacerScores();
  // Sort by WPM descending and return top 10
  const topScores = scores.sort((a, b) => b.wpm - a.wpm).slice(0, 10);
  res.json(topScores);
});

// Post a new typeracer score
app.post('/api/typeracer/scores', (req: Request, res: Response) => {
  const { name, wpm, accuracy } = req.body;

  const nameSafe = String(name || '').trim();
  const wpmSafe = parseInt(String(wpm || '0'));
  const accuracySafe = parseInt(String(accuracy || '0'));

  if (!nameSafe || wpmSafe <= 0 || accuracySafe < 0 || accuracySafe > 100) {
    return res
      .status(400)
      .json({ error: 'Name, valid WPM, and accuracy (0-100) are required' });
  }

  try {
    const scores = readTyperacerScores();
    const newScore: TyperacerScore = {
      name: nameSafe,
      wpm: wpmSafe,
      accuracy: accuracySafe,
      date: new Date().toISOString(),
    };

    scores.push(newScore);
    writeTyperacerScores(scores);

    res.json(newScore);
  } catch (error) {
    console.error('Error posting typeracer score:', error);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

// Get all polls
app.get('/api/polls', (req: Request, res: Response) => {
  const polls = readPolls();
  res.json(polls);
});

// Create a new poll
app.post('/api/polls', (req: Request, res: Response) => {
  const { question, options, username } = req.body;

  const questionSafe = String(question || '').trim();
  const optionsSafe = Array.isArray(options)
    ? options.map((opt) => String(opt).trim()).filter((opt) => opt.length > 0)
    : [];
  const usernameSafe = String(username || '').trim();

  if (!questionSafe || optionsSafe.length < 2 || !usernameSafe) {
    return res.status(400).json({
      error: 'Question, at least 2 options, and username are required',
    });
  }

  try {
    const polls = readPolls();
    const newPoll: Poll = {
      id: polls.length > 0 ? Math.max(...polls.map((p) => p.id)) + 1 : 1,
      question: questionSafe,
      options: optionsSafe,
      votes: {},
      createdBy: usernameSafe,
      createdAt: new Date().toISOString(),
    };

    // Initialize votes object
    optionsSafe.forEach((option) => {
      newPoll.votes[option] = [];
    });

    polls.push(newPoll);
    writePolls(polls);

    res.json(newPoll);
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// Vote on a poll
app.post('/api/polls/:id/vote', (req: Request, res: Response) => {
  const pollId = parseInt(req.params.id);
  const { option, username } = req.body;

  const optionSafe = String(option || '').trim();
  const usernameSafe = String(username || '').trim();

  if (!optionSafe || !usernameSafe) {
    return res.status(400).json({ error: 'Option and username are required' });
  }

  try {
    const polls = readPolls();
    const poll = polls.find((p) => p.id === pollId);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (!poll.votes[optionSafe]) {
      return res.status(400).json({ error: 'Invalid option' });
    }

    // Remove user's previous vote if any
    Object.keys(poll.votes).forEach((opt) => {
      poll.votes[opt] = poll.votes[opt].filter((u) => u !== usernameSafe);
    });

    // Add new vote
    poll.votes[optionSafe].push(usernameSafe);

    writePolls(polls);
    res.json(poll);
  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// Get stock data (TSLA)
app.get('/api/stock/:symbol', async (req: Request, res: Response) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    // Use Yahoo Finance API (free, no key required)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
    const response = await fetch(url);

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: 'Failed to fetch stock data' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
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
