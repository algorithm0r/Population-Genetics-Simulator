# STATUS — PopGenSim (MAAD)

**Updated:** 2026-08-27, session close (autonomous run: recovery → infrastructure → literature → F1–F5)
**Verified:** this session, warm — smoke suite 7/7 PASS @ `a5402ee`+; ~1,300 seeded runs, ≥10 reps/bin, Wilson CIs; every finding regenerable by command (FINDINGS.md). Browser sim NOT visually checked (core behavior unchanged by default; linear-norm variant is flag-gated). No cold `/audit` yet.

**Stage:** DEVPLAN Phases 0a/0b DONE · Phase 1 controls mostly DONE (drift moot per F2; linear-norm control = F3) · Phase 2 headline experiments mostly DONE (F4 money figure, F5 cycles) · Phase 3 (spatial) NOT STARTED — it is the paper's differentiator.

**State — the five findings (details + regen commands in [headless/FINDINGS.md](headless/FINDINGS.md)):**
- F1: shielding-extinction replicates; ηc(step 0) ≈ 273 vs ηc(step 0.5) ≈ 50 — a 5–6× critical-rate collapse
- F2: mechanism is lag-load (frozen mean tracking + finite plastic reach), NOT variance erosion — variance never runs out; corrects the Apr 2025 institute framing; answers Jobran's drift question
- F3: plasticity FORM decides: slope-1 linear norms unkillable; slope-0.5 linear worse than nothing (ηc≈130); bounded step worst — cost-free norm harm contradicts Chevin in finite populations
- F4: ηc monotonic in plasticity strength (273 → 119 → 70 → 50 → 50 → 32); first dose hurts most; figure `headless/results/etac.svg`
- F5: ηc(0.5) stable at 200k gens; cycles governed by peak rate vs ηc; "plasticity buffers cycles" refuted for amplitude > plastic reach; buffer-regime prediction registered for amplitude ≤ reach

**Metrics:** 4 coordinator batches, ~1,300 runs, all deterministic-seeded; 6-worker ceiling is machine-polite (11 saturates the box).

**Branches:** `main`, 12 commits this session. **Not pushed** (remote = live GitHub Pages; pushing deploys — Chris's call).

**Open:**
- Small-amplitude cyclic sweep (registered prediction: plasticity buffers when amplitude ≤ reach ~2.5 and cycles are fast)
- selDiff estimator calibration (before the mechanism figure)
- Phase 3 spatial factorial: migration × plasticity × change — untouched territory, the paper's strongest claim
- Coordinator: heartbeat-based reclaim of dead worker claims (known benign gap)
- Literature debts: published Vinton 2022 text; re-check Vinton citers at writing time
- **Chris:** eyes on browser sim; decision on re-engaging Jobran (F1–F5 + the mechanism correction are the material; last word was his, Apr 2025)

**Next action:** Chris reviews F1–F5 and the paper framing in `../references/LITERATURE.md`; then either the small-amplitude cyclic sweep or Phase 3 spatial design (with Jobran, ideally).

**Blockers:** none.
