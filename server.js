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
  const data = JSON.stringify({ type: 'state', state, ts: Date.now() });
  for (const res of sseClients) {
    try { res.write(`data: ${data}\n\n`); }
    catch { sseClients.delete(res); }
  }
}

// ── AUTH MIDDLEWARE ────────────────────────────────────
const sessions = new Map();

function authMiddleware(req, res, next) {
  const token = req.headers['x-director-token'] || req.query.token;
  if (token && sessions.has(token)) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// ── ROUTES ─────────────────────────────────────────────

// Player view (read-only) — original
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

// New player view — v2 design
app.get('/players', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'players.html'));
});

// Director view — original
app.get('/director', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'director.html'));
});

// New director view — v2 design
app.get('/td', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'td.html'));
});

// Login
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === DIRECTOR_PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { createdAt: Date.now() });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

// Ping endpoint — used by UptimeRobot to keep the app alive on Render free tier
app.get('/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Get state (public — anyone can read)
app.get('/api/state', (req, res) => {
  res.json(loadState());
});

// SSE stream (public — anyone can subscribe)
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send current state immediately
  const state = loadState();
  res.write(`data: ${JSON.stringify({ type: 'state', state, ts: Date.now() })}\n\n`);

  // Heartbeat every 20s
  const hb = setInterval(() => {
    try { res.write(`: heartbeat\n\n`); }
    catch { clearInterval(hb); sseClients.delete(res); }
  }, 20000);

  sseClients.add(res);
  req.on('close', () => { clearInterval(hb); sseClients.delete(res); });
});

// Save full state (director only)
app.post('/api/state', authMiddleware, (req, res) => {
  const state = { ...req.body, lastUpdated: new Date().toISOString() };
  saveState(state);
  res.json({ ok: true });
});

// Patch scores only (director only) — lightweight update
app.patch('/api/scores', authMiddleware, (req, res) => {
  const state = loadState();
  const { gameScores, bracketScores } = req.body;
  if (gameScores) state.gameScores = { ...state.gameScores, ...gameScores };
  if (bracketScores) state.bracketScores = { ...state.bracketScores, ...bracketScores };
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
