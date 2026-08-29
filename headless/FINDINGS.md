# MAAD headless findings

Append-only research record. Every finding cites its batch, rep counts, and the exact
regeneration command. All runs seeded (deterministic rep seeds — see README); sim core =
the browser files verbatim. Rates in trait units per 10,000 generations; epoch 50,000
generations unless stated; single population (1×1 grid), no migration, cue noise 0,
asexual, unless stated.

---

## F1 — Shielding-extinction replicates and is large (2026-08-27)

Batches `pilot1x` (284 runs, 28 bins) + `bracket1` (143 runs, 12 bins), ≥10 seeds/bin,
adaptive Wilson-CI rep counts (transition bin auto-ran 28 reps).

| arm | ηc (critical rate) | evidence |
|---|---|---|
| no plasticity (step 0) | **≈ 280** | 0/11 extinct @260 · 22/28 @280 · 10/10 @320 |
| plasticity step 0.5 | **≈ 40–60** | 0/12 @40 · 10/10 @60 (slow: TTE ≈ 5,275 gens) |

**Plasticity cuts the critical rate of sustained environmental change ~5–6×.**
Time-to-extinction falls smoothly with rate (p0.5: 1,600 gens @100 → 550 @300).
Static controls survive in both arms. Caveats: ηc is epoch-bounded (50k gens) — the
p0.5@40 survivors carry a slowly growing lag (−0.5 at 50k), so that bin may be
metastable; near-critical TTE variance is huge (p0@280: 12,273 ± 11,858), as expected
at a tipping point.

Regenerate: `node gen-settings.mjs pilot1x settings/pilot1x.json && node launch.mjs settings/pilot1x.json pilot1x`
(then `bracket1` likewise); table: `node agg.mjs results/pilot1x.jsonl` + `node agg.mjs results/bracket1.jsonl`.

## F2 — Mechanism is lag-load, not variance erosion (2026-08-27)

From `pilot1x` traces (`node agg.mjs results/pilot1x.jsonl` → `results/pilot1x_traces.csv`):

- p0 @rate 100: genotypic lag **constant** at −0.13; variance steady 0.013; N steady ~470.
  Genetic tracking with a small equilibrium lag.
- p0.5 @rate 100: genotypic lag **unbounded** (−1.2 @250 gens → −10.2 @1500); phenotypic
  lag ≈ genotypic lag + ~2.4 (the plastic reach ≈ stepSize × mean lifespan = 0.5 × 5);
  N bleeds 456 → 29 → 0.
- **Genetic variance is never exhausted**: 0.036–0.055 during the p0.5 collapse vs 0.013
  in healthy p0 tracking — and ~7× HIGHER under plasticity in static environments
  (0.064 vs 0.009), the relaxed-selection signature (cf. Snell-Rood et al. 2010).

This **corrects the Apr 2025 institute framing** ("reduction in genetic variance …
leads to pop collapse") and answers institute Q1 (drift): variance depletion is not the
killer; the frozen mean is. Newborns are born at their genotype and selected once
before their first plastic step (the model's selection-before-adapt ordering) — when
the lag exceeds the plastic reach, recruitment fails and the population becomes a
cohort of aging, individually well-adapted adults.

*Instrumentation caveat — RESOLVED 2026-08-28:* the fecundity-only selDiff estimator
under-measures by ~2× (survival selection + normalization omitted). `agg.mjs` traces now
carry `realizedResp` = Δ meanGeno per generation, validated on the p0@200 tracking arm:
realizedResp = 0.0200/gen, exactly the environmental rate, with constant lag. The
mechanism figure uses realizedResp; selDiff is retained as a secondary indicator only.

## F3 — Plasticity FORM decides everything: linear-norm control (2026-08-27)

Batch `linvar` (152 runs, 14 bins), flag-gated model variant (`plasticityModel:
"linear"`, instant partial compensation recomputed from genotype each generation,
unbounded reach; browser default unchanged). Registered prediction (before running):
harm disappears for linear norms. **Half wrong, informatively:**

| arm | outcome |
|---|---|
| slope 1.0 (full compensation) | **survives every rate tested, to 400** — genotype in free-fall (lag −1,993 @rate 400) with fitness pinned by plasticity. Shielding total, and harmless — because reach never runs out. |
| slope 0.5 (partial) | **ηc ∈ (100, 160) — worse than no plasticity** (ηc≈280). TTE 5,400 @160 → 500 @400. |

So: bounded step-plasticity worst (ηc≈50), partial linear norm bad (ηc≈130), no
plasticity good (ηc≈280), full linear norm unkillable (ηc>400) — **non-monotonic in
form and slope**. Cost-free *linear* plasticity harming persistence contradicts the
Chevin 2010 net-benefit prediction inside a norm-based finite-population model, and
slope-1 immortality with a runaway genotype is precisely where unbounded-reach norm
models part from biology (Scheiner's "phenotypic limits" named-unknown). The bounded
model is the biologically honest case; the linear arms bracket it.

Regenerate: `node gen-settings.mjs linvar settings/linvar.json && node launch.mjs settings/linvar.json linvar`;
table: `node agg.mjs results/linvar.jsonl`. Smoke: `node smoketest.mjs` (7/7 PASS incl. linear-norm invariant).

## F4 — ηc falls monotonically with plasticity strength; the first dose hurts most (2026-08-27)

Batch `pstrength` + pooled pilot/bracket data: **1,068 runs, 84 (plasticity × rate) bins**.
ηc by 0.5-crossing interpolation of P(extinct) vs rate:

| step plasticity | 0 | 0.1 | 0.25 | 0.5 | 0.75 | 1.0 |
|---|---|---|---|---|---|---|
| **ηc** | 273 | 119 | 70 | 50 | 50 | 32 |

**Monotonic harm, steepest at the first increment** — step 0.1 (one draw of ~0.1
units/generation of acclimation) already cuts the sustainable rate of environmental
change by more than half. Harm saturates near step 0.5–0.75. No bounded-plasticity
level helps at any tested rate. This is the paper's money figure.

Figure: `results/etac.svg` (+ `results/etac.svg.etac.csv`). Regenerate:
`node fig-etac.mjs results/etac.svg results/pstrength.jsonl results/pilot1x.jsonl results/bracket1.jsonl`

## F5 — Cycles don't rescue plasticity here; peak rate governs; ηc(0.5) confirmed stable (2026-08-27)

Batch `cyclic` (238 runs, 19 bins; amplitude {10,25,50} × period {500,2k,10k} × step {0,0.5},
plus the 200k-gen probe).

- **Metastability probe:** p0.5 @ linear rate 40 survives **200,000 generations** with
  lag stabilized (−0.48), 0/12 extinct — ηc(0.5) ∈ (40,60) is real, not an epoch artifact.
- **Cyclic governing rule:** survival tracks each arm's ηc against the cycle's **peak
  rate** 2πa/T. p0's transition bin (a10/T2000, peak ≈ 31/10k ≈ ηc) sits at 57.5%
  extinction with huge TTE variance — exactly the tipping-point signature; slower/
  gentler cycles (a10/a25 @ T10k) survive, everything faster dies.
- **Slide-33 hypothesis ("plasticity buffers cycles") REFUTED in this regime:** the
  plasticity arm is worse or equal in every tested condition (e.g. a10/T2000: p0 57%
  extinct vs p0.5 100% @1,500 gens; a10/T10k: p0 0% vs p0.5 15%). Because plasticity
  slashes ηc, it loses under oscillation too.
- **Registered prediction for the follow-up (2026-08-27, not yet run):** a buffer
  regime should exist where amplitude ≤ plastic reach (~2.5) and the cycle is too fast
  for genetic tracking (e.g. a ∈ {1,2}, T ∈ {50–500}) — there plasticity absorbs the
  whole oscillation within lifetimes and should WIN. That would give the paper its
  boundary-conditions answer ("when does plasticity buffer vs. doom") rather than a
  blanket negative.

Regenerate: `node gen-settings.mjs cyclic settings/cyclic.json && node launch.mjs settings/cyclic.json cyclic`;
table: `node agg.mjs results/cyclic.jsonl`.

## F6 — The buffer regime exists: plasticity flips to full rescue under oscillation (2026-08-27)

Batch `smallamp` (373 runs, 30 bins; amplitude {1,2,4,6,8} × period {50,200,1000} × step {0,0.5}).

- **Full rescue:** at a4–a8/T50 and a4–a6/T200, no-plasticity dies 10/10 while
  plasticity survives **0/10 extinct** — the exact mirror of the directional result.
- Transition at a8/T200 (p0.5 50%, adaptive n=40); partial protection persists even at
  slow cycles (a6/T1000: 77% vs 25%; a8/T1000: 4× extinction delay).
- Small amplitudes (1–2): both arms survive (standing load tolerable) — as predicted.
- **Both registered predictions wrong in detail** (F5's "amplitude ≤ reach ~2.5" and the
  load-analysis "window at 4–8 only"): rescue extends to amplitude 8 ≫ reach at fast
  periods. What governs is not amplitude vs. reach but (a) per-generation tracking rate
  within lifetimes and (b) the genotype anchoring at the **cycle mean**.
- **The unified mechanism sentence for the paper:** shielding pins the genotype to the
  past. Under a directional trend the past is wrong — the anchor is fatal (F1–F4).
  Under oscillation the past equals the future mean — the anchor is adaptive, and
  plasticity absorbs the swing (F6). One mechanism, opposite signs, switched by the
  return-structure (autocorrelation) of the environment. Slide 33's intuition is
  vindicated in the right regime; connects to Leung 2020 / Tufto 2015 / King & Hadfield
  2019 on environmental predictability.
- Side observation: fluctuating selection maintains elevated genetic variance in
  surviving p0 arms (0.04–0.06 vs 0.013 under a trend).

Regenerate: `node gen-settings.mjs smallamp settings/smallamp.json && node launch.mjs settings/smallamp.json smallamp`;
table: `node agg.mjs results/smallamp.jsonl`.

## F7 (feasibility + hypothesis, NOT a finding) — spatial probe (2026-08-27)

Batch `spatialprobe` (26 runs, 4 bins, n=5–9 — feasibility-grade only). 4×4 **torus**
gradient (strength 5, so the world carries a wrap SEAM — target cliff at the boundary;
caveats everything here), rate 200, migration {0.001, 0.05}.

- Clines form: p0 survives with global varGeno ≈ 62 = between-cell local adaptation
  across targets −15..+15. The spatial machinery works.
- p0.5 dies at both migration levels (TTE 2,500–2,900) — spatial structure delays the
  shielding death ~3–4× vs single-cell (750) but does not prevent it at these rates.
- Cost: ~3–4 min per 4×4 / 20k-gen run — the Phase 3 factorial is affordable.

**Hypothesis registered (to test in Phase 3, designed with Jobran):** undirected
migration cannot track the moving match-zone (random walk, zero net displacement);
range-shift rescue must run through **migrant sorting** — migrants landing in matching
cells outreproduce. That channel is fitness-mediated, so **shielding should suppress
spatial sorting exactly as it suppresses temporal tracking**: plasticity may prevent
the range shift that would otherwise save the population. Chris's design addition:
the **uniform world is the migration control** — migration there has demographic but
zero adaptive value, separating migration's two channels for free.

**Prerequisite shipped:** `worldEdges: "island"` option (edge hops cancelled; default
torus unchanged; smoke 8/8) — gradient worlds need it (wrap seam), torus stays right
for the uniform control.

## F8 — Migration rescues genetics, not shielded populations; the channel is demographic, not relocation (2026-08-28)

Batch `spatial1` (99 runs, 9 bins; 1×24 island strip, gradient 2/cell vs uniform
control; arms locally super-critical: p0@r320, p0.5@r80; migration {0, 0.1}).
**Horizon-censored at 20k generations — de-censoring batch `spatial2` (50k) running;
survivor-fate numbers below are provisional.**

| arm | no migration | mig 0.1 uniform | mig 0.1 gradient |
|---|---|---|---|
| genetics only (p0, r320) | 1.00 extinct (TTE ~2.5k) | **0.00** | 0.12 |
| shielded (p0.5, r80) | 1.00 (TTE ~2.7k) | 0.36 (survivor lag −3.6, growing) | **0.82** (survivor lag −8, growing) |

- **Registered predictions revised by the data.** Migration DOES rescue bare genetics
  from super-critical change — but through the **demographic/gene-flow channel**
  (Chris's uniform control proves it: rescue is complete where relocation is
  impossible), not the Pease escalator. Range shift is negligible: occupancy centroid
  moves at ~2% of the match-front speed. Mechanistically closed with `realizedResp`:
  gene flow restores the genetic response to **exactly the required rate**
  (0.035 vs 0.032/gen needed), and gradient-world survivors carry varGeno ≈ 10 —
  the classic gene-flow-pumps-variance mechanism (Polechová 2009/2025) live in the ABM.
- **Shielding largely disables the rescue**: realizedResp stuck at ~60% of required
  (0.005–0.007 vs 0.008), lags accelerating in all surviving reps — the migration
  "rescue" under plasticity looks like slow death (spatial2 decides).
- **The gradient inverts across plasticity**: mild cost for bare genetics (0.12 vs 0 —
  swamping by locally-maladapted immigrants) but severe under shielding (0.82 vs 0.36)
  — swamping still hurts when sorting can't help, because shielding flattens the
  fitness differences that would sort immigrants.
- Sanity: p0@r80 tracks in place on the gradient (0/10, lag −0.11, centroid static).

Frame against: Pease/Lande/Bull 1989 + Polechová/Barton/Marion 2009 (the known rescue,
here reproduced and mechanistically measured) and Am Nat 2019 (plasticity-helps-shifts —
our fixed bounded plasticity does the opposite). Regenerate:
`node gen-settings.mjs spatial1 settings/spatial1.json && node launch.mjs settings/spatial1.json spatial1`;
table: `node agg.mjs results/spatial1.jsonl`. Note: two shielded-migration bins were
deliberately capped at n≈11–17 (precision on a censored estimate is wasted compute;
spatial2 supersedes them).

## F9 — De-censored: migration is variance supply, never escape; gradients turn it into load; shielding makes rescue a coin flip (2026-08-28)

Batch `spatial2` (52 runs, 4 bins, 50k generations — supersedes F8's censored
migration-arm numbers).

| arm @ mig 0.1 | gradient | uniform |
|---|---|---|
| genetics only (p0, r320) | **1.00 extinct** (TTE 25,821 — F8's "0.12" was pure censoring) | **0.00 extinct — durable**: lag constant −0.37 from 10k→50k, realizedResp = 0.0320 = exactly the required rate |
| shielded (p0.5, r80) | **1.00 extinct** (TTE 18,917) | **0.42 extinct — bistable**: survivors genuinely stable (lag −1.16 constant 10k→50k, realizedResp 0.0079 ≈ required 0.0080); TTE sd 17,814 |

- **Migration's rescue channel is variance supply (demographic), never relocation**:
  occupancy centroids are static in every surviving arm (~11.5 of 24); the only
  centroid drift is the dying tail of the gradient arms. Confirmed at 50k.
- **A spatial gradient converts migration from rescue to load**: even bare genetics
  with the response restored to ~0.031/gen dies by ~26k on the gradient — standing
  migration load (locally maladapted immigrants, ±2 units/cell) eats the margin the
  demographic channel provides. The uniform world, same migration, survives
  indefinitely. Chris's uniform control is what makes this cell interpretable.
- **Under shielding, rescue becomes stochastic**: gene flow restores the response to
  *just barely* the required rate (0.0079 vs 0.0080), so populations bifurcate —
  ~58% lock into stable tracking, ~42% slide off and die, with enormous TTE variance.
  A tipping-point signature at the rescue margin, produced by shielding's thinning of
  the selection response.
- **Unified spatial sentence for the paper:** in this model, migration buys populations
  effective size, not escape; spatial heterogeneity taxes that purchase; and plasticity
  thins the margin until persistence is chance. Frame against Pease/Lande/Bull 1989 and
  Polechová 2009 (both channels of the classic theory reproduced and separated in one
  ABM by the uniform/gradient contrast) and Am Nat 2019.

Regenerate: `node gen-settings.mjs spatial2 settings/spatial2.json && node launch.mjs settings/spatial2.json spatial2`;
table: `node agg.mjs results/spatial2.jsonl`.

## F10 — Informed migration: need and fit are complementary — neither works alone, together they defeat the gradient and half-defeat shielding (2026-08-28)

Batch `spatial3` (152 runs, 12 bins; need-triggered emigration and/or fit-targeted
destination — condition-dependent dispersal + matching habitat choice, assessment on
the current phenotype; 50k gens; random-dispersal baselines = F9).

| gradient world | random (F9) | need only | fit only | **both** |
|---|---|---|---|---|
| genetics (p0, r320) | 1.00 | 1.00 (TTE 33.8k) | 1.00 (TTE 34.2k) | **0.00 — durable** |
| shielded (p0.5, r80) | 1.00 | 1.00 (TTE 16.5k) | 1.00 (TTE 11.7k) | **0.35** |

| uniform world | random (F9) | need only | fit only | both |
|---|---|---|---|---|
| genetics | 0.00 | 0.00 | 0.00 | 0.00 |
| shielded | 0.42 | 0.57 | 0.20 | **0.00** (n=11) |

- **Complementarity is the headline, and the factorial logic is airtight:** need-only
  carries the same movement volume as both (same needScale) and dies; fit-only carries
  the same targeting and dies (base volume 0.1 too low). Direction × volume, jointly
  necessary. Single mechanisms do extend TTE ~30-40% — delay, not rescue.
- **Mechanism (traces): informed migration is a sorting machine, not a caravan.**
  Survivor centroids are static; realizedResp sits exactly at the required rate
  (p0: 0.0324 vs 0.032; p0.5: 0.0079 vs 0.0080); survivor varGeno ≈ 180–187 — informed
  placement keeps each lineage in its best cell, maintaining steep clines and sharp
  selection. The escalator never runs; the sorting does.
- **Shielding is half-defeated, as registered (prediction 2):** the shielded gradient
  arm goes from certain death (F9) to 0.35 with informed migration — carried by
  newborns, the only honest assessors (phenotype = genotype at birth) and the only
  cohort selection fully sees. Adults are blinded (no need felt, no fit gradient
  perceived), which is why rescue stays partial and stochastic.
- Prediction 1 (fit-targeting alone rescues) was WRONG — volume matters as much as
  direction. Prediction 3 (uniform controls inert) held for genetics; the shielded
  uniform cells move with model but CIs overlap — not interpreted.
- Biology framing: Bowler & Benton 2005 / Clobert 2009 (condition-dependent, informed
  dispersal), Edelaar et al. 2008 / Edelaar & Bolnick 2012 (matching habitat choice —
  whose mismatch-resolution triad IS MAAD's verb set); nearest model: Am Nat 2021
  (habitat choice × rescue, patch-degradation setting, no plasticity/moving optimum).

Regenerate: `node gen-settings.mjs spatial3 settings/spatial3.json && node launch.mjs settings/spatial3.json spatial3`;
table: `node agg.mjs results/spatial3.jsonl`.

## F11 — Honest information fully restores the rescue: the constraint was the blindfold, not selection (2026-08-28)

Batch `spatial4` (30 runs, 2 bins; shielded populations, both-mechanisms informed
migration, **genotype-based (innate-cue) assessment** — Edelaar's heritable-preference
alternative; 50k gens; phenotype-assessment baselines = F10).

| shielded, both mechanisms, mig 0.1 | phenotype assessment (F10) | genotype assessment |
|---|---|---|
| gradient | 0.35 extinct | **0.00 (0/15)** |
| uniform | bistable (0.42 random / 0.00 both) | **0.00 (0/15)** |

Mechanism sealed: realizedResp = 0.0080–0.0081 = exactly the required rate in both
worlds, lags constant 10k→50k, populations at carrying capacity, gradient survivors
holding steep sorted clines (varGeno 191). **Registered prediction confirmed**: F10's
residual shielded mortality was entirely the information channel — when assessment is
honest, informed migration defeats shielding completely; shielded selection was never
the binding constraint once sorting worked. This isolates the paper's mechanism at its
sharpest: *plasticity's harm under sustained change is an information effect — it
falsifies the mismatch signal that selection, dispersal, and habitat choice all
consume — and restoring the signal by any honest channel restores persistence.*

Regenerate: `node gen-settings.mjs spatial4 settings/spatial4.json && node launch.mjs settings/spatial4.json spatial4`;
table: `node agg.mjs results/spatial4.jsonl`.

## F12 — Realistic environments: composite worlds are worse than their parts for plastic populations; excursion kills the plastic, rate kills the genetic; noise favors plasticity (2026-08-28)

Batch `realistic1` (835 runs, 62 bins, three registered-prediction suites; single-cell, 30k gens).

**Composite (cycle + trend) — prediction (i) REFUTED, and the refutation is the applied
headline.** The cycle is NOT orthogonal: it actively lowers the shielded population's
trend tolerance. Pure trend 40 is stably survivable for p0.5 (lag −0.5 constant,
200k-gen confirmed); add an amplitude-2 cycle it handles trivially in isolation and the
same population dies (12/12, TTE ~7,750; lag −1.8 → −5.1, response just under required
— measured). Every composite cell with any trend killed the plastic arm. Genetics
degrades mildly and additively (a2 tolerance ~160–240 vs pure 273); a6 stays lethal to
genetics as in F6. **Framing for the paper: "a cycle the population buffers perfectly
still drains the reach budget the trend needs — seasonal competence conceals trend
fragility, and the composite (climate-change-shaped) world is worse than the sum of
its parts for plastic populations."** The concealment is double: the cycle hides the
trend's damage, and F2's shielding hides the mismatch — the population looks healthy
by phenotype and by season until recruitment fails.

**Plateau (finite trends) — both registered predictions CONFIRMED, a clean double
dissociation.** Plastic survival is governed by total excursion (threshold between 10
and 20, nearly rate-independent: survives cap ≤10 even at rate 640); genetic survival
by rate (rate 160 < ηc survives every cap; supercritical rates survive only excursions
short enough to outlive the transient). The two dissociating cells: **rate 640/cap 10 —
genetics dead, plastic alive; rate 160/cap ≥20 — genetics alive, plastic dead.**
"Excursion kills the plastic, rate kills the genetic." (Plastic survival at cap 10 > reach
2.5 shows slow post-plateau genetic catch-up through newborn selection — the plateau
grants unlimited time.) This is the policy-facing panel: fast-but-bounded change favors
plasticity; slow-but-unbounded change favors genetics.

**Red noise (AR(1)) — plasticity ≥ genetics everywhere tested,** consistent with the
return-structure rule (noise reverts): plasticity extends the survivable envelope from
SD 2 to ~SD 5 at fast reversion (φ0.9/sd5: genetics 12/12 dead, plastic 3/23) and never
underperforms. Genetics shows the effective-rate logic mid-φ (φ0.99/sd2: 44% dead with
TTE 15k — slow excursions acting as transient trends near ηc; faster or slower φ both
survivable). No harm regime for plasticity in pure noise — the harm requires
non-reverting change, sharpening F6.

Regenerate: `node gen-settings.mjs composite1|plateau1|rednoise1 ...` (merged as
`settings/realistic1.json`); table: `node agg.mjs results/realistic1.jsonl`.

## F13 — Under the climate shape, the gradient flips from burden to refuge: honest information rescues only where space provides options (2026-08-28)

Batch `spatialcomp1` (59 runs, 4 bins; shielded arm p0.5 only, both informed-migration
mechanisms on, 1×24 island strip, composite environment a6/T500 riding trend 80,
epoch 50k). The F10/F11 sorting machine, re-tested under the realistic environment.

| arm | extinct | TTE |
|---|---|---|
| phenotype-assessed, uniform | 14/14 | 2,179 ± 317 |
| genotype-assessed, uniform | 12/12 | 2,292 ± 257 |
| phenotype-assessed, gradient | 14/14 | 13,643 ± 602 |
| **genotype-assessed, gradient** | **0/19** | — |

**Registered prediction half-confirmed, half-refuted — and the refuted half is the
finding.** Confirmed: phenotype-assessed (blindfolded) arms die under the composite even
with both mechanisms on, exactly as predicted — the blindfold persists under realistic
environments. Refuted: genotype assessment does NOT track the composite "as it tracked
the pure trend" everywhere — **F11's uniform-world rescue vanishes.** In the uniform
world the two assessment arms die at statistically identical times (~2,200 gens ≈ 4.4
cycle periods): the cycle's peak rate (2πA/T ≈ 0.075/gen, ~9× the sustainable genetic
rate) with amplitude 6 beyond the ~2.5 plastic reach kills a spatially homogeneous
world no matter how honest the organisms' information is. **With nowhere to go,
information is worthless.**

On the gradient the story inverts twice over. Genotype-assessed populations survive
50k generations to a run: realizedResp pinned at 0.0075–0.0084/gen (required: 0.008),
lag flat at −0.50, varGeno stable ~165 (the sorted cline as a standing-variance
reservoir), N at carrying capacity. The gradient — the *killer* in F8–F10's pure-trend
world — becomes the *refuge* under composite change, because a strip spanning 46
phenotype units always contains near-matched habitat somewhere and honest sorting can
find it, while the cline's variance reservoir funds genetic tracking of the trend
component. Phenotype-assessed gradient populations instead surf spatially — centroid
drifts from mid-strip to 22.9/24, pinned against the island edge — while variance
drains (165 → 0.06), then die at the wall at ~13.6k: they buffer the cycle, lose the
trend, and run out of world. (Measurement caveat: reportEvery 500 equals the cycle
period, so centroid samples are phase-locked; within-cycle spatial commuting in the
surviving arm is unresolved — a finer-grained probe would need reportEvery ≠ T.)

**Refinement of F11's closer:** honest information is necessary but not sufficient —
it restores persistence only where space provides options to spend it on. The paper's
spatial arc completes: plasticity destroys the mismatch signal (F8–F10), honest cues
restore it (F11), and under realistic (cycle+trend) change the signal buys survival
only through spatial structure (F13) — information and landscape are complements,
not substitutes.

Regenerate: `node gen-settings.mjs spatialcomp1 settings/spatialcomp1.json && node launch.mjs settings/spatialcomp1.json spatialcomp1`;
table: `node agg.mjs results/spatialcomp1.jsonl`.

## F14 — Cue timing is load-bearing: the labile trap, the developmental rescue, the newborn tax, and the intrinsic delay (2026-08-28)

Batches `timing1` (243 runs, 20 bins), `timing1b` (53 runs, 4 bins), `timing1c` (36
runs, 2 bins) — first outing of the cue/adjust timing architecture (`cuePeriod`,
`adjustDelay`, `birthCue`; Chris's two-events/two-dimensions formalization). Pure
Chevin/Lande developmental norm = `{linear, cuePeriod: 0, birthCue: "pre"}` — cue at
birth, adjust once, pre-selection. Defaults bit-identical to original code (smoke 19/19).

**(a) The paper-1 seal, revised — the linvar trap is a *labile* trap.** Registered
timing-invariance prediction REFUTED at the rates where it matters (timing1b/1c, r160
where labile lin0.5 dies 12/12 TTE 8,292):

| slope-0.5 linear norm, r160 | honest newborns (post) | blanketed newborns (pre) |
|---|---|---|
| live cue (labile = linvar arms) | 12/12 dead, TTE 8,292 | **0/13 alive** |
| birth-registered cue | 4/23 dead (17%), TTE 15,250 | 0/17 alive (pure Chevin) |

Mechanism 2×2 (timing1c, registered): the dominant channel is the **newborn fecundity
tax** — in a single cell, an honest newborn pays the full-mismatch fecundity penalty
with no migration to spend the honesty on, and blanketing newborns (pre) rescues under
either cue policy. Cue **registration adds real secondary margin** (given honest
newborns: 100% → 17% mortality, TTE ×2). Trace signature: labile survivors track at
exactly the required 0.016/gen but attrit rep-by-rep off lag excursions (knife-edge, no
stability margin); Chevin-pre holds lag −0.29 flat across all 17 reps.
**Critical-rate ordering: labile lin0.5 (100–160) < registered-post (~160) <
Chevin-pre (160–240) < bare genetics (273).** Every partial-plasticity timing variant
stays worse than no plasticity under trends — the paper-1 claim survives in every
timing — but *how much* worse is a timing property, and Chevin-faithful timing is the
least harmed. State linvar's "worse than nothing" as a **labile** result.

**(b) The staleness sign rule, cycle half confirmed.** Birth-registered step plasticity
dies 12/12 under a6/T50 (TTE 2,604) where live-cue step is 0/12 (F6's full rescue);
under the r80 trend the same registration is inert (stepB TTE 2,479 vs live 2,229 —
both die of shielding; staleness ≈ rate × lifespan ≈ 0.04 is negligible). Cue staleness
is harmful exactly when the environment returns. Instant birth-calibration is different:
Chevin lin1 survives BOTH a6/T50 (lifespan ≪ period, phase drift small — my "mismatch
up to 2A" registered prediction was wrong on magnitude) and r80 with **zero evolution**
(genotype lag −240 after 30k gens, phenotypic lag −0.03: persistence on pure birth
calibration with selection fully disabled — the shielding limit made flesh).

**(c) The intrinsic delay: nobody in this model is delay-0.** Selection computes
fitness on the phenotype adjusted *last* tick, so every organism carries a built-in
1-tick cue-to-selection latency — the selection-before-adapt ordering that *is* the
shielding mechanism is, in timing language, a delay-1 architecture. Demonstrated:
"perfect" live lin1 dies 12/12 at a6/T4 (TTE 792; effective lag T/4 = constant
mismatch 6, no matched windows) while **p0 survives the same environment** (0/13;
mismatch oscillates through zero — good windows twice per cycle) and lin1+delay-2
survives (total lag aliases onto a favorable phase). Perfect plasticity with 1 tick of
latency is lethal where no plasticity is safe. Delay effects are non-monotonic
(aliasing with the period), and discrete-generation demography survives *windowed*
mismatch but not *constant* mismatch — the anti-phase harm is about window structure,
not average load (registered anti-phase predictions partially refuted on this point:
T5 delay-2 survives via windows, 0/12).

**(d) Spatial: the honest-newborn window is unnecessary for the linear sorting
machine.** Registered prediction REFUTED: on the r80 gradient strip with both informed
mechanisms, lin0.5 pre and post are indistinguishable (0/13 vs 0/13; N ≈ 11.5k,
varGeno ≈ 192, lag −0.113, response 0.008 = required, in both). A slope-0.5 adult is
only half-blind: habitat choice is an argmax, and a monotone (half-contrast) signal
ranks cells identically. Synthesis across F10/F11/F13/F14: rescue completeness tracks
*information* completeness (genotype-honest 0% extinct; half-sighted linear adults 0%;
step's blind adults + honest newborns 35%; fully blind on composite 100%) — and the
newborn honesty channel matters only where there are options to spend it on (space),
while in a uniform cell it is a pure demographic tax. Information value is
option-dependent; honesty without options is a cost. F13's rule, now visible at the
timing level.

Regenerate: `node gen-settings.mjs timing1|timing1b|timing1c settings/<b>.json` + coordinator/workers;
tables: `node agg.mjs results/timing1.jsonl` (+1b, 1c).

## F15 — The ordering decision: paper-1's step results are ordering-robust; the delay-1 and the newborn tax are causally confirmed; either burden's removal rescues the spatial arm (2026-08-28)

Batch `timing2` (206 runs, 16 bins; registered pre-run). Context: Chris asked whether
testing newborns on raw genotype is an ordering bug. The rule is uniform — fitness each
tick uses the phenotype adjusted LAST tick — so the honest-newborn window and F14's
intrinsic delay-1 are the same architectural fact. New flag `fitnessTiming:
"currentTick"` adapts before the test (uniform delay-0; newborns tested after their
first adjustment). All four registered predictions CONFIRMED:

- **P1 — paper-1's headline is ordering-robust.** Step-0.5 ηc is identical under both
  orderings at every rate (survive r40; die r60–r160 with near-equal TTEs: 2250/2375
  @r80, 1375/1375 @r120, 1000/1021 @r160). At the r60 threshold currentTick dies
  *faster* (TTE 4250 vs 5896) — blanketing newborns removes honest signal along with
  the tax, and in shielded populations signal is the binding constraint (F2). The
  shielding result does not depend on the ordering choice; if anything the "fix"
  deepens it.
- **P2 — the intrinsic delay-1, causally.** lin1 at a6/T4: lastTick 12/12 dead (TTE
  1125), currentTick 0/12. One tick of cue-to-selection latency is the entire
  difference between lethal and trivial.
- **P3 — the labile trap is ordering-sensitive at the knife edge.** lin0.5 at r160:
  lastTick 12/12 dead (TTE 5333), currentTick 0/12 (lag −0.374 stable). Halving the
  newborn's first-test mismatch is enough to restore the stability margin —
  consistent with timing1c's tax mechanism.
- **P4 — spatial: the two burdens are jointly necessary, singly removable.** Step-0.5
  strip, r80, both informed mechanisms, phenotype assessment: lastTick 5/21 extinct
  (24%, replicating F10's 35% within CI), currentTick **0/17** (varGeno 191, lag
  −0.18). Note the triangulation: F11 removed the *blindfold* (genotype assessment,
  tax kept) → 0%; F15 removes the *newborn tax* (ordering fix, blindfold kept) → 0%.
  F10's residual shielded mortality required BOTH burdens — blind adult assessment
  and taxed honest newborns — and removing either one fully rescues.

**Ordering recommendation for the papers (decision Chris + Jobran):** the step-model
core (F1–F9) is ordering-invariant, so paper 1 can keep the original lastTick ordering
with this table as the robustness appendix. The results that DO move with ordering are
exactly the timing-sensitive ones (fast cycles, labile knife-edges, the spatial
residual) — which is paper 2's subject matter, where `fitnessTiming` is an axis, not a
nuisance. currentTick is the ordering that "contains Chevin" most faithfully
(developed phenotype tested from the first event).

Regenerate: `node gen-settings.mjs timing2 settings/timing2.json` + coordinator/workers;
table: `node agg.mjs results/timing2.jsonl`.

## F16 — Lifespan: longevity amplifies the trap twice over; reach is not the whole organism parameter (2026-08-28)

Batch `lifespan1` (409 runs, 30 unique bins; Chris's sweep). Mean lifespan = 1/deathChance:
dc 0.4/0.2/0.1/0.05 → ~2.5/5/10/20 ticks; step-0.5 reach = 1.25/2.5/5/10. Two
sub-sweeps: (a) reach-varying (step 0.5 fixed), (b) reach-held at 2.5 (step co-varied).

**L1 CONFIRMED — longer life, lower ηc (trend).** Step-0.5 survival boundary marches
down as lifespan grows: dc 0.4 survives r80 (0/15) and dies only by r160; dc 0.2 dies
at r60+ (the F1 baseline); dc 0.1 and 0.05 die even at r40 (12/12, TTE 7,021 and
12,979). Long-lived plastic populations die *slower* but at *far lower* rates.

**L2 CONFIRMED — cycle buffering scales with reach.** a16/T200 (beyond baseline
reach): dc 0.4/0.2 die in 250 gens; dc 0.1 (reach 5) and 0.05 (reach 10) fully
rescue (0/12). The F6 rescue regime's amplitude ceiling is set by reach = step ×
lifespan, as the model-at-a-glance table implies.

**L3 REFUTED — reach is NOT the sole operative organism parameter.** Reach-held arms
(all reach 2.5) still diverge hard: short-lived/big-step (dc 0.4, step 1.0) survives
r80 where the baseline dies; long-lived/small-step (dc 0.1, step 0.25 and dc 0.05,
step 0.125) die even at r40. At fixed reach, longevity itself is harmful. Mechanism
(consistent with F2/F15's signal-binding): selection response in shielded populations
is carried by honestly-tested newborns, and births per capita-tick equal the death
rate — a dc 0.4 population runs ~8× more honest selection events per tick than a
dc 0.05 population. Slow turnover starves the honest channel.

**L4 REFUTED — bare-genetics ηc also falls with lifespan (generation time).** p0:
dc 0.4 nearly survives r280 (1/21); dc 0.2 ηc ≈ 273–280 (F1); dc 0.1 dies at 280;
dc 0.05 dies even at 240. Evolution per tick slows as generation time grows — the
expected quantitative-genetics effect, and part (but not all) of L1: the ratio
ηc(plastic)/ηc(bare) still shrinks from dc 0.4 (~0.3–0.5) to dc 0.2 (~0.18) and
below, so shielding's *relative* harm grows with lifespan beyond the generation-time
effect (finer rate grids would pin the low-dc ratios; current bracket is coarse).

**Headline: live fast, adapt honest.** Longevity amplifies plasticity's trap through
two compounding channels — a longer life means a bigger plastic reach (more mismatch
hidden) and slower turnover (fewer honest newborn tests feeding selection) — on top
of the universal generation-time slowdown. Comparative prediction with real teeth:
under sustained directional change, long-lived plastic species should be the most
vulnerable class, and their populations should look demographically healthy the
longest while dying (longest TTEs in the sweep). Caveat: deathChance also shifts
equilibrium demography (lifetime offspring, age structure); the reach-held design
controls the plasticity side but the L4 controls carry the same demographic shifts,
which is why conclusions are stated as ratios against p0 where possible.

Regenerate: `node gen-settings.mjs lifespan1 settings/lifespan1.json` + coordinator/workers;
table: `node agg.mjs results/lifespan1.jsonl`.

## F17 — The valley of partial plasticity: both timing regimes carve ηc valleys with interior minima near-perfect compensation, and escape only at exactly-perfect (2026-08-29)

Batches `dose2/3/4/4b` (1,226 runs, 74 bins; four registered-prediction rounds, each
designed blind to the next round's data). ηc(compensation strength b) for the two
linear-norm timing regimes, fine rate grids at every transition:

| b | labile ηc | developmental ηc |
|---|---|---|
| 0 | 273 (shared) | 273 (shared) |
| 0.25 | ~200 | ~245 |
| 0.5 | ~150 | ~190 |
| 0.75 | ~95 | ~120 |
| 0.9 | ~70 | ~80 |
| 0.95 | ~52 (minimum) | — |
| 0.99 | ~120 | ~135 |
| 1 | **none (unkillable)** | **~4,000** (3,200: 0/20; 4,000: 12.5%) |

**Both curves are valleys.** Decline from bare-genetics 273 to minima 3–5× below it
(labile ~52 at b≈0.95; developmental ~80 at b≈0.9), then a recovery confined to the
last ~5% of dose. The labile decline follows ηc ≈ (1−b)·270 through b=0.75
(200/150/95 vs predicted 202/135/67) and then flattens — weakly-selected arms carry
2–3× the genetic variance (mutation accumulating under relaxed selection), partially
refunding the signal loss.

**The escapes are corners, and they differ by timing.** At b=0.99 the two regimes
converge (~120 vs ~135 — timing stops mattering as genotype-coupling → 0). At exactly
b=1 they split: labile is unkillable (live cue, zero staleness, zero coupling) while
developmental jumps discontinuously ~30× to ηc ≈ 4,000 — **persistence with zero
evolution** (genotype frozen: lag −16,000 at r3,200 over 50k generations; load =
within-lifetime staleness only ≈ rate × mean age), ~15× beyond bare genetics, dying
only when staleness itself exceeds tolerance (TTE 250 at 4,800 — instant demographic
collapse). The mechanism of the cliff: for ANY b<1 the phenotype retains the coupling
term (1−b)(g−ε) whose lag grows without bound under a trend; 1% residual coupling
drops ηc from 4,000 to ~135.

**The step model never escapes.** Bounded reach forecloses the full-compensation
corner: its curve declines through dose 1.0 (ηc ≈ 37) below both linear curves.

**Reading for the paper (C3/C4 merge):** real reaction norms are bounded and
imperfect, so real plasticity lives in the valley — and the valley bottoms at
*near-perfect* compensation: the most competent-looking plastic organisms are the
most fragile under sustained change, and the escape corners (exact, unbounded
compensation) are not biologically reachable. This is Fig 2b.

**Round ledger (every prediction registered pre-round):** D1 (1−b dive) right through
0.75, wrong at 0.9 (variance refund). E1 (interior minima) eventually right for both,
wrong about where. E2 (chev0.9 above bare genetics) wrong — still in the valley. E3
(chev1 ≈ 3–4k) right. G1 (labile monotone to the end) wrong — minimum at 0.95, rises
at 0.99. G2 (developmental discontinuity at exactly 1) right. G3 (chev0.9 edge 60–140)
right (~80). The two-step whiplash (dive → flatten → valley) is preserved here
deliberately: it is what registered prediction looks like when the system is smarter
than the theorist.

Regenerate: `node gen-settings.mjs dose2|dose3|dose4 settings/<b>.json` (+ dose4b in
settings/) + coordinator/workers; table: `node agg.mjs results/dose2.jsonl` (+3/4/4b);
figure: `paper/figures/fig2_etac.py`.

**Registered-hypothesis ledger, all resolved:** F5 buffer-at-amp≤reach → wrong in detail,
F6's version stronger. Load-analysis window (4,8) → partially right. F8 escalator via
sorting → wrong (channel is demographic). F8 shielding-blocks-rescue → right in the
gradient world, softened to bistability in the uniform world. F13
genotype-tracks-composite-everywhere → right on the gradient, wrong in the uniform
world (information needs spatial options to spend itself on). F14 timing-invariance →
wrong at the rates that matter (the trap is labile; newborn tax dominant, registration
secondary); F14 staleness-under-cycles → right for step, wrong on magnitude for
instant norms; F14 anti-phase → right that latency kills, wrong about where (window
structure, not average load; aliasing non-monotonic); F14 spatial pre/post → wrong
(half-sighted adults suffice; argmax choice is monotone-invariant). F15 all four
ordering predictions → right (step core ordering-robust; delay-1 causal; tax causal;
either burden's removal rescues the spatial arm). F16 L1/L2 → right (ηc falls, buffer
grows with lifespan); L3 → wrong (reach is not sufficient — turnover starves the
honest channel at fixed reach); L4 → wrong (bare ηc falls too: generation time).
Every prediction
was registered before its data; every revision is in this file.
