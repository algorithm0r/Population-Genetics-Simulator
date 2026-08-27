// The rescue-flip figure: P(extinct) heatmaps over amplitude × period, one panel per
// plasticity level, pooled from the cycling-environment batches. Companion to etac.svg:
// together they show the sign flip (trend: plasticity dooms; oscillation: plasticity rescues).
//
// Usage: node fig-cyclic.mjs out.svg results/smallamp.jsonl [results/cyclic.jsonl ...]
import fs from 'node:fs';

const OUT = process.argv[2];
const FILES = process.argv.slice(3);
if (!OUT || !FILES.length) { console.error('usage: node fig-cyclic.mjs out.svg results/a.jsonl [...]'); process.exit(1); }

const bins = new Map();
for (const f of FILES) for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    const t = r.cfg.environmentPatterns?.temporal;
    if (t?.type !== 'cycling') continue;
    const p = r.cfg.overrides?.adaptiveStepSize ?? 0;
    const k = `${p}|${t.parameters.cycleAmplitude}|${t.parameters.cyclePeriod}`;
    if (!bins.has(k)) bins.set(k, { p, amp: t.parameters.cycleAmplitude, T: t.parameters.cyclePeriod, n: 0, x: 0 });
    const b = bins.get(k); b.n++; if (!r.survived) b.x++;
}

const ps = [...new Set([...bins.values()].map(b => b.p))].sort((a, c) => a - c);
const amps = [...new Set([...bins.values()].map(b => b.amp))].sort((a, c) => a - c);
const Ts = [...new Set([...bins.values()].map(b => b.T))].sort((a, c) => a - c);

// white → red scale on P(extinct)
const color = p => {
    const t = Math.max(0, Math.min(1, p));
    const r = 255, g = Math.round(255 - 195 * t), b = Math.round(255 - 210 * t);
    return `rgb(${r},${g},${b})`;
};

const CELL = 62, PADL = 70, PADT = 64, GAP = 46, PADB = 30;
const panelW = Ts.length * CELL, panelH = amps.length * CELL;
const W = PADL + ps.length * panelW + (ps.length - 1) * GAP + 20;
const H = PADT + panelH + PADB;

let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="system-ui,sans-serif">`;
s += `<rect width="${W}" height="${H}" fill="white"/>`;
s += `<text x="${PADL}" y="22" font-size="15" font-weight="bold">PopGenSim (MAAD) — extinction under oscillating environments</text>`;
s += `<text x="${PADL}" y="40" font-size="11" fill="#555">cell = P(extinct within 50k generations); white 0 → red 1. Same shielding mechanism as the directional case — opposite sign.</text>`;

ps.forEach((p, pi) => {
    const ox = PADL + pi * (panelW + GAP);
    s += `<text x="${ox + panelW / 2}" y="${PADT - 8}" font-size="13" font-weight="bold" text-anchor="middle">${p === 0 ? 'no plasticity' : 'plasticity (step ' + p + ')'}</text>`;
    amps.forEach((a, ai) => {
        const oy = PADT + (amps.length - 1 - ai) * CELL;
        if (pi === 0) s += `<text x="${PADL - 10}" y="${oy + CELL / 2 + 4}" font-size="11" fill="#333" text-anchor="end">a=${a}</text>`;
        Ts.forEach((T, ti) => {
            const b = bins.get(`${p}|${a}|${T}`);
            const x = ox + ti * CELL;
            if (b) {
                const pe = b.x / b.n;
                s += `<rect x="${x}" y="${oy}" width="${CELL - 2}" height="${CELL - 2}" fill="${color(pe)}" stroke="#ccc"/>`;
                s += `<text x="${x + (CELL - 2) / 2}" y="${oy + CELL / 2 + 4}" font-size="12" text-anchor="middle" fill="${pe > 0.6 ? 'white' : '#333'}">${pe.toFixed(2)}<title>n=${b.n}</title></text>`;
            } else {
                s += `<rect x="${x}" y="${oy}" width="${CELL - 2}" height="${CELL - 2}" fill="#f4f4f4" stroke="#ddd"/>`;
            }
            if (ai === 0) s += `<text x="${x + CELL / 2}" y="${PADT + panelH + 16}" font-size="11" fill="#333" text-anchor="middle">T=${T}</text>`;
        });
    });
});
s += `<text x="16" y="${PADT + panelH / 2}" font-size="12" fill="#333" transform="rotate(-90 16 ${PADT + panelH / 2})" text-anchor="middle">cycle amplitude</text>`;
s += '</svg>';
fs.writeFileSync(OUT, s);
console.log(`${bins.size} cells -> ${OUT}`);
