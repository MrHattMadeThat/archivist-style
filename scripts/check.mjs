// Checks the source desk's content: every proof ref finds exactly one line, every paper and box exists, every
// research question contains the words students must click. Run after any content edit: node scripts/check.mjs
import { SOURCES, BOXES, SHELVES } from '../js/desk/sources.js';
import { CASES } from '../js/desk/cases.js';
import { prepareAll, matches } from '../js/desk/text.js';

const docs = prepareAll(SOURCES);
const errs = [];
const err = (where, msg) => errs.push(`${where}: ${msg}`);

for (const [id, s] of Object.entries(SOURCES)) {
  if (!BOXES[s.box]) err(id, `box "${s.box}" is not in BOXES`);
  for (const k of ['by', 'when', 'what']) if (!s.meta?.[k]) err(id, `label has no "${k}" line`);
  if (!s.credit) err(id, 'no credit');
}
for (const id of Object.keys(BOXES)) if (!SHELVES.some((sh) => sh.boxes.includes(id))) err(id, 'box is on no shelf');
for (const sh of SHELVES) {
  const [a, b] = sh.name.split('–').map((x) => x.trim());
  for (const id of sh.boxes) { const c = BOXES[id].maker[0]; if (c < a || c > b) err(`shelf ${sh.name}`, `${BOXES[id].maker} is filed out of order`); }
}

const one = (where, ref) => {
  const n = matches(docs, ref).length;
  if (n !== 1) err(where, `ref "${ref}" finds ${n} lines (needs exactly 1)`);
};
for (const c of CASES) {
  let rq = c.rq;
  const used = new Set();
  c.tasks.forEach((t, i) => {
    const w = `${c.id} task ${i + 1} (${t.type})`;
    if (t.rq) rq = t.rq;
    for (const m of rq.marks) if (!rq.text.includes(m.words)) err(w, `research question has no "${m.words}"`);
    if (!rq.short || !rq.primary || !rq.secondary) err(w, 'research question needs short, primary and secondary');
    if (t.type === 'readq') return;
    const ds = t.docs || (t.find ? t.find.map((f) => f.doc) : [t.doc]);
    for (const d of ds) { if (!SOURCES[d]) err(w, `no paper "${d}"`); used.add(d); }
    if (t.ask && t.ask.split(/\s+/).length > 25) err(w, `the question is ${t.ask.split(/\s+/).length} words (keep it to 25)`);
    const opts = (x) => {
      if (!(x.answer >= 0 && x.answer < x.options.length)) err(w, 'answer is not one of the options');
      if (x.options.length > 4) err(w, 'more than 4 options will make the card scroll');
      for (const o of x.options) if (o.split(/\s+/).length > 12) err(w, `option "${o}" is over 12 words`);
    };
    const refs = (x, docsOk) => {
      if (!x.proof?.length) err(w, 'no proof refs');
      for (const r of x.proof || []) { one(w, r); if (!docsOk.includes(r.split(/[@#]/)[0])) err(w, `proof "${r}" is not in this task's papers`); }
      for (const r of Object.keys(x.near || {})) { one(w, r); if ((x.proof || []).includes(r)) err(w, `"${r}" is both proof and near`); }
    };
    if (t.type === 'compare') {
      for (const k of ['ask', 'look', 'shows', 'right']) if (!t[k]) err(w, `missing "${k}"`);
      if (!['show', 'hint'].includes(t.guide)) err(w, 'guide must be "show" or "hint"');
      if (t.find?.length !== 2) err(w, 'compare needs exactly two papers in find');
      for (const f of t.find || []) refs(f, [f.doc]);
      opts(t);
      return;
    }
    if (t.type === 'sort') {
      if (!t.ask || !t.right) err(w, 'sort needs ask and right');
      if (t.bins?.length !== 2) err(w, 'sort needs exactly two bins');
      for (const it of t.items || []) {
        one(w, it.ref);
        if (!ds.includes(it.ref.split(/[@#]/)[0])) err(w, `item "${it.ref}" is not in this task's papers`);
        if (!t.bins.some((b) => b.id === it.bin)) err(w, `item "${it.ref}" has no bin "${it.bin}"`);
        if (!it.why) err(w, `item "${it.ref}" needs a why`);
      }
      if ((t.items || []).length > 6) err(w, 'more than 6 lines to sort will make the card scroll');
      return;
    }
    if (t.type === 'order') {
      if (!t.ask || !t.right) err(w, 'order needs ask and right');
      const n = (t.items || []).length;
      if (n < 3 || n > 6) err(w, 'order needs 3 to 6 items');
      if (t.shuffle && [...t.shuffle].sort().join() !== [...Array(n).keys()].join()) err(w, 'shuffle must list every item once');
      if (t.shuffle && t.shuffle.every((x, i) => x === i)) err(w, 'shuffle shows the items in the right order already');
      return;
    }
    if (t.type === 'catalogue') {
      if (!t.ask || !t.right) err(w, 'catalogue needs ask and right');
      for (const f of t.fields || []) {
        if (!SOURCES[t.doc]?.meta?.[f.k]) err(w, `field "${f.k}" is not a label line of ${t.doc}`);
        for (const k of ['ask', 'look', 'shows', 'right']) if (!f[k]) err(w, `field ${f.k} is missing "${k}"`);
        opts(f);
        refs(f, [t.doc]);
        for (const r of f.proof || []) if (r.includes('@')) err(w, `field ${f.k}: proof "${r}" is a label line, but the label is blank`);
      }
      return;
    }
    for (const k of ['look', 'shows', 'right']) if (!t[k]) err(w, `missing "${k}" (see docs/WRITING_TASKS.md)`);
    if (!['show', 'hint'].includes(t.guide)) err(w, 'guide must be "show" or "hint"');
    if (!t.proof?.length) err(w, 'no proof refs');
    for (const r of t.proof || []) { one(w, r); if (!ds.includes(r.split(/[@#]/)[0])) err(w, `proof "${r}" is not in this task's papers`); }
    for (const r of Object.keys(t.near || {})) { one(w, r); if ((t.proof || []).includes(r)) err(w, `"${r}" is both proof and near`); }
    if (t.type === 'stamp') {
      if (!['primary', 'secondary'].includes(t.answer)) err(w, 'answer must be primary or secondary');
      if (!t.wrong) err(w, 'missing "wrong"');
    }
    if (t.type === 'question') opts(t);
  });
  for (const b of c.fetch || []) if (!BOXES[b]) err(c.id, `fetch box "${b}" is not in BOXES`);
  // variety: no case should be one task type over and over (the class's first complaint)
  const kinds = c.tasks.filter((t) => t.type !== 'readq').map((t) => t.type);
  for (let i = 2; i < kinds.length; i++) if (kinds[i] === kinds[i - 1] && kinds[i] === kinds[i - 2]) err(c.id, `three "${kinds[i]}" tasks in a row`);
  if (c.fetch) for (const d of used) if (!c.fetch.includes(SOURCES[d].box)) err(c.id, `uses "${d}" but doesn't fetch its box "${SOURCES[d].box}"`);
}

if (errs.length) { console.log(errs.join('\n')); console.log(`\n${errs.length} problem(s).`); process.exit(1); }
console.log(`OK: ${Object.keys(SOURCES).length} papers, ${CASES.length} cases, ${CASES.reduce((n, c) => n + c.tasks.length, 0)} tasks.`);
