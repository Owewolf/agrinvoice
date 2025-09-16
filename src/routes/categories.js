import express from 'express';
const router = express.Router();

export default function createCategoriesRouter(pool) {
  // Get all categories
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, name, description, unit, created_at, updated_at FROM categories ORDER BY name'
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Get category by ID
  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, name, description, unit, created_at, updated_at FROM categories WHERE id = $1',
        [req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error fetching category:', err);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  });

  // Create new category
  router.post('/', async (req, res) => {
    const { name, description, unit } = req.body;
    
    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    try {
      const result = await pool.query(
        'INSERT INTO categories (name, description, unit) VALUES ($1, $2, $3) RETURNING id, name, description, unit, created_at, updated_at',
        [name.trim().toLowerCase(), description?.trim() || '', unit?.trim() || 'unit']
      );
      
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error creating category:', err);
      if (err.code === '23505') { // Unique violation
        res.status(409).json({ error: 'Category name already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create category' });
      }
    }
  });

  // Update category
  router.put('/:id', async (req, res) => {
    const { name, description, unit } = req.body;
    
    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    try {
      const result = await pool.query(
        'UPDATE categories SET name = $1, description = $2, unit = $3, updated_at = NOW() WHERE id = $4 RETURNING id, name, description, unit, created_at, updated_at',
        [name.trim().toLowerCase(), description?.trim() || '', unit?.trim() || 'unit', req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating category:', err);
      if (err.code === '23505') { // Unique violation
        res.status(409).json({ error: 'Category name already exists' });
      } else {
        res.status(500).json({ error: 'Failed to update category' });
      }
    }
  });

  // Delete category
  router.delete('/:id', async (req, res) => {
    try {
      // Check if category is used by any products
      const productsUsingCategory = await pool.query(
        'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
        [req.params.id]
      );
      
      if (parseInt(productsUsingCategory.rows[0].count) > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete category that is used by products',
          productsCount: parseInt(productsUsingCategory.rows[0].count)
        });
      }
      
      const result = await pool.query(
        'DELETE FROM categories WHERE id = $1 RETURNING id',
        [req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category deleted successfully', id: result.rows[0].id });
    } catch (err) {
      console.error('Error deleting category:', err);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  return router;
}
