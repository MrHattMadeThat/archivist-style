// The task types. Each is make(task, ctx) -> {
//   docs       the papers on the desk for this task (the first one opens)
//   pointing   true while lines can be clicked as proof
//   rqWords    true while the research question's words can be clicked (readq)
//   word(i)    a word of the research question was clicked
//   card()     the work card on the right, rebuilt on every refresh
//   stamp()    the ink on the open paper, or null
//   solve()    the right answer (for testing: desk.solve() in the console)
// }
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

function actions(t, ctx, st, { ready, why, onCheck }) {
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
        const key = ctx.resolve(t.proof[0]);
        ctx.setZone(key.split(/[@:]/)[0], paraOf(key) || 'label');
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
  const st = { i: 0, phase: 'mark', msg: null, tone: null };
  const marks = () => ctx.rq.marks;
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
    ctx.finish({ grade, mail: grade === 'red' ? t.mail : null, stamp: t.answer });
  }

  return {
    docs: [t.doc],
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
    ctx.finish({ grade, mail: grade === 'red' ? t.mail : null });
  }

  return {
    docs: t.docs,
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

export const TASKS = { readq, stamp, question };
