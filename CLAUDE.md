# CLAUDE.md — PopGenSim (MAAD) sim

> **The Claude project root is one level up** (`../CLAUDE.md`), covering this repo
> plus the private `../paper/` and `../references/`. Open sessions from there.
> This file is the in-repo copy of the sim-scoped rules and is superseded by the
> root file where they differ.

## Read this first, in order
1. `STATUS.md` — where the system is right now (60 seconds)
2. `DEVPLAN.md` — model-at-a-glance table + stages (what to build next)
3. `DEVLOG.md` — newest entries, for how we got here
4. `../references/README.md` — the papers this work argues with

## What this project is
**MAAD — Migrate, Adapt, Adjust, or Die.** Agent-based population-genetics sim, built
with **Jobran Chebib** (quantitative geneticist; the collaboration lives in the Gmail
thread "paper on phenotypic plasticity for MAAD"). Research target: how migration,
genetic adaptation, and phenotypic plasticity interact under environmental change —
specifically our **shielding** phenomenon (plasticity hides genetic variation from
selection → variance decays → collapse) vs. **Polechová 2025**'s finding that
plasticity doesn't extend survivable rates of change.

## Document map
- Bibles (amended in place): DEVPLAN.md, STATUS.md, this file
- Logs (append-only, never edited): DEVLOG.md
- `../references/` — recovered papers + Jobran's LitLens literature kit (container level, not in this repo)

## Never violate
- **Vanilla JS + Canvas, no build step, no frameworks.** GameEngine lineage: `<script>`
  tags in dependency order in `index.html`; everything global.
- **`index.html` `<title>` stays "PopGenSim — …"** (conventions §6 artifact identity — Pulse attributes work by tab title).
- **Never fork the sim core** for headless running — share the exact files.
- **Single `PARAMS` namespace** (`params.js`) is the source of truth; serialize it verbatim into every saved data packet.
- **This is an ABM on purpose.** Our standing critique of RangeShifter et al. is
  "too numerical, expectations baked in." Don't replace agent interactions with
  fitted functions; don't add a scientifically-convenient fix that deletes the
  phenomenon (shielding) the project exists to study.
- **Selection acts on post-plasticity phenotype** — that ordering (adapt → reproduce)
  *is* the shielding mechanism. Don't reorder it casually.
- **Stochastic results need replicates.** Never report a finding from one seed.

## Operational gotchas
- DB: socket.io → `PARAMS.ip` (`https://73.19.38.112:8888`), db `populationGeneticsDB`.
  The sim runs fine without it (guards on `window.io`).
- `assetmanager.js` is dead-but-load-bearing boilerplate; don't extend it.
- Plasticity details that matter scientifically: cue noise is sampled **once per
  individual at birth** (`cueNoise`), not per step; the adapt step is capped so there
  is **no overshoot**. Chris told Jobran (Apr 2025) plasticity is "always adaptive at
  current settings, cue error 0" — check `targetObservationalNoise` before claiming
  which regime an experiment ran in.
- Session close: run `/log-session` (DEVLOG entry, STATUS regeneration, commit).
