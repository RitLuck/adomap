// server.js
const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3000;

// Parse JSON body
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// SQLite database
const db = new Database('adofans.db');

// Create table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS fans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    city TEXT,
    country TEXT,
    message TEXT,
    lat REAL,
    lng REAL,
    hide_exact INTEGER
  )
`).run();

// GET /api/fans
app.get('/api/fans', (req, res) => {
  const fans = db.prepare('SELECT * FROM fans ORDER BY id DESC LIMIT 100').all();
  res.json(fans);
});

// POST /api/fans
app.post('/api/fans', (req, res) => {
  const { name, city, country, message, lat, lng, hide_exact } = req.body;

  if ((!lat || !lng) && (!city || !country)) {
    return res.status(400).json({ error: 'Provide a location or city/country' });
  }

  const stmt = db.prepare(`
    INSERT INTO fans (name, city, country, message, lat, lng, hide_exact)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    name || 'Anonymous',
    city || '',
    country || '',
    message || '',
    lat || null,
    lng || null,
    hide_exact ? 1 : 0
  );

  res.json({ ok: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
