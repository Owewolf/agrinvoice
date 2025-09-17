import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

export const createCostsRouter = (pool) => {
  const router = express.Router();

  // Apply authentication to all routes
  router.use(authenticateToken);

  // Get all product costs
  router.get('/products', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT pc.*, p.name as product_name, p.sku, p.unit as product_unit
        FROM product_costs pc
        LEFT JOIN products p ON pc.product_id = p.id
        WHERE pc.is_active = true
        ORDER BY pc.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching product costs:', error);
      res.status(500).json({ error: 'Failed to fetch product costs' });
    }
  });

  // Create new product cost
  router.post('/products', async (req, res) => {
    const { product_id, cost_name, cost_per_unit, unit, description, is_active } = req.body;
    
    try {
      const result = await pool.query(`
        INSERT INTO product_costs (product_id, cost_name, cost_per_unit, unit, description, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `, [product_id, cost_name, cost_per_unit, unit, description, is_active !== false]);
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating product cost:', error);
      res.status(500).json({ error: 'Failed to create product cost' });
    }
  });

  // Update product cost
  router.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { product_id, cost_name, cost_per_unit, unit, description, is_active } = req.body;
    
    try {
      const result = await pool.query(`
        UPDATE product_costs 
        SET product_id = $1, cost_name = $2, cost_per_unit = $3, 
            unit = $4, description = $5, is_active = $6, updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `, [product_id, cost_name, cost_per_unit, unit, description, is_active !== false, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Product cost not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating product cost:', error);
      res.status(500).json({ error: 'Failed to update product cost' });
    }
  });

  // Delete product cost
  router.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
      const result = await pool.query('DELETE FROM product_costs WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Product cost not found' });
      }
      
      res.json({ message: 'Product cost deleted successfully' });
    } catch (error) {
      console.error('Error deleting product cost:', error);
      res.status(500).json({ error: 'Failed to delete product cost' });
    }
  });

  // Get all overhead costs
  router.get('/overheads', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT * FROM overhead_costs
        WHERE is_active = true
        ORDER BY created_at DESC
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching overhead costs:', error);
      res.status(500).json({ error: 'Failed to fetch overhead costs' });
    }
  });

  // Create new overhead cost
  router.post('/overheads', async (req, res) => {
    const { cost_name, cost_type, cost_value, applies_to, description, is_active } = req.body;
    
    try {
      const result = await pool.query(`
        INSERT INTO overhead_costs (cost_name, cost_type, cost_value, applies_to, description, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `, [cost_name, cost_type, cost_value, applies_to || 'all', description, is_active !== false]);
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating overhead cost:', error);
      res.status(500).json({ error: 'Failed to create overhead cost' });
    }
  });

  // Update overhead cost
  router.put('/overheads/:id', async (req, res) => {
    const { id } = req.params;
    const { cost_name, cost_type, cost_value, applies_to, description, is_active } = req.body;
    
    try {
      const result = await pool.query(`
        UPDATE overhead_costs 
        SET cost_name = $1, cost_type = $2, cost_value = $3, 
            applies_to = $4, description = $5, is_active = $6, updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `, [cost_name, cost_type, cost_value, applies_to || 'all', description, is_active !== false, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Overhead cost not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating overhead cost:', error);
      res.status(500).json({ error: 'Failed to update overhead cost' });
    }
  });

  // Delete overhead cost
  router.delete('/overheads/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
      const result = await pool.query('DELETE FROM overhead_costs WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Overhead cost not found' });
      }
      
      res.json({ message: 'Overhead cost deleted successfully' });
    } catch (error) {
      console.error('Error deleting overhead cost:', error);
      res.status(500).json({ error: 'Failed to delete overhead cost' });
    }
  });

  // Calculate profit analysis for an invoice
  router.post('/calculate', async (req, res) => {
    try {
      const { invoiceId, items = [], revenue } = req.body;
      
      let totalDirectCosts = 0;
      const costDetails = [];

      // Calculate costs for each item in the invoice
      for (const item of items) {
        const { productId, quantity } = item;
        
        // Get product costs
        const productCostsResult = await pool.query(`
          SELECT pc.*, p.name as product_name, p.sku
          FROM product_costs pc
          LEFT JOIN products p ON pc.product_id = p.id
          WHERE pc.product_id = $1 AND pc.is_active = true
        `, [productId]);

        const productCosts = productCostsResult.rows;

        // Calculate costs for this item
        let itemDirectCosts = 0;

        // Product-specific costs
        productCosts.forEach(cost => {
          const costPerUnit = parseFloat(cost.cost_per_unit) || 0;
          const costAmount = costPerUnit * quantity;
          itemDirectCosts += costAmount;
          costDetails.push({
            category: 'Product Cost',
            amount: costAmount,
            description: `${cost.product_name} (${cost.sku}) - ${cost.cost_name}`
          });
        });

        totalDirectCosts += itemDirectCosts;
      }

      // Calculate overhead costs
      const overheadResult = await pool.query(`
        SELECT * FROM overhead_costs WHERE is_active = true
      `);

      let totalOverheadCosts = 0;
      overheadResult.rows.forEach(overhead => {
        let overheadAmount = 0;
        const costValue = parseFloat(overhead.cost_value) || 0;
        
        if (overhead.cost_type === 'fixed_amount') {
          overheadAmount = costValue;
        } else if (overhead.cost_type === 'percentage') {
          // Apply percentage to revenue
          overheadAmount = (revenue * costValue) / 100;
        }
        
        totalOverheadCosts += overheadAmount;
        costDetails.push({
          category: 'Overhead',
          amount: overheadAmount,
          description: overhead.cost_name || overhead.description || 'Overhead cost'
        });
      });

      // Calculate profit
      const netProfit = revenue - totalDirectCosts - totalOverheadCosts;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      res.json({
        revenue,
        directCosts: totalDirectCosts,
        overheadCosts: totalOverheadCosts,
        netProfit,
        profitMargin,
        costDetails
      });

    } catch (error) {
      console.error('Error calculating costs:', error);
      res.status(500).json({ error: 'Failed to calculate costs' });
    }
  });

  return router;
};
