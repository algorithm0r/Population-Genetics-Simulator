# STATUS — PopGenSim (MAAD)

**Updated:** 2026-08-27 (autonomous session: recovery → infrastructure → literature → pilot replication)
**Verified:** partially, this session — headless smoke suite 6/6 PASS @ `a64a197`+; pilot results seeded & replicated (≥10 reps/bin, Wilson CIs). Browser sim NOT visually checked (code unchanged since `06a9e91`, 2025-04). No cold `/audit` yet.

**Stage:** DEVPLAN Phase 0a (infrastructure) ≈ DONE · Phase 0b (literature) DONE with debts noted · entering Phase 1 (controls).

**State:**
- **Headline (replicated, seeded, 284 runs):** shielding-extinction is real and larger than the Apr 2025 slides suggested — ηc(no plasticity) ∈ (240, 300] units/10k gens; ηc(plasticity 0.5) < 100; time-to-extinction falls smoothly with rate. Static controls survive in both arms.
- **Mechanism (measured):** lag-load — shielded selection freezes genotypic tracking; adults ride ~2.4 units of plastic reach; recruitment collapses. Genetic variance never exhausted (it is ~7× HIGHER under plasticity in static envs). Corrects the institute-era "variance erosion" story; drift (Jobran Q1) largely answered.
- **Literature verdict (Phase 0b):** claim space crowded but open where we sit — Nunney 2016 is the close precedent (read in full); Vinton 2022 (TREE) hypothesized our mechanism untested; the field disagrees four ways; our lanes = plasticity-form generalization, direct mechanism measurement, the spatial axis (untouched by anyone), adjudication frame. See `../references/LITERATURE.md`.
- **Infrastructure:** headless runner (exact sim core, seeded), adaptive coordinator + workers + live dashboard (http://127.0.0.1:8091 while a batch runs), aggregator. All committed.
- Batch `bracket1` RUNNING (pins both ηc values; results land in `headless/results/bracket1.jsonl`).
- Uncommitted: DEVLOG/STATUS/DEVPLAN doc updates (this close).

**Metrics:** pilot1x — 28 bins, 284 runs, 100% seeded-reproducible; runtime ~21 s per surviving 50k-gen run; 10 workers.

**Branches:** `main` only. **Not pushed** — remote is live GitHub Pages; pushing = deploying (Chris's call).

**Open:**
- bracket1 ηc pin → then Phase 1 controls: **linear reaction-norm variant** (registered prediction: shielding harm disappears — plasticity form is the decisive knob), forced-genotype-selection control, one softCap figure
- selDiff estimator calibration (absolute values not yet trustworthy; lag divergence is)
- Cyclical regimes (slide-33 hypothesis), then spatial factorial (the paper's differentiator)
- Literature debts: published Vinton 2022 text; Scheiner XIV/XVI; re-check Vinton citers at writing time
- Chris: eyes on browser sim; decision on contacting Jobran (mechanism correction is worth a note — his institute Q1/Q2 now have data)

**Next action:** collect bracket1 → update ηc table → implement linear reaction-norm plasticity variant (Phase 1's decisive control).

**Blockers:** none.
