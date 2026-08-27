// Aggregate a batch's results JSONL into (1) a per-bin summary table (CSV + console),
// (2) a mechanism-trace CSV (per-report-tick means across reps, per bin) for the
// variance/lag/selection-differential figures.
//
// Usage: node agg.mjs results/pilot1x.jsonl [outPrefix]
// Regenerates: <outPrefix>_bins.csv, <outPrefix>_traces.csv
import fs from 'node:fs';

const IN = process.argv[2];
const PREFIX = process.argv[3] ?? IN.replace(/\.jsonl$/, '');
if (!IN || !fs.existsSync(IN)) { console.error('usage: node agg.mjs <results.jsonl> [outPrefix]'); process.exit(1); }

const runs = fs.readFileSync(IN, 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

// bin key: (adaptiveStepSize, rate) from stored cfg
const rateOf = r => {
    const t = r.cfg.environmentPatterns?.temporal;
    if (t?.type === 'cycling') return `a${t.parameters.cycleAmplitude}T${t.parameters.cyclePeriod}`;
    return t?.parameters?.changeRate ?? 0;
};
const plasOf = r => {
    const o = r.cfg.overrides ?? {};
    if (o.plasticityModel === 'linear') return `lin${o.reactionNormSlope}`;   // linear-norm arms are their own labels
    return o.adaptiveStepSize ?? r.PARAMS?.adaptiveStepSize;
};
// migration is an axis whenever nonzero; folded into the label so arms never pool
const migOf = r => {
    const m = r.cfg.overrides?.offspringMigrationChance ?? 0;
    return m > 0 ? `_m${m}` : '';
};
const key = r => `p${plasOf(r)}_r${rateOf(r)}${migOf(r)}`;

const bins = new Map();
for (const r of runs) {
    const k = key(r);
    if (!bins.has(k)) bins.set(k, { plasticity: plasOf(r), rate: rateOf(r), mig: r.cfg.overrides?.offspringMigrationChance ?? 0, runs: [] });
    bins.get(k).runs.push(r);
}

// Wilson CI
function wilson(x, n) {
    if (!n) return { p: null, half: null };
    const z = 1.96, p = x / n, d = 1 + z * z / n;
    return { p, half: (z / d) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) };
}

const rows = [['plasticity', 'rate', 'mig', 'n', 'extinct', 'pExtinct', 'ciHalf', 'meanTTE', 'sdTTE', 'meanFinalVarGeno_survivors', 'meanFinalLag_survivors']];
for (const b of [...bins.values()].sort((a, c) => a.plasticity - c.plasticity || a.rate - c.rate)) {
    const n = b.runs.length, ext = b.runs.filter(r => !r.survived);
    const { p, half } = wilson(ext.length, n);
    const ttes = ext.map(r => r.extinctAt);
    const mTTE = ttes.length ? ttes.reduce((a, x) => a + x, 0) / ttes.length : null;
    const sdTTE = ttes.length > 1 ? Math.sqrt(ttes.reduce((a, x) => a + (x - mTTE) ** 2, 0) / (ttes.length - 1)) : null;
    const survFinals = b.runs.filter(r => r.survived).map(r => r.series.at(-1));
    const mVar = survFinals.length ? survFinals.reduce((a, s) => a + s.varGeno, 0) / survFinals.length : null;
    const mLag = survFinals.length ? survFinals.reduce((a, s) => a + s.genoLag, 0) / survFinals.length : null;
    rows.push([b.plasticity, b.rate, b.mig, n, ext.length, p?.toFixed(3), half?.toFixed(3), mTTE ? Math.round(mTTE) : '', sdTTE ? Math.round(sdTTE) : '', mVar?.toFixed(4) ?? '', mLag?.toFixed(3) ?? '']);
}
fs.writeFileSync(PREFIX + '_bins.csv', rows.map(r => r.join(',')).join('\n'));
console.log(rows.map(r => r.map(String).map(s => s.padEnd(10)).join(' ')).join('\n'));

// mechanism traces: per bin, mean across reps at each report gen (up to each rep's end)
const t = [['plasticity', 'rate', 'gen', 'nReps', 'meanN', 'meanVarGeno', 'meanGenoLag', 'meanPhenoLag', 'meanSelDiff']];
for (const b of [...bins.values()].sort((a, c) => a.plasticity - c.plasticity || a.rate - c.rate)) {
    const byGen = new Map();
    for (const r of b.runs) for (const s of r.series) {
        if (!byGen.has(s.gen)) byGen.set(s.gen, []);
        byGen.get(s.gen).push(s);
    }
    for (const [gen, ss] of [...byGen.entries()].sort((a, c) => a[0] - c[0])) {
        const live = ss.filter(s => s.n > 0);
        if (!live.length) continue;
        const m = f => (live.reduce((a, s) => a + (s[f] ?? 0), 0) / live.length);
        t.push([b.plasticity, b.rate, gen, live.length, Math.round(m('n')), m('varGeno').toFixed(4), m('genoLag').toFixed(3), m('phenoLag').toFixed(3), m('selDiffGeno').toFixed(5)]);
    }
}
fs.writeFileSync(PREFIX + '_traces.csv', t.map(r => r.join(',')).join('\n'));
console.log(`\n${runs.length} runs, ${bins.size} bins -> ${PREFIX}_bins.csv, ${PREFIX}_traces.csv`);
