# STATUS — PopGenSim (MAAD)

**Updated:** 2026-08-28 night, after F14 (cue/adjust timing architecture + suites)
**Verified:** warm, this session — smoke 19/19; ~3,800 seeded runs across 18 batches; every "works" claim carries a regeneration command in FINDINGS.md; all batches mirrored to Mongo (`populationGeneticsDB.maad_<batch>`, count-verified); browser sim + DB endpoint live on Pages. No cold `/audit` yet.

**Stage:** experiments DONE (F1–F14) — every registered hypothesis resolved. Next phase is **writing** (paper skeleton with Jobran) + any polish runs the skeleton demands. F14's labile-trap revision must be folded into how paper 1 states the linvar result.

**State — thirteen findings, all in [headless/FINDINGS.md](headless/FINDINGS.md) with regen commands:**

- F1–F4: shielding cuts ηc 5–6× (273 → 50); mechanism = lag-load, variance never depletes; plasticity form/reach decisive; ηc monotonic in dose. Figure: `etac.svg`.
- F5–F6: peak-rate rule under cycles; **the rescue flip** — one mechanism, sign set by the environment's return-structure. Figure: `rescue-flip.svg`.
- F7–F9 (spatial): migration rescues via **variance supply, never relocation**; a **gradient converts migration to net load**; shielded uniform-world rescue is **bistable**.
- F10–F11 (informed migration): need + fit **jointly necessary, singly useless**; mechanism is a *sorting machine*; genotype (innate-cue) assessment → **0/30 extinct**: the constraint was **information, not selection** — plasticity's spatial harm is a blindfold effect.
- F12 (realistic environments): composite worlds **worse than the sum of their parts** for plastic populations (buffered cycles drain the trend's reach budget); plateau double dissociation (**excursion kills the plastic, rate kills the genetic**); red noise always favors plasticity.
- F13: under the climate shape the gradient **flips from burden to refuge** — honest information rescues completely on the gradient (0/19) but not in the uniform world (12/12 dead, identical to blindfolded): **information and landscape are complements, not substitutes.**
- F14 (timing): **cue timing is load-bearing** — the linvar "worse than nothing" trap is a *labile* trap (pure Chevin lin0.5 survives r160 where labile dies 12/12; mechanism = the honest-**newborn fecundity tax**, registration secondary); every timing variant remains worse than bare genetics under trends (ηc ordering 100–160 < ~160 < 160–240 < 273), so paper 1's claim survives with the labile qualifier. Staleness kills under cycles, is inert under trends. The sim's selection-before-adapt ordering is an **intrinsic delay-1 architecture** — live lin1 dies at a6/T4 where p0 survives (window structure, not average load). Spatial pre/post indistinguishable (half-sighted argmax choice suffices).
- Registered-hypothesis ledger: all resolved (FINDINGS footer). realizedResp validated as the mechanism metric.

**Metrics:** ~3,800 runs, 18 batches, all deterministic-seeded and resumable; Mongo mirrors count-verified; worker ceiling 10 on this machine (Chris-authorized); mint deferred until large spatial factorials.

**Branches:** `main`, pushed through this close (Pages deploys on push).

**Open:**

- **The paper** — arc: shielding cuts ηc → sign set by return-structure → plasticity eats the mismatch signal that selection *and* informed movement consume → honest cues restore it → but only where space provides options. Venue rec: Am Nat (sent to Jobran). `paper/` repo to scaffold when writing starts.
- Polish runs to design with Jobran: bistable-cell seeds, gradient-steepness sweep, torus-vs-island, evolvable plasticity, F13 rate/amplitude sweep, F13 fine-grained centroid probe (reportEvery ≠ cycle period — current sampling is phase-locked).
- Cosmetic: dashboard could plot cyclic/spatial batches natively; coordinator heartbeat-based dead-claim reclaim (benign, documented).

**Next action:** Chris + Jobran read FINDINGS.md F11–F14 and decide the paper skeleton (including where F14's labile qualifier and the intrinsic-delay-1 insight land: paper 1 revision vs paper 2 anchor).

**Blockers:** none.
