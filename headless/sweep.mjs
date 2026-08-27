// Pilot 1 — single-population replication of the shielding result (DEVPLAN Phase 0a).
// Question: does the preliminary slide finding (plasticity → extinction sooner /
// lower critical rate) replicate under seeded, replicated conditions, and what do
// the mechanism traces (genetic variance, genotypic lag, selection differential
// on genotype) show?
//
// Design: single cell, no migration, cue noise 0 (per Chris→Jobran Apr 2025:
// "plasticity is always adaptive on current settings").
//   plasticity (adaptiveStepSize) ∈ {0, 0.5}
//   linear changeRate ∈ {0, 100, 140, 160, 170, 180, 200, 240, 300}  (units per 10k gens)
//   seeds 1..10, epoch 50k gens
// Run name grammar: pilot1_p{step}_r{rate}_s{seed}
//
// Usage: node sweep.mjs   (writes out/pilot1.jsonl + out/pilot1_summary.csv)

import { loadSim, runOne } from './runner.mjs';
import { mkdirSync, appendFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';

const OUT_DIR = 'out';
const OUT = `${OUT_DIR}/pilot1.jsonl`;
const SUMMARY = `${OUT_DIR}/pilot1_summary.csv`;
mkdirSync(OUT_DIR, { recursive: true });
for (const f of [OUT, SUMMARY]) if (existsSync(f)) unlinkSync(f);

const BASE = {
    numRows: 1, numCols: 1,
    offspringMigrationChance: 0, adultMigrationChance: 0,
    targetObservationalNoise: 0, sexualReproduction: false,
};
const env = (rate) => ({
    spatial: { type: 'uniform', parameters: { baseEnvironment: 0 } },
    temporal: rate === 0
        ? { type: 'static', parameters: {} }
        : { type: 'linear', parameters: { changeRate: rate } },
});

const PLASTICITY = [0, 0.5];
const RATES = [0, 100, 140, 160, 170, 180, 200, 240, 300];
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const EPOCH = 50000, REPORT = 250;

loadSim();
writeFileSync(SUMMARY, 'run,plasticity,rate,seed,survived,extinctAt,finalN,finalVarGeno,finalGenoLag,meanSelDiff,wallMs\n');

const total = PLASTICITY.length * RATES.length * SEEDS.length;
let done = 0;
const t0 = Date.now();

for (const p of PLASTICITY) for (const rate of RATES) for (const seed of SEEDS) {
    const run = `pilot1_p${p}_r${rate}_s${seed}`;
    const result = runOne({
        seed, epoch: EPOCH, reportEvery: REPORT,
        overrides: { ...BASE, adaptiveStepSize: p },
        environmentPatterns: env(rate),
    });
    result.run = run;
    appendFileSync(OUT, JSON.stringify(result) + '\n');

    const last = result.series.at(-1);
    const alive = result.series.filter(s => s.n > 0);
    const meanSel = alive.length ? alive.reduce((a, s) => a + Math.abs(s.selDiffGeno ?? 0), 0) / alive.length : 0;
    appendFileSync(SUMMARY, [run, p, rate, seed, result.survived, result.extinctAt ?? '',
        last.n, last.varGeno?.toFixed(4) ?? '', last.genoLag?.toFixed(3) ?? '', meanSel.toFixed(5), result.wallMs].join(',') + '\n');

    done++;
    const eta = ((Date.now() - t0) / done * (total - done) / 60000).toFixed(1);
    console.log(`[${done}/${total}] ${run} ${result.survived ? 'SURVIVED' : 'extinct@' + result.extinctAt} (${result.wallMs}ms, eta ${eta}m)`);
}
console.log(`\nPilot 1 complete: ${total} runs in ${((Date.now() - t0) / 60000).toFixed(1)} min → ${OUT}`);
