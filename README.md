# PopGenSim — the MAAD model

**Move, Adjust, Adapt, or Die.** An agent-based simulation of how populations survive
(or fail to survive) environmental change, built to study a specific question: *when
does the ability of individuals to adjust to their environment help a species — and
when does it quietly doom it?*

Run it in a browser (no install): the live simulator is served from this repo via
GitHub Pages. Or run it headless at scale — see [Running it](#running-it) below.

Built by Chris Marriott in collaboration with Jobran Chebib. The research record —
eighteen findings, each with the exact command that regenerates it — lives in
[headless/FINDINGS.md](headless/FINDINGS.md).

## The model, in plain terms

Forget biology vocabulary for a moment. Picture a world made of rooms, where each
room has an **ideal setting** — a single number, like a thermostat's ideal
temperature. The world's ideal can change over time: drift steadily in one
direction, swing back and forth in cycles, wander randomly, or any mixture.

Each creature in this world is a simple device with two numbers:

- a **factory preset** — the number written in its genes. Fixed for life, and the
  only thing its offspring inherit (with small random copying errors).
- a **displayed value** — what the creature actually *is* right now. It starts at
  the factory preset and can be tuned during life.

Life runs in ticks, and each tick every creature does four things — the four verbs
in MAAD:

1. **Reproduce or not (Die):** the closer your displayed value is to your room's
   ideal, the more offspring you make. Far from ideal means few or none. Every
   creature also has a fixed chance of dying each tick, so lifespans are short and
   turnover is constant. Offspring start life displaying their inherited preset —
   untuned.
2. **Adjust:** tune your displayed value toward what you measure the room's ideal
   to be. This is *phenotypic plasticity* — the within-lifetime ability to change.
   Crucially, **tuning is never inherited**. Your offspring get your preset, not
   your adjustments.
3. **Adapt** (the population, not the individual): because well-matched creatures
   out-reproduce poorly-matched ones, the *presets* in the population shift over
   generations. That is evolution by natural selection, and it is the only way the
   inherited numbers ever improve.
4. **Move (Migrate):** hop to a neighboring room, either at random or — with the
   informed-migration options on — because you feel poorly matched where you are
   (leave when uncomfortable) and can pick the best-matching neighboring room
   (choose where to settle).

That's the whole model. Everything interesting emerges from how these four verbs
interact when the world's ideal starts moving.

## The central phenomenon: shielding

Here is the trap the project exists to study. Selection can only "see" displayed
values. If creatures tune themselves well, everyone looks similar and well-matched —
*no matter what presets they carry*. Tuning **hides the presets from quality
control**. So the better individuals adjust, the weaker the pressure on the
inherited numbers to improve, and the presets fall further and further behind a
moving ideal. The population looks healthy — everyone is well-tuned, headcounts are
fine — right up until the tuning range runs out. Then it collapses, still carrying
plenty of genetic variety it never got to use.

We call this *shielding*, and the simulation shows it is not a corner case: under
steady environmental change, a moderately plastic population dies at rates of change
five to six times slower than what a completely rigid population survives. Some of
the sharper results that follow from it:

- **The valley of partial plasticity.** Sweeping the strength of self-adjustment
  from 0% to 100% compensation, survival is worst near *almost-perfect* tuning, and
  only exactly-perfect, unlimited tuning escapes the trap — a corner no real
  organism occupies. The most competent-looking adjusters are the most fragile.
- **The sign flips with the environment's rhythm.** The same tuning that is fatal
  under one-way drift is a complete rescue under back-and-forth cycles (where the
  preset's job is just to sit at the average). Whether plasticity helps or harms is
  set by whether the environment *comes back*.
- **Seasons conceal drift damage.** A cycle the population buffers perfectly still
  spends the tuning range that a simultaneous slow drift needs — so a
  climate-change-shaped world (seasons on a warming ramp) is deadlier than either
  component alone.
- **Information and landscape are partners.** Smart movement can substitute for
  genetic tracking — but only if there is somewhere better to go (a graded
  landscape, not identical rooms), and only if the sense it relies on is honest
  (tuning fools it: a well-adjusted creature *feels* at home everywhere).
- **Longevity deepens the trap.** Longer-lived creatures tune more (hiding more)
  and are born less often (fewer untuned newborns for selection to read), so
  long-lived plastic species are the most vulnerable class under sustained change —
  and look demographically healthy the longest.

## The knobs

All parameters live in one place, [`params.js`](params.js). The scientifically
important ones:

| knob | plain meaning |
|---|---|
| `adaptiveStepSize` | how much a creature can tune per tick (0 = rigid) |
| `plasticityModel` | `"step"`: repeated small capped moves (tuning takes time, has a lifetime range) · `"linear"`: one proportional jump toward the measured ideal |
| `reactionNormSlope` | for `"linear"`: what fraction of the gap one jump closes |
| `cuePeriod`, `adjustDelay`, `birthCue` | *when* the creature measures the room and *when* it acts on the measurement (measure every tick vs once at birth; act immediately vs later) |
| `targetObservationalNoise` | how badly a creature misreads the room's ideal (one lifelong error per creature) |
| `deathChancePerGeneration` | per-tick death odds — sets mean lifespan and population turnover |
| `offspringMigrationChance`, `adultMigrationChance` | odds of hopping to a neighboring room |
| `needMigrationScale`, `fitTargetedMigration`, `migrationAssessment` | informed movement: leave when mismatched, pick the best neighbor, and what sense to use (displayed value vs inherited preset) |
| `environmentPatterns` | the world's script: static, steady drift, cycles, cycles-on-a-ramp, ramp-then-stop, red noise; spatially uniform or a graded landscape |
| `worldEdges` | `"torus"` (wraparound) or `"island"` (hard walls) |
| `fitnessTiming` | whether this tick's reproduction test uses the value tuned last tick (default) or this tick |

## Running it

**Browser:** open `index.html` (or the GitHub Pages deployment of this repo). Set
parameters in the UI, watch the grid — each room shows the spread of presets (left)
and displayed values (right) as colors, with a population bar.

**Headless, at scale** (Node.js, no install beyond `npm` for the optional DB):

```
cd headless
node smoketest.mjs                     # sanity checks (deterministic, ~1 min)
node gen-settings.mjs <experiment>     # build a batch of run configs
node coordinator.mjs settings/<x>.json <batchName>   # start the coordinator (:8090)
node worker.mjs http://localhost:8090 w1             # start workers (one per core)
node agg.mjs results/<batchName>.jsonl               # summarize into CSVs
```

The headless runner loads **the exact same simulation files** the browser uses —
nothing is reimplemented — with a seeded random-number generator so every run is
reproducible from its config. Batches are resumable, results append to JSONL, and
every finding in [headless/FINDINGS.md](headless/FINDINGS.md) records the command
that regenerates it.

## Repo map

- `index.html`, `*.js` — the simulation and browser UI (vanilla JS + Canvas, no
  build step)
- `headless/` — runner, coordinator/worker fleet, aggregator, experiment
  definitions, findings
- `STATUS.md` / `DEVPLAN.md` / `DEVLOG.md` — where the project is, where it's
  going, how it got here
