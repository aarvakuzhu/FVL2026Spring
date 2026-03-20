# SuperVolley — Deploy to Render
## Complete step-by-step guide

---

## What you'll need
- A GitHub account (free) — github.com
- A Render account (free) — render.com
- An UptimeRobot account (free) — uptimerobot.com
- The supervolley folder from the zip file

---

## PART 1 — Push to GitHub (5 min)

### Step 1 — Create a GitHub repo

1. Go to **github.com** and sign in
2. Click the **+** button top right → **New repository**
3. Name it `supervolley`
4. Set it to **Private** (so your director password isn't public)
5. Leave everything else as default
6. Click **Create repository**

### Step 2 — Upload your files

GitHub will show you a page with instructions. Use the upload option:

1. Click **uploading an existing file** link on that page
2. Drag and drop the entire contents of your `supervolley` folder
   (server.js, render.yaml, package.json, public/ folder, README.md)
3. **Do NOT upload** the `node_modules` folder — skip it
4. Scroll down, click **Commit changes**

Your repo is now live on GitHub.

---

## PART 2 — Deploy on Render (5 min)

### Step 3 — Create a Render account

1. Go to **render.com**
2. Click **Get Started** → sign up with your GitHub account
   (this links them automatically — easier than email signup)

### Step 4 — Create a new Web Service

1. From your Render dashboard, click **New +** → **Web Service**
2. Click **Connect a repository**
3. You'll see your GitHub repos listed — select **supervolley**
4. Click **Connect**

### Step 5 — Configure the service

Render will auto-detect most settings. Verify these:

| Setting | Value |
|---|---|
| Name | supervolley |
| Region | US East (or closest to you) |
| Branch | main |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Plan | **Free** |

### Step 6 — Set your director password

Before clicking deploy:

1. Scroll down to **Environment Variables**
2. Click **Add Environment Variable**
3. Set:
   - Key: `DIRECTOR_PASSWORD`
   - Value: `your_chosen_password` ← **change this to something only you know**
4. Click **Add Environment Variable** again
5. Set:
   - Key: `NODE_ENV`
   - Value: `production`

### Step 7 — Deploy

1. Click **Create Web Service**
2. Render will start building — you'll see live logs
3. Wait 2–3 minutes for the build to finish
4. When you see **"Your service is live"**, you're done

Render gives you a URL like:
```
https://supervolley.onrender.com
```

**Test it:**
- Player view: `https://supervolley.onrender.com`
- Director view: `https://supervolley.onrender.com/director`

---

## PART 3 — Keep it awake with UptimeRobot (3 min)

Without this, Render free tier sleeps after 15 min of no traffic.
UptimeRobot pings it every 5 min — keeps it awake 24/7.

### Step 8 — Create UptimeRobot account

1. Go to **uptimerobot.com**
2. Click **Register for FREE**
3. Verify your email

### Step 9 — Add a monitor

1. From the dashboard, click **+ Add New Monitor**
2. Set:
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `SuperVolley`
   - URL: `https://supervolley.onrender.com/ping`
   - Monitoring Interval: **5 minutes**
3. Click **Create Monitor**

That's it. UptimeRobot will now ping `/ping` every 5 minutes.
Render sees traffic and never spins down.

---

## PART 4 — Share with players

### Step 10 — Share these two links

**Players (everyone):**
```
https://supervolley.onrender.com
```
Share this in your WhatsApp/group chat. Works on any phone browser.

**Director only (you):**
```
https://supervolley.onrender.com/director
Password: your_chosen_password
```

---

## Updating your password

If you want to change the director password after deployment:

1. Go to Render dashboard → your supervolley service
2. Click **Environment** tab
3. Find `DIRECTOR_PASSWORD` → click edit
4. Change the value → click **Save Changes**
5. Render auto-restarts with the new password (takes ~30 sec)

---

## If something goes wrong

**Build fails:**
- Check the build logs in Render dashboard
- Make sure `node_modules` was NOT uploaded to GitHub
- Make sure `package.json` has `"start": "node server.js"` in scripts

**App crashes after deploy:**
- Click **Logs** in your Render service dashboard
- Look for the error message

**Scores not saving between restarts:**
- The free tier disk may not persist — scores are safe as long as the
  app keeps running. On tournament day this won't be an issue.
- If you want guaranteed persistence, upgrade to Render's $7/month
  plan which includes a persistent disk.

---

## Day-of checklist

- [ ] Open `https://supervolley.onrender.com` the night before to wake it up
- [ ] Log into `/director` and do a test draw + enter a dummy score
- [ ] Confirm the player view shows the score update
- [ ] Share the player URL in the group chat
- [ ] Keep your phone charged — you'll be entering scores all day!
