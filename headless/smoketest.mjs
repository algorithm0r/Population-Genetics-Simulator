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
const a = runOne({ seed: 42, epoch: 2000, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0.5 }, environmentPatterns: STATIC_ENV });
const b = runOne({ seed: 42, epoch: 2000, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0.5 }, environmentPatterns: STATIC_ENV });
const c = runOne({ seed: 43, epoch: 2000, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0.5 }, environmentPatterns: STATIC_ENV });
check('same seed → identical series', JSON.stringify(a.series) === JSON.stringify(b.series));
check('different seed → different series', JSON.stringify(a.series) !== JSON.stringify(c.series));

// persistence under static environment
check('static env: survives 2000 gens', a.survived, `final N=${a.series.at(-1).n}`);
check('static env: population near soft-cap regime', a.series.at(-1).n > 20, `N=${a.series.at(-1).n}`);

// plasticity OFF ⇒ phenotype === genotype
const off = runOne({ seed: 7, epoch: 500, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0 }, environmentPatterns: STATIC_ENV });
const drift = Math.max(...off.series.map(s => Math.abs(s.meanPheno - s.meanGeno)));
check('plasticity off: phenotype tracks genotype exactly', drift === 0, `max|mp-mg|=${drift}`);

// hopeless rate of change ⇒ extinction
const doomed = runOne({ seed: 7, epoch: 20000, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0.5 }, environmentPatterns: FAST_ENV });
check('1 unit/gen change: extinct', !doomed.survived, `extinctAt=${doomed.extinctAt}`);

// timing note for sweep sizing
console.log(`\ntiming: 2000 gens single-cell ≈ ${a.wallMs} ms  (${(a.wallMs / 2000).toFixed(3)} ms/gen)`);
process.exit(failures ? 1 : 0);
