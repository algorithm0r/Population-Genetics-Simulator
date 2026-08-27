// PopGenSim (MAAD) — worker. Claims reps from the coordinator, runs them IN-PROCESS
// (loadSim once, runOne per claim — no child-process spawn; the sim core is pure JS),
// posts results back. One worker process per core; launch.mjs spawns N.
//
// Usage: node worker.mjs [coordinatorURL] [workerId]
// Env: PERSIST=1 → idle-poll on empty queue instead of exiting.
import os from 'node:os';
import { loadSim, runOne } from './runner.mjs';

const COORD = process.argv[2] ?? 'http://localhost:8090';
const WID = process.argv[3] ?? `${os.hostname()}-${process.pid}`;
const PERSIST = process.env.PERSIST === '1';
const IDLE_POLL = 7000;

let current = null, gen = 0, epoch = 0, pop = 0;
const getJSON = p => fetch(COORD + p).then(r => r.json());
const post = (p, obj) => fetch(COORD + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }).then(r => r.json()).catch(() => { });

const beat = setInterval(() => post('/heartbeat', { worker: WID, pid: process.pid, runId: current, gen, epoch, pop }), 15000);
beat.unref();

loadSim();
console.log(`[${WID}] -> ${COORD}`);

while (true) {
    let claim;
    try { claim = await getJSON(`/claim?worker=${encodeURIComponent(WID)}`); }
    catch { await new Promise(r => setTimeout(r, 5000)); continue; }   // coordinator down: wait & retry
    if (claim.done) {
        if (PERSIST) { await new Promise(r => setTimeout(r, IDLE_POLL)); continue; }
        console.log(`[${WID}] queue empty, done`); break;
    }
    current = claim.id; gen = 0; epoch = claim.config.epoch; pop = 0;
    try {
        const result = runOne({ ...claim.config, onTick: (g, n) => { gen = g; pop = n; } });
        await post('/complete', { id: claim.id, binId: claim.binId, worker: WID, result });
        console.log(`[${WID}] ${claim.id} ${result.survived ? 'SURVIVED' : 'extinct@' + result.extinctAt} (${Math.round(result.wallMs / 1000)}s)`);
    } catch (e) {
        await post('/error', { id: claim.id, binId: claim.binId, worker: WID, error: String(e) });
        console.log(`[${WID}] ERROR ${claim.id}: ${e}`);
    }
    current = null;
}
process.exit(0);
