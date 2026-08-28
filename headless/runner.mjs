// PopGenSim (MAAD) — headless runner
// Loads the EXACT browser sim files into the main V8 realm (indirect eval, per
// conventions §4 — never fork the sim core). Stubs the view layer only.
// Seeded RNG (mulberry32 overriding Math.random) makes every run reproducible.
//
// Usage:  node runner.mjs --config path/to/config.json [--out path/to/out.jsonl]
//   or import { loadSim, runOne } from './runner.mjs' (used by sweep.mjs)

import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SIM_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');

// ───────────────────────── seeded RNG ─────────────────────────
// mulberry32; (x+0.5)/2^32 keeps output strictly in (0,1) — Box-Muller in
// util.js takes log(u1), so u1 === 0 (possible with plain Math.random) is a
// latent NaN bug we must not reproduce here.
export function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967296);
    };
}

// ───────────────────── sim-core loading ───────────────────────
// Browser <script> order, minus view/engine files (gameengine, assetmanager,
// graphs, histogram, main) which are stubbed below.
const SIM_FILES = [
    'util.js',
    'params.js',
    'environmentalPatterns.js',
    'gene.js',
    'organism.js',
    'population.js',
    'automata.js',
    'datamanager.js',
];

// Top-level const/let/class don't attach to globalThis under indirect eval;
// loadSim transforms them to var-bindings (conventions scaffold rule). Only
// lines starting at column 0 are touched, so function-local declarations are safe.

let PRISTINE = null;

export function loadSim() {
    // view-layer stubs — the sim core references these but never needs them headless
    globalThis.Graph = class { constructor() { } draw() { } };
    globalThis.Histogram = class { constructor() { } draw() { } };
    globalThis.socket = null;
    globalThis.window = { io: undefined };
    globalThis.document = {
        getElementById: () => ({ checked: false, value: '0', classList: { add() { }, remove() { } } }),
    };
    globalThis.gameEngine = null; // fresh per run

    for (const f of SIM_FILES) {
        let src = readFileSync(join(SIM_DIR, f), 'utf8');
        src = src.replace(/^const /gm, 'var ')
            .replace(/^let /gm, 'var ')
            .replace(/^class (\w+)/gm, 'var $1 = class $1');
        (0, eval)(src); // indirect eval → main realm, non-strict → vars attach to globalThis
    }
    PRISTINE = JSON.parse(JSON.stringify(globalThis.PARAMS));
}

// ───────────────────────── statistics ─────────────────────────
function mean(xs) { return xs.reduce((a, b) => a + b, 0) / xs.length; }
function variance(xs, m) { return xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length; }

// Read-only snapshot of the whole grid. Also computes the realized selection
// differential on GENOTYPE: S_g = cov(g, w)/mean(w) with w the sim's own
// expected-offspring formula on the CURRENT phenotype — the direct measurement
// of shielding (S_g → 0 as plasticity hides genotypes from selection).
function snapshot(automata) {
    const orgs = [];
    let target = null;
    for (const row of automata.grid) for (const cell of row) {
        target = cell.target; // single-cell pilots: one target; multi-cell: last cell's (recorded per-cell below)
        for (const o of cell.currentPopulation) orgs.push({ g: o.genotype, p: o.phenotype, t: cell.target });
    }
    if (orgs.length === 0) return { n: 0 };
    const gs = orgs.map(o => o.g), ps = orgs.map(o => o.p);
    const mg = mean(gs), mp = mean(ps);
    const P = globalThis.PARAMS;
    const ws = orgs.map(o => Math.max(P.maxOffspring * Math.exp(-Math.abs(o.p - o.t) / P.reproductionVariance), 0));
    const mw = mean(ws);
    const covGW = orgs.reduce((a, o, i) => a + (o.g - mg) * (ws[i] - mw), 0) / orgs.length;
    // lags as mean per-organism deviation from the organism's OWN cell target — correct
    // on spatial gradients (identical to mg - target on a 1×1 grid)
    const gLag = mean(orgs.map(o => o.g - o.t)), pLag = mean(orgs.map(o => o.p - o.t));
    // occupancy centroid (population-weighted mean column) — range-shift tracking
    let wCol = 0, wRow = 0, occupied = 0;
    for (const row of automata.grid) for (const cell of row) {
        const nc = cell.currentPopulation.length;
        if (nc > 0) { occupied++; wCol += nc * cell.col; wRow += nc * cell.row; }
    }
    return {
        n: orgs.length,
        target,
        meanGeno: mg, varGeno: variance(gs, mg),
        meanPheno: mp, varPheno: variance(ps, mp),
        genoLag: gLag, phenoLag: pLag,
        selDiffGeno: mw > 0 ? covGW / mw : 0,
        cellsOccupied: occupied,
        centroidCol: wCol / orgs.length, centroidRow: wRow / orgs.length,
    };
}

// ───────────────────────── single run ─────────────────────────
// cfg: { seed, epoch, reportEvery, overrides: {PARAMS fields}, environmentPatterns: {...} }
// async: yields to the event loop every 2000 generations so worker heartbeats (and any
// other timers) can fire during multi-minute runs — a synchronous loop starves them.
export async function runOne(cfg) {
    Math.random = mulberry32(cfg.seed);

    const P = globalThis.PARAMS;
    for (const k of Object.keys(P)) delete P[k];
    Object.assign(P, JSON.parse(JSON.stringify(PRISTINE)), cfg.overrides ?? {});
    P.environmentPatterns = JSON.parse(JSON.stringify(cfg.environmentPatterns));

    globalThis.gameEngine = {
        automata: null, click: null, entities: [], graphs: [],
        addEntity(e) { this.entities.push(e); },
        addGraph() { },
    };

    const automata = new globalThis.Automata();
    const series = [];
    let extinctAt = null;

    const t0 = Date.now();
    // Event-loop yield budget: yield after ~1M organism-updates rather than a fixed
    // generation count — a fixed 2000-gen stride starves heartbeats for minutes on
    // big spatial runs (24 cells x ~11k organisms), making live workers invisible to
    // the coordinator's 120s staleness filter (observed 2026-08-28, timing2).
    let updateBudget = 0, lastN = 1000;              // lastN: population estimate, refreshed at each report
    for (let gen = 1; gen <= cfg.epoch; gen++) {
        automata.nextGeneration();
        if (gen % cfg.reportEvery === 0 || gen === cfg.epoch) {
            const s = snapshot(automata);
            series.push({ gen, ...s });
            if (cfg.onTick) cfg.onTick(gen, s.n);   // progress hook (worker heartbeats)
            if (s.n === 0) { extinctAt = gen; break; }
            lastN = Math.max(s.n, 1);
        }
        updateBudget += lastN;
        if (updateBudget >= 1_000_000) { updateBudget = 0; await new Promise(r => setImmediate(r)); }
    }
    const wallMs = Date.now() - t0;

    return {
        project: 'PopGenSim',
        cfg: { seed: cfg.seed, epoch: cfg.epoch, reportEvery: cfg.reportEvery, overrides: cfg.overrides, environmentPatterns: cfg.environmentPatterns },
        PARAMS: JSON.parse(JSON.stringify(P)), // reproducibility rule: PARAMS verbatim in every packet
        extinctAt, survived: extinctAt === null, wallMs,
        series,
    };
}

// ───────────────────────── CLI mode ─────────────────────────
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : []).filter(x => x.length));
    const cfg = JSON.parse(readFileSync(args.config, 'utf8'));
    loadSim();
    const result = await runOne(cfg);
    const out = args.out ?? 'out/run.jsonl';
    appendFileSync(out, JSON.stringify(result) + '\n');
    console.log(`PopGenSim run seed=${cfg.seed} ${result.survived ? 'SURVIVED' : 'extinct@' + result.extinctAt} wall=${result.wallMs}ms → ${out}`);
}
