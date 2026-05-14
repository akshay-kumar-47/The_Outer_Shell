const { Client } = require('pg');
const bcrypt = require('bcrypt');

const appDbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'clothing_store',
  password: 'root',
  port: 5432,
};

async function migrateDb() {
  const client = new Client(appDbConfig);
  try {
    await client.connect();
    console.log('Dropping existing order tables...');
    await client.query('DROP TABLE IF EXISTS order_items CASCADE');
    await client.query('DROP TABLE IF EXISTS orders CASCADE');
    await client.query('DROP TABLE IF EXISTS cart_items CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');

    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating orders table...');
    await client.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        customer_name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'COD',
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating order_items table...');
    await client.query(`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price_at_purchase NUMERIC(10, 2) NOT NULL
      )
    `);

    console.log('Creating cart_items table...');
    await client.query(`
      CREATE TABLE cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        UNIQUE(user_id, product_id)
      )
    `);

    console.log('Seeding admin user...');
    const saltRounds = 10;
    const adminPasswordHash = await bcrypt.hash('admin@123', saltRounds);
    await client.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
      ['admin', adminPasswordHash, 'admin']
    );

    console.log('Database migration completed successfully!');
  } catch (err) {
    console.error('Error migrating database:', err);
  } finally {
    await client.end();
  }
}

migrateDb();
