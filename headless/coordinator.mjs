// PopGenSim (MAAD) — coordinator. Design adapted from Domestication's coordinator2.mjs
// (adaptive, settings-driven, resumable), simplified: local JSONL store instead of Mongo.
//
// Holds a list of SETTINGS (bins); workers /claim the next rep of the shallowest
// unfinished bin (fewest-reps-first keeps coverage balanced). On /complete the run is
// appended to results/<batch>.jsonl and the bin's extinction stats update; a bin is
// FINISHED when n >= MIN_N and the Wilson CI half-width on P(extinct) <= CI_TARGET
// (or n >= MAX_N). Fully resumable: bins rebuild from the JSONL on startup, so a
// killed batch loses nothing and already-run pilot data counts toward bins.
//
// Rep seeds are DETERMINISTIC: seed = fnv1a(binId) ^ (rep * 2654435761), so any rep
// anywhere is reproducible from (binId, rep) alone.
//
// Usage: node coordinator.mjs <settings.json> <batchName>
// Env:   PORT (8090), MIN_N (10), MAX_N (40), CI_TARGET (0.15)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_FILE = process.argv[2];
const BATCH = process.argv[3];
const PORT = parseInt(process.env.PORT || '8090');
const MIN_N = parseInt(process.env.MIN_N || '10');
const MAX_N = parseInt(process.env.MAX_N || '40');
const CI_TARGET = parseFloat(process.env.CI_TARGET || '0.15');
if (!SETTINGS_FILE || !BATCH) { console.error('usage: node coordinator.mjs <settings.json> <batchName>'); process.exit(1); }

const RESULTS = path.join(HERE, 'results', BATCH + '.jsonl');
fs.mkdirSync(path.dirname(RESULTS), { recursive: true });

// stable stringify → setting key (order-independent)
export function settingKey(cfg) {
    const sort = (o) => o && typeof o === 'object' && !Array.isArray(o)
        ? Object.fromEntries(Object.keys(o).sort().map(k => [k, sort(o[k])]))
        : o;
    return JSON.stringify(sort({ epoch: cfg.epoch, overrides: cfg.overrides, environmentPatterns: cfg.environmentPatterns }));
}
function fnv1a(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }
const repSeed = (binId, rep) => (fnv1a(binId) ^ Math.imul(rep, 2654435761)) >>> 0;

// Wilson CI on extinction proportion
function evaluate(bin) {
    const n = bin.outcomes.length;
    if (n === 0) return { n, pHat: null, ciHalf: null, enough: false, nNeeded: MIN_N };
    const x = bin.outcomes.filter(o => o.extinct).length;
    const z = 1.96, p = x / n;
    const denom = 1 + z * z / n;
    const center = (p + z * z / (2 * n)) / denom;
    const half = (z / denom) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
    const enough = n >= MIN_N && half <= CI_TARGET;
    const nNeeded = Math.ceil(z * z * Math.max(p * (1 - p), 0.05) / (CI_TARGET * CI_TARGET));
    const ext = bin.outcomes.filter(o => o.extinct).map(o => o.extinctAt);
    const meanTTE = ext.length ? ext.reduce((a, b) => a + b, 0) / ext.length : null;
    return { n, pHat: p, ciHalf: half, enough, nNeeded, meanTTE };
}
function assess(bin) {
    bin.ev = evaluate(bin);
    bin.finished = (bin.ev.enough || bin.outcomes.length >= MAX_N);
}

// ---- bins from settings ----
// strip a UTF-8 BOM — PowerShell's Out-File loves to add one
const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8').replace(/^﻿/, ''));
const bins = [], byKey = new Map(), byId = new Map();
for (const s of settings) {
    const key = settingKey(s.config);
    const bin = { id: s.id, config: s.config, key, meta: s.meta ?? {}, outcomes: [], dispatched: 0, finished: false, ev: null };
    bins.push(bin); byKey.set(key, bin); byId.set(s.id, bin);
}

// ---- resumable: rebuild from the batch JSONL (and any extra JSONLs passed via RESUME_FROM) ----
function rebuild() {
    const sources = [RESULTS, ...(process.env.RESUME_FROM ? process.env.RESUME_FROM.split(';') : [])]
        .filter(f => f && fs.existsSync(f));
    let used = 0, seen = 0;
    for (const src of sources) {
        for (const line of fs.readFileSync(src, 'utf8').split('\n')) {
            if (!line.trim()) continue; seen++;
            let r; try { r = JSON.parse(line); } catch { continue; }
            const bin = byKey.get(settingKey(r.cfg)); if (!bin) continue;
            bin.outcomes.push({ extinct: !r.survived, extinctAt: r.extinctAt, seed: r.cfg.seed, run: r.run });
            used++;
            // copy foreign-source lines into this batch's results so the store is complete
            if (src !== RESULTS) fs.appendFileSync(RESULTS, line + '\n');
        }
    }
    for (const bin of bins) { bin.dispatched = bin.outcomes.length; assess(bin); }
    const fin = bins.filter(b => b.finished).length;
    console.log(`coordinator: ${bins.length} settings; rebuilt from ${seen} stored runs (${used} matched) -> ${fin} finished, ${bins.length - fin} active (MIN_N=${MIN_N}, MAX_N=${MAX_N}, CI±${CI_TARGET})`);
}

function nextBin() {
    let best = null;
    for (const b of bins) { if (b.finished) continue; if (!best || b.dispatched < best.dispatched) best = b; }
    return best;
}

const workers = new Map(), recent = [], startedAt = Date.now();
let completed = 0;
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(obj)); };
const readBody = req => new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => r(d ? JSON.parse(d) : {})); });

const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'); const p = u.pathname;

    if (req.method === 'GET' && p === '/claim') {
        const bin = nextBin();
        if (!bin) return json(res, 200, { done: true });
        bin.dispatched++;
        const rep = bin.dispatched;
        const id = `${bin.id}_r${String(rep).padStart(3, '0')}`;
        const cfg = { ...JSON.parse(JSON.stringify(bin.config)), seed: repSeed(bin.id, rep) };
        const w = u.searchParams.get('worker');
        if (w) workers.set(w, { ...(workers.get(w) || {}), worker: w, runId: id, runStart: Date.now(), lastBeat: Date.now() });
        return json(res, 200, { id, binId: bin.id, config: cfg });
    }

    if (req.method === 'POST' && p === '/complete') {
        const b = await readBody(req);
        const bin = byId.get(b.binId);
        if (b.result) {
            b.result.run = b.id;
            fs.appendFileSync(RESULTS, JSON.stringify(b.result) + '\n');
            if (bin) { bin.outcomes.push({ extinct: !b.result.survived, extinctAt: b.result.extinctAt, seed: b.result.cfg.seed, run: b.id }); assess(bin); }
        }
        completed++;
        const wk = workers.get(b.worker);
        recent.unshift({ id: b.id, extinct: b.result ? !b.result.survived : null, extinctAt: b.result?.extinctAt ?? null, durationMs: wk?.runStart ? Date.now() - wk.runStart : null });
        recent.length = Math.min(recent.length, 20);
        return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && p === '/error') {
        const b = await readBody(req);
        const bin = byId.get(b.binId);
        if (bin) bin.dispatched = Math.max(bin.outcomes.length, bin.dispatched - 1);   // hand the rep back out
        console.error(`worker error on ${b.id}: ${b.error}`);
        return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && p === '/heartbeat') {
        const b = await readBody(req);
        const prev = workers.get(b.worker) || {};
        const runStart = (prev.runId === b.runId && prev.runStart) ? prev.runStart : Date.now();
        workers.set(b.worker, { ...prev, ...b, runStart, lastBeat: Date.now() });
        return json(res, 200, { ok: true });
    }

    if (req.method === 'GET' && p === '/status') {
        const done = bins.filter(b => b.finished).length;
        const reps = bins.reduce((a, b) => a + b.outcomes.length, 0);
        const ws = [...workers.values()].filter(w => Date.now() - w.lastBeat < 120000)
            .map(w => ({ worker: w.worker, runId: w.runId, gen: w.gen || 0, epoch: w.epoch || 0, age: Math.round((Date.now() - w.lastBeat) / 1000), onRunSec: w.runStart ? Math.round((Date.now() - w.runStart) / 1000) : 0 }));
        return json(res, 200, {
            batch: BATCH, counts: { total: bins.length, done, pending: bins.length - done, reps, running: ws.filter(w => w.runId).length },
            workers: ws, recent, completed, startedAt, done: done === bins.length,
            bins: bins.map(b => ({
                id: b.id, meta: b.meta, n: b.outcomes.length, finished: b.finished,
                pExtinct: b.ev?.pHat, ciHalf: b.ev?.ciHalf, meanTTE: b.ev?.meanTTE, nNeeded: b.ev?.nNeeded,
            })),
        });
    }
    json(res, 200, { ok: true });
});

rebuild();
server.listen(PORT, '127.0.0.1', () => console.log(`PopGenSim coordinator on 127.0.0.1:${PORT} — batch '${BATCH}', ${bins.length} settings`));
