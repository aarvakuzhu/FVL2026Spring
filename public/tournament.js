// ═══════════════════════════════════════════════════════
// SUPERVOLLEY — SHARED TOURNAMENT LOGIC
// FVL Spring 2026
// ═══════════════════════════════════════════════════════

const CAPTAIN_PHOTOS = {
  'Divyanshu Ranjan':   'https://lh3.googleusercontent.com/d/1sgMR2FMWf5IvO1rXjkvAtS1cxAugPch7',
  'Anil Reddy Gurrala': 'https://lh3.googleusercontent.com/d/1LXwgRP3DQmxbWw1DX1sHRC07Vhv1vSRF',
  'Bharath Muttavarapu':'https://lh3.googleusercontent.com/d/1fIZBnmkSRs-0tWD1moeLyMUwAENQz8B_',
  'Pratap':             'https://lh3.googleusercontent.com/d/1pJgPvJmD7U7zedNwHXODW9hRhKwqUFwb',
  'Santosh Nareddy':    'https://lh3.googleusercontent.com/d/1IOQOx0I5u7BkHXvSaCq18D_veTY2WvK4',
  'Sonu (Kapil)':       'https://lh3.googleusercontent.com/d/1B4YRTqu2dDCsthHTJqmscy2n4Clzt2vV',
  'Ishant Mehndiratta': 'https://lh3.googleusercontent.com/d/1sDEmid2ZVfTufncdVuiF5Vem3odx-54M',
  'Uday Battineni':     'https://lh3.googleusercontent.com/d/1DoVcp-Q1g1LNbNJEqY96uVnzggLhRYbq',
  'Ritesh Gupta':       'https://lh3.googleusercontent.com/d/19-IotE0V-ru58IIqqis7BqCpW312Rxvy',
  'Ronak Bathani':      'https://lh3.googleusercontent.com/d/1H4soPf2ztA_uVzYgq9YLIG9EXMHjmW6k',
  'Naveen Kumar':       'https://lh3.googleusercontent.com/d/1QrNWkDz4RfImHnB_A6puWcnvyJxEQqct',
  'Rakesh Kumar':       'https://lh3.googleusercontent.com/d/1T7efu_V3Ao0CxvXf54MeXh9HGaQmuLaJ',
  'Surendra Kanna':     'https://lh3.googleusercontent.com/d/1GqCWTaDJnv9BnbMfBl2hKqFA14XiGetP',
  'Keyur Patel':        'https://lh3.googleusercontent.com/d/1p5Aek2w9hkMuWpsoHXSB_1yxBnlLah5H',
  'Govardhana Peruri':  'https://lh3.googleusercontent.com/d/1PuFr8F_lfIhSAkuo8QOYs85VU4aCwMX4',
  'Murali Atkuri':      'https://lh3.googleusercontent.com/d/1Jlz7y__iJwAqw2XDzGYKTGOL7zhch-P0',
};

// Returns an avatar img element string for a captain name
function captainAvatar(name, size=32) {
  const url = CAPTAIN_PHOTOS[name];
  const initial = (name||'?').charAt(0).toUpperCase();
  const fallback = `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--rim2,rgba(255,255,255,.1));flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-size:${Math.round(size*.38)}px;font-weight:700;color:var(--text3,#aaa)">${initial}</div>`;
  if (!url) return fallback;
  return `<img src="${url}" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;background:rgba(128,128,128,.2)" onerror="this.outerHTML='${fallback.replace(/'/g,"&apos;")}'" loading="lazy">`;
}


const NVC_CAPTAINS = [
  'Ritesh Gupta','Keyur Patel','Pratap','Bharath Muttavarapu',
  'Surendra Kanna','Sonu (Kapil)','Govardhana Peruri','Murali Atkuri'
];

const FVL_TEAMS = [
  {name:'Vegas Volleys',captain:'Divyanshu Ranjan'},
  {name:'Everest Smashers',captain:'Anil Reddy Gurrala'},
  {name:'6 Minars',captain:'Bharath Muttavarapu'},
  {name:'Gateway Defenders',captain:'Pratap'},
  {name:'Disney World Warriors',captain:'Santosh Nareddy'},
  {name:'Lal Kile ki Sena',captain:'Sonu (Kapil)'},
  {name:'Eiffel Tower of Power',captain:'Ishant Mehndiratta'},
  {name:'Coca-Cola Fizz Spikers',captain:'Uday Battineni'},
  {name:'Varanasi Volleys',captain:'Ritesh Gupta'},
  {name:'Fowler Fury',captain:'Ronak Bathani'},
  {name:'Alps Attackers',captain:'Naveen Kumar'},
  {name:'The Great Wall of De-Fence',captain:'Rakesh Kumar'},
  {name:'Terra Cotta Warriors',captain:'Surendra Kanna'},
  {name:'The Emerald Defenders',captain:'Keyur Patel'},
  {name:'Set-lanta',captain:'Govardhana Peruri'},
  {name:'Mansarovar Thunder Spike',captain:'Murali Atkuri'},
];

const getDiv = c => NVC_CAPTAINS.includes(c) ? 'NVC' : 'AVC';
const RR_PAIRS = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]];

function timeStr(minsFrom830) {
  const total = 510 + minsFrom830;
  const h = Math.floor(total / 60), m = total % 60;
  const ap = h >= 12 ? 'pm' : 'am', hh = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${hh}:${String(m).padStart(2,'0')}${ap}`;
}

// Deterministic coin flip — same two tied teams always resolve the same way.
// Uses a hash of both team names so the result is stable across re-renders
// but appears random to participants.
function coinFlip(nameA, nameB) {
  const str = [nameA, nameB].sort().join('|');
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return (h & 1) ? 1 : -1;
}

function shuffle(arr) {  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

let _gid = 0;
function mkGame(time, court, home, away, tag, phase) {
  const id = 'g' + (++_gid);
  return { id, time, court, home: home.name, homeCap: home.captain, away: away.name, awayCap: away.captain, tag, phase };
}

function buildScheduleFromPools(pools, mode) {
  _gid = 0;
  const schedule = [];
  const BREAK = 150, BKDUR = 10;
  const bt = t => t >= BREAK ? t + BKDUR : t;

  if (mode === 'A') {
    RR_PAIRS.forEach((p,i) => {
      const t = bt(i*25);
      schedule.push(mkGame(t, 1, pools.AVC.Fowler[p[0]], pools.AVC.Fowler[p[1]], 'Fowler · AVC', 'p1'));
      schedule.push(mkGame(t, 2, pools.AVC.Central[p[0]], pools.AVC.Central[p[1]], 'Central · AVC', 'p1'));
    });
    schedule.push({ isBreak:true, time:BREAK, phase:'break' });
    RR_PAIRS.forEach((p,i) => {
      const t = BREAK + BKDUR + i*25;
      schedule.push(mkGame(t, 1, pools.NVC.Dobbs[p[0]], pools.NVC.Dobbs[p[1]], 'Dobbs · NVC', 'p1'));
      schedule.push(mkGame(t, 2, pools.NVC.Extreme[p[0]], pools.NVC.Extreme[p[1]], 'Extreme · NVC', 'p1'));
    });
  } else {
    const PA = [pools.AVC.Fowler, pools.AVC.Central, pools.NVC.Dobbs, pools.NVC.Extreme];
    const PT = ['Fowler · AVC','Central · AVC','Dobbs · NVC','Extreme · NVC'];
    const c1 = [0,2,1,3,0,2,1,3,0,2,1,3], c2 = [1,3,0,2,1,3,0,2,1,3,0,2];
    const pi = [0,0,0,0];
    const rawT = [0,25,50,75,100,125,150,175,200,225,250,275];
    schedule.push({ isBreak:true, time:BREAK, phase:'break' });
    for (let s = 0; s < 12; s++) {
      const t = bt(rawT[s]), p1 = c1[s], p2 = c2[s];
      const pr1 = RR_PAIRS[pi[p1]++], pr2 = RR_PAIRS[pi[p2]++];
      schedule.push(mkGame(t, 1, PA[p1][pr1[0]], PA[p1][pr1[1]], PT[p1], 'p1'));
      schedule.push(mkGame(t, 2, PA[p2][pr2[0]], PA[p2][pr2[1]], PT[p2], 'p1'));
    }
  }

  const p2Start = 310;
  const as1 = shuffle([...pools.AVC.Fowler]), as2 = shuffle([...pools.AVC.Central]);
  const ns1 = shuffle([...pools.NVC.Dobbs]), ns2 = shuffle([...pools.NVC.Extreme]);
  for (let i = 0; i < 4; i++) {
    schedule.push(mkGame(p2Start + i*25, 1, as1[i], as2[i], 'Wildcard · AVC', 'p2'));
    schedule.push(mkGame(p2Start + i*25, 2, ns1[i], ns2[i], 'Wildcard · NVC', 'p2'));
  }

  // ── UMPIRE ASSIGNMENT ──────────────────────────────
  // Separate captain pools by conference
  const avcCaptains = [...pools.AVC.Fowler, ...pools.AVC.Central].map(t => t.captain);
  const nvcCaptains = [...pools.NVC.Dobbs, ...pools.NVC.Extreme].map(t => t.captain);

  // Track umpire counts per captain
  const umpireCount = {};
  [...avcCaptains, ...nvcCaptains].forEach(c => umpireCount[c] = 0);

  // Group real games by time slot
  const byTime = {};
  schedule.filter(g => !g.isBreak).forEach(g => {
    if (!byTime[g.time]) byTime[g.time] = [];
    byTime[g.time].push(g);
  });

  // Assign umpires: AVC game → AVC captain, NVC game → NVC captain
  Object.keys(byTime).sort((a,b) => +a - +b).forEach(t => {
    const games = byTime[t];
    const busyCaps = new Set(games.flatMap(g => [g.homeCap, g.awayCap]));

    // Build available pools per conference (not playing, sorted by fewest duties)
    const availAVC = shuffle(avcCaptains.filter(c => !busyCaps.has(c)))
      .sort((a,b) => umpireCount[a] - umpireCount[b]);
    const availNVC = shuffle(nvcCaptains.filter(c => !busyCaps.has(c)))
      .sort((a,b) => umpireCount[a] - umpireCount[b]);

    // Track how many from each pool we've used this slot
    let avcIdx = 0, nvcIdx = 0;

    games.forEach(g => {
      const isAVC = g.tag.includes('AVC');
      let ump;
      if (isAVC) {
        ump = availAVC[avcIdx++] || availAVC[0] || '—';
      } else {
        ump = availNVC[nvcIdx++] || availNVC[0] || '—';
      }
      g.umpire = ump;
      if (ump !== '—') umpireCount[ump]++;
    });
  });

  return schedule;
}

function computePoolStandings(poolTeams, poolTag, schedule, gameScores) {
  const stats = {};
  poolTeams.forEach(t => { stats[t.name] = { name:t.name, cap:t.captain, w:0, l:0, pf:0, pa:0, gp:0 }; });
  schedule.filter(g => g.phase === 'p1' && g.tag === poolTag).forEach(g => {
    const s = gameScores[g.id] || {};
    const hS = s.home === '' || s.home === undefined ? null : +s.home;
    const aS = s.away === '' || s.away === undefined ? null : +s.away;
    if (hS === null || aS === null || !stats[g.home] || !stats[g.away]) return;
    stats[g.home].gp++; stats[g.away].gp++;
    stats[g.home].pf += hS; stats[g.home].pa += aS;
    stats[g.away].pf += aS; stats[g.away].pa += hS;
    if (hS > aS) { stats[g.home].w++; stats[g.away].l++; }
    else if (aS > hS) { stats[g.away].w++; stats[g.home].l++; }
  });
  return Object.values(stats).sort((a,b) => (b.w-a.w) || ((b.pf-b.pa)-(a.pf-a.pa)) || b.pf-a.pf || coinFlip(a.name,b.name));
}

function computeWildcardStandings(div, pools, schedule, gameScores) {
  const divTeams = FVL_TEAMS.filter(t => getDiv(t.captain) === div);
  const poolTag1 = div === 'AVC' ? 'Fowler · AVC' : 'Dobbs · NVC';
  const poolTag2 = div === 'AVC' ? 'Central · AVC' : 'Extreme · NVC';
  const wcTag = `Wildcard · ${div}`;
  const stats = {};
  divTeams.forEach(t => { stats[t.name] = { name:t.name, cap:t.captain, w:0, l:0, pf:0, pa:0 }; });

  schedule.filter(g => g.phase === 'p1' && (g.tag === poolTag1 || g.tag === poolTag2)).forEach(g => {
    const s = gameScores[g.id] || {};
    const hS = s.home===''||s.home===undefined ? null : +s.home;
    const aS = s.away===''||s.away===undefined ? null : +s.away;
    if (hS===null||aS===null||!stats[g.home]||!stats[g.away]) return;
    stats[g.home].pf+=hS; stats[g.home].pa+=aS;
    stats[g.away].pf+=aS; stats[g.away].pa+=hS;
    if (hS>aS){stats[g.home].w++;stats[g.away].l++;}
    else if(aS>hS){stats[g.away].w++;stats[g.home].l++;}
  });
  schedule.filter(g => g.phase === 'p2' && g.tag === wcTag).forEach(g => {
    const s = gameScores[g.id] || {};
    const hS = s.home===''||s.home===undefined ? null : +s.home;
    const aS = s.away===''||s.away===undefined ? null : +s.away;
    if (hS===null||aS===null||!stats[g.home]||!stats[g.away]) return;
    stats[g.home].pf+=hS; stats[g.home].pa+=aS;
    stats[g.away].pf+=aS; stats[g.away].pa+=hS;
    if (hS>aS){stats[g.home].w++;stats[g.away].l++;}
    else if(aS>hS){stats[g.away].w++;stats[g.home].l++;}
  });

  const pool1Teams = div==='AVC' ? pools.AVC.Fowler : pools.NVC.Dobbs;
  const pool2Teams = div==='AVC' ? pools.AVC.Central : pools.NVC.Extreme;
  const pool1St = computePoolStandings(pool1Teams, poolTag1, schedule, gameScores);
  const pool2St = computePoolStandings(pool2Teams, poolTag2, schedule, gameScores);
  const autoQual = new Set();
  if (pool1St.length) autoQual.add(pool1St[0].name);
  if (pool2St.length) autoQual.add(pool2St[0].name);

  const sorted = Object.values(stats).sort((a,b) => (b.w-a.w)||((b.pf-b.pa)-(a.pf-a.pa))||b.pf-a.pf||coinFlip(a.name,b.name));
  const eligible = sorted.filter(t => !autoQual.has(t.name));
  const wildcards = new Set(eligible.slice(0,2).map(t=>t.name));
  return { sorted, autoQual, wildcards };
}

function getBracketSeeds(div, pools, schedule, gameScores) {
  const { sorted, autoQual, wildcards } = computeWildcardStandings(div, pools, schedule, gameScores);
  const bracketTeams = sorted.filter(t => autoQual.has(t.name) || wildcards.has(t.name));
  return bracketTeams.map((t,i) => ({
    seed: i+1, name: t.name, captain: t.cap, w: t.w, l: t.l,
    isAuto: autoQual.has(t.name), isWC: wildcards.has(t.name)
  }));
}

// ── SHARED HTML FRAGMENTS ───────────────────────────────

function renderPoolStandingsHTML(pools, schedule, gameScores) {
  const poolDefs = [
    {teams:pools.AVC.Fowler, tag:'Fowler · AVC',  label:'Fowler Pool',  color:'#f5c842', conf:'AVC'},
    {teams:pools.AVC.Central,tag:'Central · AVC', label:'Central Pool', color:'#e8a820', conf:'AVC'},
    {teams:pools.NVC.Dobbs,  tag:'Dobbs · NVC',   label:'Dobbs Pool',   color:'#42b8f5', conf:'NVC'},
    {teams:pools.NVC.Extreme,tag:'Extreme · NVC', label:'Extreme Pool', color:'#20a0e8', conf:'NVC'},
  ];
  let html = '<div class="standings-wrap">';
  poolDefs.forEach(pd => {
    const st = computePoolStandings(pd.teams, pd.tag, schedule, gameScores);
    html += `<div class="standing-block">
      <div class="standing-header">
        <span class="standing-pool-name" style="color:${pd.color}">${pd.label}</span>
        <span class="standing-sub">${pd.conf}</span>
      </div>
      <table class="st-table">
        <tr><th class="left">#</th><th class="left">Team</th><th>W</th><th>L</th><th>PF</th><th>PA</th><th>+/−</th></tr>
        ${st.map((t,i) => {
          const isQual = i===0, diff = t.pf-t.pa;
          return `<tr class="${isQual?'st-row-qual':''}">
            <td class="pos">${i+1}</td>
            <td class="left">${t.name}${isQual?'<span class="qual-badge">AUTO</span>':''}<br><span class="cap">${t.cap}</span></td>
            <td class="pts">${t.w}</td><td>${t.l}</td>
            <td>${t.pf}</td><td>${t.pa}</td>
            <td class="${diff>=0?'pts':''}">${diff>=0?'+':''}${diff}</td>
          </tr>`;
        }).join('')}
      </table>
    </div>`;
  });
  return html + '</div>';
}

function renderWildcardHTML(pools, schedule, gameScores) {
  let html = `<div style="margin-top:4px">
    <div class="wc-section-title">Wildcard Race</div>
    <div class="wc-section-sub">Combined Phase 1 + Phase 2 record · 2 wildcard spots per division · auto-qualified teams are already in and do not compete for wildcard spots</div>
    <div class="wc-conf-grid">`;

  ['AVC','NVC'].forEach(div => {
    const { sorted, autoQual, wildcards } = computeWildcardStandings(div, pools, schedule, gameScores);
    const conf = div==='AVC' ? 'avc' : 'nvc';
    const qualTeams = sorted.filter(t => autoQual.has(t.name));
    const raceTeams = sorted.filter(t => !autoQual.has(t.name));

    html += `<div class="wc-conf-card ${conf}">
      <div class="wc-conf-hdr">
        <span class="wc-conf-name">${div}</span>
        <span class="wc-conf-note">2 wildcard spots open</span>
      </div>`;

    if (qualTeams.length > 0) {
      html += `<div class="wc-divider" style="background:var(--avc-bg);border-bottom:1px solid var(--border)">
        <span style="color:var(--avc);font-weight:500">✓ Pool winners — already qualified</span>
        <span>Not in wildcard race</span>
      </div>`;
      qualTeams.forEach(t => {
        const diff = t.pf - t.pa;
        html += `<div class="wc-team-card is-qual">
          <div class="wc-status-bar"></div>
          <div class="wc-rank" style="font-size:11px;color:var(--avc);padding:0 4px;display:flex;align-items:center">✓</div>
          <div class="wc-team-body">
            <div class="wc-team-name">${t.name}</div>
            <div class="wc-captain">${t.cap}</div>
            <span class="wc-status-tag wc-tag-qual">Pool winner · Auto-qualified</span>
          </div>
          <div class="wc-stats">
            <div class="wc-record">${t.w}–${t.l}</div>
            <div class="wc-diff ${diff>=0?'pos':'neg'}">${diff>=0?'+':''}${diff}</div>
          </div>
        </div>`;
      });
    } else {
      html += `<div class="wc-divider" style="background:var(--surface2)"><span>Pool play in progress</span></div>`;
    }

    html += `<div class="wc-divider wildcard-line">
      <span>▼ Wildcard race — ${raceTeams.length} teams · 2 spots</span>
      <span>Ranked by combined record</span>
    </div>`;

    let cutlineDone = false;
    raceTeams.forEach((t,i) => {
      const isWC = wildcards.has(t.name);
      const diff = t.pf - t.pa;
      const diffClass = diff>0?'pos':diff<0?'neg':'';
      if (i===2 && !cutlineDone) {
        cutlineDone = true;
        html += `<div class="wc-cutline"><div class="wc-cutline-line"></div><span class="wc-cutline-label">cutline</span><div class="wc-cutline-line"></div></div>`;
      }
      html += `<div class="wc-team-card ${isWC?'is-wc':'is-out'}">
        <div class="wc-status-bar"></div>
        <div class="wc-rank">${i+1}</div>
        <div class="wc-team-body">
          <div class="wc-team-name">${t.name}</div>
          <div class="wc-captain">${t.cap}</div>
          ${isWC?'<span class="wc-status-tag wc-tag-wc">Wildcard ✓</span>':'<span class="wc-status-tag wc-tag-out">Eliminated</span>'}
        </div>
        <div class="wc-stats">
          <div class="wc-record">${t.w}–${t.l}</div>
          <div class="wc-diff ${diffClass}">${diff>=0?'+':''}${diff}</div>
        </div>
      </div>`;
    });
    html += '</div>';
  });

  html += `</div>
    <div class="wc-legend">
      <div class="wc-leg-item"><div class="wc-leg-dot" style="background:var(--avc)"></div>Pool winner — auto-qualified</div>
      <div class="wc-leg-item"><div class="wc-leg-dot" style="background:#f5a042"></div>Wildcard spot (top 2 of race)</div>
      <div class="wc-leg-item"><div class="wc-leg-dot" style="background:var(--border)"></div>Below cutline</div>
    </div>
  </div>`;
  return html;
}
