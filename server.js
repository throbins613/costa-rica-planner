import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: '2mb' }));

// Serve static files from Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// Database setup
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

async function initDb() {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY DEFAULT 'default',
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('Database init failed:', err.message);
  }
}

// Load plan from database
app.get('/api/plan', async (req, res) => {
  if (!pool) return res.json({ plan: null });
  try {
    const result = await pool.query('SELECT data FROM plans WHERE id = $1', ['default']);
    res.json({ plan: result.rows[0]?.data || null });
  } catch (err) {
    console.error('Load plan error:', err.message);
    res.json({ plan: null });
  }
});

// Save plan to database
app.post('/api/plan', async (req, res) => {
  if (!pool) return res.json({ ok: false, error: 'No database' });
  try {
    await pool.query(
      `INSERT INTO plans (id, data, updated_at) VALUES ('default', $1, NOW())
       ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW()`,
      [JSON.stringify(req.body.plan)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Save plan error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Proxy endpoint for Anthropic API
app.post('/api/research', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Research request failed' });
  }
});

// SPA fallback - serve index.html for all other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database: ${pool ? 'connected' : 'not configured (using localStorage fallback)'}`);
  });
});
