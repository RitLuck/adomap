// server.js
const express = require('express');
const pool = require('./database');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Geocode city+country using Nominatim
async function geocodeLocation(city, country) {
  const query = encodeURIComponent(`${city}, ${country}`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'AdoFansMap/1.0' } });
    const data = await res.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (err) {
    console.error('Geocode error:', err);
  }
  return { lat: 20, lng: 0 }; // fallback
}

// GET all fans
app.get('/api/fans', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM fans ORDER BY created_at DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a fan
app.post('/api/fans', async (req, res) => {
  const { name, city, country, message, hide_exact } = req.body;
  if (!city || !country) return res.status(400).json({ error: 'City and country required' });

  const coords = await geocodeLocation(city, country);

  try {
    const { rows } = await pool.query(
      `INSERT INTO fans (name, city, country, message, hide_exact, lat, lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [name || '', city, country, message || '', hide_exact ? true : false, coords.lat, coords.lng]
    );
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
