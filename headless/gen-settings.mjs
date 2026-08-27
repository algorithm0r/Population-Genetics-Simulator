// Generate a settings file (list of {id, config, meta}) for the coordinator.
// Experiments are named functions; add new ones here rather than hand-writing JSON.
//
// Usage: node gen-settings.mjs <experiment> [outFile]
//   node gen-settings.mjs pilot1x settings/pilot1x.json
import fs from 'node:fs';
import path from 'node:path';

const BASE = {
    numRows: 1, numCols: 1,
    offspringMigrationChance: 0, adultMigrationChance: 0,
    targetObservationalNoise: 0, sexualReproduction: false,
};
const env = (rate) => ({
    spatial: { type: 'uniform', parameters: { baseEnvironment: 0 } },
    temporal: rate === 0 ? { type: 'static', parameters: {} } : { type: 'linear', parameters: { changeRate: rate } },
});

const EXPERIMENTS = {
    // Pilot 1 extended: same axes as the serial pilot (its runs resume in via RESUME_FROM),
    // plus finer rate resolution around the slide-quoted critical region (~167-171/10k).
    pilot1x() {
        const out = [];
        for (const p of [0, 0.5])
            for (const rate of [0, 100, 140, 150, 160, 165, 170, 175, 180, 190, 200, 220, 240, 300])
                out.push({
                    id: `pilot1_p${p}_r${rate}`,
                    meta: { plasticity: p, rate },
                    config: { epoch: 50000, reportEvery: 250, overrides: { ...BASE, adaptiveStepSize: p }, environmentPatterns: env(rate) },
                });
        return out;
    },
    // Bracket 1: find each arm's actual critical region. Early pilot1x returns say the
    // arms are far apart — p0.5 dies even at rate 100 while p0 survives to 240 — so
    // bracket p0.5 at LOW rates and p0 at HIGH rates. Includes p0.5 static sanity bin.
    bracket1() {
        const out = [];
        for (const rate of [0, 10, 20, 40, 60, 80])
            out.push({ id: `brk_p0.5_r${rate}`, meta: { plasticity: 0.5, rate }, config: { epoch: 50000, reportEvery: 250, overrides: { ...BASE, adaptiveStepSize: 0.5 }, environmentPatterns: env(rate) } });
        for (const rate of [260, 280, 320, 360, 400, 500])
            out.push({ id: `brk_p0_r${rate}`, meta: { plasticity: 0, rate }, config: { epoch: 50000, reportEvery: 250, overrides: { ...BASE, adaptiveStepSize: 0 }, environmentPatterns: env(rate) } });
        return out;
    },
    // Linear reaction-norm control (Phase 1's decisive knob). Registered prediction
    // (2026-08-27, before running): the shielding extinction DISAPPEARS — unbounded
    // instant norms track like Chevin/Scheiner predict; harm requires bounded reach.
    // Slopes 0.5 and 1.0 (1.0 = full compensation = maximal shielding of adults),
    // same rate axis as pilot1x plus the p0.5-lethal low rates.
    linvar() {
        const out = [];
        for (const slope of [0.5, 1.0])
            for (const rate of [0, 100, 160, 200, 240, 300, 400])
                out.push({
                    id: `lin_b${slope}_r${rate}`,
                    meta: { plasticity: `lin${slope}`, rate },
                    config: {
                        epoch: 50000, reportEvery: 250,
                        overrides: { ...BASE, plasticityModel: 'linear', reactionNormSlope: slope, adaptiveStepSize: 0 },
                        environmentPatterns: env(rate),
                    },
                });
        return out;
    },
    // Spatial FEASIBILITY probe (not the Phase 3 factorial — that design belongs with
    // Jobran). 4×4 torus, spatial gradient 5 (targets −15..+15 across the diagonal),
    // uniform linear trend → range-shift geometry (an organism's matching cell walks
    // down-gradient over time). Scopes runtime + whether migration changes outcomes.
    spatialprobe() {
        const out = [];
        for (const p of [0, 0.5])
            for (const mig of [0.001, 0.05])
                out.push({
                    id: `sp_p${p}_m${mig}`,
                    meta: { plasticity: p, rate: `m${mig}` },
                    config: {
                        epoch: 20000, reportEvery: 500,
                        overrides: {
                            numRows: 4, numCols: 4,
                            offspringMigrationChance: mig, adultMigrationChance: mig,
                            targetObservationalNoise: 0, sexualReproduction: false, adaptiveStepSize: p,
                        },
                        environmentPatterns: {
                            spatial: { type: 'gradient', parameters: { gradientStrength: 5 } },
                            temporal: { type: 'linear', parameters: { changeRate: 200 } },
                        },
                    },
                });
        return out;
    },
    // Small-amplitude fast cycles — the F5 registered buffer-regime prediction
    // (plasticity wins when amplitude ≤ reach ~2.5), widened upward because a standing-
    // load analysis suggests the true window may be amplitude ∈ (tolerable-with-
    // plasticity, lethal-without) ≈ (4, 8). Grid lets the data arbitrate.
    smallamp() {
        const out = [];
        for (const p of [0, 0.5])
            for (const amp of [1, 2, 4, 6, 8])
                for (const period of [50, 200, 1000])
                    out.push({
                        id: `sa_p${p}_a${amp}_T${period}`,
                        meta: { plasticity: p, rate: `a${amp}/T${period}` },
                        config: {
                            epoch: 50000, reportEvery: 250,
                            overrides: { ...BASE, adaptiveStepSize: p },
                            environmentPatterns: { spatial: { type: 'uniform', parameters: { baseEnvironment: 0 } }, temporal: { type: 'cycling', parameters: { cycleAmplitude: amp, cyclePeriod: period } } },
                        },
                    });
        return out;
    },
    // Plasticity-strength resolution (the eta_c(plasticity) money-figure data).
    // Rate grid spans both brackets found 2026-08-27: eta_c(p=0)~280, eta_c(p=0.5)~40-60.
    pstrength() {
        const out = [];
        for (const p of [0, 0.1, 0.25, 0.5, 0.75, 1.0])
            for (const rate of [20, 40, 60, 80, 100, 140, 180, 220, 260, 300])
                out.push({
                    id: `pstr_p${p}_r${rate}`,
                    meta: { plasticity: p, rate },
                    config: { epoch: 50000, reportEvery: 250, overrides: { ...BASE, adaptiveStepSize: p }, environmentPatterns: env(rate) },
                });
        return out;
    },
    // Cyclical environments (slide-33 hypothesis: plasticity buffers cycles, dooms trends).
    // amplitude x period x plasticity; static bins covered elsewhere.
    // Also carries the F1 metastability probe: p0.5 @ rate 40 (a 50k-gen "survivor" bin
    // whose lag was still growing) run to 200k generations.
    cyclic() {
        const out = [];
        out.push({
            id: 'meta_p0.5_r40_200k', meta: { plasticity: 0.5, rate: 40 },
            config: { epoch: 200000, reportEvery: 500, overrides: { ...BASE, adaptiveStepSize: 0.5 }, environmentPatterns: env(40) },
        });
        for (const p of [0, 0.5])
            for (const amp of [10, 25, 50])
                for (const period of [500, 2000, 10000])
                    out.push({
                        id: `cyc_p${p}_a${amp}_T${period}`,
                        meta: { plasticity: p, rate: `a${amp}/T${period}` },
                        config: {
                            epoch: 50000, reportEvery: 250,
                            overrides: { ...BASE, adaptiveStepSize: p },
                            environmentPatterns: { spatial: { type: 'uniform', parameters: { baseEnvironment: 0 } }, temporal: { type: 'cycling', parameters: { cycleAmplitude: amp, cyclePeriod: period } } },
                        },
                    });
        return out;
    },
};

const name = process.argv[2];
if (!EXPERIMENTS[name]) { console.error(`unknown experiment '${name}'. known: ${Object.keys(EXPERIMENTS).join(', ')}`); process.exit(1); }
const outFile = process.argv[3] ?? `settings/${name}.json`;
fs.mkdirSync(path.dirname(outFile), { recursive: true });
const settings = EXPERIMENTS[name]();
fs.writeFileSync(outFile, JSON.stringify(settings, null, 1));
console.log(`${settings.length} settings -> ${outFile}`);
