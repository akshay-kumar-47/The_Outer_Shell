const { Client } = require('pg');

require('dotenv').config();
const appDbConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      user: 'postgres',
      host: 'localhost',
      database: 'clothing_store',
      password: 'root',
      port: 5432,
    };

const jackets = [
  { name: 'Apex Waterproof Shell', desc: 'Lightweight waterproof shell for harsh conditions.', price: 3499, img: '/images/jacket1.png' },
  { name: 'Urban Explorer Parka', desc: 'Insulated parka designed for city winters.', price: 2899, img: '/images/jacket2.png' },
  { name: 'Classic Leather Moto', desc: 'Genuine leather motorcycle jacket with metallic zips.', price: 3200, img: '/images/jacket3.png' },
  { name: 'Midnight Bomber', desc: 'Sleek black bomber jacket for a modern look.', price: 2150, img: '/images/jacket4.png' },
  { name: 'Vintage Denim Trucker', desc: 'Rugged blue denim jacket with durable stitching.', price: 2400, img: '/images/jacket5.png' },
  { name: 'Utility Field Jacket', desc: 'Versatile field jacket with multiple pockets.', price: 2650, img: '/images/jacket6.png' },
  { name: 'Varsity Letterman', desc: 'Retro college varsity jacket with leather sleeves.', price: 2550, img: '/images/jacket7.png' },
  { name: 'Quilted Riding Jacket', desc: 'Slim-fit quilted jacket ideal for transitional weather.', price: 2800, img: '/images/jacket8.png' }
];

async function reseedDb() {
  const client = new Client(appDbConfig);
  try {
    await client.connect();

    const { rowCount } = await client.query('SELECT * FROM products');
    if (rowCount > 0) {
      console.log('Products already exist, skipping seed.');
      return;
    }

    console.log(`Inserting ${jackets.length} new jackets...`);
    
    for (const item of jackets) {
      await client.query(
        'INSERT INTO products (name, description, price, image_url) VALUES ($1, $2, $3, $4)',
        [item.name, item.desc, item.price, item.img]
      );
    }
    
    console.log('Database re-seeded successfully!');
  } catch (err) {
    console.error('Error reseeding database:', err);
  } finally {
    await client.end();
  }
}

reseedDb();
