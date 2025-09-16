import express from 'express';
const router = express.Router();

export default function createProductsRouter(pool) {
  // Create new product
  router.post('/', async (req, res) => {
    const { name, description, category, pricingType, baseRate, discountThreshold, discountRate, tiers, unit } = req.body;
    console.log('📥 Received product data:', { name, description, category, pricingType, baseRate, discountThreshold, discountRate, tiers, unit });
    
    try {
      // Start a transaction
      await pool.query('BEGIN');
      
      // Insert the product (using service_id instead of category)
      const result = await pool.query(
        'INSERT INTO products (id, name, description, service_id, pricing_type, base_rate, discount_threshold, discount_rate, sku, unit) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [name, description, category, pricingType, baseRate, discountThreshold, discountRate, await generateSku(pool, category, name, pricingType, baseRate, tiers), unit || 'unit']
      );
      
      const product = result.rows[0];
      console.log('✅ Product created:', product.id);
      
      // If this is a tiered product and tiers are provided, insert them
      if (pricingType === 'tiered' && tiers && Array.isArray(tiers) && tiers.length > 0) {
        console.log('🔄 Processing tiers:', tiers);
        for (const tier of tiers) {
          console.log('📝 Inserting tier:', tier);
          await pool.query(
            'INSERT INTO product_tiers (product_id, threshold, rate) VALUES ($1, $2, $3)',
            [product.id, tier.threshold, tier.rate]
          );
        }
        
        // Fetch the tiers to include in the response
        const tiersResult = await pool.query(
          'SELECT id, product_id, threshold, rate, created_at, updated_at FROM product_tiers WHERE product_id = $1 ORDER BY threshold',
          [product.id]
        );
        
        product.tiers = tiersResult.rows;
      }
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      res.json(product);
    } catch (err) {
      // Rollback on error
      await pool.query('ROLLBACK');
      console.error('Error creating product with tiers:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get all products
  router.get('/', async (req, res) => {
    try {
      // Get all products with category information
      const productsResult = await pool.query(`
        SELECT 
          p.*,
          c.name as service_name,
          c.description as service_description,
          c.unit as service_unit
        FROM products p 
        LEFT JOIN services c ON p.service_id = c.id 
        ORDER BY c.name, p.name
      `);
      const products = productsResult.rows;
      
      // Get tiers for all products
      const productIds = products.map(p => p.id);
      if (productIds.length > 0) {
        const tiersResult = await pool.query(
          'SELECT * FROM product_tiers WHERE product_id = ANY($1) ORDER BY product_id, threshold',
          [productIds]
        );
        
        // Group tiers by product_id
        const tiersByProduct = {};
        tiersResult.rows.forEach(tier => {
          if (!tiersByProduct[tier.product_id]) {
            tiersByProduct[tier.product_id] = [];
          }
          tiersByProduct[tier.product_id].push(tier);
        });
        
        // Attach tiers to products and transform tiers
        products.forEach(product => {
          const tiers = tiersByProduct[product.id] || [];
          // Transform tier field names from snake_case to camelCase
          product.tiers = tiers.map(tier => ({
            id: tier.id,
            productId: tier.product_id,
            threshold: parseFloat(tier.threshold),
            rate: parseFloat(tier.rate),
            createdAt: tier.created_at,
            updatedAt: tier.updated_at
          }));
        });
      }
      
      // Transform product field names from snake_case to camelCase
      const transformedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.service_name, // Use service_name for category field to maintain compatibility 
        categoryId: product.service_id, // Also provide categoryId for new structure  
        serviceId: product.service_id, // New service-based structure
        serviceName: product.service_name, // Add service name for display
        categoryName: product.service_name, // Keep categoryName for backwards compatibility
        pricingType: product.pricing_type,
        baseRate: parseFloat(product.base_rate),
        discountThreshold: parseFloat(product.discount_threshold),
        discountRate: parseFloat(product.discount_rate),
        sku: product.sku,
        unit: product.unit,
        serviceUnit: product.service_unit, // Add service unit for correct unit display
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        tiers: product.tiers
      }));
      
      res.json(transformedProducts);
    } catch (err) {
      console.error('Error fetching products with tiers:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get product by ID
  router.get('/:id', async (req, res) => {
    try {
      const productResult = await pool.query(`
        SELECT 
          p.*,
          c.name as service_name,
          c.description as service_description,
          c.unit as service_unit
        FROM products p 
        LEFT JOIN services c ON p.service_id = c.id 
        WHERE p.id = $1
      `, [req.params.id]);
      
      if (productResult.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const product = productResult.rows[0];
      
      // If product has tiered pricing, get the tiers
      if (product.pricing_type === 'tiered') {
        const tiersResult = await pool.query(
          'SELECT * FROM product_tiers WHERE product_id = $1 ORDER BY threshold',
          [req.params.id]
        );
        
        // Transform tier field names
        const transformedTiers = tiersResult.rows.map(tier => ({
          id: tier.id,
          productId: tier.product_id,
          threshold: parseFloat(tier.threshold),
          rate: parseFloat(tier.rate),
          createdAt: tier.created_at,
          updatedAt: tier.updated_at
        }));
        
        // Transform product with tiers
        const transformedProduct = {
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.service_name, // Use service_name for compatibility
          categoryId: product.service_id,
          serviceId: product.service_id, // New service-based structure
          serviceName: product.service_name,
          categoryName: product.service_name, // Keep for backwards compatibility
          pricingType: product.pricing_type,
          baseRate: parseFloat(product.base_rate),
          discountThreshold: parseFloat(product.discount_threshold),
          discountRate: parseFloat(product.discount_rate),
          sku: product.sku,
          unit: product.unit,
          serviceUnit: product.service_unit, // Add service unit
          createdAt: product.created_at,
          updatedAt: product.updated_at,
          tiers: transformedTiers
        };
        
        res.json(transformedProduct);
      } else {
        // Transform product without tiers
        const transformedProduct = {
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.service_name, // Use service_name for compatibility
          categoryId: product.service_id,
          serviceId: product.service_id, // New service-based structure
          serviceName: product.service_name,
          categoryName: product.service_name, // Keep for backwards compatibility
          pricingType: product.pricing_type,
          baseRate: parseFloat(product.base_rate),
          discountThreshold: parseFloat(product.discount_threshold),
          discountRate: parseFloat(product.discount_rate),
          sku: product.sku,
          unit: product.unit,
          serviceUnit: product.service_unit, // Add service unit
          createdAt: product.created_at,
          updatedAt: product.updated_at,
          tiers: []
        };
        
        res.json(transformedProduct);
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update product
  router.put('/:id', async (req, res) => {
    const { name, description, category, pricingType, baseRate, discountThreshold, discountRate, tiers, unit } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        'UPDATE products SET name = $1, description = $2, service_id = $3, pricing_type = $4, base_rate = $5, discount_threshold = $6, discount_rate = $7, unit = $8 WHERE id = $9 RETURNING *',
        [name, description, category, pricingType, baseRate, discountThreshold, discountRate, unit || 'unit', req.params.id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Product not found' });
      }

      // If product has tiered pricing, update the tiers
      if (pricingType === 'tiered' && tiers) {
        console.log('🔄 Updating tiers for product:', req.params.id, 'tiers:', tiers);
        await client.query('DELETE FROM product_tiers WHERE product_id = $1', [req.params.id]);
        for (const tier of tiers) {
          console.log('📝 Inserting tier:', tier);
          await client.query(
            'INSERT INTO product_tiers (product_id, threshold, rate) VALUES ($1, $2, $3)',
            [req.params.id, tier.threshold, tier.rate]
          );
        }
      }

      // Regenerate SKU for all products when pricing changes
      const newSku = await generateSku(pool, category, name, pricingType, baseRate, tiers, req.params.id);
      await client.query('UPDATE products SET sku = $1 WHERE id = $2', [newSku, req.params.id]);

      await client.query('COMMIT');
      
      // Fetch the updated product with tiers
      const updatedProductResult = await client.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
      const updatedProduct = updatedProductResult.rows[0];
      
      if (pricingType === 'tiered') {
        const tiersResult = await client.query(
          'SELECT id, product_id, threshold, rate, created_at, updated_at FROM product_tiers WHERE product_id = $1 ORDER BY threshold',
          [req.params.id]
        );
        updatedProduct.tiers = tiersResult.rows;
      }
      
      res.json(updatedProduct);
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // Delete product
  router.delete('/:id', async (req, res) => {
    try {
      const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
      if (result.rows.length > 0) {
        res.json({ message: 'Product deleted successfully' });
      } else {
        res.status(404).json({ error: 'Product not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Helper function to generate SKU
  async function generateSku(pool, category, name, pricingType = 'tiered', baseRate = 0, tiers = null, excludeProductId = null) {
    const categoryMap = {
      spraying: 'SP',
      granular: 'GR', 
      travelling: 'TR',
      imaging: 'IM',
      accommodation: 'AC'
    };

    const pricingMap = {
      tiered: 'T',
      flat: 'F',
      per_km: 'K'
    };

    const categoryCode = categoryMap[category] || 'PR';
    const pricingCode = pricingMap[pricingType] || 'F';
    
    // For tiered products, use the first tier's rate instead of baseRate
    let rate = Math.floor(baseRate || 0);
    if (pricingType === 'tiered' && tiers && Array.isArray(tiers) && tiers.length > 0) {
      rate = Math.floor(tiers[0].rate || 0);
    }
    
    const baseSku = `${categoryCode}-${pricingCode}-${rate}`;
    
    // Check if SKU already exists (excluding the current product if updating)
    let sku = baseSku;
    let counter = 1;
    
    while (true) {
      const query = excludeProductId 
        ? 'SELECT id FROM products WHERE sku = $1 AND id != $2'
        : 'SELECT id FROM products WHERE sku = $1';
      const params = excludeProductId ? [sku, excludeProductId] : [sku];
      
      const existing = await pool.query(query, params);
      
      if (existing.rows.length === 0) {
        break; // SKU is unique
      }
      
      // SKU exists, append counter
      sku = `${baseSku}-${counter}`;
      counter++;
      
      // Prevent infinite loop
      if (counter > 100) {
        sku = `${baseSku}-${Date.now()}`;
        break;
      }
    }
    
    return sku;
  }

  return router;
};
