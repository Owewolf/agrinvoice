import express from 'express';
const router = express.Router();

export default function createClientsRouter(pool) {
  // Create new client
  router.post('/', async (req, res) => {
    const { name, email, phone, vatNumber, address, notes } = req.body;
    const createdBy = req.user?.id; // Assuming middleware sets req.user

    try {
      const result = await pool.query(
        'INSERT INTO clients (id, name, email, phone, vat_number, address, notes, created_by) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [name, email, phone, vatNumber, JSON.stringify(address), notes, createdBy]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all clients
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM clients ORDER BY name');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get client by ID
  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'Client not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update client
  router.put('/:id', async (req, res) => {
    const { name, email, phone, vatNumber, address, notes } = req.body;
    try {
      const result = await pool.query(
        'UPDATE clients SET name = $1, email = $2, phone = $3, vat_number = $4, address = $5, notes = $6 WHERE id = $7 RETURNING *',
        [name, email, phone, vatNumber, JSON.stringify(address), notes, req.params.id]
      );
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'Client not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete client
  router.delete('/:id', async (req, res) => {
    try {
      const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING id', [req.params.id]);
      if (result.rows.length > 0) {
        res.json({ message: 'Client deleted successfully' });
      } else {
        res.status(404).json({ error: 'Client not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
