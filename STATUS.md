# STATUS — PopGenSim (MAAD)

**Updated:** 2026-08-27 (context-recovery session; regenerate at every session close)
**Verified:** never — no cold audit yet; sim last known working at `06a9e91` (2025-04-12), not re-run since

**Stage:** DEVPLAN Stage 2/3 boundary — core model DONE; critical-rate-of-change work is the named blocker.

**State:**
- Browser sim: presumed working @ `06a9e91` (2025-04-12) — **unverified this session** (not launched)
- Working tree: one uncommitted change — `index.html` `<title>` → "PopGenSim — Population Genetics Simulator" (conventions §6 artifact identity)
- Docs: DEVLOG / DEVPLAN / STATUS / CLAUDE.md created 2026-08-27 (this session); history backfilled from git + the MAAD email thread
- References: recovered from Gmail into `../references/` (Polechová 2025 NEW, Chevin 2010 + S1, Hendry 2016, Vedder 2013, MAAD institute talk pptx, LitLens report/CSV/chat) — 2026-08-27
- DB: `params.js` points at `https://73.19.38.112:8888` → `populationGeneticsDB` — **unverified**
- Collaboration: last exchange with Jobran Chebib 2025-04-24 ("started some research on this for writing a paper"); 16 months dormant

**Metrics:** none current (no runs this session)

**Branches:** `main` only

**Open:**
- Institute-feedback experiment list (DEVPLAN Stage 4): drift control, linear-plasticity control, single-population shielding, Polechová comparison
- Model additions promised Feb 2025: burn-in, edges-off toggle
- Critical-rate-of-change metric (Chevin 2010) — hub-file blocker
- Re-establish contact with Jobran (last word was his; the ball may be with Chris)

**Next action:** launch the sim to verify it still runs (cold verification), then start DEVPLAN Stage 3 (critical rate of change).

**Blockers:** none technical — the pause was attention, not obstruction.
