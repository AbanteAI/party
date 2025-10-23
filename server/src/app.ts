import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { existsSync } from 'fs';

export const app = express();
export const PORT = process.env.PORT || 5000;
export const CLIENT_DIST_PATH = path.join(__dirname, '../../client/dist');

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON bodies
app.use(express.static(CLIENT_DIST_PATH)); // Serve static files from client/dist

// In-memory storage (replace with database in production)
interface User {
  username: string;
  password: string; // In production, hash this!
}

interface SharedImage {
  id: string;
  prompt: string;
  creator: string;
  timestamp: number;
  likes: string[]; // usernames who liked
}

interface PollOption {
  id: string;
  text: string;
  votes: string[]; // usernames who voted (or 'anonymous')
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: number;
}

const users: User[] = [];
const sharedImages: SharedImage[] = [];
const polls: Poll[] = [];

// Basic route
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the Mentat API!' });
});

// Auth routes
app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  users.push({ username, password });
  res.json({ success: true, username });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ success: true, username });
});

// Image feed routes
app.get('/api/images', (req: Request, res: Response) => {
  res.json(sharedImages.sort((a, b) => b.timestamp - a.timestamp));
});

app.post('/api/images', (req: Request, res: Response) => {
  const { prompt, creator } = req.body;

  if (!prompt || !creator) {
    return res.status(400).json({ error: 'Prompt and creator required' });
  }

  const image: SharedImage = {
    id: Date.now().toString(),
    prompt,
    creator,
    timestamp: Date.now(),
    likes: [],
  };

  sharedImages.push(image);
  res.json({ success: true, image });
});

app.post('/api/images/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const { username } = req.body;

  const image = sharedImages.find((img) => img.id === id);

  if (!image) {
    return res.status(404).json({ error: 'Image not found' });
  }

  if (image.likes.includes(username)) {
    // Unlike
    image.likes = image.likes.filter((u) => u !== username);
  } else {
    // Like
    image.likes.push(username);
  }

  res.json({ success: true, likes: image.likes.length });
});

// Poll routes
app.get('/api/polls', (req: Request, res: Response) => {
  res.json(polls.sort((a, b) => b.createdAt - a.createdAt));
});

app.post('/api/polls', (req: Request, res: Response) => {
  const { question, options, creator } = req.body;

  if (!question || !options || !creator) {
    return res
      .status(400)
      .json({ error: 'Question, options, and creator required' });
  }

  const poll: Poll = {
    id: Date.now().toString(),
    question,
    options: options.map((text: string, index: number) => ({
      id: `${Date.now()}-${index}`,
      text,
      votes: [],
    })),
    createdBy: creator,
    createdAt: Date.now(),
  };

  polls.push(poll);
  res.json({ success: true, poll });
});

app.post('/api/polls/:id/vote', (req: Request, res: Response) => {
  const { id } = req.params;
  const { optionId, username, anonymous } = req.body;

  const poll = polls.find((p) => p.id === id);

  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  const option = poll.options.find((o) => o.id === optionId);

  if (!option) {
    return res.status(404).json({ error: 'Option not found' });
  }

  // Remove previous vote from this user
  poll.options.forEach((opt) => {
    opt.votes = opt.votes.filter(
      (v) => v !== username && v !== `anonymous-${username}`
    );
  });

  // Add new vote
  const voter = anonymous ? 'anonymous' : username;
  option.votes.push(voter);

  res.json({ success: true, poll });
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
