# PopGenSim (MAAD) — headless runner

Self-contained batch runner (conventions §4). **Shares the exact sim files with the
browser** — `runner.mjs` loads `../*.js` into the main V8 realm via indirect eval
(top-level `const`/`let`/`class` → `var` transform), stubbing only the view layer
(Graph/Histogram/document/socket). The sim core is never forked.

- **Seeded RNG**: `Math.random` is replaced with mulberry32(seed) → every run fully
  reproducible. Output range is (0,1) exclusive — plain `Math.random` can return 0,
  which would NaN the Box–Muller transform in `util.js` (latent browser bug, rare).
- **Reproducibility rule**: full `PARAMS` is serialized verbatim into every result line.
- **Run-name grammar**: `{experiment}_p{adaptiveStepSize}_r{changeRate}_s{seed}`.

## Files
- `runner.mjs` — core loader + `runOne(cfg)`; CLI: `node runner.mjs --config cfg.json`
- `smoketest.mjs` — determinism, persistence, plasticity-off, extinction sanity (`npm run smoke`)
- `sweep.mjs` — Pilot 1: single-population shielding replication (`npm run pilot1`)
- `out/` — JSONL results + summary CSVs (gitignored; regenerate with the commands above)

## Instrumentation per report tick
N, mean/var genotype, mean/var phenotype, target, genotypic & phenotypic lag, and the
**realized selection differential on genotype** (cov(g,w)/mean(w), w = the sim's own
expected-offspring formula) — the direct measurement of shielding.

## Known model facts that matter for interpretation (verified on this code)
- `populationSoftCap: 100` equilibrates at **N ≈ 650** (penalty is linear in N; births
  balance deaths well above the nominal cap). Drift arguments must use realized N.
- Selection each generation uses the phenotype **before** that generation's `adapt()`
  step (`population.js` captures `distance` first) — newborns are selected on raw
  genotype once before first adapting. Shielding is therefore partial by construction.
- Cue noise (`cueNoise`) is drawn once per individual at birth, not per step.
