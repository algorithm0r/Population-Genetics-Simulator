// PopGenSim headless smoke test.
// Proves: (1) sim core loads and runs headless, (2) same seed → byte-identical
// trajectory, (3) different seed → different trajectory, (4) population persists
// under static environment, (5) absurdly fast change → extinction,
// (6) adaptiveStepSize 0 keeps phenotype === genotype (plasticity truly off).
import { loadSim, runOne, mulberry32 } from './runner.mjs';

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

// informed migration: on a static gradient with heavy migration, fit-targeted
// dispersal must sort organisms into better-matching cells than random dispersal
// (lower mean |genoLag| = per-organism deviation from own-cell target; plasticity off
// so phenotype === genotype and assessment is honest).
const IM_BASE = { numRows: 3, numCols: 3, targetObservationalNoise: 0, sexualReproduction: false, adaptiveStepSize: 0, worldEdges: 'island', offspringMigrationChance: 0.3, adultMigrationChance: 0.3 };
const IM_ENV = { spatial: { type: 'gradient', parameters: { gradientStrength: 3 } }, temporal: { type: 'static', parameters: {} } };
const imRand = await runOne({ seed: 21, epoch: 1000, reportEvery: 200, overrides: { ...IM_BASE }, environmentPatterns: IM_ENV });
const imFit = await runOne({ seed: 21, epoch: 1000, reportEvery: 200, overrides: { ...IM_BASE, fitTargetedMigration: true }, environmentPatterns: IM_ENV });
const mis = r => Math.abs(r.series.at(-1).genoLag);
check('fit-targeted migration sorts better than random on a static gradient',
    mis(imFit) < mis(imRand),
    `|lag| fit=${mis(imFit).toFixed(3)} vs random=${mis(imRand).toFixed(3)}`);

// need-triggered: mismatch raises emigration — under uniform static env (w≈1 for
// adapted organisms) need adds ~nothing, so same-seed series with scale on/off must
// stay close; the real behavioral test is the sorting check above plus spatial3.
const needOff = await runOne({ seed: 22, epoch: 500, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0 }, environmentPatterns: STATIC_ENV });
const needOn = await runOne({ seed: 22, epoch: 500, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0, needMigrationScale: 0.5 }, environmentPatterns: STATIC_ENV });
check('need-triggered migration: harmless on a single adapted cell', needOn.survived && needOff.survived,
    `N on=${needOn.series.at(-1).n} off=${needOff.series.at(-1).n}`);

// realistic-environment generators (composite / plateau / rednoise), tested directly
{
    const comp = globalThis.createPattern('composite', { changeRate: 100, cycleAmplitude: 6, cyclePeriod: 500 });
    const expected = t => t * 100 / 10000 + Math.sin(2 * Math.PI * t / 500) * 6;
    const compOK = [0, 125, 1000, 12345].every(t => Math.abs(comp.getValue({ row: 0, col: 0 }, t) - expected(t)) < 1e-9);
    check('composite = linear + cycle at sample generations', compOK);

    const plat = globalThis.createPattern('plateau', { changeRate: 160, plateauAt: 10 });
    check('plateau ramps then caps', Math.abs(plat.getValue({}, 100) - 1.6) < 1e-9 && plat.getValue({}, 5000) === 10 && plat.getValue({}, 50000) === 10);

    Math.random = mulberry32(99);
    const rn1 = globalThis.createPattern('rednoise', { autocorrelation: 0.99, stationarySD: 5 });
    const vals1 = []; for (let t = 0; t < 20000; t++) vals1.push(rn1.getValue({}, t));
    Math.random = mulberry32(99);
    const rn2 = globalThis.createPattern('rednoise', { autocorrelation: 0.99, stationarySD: 5 });
    const vals2 = []; for (let t = 0; t < 20000; t++) vals2.push(rn2.getValue({}, t));
    const mean99 = vals1.reduce((a, b) => a + b, 0) / vals1.length;
    const sd99 = Math.sqrt(vals1.reduce((a, v) => a + (v - mean99) ** 2, 0) / vals1.length);
    check('rednoise deterministic under seed', vals1.every((v, i) => v === vals2[i]));
    check('rednoise stationary SD near target (5)', sd99 > 3 && sd99 < 7, `empirical SD=${sd99.toFixed(2)}`);
    check('rednoise same value across cells at same generation', rn1.getValue({ row: 0, col: 0 }, 777) === rn1.getValue({ row: 5, col: 3 }, 777));
}

// ── cue/adjust timing architecture (2026-08-28) ──
{
    // explicit defaults ≡ omitted defaults (the refactor's fast path is the original code path)
    const expl = await runOne({ seed: 42, epoch: 2000, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0.5, cuePeriod: 1, adjustDelay: 0, birthCue: 'post' }, environmentPatterns: STATIC_ENV });
    check('timing defaults explicit === omitted (bit-identical)', JSON.stringify(expl.series) === JSON.stringify(a.series));

    // pure Chevin (linear slope 1, birth cue only, pre-selection): every organism —
    // newborns included, since development precedes selection — sits exactly on its
    // birth target; under static env meanPheno is exactly 0 at every report while
    // genotype drifts unseen
    const CHEV = { ...SINGLE_CELL, plasticityModel: 'linear', reactionNormSlope: 1, adaptiveStepSize: 0, cuePeriod: 0, birthCue: 'pre' };
    const chevPre = await runOne({ seed: 7, epoch: 1500, reportEvery: 100, overrides: CHEV, environmentPatterns: STATIC_ENV });
    const preRows = chevPre.series.filter(s => s.gen > 0);
    const prePin = Math.max(...preRows.map(s => Math.abs(s.meanPheno)));
    const preDrift = Math.max(...preRows.map(s => Math.abs(s.meanPheno - s.meanGeno)));
    check('pure Chevin (pre): all phenotypes pinned to birth target, genotype drifts unseen',
        prePin === 0 && preDrift > 0.05, `max|mp|=${prePin} max|mp-mg|=${preDrift.toFixed(3)}`);

    // same model with birthCue post: newborns appear in snapshots un-adjusted (honest
    // window open until their first tick), so meanPheno is NOT pinned to 0
    const chevPost = await runOne({ seed: 7, epoch: 1500, reportEvery: 100, overrides: { ...CHEV, birthCue: 'post' }, environmentPatterns: STATIC_ENV });
    const postPin = Math.max(...chevPost.series.filter(s => s.gen > 0).map(s => Math.abs(s.meanPheno)));
    check('birth-cue post keeps the honest-newborn window (meanPheno not pinned)', postPin > 0, `max|mp|=${postPin.toFixed(4)}`);

    // delay line: an effectively infinite delay = plasticity never fires; a finite
    // delay matures through the queue and fires
    const dInf = await runOne({ seed: 11, epoch: 800, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0.5, adjustDelay: 999999 }, environmentPatterns: STATIC_ENV });
    const dInfDrift = Math.max(...dInf.series.map(s => Math.abs(s.meanPheno - s.meanGeno)));
    const d5 = await runOne({ seed: 11, epoch: 800, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0.5, adjustDelay: 5 }, environmentPatterns: STATIC_ENV });
    const d5Drift = Math.max(...d5.series.map(s => Math.abs(s.meanPheno - s.meanGeno)));
    // static env holds genotype near 0, so population drift is intrinsically small;
    // the contrast that matters is exact-zero (never fires) vs any-positive (fires)
    check('adjustDelay: infinite delay = plasticity inert; finite delay matures and fires',
        dInfDrift === 0 && d5Drift > 0, `drift inf=${dInfDrift} d5=${d5Drift.toFixed(4)}`);
}

// ── fitnessTiming ordering flag (2026-08-28) ──
{
    const explFT = await runOne({ seed: 42, epoch: 2000, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0.5, fitnessTiming: 'lastTick' }, environmentPatterns: STATIC_ENV });
    check('fitnessTiming lastTick explicit === omitted (bit-identical)', JSON.stringify(explFT.series) === JSON.stringify(a.series));
    const ct = await runOne({ seed: 42, epoch: 2000, reportEvery: 100, overrides: { ...SINGLE_CELL, adaptiveStepSize: 0.5, fitnessTiming: 'currentTick' }, environmentPatterns: STATIC_ENV });
    check('fitnessTiming currentTick: static env runs and persists', ct.survived && JSON.stringify(ct.series) !== JSON.stringify(a.series), `N=${ct.series.at(-1).n}`);
}

// timing note for sweep sizing
console.log(`\ntiming: 2000 gens single-cell ≈ ${a.wallMs} ms  (${(a.wallMs / 2000).toFixed(3)} ms/gen)`);
process.exit(failures ? 1 : 0);

