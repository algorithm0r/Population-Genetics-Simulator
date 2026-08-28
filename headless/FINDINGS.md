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

**Registered-hypothesis ledger, all resolved:** F5 buffer-at-amp≤reach → wrong in detail,
F6's version stronger. Load-analysis window (4,8) → partially right. F8 escalator via
sorting → wrong (channel is demographic). F8 shielding-blocks-rescue → right in the
gradient world, softened to bistability in the uniform world. Every prediction was
registered before its data; every revision is in this file.
