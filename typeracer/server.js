import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5175;

console.log('Setting up typeracer server with manual proxy...');

// Manual proxy for API requests
app.use('/api', express.json(), async (req, res) => {
  console.log('Proxying request:', req.method, req.url);
  try {
    const targetUrl = `http://localhost:5000/api${req.url}`;
    console.log('Target URL:', targetUrl);

    // Filter out problematic headers
    const headers = {};
    if (req.headers['content-type']) {
      headers['content-type'] = req.headers['content-type'];
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body:
        req.method !== 'GET' && req.method !== 'HEAD'
          ? JSON.stringify(req.body)
          : undefined,
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
});

// Serve static files
app.use(express.static(__dirname));

// Serve the typeracer game
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Typeracer game running on http://localhost:${PORT}`);
});
