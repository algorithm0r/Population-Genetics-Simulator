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
    // Timing 1 — the cue/adjust timing architecture's first outing (2026-08-28).
    // Two purposes: (1) PAPER-1 SEAL: our linvar "linear norm" arms used live per-tick
    // cues; pure Chevin is cue-at-birth, adjust-once, PRE-selection. Does the
    // shielding result survive the faithful timing? (2) PRECURSOR PROBE of the
    // cue-timing axis (paper 2): birth-registered cues and delayed adjustment.
    // Mean lifespan ≈ 5 ticks (deathChance 0.2), so cue staleness under trend r80 is
    // ~rate × lifespan ≈ 0.04 phenotype units — negligible against lags of 0.5–2.
    // REGISTERED PREDICTIONS:
    //  A (trend r80): timing-invariance at slow rates — chevPre lin0.5 dies like
    //    labile lin0.5 (worse than nothing); chevPre lin1 survives like labile lin1;
    //    birth-cue step0.5 dies like live step0.5. p0 survives (r80 << bare-genetics
    //    etaC 273). The paper-1 claim "the trap appears in their own model" holds
    //    under Chevin-faithful timing.
    //  B (cycle a6/T50): divergence — live cues buffer (step0.5 full rescue per F6,
    //    labile lin1 trivially), birth-registered cues chase a stale phase and die
    //    (within-life phase drift is large); chevPre lin1 phenotype = env(birth),
    //    mismatch up to 2A = 12. p0 dies (F6). Cue staleness is harmful exactly when
    //    the environment returns — the timing sign rule's first half.
    //  C (anti-phase, lin1 live cue + adjustDelay 2): at T = 2×delay the compensation
    //    lands anti-phase (mismatch swing 2A). Pre-flight caught an ALIASING artifact:
    //    at T4, integer generations sample the sine's zeros every other tick, so
    //    boom-bust demography persists at any amplitude — T4 arms are retained as the
    //    aliasing demonstration (predict: survives). T5 (incommensurate; |mismatch|
    //    bounded away from 0, swing ~11.4) is the real test — predict: delay-2 dies at
    //    T5 while delay-0 survives trivially and p0 (max mismatch 6) outlives delay-2
    //    (max ~11.4): delayed compensation worse than none. At T40 delay is harmless.
    //  D (spatial, the preserved difference): lin0.5 labile + both informed-migration
    //    mechanisms on the r80 gradient strip — birthCue post keeps the honest-newborn
    //    window (partial rescue, F10-style); birthCue pre closes it at BOTH selection
    //    and birth migration — predict rescue collapses toward 100% extinction.
    timing1() {
        const out = [];
        const one = (id, meta, overrides, temporal, epoch = 30000, reportEvery = 250) => out.push({
            id, meta, config: {
                epoch, reportEvery, overrides,
                environmentPatterns: { spatial: { type: 'uniform', parameters: { baseEnvironment: 0 } }, temporal },
            },
        });
        const trend80 = { type: 'linear', parameters: { changeRate: 80 } };
        const cyc = (A, T) => ({ type: 'cycling', parameters: { cycleAmplitude: A, cyclePeriod: T } });
        const LIN = (b) => ({ ...BASE, plasticityModel: 'linear', reactionNormSlope: b, adaptiveStepSize: 0 });
        const STEP = { ...BASE, adaptiveStepSize: 0.5 };
        const CHEV = (b) => ({ ...LIN(b), cuePeriod: 0, birthCue: 'pre' });

        // A — trend r80
        one('tm_lab0.5_r80', { plasticity: 'lin0.5', rate: 80 }, LIN(0.5), trend80);
        one('tm_chev0.5_r80', { plasticity: 'lin0.5Bpre', rate: 80 }, CHEV(0.5), trend80);
        one('tm_chev1_r80', { plasticity: 'lin1Bpre', rate: 80 }, CHEV(1), trend80);
        one('tm_step_r80', { plasticity: 0.5, rate: 80 }, STEP, trend80);
        one('tm_stepB_r80', { plasticity: '0.5B', rate: 80 }, { ...STEP, cuePeriod: 0 }, trend80);
        one('tm_p0_r80', { plasticity: 0, rate: 80 }, { ...BASE, adaptiveStepSize: 0 }, trend80);

        // B — cycle a6/T50
        one('tm_step_a6T50', { plasticity: 0.5, rate: 'a6/T50' }, STEP, cyc(6, 50));
        one('tm_stepB_a6T50', { plasticity: '0.5B', rate: 'a6/T50' }, { ...STEP, cuePeriod: 0 }, cyc(6, 50));
        one('tm_lab1_a6T50', { plasticity: 'lin1', rate: 'a6/T50' }, LIN(1), cyc(6, 50));
        one('tm_chev1_a6T50', { plasticity: 'lin1Bpre', rate: 'a6/T50' }, CHEV(1), cyc(6, 50));
        one('tm_p0_a6T50', { plasticity: 0, rate: 'a6/T50' }, { ...BASE, adaptiveStepSize: 0 }, cyc(6, 50));

        // C — anti-phase delay (linear slope 1, live cue). T4 = aliasing demo; T5 = real test.
        one('tm_lab1D2_a6T4', { plasticity: 'lin1D2', rate: 'a6/T4' }, { ...LIN(1), adjustDelay: 2 }, cyc(6, 4));
        one('tm_lab1_a6T4', { plasticity: 'lin1', rate: 'a6/T4' }, LIN(1), cyc(6, 4));
        one('tm_lab1D2_a6T5', { plasticity: 'lin1D2', rate: 'a6/T5' }, { ...LIN(1), adjustDelay: 2 }, cyc(6, 5));
        one('tm_lab1_a6T5', { plasticity: 'lin1', rate: 'a6/T5' }, LIN(1), cyc(6, 5));
        one('tm_p0_a6T5', { plasticity: 0, rate: 'a6/T5' }, { ...BASE, adaptiveStepSize: 0 }, cyc(6, 5));
        one('tm_lab1D2_a6T40', { plasticity: 'lin1D2', rate: 'a6/T40' }, { ...LIN(1), adjustDelay: 2 }, cyc(6, 40));
        one('tm_p0_a6T4', { plasticity: 0, rate: 'a6/T4' }, { ...BASE, adaptiveStepSize: 0 }, cyc(6, 4));

        // D — spatial: honest-newborn window, pre vs post (50k gradient strip, both mechanisms)
        const strip = { numRows: 1, numCols: 24, worldEdges: 'island', targetObservationalNoise: 0, sexualReproduction: false, offspringMigrationChance: 0.1, adultMigrationChance: 0.1, needMigrationScale: 0.4, fitTargetedMigration: true, plasticityModel: 'linear', reactionNormSlope: 0.5, adaptiveStepSize: 0 };
        for (const bc of ['post', 'pre'])
            out.push({
                id: `tm_sp_lin0.5_${bc}`,
                meta: { plasticity: `lin0.5${bc === 'pre' ? 'pre' : ''}`, rate: `r80both${bc}` },
                config: {
                    epoch: 50000, reportEvery: 500,
                    overrides: { ...strip, birthCue: bc },
                    environmentPatterns: {
                        spatial: { type: 'gradient', parameters: { gradientStrength: 2 } },
                        temporal: { type: 'linear', parameters: { changeRate: 80 } },
                    },
                },
            });
        return out;
    },
    // Timing 1b — supplement registered mid-timing1 (2026-08-28), BEFORE any runs at
    // these rates: timing1's r80 lin arms turned out non-discriminating (labile lin0.5
    // survives r80 per linvar — it dies at r160+, TTE 5400 at r160). The Chevin-vs-
    // labile contrast must run where the labile trap actually bites.
    // REGISTERED PREDICTION: timing-invariance holds — chev0.5 (cue-at-birth,
    // pre-selection) dies at r160 and r240 like labile lin0.5, because the honest
    // staleness leak is tiny at these lifespans (rate x lifespan ≈ 0.08–0.12) and the
    // 0.5-slope signal dilution is identical. If instead chev0.5 survives r160, cue
    // timing — not partial compensation — is the trap's load-bearing element and the
    // paper-1 linvar claim narrows to labile plasticity.
    timing1b() {
        const out = [];
        const LIN = (b) => ({ ...BASE, plasticityModel: 'linear', reactionNormSlope: b, adaptiveStepSize: 0 });
        for (const rate of [160, 240]) {
            out.push({ id: `tm2_lab0.5_r${rate}`, meta: { plasticity: 'lin0.5', rate }, config: { epoch: 30000, reportEvery: 250, overrides: LIN(0.5), environmentPatterns: env(rate) } });
            out.push({ id: `tm2_chev0.5_r${rate}`, meta: { plasticity: 'lin0.5Bpre', rate }, config: { epoch: 30000, reportEvery: 250, overrides: { ...LIN(0.5), cuePeriod: 0, birthCue: 'pre' }, environmentPatterns: env(rate) } });
        }
        return out;
    },
    // Timing 1c — mechanism isolation for timing1b's refutation (2026-08-28,
    // registered pre-run). chev0.5 (birth cue + pre) survives r160 where labile
    // lin0.5 (live cue + post) dies. Two candidate mechanisms: (i) REGISTRATION —
    // stale cues leak the drift-since-birth signal honestly to selection; (ii)
    // NEWBORN DEMOGRAPHY — the honest-newborn window is a pure fecundity tax in a
    // single cell (full-mismatch penalty, no migration to spend the information on),
    // and pre-adjustment removes the tax. The missing 2x2 cells decide:
    // live cue + birthCue pre  -> (ii) predicts SURVIVES, (i) predicts dies.
    // birth cue + birthCue post -> (ii) predicts DIES,     (i) predicts survives.
    // REGISTERED PREDICTION: mechanism (ii) — the staleness leak (~0.08 units over a
    // ~5-tick lifespan) is too small to matter against lags of ~0.3; the demographic
    // channel dominates. live+pre survives r160; birth+post dies.
    timing1c() {
        const LIN05 = { ...BASE, plasticityModel: 'linear', reactionNormSlope: 0.5, adaptiveStepSize: 0 };
        return [
            { id: 'tm3_livePre_r160', meta: { plasticity: 'lin0.5pre', rate: 160 }, config: { epoch: 30000, reportEvery: 250, overrides: { ...LIN05, birthCue: 'pre' }, environmentPatterns: env(160) } },
            { id: 'tm3_birthPost_r160', meta: { plasticity: 'lin0.5B', rate: 160 }, config: { epoch: 30000, reportEvery: 250, overrides: { ...LIN05, cuePeriod: 0, birthCue: 'post' }, environmentPatterns: env(160) } },
        ];
    },
    // Timing 2 — ordering-sensitivity suite for the "newborn bug" decision (2026-08-28,
    // Chris: does testing newborns on raw genotype constitute an ordering bug, and what
    // moves if we fix it?). fitnessTiming "currentTick" = adapt before the tick's
    // reproduction test (uniform delay-0; newborns tested after first adjustment).
    // REGISTERED PREDICTIONS:
    //  P1 (step etaC bracket, rates 40-160): currentTick removes both the newborn TAX
    //    (demographic cost) and most of the newborn SIGNAL (the one honest selection
    //    event per lifetime, which F2 says is the binding constraint in shielded
    //    populations). Signal loss should dominate: step0.5 etaC under currentTick
    //    <= lastTick (shielding deepens or holds; shift <= one rate bin).
    //  P2 (lin1 a6/T4): lastTick dies (F14c, intrinsic delay-1), currentTick SURVIVES
    //    (delay-0 = truly instant compensation). Validates the delay interpretation.
    //  P3 (labile lin0.5 r160): currentTick newborns are tested half-compensated —
    //    the tax is halved; predict survival markedly improves vs lastTick's 12/12
    //    (consistent with timing1c's live+pre 0/13).
    //  P4 (spatial step r80 strip, both mechanisms): natal migration still assesses
    //    the raw birth phenotype (honest information channel intact) while the
    //    newborn'S first selection tax is softened — predict extinction below
    //    lastTick's F10-style partial mortality.
    timing2() {
        const out = [];
        const STEP = { ...BASE, adaptiveStepSize: 0.5 };
        const one = (id, meta, overrides, temporal, epoch, reportEvery = 250) => out.push({
            id, meta, config: { epoch, reportEvery, overrides, environmentPatterns: { spatial: { type: 'uniform', parameters: { baseEnvironment: 0 } }, temporal } },
        });
        for (const ft of ['lastTick', 'currentTick'])
            for (const rate of [40, 60, 80, 120, 160])
                one(`t2_step_${ft}_r${rate}`, { plasticity: ft === 'currentTick' ? '0.5CT' : 0.5, rate }, { ...STEP, fitnessTiming: ft }, { type: 'linear', parameters: { changeRate: rate } }, 50000);
        for (const ft of ['lastTick', 'currentTick']) {
            one(`t2_lin1_${ft}_a6T4`, { plasticity: ft === 'currentTick' ? 'lin1CT' : 'lin1', rate: 'a6/T4' }, { ...BASE, plasticityModel: 'linear', reactionNormSlope: 1, adaptiveStepSize: 0, fitnessTiming: ft }, { type: 'cycling', parameters: { cycleAmplitude: 6, cyclePeriod: 4 } }, 30000);
            one(`t2_lin0.5_${ft}_r160`, { plasticity: ft === 'currentTick' ? 'lin0.5CT' : 'lin0.5', rate: 160 }, { ...BASE, plasticityModel: 'linear', reactionNormSlope: 0.5, adaptiveStepSize: 0, fitnessTiming: ft }, { type: 'linear', parameters: { changeRate: 160 } }, 30000);
        }
        const strip = { numRows: 1, numCols: 24, worldEdges: 'island', targetObservationalNoise: 0, sexualReproduction: false, offspringMigrationChance: 0.1, adultMigrationChance: 0.1, needMigrationScale: 0.4, fitTargetedMigration: true, adaptiveStepSize: 0.5 };
        for (const ft of ['lastTick', 'currentTick'])
            out.push({
                id: `t2_sp_step_${ft}`, meta: { plasticity: ft === 'currentTick' ? '0.5CT' : 0.5, rate: 'r80both' },
                config: {
                    epoch: 50000, reportEvery: 500, overrides: { ...strip, fitnessTiming: ft },
                    environmentPatterns: { spatial: { type: 'gradient', parameters: { gradientStrength: 2 } }, temporal: { type: 'linear', parameters: { changeRate: 80 } } },
                },
            });
        return out;
    },
    // Lifespan 1 — Chris's lifespan sweep (2026-08-28, registered pre-run). Mean
    // lifespan = 1/deathChance; the default 0.2 -> ~5 ticks -> ~5 adjustment events and
    // reach = step x lifespan = 2.5. Lifespan confounds THREE axes: plastic reach,
    // newborn turnover (the taxed/honest fraction per tick), and cue staleness
    // (rate x lifespan). Two sub-sweeps decouple them:
    //   (a) reach-VARYING: dc in {0.4, 0.2, 0.1, 0.05}, step 0.5 (reach 1.25 -> 10);
    //   (b) reach-HELD: step co-varied {1.0, 0.5, 0.25, 0.125} so reach stays 2.5.
    // REGISTERED PREDICTIONS:
    //  L1 (a, trend): longer life deepens shielding (more complete compensation, fewer
    //    honest newborns per tick) -> step0.5 extinction extends to LOWER rates as dc
    //    falls (etaC decreases with lifespan).
    //  L2 (a, cycle a16/T200, beyond baseline reach): cycle-buffer capacity grows with
    //    reach -> dc 0.05 (reach 10) survives where dc 0.2 (reach 2.5) dies.
    //  L3 (b, trend): if reach is the operative organism parameter, reach-held arms
    //    behave near-identically across dc; residual differences isolate the
    //    turnover-tax channel (weak prior: long life slightly safer, fewer taxed
    //    newborns per tick).
    //  L4 (p0 controls at r240/280): exploratory — fecundity selection acts per tick,
    //    so bare-genetics etaC should be roughly lifespan-independent (weak prior).
    lifespan1() {
        const out = [];
        const one = (id, meta, overrides, temporal) => out.push({
            id, meta, config: { epoch: 50000, reportEvery: 250, overrides, environmentPatterns: { spatial: { type: 'uniform', parameters: { baseEnvironment: 0 } }, temporal } },
        });
        const trend = r => ({ type: 'linear', parameters: { changeRate: r } });
        const cyc = { type: 'cycling', parameters: { cycleAmplitude: 16, cyclePeriod: 200 } };
        const DCS = [0.4, 0.2, 0.1, 0.05];
        for (const dc of DCS) {
            const tag = dc === 0.2 ? '' : `dc${dc}`;
            // (a) reach-varying
            for (const r of [40, 80, 160]) one(`ls_a_dc${dc}_r${r}`, { plasticity: `0.5${tag}`, rate: r }, { ...BASE, adaptiveStepSize: 0.5, deathChancePerGeneration: dc }, trend(r));
            one(`ls_a_dc${dc}_a16T200`, { plasticity: `0.5${tag}`, rate: 'a16/T200' }, { ...BASE, adaptiveStepSize: 0.5, deathChancePerGeneration: dc }, cyc);
            // (b) reach-held at 2.5: step = 0.5 * (dc / 0.2)
            const step = 0.5 * dc / 0.2;
            for (const r of [40, 80]) one(`ls_b_dc${dc}_r${r}`, { plasticity: `${step}${tag}`, rate: r }, { ...BASE, adaptiveStepSize: step, deathChancePerGeneration: dc }, trend(r));
            // p0 controls
            for (const r of [240, 280]) one(`ls_p0_dc${dc}_r${r}`, { plasticity: `0${tag}`, rate: r }, { ...BASE, adaptiveStepSize: 0, deathChancePerGeneration: dc }, trend(r));
        }
        return out;
    },
    // Dose 2 — fill panel (b) of paper Fig 2: etaC vs compensation strength for the
    // three organism designs, with fine rate grids around every transition (bracket
    // width = grid resolution, so tighter bars need finer bins, not just more reps).
    // REGISTERED PREDICTIONS (2026-08-29, pre-run):
    //  D1 (labile linear): etaC(b) ≈ (1−b)·etaC(0) ≈ 270(1−b) — the residual signal
    //    fraction sets the survivable rate. Support in hand: lin0.5 bracket midpoint
    //    ≈130 ≈ 0.5·270. Prediction: the labile curve DIVES toward 0 as b→1
    //    (lin0.75 ≈ 67, lin0.9 ≈ 27) with a discontinuous jump to "no etaC" at
    //    exactly b=1 — the closer to perfect compensation, the more fragile, until
    //    exactly perfect.
    //  D2 (developmental/Chevin): lies ABOVE the labile curve at every b<1 (the
    //    timing rescue) and is U-SHAPED: 273 at b=0, minimum at intermediate b
    //    (chev0.5 bracket 160–240), rising ABOVE bare genetics as b→1 — chev1 should
    //    survive rates in the thousands (persistence without evolution: mismatch =
    //    staleness ≈ rate × age; tolerable up to roughly rate ~ 2·10⁴/lifespan ≈ 4000).
    //  D3 (step refinements): monotonic decline confirmed with tighter brackets.
    dose2() {
        const out = [];
        const one = (id, meta, overrides, rate) => out.push({
            id, meta, config: { epoch: 50000, reportEvery: 250, overrides, environmentPatterns: env(rate) },
        });
        const LAB = b => ({ ...BASE, plasticityModel: 'linear', reactionNormSlope: b, adaptiveStepSize: 0 });
        const CHEV = b => ({ ...LAB(b), cuePeriod: 0, birthCue: 'pre' });
        const STEP = s => ({ ...BASE, adaptiveStepSize: s });
        // labile linear: new slopes + riser refinements
        for (const r of [180, 200, 220, 240]) one(`d2_lab0.25_r${r}`, { plasticity: 'lin0.25', rate: r }, LAB(0.25), r);
        for (const r of [120, 140]) one(`d2_lab0.5_r${r}`, { plasticity: 'lin0.5', rate: r }, LAB(0.5), r);
        for (const r of [40, 60, 80, 100]) one(`d2_lab0.75_r${r}`, { plasticity: 'lin0.75', rate: r }, LAB(0.75), r);
        for (const r of [10, 20, 30, 40, 60]) one(`d2_lab0.9_r${r}`, { plasticity: 'lin0.9', rate: r }, LAB(0.9), r);
        // developmental: new slopes + chev0.5 refinement + chev1 high-rate hunt
        for (const r of [200, 220, 240, 260, 280]) one(`d2_chev0.25_r${r}`, { plasticity: 'lin0.25Bpre', rate: r }, CHEV(0.25), r);
        for (const r of [180, 200, 220]) one(`d2_chev0.5_r${r}`, { plasticity: 'lin0.5Bpre', rate: r }, CHEV(0.5), r);
        for (const r of [100, 140, 160, 180, 200]) one(`d2_chev0.75_r${r}`, { plasticity: 'lin0.75Bpre', rate: r }, CHEV(0.75), r);
        for (const r of [300, 600, 1200, 2400, 4800]) one(`d2_chev1_r${r}`, { plasticity: 'lin1Bpre', rate: r }, CHEV(1), r);
        // step-dose bracket refinements
        for (const r of [45, 50, 55]) one(`d2_step0.5_r${r}`, { plasticity: 0.5, rate: r }, STEP(0.5), r);
        for (const r of [110, 120, 130]) one(`d2_step0.1_r${r}`, { plasticity: 0.1, rate: r }, STEP(0.1), r);
        for (const r of [65, 70, 75]) one(`d2_step0.25_r${r}`, { plasticity: 0.25, rate: r }, STEP(0.25), r);
        for (const r of [25, 30, 35]) one(`d2_step1_r${r}`, { plasticity: 1, rate: r }, STEP(1), r);
        return out;
    },
    // Dose 3 — pin the upturns (2026-08-29, registered pre-run). dose2 found both
    // etaC(b) curves are VALLEYS, not dives: labile follows ~(1-b)·270 through b=0.75
    // (200/150/~95 measured vs 202/135/67 predicted) but lin0.9 survives 60+
    // (predicted 27) — the dive flattens/turns, plausibly because weak selection lets
    // variance accumulate (lin0.9 varGeno 0.04–0.07 vs lin0.25's 0.026), offsetting
    // signal loss. Developmental declines 273→245→190→120 through b=0.75 then
    // EXPLODES: chev1 survives 300–2400 with the genotype frozen (lag −12,000 at
    // r2400 — persistence with zero evolution) and dies at 4800.
    // REGISTERED PREDICTIONS:
    //  E1: both curves have interior minima; the developmental minimum sits near
    //      b≈0.75–0.85 with the upturn steeper and earlier than the labile one,
    //      whose minimum sits near b≈0.9–0.95 (deeper valley, later recovery).
    //  E2: chev0.9 lands between chev0.75 (~120) and chev1 (~4000), well above 273
    //      by b=0.9 (the upturn crosses bare genetics between 0.75 and 0.9).
    //  E3: chev1 bracket pins near ~3,000–4,000 (staleness-load limit ≈ tolerable
    //      mismatch / mean age).
    dose3() {
        const out = [];
        const one = (id, meta, overrides, rate) => out.push({
            id, meta, config: { epoch: 50000, reportEvery: 250, overrides, environmentPatterns: env(rate) },
        });
        const LAB = b => ({ ...BASE, plasticityModel: 'linear', reactionNormSlope: b, adaptiveStepSize: 0 });
        const CHEV = b => ({ ...LAB(b), cuePeriod: 0, birthCue: 'pre' });
        for (const r of [80, 100, 140, 180]) one(`d3_lab0.9_r${r}`, { plasticity: 'lin0.9', rate: r }, LAB(0.9), r);
        for (const r of [60, 100, 160, 220]) one(`d3_lab0.95_r${r}`, { plasticity: 'lin0.95', rate: r }, LAB(0.95), r);
        for (const r of [150, 300, 600, 1200]) one(`d3_chev0.9_r${r}`, { plasticity: 'lin0.9Bpre', rate: r }, CHEV(0.9), r);
        for (const r of [3200, 4000]) one(`d3_chev1_r${r}`, { plasticity: 'lin1Bpre', rate: r }, CHEV(1), r);
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
