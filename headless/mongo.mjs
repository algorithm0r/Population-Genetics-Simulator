// mongo.mjs — MAAD thin client for the shared socket.io DB backend
// (research.climbinggiants.com:8888 → populationGeneticsDB). Modeled on
// Domestication's runner/mongo.mjs (the Server is referenced, never copied).
// Stored docs = the runner's result objects (cfg + full PARAMS + series) plus flat
// derived fields so queries never need the big series arrays:
//   run, batch, seed, extinct, extinctAt, plasticity, rate, mig, model, world
import { io } from 'socket.io-client';

export const MONGO_URL = process.env.MONGO_URL || 'https://research.climbinggiants.com:8888';
export const MONGO_DB = process.env.MONGO_DB || 'populationGeneticsDB';

export function connect() {
    return io(MONGO_URL, { reconnection: true, transports: ['websocket', 'polling'] });
}

// flat query fields derived from a result object (mirrors agg.mjs labeling)
export function derived(r, batch) {
    const o = r.cfg?.overrides ?? {};
    const t = r.cfg?.environmentPatterns?.temporal;
    const sp = r.cfg?.environmentPatterns?.spatial;
    const need = (o.needMigrationScale ?? 0) > 0, fit = !!o.fitTargetedMigration;
    return {
        project: 'PopGenSim',
        batch, run: r.run ?? null, seed: r.cfg?.seed ?? null,
        extinct: !r.survived, extinctAt: r.extinctAt ?? null,
        plasticity: o.plasticityModel === 'linear' ? `lin${o.reactionNormSlope}` : (o.adaptiveStepSize ?? null),
        rate: t?.type === 'cycling' ? `a${t.parameters.cycleAmplitude}T${t.parameters.cyclePeriod}` : (t?.parameters?.changeRate ?? 0),
        mig: o.offspringMigrationChance ?? 0,
        model: need && fit ? 'both' : need ? 'need' : fit ? 'fit' : 'random',
        assessment: o.migrationAssessment ?? 'phenotype',
        world: sp && sp.type !== 'uniform' ? sp.type : ((o.numCols ?? 1) > 1 ? 'uniform' : 'single'),
    };
}

function ackResult(ack, expected) {
    if (!ack) return { ok: false, reason: 'no-ack-timeout' };
    if (ack.error || ack.ok === false || ack.status === 'error') return { ok: false, reason: ack.error || 'ackErr', ack };
    const inserted = typeof ack.inserted === 'number' ? ack.inserted : (ack.ok === true || ack.status === 'ok' ? expected : 0);
    return { ok: inserted >= expected, inserted, ack };
}
const emitAck = (socket, msg, timeoutMs, expected) => new Promise(resolve => {
    let settled = false;
    const t = setTimeout(() => { if (!settled) { settled = true; resolve({ ok: false, reason: 'no-ack-timeout' }); } }, timeoutMs);
    socket.emit('insert', msg, ack => { if (!settled) { settled = true; clearTimeout(t); resolve(ackResult(ack, expected)); } });
});

export function insertMany(socket, collection, docs, { timeoutMs = 60000 } = {}) {
    return emitAck(socket, { db: MONGO_DB, collection, data: docs }, timeoutMs, docs.length);
}

export function count(socket, collection, query = {}, timeoutMs = 30000) {
    return new Promise(resolve => {
        let settled = false;
        const onCount = n => { if (settled) return; settled = true; clearTimeout(t); resolve(n); };
        const t = setTimeout(() => { if (settled) return; settled = true; socket.off('count', onCount); resolve(null); }, timeoutMs);
        socket.once('count', onCount);
        socket.emit('count', { db: MONGO_DB, collection, query });
    });
}
