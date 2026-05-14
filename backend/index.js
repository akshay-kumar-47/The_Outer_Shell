const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'super-secret-jwt-key-clothing-store'; // In production, use process.env.JWT_SECRET

app.use(cors());
app.use(express.json());

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// --- AUTH APIs ---
app.post('/api/auth/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const { rows } = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, role',
      [username, passwordHash]
    );

    const user = rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    if (err.code === '23505') { // unique violation
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid username or password' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// --- PUBLIC APIS ---
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM products ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// --- PROTECTED APIS (CART) ---
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT c.id as cart_item_id, c.quantity, p.* 
      FROM cart_items c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = $1
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.post('/api/cart/sync', authenticateToken, async (req, res) => {
  // Sync the entire cart from frontend to backend
  const { cart } = req.body; // array of {product_id, quantity}
  
  try {
    await db.query('BEGIN');
    await db.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    
    for (const item of cart) {
      await db.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [req.user.id, item.id || item.product_id, item.quantity]
      );
    }
    
    await db.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// --- PROTECTED APIS (ORDERS) ---
app.post('/api/orders', authenticateToken, async (req, res) => {
  const { customer_name, address, payment_method, items } = req.body;
  
  if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });
  if (payment_method !== 'COD') return res.status(400).json({ error: 'Only Cash on Delivery (COD) is supported' });

  try {
    await db.query('BEGIN');

    let total_amount = 0;
    const validatedItems = [];

    for (const item of items) {
      const { rows } = await db.query('SELECT price FROM products WHERE id = $1', [item.product_id]);
      if (rows.length === 0) throw new Error(`Product with ID ${item.product_id} not found`);
      
      const price = parseFloat(rows[0].price);
      total_amount += price * item.quantity;
      validatedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: price
      });
    }

    const orderResult = await db.query(
      'INSERT INTO orders (user_id, customer_name, address, total_amount, payment_method) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.user.id, customer_name, address, total_amount, 'COD']
    );
    const order_id = orderResult.rows[0].id;

    for (const item of validatedItems) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
        [order_id, item.product_id, item.quantity, item.price_at_purchase]
      );
    }

    // Clear user's cart in db after checkout
    await db.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    await db.query('COMMIT');
    res.status(201).json({ message: 'Order created successfully', order_id });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Customer order history
app.get('/api/orders/history', authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Admin order view
app.get('/api/orders/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT o.*, u.username as user_account_name 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Admin update order status
app.put('/api/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  try {
    await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Order status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
