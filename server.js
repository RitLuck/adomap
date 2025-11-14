// server.js
const express = require('express');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const DB_FILE = path.join(__dirname, 'adofans.db');

// Create DB file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, '');
}

// Open SQLite database
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to SQLite database');
});

// Create table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS fans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    message TEXT,
    hide_exact INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// API: Get all fans
app.get('/api/fans', (req, res) => {
  db.all('SELECT * FROM fans ORDER BY created_at DESC LIMIT 100', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: Add a fan
app.post('/api/fans', (req, res) => {
  const { name, city, country, message, hide_exact } = req.body;

  if (!city || !country) {
    return res.status(400).json({ error: 'City and country are required' });
  }

  db.run(
    `INSERT INTO fans (name, city, country, message, hide_exact) VALUES (?, ?, ?, ?, ?)`,
    [name || '', city, country, message || '', hide_exact ? 1 : 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
