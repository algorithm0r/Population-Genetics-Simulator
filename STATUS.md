# STATUS — PopGenSim (MAAD)

**Updated:** 2026-08-29, after F15 (ordering sensitivity) + F16 (lifespan sweep)
**Verified:** warm, this session — smoke 21/21; ~4,400 seeded runs across 21 batches; every "works" claim carries a regeneration command in FINDINGS.md; all batches mirrored to Mongo (`populationGeneticsDB.maad_<batch>`, count-verified); browser sim + DB endpoint live on Pages. No cold `/audit` yet.

**Stage:** experiments DONE (F1–F16) — every registered hypothesis resolved. Next phase is **writing** (paper skeleton with Jobran). Standing decisions for Chris + Jobran: canonical fitness ordering (rec: lastTick + F15 robustness appendix), where F14's labile qualifier and F16's longevity panel land in paper 1.

**State — thirteen findings, all in [headless/FINDINGS.md](headless/FINDINGS.md) with regen commands:**

- F1–F4: shielding cuts ηc 5–6× (273 → 50); mechanism = lag-load, variance never depletes; plasticity form/reach decisive; ηc monotonic in dose. Figure: `etac.svg`.
- F5–F6: peak-rate rule under cycles; **the rescue flip** — one mechanism, sign set by the environment's return-structure. Figure: `rescue-flip.svg`.
- F7–F9 (spatial): migration rescues via **variance supply, never relocation**; a **gradient converts migration to net load**; shielded uniform-world rescue is **bistable**.
- F10–F11 (informed migration): need + fit **jointly necessary, singly useless**; mechanism is a *sorting machine*; genotype (innate-cue) assessment → **0/30 extinct**: the constraint was **information, not selection** — plasticity's spatial harm is a blindfold effect.
- F12 (realistic environments): composite worlds **worse than the sum of their parts** for plastic populations (buffered cycles drain the trend's reach budget); plateau double dissociation (**excursion kills the plastic, rate kills the genetic**); red noise always favors plasticity.
- F13: under the climate shape the gradient **flips from burden to refuge** — honest information rescues completely on the gradient (0/19) but not in the uniform world (12/12 dead, identical to blindfolded): **information and landscape are complements, not substitutes.**
- F14 (timing): **cue timing is load-bearing** — the linvar "worse than nothing" trap is a *labile* trap (pure Chevin lin0.5 survives r160 where labile dies 12/12; mechanism = the honest-**newborn fecundity tax**, registration secondary); every timing variant remains worse than bare genetics under trends (ηc ordering 100–160 < ~160 < 160–240 < 273), so paper 1's claim survives with the labile qualifier. Staleness kills under cycles, is inert under trends. The sim's selection-before-adapt ordering is an **intrinsic delay-1 architecture** — live lin1 dies at a6/T4 where p0 survives (window structure, not average load). Spatial pre/post indistinguishable (half-sighted argmax choice suffices).
- F15 (ordering): the honest-newborn window = the intrinsic delay-1's degenerate case; **paper-1's step core is ordering-robust** (identical ηc under `fitnessTiming` currentTick); delay-1 and the newborn tax causally confirmed by the ordering flip; spatially, blindfold and tax are **jointly necessary burdens — removing either fully rescues** (F11/F15 triangulation).
- F16 (lifespan): **live fast, adapt honest** — plastic ηc falls with lifespan (dc 0.4 survives r80; dc ≤0.1 dies at r40); cycle buffering scales with reach; but at FIXED reach longevity still harms (turnover starves the honest-newborn channel, ~births/capita-tick = death rate); bare ηc falls too (generation time) yet the plastic/bare ratio still shrinks — shielding's relative harm grows with longevity. Long-lived plastic species = most vulnerable class, healthiest-looking while dying.
- Registered-hypothesis ledger: all resolved (FINDINGS footer). realizedResp validated as the mechanism metric.

**Metrics:** ~4,400 runs, 21 batches, all deterministic-seeded and resumable; Mongo mirrors count-verified; worker ceiling 10 on this machine (Chris-authorized); mint deferred until large spatial factorials.

**Branches:** `main`, pushed through this close (Pages deploys on push).

**Open:**

- **The paper** — arc: shielding cuts ηc → sign set by return-structure → plasticity eats the mismatch signal that selection *and* informed movement consume → honest cues restore it → but only where space provides options. Venue rec: Am Nat (sent to Jobran). `paper/` repo to scaffold when writing starts.
- Polish runs to design with Jobran: bistable-cell seeds, gradient-steepness sweep, torus-vs-island, evolvable plasticity, F13 rate/amplitude sweep, F13 fine-grained centroid probe (reportEvery ≠ cycle period — current sampling is phase-locked).
- Cosmetic: dashboard could plot cyclic/spatial batches natively; coordinator heartbeat-based dead-claim reclaim (benign, documented).

**Next action:** Chris + Jobran read FINDINGS.md F11–F14 and decide the paper skeleton (including where F14's labile qualifier and the intrinsic-delay-1 insight land: paper 1 revision vs paper 2 anchor).

**Blockers:** none.
