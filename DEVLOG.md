# DEVLOG — PopGenSim (MAAD)

Backward-looking, append-only. Newest entry on top. Never edit past entries.

<!-- append new entries below this line -->

## 2026-08-27 — Project recovery & infrastructure build

**Done:** Recovered the project's research context after a 16-month pause. The design
discussions happened in the claude.ai web UI (not recoverable from Claude Code), so the
recovery ran through the Gmail thread "paper on phenotypic plasticity for MAAD" with
Jobran Chebib (19 messages, Nov 2024 – Apr 2025) plus git history. Key recoveries:
- The project is **MAAD — Migrate, Adapt, Adjust, or Die** — a collaboration with
  Jobran Chebib studying how migration, genetic adaptation, and phenotypic plasticity
  interact under environmental change, and when populations go extinct instead.
- The reference paper the work is positioned against: **Polechová 2025, "Evolution of
  Species' Range and Niche in Changing Environments" (bioRxiv 10.1101/2025.01.16.633367)**,
  which found plasticity does *not* extend the range of survivable rates of temporal
  change — in direct tension with our central observed phenomenon (**shielding**:
  plasticity hides genotypic variation from selection, genetic variance decays, and the
  population collapses when the environment moves).
- Pulled the full reference set out of Gmail attachments into `../references/`
  (Polechová 2025 both versions' newest, Chevin 2010 + S1, Hendry 2016, Vedder 2013,
  Jobran's institute talk `MAAD_intro_WEG_2025-04-22.pptx`, and his LitLens
  literature-review kit: report PDF, papers CSV, chat history).
- Wrote DEVPLAN.md / STATUS.md / CLAUDE.md / this DEVLOG; updated the PA hub file.

**Changed:** New docs only (DEVLOG.md, DEVPLAN.md, STATUS.md, CLAUDE.md, .gitignore);
`../references/` populated; no sim-code changes. Pre-existing uncommitted `index.html`
title fix (`PopGenSim — Population Genetics Simulator`) left in the working tree.

**State:** Sim code unchanged since 2025-04-12 (`06a9e91`); browser sim presumed working
as of that commit — not re-verified this session. DB endpoint in `params.js` points at
`https://73.19.38.112:8888` (socket.io → Mongo), unverified.

**Next:** Work Stage 5 of DEVPLAN — the critical-rate-of-change measurement (the blocker
named in the hub file) — then the institute-feedback experiments (drift control, linear
plasticity, single-population shielding), then the Polechová comparison.

---

*Entries below this line are **backfilled** (2026-08-27) from git history and the MAAD
email thread — written after the fact, kept for continuity. Provenance: commit hashes
and email dates.*

## 2025-04-22 — Institute feedback round (email, no commit)

Jobran presented MAAD to his institute (`MAAD_intro_WEG.pptx`). Well received. Feedback
became the open experiment list: (1) is the genetic-variance collapse just drift at small
N?; (2) is it an artifact of the plasticity model? — several people suggested a linear
reaction-norm plasticity (à la Chevin) to test whether shielding persists; (3) compare
against Polechová 2025 (plasticity doesn't move the critical rate of change). Jobran also
asked whether shielding-to-extinction occurs in a single population (to rule out
migration). Chris clarified the current plasticity model: always adaptive at current
settings, cue error 0, no overshoot — organisms reach the optimum in a few steps; the only
lag is at environmental change. Apr 24: Jobran sent LitLens research materials for the
paper ("started some research on this for writing a paper").

## 2025-04-12 — Plasticity experiment tuning (`06a9e91`)

Tweaked numbers for plasticity experiments. Last code commit before pause.

## 2025-04-09 — Sexual reproduction (`0192288`)

Added optional sexual reproduction (uniform per-locus inheritance from two parents,
0.5-offspring cost per parent per mating) and expanded the color scheme.

## 2025-03-25 — Distribution visualization (`bc93abd`)

Per-cell gene histogram view (click a cell to toggle quartiles ↔ histogram).

## 2025-03-10 — Dynamic environment updates (`7057848`)

Follow-ups to the temporal patterns (Feb 11 email asked for: burn-in before change,
cycle-time length, turn-edges-off — cycle period landed; burn-in and edges did not).

## 2025-02-11 — Bibliography + model requests (email, no commit)

Jobran's third round of colleague meetings. Vedder 2013 named as the model publication
shape ("empirical estimates for parameter values; extinction probability with and without
plasticity"). Foundational bibliography sent: Via & Lande 1985, Gavrilets & Scheiner 1993,
Vedder 2013, Lopez-Idiaquez 2024, Tufto 2015, and Chevin/Lande/Mace 2010 as the metric
for the critical rate of environmental change.

## 2025-01-12/30 — UX + graphs (`494189b`); RangeShifter comparison (email)

New graphs and selectors. Jan 30: colleague pointed at RangeShifter 2.0 as prior art —
Chris's assessment: robust but "too numerical and not agent based enough," expectations
baked in; good for citation mining.

## 2024-11-29 — Environmental dynamics (`e43e927`)

Temporal environment patterns (static / linear / cycling), spatial patterns
(uniform / gradient).

## 2024-11-25 — Population graphs (`f2a48d2`)

## 2024-11-22 — Plasticity + migration (`cafc0e6`)

Plasticity (step-toward-cue with per-individual cue noise) and the Moore-neighborhood
torus migration model.

## 2024-11-10 — First commit (`2832f54`)

"Migration, adaptation, death." Two days after Jobran's first email proposing the
collaboration (Nov 8, sharing Evolution Letters 3(1):15 as the model to implement a
subset of).
