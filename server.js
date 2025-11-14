// server.js
const express = require('express');
const pool = require('./database');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Get all fans
app.get('/api/fans', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM fans ORDER BY created_at DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a fan
app.post('/api/fans', async (req, res) => {
  const { name, city, country, message, hide_exact } = req.body;
  if (!city || !country) return res.status(400).json({ error: 'City and country required' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO fans (name, city, country, message, hide_exact) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name || '', city, country, message || '', hide_exact ? true : false]
    );
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
