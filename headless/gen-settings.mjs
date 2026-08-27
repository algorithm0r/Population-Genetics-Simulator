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
    // Plasticity-strength resolution at fixed rates (for the eta_c(plasticity) curve later)
    pstrength() {
        const out = [];
        for (const p of [0, 0.1, 0.25, 0.5, 0.75, 1.0])
            for (const rate of [100, 140, 160, 180, 200, 240])
                out.push({
                    id: `pstr_p${p}_r${rate}`,
                    meta: { plasticity: p, rate },
                    config: { epoch: 50000, reportEvery: 250, overrides: { ...BASE, adaptiveStepSize: p }, environmentPatterns: env(rate) },
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
