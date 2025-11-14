// database.js
const Database = require('better-sqlite3');
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
hide_exact INTEGER DEFAULT 0,
created_at TEXT
)
`).run();


module.exports = db;