import express from 'express';
const router = express.Router();

export default function createServicesRouter(pool) {
  // Get all services
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, name, description, unit, created_at, updated_at FROM services ORDER BY name'
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching services:', err);
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  });

  // Get service by ID
  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, name, description, unit, created_at, updated_at FROM services WHERE id = $1',
        [req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error fetching service:', err);
      res.status(500).json({ error: 'Failed to fetch service' });
    }
  });

  // Create new service
  router.post('/', async (req, res) => {
    const { name, description, unit } = req.body;
    
    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Service name is required' });
    }
    
    try {
      const result = await pool.query(
        'INSERT INTO services (name, description, unit) VALUES ($1, $2, $3) RETURNING id, name, description, unit, created_at, updated_at',
        [name.trim().toLowerCase(), description?.trim() || '', unit?.trim() || 'unit']
      );
      
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error creating service:', err);
      if (err.code === '23505') { // Unique violation
        res.status(409).json({ error: 'Service name already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create service' });
      }
    }
  });

  // Update service
  router.put('/:id', async (req, res) => {
    const { name, description, unit } = req.body;
    
    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Service name is required' });
    }
    
    try {
      const result = await pool.query(
        'UPDATE services SET name = $1, description = $2, unit = $3, updated_at = NOW() WHERE id = $4 RETURNING id, name, description, unit, created_at, updated_at',
        [name.trim().toLowerCase(), description?.trim() || '', unit?.trim() || 'unit', req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating service:', err);
      if (err.code === '23505') { // Unique violation
        res.status(409).json({ error: 'Service name already exists' });
      } else {
        res.status(500).json({ error: 'Failed to update service' });
      }
    }
  });

  // Delete service
  router.delete('/:id', async (req, res) => {
    try {
      // Check if service is used by any products
      const productsUsingService = await pool.query(
        'SELECT COUNT(*) as count FROM products WHERE service_id = $1',
        [req.params.id]
      );
      
      if (parseInt(productsUsingService.rows[0].count) > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete service that is used by products',
          productsCount: parseInt(productsUsingService.rows[0].count)
        });
      }
      
      const result = await pool.query(
        'DELETE FROM services WHERE id = $1 RETURNING id',
        [req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      res.json({ message: 'Service deleted successfully', id: result.rows[0].id });
    } catch (err) {
      console.error('Error deleting service:', err);
      res.status(500).json({ error: 'Failed to delete service' });
    }
  });

  return router;
}
