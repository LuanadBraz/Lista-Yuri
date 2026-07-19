const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_DIR = process.env.DATA_DIR || '/var/data';
const DATA_FILE = path.join(DATA_DIR, 'lista-yuri.json');

const allowedOrigins = new Set([
  'https://luanadbraz.github.io',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origem não permitida pelo CORS.'));
  }
}));
app.use(express.json({ limit: '20kb' }));
app.use(express.static(__dirname));

function emptyState() {
  return { purchasedIds: [], reservations: {}, updatedAt: new Date().toISOString() };
}

function ensureDataFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(emptyState(), null, 2), 'utf8');
  }
}

function readState() {
  ensureDataFile();
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return {
      purchasedIds: Array.isArray(parsed.purchasedIds) ? parsed.purchasedIds : [],
      reservations: parsed.reservations && typeof parsed.reservations === 'object' ? parsed.reservations : {},
      updatedAt: parsed.updatedAt || new Date().toISOString()
    };
  } catch (error) {
    console.error('Falha ao ler os dados:', error);
    const state = emptyState();
    writeState(state);
    return state;
  }
}

function writeState(state) {
  ensureDataFile();
  const normalized = {
    purchasedIds: [...new Set(state.purchasedIds || [])],
    reservations: state.reservations || {},
    updatedAt: new Date().toISOString()
  };
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(normalized, null, 2), 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
  return normalized;
}

function validItemId(value) {
  return typeof value === 'string' && /^[a-z0-9-]{1,80}$/.test(value);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/state', (_req, res) => {
  res.json(readState());
});

app.post('/api/reserve', (req, res) => {
  const itemId = String(req.body.itemId || '').trim();
  const name = String(req.body.name || '').trim().slice(0, 60);

  if (!validItemId(itemId) || !name) {
    return res.status(400).json({ message: 'Item ou nome inválido.' });
  }

  const state = readState();
  if (state.purchasedIds.includes(itemId)) {
    return res.status(409).json({ message: 'Este item já foi comprado.' });
  }
  if (state.reservations[itemId] && state.reservations[itemId] !== name) {
    return res.status(409).json({ message: `Este item já foi reservado por ${state.reservations[itemId]}.` });
  }

  state.reservations[itemId] = name;
  return res.json(writeState(state));
});

app.post('/api/cancel-reservation', (req, res) => {
  const itemId = String(req.body.itemId || '').trim();
  if (!validItemId(itemId)) {
    return res.status(400).json({ message: 'Item inválido.' });
  }

  const state = readState();
  delete state.reservations[itemId];
  return res.json(writeState(state));
});

app.post('/api/purchase', (req, res) => {
  const itemId = String(req.body.itemId || '').trim();
  const purchased = req.body.purchased === true;

  if (!validItemId(itemId)) {
    return res.status(400).json({ message: 'Item inválido.' });
  }

  const state = readState();
  if (purchased && state.reservations[itemId]) {
    return res.status(409).json({ message: `Este item está reservado por ${state.reservations[itemId]}.` });
  }

  if (purchased) {
    if (!state.purchasedIds.includes(itemId)) state.purchasedIds.push(itemId);
    delete state.reservations[itemId];
  } else {
    state.purchasedIds = state.purchasedIds.filter(id => id !== itemId);
  }

  return res.json(writeState(state));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

app.listen(PORT, '0.0.0.0', () => {
  ensureDataFile();
  console.log(`Lista Yuri disponível na porta ${PORT}`);
});
