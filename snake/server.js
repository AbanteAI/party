const express = require('express');
const path = require('path');

const app = express();
const PORT = 5174;

// Serve static files
app.use(express.static(__dirname));

// Serve the snake game
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Snake game running on http://localhost:${PORT}`);
});
