// PopGenSim (MAAD) — run dashboard (design cue: Domestication's figserver, simplified).
// Serves one self-contained page that polls the coordinator's /status: batch progress,
// per-bin table (n, P(extinct) ± CI, mean time-to-extinction, status), live workers,
// recent completions, and a live SVG chart of P(extinct) vs. rate per plasticity level
// (drawn from bin.meta {plasticity, rate} set by gen-settings.mjs).
//
// Usage: node dashboard.mjs    Env: PORT (8091), COORD (http://localhost:8090)
import http from 'node:http';

const PORT = parseInt(process.env.PORT || '8091');
const COORD = process.env.COORD || 'http://localhost:8090';

const PAGE = /* html */`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>PopGenSim — Run Dashboard</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 20px; background: #101418; color: #dde3ea; }
  h1 { font-size: 18px; } h2 { font-size: 14px; color: #9ab; margin: 18px 0 6px; }
  .bar { background: #232a33; border-radius: 4px; height: 18px; width: 100%; max-width: 720px; }
  .bar > div { background: #4a9eda; height: 100%; border-radius: 4px; transition: width .5s; }
  table { border-collapse: collapse; font-size: 12px; }
  td, th { padding: 3px 10px; border-bottom: 1px solid #232a33; text-align: left; }
  .fin { color: #7c6; } .act { color: #eb5; } .mono { font-family: monospace; }
  #chart { background: #161b21; border-radius: 6px; margin-top: 6px; }
  .legend span { margin-right: 16px; font-size: 12px; }
</style></head><body>
<h1>PopGenSim — MAAD run dashboard <span id="batch" class="mono"></span></h1>
<div class="bar"><div id="prog" style="width:0%"></div></div>
<div id="summary" style="margin:6px 0 0; font-size:13px;"></div>
<h2>P(extinct) vs rate of change — live</h2>
<div class="legend" id="legend"></div>
<svg id="chart" width="720" height="300"></svg>
<h2>Bins</h2><table id="bins"><thead><tr><th>id</th><th>n</th><th>P(extinct)</th><th>±CI</th><th>mean TTE</th><th>status</th></tr></thead><tbody></tbody></table>
<h2>Workers</h2><table id="workers"><thead><tr><th>worker</th><th>run</th><th>gen</th><th>beat age</th><th>on run</th></tr></thead><tbody></tbody></table>
<h2>Recent</h2><table id="recent"><thead><tr><th>run</th><th>outcome</th><th>duration</th></tr></thead><tbody></tbody></table>
<script>
const COORD = ${JSON.stringify(COORD)};
const colors = ['#4a9eda','#e07b54','#7c6','#c7a0e8','#eb5','#6cd0c4'];
function draw(bins) {
  const svg = document.getElementById('chart');
  const W = 720, H = 300, L = 45, B = 30, T = 10, R = 10;
  const pts = bins.filter(b => b.meta && b.meta.rate != null && b.n > 0);
  const rates = [...new Set(pts.map(b => b.meta.rate))].sort((a,b)=>a-b);
  const plas = [...new Set(pts.map(b => b.meta.plasticity))].sort((a,b)=>a-b);
  if (!rates.length) { svg.innerHTML = '<text x="20" y="40" fill="#667">no data yet</text>'; return; }
  const x = r => L + (rates.indexOf(r) / Math.max(rates.length - 1, 1)) * (W - L - R);
  const y = p => T + (1 - p) * (H - T - B);
  let s = '';
  for (const gy of [0, .25, .5, .75, 1]) s += \`<line x1="\${L}" y1="\${y(gy)}" x2="\${W-R}" y2="\${y(gy)}" stroke="#232a33"/><text x="4" y="\${y(gy)+4}" fill="#667" font-size="10">\${gy}</text>\`;
  for (const r of rates) s += \`<text x="\${x(r)}" y="\${H-8}" fill="#667" font-size="10" text-anchor="middle">\${r}</text>\`;
  plas.forEach((p, i) => {
    const col = colors[i % colors.length];
    const series = rates.map(r => pts.find(b => b.meta.plasticity === p && b.meta.rate === r)).filter(Boolean);
    // CI whiskers + points + line
    let path = '';
    for (const b of series) {
      const px = x(b.meta.rate), py = y(b.pExtinct ?? 0);
      path += (path ? ' L' : 'M') + px + ' ' + py;
      if (b.ciHalf != null) s += \`<line x1="\${px}" y1="\${y(Math.min(1,(b.pExtinct??0)+b.ciHalf))}" x2="\${px}" y2="\${y(Math.max(0,(b.pExtinct??0)-b.ciHalf))}" stroke="\${col}" stroke-opacity="0.5"/>\`;
      s += \`<circle cx="\${px}" cy="\${py}" r="3.5" fill="\${col}"><title>\${b.id}: p=\${(b.pExtinct??0).toFixed(2)} n=\${b.n}</title></circle>\`;
    }
    s += \`<path d="\${path}" fill="none" stroke="\${col}" stroke-width="1.5" stroke-opacity="0.8"/>\`;
  });
  svg.innerHTML = s;
  document.getElementById('legend').innerHTML = plas.map((p,i)=>\`<span style="color:\${colors[i%colors.length]}">● plasticity \${p}</span>\`).join('') +
    '<span style="color:#667">x: rate (units per 10k gens) · y: P(extinct)</span>';
}
async function tick() {
  try {
    const s = await fetch(COORD + '/status').then(r => r.json());
    document.getElementById('batch').textContent = '· ' + s.batch;
    const pct = s.counts.total ? Math.round(100 * s.counts.done / s.counts.total) : 0;
    document.getElementById('prog').style.width = pct + '%';
    const mins = Math.round((Date.now() - s.startedAt) / 60000);
    document.getElementById('summary').textContent =
      \`\${s.counts.done}/\${s.counts.total} bins converged · \${s.counts.reps} reps stored · \${s.completed} completed this session · \${s.counts.running} running · up \${mins}m\` + (s.done ? ' · BATCH DONE' : '');
    draw(s.bins);
    document.querySelector('#bins tbody').innerHTML = s.bins.map(b =>
      \`<tr><td class="mono">\${b.id}</td><td>\${b.n}</td><td>\${b.pExtinct==null?'—':b.pExtinct.toFixed(2)}</td><td>\${b.ciHalf==null?'—':'±'+b.ciHalf.toFixed(2)}</td><td>\${b.meanTTE==null?'—':Math.round(b.meanTTE)}</td><td class="\${b.finished?'fin':'act'}">\${b.finished?'converged':'active ('+b.n+'→~'+b.nNeeded+')'}</td></tr>\`).join('');
    document.querySelector('#workers tbody').innerHTML = s.workers.map(w =>
      \`<tr><td class="mono">\${w.worker}</td><td class="mono">\${w.runId??'idle'}</td><td>\${w.gen}/\${w.epoch}</td><td>\${w.age}s</td><td>\${w.onRunSec}s</td></tr>\`).join('');
    document.querySelector('#recent tbody').innerHTML = s.recent.map(r =>
      \`<tr><td class="mono">\${r.id}</td><td>\${r.extinct==null?'?':(r.extinct?'extinct@'+r.extinctAt:'survived')}</td><td>\${r.durationMs==null?'—':Math.round(r.durationMs/1000)+'s'}</td></tr>\`).join('');
  } catch (e) { document.getElementById('summary').textContent = 'coordinator unreachable: ' + e; }
}
tick(); setInterval(tick, 5000);
</script></body></html>`;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(PAGE);
}).listen(PORT, '127.0.0.1', () => console.log(`PopGenSim dashboard on http://127.0.0.1:${PORT} (coordinator: ${COORD})`));
