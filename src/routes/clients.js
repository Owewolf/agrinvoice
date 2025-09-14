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
      const query = `
        SELECT 
          c.id,
          c.name,
          c.email,
          c.phone,
          c.vat_number,
          c.address,
          c.notes,
          c.created_by,
          c.created_at,
          c.updated_at,
          COALESCE(quote_counts.total_quotes, 0) as total_quotes,
          COALESCE(invoice_counts.total_invoices, 0) as total_invoices,
          COALESCE(outstanding_amounts.outstanding_amount, 0) as outstanding_amount
        FROM clients c
        LEFT JOIN (
          SELECT client_id, COUNT(*) as total_quotes
          FROM quotes
          GROUP BY client_id
        ) quote_counts ON c.id = quote_counts.client_id
        LEFT JOIN (
          SELECT q.client_id, COUNT(*) as total_invoices
          FROM invoices i
          JOIN quotes q ON i.quote_id = q.id
          GROUP BY q.client_id
        ) invoice_counts ON c.id = invoice_counts.client_id
        LEFT JOIN (
          SELECT q.client_id, 
                 SUM(
                   CASE 
                     WHEN i.status IN ('sent', 'overdue') 
                     THEN (i.subtotal + i.total_charge - i.total_discount)
                     ELSE 0 
                   END
                 ) as outstanding_amount
          FROM invoices i
          JOIN quotes q ON i.quote_id = q.id
          GROUP BY q.client_id
        ) outstanding_amounts ON c.id = outstanding_amounts.client_id
        ORDER BY c.name
      `;
      
      const result = await pool.query(query);
      
      // Transform the data to ensure numeric types and convert field names to camelCase
      const transformedClients = result.rows.map(row => {
        const { 
          total_quotes, 
          total_invoices, 
          outstanding_amount, 
          vat_number, 
          created_at, 
          updated_at,
          created_by,
          ...clientData 
        } = row;
        return {
          id: clientData.id,
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          notes: clientData.notes,
          vatNumber: vat_number,
          createdBy: created_by,
          createdAt: created_at,
          updatedAt: updated_at,
          totalQuotes: parseInt(total_quotes) || 0,
          totalInvoices: parseInt(total_invoices) || 0,
          outstandingAmount: parseFloat(outstanding_amount) || 0
        };
      });
      
      res.json(transformedClients);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get client by ID
  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const { vat_number, created_at, updated_at, created_by, ...clientData } = row;
        const transformedClient = {
          id: clientData.id,
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          notes: clientData.notes,
          vatNumber: vat_number,
          createdBy: created_by,
          createdAt: created_at,
          updatedAt: updated_at
        };
        res.json(transformedClient);
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
        const row = result.rows[0];
        const { vat_number, created_at, updated_at, created_by, ...clientData } = row;
        const transformedClient = {
          id: clientData.id,
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          notes: clientData.notes,
          vatNumber: vat_number,
          createdBy: created_by,
          createdAt: created_at,
          updatedAt: updated_at
        };
        res.json(transformedClient);
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
