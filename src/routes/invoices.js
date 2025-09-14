import express from 'express';
const router = express.Router();

export default function createInvoicesRouter(pool) {
  // Create invoice from quote
  router.post('/', async (req, res) => {
    const { quoteId, issueDate, dueDate, bankingDetails } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get quote details including totals
      const quoteResult = await client.query(
        'SELECT * FROM quotes WHERE id = $1',
        [quoteId]
      );
      
      if (quoteResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Quote not found' });
      }
      
      const quote = quoteResult.rows[0];

      // Generate invoice number
      const invoiceNumberResult = await client.query(
        'SELECT COUNT(*) + 1 as next_number FROM invoices WHERE EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE)'
      );
      const invoiceNumber = `INV${new Date().getFullYear()}-${invoiceNumberResult.rows[0].next_number.toString().padStart(4, '0')}`;

      // Create invoice with quote totals
      const result = await client.query(
        'INSERT INTO invoices (id, invoice_number, quote_id, issue_date, due_date, status, banking, subtotal, total_discount, total_charge) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [invoiceNumber, quoteId, issueDate, dueDate, 'draft', JSON.stringify(bankingDetails), quote.subtotal, quote.total_discount, quote.total_charge]
      );

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // Get all invoices
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT i.*, q.quote_number, c.name as client_name,
        json_agg(json_build_object(
          'product_id', qi.product_id,
          'productId', qi.product_id,
          'name', p.name,
          'quantity', qi.quantity,
          'calculation', qi.calculation
        )) as items
        FROM invoices i
        JOIN quotes q ON i.quote_id = q.id
        JOIN clients c ON q.client_id = c.id
        LEFT JOIN quote_items qi ON q.id = qi.quote_id
        LEFT JOIN products p ON qi.product_id = p.id
        GROUP BY i.id, q.quote_number, c.name
        ORDER BY i.issue_date DESC
      `);
      
      // Transform database fields to API format
      const transformedInvoices = result.rows.map(row => ({
        id: row.id,
        invoiceNumber: row.invoice_number,
        quoteId: row.quote_id,
        quoteNumber: row.quote_number,
        clientId: row.client_id,
        clientName: row.client_name,
        issueDate: row.issue_date,
        dueDate: row.due_date,
        status: row.status,
        banking: row.banking,
        subtotal: parseFloat(row.subtotal || 0),
        totalDiscount: parseFloat(row.total_discount || 0),
        totalCharge: parseFloat(row.total_charge || 0),
        items: row.items || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      res.json(transformedInvoices);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get invoice by ID
  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          i.id as invoice_id,
          i.invoice_number,
          i.quote_id,
          i.issue_date,
          i.due_date,
          i.status,
          i.banking,
          i.subtotal,
          i.total_discount,
          i.total_charge,
          i.created_at as invoice_created_at,
          i.updated_at as invoice_updated_at,
          q.quote_number,
          q.client_id,
          c.id as client_id,
          c.name as client_name,
          c.email as client_email,
          c.phone as client_phone,
          c.vat_number as client_vat_number,
          c.address as client_address,
          json_agg(json_build_object(
            'product_id', qi.product_id,
            'productId', qi.product_id,
            'name', p.name,
            'quantity', qi.quantity,
            'speed', qi.speed,
            'flowRate', qi.flow_rate,
            'sprayWidth', qi.spray_width,
            'appRate', qi.app_rate,
            'calculation', qi.calculation
          )) as items
        FROM invoices i
        JOIN quotes q ON i.quote_id = q.id
        JOIN clients c ON q.client_id = c.id
        LEFT JOIN quote_items qi ON q.id = qi.quote_id
        LEFT JOIN products p ON qi.product_id = p.id
        WHERE i.id = $1
        GROUP BY i.id, i.invoice_number, i.quote_id, i.issue_date, i.due_date, i.status, i.banking, i.subtotal, i.total_discount, i.total_charge, i.created_at, i.updated_at, q.quote_number, q.client_id, c.id, c.name, c.email, c.phone, c.vat_number, c.address
      `, [req.params.id]);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        const transformedInvoice = {
          id: row.invoice_id,
          invoiceNumber: row.invoice_number,
          quoteId: row.quote_id,
          quoteNumber: row.quote_number,
          clientId: row.client_id,
          clientName: row.client_name,
          issueDate: row.issue_date,
          dueDate: row.due_date,
          status: row.status,
          banking: row.banking,
          subtotal: parseFloat(row.subtotal || 0),
          totalDiscount: parseFloat(row.total_discount || 0),
          totalCharge: parseFloat(row.total_charge || 0),
          client: {
            id: row.client_id,
            name: row.client_name,
            email: row.client_email,
            phone: row.client_phone,
            vatNumber: row.client_vat_number,
            address: row.client_address,
          },
          items: row.items?.filter(item => item.product_id !== null) || [],
          createdAt: row.invoice_created_at,
          updatedAt: row.invoice_updated_at
        };
        res.json(transformedInvoice);
      } else {
        res.status(404).json({ error: 'Invoice not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update invoice status
  router.patch('/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
      const result = await pool.query(
        'UPDATE invoices SET status = $1 WHERE id = $2 RETURNING *',
        [status, req.params.id]
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const transformedInvoice = {
          id: row.id,
          invoiceNumber: row.invoice_number,
          quoteId: row.quote_id,
          status: row.status,
          subtotal: parseFloat(row.subtotal || 0),
          totalDiscount: parseFloat(row.total_discount || 0),
          totalCharge: parseFloat(row.total_charge || 0),
          issueDate: row.issue_date,
          dueDate: row.due_date,
          banking: row.banking,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
        res.json(transformedInvoice);
      } else {
        res.status(404).json({ error: 'Invoice not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update invoice
  router.put('/:id', async (req, res) => {
    const { issueDate, dueDate, banking, status } = req.body;
    try {
      const result = await pool.query(
        'UPDATE invoices SET issue_date = $1, due_date = $2, banking = $3, status = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
        [issueDate, dueDate, JSON.stringify(banking), status, req.params.id]
      );
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'Invoice not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete invoice
  router.delete('/:id', async (req, res) => {
    try {
      const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING id', [req.params.id]);
      if (result.rows.length > 0) {
        res.json({ message: 'Invoice deleted successfully' });
      } else {
        res.status(404).json({ error: 'Invoice not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
