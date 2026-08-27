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

## Stages

### 1. Core model [ DONE ]
- [x] Grid, organisms, selection, mutation, death, migration (Nov 2024)
- [x] Plasticity with cue noise (Nov 2024)
- [x] Dynamic environment: spatial + temporal patterns (Nov 2024 – Mar 2025)
- [x] Sexual reproduction option (Apr 2025)
- [x] Visualization: graphs, quartile cells, gene histograms (Jan–Mar 2025)

### 2. Model-completeness items from Jobran (Feb/Apr 2025) [ PLANNED ]
- [ ] **Burn-in**: run `burnInGenerations` before temporal change / migration switches on
- [ ] **Edges off**: boundary option (torus ↔ hard edges) for `migrate()`
- [ ] Expose cue noise (`targetObservationalNoise`) and plasticity on/off cleanly in the UI as experiment toggles

**Done when:** each is a PARAMS/UI toggle, defaults reproduce current behavior.

### 3. Critical rate of change [ PLANNED ] ← *the blocker named in the hub file*
- [ ] Implement the Chevin/Lande/Mace 2010 critical-rate metric (`../references/Chevin2010_adaptation_plasticity_extinction.pdf` + S1) adapted to this model
- [ ] Track/report it live and in saved packets; sweep linear-change rate → extinction probability curve

**Done when:** a rate sweep produces an extinction-probability-vs-rate curve with a
measurable critical rate, with and without plasticity.

### 4. Institute-feedback experiments (Apr 2025 list) [ PLANNED ]
- [ ] **Drift control**: is variance collapse just genetic drift at small N? (vary softCap / N at fixed selection)
- [ ] **Plasticity-model control**: linear reaction-norm plasticity (Chevin-style) — does shielding persist?
- [ ] **Single-population test**: does shielding→extinction occur in one isolated cell? (rules out migration)
- [ ] **Polechová comparison**: map our temporal-change results onto her claim that plasticity doesn't move the critical rate

**Done when:** each question has a figure + a written answer, replicated (multiple seeds —
never report a single stochastic run).

### 5. Headless runner + batch infrastructure [ PLANNED ]
- [ ] Conventions-standard headless runner (main-realm eval, shared sim core — never fork it), `batch_NNN` collections, PARAMS serialized into every packet
- [ ] Replicate seeds per condition; run-name grammar documented here

**Done when:** a parameter sweep runs unattended and every figure regenerates from a
documented command.

### 6. Paper [ PLANNED ]
- [ ] `paper/` repo in the container (per conventions); venue TBD with Jobran
- [ ] Position against Polechová 2025; Vedder 2013 as the results archetype; bibliography seeded from `../references/litlens_papers.csv` and the Feb 2025 email list
