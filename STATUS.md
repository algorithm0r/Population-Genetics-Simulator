# STATUS — PopGenSim (MAAD)

**Updated:** 2026-08-28, close of the full experimental program (F1–F13 complete)
**Verified:** warm, this session — smoke 15/15; ~3,470 seeded runs across 15 batches; every "works" claim carries a regeneration command in FINDINGS.md; all batches mirrored to Mongo (`populationGeneticsDB.maad_<batch>`, count-verified); browser sim + DB endpoint live on Pages. No cold `/audit` yet.

**Stage:** experiments DONE — every registered hypothesis resolved. Next phase is **writing** (paper skeleton with Jobran) + any polish runs the skeleton demands.

**State — thirteen findings, all in [headless/FINDINGS.md](headless/FINDINGS.md) with regen commands:**

- F1–F4: shielding cuts ηc 5–6× (273 → 50); mechanism = lag-load, variance never depletes; plasticity form/reach decisive; ηc monotonic in dose. Figure: `etac.svg`.
- F5–F6: peak-rate rule under cycles; **the rescue flip** — one mechanism, sign set by the environment's return-structure. Figure: `rescue-flip.svg`.
- F7–F9 (spatial): migration rescues via **variance supply, never relocation**; a **gradient converts migration to net load**; shielded uniform-world rescue is **bistable**.
- F10–F11 (informed migration): need + fit **jointly necessary, singly useless**; mechanism is a *sorting machine*; genotype (innate-cue) assessment → **0/30 extinct**: the constraint was **information, not selection** — plasticity's spatial harm is a blindfold effect.
- F12 (realistic environments): composite worlds **worse than the sum of their parts** for plastic populations (buffered cycles drain the trend's reach budget); plateau double dissociation (**excursion kills the plastic, rate kills the genetic**); red noise always favors plasticity.
- F13 (finale): under the climate shape the gradient **flips from burden to refuge** — honest information rescues completely on the gradient (0/19) but not in the uniform world (12/12 dead, identical to blindfolded): **information and landscape are complements, not substitutes.**
- Registered-hypothesis ledger: all resolved (FINDINGS footer). realizedResp validated as the mechanism metric.

**Metrics:** ~3,470 runs, 15 batches, all deterministic-seeded and resumable; Mongo mirrors count-verified; worker ceiling 10 on this machine (Chris-authorized); mint deferred until large spatial factorials.

**Branches:** `main`, pushed through this close (Pages deploys on push).

**Open:**

- **The paper** — arc: shielding cuts ηc → sign set by return-structure → plasticity eats the mismatch signal that selection *and* informed movement consume → honest cues restore it → but only where space provides options. Venue rec: Am Nat (sent to Jobran). `paper/` repo to scaffold when writing starts.
- Polish runs to design with Jobran: bistable-cell seeds, gradient-steepness sweep, torus-vs-island, evolvable plasticity, F13 rate/amplitude sweep, F13 fine-grained centroid probe (reportEvery ≠ cycle period — current sampling is phase-locked).
- Cosmetic: dashboard could plot cyclic/spatial batches natively; coordinator heartbeat-based dead-claim reclaim (benign, documented).

**Next action:** Chris + Jobran read FINDINGS.md F11–F13 and decide the paper skeleton.

**Blockers:** none.
