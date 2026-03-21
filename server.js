const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const DIRECTOR_PASSWORD = process.env.DIRECTOR_PASSWORD || 'supervolley2026';
const STATE_FILE = process.env.STATE_FILE || path.join(__dirname, 'state.json');
const MONGODB_URI = process.env.MONGODB_URI || null;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── MONGODB ────────────────────────────────────────────
let db = null;
const DB_NAME = 'supervolley';
const COL = 'state';

async function connectMongo() {
  if (!MONGODB_URI) return;
  try {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    db = client.db(DB_NAME);
    console.log('✅ MongoDB connected');
  } catch (e) {
    console.warn('⚠️  MongoDB connection failed, falling back to file:', e.message);
    db = null;
  }
}

// ── STATE ──────────────────────────────────────────────
function defaultState() {
  return {
    teams: [], pools: null, schedule: [], schedMode: 'A',
    gameScores: {}, bracketScores: {}, locked: false,
    step: 0, lastUpdated: null
  };
}

// File-based fallback
function loadStateFile() {
  if (!fs.existsSync(STATE_FILE)) return defaultState();
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return defaultState(); }
}
function saveStateFile(state) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); } catch {}
}

// MongoDB-based
async function loadStateMongo() {
  try {
    const doc = await db.collection(COL).findOne({ _id: 'tournament' });
    if (!doc) return defaultState();
    const { _id, ...state } = doc;
    return state;
  } catch (e) {
    console.warn('MongoDB read failed, using file:', e.message);
    return loadStateFile();
  }
}
async function saveStateMongo(state) {
  try {
    await db.collection(COL).replaceOne(
      { _id: 'tournament' },
      { _id: 'tournament', ...state },
      { upsert: true }
    );
    // Also write to file as local backup
    saveStateFile(state);
  } catch (e) {
    console.warn('MongoDB write failed, saving to file only:', e.message);
    saveStateFile(state);
  }
}

// Unified interface — always async
async function loadState() {
  if (db) return loadStateMongo();
  return loadStateFile();
}
async function saveState(state) {
  if (db) await saveStateMongo(state);
  else saveStateFile(state);
  broadcastUpdate(state);
}

// ── SSE BROADCAST ──────────────────────────────────────
const sseClients = new Set();
function broadcastUpdate(state) {
  const { _token, ...pub } = state;
  const data = JSON.stringify({ type: 'state', state: pub, ts: Date.now() });
  for (const res of sseClients) {
    try { res.write(`data: ${data}\n\n`); }
    catch { sseClients.delete(res); }
  }
}

// ── AUTH ───────────────────────────────────────────────
async function getStoredToken() {
  const s = await loadState();
  return s._token || null;
}
async function authMiddleware(req, res, next) {
  const token = req.headers['x-director-token'] || req.query.token;
  if (token && token === await getStoredToken()) next();
  else res.status(401).json({ error: 'Unauthorized' });
}

// ── ROUTES ─────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'player.html')));
app.get('/players', (req, res) => res.sendFile(path.join(__dirname, 'public', 'players.html')));
app.get('/director', (req, res) => res.sendFile(path.join(__dirname, 'public', 'director.html')));
app.get('/ping', (req, res) => res.json({ ok: true, ts: Date.now(), db: !!db }));

// Login
app.post('/api/login', async (req, res) => {
  const { password } = req.body;
  if (password !== DIRECTOR_PASSWORD) return res.status(401).json({ error: 'Wrong password' });
  const token = crypto.randomBytes(32).toString('hex');
  const state = await loadState();
  state._token = token;
  await saveState(state);
  res.json({ token });
});

// Get state (public)
app.get('/api/state', async (req, res) => {
  const { _token, ...pub } = await loadState();
  res.json(pub);
});

// SSE stream
app.get('/api/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const { _token, ...pub } = await loadState();
  res.write(`data: ${JSON.stringify({ type: 'state', state: pub, ts: Date.now() })}\n\n`);

  const hb = setInterval(() => {
    try { res.write(`: heartbeat\n\n`); }
    catch { clearInterval(hb); sseClients.delete(res); }
  }, 20000);

  sseClients.add(res);
  req.on('close', () => { clearInterval(hb); sseClients.delete(res); });
});

// Save full state
app.post('/api/state', authMiddleware, async (req, res) => {
  const onDisk = await loadState();
  const incoming = req.body;
  // Server enforces: locked can only go true→false via /api/unlock
  const locked = onDisk.locked === true ? true : (incoming.locked === true);
  const state = { ...incoming, locked, _token: onDisk._token, lastUpdated: new Date().toISOString() };
  await saveState(state);
  res.json({ ok: true });
});

// Patch scores only
app.patch('/api/scores', authMiddleware, async (req, res) => {
  const state = await loadState();
  const { gameScores, bracketScores } = req.body;
  if (gameScores) state.gameScores = { ...state.gameScores, ...gameScores };
  if (bracketScores) state.bracketScores = { ...state.bracketScores, ...bracketScores };
  state.lastUpdated = new Date().toISOString();
  await saveState(state);
  res.json({ ok: true });
});

// Unlock — requires password re-verification
app.post('/api/unlock', authMiddleware, async (req, res) => {
  const { password } = req.body;
  if (password !== DIRECTOR_PASSWORD) return res.status(401).json({ error: 'Wrong password' });
  const state = await loadState();
  state.locked = false;
  state.lastUpdated = new Date().toISOString();
  await saveState(state);
  res.json({ ok: true });
});

// ── START ──────────────────────────────────────────────
connectMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🏐 SuperVolley Tournament Server`);
    console.log(`   Player:   http://localhost:${PORT}`);
    console.log(`   Director: http://localhost:${PORT}/director`);
    console.log(`   Storage:  ${db ? 'MongoDB Atlas' : 'Local file (state.json)'}`);
    console.log(`   Password: ${DIRECTOR_PASSWORD}\n`);
  });
});
