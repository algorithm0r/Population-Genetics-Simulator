# STATUS â€” PopGenSim (MAAD)

**Updated:** 2026-08-28, close of the full-steam run (F1â€“F9 complete)
**Verified:** warm, this session â€” smoke 8/8; ~2,400 seeded runs across 11 batches; every "works" claim carries a regeneration command in FINDINGS.md; browser sim verified by Chris, DB endpoint fixed + live on Pages. No cold `/audit` yet.

**Stage:** experiments for the paper substantively DONE (Phases 0â€“3 all have results); next phase is **writing** + polish runs designed with Jobran.

**State â€” ten findings, all in [headless/FINDINGS.md](headless/FINDINGS.md) with regen commands:**
- F1â€“F4: shielding cuts Î·c 5â€“6Ã— (273 â†’ 50); mechanism = lag-load, variance never depletes; plasticity form/reach decisive (slope-1 linear norms unkillable, slope-0.5 worse than nothing); Î·c monotonic in dose. Figures: `etac.svg`.
- F5â€“F6: peak-rate rule under cycles; **the rescue flip** â€” plasticity fully rescues under oscillation (a4â€“a8, fast periods) where bare genetics dies; one mechanism, sign set by the environment's return-structure. Figure: `rescue-flip.svg`.
- F7â€“F9 (spatial): migration rescues via **variance supply, never relocation** (uniform control decisive; centroids static); a **gradient converts migration to net load** (100% extinct at 50k even with response restored); under shielding uniform-world rescue is **bistable** (42% dead, survivors stable at realizedResp â‰ˆ required â€” tipping point at the rescue margin).
- Registered-hypothesis ledger: all resolved (see F9 footer). Calibration debt closed (realizedResp validated). Heartbeat bug fixed.

**Metrics:** ~2,550 runs, 12 batches, all deterministic-seeded and resumable; polite ceiling 6 workers.

**Branches:** `main`, pushed through this close (Pages deploys on push â€” DB endpoint fix is live).

**Open:**
- **The paper** â€” claim structure ready (LITERATURE.md "may/must-not say" + F1â€“F9); `paper/` repo to scaffold; venue + author order with Jobran
- Polish runs to design with Jobran: more seeds on the bistable cell, gradient-steepness sweep, torus-vs-island (Chris's ask), evolvable plasticity extension (their call)
- Cosmetic: dashboard could plot cyclic/spatial batches natively (chart assumes rate axis)
- Coordinator: heartbeat-based dead-claim reclaim (benign gap, documented)

**Next action:** Chris + Jobran read FINDINGS.md F1â€“F9 and LITERATURE.md; decide paper skeleton and the polish-run list.

**Blockers:** none.
