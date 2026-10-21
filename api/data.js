// Shared store for the Vercel version: one Postgres row per document, plus a revision counter.
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);
const COLS = ['players', 'matches', 'sessions'];
const ID = /^[A-Za-z0-9_\-.]{1,80}$/;

let ready = null;
function init() {
  ready = ready || (async () => {
    await sql`create table if not exists mfa_docs (col text not null, id text not null, data jsonb not null, primary key (col, id))`;
    await sql`create table if not exists mfa_rev (k int primary key, v bigint not null)`;
    await sql`insert into mfa_rev (k, v) values (1, 0) on conflict (k) do nothing`;
  })().catch(e => { ready = null; throw e; });
  return ready;
}

const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
// Deep merge where null removes the field, like the claude.ai database updates the page sends.
function merge(a, b) {
  for (const k of Object.keys(b)) {
    const v = b[k];
    if (v === null) delete a[k];
    else if (isObj(v)) a[k] = merge(isObj(a[k]) ? a[k] : {}, v);
    else a[k] = v;
  }
  return a;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    await init();
    if (req.method === 'GET') {
      const rev = Number((await sql`select v from mfa_rev where k = 1`)[0].v);
      if (String(rev) === String(req.query.rev)) return res.status(200).json({ rev, same: true });
      const out = { rev, players: {}, matches: {}, sessions: {} };
      for (const r of await sql`select col, id, data from mfa_docs`) if (out[r.col]) out[r.col][r.id] = r.data;
      return res.status(200).json(out);
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

    const code = process.env.COACH_CODE;
    if (code && req.headers['x-coach-code'] !== code) return res.status(401).json({ error: 'code' });

    const { op, col, id, data } = req.body || {};
    if (!COLS.includes(col) || !ID.test(id || '')) return res.status(400).json({ error: 'path' });
    if (op === 'delete') await sql`delete from mfa_docs where col = ${col} and id = ${id}`;
    else if (op === 'set' || op === 'update') {
      if (!isObj(data)) return res.status(400).json({ error: 'data' });
      let cur = {};
      if (op === 'update') {
        const r = await sql`select data from mfa_docs where col = ${col} and id = ${id}`;
        if (r.length) cur = r[0].data;
      }
      const doc = JSON.stringify(merge(cur, data));
      await sql`insert into mfa_docs (col, id, data) values (${col}, ${id}, ${doc}::jsonb)
        on conflict (col, id) do update set data = excluded.data`;
    } else return res.status(400).json({ error: 'op' });
    const rev = Number((await sql`update mfa_rev set v = v + 1 where k = 1 returning v`)[0].v);
    return res.status(200).json({ ok: true, rev });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server' });
  }
};
