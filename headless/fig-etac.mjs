// Critical-rate figure: P(extinct) vs rate per plasticity level + eta_c(plasticity).
// eta_c estimated by linear interpolation of P(extinct) crossing 0.5 between adjacent
// rate bins (with a note when censored: all-survive or all-die across the tested range).
//
// Usage: node fig-etac.mjs out.svg results/a.jsonl [results/b.jsonl ...]
// Regenerates: <out.svg> and <out.svg>.etac.csv
import fs from 'node:fs';

const OUT = process.argv[2];
const FILES = process.argv.slice(3);
if (!OUT || !FILES.length) { console.error('usage: node fig-etac.mjs out.svg results/a.jsonl [...]'); process.exit(1); }

const rateOf = r => r.cfg.environmentPatterns?.temporal?.parameters?.changeRate ?? 0;
const plasOf = r => {
    const o = r.cfg.overrides ?? {};
    if (o.plasticityModel === 'linear') return `lin${o.reactionNormSlope}`;
    return String(o.adaptiveStepSize ?? r.PARAMS?.adaptiveStepSize);
};

const bins = new Map();
for (const f of FILES) for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (r.cfg.environmentPatterns?.temporal?.type === 'cycling') continue;   // directional/static only
    const k = `${plasOf(r)}|${rateOf(r)}`;
    if (!bins.has(k)) bins.set(k, { p: plasOf(r), rate: rateOf(r), n: 0, x: 0 });
    const b = bins.get(k); b.n++; if (!r.survived) b.x++;
}

const series = new Map();
for (const b of bins.values()) {
    if (!series.has(b.p)) series.set(b.p, []);
    series.get(b.p).push(b);
}
for (const arr of series.values()) arr.sort((a, c) => a.rate - c.rate);

// eta_c per plasticity level: 0.5-crossing interpolation
const etac = [];
for (const [p, arr] of series) {
    let cross = null, note = '';
    for (let i = 1; i < arr.length; i++) {
        const a = arr[i - 1], c = arr[i], pa = a.x / a.n, pc = c.x / c.n;
        if (pa < 0.5 && pc >= 0.5) { cross = a.rate + (0.5 - pa) / (pc - pa) * (c.rate - a.rate); break; }
    }
    if (cross === null) {
        const pl = arr.at(-1).x / arr.at(-1).n;
        note = pl < 0.5 ? `>${arr.at(-1).rate} (censored: survives whole range)` : `<${arr[0].rate} (censored: dies whole range)`;
    }
    etac.push({ p, etac: cross, note, nBins: arr.length, nRuns: arr.reduce((s, b) => s + b.n, 0) });
}
fs.writeFileSync(OUT + '.etac.csv', 'plasticity,etac,note,nBins,nRuns\n' + etac.map(e => [e.p, e.etac?.toFixed(1) ?? '', e.note, e.nBins, e.nRuns].join(',')).join('\n'));

// SVG: single panel, P(extinct) vs rate; one line per plasticity level; Wilson whiskers
const W = 860, H = 460, L = 60, R = 210, T = 40, B = 55;
const allRates = [...new Set([...bins.values()].map(b => b.rate))].sort((a, c) => a - c);
const maxRate = Math.max(...allRates);
const x = r => L + (r / maxRate) * (W - L - R);
const y = p => T + (1 - p) * (H - T - B);
const colors = ['#2c7fb8', '#e07b54', '#41ab5d', '#c7a0e8', '#d4a017', '#e34a6f', '#6cd0c4', '#888'];
const wilson = (xn, n) => { const z = 1.96, p = xn / n, d = 1 + z * z / n; return { c: (p + z * z / (2 * n)) / d, h: (z / d) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) }; };

let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="system-ui,sans-serif">`;
s += `<rect width="${W}" height="${H}" fill="white"/>`;
s += `<text x="${L}" y="22" font-size="15" font-weight="bold">PopGenSim (MAAD) — extinction probability vs rate of environmental change</text>`;
for (const gy of [0, .25, .5, .75, 1]) s += `<line x1="${L}" y1="${y(gy)}" x2="${W - R}" y2="${y(gy)}" stroke="#eee"/><text x="${L - 8}" y="${y(gy) + 4}" font-size="11" fill="#666" text-anchor="end">${gy}</text>`;
for (const r of allRates) s += `<text x="${x(r)}" y="${H - B + 18}" font-size="10" fill="#666" text-anchor="middle">${r}</text>`;
s += `<text x="${(L + W - R) / 2}" y="${H - 12}" font-size="12" fill="#333" text-anchor="middle">rate of environmental change (trait units per 10,000 generations)</text>`;
s += `<text x="16" y="${(T + H - B) / 2}" font-size="12" fill="#333" transform="rotate(-90 16 ${(T + H - B) / 2})" text-anchor="middle">P(extinct within 50k generations)</text>`;
const order = [...series.keys()].sort((a, c) => String(a).localeCompare(String(c), undefined, { numeric: true }));
order.forEach((p, i) => {
    const col = colors[i % colors.length], arr = series.get(p);
    let path = '';
    for (const b of arr) {
        const { c, h } = wilson(b.x, b.n);
        const px = x(b.rate), py = y(b.x / b.n);
        path += (path ? ' L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1);
        s += `<line x1="${px}" y1="${y(Math.min(1, c + h))}" x2="${px}" y2="${y(Math.max(0, c - h))}" stroke="${col}" stroke-opacity="0.45" stroke-width="2"/>`;
        s += `<circle cx="${px}" cy="${py}" r="3.5" fill="${col}"/>`;
    }
    s += `<path d="${path}" fill="none" stroke="${col}" stroke-width="2" stroke-opacity="0.85"/>`;
    const e = etac.find(e => e.p === p);
    s += `<text x="${W - R + 14}" y="${T + 18 + i * 20}" font-size="12" fill="${col}">● ${isNaN(+p) ? p : 'step ' + p} — ηc ${e.etac ? '≈ ' + e.etac.toFixed(0) : e.note}</text>`;
});
s += `<text x="${W - R + 14}" y="${T + 18 + order.length * 20 + 10}" font-size="10" fill="#888">whiskers: 95% Wilson CI</text>`;
s += '</svg>';
fs.writeFileSync(OUT, s);
console.log(`${bins.size} bins, ${[...bins.values()].reduce((a, b) => a + b.n, 0)} runs -> ${OUT}, ${OUT}.etac.csv`);
console.table(etac.map(e => ({ plasticity: e.p, etac: e.etac?.toFixed(1) ?? e.note, runs: e.nRuns })));
