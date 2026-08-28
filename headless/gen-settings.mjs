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
    // Spatial 1 — the F7 hypothesis test (registered predictions in FINDINGS F8 stub):
    // migration rescues genetics-only populations from locally super-critical change
    // (the Pease/Lande/Bull 1989 gene-flow escalator, here via migrant sorting through
    // undirected dispersal), but shielding disables it (plasticity flattens the spatial
    // fitness differences that drive sorting). 1×24 ISLAND strip, gradient 2/cell;
    // uniform-world controls isolate migration's adaptive channel (Chris's design).
    spatial1() {
        const strip = { numRows: 1, numCols: 24, worldEdges: 'island', targetObservationalNoise: 0, sexualReproduction: false };
        const world = (kind, rate) => ({
            spatial: kind === 'gradient' ? { type: 'gradient', parameters: { gradientStrength: 2 } } : { type: 'uniform', parameters: { baseEnvironment: 0 } },
            temporal: { type: 'linear', parameters: { changeRate: rate } },
        });
        const out = [];
        const arms = [
            { p: 0, rate: 320 },    // locally super-critical for genetics (eta_c 273)
            { p: 0.5, rate: 80 },   // locally super-critical under shielding (eta_c ~50)
        ];
        for (const { p, rate } of arms)
            for (const mig of [0, 0.1])
                for (const kind of ['gradient', 'uniform'])
                    out.push({
                        id: `spt1_p${p}_r${rate}_m${mig}_${kind}`,
                        meta: { plasticity: p, rate: `r${rate}m${mig}${kind[0]}` },
                        config: {
                            epoch: 20000, reportEvery: 250,
                            overrides: { ...strip, adaptiveStepSize: p, offspringMigrationChance: mig, adultMigrationChance: mig },
                            environmentPatterns: world(kind, rate),
                        },
                    });
        // sanity: locally sub-critical genetics on the gradient strip tracks in place
        out.push({
            id: 'spt1_p0_r80_m0_gradient', meta: { plasticity: 0, rate: 'r80m0g' },
            config: { epoch: 20000, reportEvery: 250, overrides: { ...strip, adaptiveStepSize: 0, offspringMigrationChance: 0, adultMigrationChance: 0 }, environmentPatterns: world('gradient', 80) },
        });
        return out;
    },
    // Spatial 2 — de-censoring: spatial1's migration arms showed extinctions landing at
    // gen 18-19.7k (just under the 20k epoch) and survivors with accelerating lag →
    // pExt@20k is right-censored. Same four migration arms at epoch 50k settle whether
    // the migration "rescue" is real persistence or slow death.
    spatial2() {
        const strip = { numRows: 1, numCols: 24, worldEdges: 'island', targetObservationalNoise: 0, sexualReproduction: false };
        const world = (kind, rate) => ({
            spatial: kind === 'gradient' ? { type: 'gradient', parameters: { gradientStrength: 2 } } : { type: 'uniform', parameters: { baseEnvironment: 0 } },
            temporal: { type: 'linear', parameters: { changeRate: rate } },
        });
        const out = [];
        for (const { p, rate } of [{ p: 0, rate: 320 }, { p: 0.5, rate: 80 }])
            for (const kind of ['gradient', 'uniform'])
                out.push({
                    id: `spt2_p${p}_r${rate}_m0.1_${kind}_50k`,
                    meta: { plasticity: p, rate: `r${rate}m0.1${kind[0]}L` },
                    config: {
                        epoch: 50000, reportEvery: 500,
                        overrides: { ...strip, adaptiveStepSize: p, offspringMigrationChance: 0.1, adultMigrationChance: 0.1 },
                        environmentPatterns: world(kind, rate),
                    },
                });
        return out;
    },
    // Spatial 3 — informed migration (Chris, 2026-08-28: "triggered by need, targeted
    // by fit"). Same super-critical arms as F8/F9; random-dispersal baselines live in
    // spatial2 results. REGISTERED PREDICTIONS (before running): (1) fit-targeting
    // rescues the gradient world for bare genetics — restores the sorting channel
    // random dispersal lacks (F9: gradient = 100% extinct); (2) under plasticity the
    // rescue is at best partial, carried by newborns (honest innate assessment) while
    // shielded adults are blinded (no need felt, no fit gradient perceived);
    // (3) uniform-world controls: fit-targeting inert (all cells tie), need-triggering
    // adds only extra random movement.
    spatial3() {
        const strip = { numRows: 1, numCols: 24, worldEdges: 'island', targetObservationalNoise: 0, sexualReproduction: false, offspringMigrationChance: 0.1, adultMigrationChance: 0.1 };
        const world = (kind, rate) => ({
            spatial: kind === 'gradient' ? { type: 'gradient', parameters: { gradientStrength: 2 } } : { type: 'uniform', parameters: { baseEnvironment: 0 } },
            temporal: { type: 'linear', parameters: { changeRate: rate } },
        });
        const MODELS = {
            need: { needMigrationScale: 0.4, fitTargetedMigration: false },
            fit: { needMigrationScale: 0, fitTargetedMigration: true },
            both: { needMigrationScale: 0.4, fitTargetedMigration: true },
        };
        const out = [];
        for (const { p, rate } of [{ p: 0, rate: 320 }, { p: 0.5, rate: 80 }])
            for (const [model, mp] of Object.entries(MODELS))
                for (const kind of ['gradient', 'uniform'])
                    out.push({
                        id: `spt3_p${p}_r${rate}_${model}_${kind}`,
                        meta: { plasticity: p, rate: `r${rate}${model}${kind[0]}` },
                        config: {
                            epoch: 50000, reportEvery: 500,
                            overrides: { ...strip, adaptiveStepSize: p, ...mp },
                            environmentPatterns: world(kind, rate),
                        },
                    });
        return out;
    },
    // Spatial 4 — genotype-based (innate-cue) habitat assessment (Chris, 2026-08-28:
    // close the open question). Splits F10's residual 35% shielded mortality:
    // REGISTERED PREDICTION: adult blinding is the binding constraint, so honest
    // genotype assessment pushes the shielded both-mechanisms gradient arm from 0.35
    // toward ~0 (and uniform from 0 stays 0). If it stays ~0.35, the constraint is
    // shielded SELECTION, not blinded assessment. (p0 arms are identical under either
    // assessment — genotype ≡ phenotype without plasticity — so F10 covers them.)
    spatial4() {
        const strip = { numRows: 1, numCols: 24, worldEdges: 'island', targetObservationalNoise: 0, sexualReproduction: false, offspringMigrationChance: 0.1, adultMigrationChance: 0.1, needMigrationScale: 0.4, fitTargetedMigration: true, migrationAssessment: 'genotype', adaptiveStepSize: 0.5 };
        const world = (kind) => ({
            spatial: kind === 'gradient' ? { type: 'gradient', parameters: { gradientStrength: 2 } } : { type: 'uniform', parameters: { baseEnvironment: 0 } },
            temporal: { type: 'linear', parameters: { changeRate: 80 } },
        });
        return ['gradient', 'uniform'].map(kind => ({
            id: `spt4_p0.5_r80_bothG_${kind}`,
            meta: { plasticity: 0.5, rate: `r80bothG${kind[0]}` },
            config: { epoch: 50000, reportEvery: 500, overrides: { ...strip }, environmentPatterns: world(kind) },
        }));
    },
    // ══════════ Realistic-environment suite (Chris, 2026-08-28) ══════════
    // Composite 1 — cycle riding a trend (the climate-change shape).
    // REGISTERED PREDICTIONS: (i) the plastic arm's trend tolerance under a cycle it
    // handles ≈ its pure-trend eta_c (~40-60) — the cycle is absorbed within reach and
    // is roughly orthogonal; (ii) bare genetics in the a6/T500 rescue-regime cycle stays
    // dead at every trend; (iii) applied headline: a cycle that plasticity fully
    // buffers CONCEALS trend vulnerability — the buffered population dies at modest
    // underlying trends that look survivable from its cycle performance.
    composite1() {
        const out = [];
        for (const cyc of [{ a: 2, T: 500 }, { a: 6, T: 500 }])
            for (const trend of [0, 40, 80, 160, 240])
                for (const p of [0, 0.5])
                    out.push({
                        id: `cmp1_p${p}_a${cyc.a}T${cyc.T}_tr${trend}`,
                        meta: { plasticity: p, rate: `a${cyc.a}T${cyc.T}+tr${trend}` },
                        config: {
                            epoch: 30000, reportEvery: 250,
                            overrides: { numRows: 1, numCols: 1, offspringMigrationChance: 0, adultMigrationChance: 0, targetObservationalNoise: 0, sexualReproduction: false, adaptiveStepSize: p },
                            environmentPatterns: { spatial: { type: 'uniform', parameters: { baseEnvironment: 0 } }, temporal: { type: 'composite', parameters: { changeRate: trend, cycleAmplitude: cyc.a, cyclePeriod: cyc.T } } },
                        },
                    });
        return out;
    },
    // Plateau 1 — finite trends (ramp to a total excursion, then hold).
    // REGISTERED PREDICTIONS: (i) for PLASTIC populations survival is governed by total
    // excursion (vs plastic reach + slow newborn-mediated catch-up), nearly
    // rate-independent; (ii) for GENETIC populations survival is governed by rate
    // (< eta_c tracks any excursion; > eta_c survives only excursions short enough to
    // outlive the transient). If both hold: "finite change: excursion kills the
    // plastic, rate kills the genetic" — the applied asymmetry.
    plateau1() {
        const out = [];
        for (const rate of [160, 320, 640])
            for (const cap of [5, 10, 20, 40])
                for (const p of [0, 0.5])
                    out.push({
                        id: `plt1_p${p}_r${rate}_cap${cap}`,
                        meta: { plasticity: p, rate: `r${rate}cap${cap}` },
                        config: {
                            epoch: 30000, reportEvery: 250,
                            overrides: { numRows: 1, numCols: 1, offspringMigrationChance: 0, adultMigrationChance: 0, targetObservationalNoise: 0, sexualReproduction: false, adaptiveStepSize: p },
                            environmentPatterns: { spatial: { type: 'uniform', parameters: { baseEnvironment: 0 } }, temporal: { type: 'plateau', parameters: { changeRate: rate, plateauAt: cap } } },
                        },
                    });
        return out;
    },
    // Rednoise 1 — autocorrelated stochastic environments (the predictability axis of
    // Botero/Tufto/Leung). REGISTERED PREDICTIONS: (i) plasticity buffers red noise
    // broadly (mean-reverting ≈ cycle-like — the F6 regime); (ii) bare genetics fails
    // at high SD × high phi (slow large excursions = transient trends); (iii) the sign
    // of plasticity's effect flips along the phi axis somewhere — connecting F6's
    // return-structure rule to the predictability literature.
    rednoise1() {
        const out = [];
        for (const phi of [0.9, 0.99, 0.999])
            for (const sd of [2, 5, 10])
                for (const p of [0, 0.5])
                    out.push({
                        id: `rn1_p${p}_phi${phi}_sd${sd}`,
                        meta: { plasticity: p, rate: `phi${phi}sd${sd}` },
                        config: {
                            epoch: 30000, reportEvery: 250,
                            overrides: { numRows: 1, numCols: 1, offspringMigrationChance: 0, adultMigrationChance: 0, targetObservationalNoise: 0, sexualReproduction: false, adaptiveStepSize: p },
                            environmentPatterns: { spatial: { type: 'uniform', parameters: { baseEnvironment: 0 } }, temporal: { type: 'rednoise', parameters: { autocorrelation: phi, stationarySD: sd } } },
                        },
                    });
        return out;
    },
    // Spatial-composite 1 — does the informed-migration sorting machine (F10/F11) hold
    // under the climate shape? Shielded arm only; phenotype vs genotype assessment.
    // REGISTERED PREDICTION: genotype-assessment arms track the composite as they
    // tracked the pure trend; phenotype-assessment arms lose the trend component while
    // buffering the cycle (blindfold effect persists under realistic environments).
    spatialcomp1() {
        const strip = { numRows: 1, numCols: 24, worldEdges: 'island', targetObservationalNoise: 0, sexualReproduction: false, offspringMigrationChance: 0.1, adultMigrationChance: 0.1, needMigrationScale: 0.4, fitTargetedMigration: true, adaptiveStepSize: 0.5 };
        const out = [];
        for (const assess of ['phenotype', 'genotype'])
            for (const kind of ['gradient', 'uniform'])
                out.push({
                    id: `spc1_p0.5_both_${assess === 'genotype' ? 'G' : 'P'}_${kind}`,
                    meta: { plasticity: 0.5, rate: `a6T500tr80both${assess[0]}${kind[0]}` },
                    config: {
                        epoch: 50000, reportEvery: 500,
                        overrides: { ...strip, migrationAssessment: assess },
                        environmentPatterns: {
                            spatial: kind === 'gradient' ? { type: 'gradient', parameters: { gradientStrength: 2 } } : { type: 'uniform', parameters: { baseEnvironment: 0 } },
                            temporal: { type: 'composite', parameters: { changeRate: 80, cycleAmplitude: 6, cyclePeriod: 500 } },
                        },
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
