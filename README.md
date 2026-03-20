# SuperVolley Tournament Director
## FVL Spring 2026

### Quick start

```bash
# Install dependencies (first time only)
npm install

# Start the server
node server.js

# Or with a custom password
DIRECTOR_PASSWORD=yourpassword node server.js
```

### URLs
- **Player view** (read-only, share with everyone): `http://YOUR_IP:3000`
- **Director view** (score entry, draw): `http://YOUR_IP:3000/director`
- Default password: `supervolley2026`

### Deploy to a server

**Option 1 — Local network (tournament day)**
Run on any laptop connected to the same WiFi. Share `http://192.168.x.x:3000` with players.

**Option 2 — Cloud (Railway, Render, Fly.io)**
All are free tier friendly. Push this folder, set `DIRECTOR_PASSWORD` env var, deploy.

**Option 3 — ngrok (instant public URL)**
```bash
node server.js &
npx ngrok http 3000
```
Share the ngrok URL with players.

### Features
- Director login with password
- Pool draw randomization (AVC/NVC split enforced)
- Two schedule modes (Sequential / All-Day Spread)
- Live score entry — updates push to all player screens instantly via SSE
- Pool standings auto-update as scores come in
- Wildcard race with clear cutline
- Bracket auto-seeded from standings
- Dark/Light theme on both views
- State persists to `state.json` — server restart safe
