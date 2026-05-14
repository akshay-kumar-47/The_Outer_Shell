const { Client } = require('pg');

const appDbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'clothing_store',
  password: 'root',
  port: 5432,
};

const jackets = [
  { name: 'Apex Waterproof Shell', desc: 'Lightweight waterproof shell for harsh conditions.', price: 3499, img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80' },
  { name: 'Urban Explorer Parka', desc: 'Insulated parka designed for city winters.', price: 2899, img: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=800&q=80' },
  { name: 'Classic Leather Moto', desc: 'Genuine leather motorcycle jacket with metallic zips.', price: 3200, img: 'https://images.unsplash.com/photo-1559551409-dadc959f76b8?auto=format&fit=crop&w=800&q=80' },
  { name: 'Midnight Bomber', desc: 'Sleek black bomber jacket for a modern look.', price: 2150, img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80' },
  { name: 'Alpine Puffer', desc: 'Quilted puffer jacket providing maximum warmth.', price: 2999, img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80' },
  { name: 'Vintage Denim Trucker', desc: 'Rugged blue denim jacket with durable stitching.', price: 2400, img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80' },
  { name: 'Utility Field Jacket', desc: 'Versatile field jacket with multiple pockets.', price: 2650, img: 'https://images.unsplash.com/photo-1578587018452-892bace018d3?auto=format&fit=crop&w=800&q=80' },
  { name: 'Minimalist Windbreaker', desc: 'Packable windbreaker for unpredictable weather.', price: 2100, img: 'https://images.unsplash.com/photo-1520975954732-57dd22299614?auto=format&fit=crop&w=800&q=80' },
  { name: 'Arctic Expedition Coat', desc: 'Heavy-duty coat built for extreme cold.', price: 3500, img: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80' },
  { name: 'Suede Western Jacket', desc: 'Premium suede jacket with a western cut.', price: 3100, img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80' },
  { name: 'Techwear Anorak', desc: 'Futuristic anorak with water-resistant fabric.', price: 2750, img: 'https://images.unsplash.com/photo-1509539662397-116cb90542f1?auto=format&fit=crop&w=800&q=80' },
  { name: 'Classic Trench Coat', desc: 'Timeless trench coat for rainy days.', price: 3300, img: 'https://images.unsplash.com/photo-1512413914441-35b91b8f4116?auto=format&fit=crop&w=800&q=80' },
  { name: 'Fleece-Lined Flannel', desc: 'Cozy flannel jacket perfect for autumn.', price: 2000, img: 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0eb?auto=format&fit=crop&w=800&q=80' },
  { name: 'Varsity Letterman', desc: 'Retro college varsity jacket with leather sleeves.', price: 2550, img: 'https://images.unsplash.com/photo-1548883354-94cb0ce5c4f4?auto=format&fit=crop&w=800&q=80' },
  { name: 'Quilted Riding Jacket', desc: 'Slim-fit quilted jacket ideal for transitional weather.', price: 2800, img: 'https://images.unsplash.com/photo-1521223830114-411a0bb32115?auto=format&fit=crop&w=800&q=80' }
];

async function reseedDb() {
  const client = new Client(appDbConfig);
  try {
    await client.connect();
    
    console.log('Clearing old data...');
    // Clear order_items first due to foreign key
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM products');
    
    console.log('Inserting 15 new jackets...');
    for (const j of jackets) {
      await client.query(
        'INSERT INTO products (name, description, price, image_url, category) VALUES ($1, $2, $3, $4, $5)',
        [j.name, j.desc, j.price, j.img, 'Jackets']
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
