# STATUS — PopGenSim (MAAD)

**Updated:** 2026-08-30, session close — experimental program final (F1–F18), all seven figures drafted, manuscript started
**Verified:** warm, this session — smoke 21/21; ~6,250 seeded runs across 29 batches; every "works" claim carries a regeneration command in FINDINGS.md; all batches mirrored to Mongo (`populationGeneticsDB.maad_<batch>`, count-verified); browser sim + DB endpoint + public README live on Pages; `paper/main.tex` compiles (9 pp, all figures embedded). No cold `/audit` yet.

**Stage:** WRITING. `paper/CLAIMS.md` (13 claims; precision manifest fully discharged; F17/F18 claim updates noted) + `paper/figures/` (all seven data figures drafted) + `paper/main.tex` (abstract + intro + model drafted; results scaffolded; discussion sketched). **Project root is now `PopGenSim/`** (root CLAUDE.md authoritative — open sessions there). Standing decisions for Chris + Jobran: canonical fitness ordering (rec: lastTick + F15 appendix), the C3+C4 valley merge, whether Fig 2b is the standalone signature figure, venue (rec: Am Nat), tagging the release commit the paper cites.

**State — eighteen findings, all in [headless/FINDINGS.md](headless/FINDINGS.md) with regen commands:**

- F1–F4: shielding cuts ηc 5–6× (273 → 50); mechanism = lag-load, variance never depletes; plasticity form/reach decisive; ηc monotonic in dose. Figure: `etac.svg`.
- F5–F6: peak-rate rule under cycles; **the rescue flip** — one mechanism, sign set by the environment's return-structure. Figure: `rescue-flip.svg`.
- F7–F9 (spatial): migration rescues via **variance supply, never relocation**; a **gradient converts migration to net load**; shielded uniform-world rescue is **bistable**.
- F10–F11 (informed migration): need + fit **jointly necessary, singly useless**; mechanism is a *sorting machine*; genotype (innate-cue) assessment → **0/30 extinct**: the constraint was **information, not selection** — plasticity's spatial harm is a blindfold effect.
- F12 (realistic environments): composite worlds **worse than the sum of their parts** for plastic populations (buffered cycles drain the trend's reach budget); plateau double dissociation (**excursion kills the plastic, rate kills the genetic**); red noise always favors plasticity.
- F13: under the climate shape the gradient **flips from burden to refuge** — honest information rescues completely on the gradient (0/19) but not in the uniform world (12/12 dead, identical to blindfolded): **information and landscape are complements, not substitutes.**
- F14 (timing): **cue timing is load-bearing** — the linvar "worse than nothing" trap is a *labile* trap (pure Chevin lin0.5 survives r160 where labile dies 12/12; mechanism = the honest-**newborn fecundity tax**, registration secondary); every timing variant remains worse than bare genetics under trends (ηc ordering 100–160 < ~160 < 160–240 < 273), so paper 1's claim survives with the labile qualifier. Staleness kills under cycles, is inert under trends. The sim's selection-before-adapt ordering is an **intrinsic delay-1 architecture** — live lin1 dies at a6/T4 where p0 survives (window structure, not average load). Spatial pre/post indistinguishable (half-sighted argmax choice suffices).
- F15 (ordering): the honest-newborn window = the intrinsic delay-1's degenerate case; **paper-1's step core is ordering-robust** (identical ηc under `fitnessTiming` currentTick); delay-1 and the newborn tax causally confirmed by the ordering flip; spatially, blindfold and tax are **jointly necessary burdens — removing either fully rescues** (F11/F15 triangulation).
- F16 (lifespan): **live fast, adapt honest** — plastic ηc falls with lifespan (dc 0.4 survives r80; dc ≤0.1 dies at r40); cycle buffering scales with reach; but at FIXED reach longevity still harms (turnover starves the honest-newborn channel, ~births/capita-tick = death rate); bare ηc falls too (generation time) yet the plastic/bare ratio still shrinks — shielding's relative harm grows with longevity. Long-lived plastic species = most vulnerable class, healthiest-looking while dying.
- F17 (the valley): both linear-norm timing regimes carve **ηc valleys** bottoming 3–5× below bare genetics at *near-perfect* compensation (labile ~52 at b≈0.95, developmental ~80 at b≈0.9); escape only at exactly-perfect — labile unkillable, developmental **~4,000 = persistence with zero evolution** (30× discontinuity; 1% genotype coupling costs 30×). Real (bounded, imperfect) plasticity lives in the valley; the most buffered-looking organisms are the most fragile. Fig 2b.
- F18 (precision completions): the **lifespan ratio curve** pinned — plastic/bare ηc ratio 0.38 → 0.19 → 0.06 → 0.04 across lifespans 2.5–20 (relative harm 2.6× → 28×), Fig 7; and the **refuge's three bands** — trend 40: landscape alone suffices (even blind); 80: honesty required; 160: nothing survives (honesty still triples TTE). The refuge is a region in (rate × landscape × honesty). Fig 6a.
- Registered-hypothesis ledger: all resolved (FINDINGS footer + per-finding round ledgers). realizedResp validated as the mechanism metric.

**Metrics:** ~6,250 runs, 29 batches, all deterministic-seeded and resumable; Mongo mirrors count-verified; worker ceiling 10 on this machine (Chris-authorized); mint deferred (never needed).

**Branches:** `main`, pushed through this close (Pages deploys on push; public README live).

**Open:**

- **The manuscript** (`../paper/main.tex`, compiles): expand results prose around the drafted topic sentences; draft the discussion (five moves sketched); verify the two TODO bib entries against `../references/`; Fig 1 (model schematic) drawn during writing; figure cosmetics after form settles.
- With Jobran: react to CLAIMS.md + abstract/intro + figure set; the C3+C4 valley merge; Fig 2b standalone question; canonical ordering blessing (rec: lastTick + F15 appendix); tag the release commit the paper cites; venue call (rec: Am Nat).
- Optional polish (none blocking): bistable-cell seeds if featured, gradient-steepness sweep, torus-vs-island, evolvable plasticity (paper-2 adjacent), F13 fine-grained centroid probe (reportEvery ≠ cycle period).
- Cosmetic: dashboard could plot cyclic/spatial batches natively; coordinator heartbeat-based dead-claim reclaim (benign, documented).

**Next action:** Chris + Jobran read `paper/CLAIMS.md`, the seven figures, and main.tex's abstract/intro; then results-prose expansion and the discussion draft.

**Blockers:** none.
