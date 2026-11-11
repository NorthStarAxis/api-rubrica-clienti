require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
pool.query('select now()')
  .then(r => console.log('DB connesso:', r.rows[0].now))
  .catch(e => console.error('DB NON connesso:', e.message));