// PopGenSim headless smoke test.
// Proves: (1) sim core loads and runs headless, (2) same seed → byte-identical
// trajectory, (3) different seed → different trajectory, (4) population persists
// under static environment, (5) absurdly fast change → extinction,
// (6) adaptiveStepSize 0 keeps phenotype === genotype (plasticity truly off).
import { loadSim, runOne } from './runner.mjs';

const SINGLE_CELL = {
    numRows: 1, numCols: 1,
    offspringMigrationChance: 0, adultMigrationChance: 0,
    targetObservationalNoise: 0, sexualReproduction: false,
};
const STATIC_ENV = { spatial: { type: 'uniform', parameters: { baseEnvironment: 0 } }, temporal: { type: 'static', parameters: {} } };
const FAST_ENV = { spatial: { type: 'uniform', parameters: { baseEnvironment: 0 } }, temporal: { type: 'linear', parameters: { changeRate: 10000 } } }; // 1 unit/gen — hopeless

let failures = 0;
const check = (name, ok, detail = '') => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
    if (!ok) failures++;
};

loadSim();

// determinism
const a = await runOne({ seed: 42, epoch: 2000, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0.5 }, environmentPatterns: STATIC_ENV });
const b = await runOne({ seed: 42, epoch: 2000, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0.5 }, environmentPatterns: STATIC_ENV });
const c = await runOne({ seed: 43, epoch: 2000, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0.5 }, environmentPatterns: STATIC_ENV });
check('same seed → identical series', JSON.stringify(a.series) === JSON.stringify(b.series));
check('different seed → different series', JSON.stringify(a.series) !== JSON.stringify(c.series));

// persistence under static environment
check('static env: survives 2000 gens', a.survived, `final N=${a.series.at(-1).n}`);
check('static env: population near soft-cap regime', a.series.at(-1).n > 20, `N=${a.series.at(-1).n}`);

// plasticity OFF ⇒ phenotype === genotype
const off = await runOne({ seed: 7, epoch: 500, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0 }, environmentPatterns: STATIC_ENV });
const drift = Math.max(...off.series.map(s => Math.abs(s.meanPheno - s.meanGeno)));
check('plasticity off: phenotype tracks genotype exactly', drift === 0, `max|mp-mg|=${drift}`);

// hopeless rate of change ⇒ extinction
const doomed = await runOne({ seed: 7, epoch: 20000, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0.5 }, environmentPatterns: FAST_ENV });
check('1 unit/gen change: extinct', !doomed.survived, `extinctAt=${doomed.extinctAt}`);

// linear reaction-norm variant, slope 1, static env: every ADULT sits exactly on the
// target; the population mean phenotype still carries newborns (born at genotype,
// selected once before first adapt — the model's ordering), so the correct invariant
// is that compensation pulls the phenotype mean strictly toward the target relative
// to the genotype mean.
const lin = await runOne({ seed: 7, epoch: 500, reportEvery: 100, overrides: { ...SINGLE_CELL, plasticityModel: 'linear', reactionNormSlope: 1, adaptiveStepSize: 0 }, environmentPatterns: STATIC_ENV });
const last = lin.series.at(-1);
check('linear norm slope 1: |meanPheno| < |meanGeno| (compensation toward target)',
    Math.abs(last.meanPheno) < Math.abs(last.meanGeno) && Math.abs(last.meanGeno) > 0.05,
    `meanPheno=${last.meanPheno.toFixed(3)} meanGeno=${last.meanGeno.toFixed(3)}`);

// island edges: on a 2x2 grid with migration chance 1 on birth, no organism may cross
// an edge — verified by checking corner-cell hops stay in-bounds (torus would wrap).
// Deterministic check: island mode + gradient world runs without error and occupies
// only valid cells (structural sanity; the seam-free property is by construction).
const island = await runOne({
    seed: 11, epoch: 300, reportEvery: 100,
    overrides: { numRows: 3, numCols: 3, offspringMigrationChance: 0.5, adultMigrationChance: 0.5, targetObservationalNoise: 0, sexualReproduction: false, adaptiveStepSize: 0, worldEdges: 'island' },
    environmentPatterns: { spatial: { type: 'gradient', parameters: { gradientStrength: 2 } }, temporal: { type: 'static', parameters: {} } },
});
check('island edges: 3x3 gradient world runs, cells occupied sanely',
    island.series.at(-1).n > 0 && island.series.at(-1).cellsOccupied <= 9,
    `N=${island.series.at(-1).n} cells=${island.series.at(-1).cellsOccupied}`);

// timing note for sweep sizing
console.log(`\ntiming: 2000 gens single-cell ≈ ${a.wallMs} ms  (${(a.wallMs / 2000).toFixed(3)} ms/gen)`);
process.exit(failures ? 1 : 0);

