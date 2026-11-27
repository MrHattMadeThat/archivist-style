// The task types. Each is make(task, ctx) -> {
//   docs       the papers on the desk for this task (the first one opens)
//   pointing   true while lines can be clicked as proof
//   rqWords    true while the research question's words can be clicked (readq)
//   word(i)    a word of the research question was clicked
//   card()     the work card on the right, rebuilt on every refresh
//   stamp()    the ink on the open paper, or null
//   solve()    the right answer (for testing: desk.solve() in the console)
//   point(key) optional: the task handles a click on a line itself (compare, sort) instead of the one proof box
//   selected   optional: the line(s) to underline, instead of the one proof box's line
//   hide       optional: label lines to show blank (catalogue: the student writes them)
// }
//
// The types: readq (read the question), stamp (primary or secondary), question (choose an answer), compare (find the
// same thing in two papers, then say whether they agree), sort (put lines into two bins, e.g. a claim you can check
// or an opinion), order (put events in order), catalogue (write a paper's blank label from what the paper says).
//
// Every card is built the same way (docs/WRITING_TASKS.md): numbered steps, one thing to do in each, and for proof
// steps WHERE TO LOOK and WHAT THE PROOF MUST SHOW. A wrong line never makes the card longer: its hint replaces the
// line in the proof box.
//
// Seals: gold = right first time, no hints; silver = got there with another try or a hint; red = the wrong stamp or
// answer first (the student still finds the proof before moving on).
import { el, button } from './dom.js';
import { paraOf } from './text.js';

const GENERIC = 'That line doesn’t prove it. Try the label at the top: who made it, and when?';
const MARK_HINT = { WHEN: 'Look for a year, or a time.', WHERE: 'Look for the name of a place.', WHO: 'Look for the people the question is about.' };
const MARK_ASK = { WHEN: 'WHEN', WHERE: 'WHERE', WHO: 'WHO it is about' };

function step(n, state, title, ...content) {
  const s = el('section', `step ${state}`);
  const head = el('div', 'step-head');
  head.append(el('span', 'step-n', state === 'done' ? '✓' : String(n)), el('h3', 'step-title', title));
  s.append(head);
  if (state !== 'later') for (const c of content) if (c) s.append(c);
  return s;
}

function message(st) {
  if (!st.msg) return null;
  const m = el('div', `msg ${st.tone || ''}`);
  for (const l of [].concat(st.msg)) m.append(el('p', null, l));
  return m;
}

// where to look / what the proof must show, printed or unlocked by the hint button
function guidance(t, st) {
  if (st.phase === 'done') return null;
  const out = el('div', 'guide');
  const showLook = t.guide === 'show' || st.hints >= 1 || st.phase === 'fix';
  const showShows = t.guide === 'show' || st.hints >= 2;
  if (showLook) { const p = el('p', 'g-look'); p.append(el('b', null, 'Where to look: '), t.look); out.append(p); }
  if (showShows) { const p = el('p', 'g-shows'); p.append(el('b', null, 'Your proof should show: '), t.shows); out.append(p); }
  return out.childElementCount ? out : null;
}

function proofSlot(ctx, st) {
  const slot = el('div', 'proof');
  const q = ctx.sel && ctx.quote(ctx.sel);
  if (q) {
    const b = el('blockquote', null, `“${q.text}”`);
    b.title = q.text;
    slot.append(el('div', 'proof-label', q.meta ? `Your proof · the label, ${q.meta.label}` : 'Your proof'), b);
    slot.classList.add('filled');
  } else {
    slot.append(el('div', 'proof-label', 'Your proof'));
    if (st.hint) slot.classList.add('hinted');
    slot.append(el('p', st.hint ? 'proof-hint' : 'proof-empty', st.hint || 'Click a line in the paper. It will appear here.'));
  }
  return slot;
}

function actions(t, ctx, st, { ready, why, onCheck, zoneRef }) {
  const row = el('div', 'actions');
  if (st.phase === 'done') return null;
  const moreHints = t.guide === 'hint' ? st.hints < 3 : st.hints < 1;
  if (st.phase !== 'choose' || st.pickedOnce) {
    const h = button('quiet hintbtn', st.hints === 0 ? 'Need a hint?' : 'Another hint');
    h.disabled = !moreHints;
    h.onclick = () => {
      st.hints++;
      // the last hint outlines the part of the paper where the proof is
      if ((t.guide === 'hint' && st.hints >= 3) || (t.guide !== 'hint' && st.hints >= 1)) {
        const key = ctx.resolve(zoneRef || t.proof[0]);
        if (key) ctx.setZone(key.split(/[@:]/)[0], paraOf(key) || 'label');
      }
      ctx.refresh();
    };
    row.append(h);
  }
  const go = button('go', st.phase === 'fix' ? 'Check my proof' : 'Check');
  go.disabled = !ready;
  go.title = ready ? '' : why;
  go.onclick = onCheck;
  row.append(go);
  return row;
}

const gradeOf = (st, t) => (st.wrongFirst != null ? 'red' : st.tries || (t.guide === 'hint' && st.hints) ? 'silver' : 'gold');

// ------------------------------------------------------------------ readq: read the research question first
function readq(t, ctx) {
  const marks = () => ctx.rq.marks;
  // pick up where the student left off: words already marked stay marked
  const st = { i: Math.max(0, marks().findIndex((m) => !ctx.markedTags().includes(m.tag))), phase: 'mark', msg: null, tone: null };
  function done() {
    st.phase = 'done';
    ctx.finish({ grade: 'gold' });
  }
  return {
    docs: [],
    pointing: false,
    get rqWords() { return st.phase !== 'done'; },
    word(markIndex) {
      if (st.phase === 'done') return;
      const want = marks()[st.i];
      if (markIndex === st.i) {
        ctx.markRq(want.tag);
        st.i++;
        st.msg = null;
        if (st.i >= marks().length) return done();
      } else if (markIndex >= 0) {
        st.msg = `Those words are the ${marks()[markIndex].tag}. First find the ${MARK_ASK[want.tag]}.`;
        st.tone = 'warn';
      } else {
        st.msg = `Not those words. ${MARK_HINT[want.tag]}`;
        st.tone = 'warn';
      }
      ctx.refresh();
    },
    card() {
      const c = el('div', 'task task-readq');
      c.append(el('p', 'lead', 'Before you sort anything, read your research question. It is pinned at the top of the desk.'));
      marks().forEach((m, i) => {
        const state = i < st.i || st.phase === 'done' ? 'done' : i === st.i ? 'now' : 'later';
        c.append(step(i + 1, state, `Click the words that say ${MARK_ASK[m.tag]}.`, state === 'now' ? el('p', 'small', '↑ Click them in the question at the top.') : null));
      });
      const m = message(st);
      if (m) c.append(m);
      if (st.phase === 'done') {
        const rule = el('div', 'rule-now');
        rule.append(el('p', 'rule-lead', 'So, for THIS question:'));
        const p = el('p', 'rule-p'); p.append(el('b', null, 'PRIMARY '), ctx.rq.primary); rule.append(p);
        const s = el('p', 'rule-s'); s.append(el('b', null, 'SECONDARY '), ctx.rq.secondary); rule.append(s);
        c.append(rule);
      }
      return c;
    },
    solve() { while (st.phase !== 'done') this.word(st.i); },
  };
}

// ------------------------------------------------------------------ stamp: primary or secondary, then proof
function stamp(t, ctx) {
  const st = { pick: null, phase: 'choose', tries: 0, hints: 0, wrongFirst: null, fresh: false };

  function check() {
    const hit = ctx.hits(ctx.sel, t.proof);
    if (st.phase === 'choose' && st.pick !== t.answer) {
      st.wrongFirst = st.pick;
      st.pick = t.answer;
      st.fresh = true;
      if (hit) return done('red', [t.wrong]);
      st.phase = 'fix';
      st.msg = `${t.wrong} Now find a line that proves it.`;
      st.tone = 'bad';
      st.hint = null;
      ctx.setSel(null, true);
      return ctx.refresh();
    }
    if (hit) return done(gradeOf(st, t), [t.right]);
    st.tries++;
    st.hint = ctx.nearHint(ctx.sel, t.near) || GENERIC;
    ctx.setSel(null);
  }

  function done(grade, msg) {
    st.phase = 'done';
    st.msg = msg;
    st.tone = grade === 'red' ? 'bad' : 'good';
    ctx.setZone(null);
    ctx.finish({ grade, mail: grade === 'red' ? t.mail : null, stamp: t.answer, first: st.wrongFirst });
  }

  return {
    docs: [t.doc],
    get pick() { return st.pick; },
    get pointing() { return st.phase !== 'done' && st.pick != null; },
    stamp: () => (st.pick ? { kind: st.pick, fresh: st.fresh && !(st.fresh = false) } : null),
    card() {
      const c = el('div', 'task task-stamp');
      const about = el('p', 'about');
      about.append('Your question is about: ', el('b', null, ctx.aboutLine()));
      const pads = el('div', 'pads');
      for (const k of ['primary', 'secondary']) {
        const b = button(`pad pad-${k}${st.pick === k ? ' on' : ''}${st.wrongFirst === k ? ' was-wrong' : ''}`);
        b.append(el('span', 'pad-name', k.toUpperCase()), el('span', 'pad-means', ctx.rq[k]));
        b.disabled = st.phase !== 'choose';
        b.setAttribute('aria-pressed', st.pick === k);
        b.onclick = () => { st.pick = k; st.pickedOnce = true; st.fresh = true; ctx.refresh(); };
        pads.append(b);
      }
      if (st.phase !== 'choose') {
        const got = el('p', `stamped-as ${t.answer}`);
        got.append(el('b', null, t.answer.toUpperCase()), ` for ${ctx.rq.short}`);
        if (st.wrongFirst) got.append(el('span', 'small', ` (you first chose ${st.wrongFirst})`));
        c.append(step(1, 'done', 'Your stamp', got));
      } else c.append(step(1, st.phase !== 'choose' ? 'done' : 'now', 'Is this paper primary or secondary for your question?', about, pads));
      const s2 = st.phase === 'done' ? 'done' : st.pick ? 'now' : 'later';
      c.append(step(2, s2, 'Prove it. Click the line in the paper that shows it.', guidance(t, st), proofSlot(ctx, st)));
      const a = actions(t, ctx, st, { ready: !!(st.pick && ctx.sel), why: st.pick ? 'Click a line in the paper first' : 'Choose a stamp first', onCheck: check });
      if (a) c.append(a);
      const m = message(st);
      if (m) c.append(m);
      return c;
    },
    solve() {
      if (st.phase === 'done') return;
      st.pick = t.answer;
      ctx.setSel(ctx.resolve(t.proof[0]), true);
      check();
    },
  };
}

// ------------------------------------------------------------------ question: pick an answer, then proof
function question(t, ctx) {
  const st = { pick: null, phase: 'choose', tries: 0, hints: 0, wrongFirst: null };
  const L = 'ABCD';

  function check() {
    const hit = ctx.hits(ctx.sel, t.proof);
    if (st.phase === 'choose' && st.pick !== t.answer) {
      st.wrongFirst = st.pick;
      st.pick = t.answer;
      if (hit) return done('red');
      st.phase = 'fix';
      st.msg = `Not quite. The right answer is ${L[t.answer]}, in green. Now find the line that proves it.`;
      st.tone = 'bad';
      st.hint = null;
      ctx.setSel(null, true);
      return ctx.refresh();
    }
    if (hit) return done(gradeOf(st, t));
    st.tries++;
    st.hint = ctx.nearHint(ctx.sel, t.near) || (st.phase === 'fix' ? 'Not that line. Keep looking.' : 'Good answer, but that line doesn’t prove it. Find one that does.');
    ctx.setSel(null);
  }

  function done(grade) {
    st.phase = 'done';
    st.msg = [t.right];
    st.tone = grade === 'red' ? 'bad' : 'good';
    ctx.setZone(null);
    ctx.finish({ grade, mail: grade === 'red' ? t.mail : null, first: st.wrongFirst });
  }

  return {
    docs: t.docs,
    get pick() { return st.pick; },
    get pointing() { return st.phase !== 'done' && st.pick != null; },
    card() {
      const c = el('div', 'task task-question');
      c.append(el('p', 'ask', t.ask));
      const opts = el('div', 'options');
      t.options.forEach((o, i) => {
        // once answered, only the right answer (and a wrong first pick) stay, so the card never has to scroll
        if (st.phase !== 'choose' && i !== t.answer && i !== st.wrongFirst) return;
        const b = button(`option${st.pick === i ? ' on' : ''}${st.phase !== 'choose' && i === t.answer ? ' right' : ''}${i === st.wrongFirst ? ' wrong' : ''}`);
        b.append(el('span', 'opt-letter', L[i]), el('span', null, o));
        b.disabled = st.phase !== 'choose';
        b.setAttribute('aria-pressed', st.pick === i);
        b.onclick = () => { st.pick = i; st.pickedOnce = true; ctx.refresh(); };
        opts.append(b);
      });
      c.append(step(1, st.pick != null && st.phase !== 'choose' ? 'done' : 'now', 'Choose your answer.', opts));
      const s2 = st.phase === 'done' ? 'done' : st.pick != null ? 'now' : 'later';
      c.append(step(2, s2, 'Prove it. Click the line in the papers that shows it.', guidance(t, st), proofSlot(ctx, st)));
      const a = actions(t, ctx, st, { ready: st.pick != null && !!ctx.sel, why: st.pick == null ? 'Choose an answer first' : 'Click a line in the paper first', onCheck: check });
      if (a) c.append(a);
      const m = message(st);
      if (m) c.append(m);
      return c;
    },
    solve() {
      if (st.phase === 'done') return;
      st.pick = t.answer;
      ctx.setSel(ctx.resolve(t.proof[0]), true);
      check();
    },
  };
}

// a proof box that belongs to one paper (compare: one box per paper)
function slotView(ctx, label, key, hint) {
  const slot = el('div', 'proof');
  const q = key && ctx.quote(key);
  slot.append(el('div', 'proof-label', label));
  if (q) {
    const b = el('blockquote', null, `“${q.text}”`);
    b.title = q.text;
    slot.append(b);
    slot.classList.add('filled');
  } else {
    if (hint) slot.classList.add('hinted');
    slot.append(el('p', hint ? 'proof-hint' : 'proof-empty', hint || 'Click a line in this paper.'));
  }
  return slot;
}

// answer buttons A–D; once answered, only the right one (and a wrong first pick) stay, so the card never scrolls
function optionList(t, st, L, onPick) {
  const opts = el('div', 'options');
  t.options.forEach((o, i) => {
    if (st.phase !== 'choose' && i !== t.answer && i !== st.wrongFirst) return;
    const b = button(`option${st.pick === i ? ' on' : ''}${st.phase !== 'choose' && i === t.answer ? ' right' : ''}${i === st.wrongFirst ? ' wrong' : ''}`);
    b.append(el('span', 'opt-letter', L[i]), el('span', null, o));
    b.disabled = st.phase !== 'choose';
    b.setAttribute('aria-pressed', st.pick === i);
    b.onclick = () => onPick(i);
    opts.append(b);
  });
  return opts;
}

const docOf = (key) => key && key.split(/[@:]/)[0];

// ------------------------------------------------------------------ compare: the same thing in two papers
// t.find = [{ doc, proof, near }, { doc, proof, near }]; then t.options / t.answer: do they agree?
function compare(t, ctx) {
  const ids = t.find.map((f) => f.doc);
  const st = { slot: {}, hint: {}, pick: null, phase: 'choose', tries: 0, hints: 0, wrongFirst: null };
  const L = 'ABCD';
  const ok = (f) => ctx.hits(st.slot[f.doc], f.proof);
  const miss = (f, fallback) => { st.hint[f.doc] = ctx.nearHint(st.slot[f.doc], f.near) || fallback; st.slot[f.doc] = null; };

  function check() {
    const bad = t.find.filter((f) => !ok(f));
    if (st.phase === 'choose' && st.pick !== t.answer) {
      st.wrongFirst = st.pick;
      st.pick = t.answer;
      if (!bad.length) return done('red');
      st.phase = 'fix';
      for (const f of bad) miss(f, 'Not that line. Keep looking.');
      st.msg = 'Not quite: the right answer is in green. Now find the proof.';
      st.tone = 'bad';
      return ctx.refresh();
    }
    if (!bad.length) return done(gradeOf(st, t));
    st.tries++;
    for (const f of bad) miss(f, 'That line doesn’t show it. Try another.');
    st.msg = bad.length === 2 ? 'Neither line shows it yet.' : `The line from ${ctx.whoOf(bad[0].doc)} doesn’t show it yet. The other one is right.`;
    st.tone = 'warn';
    ctx.show(bad[0].doc);
    ctx.refresh();
  }

  function done(grade) {
    st.phase = 'done';
    st.msg = [t.right];
    st.tone = grade === 'red' ? 'bad' : 'good';
    ctx.setZone(null);
    ctx.finish({ grade, mail: grade === 'red' ? t.mail : null, first: st.wrongFirst, proof: ids.map((d) => st.slot[d]) });
  }

  return {
    docs: ids,
    get pick() { return st.pick; },
    get pointing() { return st.phase !== 'done'; },
    get selected() { return ids.map((d) => st.slot[d]).filter(Boolean); },
    point(key) {
      const d = docOf(key);
      if (!ids.includes(d) || st.phase === 'done') return;
      st.slot[d] = key;
      st.hint[d] = null;
      st.msg = null;
      // on to the other paper once this one has a line
      const other = ids.find((x) => !st.slot[x]);
      if (other) ctx.show(other);
      ctx.refresh();
    },
    card() {
      const c = el('div', 'task task-compare');
      c.append(el('p', 'ask', t.ask));
      const g = guidance(t, st);
      if (g) c.append(g);
      // the two proof boxes side by side, one per paper: the card stays short enough not to scroll
      const all = ids.every((d) => st.slot[d]);
      const slots = el('div', 'slots');
      for (const f of t.find) slots.append(slotView(ctx, `${ctx.whoOf(f.doc)} says`, st.slot[f.doc], st.hint[f.doc]));
      c.append(step(1, st.phase === 'done' || all ? 'done' : 'now', `Find it in each paper: ${ids.map((d) => ctx.whoOf(d)).join(' and ')}.`, slots));
      const s3 = st.phase === 'done' ? 'done' : all || st.pick != null ? 'now' : 'later';
      c.append(step(2, s3, t.verdict || 'Put them side by side. What do you see?',
        optionList(t, st, L, (i) => { st.pick = i; st.pickedOnce = true; ctx.refresh(); })));
      const a = actions(t, ctx, st, {
        ready: all && st.pick != null, why: all ? 'Choose an answer first' : 'Find a line in each paper first', onCheck: check,
        zoneRef: (t.find.find((f) => !st.slot[f.doc]) || t.find[0]).proof[0],
      });
      if (a) c.append(a);
      const m = message(st);
      if (m) c.append(m);
      return c;
    },
    solve() {
      if (st.phase === 'done') return;
      for (const f of t.find) st.slot[f.doc] = ctx.resolve(f.proof[0]);
      st.pick = t.answer;
      check();
    },
  };
}

// ------------------------------------------------------------------ sort: lines into two bins
// t.bins = [{ id, name, means }, { ... }]; t.items = [{ ref, bin, why, text? }]. A wrong bin is put right at once,
// with why, so nobody is stuck guessing.
function sort(t, ctx) {
  const st = { placed: {}, wrong: new Set(), cur: null, mistakes: 0, phase: 'sort', msg: null, tone: null };
  const key = (i) => ctx.resolve(t.items[i].ref);
  const textOf = (i) => t.items[i].text || ctx.quote(key(i))?.text || '';
  const left = () => t.items.map((_, i) => i).filter((i) => st.placed[i] == null);
  const binName = (id) => t.bins.find((b) => b.id === id).name;

  function choose(i) {
    st.cur = i;
    st.msg = null;
    ctx.show(docOf(key(i)));
    ctx.refresh();
    ctx.reveal();
  }
  function put(bin) {
    const it = t.items[st.cur];
    st.placed[st.cur] = it.bin;
    if (it.bin === bin) { st.msg = [it.why]; st.tone = 'good'; }
    else { st.mistakes++; st.wrong.add(st.cur); st.msg = [`Not this time: it goes under ${binName(it.bin)}.`, it.why]; st.tone = 'bad'; }
    st.cur = null;
    if (!left().length) {
      st.phase = 'done';
      st.msg = [t.right];
      if (st.mistakes) st.tone = 'good';
      const grade = st.mistakes === 0 ? 'gold' : st.mistakes === 1 ? 'silver' : 'red';
      ctx.finish({ grade, mail: grade === 'red' ? t.mail : null, proof: null, sorted: { ...st.placed }, wrong: [...st.wrong] });
      return;
    }
    ctx.refresh();
  }

  return {
    docs: t.docs,
    get pointing() { return st.phase !== 'done'; },
    get selected() { return st.cur != null ? key(st.cur) : null; },
    point(k) {
      if (st.phase === 'done') return;
      const i = t.items.findIndex((_, j) => st.placed[j] == null && key(j) === k);
      if (i >= 0) return choose(i);
      st.msg = 'That line isn’t on your list. The lines to sort are on the card.';
      st.tone = 'warn';
      ctx.refresh();
    },
    card() {
      const c = el('div', 'task task-sort');
      c.append(el('p', 'ask', t.ask));
      const n = Object.keys(st.placed).length;
      if (st.phase !== 'done') {
        const list = el('div', 'sortitems');
        for (const i of left()) {
          const b = button(`sortitem${st.cur === i ? ' on' : ''}`, `“${textOf(i)}”`);
          b.setAttribute('aria-pressed', st.cur === i);
          b.onclick = () => choose(i);
          list.append(b);
        }
        c.append(step(1, st.cur != null ? 'done' : 'now', `Click a line to sort. (${n} of ${t.items.length} done)`, list));
        const pads = el('div', 'pads');
        t.bins.forEach((bn, j) => {
          const b = button(`pad pad-${j ? 'b' : 'a'}`);
          b.append(el('span', 'pad-name', bn.name), el('span', 'pad-means', bn.means));
          b.disabled = st.cur == null;
          b.onclick = () => put(bn.id);
          pads.append(b);
        });
        c.append(step(2, st.cur != null ? 'now' : 'later', 'Where does it go?', pads));
      }
      // what is sorted so far, small
      if (n) {
        const tally = el('div', 'tally');
        t.bins.forEach((bn, j) => {
          const col = el('div', `tally-col tally-${j ? 'b' : 'a'}`);
          col.append(el('b', null, bn.name));
          t.items.forEach((_, i) => { if (st.placed[i] === bn.id) col.append(el('span', `tally-item${st.wrong.has(i) ? ' fixed' : ''}`, textOf(i))); });
          tally.append(col);
        });
        c.append(tally);
      }
      const m = message(st);
      if (m) c.append(m);
      return c;
    },
    solve() { while (left().length) { st.cur = left()[0]; put(t.items[st.cur].bin); } },
  };
}

// ------------------------------------------------------------------ order: events, earliest first
// t.items in the right order: [{ text, when }]; t.shuffle: the order they are shown in. The dates show once placed.
function order(t, ctx) {
  const st = { n: 0, mistakes: 0, run: 0, phase: 'order', msg: null, tone: null };
  const shown = t.shuffle || t.items.map((_, i) => i);
  function pick(i) {
    if (st.phase === 'done') return;
    if (i === st.n) {
      st.n++;
      st.run = 0;
      st.msg = null;
      if (st.n === t.items.length) {
        st.phase = 'done';
        st.msg = [t.right];
        st.tone = 'good';
        const grade = st.mistakes === 0 ? 'gold' : st.mistakes <= 2 ? 'silver' : 'red';
        ctx.finish({ grade, mail: grade === 'red' ? t.mail : null, proof: null });
        return;
      }
    } else {
      st.mistakes++;
      st.run++;
      st.msg = st.run >= 2 && t.look ? `Not yet. ${t.look}` : 'Not yet: something else on the list happened before that.';
      st.tone = 'warn';
    }
    ctx.refresh();
  }
  return {
    docs: t.docs || [],
    pointing: false,
    card() {
      const c = el('div', 'task task-order');
      c.append(el('p', 'ask', t.ask));
      if (st.n) {
        const ol = el('ol', 'ordered');
        for (let k = 0; k < st.n; k++) {
          const li = el('li');
          if (t.items[k].when) li.append(el('b', 'when', t.items[k].when));
          li.append(el('span', null, t.items[k].text));
          ol.append(li);
        }
        c.append(ol);
      }
      if (st.phase !== 'done') {
        const rest = el('div', 'orderitems');
        for (const i of shown) {
          if (i < st.n) continue;
          const b = button('orderitem', t.items[i].text);
          b.onclick = () => pick(i);
          rest.append(b);
        }
        c.append(step(st.n + 1, 'now', st.n ? 'What happened next? Click it.' : 'What happened first? Click it.', rest));
      }
      const m = message(st);
      if (m) c.append(m);
      return c;
    },
    solve() { while (st.phase !== 'done') pick(st.n); },
  };
}

// ------------------------------------------------------------------ catalogue: write the paper's blank label
// t.doc; t.fields = [{ k: 'by' | 'when', ask, options, answer, proof, near, look, shows, right }], one at a time.
// The label lines being written are blank on the paper, so the proof has to come from what the paper itself says.
function catalogue(t, ctx) {
  const L = 'ABCD';
  const NAME = { by: 'MADE BY', when: 'WHEN', what: 'WHAT IT IS' };
  const st = { f: 0, pick: null, phase: 'choose', tries: 0, hints: 0, wrongFirst: null, grades: [], proofs: [], firsts: [] };
  const F = () => t.fields[st.f];
  const fieldT = () => ({ guide: t.guide, ...F() });

  function check() {
    const f = F();
    const hit = ctx.hits(ctx.sel, f.proof);
    if (st.phase === 'choose' && st.pick !== f.answer) {
      st.wrongFirst = st.pick;
      st.pick = f.answer;
      if (hit) return fieldDone('red');
      st.phase = 'fix';
      st.msg = `Not quite. The right answer is ${L[f.answer]}, in green. Now find the line in the paper that proves it.`;
      st.tone = 'bad';
      st.hint = null;
      ctx.setSel(null, true);
      return ctx.refresh();
    }
    if (hit) return fieldDone(gradeOf(st, fieldT()));
    st.tries++;
    st.hint = ctx.nearHint(ctx.sel, f.near) || 'That line doesn’t prove it. Read the paper again.';
    ctx.setSel(null);
  }

  function fieldDone(grade) {
    st.grades.push(grade);
    st.proofs.push(ctx.sel);
    st.firsts.push(st.wrongFirst);
    const said = [F().right];
    ctx.setZone(null);
    st.f++;
    Object.assign(st, { pick: null, phase: 'choose', tries: 0, hints: 0, wrongFirst: null, hint: null, pickedOnce: false });
    st.msg = said;
    st.tone = grade === 'red' ? 'bad' : 'good';
    if (st.f >= t.fields.length) {
      st.phase = 'done';
      st.msg = [...said, t.right];
      const grade2 = st.grades.includes('red') ? 'red' : st.grades.includes('silver') ? 'silver' : 'gold';
      ctx.finish({ grade: grade2, mail: grade2 === 'red' ? t.mail : null, proof: st.proofs, firsts: st.firsts });
      return;
    }
    ctx.setSel(null);
  }

  return {
    docs: [t.doc],
    get pick() { return st.pick; },
    get pointing() { return st.phase !== 'done' && (st.pick != null || st.phase === 'fix'); },
    get hide() { return st.phase === 'done' ? [] : t.fields.slice(st.f).map((f) => f.k); },
    card() {
      const c = el('div', 'task task-catalogue');
      c.append(el('p', 'ask', t.ask));
      t.fields.forEach((f, i) => {
        const name = NAME[f.k] || f.k.toUpperCase();
        if (i < st.f || st.phase === 'done') {
          const got = el('p', 'filled-line');
          got.append(el('b', null, `${name}  `), f.options[f.answer]);
          c.append(step(i + 1, 'done', `The label, line ${name}`, got));
        } else if (i > st.f) c.append(step(i + 1, 'later', f.ask));
        else {
          const opts = optionList(f, st, L, (j) => { st.pick = j; st.pickedOnce = true; st.msg = null; ctx.refresh(); });
          const box = (st.pick != null || st.phase === 'fix') ? [guidance(fieldT(), st), proofSlot(ctx, st)] : [];
          c.append(step(i + 1, 'now', f.ask, opts, ...box));
          const a = actions(fieldT(), ctx, st, { ready: st.pick != null && !!ctx.sel, why: st.pick == null ? 'Choose an answer first' : 'Click a line in the paper first', onCheck: check });
          if (a) c.append(a);
        }
      });
      const m = message(st);
      if (m) c.append(m);
      return c;
    },
    solve() {
      while (st.phase !== 'done') { st.pick = F().answer; ctx.setSel(ctx.resolve(F().proof[0]), true); check(); }
    },
  };
}

export const TASKS = { readq, stamp, question, compare, sort, order, catalogue };

// The papers a task uses, whatever its type: everything here goes back to the stacks when the case is done.
export const papersOf = (t) => t.docs || (t.find ? t.find.map((f) => f.doc) : t.doc ? [t.doc] : []);
