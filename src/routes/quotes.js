import express from 'express';
const router = express.Router();

export default function createQuotesRouter(pool) {
  
  // Helper function to calculate quote totals
  const calculateQuoteTotals = async (client, quoteId) => {
    const itemsResult = await client.query(
      'SELECT calculation FROM quote_items WHERE quote_id = $1',
      [quoteId]
    );
    
    let subtotal = 0;
    let totalDiscount = 0;
    
    for (const item of itemsResult.rows) {
      const calc = item.calculation;
      subtotal += parseFloat(calc.subtotal || 0);
      totalDiscount += parseFloat(calc.discount || 0);
    }
    
    const totalCharge = subtotal - totalDiscount;
    
    // Update quote with calculated totals
    await client.query(
      'UPDATE quotes SET subtotal = $1, total_discount = $2, total_charge = $3 WHERE id = $4',
      [subtotal, totalDiscount, totalCharge, quoteId]
    );
    
    return { subtotal, totalDiscount, totalCharge };
  };

  // Create new quote
  router.post('/', async (req, res) => {
    console.log('📝 Creating new quote with data:', req.body);
    const { clientId, items } = req.body;
    const userId = req.user?.id; // Assuming middleware sets req.user
    console.log('👤 User ID:', userId);
    console.log('📋 Items to process:', items);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate quote number - find the next available number
      const currentYear = new Date().getFullYear();
      const existingQuoteNumbers = await client.query(
        'SELECT quote_number FROM quotes WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) ORDER BY quote_number'
      );
      
      let nextNumber = 1;
      const existingNumbers = existingQuoteNumbers.rows.map(row => {
        const match = row.quote_number.match(/Q\d{4}-(\d{4})/);
        return match ? parseInt(match[1]) : 0;
      }).sort((a, b) => a - b);
      
      for (const num of existingNumbers) {
        if (num === nextNumber) {
          nextNumber++;
        } else {
          break;
        }
      }
      
      const quoteNumber = `Q${currentYear}-${nextNumber.toString().padStart(4, '0')}`;

      // Create quote
      const quoteResult = await client.query(
        'INSERT INTO quotes (id, quote_number, user_id, client_id, status) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *',
        [quoteNumber, userId, clientId, 'draft']
      );

      // Add quote items
      for (const item of items) {
        const { productId, quantity, speed, flowRate, sprayWidth, appRate, calculation } = item;
        
        // Get product details for calculation
        const productResult = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
        const product = productResult.rows[0];

        let calcDetails;
        if (calculation) {
          // Use frontend calculation if provided
          calcDetails = {
            appliedTier: calculation.appliedTier || null,
            rate: calculation.rate,
            subtotal: calculation.subtotal,
            discount: calculation.discount,
            finalTotal: calculation.finalTotal
          };
        } else {
          // Fallback to backend calculation
          if (product.pricing_type === 'tiered') {
            // Handle tiered pricing
            const tiersResult = await client.query(
              'SELECT * FROM product_tiers WHERE product_id = $1 AND threshold <= $2 ORDER BY threshold DESC LIMIT 1',
              [productId, quantity]
            );
            const appliedTier = tiersResult.rows[0];
            const rate = appliedTier ? appliedTier.rate : product.base_rate;
            const subtotal = quantity * rate;
            
            calcDetails = {
              appliedTier: appliedTier?.threshold || null,
              rate,
              subtotal
            };
          } else {
            // Handle flat or per_km pricing
            const subtotal = quantity * product.base_rate;
            calcDetails = {
              rate: product.base_rate,
              subtotal
            };
          }

          // Apply discount if applicable
          if (product.discount_threshold && quantity >= product.discount_threshold) {
            calcDetails.discount = calcDetails.subtotal * product.discount_rate;
            calcDetails.finalTotal = calcDetails.subtotal - calcDetails.discount;
          } else {
            calcDetails.discount = 0;
            calcDetails.finalTotal = calcDetails.subtotal;
          }
        }
        
        // Use appRate from frontend if provided, otherwise use the calculated rate
        const finalAppRate = appRate || calcDetails.rate;
        
        await client.query(
          'INSERT INTO quote_items (quote_id, product_id, quantity, speed, flow_rate, spray_width, app_rate, calculation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [quoteResult.rows[0].id, productId, quantity, speed, flowRate, sprayWidth, finalAppRate, JSON.stringify(calcDetails)]
        );
      }

      await client.query('COMMIT');
      
      // Calculate quote totals from items
      const totals = await calculateQuoteTotals(client, quoteResult.rows[0].id);
      
      // Get the complete quote with items
      const finalQuoteResult = await client.query(`
        SELECT q.*, 
        json_agg(json_build_object(
          'productId', qi.product_id,
          'quantity', qi.quantity,
          'speed', qi.speed,
          'flowRate', qi.flow_rate,
          'sprayWidth', qi.spray_width,
          'appRate', qi.app_rate,
          'calculation', qi.calculation
        )) as items
        FROM quotes q
        LEFT JOIN quote_items qi ON q.id = qi.quote_id
        WHERE q.id = $1
        GROUP BY q.id
      `, [quoteResult.rows[0].id]);
      
      const quote = finalQuoteResult.rows[0];
      const transformedQuote = {
        id: quote.id,
        quoteNumber: quote.quote_number,
        userId: quote.user_id,
        clientId: quote.client_id,
        status: quote.status,
        subtotal: parseFloat(quote.subtotal || 0),
        totalDiscount: parseFloat(quote.total_discount || 0),
        totalCharge: parseFloat(quote.total_charge || 0),
        items: quote.items || [],
        createdAt: quote.created_at,
        updatedAt: quote.updated_at
      };
      
      res.json(transformedQuote);
    } catch (err) {
      console.error('❌ Error creating quote:', err);
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // Get all quotes
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT q.*, c.name as client_name, 
        json_agg(json_build_object(
          'productId', qi.product_id,
          'name', p.name,
          'quantity', qi.quantity,
          'speed', qi.speed,
          'flowRate', qi.flow_rate,
          'sprayWidth', qi.spray_width,
          'appRate', qi.app_rate,
          'calculation', qi.calculation
        )) as items
        FROM quotes q
        LEFT JOIN clients c ON q.client_id = c.id
        LEFT JOIN quote_items qi ON q.id = qi.quote_id
        LEFT JOIN products p ON qi.product_id = p.id
        GROUP BY q.id, c.name
        ORDER BY q.created_at DESC
      `);
      
      // Transform database fields to API format and recalculate totals if needed
      const transformedQuotes = [];
      
      for (const row of result.rows) {
        let subtotal = parseFloat(row.subtotal || 0);
        let totalDiscount = parseFloat(row.total_discount || 0);
        let totalCharge = parseFloat(row.total_charge || 0);
        
        // If totals are zero but there are items, recalculate
        if (subtotal === 0 && totalDiscount === 0 && totalCharge === 0 && row.items && row.items.length > 0) {
          const client = await pool.connect();
          try {
            const totals = await calculateQuoteTotals(client, row.id);
            subtotal = totals.subtotal;
            totalDiscount = totals.totalDiscount;
            totalCharge = totals.totalCharge;
          } finally {
            client.release();
          }
        }
        
        transformedQuotes.push({
          id: row.id,
          quoteNumber: row.quote_number,
          userId: row.user_id,
          clientId: row.client_id,
          status: row.status,
          subtotal,
          totalDiscount,
          totalCharge,
          clientName: row.client_name,
          items: row.items || [],
          createdAt: row.created_at,
          updatedAt: row.updated_at
        });
      }
      
      res.json(transformedQuotes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get quote by ID
  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT q.*, c.*, 
        json_agg(json_build_object(
          'productId', qi.product_id,
          'name', p.name,
          'quantity', qi.quantity,
          'speed', qi.speed,
          'flowRate', qi.flow_rate,
          'sprayWidth', qi.spray_width,
          'appRate', qi.app_rate,
          'calculation', qi.calculation
        )) as items
        FROM quotes q
        LEFT JOIN clients c ON q.client_id = c.id
        LEFT JOIN quote_items qi ON q.id = qi.quote_id
        LEFT JOIN products p ON qi.product_id = p.id
        WHERE q.id = $1
        GROUP BY q.id, c.id
      `, [req.params.id]);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        
        // If totals are zero, recalculate them
        let subtotal = parseFloat(row.subtotal || 0);
        let totalDiscount = parseFloat(row.total_discount || 0);
        let totalCharge = parseFloat(row.total_charge || 0);
        
        if (subtotal === 0 && totalDiscount === 0 && totalCharge === 0 && row.items && row.items.length > 0) {
          const client = await pool.connect();
          try {
            const totals = await calculateQuoteTotals(client, row.id);
            subtotal = totals.subtotal;
            totalDiscount = totals.totalDiscount;
            totalCharge = totals.totalCharge;
          } finally {
            client.release();
          }
        }
        
        const transformedQuote = {
          id: row.id,
          quoteNumber: row.quote_number,
          userId: row.user_id,
          clientId: row.client_id,
          status: row.status,
          subtotal,
          totalDiscount,
          totalCharge,
          client: {
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            vatNumber: row.vat_number,
            address: row.address
          },
          items: row.items || [],
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
        res.json(transformedQuote);
      } else {
        res.status(404).json({ error: 'Quote not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update quote status
  router.patch('/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
      // Update the quote status
      const updateResult = await pool.query(
        'UPDATE quotes SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, req.params.id]
      );
      
      if (updateResult.rows.length === 0) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Get the complete quote data with client info and items
      const quote = updateResult.rows[0];
      
      // Get client info
      const clientResult = await pool.query('SELECT name FROM clients WHERE id = $1', [quote.client_id]);
      const clientName = clientResult.rows[0]?.name || 'Unknown Client';

      // Get quote items with product details
      const itemsResult = await pool.query(`
        SELECT 
          qi.id,
          qi.product_id as "productId",
          qi.quantity,
          qi.speed,
          qi.flow_rate as "flowRate", 
          qi.spray_width as "sprayWidth",
          qi.app_rate as "appRate",
          qi.calculation,
          p.name as product_name,
          p.description as product_description,
          p.category,
          p.sku,
          p.unit
        FROM quote_items qi
        JOIN products p ON qi.product_id = p.id
        WHERE qi.quote_id = $1
        ORDER BY qi.created_at
      `, [quote.id]);

      const items = itemsResult.rows.map(row => ({
        id: row.id,
        productId: row.productId,
        quantity: row.quantity,
        speed: row.speed,
        flowRate: row.flowRate,
        sprayWidth: row.sprayWidth,
        appRate: row.appRate,
        calculation: row.calculation,
        product: {
          id: row.productId,
          name: row.product_name,
          description: row.product_description,
          category: row.category,
          sku: row.sku,
          unit: row.unit
        }
      }));

      // Return complete quote object
      const completeQuote = {
        id: quote.id,
        quoteNumber: quote.quote_number,
        userId: quote.user_id,
        clientId: quote.client_id,
        clientName: clientName,
        status: quote.status,
        subtotal: quote.subtotal,
        totalDiscount: quote.total_discount,
        totalCharge: quote.total_charge,
        items: items,
        createdAt: quote.created_at,
        updatedAt: quote.updated_at
      };

      res.json(completeQuote);
    } catch (err) {
      console.error('Error updating quote status:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete quote
  router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete quote items first
      await client.query('DELETE FROM quote_items WHERE quote_id = $1', [req.params.id]);
      
      // Then delete the quote
      const result = await client.query('DELETE FROM quotes WHERE id = $1 RETURNING id', [req.params.id]);
      
      await client.query('COMMIT');
      
      if (result.rows.length > 0) {
        res.json({ message: 'Quote deleted successfully' });
      } else {
        res.status(404).json({ error: 'Quote not found' });
      }
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  return router;
};
