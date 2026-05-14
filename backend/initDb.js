const { Client } = require('pg');

const dbName = 'clothing_store';

const initialDbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'postgres', // connect to default db first to create the new one
  password: 'root',
  port: 5432,
};

const appDbConfig = {
  ...initialDbConfig,
  database: dbName,
};

async function initDb() {
  const initialClient = new Client(initialDbConfig);
  try {
    await initialClient.connect();
    // Check if database exists
    const res = await initialClient.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${dbName}'`);
    if (res.rowCount === 0) {
      console.log(`Database ${dbName} not found, creating it...`);
      await initialClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully.`);
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await initialClient.end();
  }

  // Now connect to the new database and create tables
  const appClient = new Client(appDbConfig);
  try {
    await appClient.connect();
    
    console.log('Creating tables...');
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        image_url VARCHAR(1024),
        category VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'COD',
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price_at_purchase NUMERIC(10, 2) NOT NULL
      );
    `);
    console.log('Tables created successfully.');

    // Seed products if empty
    const { rowCount } = await appClient.query('SELECT * FROM products');
    if (rowCount === 0) {
      console.log('Seeding products...');
      await appClient.query(`
        INSERT INTO products (name, description, price, image_url, category) VALUES
        ('Premium White T-Shirt', 'A classic premium cotton white t-shirt. Perfect for any occasion.', 29.99, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80', 'T-Shirts'),
        ('Classic Denim Jacket', 'Vintage blue denim jacket with durable stitching.', 89.99, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80', 'Outerwear'),
        ('Slim Fit Chinos', 'Comfortable stretch black chinos for a smart casual look.', 55.00, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80', 'Pants'),
        ('Summer Floral Dress', 'Lightweight floral print dress for warm summer days.', 65.00, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80', 'Dresses'),
        ('Leather Moto Jacket', 'Genuine leather motorcycle jacket with metallic zips.', 199.99, 'https://images.unsplash.com/photo-1559551409-dadc959f76b8?auto=format&fit=crop&w=800&q=80', 'Outerwear'),
        ('Everyday Sneakers', 'Clean white sneakers that match every outfit.', 75.00, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80', 'Shoes')
      `);
      console.log('Products seeded successfully.');
    } else {
      console.log('Products already exist, skipping seed.');
    }
  } catch (err) {
    console.error('Error creating tables/seeding:', err);
  } finally {
    await appClient.end();
  }
}

initDb();
