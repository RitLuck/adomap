// database.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false } // needed on Render
});

// Create table if it doesn't exist
(async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS fans (
        id SERIAL PRIMARY KEY,
        name TEXT,
        city TEXT NOT NULL,
        country TEXT NOT NULL,
        message TEXT,
        hide_exact BOOLEAN DEFAULT TRUE,
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } finally {
    client.release();
  }
})();

module.exports = pool;
