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
- `sweep.mjs` — serial Pilot 1 (superseded by the coordinator; kept as the minimal example)
- `out/`, `results/` — JSONL results (gitignored; regenerate via the commands here)

## Multi-run architecture (design: Domestication's runner, simplified)
- `coordinator.mjs <settings.json> <batch>` (:8090) — bins from a settings list;
  `/claim` hands the next rep of the shallowest unfinished bin (fewest-reps-first);
  `/complete` appends to `results/<batch>.jsonl` + updates bin stats. **Adaptive:** a bin
  converges when n ≥ MIN_N and the Wilson CI half-width on P(extinct) ≤ CI_TARGET
  (else caps at MAX_N). **Resumable:** bins rebuild from the JSONL on startup;
  `RESUME_FROM=a.jsonl;b.jsonl` folds in prior runs whose configs match.
  **Deterministic reps:** seed = fnv1a(binId) ^ (rep·2654435761) — any rep is
  reproducible from (binId, rep).
- `worker.mjs [coordURL] [id]` — claims and runs reps in-process (loadSim once);
  15 s heartbeats; `PERSIST=1` idles instead of exiting when the queue empties.
- `dashboard.mjs` (:8091, http://127.0.0.1:8091) — live page: progress, per-bin table,
  P(extinct)-vs-rate chart per plasticity level, workers, recent completions.
- `launch.mjs <settings.json> <batch> [N]` — spawns coordinator + dashboard + N workers
  (default cores−2); Ctrl+C tears all down; relaunching the same batch resumes it.
- `gen-settings.mjs <experiment>` — settings generators (`pilot1x`, `pstrength`, …);
  add experiments there, regenerate with `node gen-settings.mjs <name>`.

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
