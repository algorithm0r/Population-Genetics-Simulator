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

*Instrumentation caveat:* the realized-selection-differential estimator (cov(g,w)/mean(w),
fecundity-only) under-measures — p0's realized response (0.01/gen) is ~2× its measured
selDiff — because survival selection and normalization are omitted. The lag divergence
is the trustworthy datum; calibrate the estimator before any mechanism figure (good
Jobran surface).

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

## F4 — ηc(plasticity strength) curve (pending: batch `pstrength`)

60 bins: step ∈ {0, 0.1, 0.25, 0.5, 0.75, 1.0} × rate ∈ {20..300}. Figure + ηc table:
`node fig-etac.mjs results/etac.svg results/pstrength.jsonl results/pilot1x.jsonl results/bracket1.jsonl`
