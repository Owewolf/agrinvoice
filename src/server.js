import dotenv from 'dotenv';
import { resolve } from 'path';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

// Load .env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const require = createRequire(import.meta.url);
const { Pool } = pg;

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use((req, res, next) => {
  // Remove X-Powered-By header for security
  res.removeHeader('X-Powered-By');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HTTPS redirect in production
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

app.use(cors({  
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://yourdomain.com'
    : 'http://localhost:5173',  
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Limit payload size

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.connect()
  .then(client => {
    console.log('Database connected successfully');
    client.release();
  })
  .catch(err => {
    console.error('Database connection error:', err.stack);
    process.exit(1);
  });

// Import routers
const { default: createClientsRouter } = await import('./routes/clients.js');
const { default: createProductsRouter } = await import('./routes/products.js');
const { default: createQuotesRouter } = await import('./routes/quotes.js');
const { default: createInvoicesRouter } = await import('./routes/invoices.js');
const { default: createAuthRouter } = await import('./routes/auth.js');
const { default: createSettingsRouter } = await import('./routes/settings.js');

// Initialize routers
const clientsRouter = createClientsRouter(pool);
const productsRouter = createProductsRouter(pool);
const quotesRouter = createQuotesRouter(pool);
const invoicesRouter = createInvoicesRouter(pool);
const authRouter = createAuthRouter(pool);
const settingsRouter = createSettingsRouter(pool);

import { authenticateToken } from './middleware/auth.js';

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/settings', authenticateToken, settingsRouter);
app.use('/api/invoices', authenticateToken, invoicesRouter);
app.use('/api/quotes', authenticateToken, quotesRouter);
app.use('/api/products', authenticateToken, productsRouter);
app.use('/api/clients', authenticateToken, clientsRouter);

app.get('/', (req, res) => {
  res.send('AgriHover backend is running!');
});

app.get('/db-test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    res.json(result.rows[0]);
    client.release();
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
