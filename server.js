const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'state.json');

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20kb' }));

function emptyState() {
  return { purchasedIds: [], reservations: {} };
}

function ensureDataFile() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
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
      reservations: parsed.reservations && typeof parsed.reservations === 'object'
        ? parsed.reservations
        : {}
    };
  } catch (error) {
    console.error('Falha ao ler os dados:', error);
    return emptyState();
  }
}

function writeState(state) {
  ensureDataFile();
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
}

function cleanText(value, maxLength = 80) {
  return String(value ?? '').trim().slice(0, maxLength);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/state', (_req, res) => {
  res.json({ ok: true, state: readState() });
});

app.post('/api/reserve', (req, res) => {
  const itemId = cleanText(req.body.itemId, 120);
  const name = cleanText(req.body.name, 80);

  if (!itemId || !name) {
    return res.status(400).json({ ok: false, message: 'Informe seu nome para reservar.' });
  }

  const state = readState();

  if (state.purchasedIds.includes(itemId)) {
    return res.status(409).json({ ok: false, message: 'Este item já foi marcado como comprado.' });
  }

  const currentName = state.reservations[itemId];
  if (currentName && currentName !== name) {
    return res.status(409).json({
      ok: false,
      message: `Este item já foi reservado por ${currentName}.`
    });
  }

  state.reservations[itemId] = name;
  writeState(state);
  return res.json({ ok: true, state });
});

app.post('/api/cancel-reservation', (req, res) => {
  const itemId = cleanText(req.body.itemId, 120);
  if (!itemId) {
    return res.status(400).json({ ok: false, message: 'Item inválido.' });
  }

  const state = readState();
  delete state.reservations[itemId];
  writeState(state);
  return res.json({ ok: true, state });
});

app.post('/api/purchase', (req, res) => {
  const itemId = cleanText(req.body.itemId, 120);
  const purchased = req.body.purchased === true;

  if (!itemId) {
    return res.status(400).json({ ok: false, message: 'Item inválido.' });
  }

  const state = readState();

  if (purchased && state.reservations[itemId]) {
    return res.status(409).json({
      ok: false,
      message: `Este item está reservado por ${state.reservations[itemId]}. Cancele a reserva antes.`
    });
  }

  if (purchased) {
    if (!state.purchasedIds.includes(itemId)) state.purchasedIds.push(itemId);
    delete state.reservations[itemId];
  } else {
    state.purchasedIds = state.purchasedIds.filter(id => id !== itemId);
  }

  writeState(state);
  return res.json({ ok: true, state });
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, message: 'Rota não encontrada.' });
});

app.listen(PORT, '0.0.0.0', () => {
  ensureDataFile();
  console.log(`Lista Yuri API disponível na porta ${PORT}`);
  console.log(`Dados salvos em: ${DATA_FILE}`);
});
