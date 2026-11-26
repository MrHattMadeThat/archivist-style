// Turns sources into lines a student can point at. Pure functions: scripts/check.mjs uses them too.
// Ported from ../archive-desk/src/engine/text.js, without the notebook words (one click = one meaning on this desk).
//
// A task names a line with a REF:
//   'doc#some words'   the one sentence of `doc`'s easy words that contains "some words" (case-insensitive)
//   'doc@by'           one line of the paper's label (by, when, what, words)

const ABBR = ['U.S.', 'St.', 'Dr.', 'Mme.', 'Mr.', 'Ms.', 'Mrs.', 'W. F.', 'M.A.', 'Ph.D.'];

export const META = [
  ['by', 'Made by'],
  ['when', 'When'],
  ['what', 'What it is'],
  ['words', 'Words'],
];

export function sentences(par) {
  let s = par;
  ABBR.forEach((a, i) => { s = s.split(a).join(`\u0000${i}\u0000`); });
  return s.split(/(?<=[.!?”])\s+(?=[“"‘(A-Z0-9À-Ý])/).map((p) => p.replace(/\u0000(\d+)\u0000/g, (_, i) => ABBR[+i]));
}

// One source, ready to draw: label lines and easy-words sentences, each with a key the desk can point at.
export function prepare(id, src) {
  const meta = META.filter(([k]) => src.meta?.[k]).map(([k, label]) => ({ k, label, key: `${id}@${k}`, text: src.meta[k] }));
  const paras = (src.body || []).map((par, pi) => sentences(par).map((text, si) => ({ key: `${id}:${pi}.${si}`, text })));
  return { id, src, meta, paras };
}

export function prepareAll(sources) {
  const out = {};
  for (const [id, src] of Object.entries(sources)) out[id] = prepare(id, src);
  return out;
}

// Every line key a ref matches (the check script insists on exactly one).
export function matches(docs, ref) {
  const at = ref.indexOf('@'), hash = ref.indexOf('#');
  if (at > 0 && (hash < 0 || at < hash)) {
    const d = docs[ref.slice(0, at)];
    const m = d?.meta.find((x) => x.k === ref.slice(at + 1));
    return m ? [m.key] : [];
  }
  if (hash > 0) {
    const d = docs[ref.slice(0, hash)];
    if (!d) return [];
    const want = ref.slice(hash + 1).toLowerCase();
    return d.paras.flat().filter((s) => s.text.toLowerCase().includes(want)).map((s) => s.key);
  }
  return [];
}

// Where a key lives: { doc, text, meta }.
export function lookup(docs, key) {
  const id = key.split(/[@:]/)[0];
  const d = docs[id];
  if (!d) return null;
  const span = d.meta.find((m) => m.key === key) || d.paras.flat().find((s) => s.key === key);
  return span ? { doc: d, text: span.text, meta: d.meta.includes(span) ? span : null } : null;
}

// Which paragraph (1-based) a key is in, or 0 for the label. Used by the third hint.
export const paraOf = (key) => (key.includes('@') ? 0 : Number(key.split(':')[1].split('.')[0]) + 1);
