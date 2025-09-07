import express from 'express';
import jwt from 'jsonwebtoken';
const router = express.Router();

export default function createAuthRouter(pool) {
  // Register new user
  router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      // Make all users admins by default
      const userRole = role || 'admin';
      
      const result = await pool.query(
        'INSERT INTO users (id, name, email, password_hash, role) VALUES (gen_random_uuid(), $1, $2, crypt($3, gen_salt(\'bf\')), $4) RETURNING id, name, email, role',
        [name, email, password, userRole]
      );
      
      const user = result.rows[0];
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ user, token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Login user
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query(
        'SELECT id, name, email, role FROM users WHERE email = $1 AND password_hash = crypt($2, password_hash)',
        [email, password]
      );
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        res.json({ user, token });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get user profile
  router.get('/profile', async (req, res) => {
    const userId = req.user?.id; // Assuming middleware sets req.user
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
      const result = await pool.query(
        'SELECT id, name, email, role FROM users WHERE id = $1',
        [userId]
      );
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
