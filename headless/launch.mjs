// Launch a full batch: coordinator + N workers + dashboard, all children of this
// process (Ctrl+C tears the whole thing down). Resumable: re-launching the same
// batch continues where it stopped (bins rebuild from results/<batch>.jsonl).
//
// Usage: node launch.mjs <settings.json> <batchName> [numWorkers]
// Env passthroughs: MIN_N, MAX_N, CI_TARGET, RESUME_FROM (semicolon-separated jsonl paths)
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS = process.argv[2], BATCH = process.argv[3];
const N = parseInt(process.argv[4] || String(Math.max(2, os.cpus().length - 2)));
if (!SETTINGS || !BATCH) { console.error('usage: node launch.mjs <settings.json> <batchName> [numWorkers]'); process.exit(1); }

const kids = [];
function child(name, args, extraEnv = {}) {
    const ch = spawn('node', args, { cwd: HERE, env: { ...process.env, ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'] });
    ch.stdout.on('data', d => process.stdout.write(`[${name}] ${d}`));
    ch.stderr.on('data', d => process.stderr.write(`[${name}!] ${d}`));
    ch.on('close', c => console.log(`[${name}] exited (${c})`));
    kids.push(ch);
    return ch;
}

child('coord', ['coordinator.mjs', SETTINGS, BATCH]);
setTimeout(() => {
    child('dash', ['dashboard.mjs']);
    for (let i = 1; i <= N; i++) child(`w${i}`, ['worker.mjs', 'http://localhost:8090', `w${i}`]);
    console.log(`launched coordinator (:8090) + dashboard (http://127.0.0.1:8091) + ${N} workers — batch '${BATCH}'`);
}, 1200);

process.on('SIGINT', () => { for (const k of kids) k.kill(); process.exit(0); });
