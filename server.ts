import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { wmsStore } from './server/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const cliPort = portIndex !== -1 && args[portIndex + 1] ? parseInt(args[portIndex + 1], 10) : null;
// Port 3000 is required for AI Studio iframe & proxy
const PORT = cliPort || (process.env.PORT && process.env.PORT !== '8080' ? parseInt(process.env.PORT, 10) : 3000);

app.use(express.json());

// Health check endpoint for dev server probes
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// API Routes
app.get('/api/stats', (_req, res) => {
  res.json(wmsStore.getStats());
});

app.get('/api/pallets', (_req, res) => {
  res.json(wmsStore.getPallets());
});

app.get('/api/pallets/:id', (req, res) => {
  const pallet = wmsStore.getPalletById(req.params.id);
  if (!pallet) {
    return res.status(404).json({ error: 'Pallet not found' });
  }
  res.json(pallet);
});

app.post('/api/pallets', (req, res) => {
  const newPallet = wmsStore.addPallet(req.body);
  res.status(201).json(newPallet);
});

app.get('/api/locations', (_req, res) => {
  res.json(wmsStore.getLocations());
});

app.get('/api/cards', (req, res) => {
  const { status, search, dest } = req.query;
  const cards = wmsStore.getCards({
    status: status as string,
    search: search as string,
    dest: dest as string,
  });
  res.json(cards);
});

app.get('/api/cards/:id', (req, res) => {
  const card = wmsStore.getCardById(req.params.id);
  if (!card) {
    return res.status(404).json({ error: 'Transfer card not found' });
  }
  res.json(card);
});

app.post('/api/cards', (req, res) => {
  try {
    const card = wmsStore.createCard(req.body);
    res.status(201).json(card);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create transfer card' });
  }
});

app.post('/api/cards/batch', (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items must be an array' });
    }
    const created = wmsStore.batchCreateCards(items);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Batch creation failed' });
  }
});

app.post('/api/cards/:id/reconcile', (req, res) => {
  const { operatorName } = req.body;
  const card = wmsStore.reconcileCard(req.params.id, operatorName);
  if (!card) {
    return res.status(404).json({ error: 'Transfer card not found' });
  }
  res.json(card);
});

app.get('/api/shift', (_req, res) => {
  res.json(wmsStore.getShift());
});

app.post('/api/shift', (req, res) => {
  const session = wmsStore.updateShift(req.body);
  res.json(session);
});

app.get('/api/audit-logs', (_req, res) => {
  res.json(wmsStore.getAuditLogs());
});

app.post('/api/reset-data', (_req, res) => {
  const resetData = wmsStore.resetToDefaults();
  res.json({ message: 'Dữ liệu đã được đặt lại về mặc định', data: resetData });
});

// Production static files vs Vite middleware in dev
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PalletTrack WMS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
