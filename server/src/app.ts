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

const users: User[] = [];
const sharedImages: SharedImage[] = [];

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
