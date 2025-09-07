import express from 'express';
const router = express.Router();

export default function createSettingsRouter(pool) {
  // Get settings
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM settings LIMIT 1');
      res.json(result.rows[0] || {});
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update settings
  router.put('/', async (req, res) => {
    const { currency, language, branding, payments } = req.body;
    try {
      // First try to update
      let result = await pool.query(
        'UPDATE settings SET currency = $1, language = $2, branding = $3, payments = $4 RETURNING *',
        [currency, language, JSON.stringify(branding), JSON.stringify(payments)]
      );
      
      // If no rows were updated, create new settings
      if (result.rows.length === 0) {
        result = await pool.query(
          'INSERT INTO settings (currency, language, branding, payments) VALUES ($1, $2, $3, $4) RETURNING *',
          [currency, language, JSON.stringify(branding), JSON.stringify(payments)]
        );
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
