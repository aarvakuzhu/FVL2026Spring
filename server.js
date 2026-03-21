const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DIRECTOR_PASSWORD = process.env.DIRECTOR_PASSWORD || 'supervolley2026';
const STATE_FILE = process.env.STATE_FILE || path.join(__dirname, 'state.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── STATE ──────────────────────────────────────────────
function loadState() {
  if (!fs.existsSync(STATE_FILE)) return defaultState();
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return defaultState(); }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  broadcastUpdate(state);
}

function defaultState() {
  return {
    teams: [],
    pools: null,
    schedule: [],
    schedMode: 'A',
    gameScores: {},
    bracketScores: {},
    step: 0,
    lastUpdated: null
  };
}

// ── SSE BROADCAST ──────────────────────────────────────
const sseClients = new Set();

function broadcastUpdate(state) {
  const { _token, ...publicState } = state;
  const data = JSON.stringify({ type: 'state', state: publicState, ts: Date.now() });
  for (const res of sseClients) {
    try { res.write(`data: ${data}\n\n`); }
    catch { sseClients.delete(res); }
  }
}

// ── AUTH MIDDLEWARE ────────────────────────────────────
// Sessions persist in state.json — survives Render free-tier restarts
function getStoredToken() {
  try { return loadState()._token || null; } catch { return null; }
}

function authMiddleware(req, res, next) {
  const token = req.headers['x-director-token'] || req.query.token;
  if (token && token === getStoredToken()) next();
  else res.status(401).json({ error: 'Unauthorized' });
}

// ── ROUTES ─────────────────────────────────────────────

// Player view — original
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

// Player view — new design
app.get('/players', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'players.html'));
});

// Director view — single source of truth
app.get('/director', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'director.html'));
});

// Login
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === DIRECTOR_PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    // Persist token so it survives server restarts
    const state = loadState();
    state._token = token;
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

// Ping endpoint — used by UptimeRobot to keep the app alive on Render free tier
app.get('/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Get state (public — anyone can read, _token is stripped)
app.get('/api/state', (req, res) => {
  const { _token, ...publicState } = loadState();
  res.json(publicState);
});

// SSE stream (public — anyone can subscribe)
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send current state immediately
  const { _token, ...publicState } = loadState();
  res.write(`data: ${JSON.stringify({ type: 'state', state: publicState, ts: Date.now() })}\n\n`);

  // Heartbeat every 20s
  const hb = setInterval(() => {
    try { res.write(`: heartbeat\n\n`); }
    catch { clearInterval(hb); sseClients.delete(res); }
  }, 20000);

  sseClients.add(res);
  req.on('close', () => { clearInterval(hb); sseClients.delete(res); });
});

// Save full state (director only)
// Server always preserves _token from disk.
// If schedule is locked on disk, client cannot unlock it via POST — only /api/unlock can.
app.post('/api/state', authMiddleware, (req, res) => {
  const onDisk = loadState();
  const incoming = req.body;

  // Never let client downgrade a locked schedule
  const locked = onDisk.locked === true ? true : (incoming.locked === true);

  const state = {
    ...incoming,
    locked,
    _token: onDisk._token,           // always preserve token
    lastUpdated: new Date().toISOString()
  };
  saveState(state);
  res.json({ ok: true });
});

// Patch scores only (director only) — lightweight, never touches lock or token
app.patch('/api/scores', authMiddleware, (req, res) => {
  const state = loadState();
  const { gameScores, bracketScores } = req.body;
  if (gameScores) state.gameScores = { ...state.gameScores, ...gameScores };
  if (bracketScores) state.bracketScores = { ...state.bracketScores, ...bracketScores };
  state.lastUpdated = new Date().toISOString();
  saveState(state);
  res.json({ ok: true });
});

// Unlock schedule — requires password re-verification server-side
app.post('/api/unlock', authMiddleware, (req, res) => {
  const { password } = req.body;
  if (password !== DIRECTOR_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const state = loadState();
  state.locked = false;
  state.lastUpdated = new Date().toISOString();
  saveState(state);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`\n🏐 SuperVolley Tournament Server`);
  console.log(`   Player view:   http://localhost:${PORT}`);
  console.log(`   Director view: http://localhost:${PORT}/director`);
  console.log(`   Password:      ${DIRECTOR_PASSWORD}`);
  console.log(`   Change with:   DIRECTOR_PASSWORD=yourpassword node server.js\n`);
});
