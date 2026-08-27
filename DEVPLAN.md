# DEVPLAN — PopGenSim (MAAD)

**Living document, not frozen.** Forward-looking plan; history lives in DEVLOG.md.

## What this is

**MAAD — Migrate, Adapt, Adjust, or Die.** An agent-based model, built with Jobran
Chebib, of the four responses a population has to environmental change: migrate
(move to a better cell), adapt (genetic evolution), adjust (phenotypic plasticity),
or die (extinction). The research question cluster (from the Dec 2024 scoping):
how these mechanisms **interact**, when plasticity **buffers vs. hinders** evolution,
and whether plasticity moves the **critical rate of environmental change** a
population can survive.

**Central observed phenomenon — "shielding":** plasticity moves phenotypes to the
optimum before selection acts, hiding genotypic variation from selection; genetic
variance decays; when the environment moves, the population lacks the variance to
respond and collapses. This is in direct tension with **Polechová 2025**
(`../references/Polechova2025_range_changing_environments_plasticity_NEW.pdf`),
who found plasticity does not extend the range of survivable rates of temporal
change. That tension is the paper.

**Publication shape** (Jobran, Feb 2025): Vedder et al. 2013 as the archetype —
empirically-informed parameters, extinction probability with vs. without plasticity.

## Model at a glance

| Piece | Implementation | Code |
|---|---|---|
| World | numRows × numCols grid of `Population` cells, torus | `automata.js`, `population.js` |
| Environment | per-cell target = spatial pattern (uniform/gradient/random) + temporal pattern (static/linear/cycling) | `environmentalPatterns.js` |
| Organism | `numLocii` real-valued genes; genotype = Σ genes; phenotype starts at genotype | `organism.js`, `gene.js` |
| Plasticity ("adjust") | per-generation step toward (target + cueNoise), step ≈ \|N(step, step)\| capped at remaining distance (no overshoot); cueNoise ~ N(0, obsNoise) fixed per individual at birth | `organism.js adapt()` |
| Selection | expected offspring = max(maxOffspring·e^(−\|phenotype−target\|/reproVariance) − N/softCap, 0) — selection acts on the **post-plasticity** phenotype | `population.js` |
| Reproduction | asexual (clone + mutate) or sexual (uniform per-locus from 2 parents, 0.5 offspring cost each) | `population.js` |
| Mutation | per-locus rate, additive N(0, mutationRange) | `gene.js` |
| Migration | offspring/adult chance → uniform Moore neighbor, torus wrap | `population.js migrate()` |
| Death | fixed chance per generation | `population.js` |
| Data | socket.io → Mongo (`populationGeneticsDB` @ PARAMS.ip); graphs + per-cell histograms in-browser | `datamanager.js`, `graphs.js`, `histogram.js` |

## Built / Not yet built

**Built:** grid world, plasticity, migration, asexual + sexual reproduction, dynamic
environments (linear & cycling), population/phenotype/genotype graphs, per-cell gene
histograms, DB hookup.

**Not yet built:** burn-in phase, edge (non-torus) option, critical-rate-of-change
measurement, headless batch runner, the four institute-feedback experiments, the paper.

---

## Phases
*(Restructured 2026-08-27 after the paper-potential assessment: two Phase-0 tracks run
in parallel; Phase 1+ is gated on the literature check.)*

### 0. Core model [ DONE ]
- [x] Grid, organisms, selection, mutation, death, migration (Nov 2024)
- [x] Plasticity with cue noise (Nov 2024); dynamic environments (Nov 2024 – Mar 2025)
- [x] Sexual reproduction option (Apr 2025); visualization suite (Jan–Mar 2025)

### 0a. Verification + instrumentation infrastructure [ ACTIVE ]
- [x] Headless runner sub-project (`headless/`) — exact sim core, main-realm eval, view stubbed (2026-08-27)
- [x] Seeded RNG (mulberry32 over Math.random) — full reproducibility (2026-08-27)
- [x] Smoke suite: determinism, persistence, plasticity-off, extinction sanity — 6/6 PASS (2026-08-27)
- [x] Mechanism instrumentation: N, var/mean genotype+phenotype, lag, realized selection differential on genotype (2026-08-27)
- [ ] Pilot 1: single-population shielding replication, plasticity {0, 0.5} × rate {0..300/10k} × 10 seeds (RUNNING 2026-08-27)
- [ ] Browser sim visual check (Chris — eyes on screen)

**Done when:** pilot replicates (or kills) the slide result with ≥10 seeds/condition and
mechanism traces distinguish lag-of-mean vs. variance-erosion.

### 0b. Literature positioning [ ACTIVE ] → gates Phase 1+
- [x] Defensive novelty sweep + offensive claim-space map → `../references/LITERATURE.md` (2026-08-27)
  - Verdict: claim space crowded but the contribution is available; Nunney 2016 closest
    precedent; Vinton et al. 2022 (TREE) state our mechanism as hypothesis; frame =
    adjudicate the helps/neutral/harms disagreement, quantify ηc reduction, extend to space.
- [ ] Verification debts: read Nunney 2016 full text; published Vinton 2022; Scheiner XIV/XVI; re-check citers of Vinton 2022 at writing time

### 1. Controls (institute-feedback list, Apr 2025) [ TESTING ]
- [x] ~~Drift control~~ — largely mooted by F2 (variance never depletes; the killer is the frozen mean). One large-N confirmation figure still worth having.
- [x] **Plasticity-form control** (2026-08-27, F3): linear norms implemented flag-gated; prediction half-refuted — slope-1 unkillable, slope-0.5 *worse than nothing*. Form + reach are the knobs.
- [ ] **Shielding-separation control**: force selection on genotype with plasticity active (separates "phenotype optimal" from "selection removed")
- [ ] Burn-in phase + edges-off toggle (Jobran's Feb 2025 requests) as PARAMS/UI options

### 2. Headline experiments [ TESTING ]
- [x] ηc(plasticity strength) curve (2026-08-27, F4): monotonic 273→119→70→50→50→32; `headless/results/etac.svg`. Chevin analytic overlay still to add.
- [ ] Mechanism figure: variance + lag + selection-differential trajectories ± plasticity (needs selDiff estimator calibration first — see FINDINGS F2 caveat)
- [x] Directional vs cyclical (2026-08-27, F5): slide-33 refuted for amplitude > reach; peak-rate rule governs.
- [ ] **Small-amplitude cyclic sweep** — registered prediction: plasticity buffers when amplitude ≤ plastic reach (~2.5) and cycles are too fast for genetic tracking (a∈{1,2}, T∈{50–500}). The boundary-conditions experiment.
- [ ] Cue-noise sweep (connects to Ashander 2016 / King & Hadfield 2019 cue-reliability axis)

### 3. Spatial differentiator [ PLANNED ]
- [ ] Gradient + migration factorial: can moving substitute for adjusting?
- [ ] Does plasticity delay range shifts by masking maladaptation? (connects to Polechová's fragmentation)

### 4. Paper [ PLANNED ]
- [ ] `paper/` repo in container; venue with Jobran (Evolution / Am Nat / Evol Letters / Proc B tier)
- [ ] Frame: test the Vinton 2022 shading hypothesis; adjudicate helps/neutral/harms; Vedder 2013 results archetype
- [ ] Re-establish contact with Jobran (last word his, 2025-04-24) — Chris's action
