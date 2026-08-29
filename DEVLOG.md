# DEVLOG — PopGenSim (MAAD)

Backward-looking, append-only. Newest entry on top. Never edit past entries.

<!-- append new entries below this line -->

## 2026-08-29 — F15+F16: the ordering decision settled, and Chris's lifespan sweep (live fast, adapt honest)

**Done:** Chris's two follow-ups to F14 — "is the newborn ordering a bug?" and "sweep
lifespan" — both answered with registered-prediction batches (timing2: 206 runs;
lifespan1: 409 runs).

- **F15 (ordering):** the honest-newborn window and F14's intrinsic delay-1 are the
  same uniform rule (fitness uses last tick's phenotype). New `fitnessTiming:
  "currentTick"` flag = uniform delay-0. All 4 predictions confirmed: **paper-1's
  step core is ordering-robust** (identical ηc, near-equal TTEs — robustness appendix,
  no re-baselining); delay-1 and the newborn tax both causally confirmed by the
  ordering flip (lin1@T4 12/12→0/12; labile lin0.5@r160 12/12→0/12); and the spatial
  triangulation: F10's residual mortality needs BOTH burdens — F11 removed the
  blindfold (→0%), F15 removed the tax with the blindfold intact (24%→0/17). Either
  is sufficient; jointly necessary. Recommendation logged in FINDINGS: keep lastTick
  canonical for paper 1, fitnessTiming becomes an axis in paper 2.
- **F16 (lifespan):** dc {0.4,0.2,0.1,0.05} → lifespans 2.5–20, reach-varying +
  reach-held designs. L1/L2 confirmed (plastic ηc falls with lifespan; a16/T200 cycle
  rescue appears once reach ≥ ~5). **L3 refuted — the important one:** at FIXED reach
  2.5, longevity is still harmful (short-lived/big-step survives r80; long-lived/
  small-step dies at r40). Turnover starves the honest-newborn selection channel
  (births per capita-tick = death rate; 8× fewer honest tests at dc 0.05). L4 refuted
  too (bare ηc falls with generation time), but the plastic/bare ηc RATIO still
  shrinks with lifespan — shielding's relative harm grows beyond the generation-time
  effect. Headline: **live fast, adapt honest** — longevity amplifies the trap via
  reach AND turnover; long-lived plastic species are the most vulnerable class under
  sustained change and look healthy longest while dying.
- Heartbeat starvation recurrence on big spatial runs fixed properly: yield by
  organism-update budget (~1M) instead of fixed 2000-gen stride (runner.mjs).

**State:** F1–F16; ~4,400 runs, 21 batches, all in Mongo; fleet down; all pushed.

**Next:** with Jobran — bless the canonical ordering (rec: lastTick + robustness
appendix), fold F14's labile qualifier + F16's longevity result into the paper-1
skeleton (F16 may deserve its own figure: the ηc-vs-lifespan ratio panel), and the
timing factorial remains paper 2's spine.

## 2026-08-28 (night) — F14: the cue/adjust timing architecture, and cue timing turns out to be load-bearing

**Done:** Chris's two-events/two-dimensions formalization (events: cue, adjust;
dimensions: rate, delay) implemented as a flag-gated precursor architecture
(`cuePeriod`, `adjustDelay` delay-line, `birthCue` pre/post) — pure Chevin/Lande
developmental norm falls out as `{linear, cuePeriod: 0, birthCue: "pre"}` with no
special machinery (the linear norm is idempotent against a frozen cue). Defaults
bit-identical to original code, smoke 19/19. Three batches (timing1/1b/1c, 332 runs,
26 bins, every prediction registered pre-run; 1b registered mid-flight when r80 turned
out non-discriminating; 1c registered to break 1b's mechanism confound).

**F14, four panels:**
- **The linvar trap is a *labile* trap.** Timing-invariance REFUTED where it matters:
  pure Chevin lin0.5 survives r160 (0/17, lag −0.29 flat) where labile lin0.5 dies
  (12/12). The 2×2 isolates the mechanism: the **newborn fecundity tax** dominates
  (blanketing newborns rescues under either cue policy), registration adds secondary
  margin (100% → 17% given honest newborns). Critical-rate ordering: labile (100–160)
  < registered-post (~160) < Chevin-pre (160–240) < bare genetics (273) — all timing
  variants still worse than nothing under trends, so paper 1's claim survives, but
  linvar must be stated as a labile result.
- **Staleness sign rule (cycle half):** birth-registered step dies 12/12 under a6/T50
  where live step fully rescues; inert under the trend (staleness ≈ 0.04). Chevin lin1
  survives r80 with ZERO evolution (genotype lag −240, phenotypic lag −0.03).
- **The intrinsic delay-1:** selection-before-adapt = a delay-1 architecture; "live"
  lin1 dies at a6/T4 (constant mismatch 6) while p0 SURVIVES the same environment
  (windowed mismatch) — perfect plasticity with one tick of latency, lethal where no
  plasticity is safe. Anti-phase harm is window-structure, not average load; delay
  effects alias with the period (non-monotonic).
- **Spatial pre/post indistinguishable** (0/13 both, all metrics equal): half-sighted
  slope-0.5 adults suffice for the sorting machine — argmax habitat choice is
  monotone-invariant. Synthesis: honesty pays only where there are options (space);
  in a uniform cell it is a pure demographic tax — F13's rule at the timing level.

**Changed:** params/organism/population (timing architecture), smoke +4, agg (timing
labels in bin key — applied the recurring lesson proactively this time), gen-settings
(timing1/1b/1c), FINDINGS F14 + ledger, Mongo (maad_timing1/1b/1c, 332 docs).

**State:** F1–F14; ~3,800 runs, 18 batches; fleet down; all pushed.

**Next:** Chris + Jobran decide where F14 lands — the labile-trap revision belongs in
paper 1's linvar framing; the timing factorial (cue rate × adjust rate × delay,
layered systems) is paper 2's spine, now with an empirical anchor and the intrinsic
delay-1 insight.

## 2026-08-28 (later still) — F11–F13: the information arc closed, realistic environments, and the spatial finale

**Done:** three batches (~925 runs) that finish the experimental program.

- **F11 (spatial4, 30 runs):** Chris's "no open questions" call — genotype-based
  (innate-cue) habitat assessment tested against F10's phenotype-assessed baseline.
  **0/30 extinct in both worlds** (vs 35% gradient / bistable uniform); realizedResp
  pinned at the required 0.008/gen. F10's residual mortality was entirely the
  information channel: *the constraint was the blindfold, not shielded selection.*
- **Mongo retrofit** (Chris's "DB or CSVs?"): thin socket.io client + idempotent
  count-verified importer; every batch now mirrored to
  `populationGeneticsDB.maad_<batch>` alongside the JSONL/CSVs.
- **F12 (realistic1, 835 runs):** Chris's cycle-behaving-as-trend insight became three
  environment models (composite, plateau, rednoise) + registered-prediction suites.
  Composite prediction REFUTED into the applied headline: a cycle the population
  buffers perfectly still drains the reach budget the trend needs — the
  climate-change-shaped world is worse than the sum of its parts for plastic
  populations. Plateau double dissociation confirmed as registered (excursion kills
  the plastic, rate kills the genetic). Red noise: plasticity ≥ genetics everywhere.
- **F13 (spatialcomp1, 59 runs, the finale):** the F10/F11 sorting machine under the
  climate shape. Prediction half-refuted, and the refutation is the finding: honest
  (genotype) assessment still rescues completely on the gradient (**0/19** at 50k,
  response pinned, cline variance ~165 stable) but **no longer saves the uniform
  world** — both assessment arms die there identically in ~2,200 gens (cycle peak
  rate ~9× sustainable, amplitude beyond plastic reach, nowhere to go). The gradient
  flips from F8–F10's *burden* to the composite world's *refuge*: information and
  landscape are complements, not substitutes. Blindfolded gradient populations surf
  to the island edge (centroid → 22.9/24) and die at the wall at ~13.6k.

**Recurring lesson, recurred:** agg.mjs pooled the assessment arms until
`migrationAssessment` entered the bin key — *every* new experimental axis must enter
the bin key, sixth occurrence of this exact bug class.

**Changed:** environmentalPatterns.js (+3 generators), gen-settings (4 suites),
agg (assess axis + column), mongo.mjs + import-mongo.mjs (new), smoke 15/15,
FINDINGS F11–F13 + ledger, STATUS regenerated.

**State:** F1–F13 complete, every registered hypothesis resolved; ~3,470 seeded runs
across 15 batches, all in Mongo; fleet torn down; worker ceiling 10 (Chris raised it).

**Next:** the paper, with Jobran — the arc is now: shielding cuts ηc (F1–F4), sign
set by return-structure (F5–F6, F12), plasticity eats the mismatch signal that
selection *and* informed movement consume (F8–F10), honest cues restore it (F11),
but only where space provides options (F13).

## 2026-08-28 (later) — F10: informed migration (Chris's "need + fit" question)

**Done:** Implemented condition-dependent emigration (`needMigrationScale`) and matching
habitat choice (`fitTargetedMigration`) in the sim core — flag-gated, browser defaults
unchanged, smoke 10/10 (fit-targeting sorts a static gradient to |lag|≈0). Biology
grounding + novelty check logged in LITERATURE.md (Bowler & Benton 2005, Clobert 2009,
Edelaar 2008/2012; nearest model Am Nat 2021 — no plasticity/moving-optimum overlap).
Batch `spatial3` (152 runs, 12 bins, 50k gens, predictions registered pre-launch):

- **Complementarity headline:** on the gradient, need-only and fit-only both remain
  100% extinct (delay only: TTE +30–40%); **both together = 0% extinct for bare
  genetics, 35% under shielding** (from 100% random). Airtight factorial: need-only
  carries both-arm's movement volume; fit-only carries its targeting. Jointly
  necessary, singly useless.
- **Mechanism: sorting machine, not caravan** — survivor centroids static, realizedResp
  pinned to the required rate (0.0324/0.032; 0.0079/0.0080), varGeno ≈ 180 (steep
  maintained clines). Informed placement keeps selection sharp; nothing migrates far.
- **Shielding half-defeated as predicted:** newborns (honest assessors, phenotype =
  genotype at birth) carry the rescue; blinded adults keep it partial and stochastic.
- Prediction ledger: (1) fit-alone-rescues WRONG (volume matters equally);
  (2) partial-newborn-carried rescue under plasticity RIGHT; (3) uniform controls
  inert for genetics RIGHT, shielded uniform cells not interpretable (CIs overlap).

**Changed:** population.js (informed migrate()), params.js (2 new flags),
smoketest (+2 checks), agg (model + world columns), gen-settings (spatial3),
FINDINGS F10, LITERATURE addendum.

**State:** F1–F10 complete; ~2,550 seeded runs; all processes down; everything pushed.

**Next:** the paper, with Jobran. F10 gives it a hopeful closing panel: information can
substitute for genetic tracking — if it is both acted on (need) and aimed (fit) — and
plasticity taxes even that, by falsifying the signal.

## 2026-08-28 — Full steam: DB fixed + deployed, F6–F9, the registered-hypothesis ledger closed

**Done:** Jobran greenlit; Chris cleared pushing. DB endpoint fixed
(research.climbinggiants.com:8888, handshake verified, live on Pages). Then four more
batches (~500 runs) closed every open hypothesis:
- **F6 (smallamp):** the buffer regime exists and is large — plasticity flips to FULL
  rescue under oscillation (a4–a8/T50–200: bare genetics 10/10 dead, plasticity 0/10).
  Unified mechanism: shielding anchors the genotype to the past; under a trend the past
  is wrong (fatal), under a cycle the past is the mean (optimal). Figure: rescue-flip.svg.
- **F7→F8 (spatialprobe, spatial1):** island-edges option shipped (torus+gradient has a
  wrap seam); 1×24 escalator strip + Chris's uniform-world control. Migration rescues
  bare genetics from super-critical change via the DEMOGRAPHIC channel (uniform control
  decisive; centroids static — relocation ≈ nil), realizedResp restored to exactly the
  required rate; shielding leaves the response at ~60% of required.
- **F9 (spatial2, 50k-gen de-censor):** F8's gradient "rescues" were pure censoring —
  gradient arms 100% extinct at 50k (migration load beats variance supply); uniform
  rescue durable for genetics (lag constant 10k→50k); under shielding uniform rescue is
  BISTABLE (42% dead; survivors stable at realizedResp 0.0079 ≈ 0.0080 required) — a
  tipping point at the rescue margin.
- **Calibration debt closed:** realizedResp trace metric validated (0.0200/gen exactly on
  the rate-200 tracking arm); fecundity-only selDiff confirmed ~2× under-measure.
- **Heartbeat bug fixed:** synchronous runOne starved the event loop on multi-minute
  runs (dashboard showed 0 workers while 6 burned CPU); runner now yields every 2k gens.
- Literature: plasticity×space cluster pass done (Pease 1989, Polechová 2009, Chevin &
  Lande 2011, Am Nat 2019) — lane confirmed open, framing set.

**Changed:** params.js (ip, worldEdges), population.js (island edges), organism.js
(unchanged today), headless/{runner,worker,agg,gen-settings,fig-cyclic,smoketest,sweep},
FINDINGS F6–F9, LITERATURE.md. All pushed through `c7326cf`+.

**State:** nine findings F1–F9, ~2,400 seeded runs total, every registered hypothesis
resolved and ledgered in FINDINGS.md; smoke 8/8; browser sim verified by Chris + DB
green; deployed. All batch processes torn down.

**Next:** the paper. Full factorial polish runs (more seeds on the bistable cell,
gradient-steepness sweep, torus-vs-island comparison Chris wants) are now *design
choices with Jobran*, not open questions. `paper/` repo scaffold when writing starts.

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
