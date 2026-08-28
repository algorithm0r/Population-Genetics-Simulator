# STATUS — PopGenSim (MAAD)

**Updated:** 2026-08-28, close of the full-steam run (F1–F10 complete)
**Verified:** warm, this session — smoke 10/10; ~2,550 seeded runs across 12 batches; every "works" claim carries a regeneration command in FINDINGS.md; browser sim verified by Chris, DB endpoint fixed + live on Pages. No cold `/audit` yet.

**Stage:** experiments for the paper substantively DONE (Phases 0–3 all have results); next phase is **writing** + polish runs designed with Jobran.

**State — ten findings, all in [headless/FINDINGS.md](headless/FINDINGS.md) with regen commands:**

- F1–F4: shielding cuts ηc 5–6× (273 → 50); mechanism = lag-load, variance never depletes; plasticity form/reach decisive (slope-1 linear norms unkillable, slope-0.5 worse than nothing); ηc monotonic in dose. Figure: `etac.svg`.
- F5–F6: peak-rate rule under cycles; **the rescue flip** — plasticity fully rescues under oscillation where bare genetics dies; one mechanism, sign set by the environment's return-structure. Figure: `rescue-flip.svg`.
- F7–F9 (spatial): migration rescues via **variance supply, never relocation** (uniform control decisive); a **gradient converts migration to net load**; under shielding uniform-world rescue is **bistable** — tipping point at the rescue margin.
- F10 (informed migration): need-triggered emigration and fit-targeted choice are **jointly necessary, singly useless** — together 0% extinct on the gradient for genetics (from 100%), 35% under shielding; mechanism is a *sorting machine* (static centroids, steep maintained clines, response pinned to required rate); shielding half-defeated via honest newborn assessment.
- Registered-hypothesis ledger: all resolved (F9/F10 footers). Calibration debt closed (realizedResp validated). Heartbeat bug fixed.

**Metrics:** ~2,550 runs, 12 batches, all deterministic-seeded and resumable; polite ceiling 6 workers.

**Branches:** `main`, pushed through this close (Pages deploys on push — DB endpoint fix is live).

**Open:**

- **The paper** — claim structure ready (LITERATURE.md "may/must-not say" + F1–F10); `paper/` repo to scaffold; venue + author order with Jobran
- Polish runs to design with Jobran: more seeds on bistable cells, gradient-steepness sweep, torus-vs-island (Chris's ask), evolvable plasticity, genotype-based (innate-cue) habitat assessment variant
- Cosmetic: dashboard could plot cyclic/spatial batches natively (chart assumes rate axis)
- Coordinator: heartbeat-based dead-claim reclaim (benign gap, documented)

**Next action:** Chris + Jobran read FINDINGS.md F1–F10 and LITERATURE.md; decide paper skeleton and the polish-run list.

**Blockers:** none.
