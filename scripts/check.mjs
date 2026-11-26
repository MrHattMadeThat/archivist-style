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
    const ds = t.docs || [t.doc];
    for (const d of ds) { if (!SOURCES[d]) err(w, `no paper "${d}"`); used.add(d); }
    for (const k of ['look', 'shows', 'right']) if (!t[k]) err(w, `missing "${k}" (see docs/WRITING_TASKS.md)`);
    if (!['show', 'hint'].includes(t.guide)) err(w, 'guide must be "show" or "hint"');
    if (!t.proof?.length) err(w, 'no proof refs');
    for (const r of t.proof || []) { one(w, r); if (!ds.includes(r.split(/[@#]/)[0])) err(w, `proof "${r}" is not in this task's papers`); }
    for (const r of Object.keys(t.near || {})) { one(w, r); if ((t.proof || []).includes(r)) err(w, `"${r}" is both proof and near`); }
    if (t.type === 'stamp') {
      if (!['primary', 'secondary'].includes(t.answer)) err(w, 'answer must be primary or secondary');
      if (!t.wrong) err(w, 'missing "wrong"');
    }
    if (t.type === 'question') {
      if (!(t.answer >= 0 && t.answer < t.options.length)) err(w, 'answer is not one of the options');
      if (t.options.length > 4) err(w, 'more than 4 options will make the card scroll');
    }
    if (t.ask && t.ask.split(/\s+/).length > 25) err(w, `the question is ${t.ask.split(/\s+/).length} words (keep it to 25)`);
  });
  for (const b of c.fetch || []) if (!BOXES[b]) err(c.id, `fetch box "${b}" is not in BOXES`);
  if (c.fetch) for (const d of used) if (!c.fetch.includes(SOURCES[d].box)) err(c.id, `uses "${d}" but doesn't fetch its box "${SOURCES[d].box}"`);
}

if (errs.length) { console.log(errs.join('\n')); console.log(`\n${errs.length} problem(s).`); process.exit(1); }
console.log(`OK: ${Object.keys(SOURCES).length} papers, ${CASES.length} cases, ${CASES.reduce((n, c) => n + c.tasks.length, 0)} tasks.`);
