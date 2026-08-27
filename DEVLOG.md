# DEVLOG — PopGenSim (MAAD)

Backward-looking, append-only. Newest entry on top. Never edit past entries.

<!-- append new entries below this line -->

## 2026-08-27 (close) — Five findings; Phase 1–2 experiments largely done in one day

**Done:** Continued the autonomous run through four coordinator batches (~1,300 seeded
runs total). All findings in `headless/FINDINGS.md` with regeneration commands:
- **F3 (linvar):** plasticity FORM decides everything — slope-1 linear norms are
  unkillable to rate 400 (genotype in free-fall, fitness pinned); slope-0.5 linear is
  *worse than no plasticity* (ηc≈130 vs 280); bounded step-plasticity worst (ηc≈50).
  Cost-free linear-norm harm contradicts Chevin's net-benefit prediction in a
  finite-population norm model. Registered prediction was half wrong (informatively).
- **F4 (pstrength, 1,068 pooled runs):** ηc falls **monotonically** with step
  plasticity: 273 → 119 (step 0.1!) → 70 → 50 → 50 → 32. First dose hurts most.
  Money figure: `headless/results/etac.svg` (sent to Chris).
- **F5 (cyclic + probe):** ηc(0.5) confirmed stable at 200k generations (not an epoch
  artifact). Under cycles, survival is governed by each arm's ηc vs the cycle's peak
  rate 2πa/T (p0's transition bin lands exactly where that predicts); **slide-33's
  "plasticity buffers cycles" is refuted for amplitudes > plastic reach** — registered
  prediction logged that a buffer regime exists at amplitude ≤ reach (~2.5) with fast
  cycles; that's the boundary-conditions experiment for the paper.

Multi-run architecture (coordinator/workers/dashboard) built, proven across 4 batches,
committed. Known gap logged: killed workers leave phantom dispatch counts (batch still
converges; fix = heartbeat-based claim reclaim). Machine etiquette: 11 workers
saturated the box; 6 is the polite ceiling while Chris works.

**Changed:** headless/{coordinator,worker,dashboard,launch,gen-settings,agg,fig-etac,
FINDINGS}.mjs/md; organism.js + params.js (flag-gated linear-norm variant, default
behavior unchanged, smoke 7/7); DEVPLAN/STATUS; LITERATURE.md finalized at container
level.

**State:** all batch processes torn down; results (~35 MB JSONL) in headless/results/
(gitignored, regenerable); sim core browser behavior unchanged; nothing pushed.

**Next:** small-amplitude cyclic sweep (the registered buffer-regime prediction), selDiff
estimator calibration, then Phase 3 spatial factorial — the paper's differentiator.
And: Chris to eyeball the browser sim + decide on re-engaging Jobran (the mechanism
correction and F1–F5 are exactly the material for that email).

## 2026-08-27 (later) — Headless infrastructure, literature check, and the shielding result replicated

**Done:**
- **Phase 0a infrastructure:** `headless/` sub-project — exact sim core loaded via
  main-realm eval (view layer stubbed; core never forked), seeded RNG (mulberry32),
  smoke suite 6/6 PASS (determinism, persistence, plasticity-off ⇒ phenotype≡genotype,
  extinction sanity). Then the multi-run architecture, design adapted from
  Domestication's runner: adaptive coordinator (:8090; Wilson-CI-driven per-bin rep
  counts, fewest-reps-first dispatch, resumable from results JSONL, deterministic rep
  seeds), in-process workers, live dashboard (:8091), launcher, settings generators,
  aggregator (`agg.mjs` — bin summaries + mechanism traces).
- **Phase 0b literature check:** `../references/LITERATURE.md` — claim-space map and
  verdicts. Key finds: the field is in a four-way disagreement (Chevin/Scheiner: helps;
  Polechová: neutral; Nunney/Lambert: harms); Vinton et al. 2022 (TREE) state our exact
  drift/shading mechanism *as an untested hypothesis*; **Nunney 2016 (read in full, PDF
  saved) is the closest precedent** — IBM + density dependence + lag-load mechanism +
  S_min critical-rate metric — so our novelty lives in: plasticity-form generalization
  (bounded acclimation w/ cue noise), direct mechanism instrumentation, the spatial axis
  (migration × plasticity × change — untouched anywhere), and the adjudication frame.
- **Pilot 1x (batch `pilot1x`, 284 runs, 28 bins, 10 seeds+ each, all seeded &
  reproducible):** the slide result replicates and is far stronger than the slides
  suggested. **p=0: 0/10 extinct at every rate ≤ 240 units/10k gens; 10/10 extinct at
  300 ⇒ ηc(p0) ∈ (240, 300]. p=0.5: 10/10 extinct at every rate ≥ 100 ⇒ ηc(p0.5) < 100
  — plasticity cuts the critical rate ≥ 3× (bracketing in progress), and mean
  time-to-extinction falls smoothly with rate (1600 → 550 gens).** Static controls
  survive in both arms.
- **Mechanism (measured, traces in `headless/results/pilot1x_traces.csv`):** the
  collapse is **lag-load, not variance erosion** — under plasticity the genotypic lag
  grows without bound (−1.2 → −10 at rate 100) while adults ride ~2.4 units of plastic
  reach (≈ stepSize × mean lifespan); genetic variance is never exhausted (0.046 at
  collapse vs 0.013 in healthy p0 tracking, and ~7× HIGHER under plasticity in static
  environments — the relaxed-selection signature). This *corrects* the Apr 2025
  institute framing ("reduction in genetic variance … leads to collapse") and largely
  answers Jobran's drift question (#1): variance depletion is not the killer; frozen
  mean tracking is.

**Changed:** `headless/` (+coordinator, worker, dashboard, launch, gen-settings, agg,
runner onTick hook), .gitignore, DEVPLAN phase restructure, LITERATURE.md +
references/README (+Nunney2016 PDF) at container level.

**State:** Coordinator batch `bracket1` running (p0.5 at rates 10–80, p0 at 260–500) to
pin both ηc values. Verification: all sim results from the exact browser sim files,
seeded, ≥10 reps/bin, Wilson CIs; smoke suite green @ this commit. Browser sim still
needs Chris's eyes (unchanged code, so low risk). selDiff instrumentation needs
calibration (absolute values don't separate the arms; the lag divergence is the
trustworthy datum) — TODO before the mechanism figure.

**Next:** bracket1 completion → updated ηc table; then Phase 1 controls (linear
reaction-norm variant — the decisive knob per Scheiner comparison; forced genotype
selection; softCap sweep — deprioritized now that drift looks moot but still worth one
figure), then cyclical regimes, then the spatial factorial (the differentiator).

**Done:** Recovered the project's research context after a 16-month pause. The design
discussions happened in the claude.ai web UI (not recoverable from Claude Code), so the
recovery ran through the Gmail thread "paper on phenotypic plasticity for MAAD" with
Jobran Chebib (19 messages, Nov 2024 – Apr 2025) plus git history. Key recoveries:
- The project is **MAAD — Migrate, Adapt, Adjust, or Die** — a collaboration with
  Jobran Chebib studying how migration, genetic adaptation, and phenotypic plasticity
  interact under environmental change, and when populations go extinct instead.
- The reference paper the work is positioned against: **Polechová 2025, "Evolution of
  Species' Range and Niche in Changing Environments" (bioRxiv 10.1101/2025.01.16.633367)**,
  which found plasticity does *not* extend the range of survivable rates of temporal
  change — in direct tension with our central observed phenomenon (**shielding**:
  plasticity hides genotypic variation from selection, genetic variance decays, and the
  population collapses when the environment moves).
- Pulled the full reference set out of Gmail attachments into `../references/`
  (Polechová 2025 both versions' newest, Chevin 2010 + S1, Hendry 2016, Vedder 2013,
  Jobran's institute talk `MAAD_intro_WEG_2025-04-22.pptx`, and his LitLens
  literature-review kit: report PDF, papers CSV, chat history).
- Wrote DEVPLAN.md / STATUS.md / CLAUDE.md / this DEVLOG; updated the PA hub file.

**Changed:** New docs only (DEVLOG.md, DEVPLAN.md, STATUS.md, CLAUDE.md, .gitignore);
`../references/` populated; no sim-code changes. Pre-existing uncommitted `index.html`
title fix (`PopGenSim — Population Genetics Simulator`) left in the working tree.

**State:** Sim code unchanged since 2025-04-12 (`06a9e91`); browser sim presumed working
as of that commit — not re-verified this session. DB endpoint in `params.js` points at
`https://73.19.38.112:8888` (socket.io → Mongo), unverified.

**Next:** Work Stage 5 of DEVPLAN — the critical-rate-of-change measurement (the blocker
named in the hub file) — then the institute-feedback experiments (drift control, linear
plasticity, single-population shielding), then the Polechová comparison.

---

*Entries below this line are **backfilled** (2026-08-27) from git history and the MAAD
email thread — written after the fact, kept for continuity. Provenance: commit hashes
and email dates.*

## 2025-04-22 — Institute feedback round (email, no commit)

Jobran presented MAAD to his institute (`MAAD_intro_WEG.pptx`). Well received. Feedback
became the open experiment list: (1) is the genetic-variance collapse just drift at small
N?; (2) is it an artifact of the plasticity model? — several people suggested a linear
reaction-norm plasticity (à la Chevin) to test whether shielding persists; (3) compare
against Polechová 2025 (plasticity doesn't move the critical rate of change). Jobran also
asked whether shielding-to-extinction occurs in a single population (to rule out
migration). Chris clarified the current plasticity model: always adaptive at current
settings, cue error 0, no overshoot — organisms reach the optimum in a few steps; the only
lag is at environmental change. Apr 24: Jobran sent LitLens research materials for the
paper ("started some research on this for writing a paper").

## 2025-04-12 — Plasticity experiment tuning (`06a9e91`)

Tweaked numbers for plasticity experiments. Last code commit before pause.

## 2025-04-09 — Sexual reproduction (`0192288`)

Added optional sexual reproduction (uniform per-locus inheritance from two parents,
0.5-offspring cost per parent per mating) and expanded the color scheme.

## 2025-03-25 — Distribution visualization (`bc93abd`)

Per-cell gene histogram view (click a cell to toggle quartiles ↔ histogram).

## 2025-03-10 — Dynamic environment updates (`7057848`)

Follow-ups to the temporal patterns (Feb 11 email asked for: burn-in before change,
cycle-time length, turn-edges-off — cycle period landed; burn-in and edges did not).

## 2025-02-11 — Bibliography + model requests (email, no commit)

Jobran's third round of colleague meetings. Vedder 2013 named as the model publication
shape ("empirical estimates for parameter values; extinction probability with and without
plasticity"). Foundational bibliography sent: Via & Lande 1985, Gavrilets & Scheiner 1993,
Vedder 2013, Lopez-Idiaquez 2024, Tufto 2015, and Chevin/Lande/Mace 2010 as the metric
for the critical rate of environmental change.

## 2025-01-12/30 — UX + graphs (`494189b`); RangeShifter comparison (email)

New graphs and selectors. Jan 30: colleague pointed at RangeShifter 2.0 as prior art —
Chris's assessment: robust but "too numerical and not agent based enough," expectations
baked in; good for citation mining.

## 2024-11-29 — Environmental dynamics (`e43e927`)

Temporal environment patterns (static / linear / cycling), spatial patterns
(uniform / gradient).

## 2024-11-25 — Population graphs (`f2a48d2`)

## 2024-11-22 — Plasticity + migration (`cafc0e6`)

Plasticity (step-toward-cue with per-individual cue noise) and the Moore-neighborhood
torus migration model.

## 2024-11-10 — First commit (`2832f54`)

"Migration, adaptation, death." Two days after Jobran's first email proposing the
collaboration (Nov 8, sharing Evolution Letters 3(1):15 as the model to implement a
subset of).
