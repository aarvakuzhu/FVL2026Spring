const { MongoClient } = require('mongodb');
const fs = require('fs');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

const state = JSON.parse(fs.readFileSync('./state_restore.json', 'utf8'));

(async () => {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('supervolley');
  
  // Preserve the existing _token from MongoDB — don't overwrite it
  const existing = await db.collection('state').findOne({ _id: 'tournament' });
  if (existing?._token) {
    state._token = existing._token;
    console.log('✅ Preserved existing auth token');
  }
  
  state.lastUpdated = new Date().toISOString();
  
  await db.collection('state').replaceOne(
    { _id: 'tournament' },
    { _id: 'tournament', ...state },
    { upsert: true }
  );
  
  console.log('✅ State restored to MongoDB');
  console.log(`   locked: ${state.locked}`);
  console.log(`   Schedule games: ${state.schedule.length}`);
  console.log(`   Wildcard games: ${state.schedule.filter(g => g.phase === 'p2').length}`);
  
  // Verify
  const doc = await db.collection('state').findOne({ _id: 'tournament' });
  const wc = doc.schedule.filter(g => g.phase === 'p2');
  console.log('\nWildcard games now in MongoDB:');
  wc.forEach(g => console.log(`  ${g.id} C${g.court}: ${g.home} vs ${g.away} | ${g.umpire}`));
  
  await client.close();
})().catch(e => { console.error(e); process.exit(1); });
