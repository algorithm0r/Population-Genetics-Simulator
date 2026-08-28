// import-mongo.mjs — push finished batch JSONLs into the shared Mongo
// (populationGeneticsDB, collection maad_<batch>). Idempotent: a collection whose
// count already matches the file's line count is skipped; a partial collection is
// reported and skipped unless FORCE=1 (which appends the difference is NOT attempted —
// re-import into a clean collection instead, or drop it server-side first).
//
// Usage: node import-mongo.mjs results/pilot1x.jsonl [results/bracket1.jsonl ...]
//        node import-mongo.mjs all        (every results/*.jsonl)
import fs from 'node:fs';
import path from 'node:path';
import { connect, insertMany, count, derived, MONGO_DB, MONGO_URL } from './mongo.mjs';

const args = process.argv.slice(2);
const files = args[0] === 'all'
    ? fs.readdirSync('results').filter(f => f.endsWith('.jsonl')).map(f => path.join('results', f))
    : args;
if (!files.length) { console.error('usage: node import-mongo.mjs <results/x.jsonl ...> | all'); process.exit(1); }

const CHUNK = 25;
const socket = connect();
socket.on('connect', async () => {
    console.log(`connected to ${MONGO_URL} (db ${MONGO_DB})`);
    for (const file of files) {
        const batch = path.basename(file, '.jsonl');
        const coll = `maad_${batch}`;
        const lines = fs.readFileSync(file, 'utf8').split('\n').filter(l => l.trim());
        const existing = await count(socket, coll);
        if (existing === null) { console.log(`${coll}: count timed out — skipping`); continue; }
        if (existing >= lines.length) { console.log(`${coll}: already complete (${existing} >= ${lines.length}) — skip`); continue; }
        if (existing > 0) { console.log(`${coll}: PARTIAL (${existing}/${lines.length}) — skipping (drop server-side and re-run to fix)`); continue; }
        let inserted = 0, failed = 0;
        for (let i = 0; i < lines.length; i += CHUNK) {
            const docs = lines.slice(i, i + CHUNK).map(l => { const r = JSON.parse(l); return { ...r, ...derived(r, batch) }; });
            const res = await insertMany(socket, coll, docs);
            if (res.ok) inserted += docs.length; else { failed += docs.length; console.log(`  chunk @${i} failed: ${res.reason}`); }
        }
        console.log(`${coll}: inserted ${inserted}/${lines.length}${failed ? ` (${failed} FAILED)` : ''}`);
    }
    const verify = [];
    for (const file of files) {
        const batch = path.basename(file, '.jsonl');
        const n = await count(socket, `maad_${batch}`);
        verify.push(`maad_${batch}=${n}`);
    }
    console.log('final counts: ' + verify.join(', '));
    process.exit(0);
});
socket.on('connect_error', e => { console.error('connect_error:', e.message); process.exit(1); });
