const { Pool } = require('pg');

require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      user: 'postgres',
      host: 'localhost',
      database: 'clothing_store',
      password: 'root',
      port: 5432,
    };

const pool = new Pool(poolConfig);

module.exports = {
  query: (text, params) => pool.query(text, params),
};
