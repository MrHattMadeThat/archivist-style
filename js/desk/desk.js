// The source desk: plays one case, task by task. Rewritten from ../archive-desk/src/engine/game.js for the 1910 office.
//
//   ┌ top: YOUR RESEARCH QUESTION (always pinned) · case and progress · Leave the desk ┐
//   │ left: papers on the desk │ centre: the open paper │ right: the work card (numbered steps) │
//   └──────────────────────────────────────────────────────────────────────────────────────────┘
//
// The research question is the first thing on the desk and never leaves it: a paper can't be sorted until you know
// the question. Each case starts by reading it (task type `readq`), and every stamp says which question it is for.
//
// Console while the desk is open: desk.solve() answers the current task, desk.next() moves on, desk.state.
import { el, button } from './dom.js';
import { renderDoc } from './doc.js';
import { TASKS } from './tasks.js';
import { prepareAll, matches, lookup } from './text.js';

const SEAL = { gold: 'Proven first time', silver: 'Proven, with help', red: 'Fixed' };

export function openDesk(root, { theCase: C, sources, save, persist, onLeave, onComplete }) {
  const docs = prepareAll(sources);
  if (!save.results) Object.assign(save, { task: 0, results: {}, marked: {}, introSeen: false });

  let task = null, shown = null, sel = null, zone = null;
  const versions = {};
  const t = () => C.tasks[save.task];
  const rqAt = (i) => { let q = C.rq; for (let k = 0; k <= i; k++) if (C.tasks[k]?.rq) q = C.tasks[k].rq; return q; };
  const rq = () => rqAt(save.task);
  const caseDocs = [...new Set(C.tasks.flatMap((x) => x.docs || (x.doc ? [x.doc] : [])))];

  // ------------------------------------------------------------------ layout
  const desk = el('div', 'desk');
  desk.setAttribute('role', 'dialog');
  desk.setAttribute('aria-label', `Your desk: ${C.title}`);
  const top = el('header', 'desk-top');
  const rqCard = el('div', 'rqcard');
  const meta = el('div', 'desk-meta');
  const leave = button('leave', 'Leave the desk');
  leave.title = 'Your place is saved';
  leave.onclick = () => close(false);
  top.append(rqCard, meta, leave);
  const main = el('div', 'desk-main');
  const pile = el('aside', 'pile');
  const paper = el('main', 'paperarea');
  const work = el('aside', 'work');
  main.append(pile, paper, work);
  const modal = el('div', 'desk-modal');
  modal.hidden = true;
  desk.append(top, main, modal);
  root.append(desk);

  // ------------------------------------------------------------------ context for the tasks
  const ctx = {
    docs,
    get rq() { return rq(); },
    get sel() { return sel; },
    setSel(key, silent) { sel = key; if (key) { const id = lookup(docs, key)?.doc.id; if (id) shown = id; } if (!silent) refresh(); },
    resolve: (ref) => matches(docs, ref)[0] || null,
    hits: (key, refs) => !!key && refs.some((r) => matches(docs, r).includes(key)),
    nearHint(key, near) {
      for (const [ref, hint] of Object.entries(near || {})) if (matches(docs, ref).includes(key)) return hint;
      return null;
    },
    quote: (key) => lookup(docs, key),
    setZone(docId, z) { zone = docId ? { doc: docId, z } : null; if (docId) shown = docId; },
    markRq(tag) { const k = rq().text; save.marked[k] = [...new Set([...(save.marked[k] || []), tag])]; persist(); },
    aboutLine: () => rq().marks.map((m) => m.words).join(' · '),
    finish(result) {
      save.results[save.task] = result;
      persist();
      refresh();
      work.querySelector('.next')?.focus({ preventScroll: true });
    },
    refresh: () => refresh(),
  };

  // ------------------------------------------------------------------ the research question, pinned to the desk
  function renderRq() {
    const q = rq();
    const marked = new Set(save.marked[q.text] || []);
    rqCard.replaceChildren();
    const changed = save.task > 0 && rqAt(save.task - 1) !== q;
    const tag = el('div', 'rq-tag');
    tag.append('Your research question');
    if (changed && !result()) tag.append(el('span', 'rq-new', 'New question!'));
    const text = el('p', 'rq-text');
    // split the question into plain words and the marked phrases (WHEN, WHERE, WHO)
    const spans = q.marks.map((m, i) => ({ i, m, at: q.text.indexOf(m.words) })).filter((s) => s.at >= 0).sort((a, b) => a.at - b.at);
    let pos = 0;
    const clickable = task?.rqWords;
    const word = (w, markIndex) => {
      if (!clickable || !w.trim()) return document.createTextNode(w);
      const b = button('rq-word', w);
      b.onclick = () => task.word(markIndex);
      return b;
    };
    const words = (s, markIndex, into) => s.split(/(\s+)/).forEach((w) => w && into.append(word(w, markIndex)));
    for (const s of spans) {
      words(q.text.slice(pos, s.at), -1, text);
      const m = el('span', `rq-mark${marked.has(s.m.tag) ? ' marked' : ''}`);
      m.dataset.tag = s.m.tag;
      words(s.m.words, s.i, m);
      text.append(m);
      pos = s.at + s.m.words.length;
    }
    words(q.text.slice(pos), -1, text);
    rqCard.classList.toggle('clicking', !!clickable);
    rqCard.append(tag, text);
  }

  // ------------------------------------------------------------------ render
  const result = (i = save.task) => save.results[i];
  const kindOf = (x) => (x.type === 'readq' ? 'Read the question' : x.type === 'stamp' ? 'Sort a paper' : 'Answer a question');

  function renderMeta() {
    meta.replaceChildren(el('div', 'case-title', C.title));
    const pips = el('div', 'pips');
    C.tasks.forEach((x, i) => {
      const r = result(i);
      const p = el('span', `pip${x.type === 'readq' ? ' q' : ''}${r ? ` ${r.grade}` : ''}${i === save.task ? ' now' : ''}`);
      p.title = `${kindOf(x)}${r ? ` · ${SEAL[r.grade]}` : i === save.task ? ' · now' : ''}`;
      pips.append(p);
    });
    meta.append(pips);
  }

  const whoOf = (id) => docs[id].src.meta.by.split(',')[0];
  function stampOn(id) {
    // the latest stamp this case gave the paper, with the question it was for
    for (let i = C.tasks.length - 1; i >= 0; i--) {
      const x = C.tasks[i];
      if (x.type === 'stamp' && x.doc === id && result(i)?.stamp && i !== save.task) return { kind: result(i).stamp, q: rqAt(i).short };
    }
    return null;
  }

  function renderPile() {
    pile.replaceChildren();
    const now = task.docs;
    const add = (id, list) => {
      const d = docs[id];
      const b = button(`pilebtn look-${d.src.look}${shown === id ? ' on' : ''}${now.includes(id) ? ' now' : ''}`);
      b.append(el('span', 'pile-title', d.src.title), el('span', 'pile-who', whoOf(id)));
      const s = stampOn(id);
      if (s) b.append(el('span', `pile-stamp ${s.kind}`, `${s.kind === 'primary' ? 'P' : 'S'} · ${s.q}`));
      b.onclick = () => { shown = id; refresh(); paper.scrollTop = 0; };
      list.append(b);
    };
    if (now.length) {
      pile.append(el('h3', null, now.length > 1 ? 'Papers for this question' : 'This paper'));
      const l = el('div', 'pilelist');
      now.forEach((id) => add(id, l));
      pile.append(l);
    }
    const rest = caseDocs.filter((id) => !now.includes(id) && C.tasks.findIndex((x) => (x.docs || [x.doc]).includes(id)) < save.task);
    if (rest.length) {
      pile.append(el('h3', null, 'Already sorted'));
      const l = el('div', 'pilelist done');
      rest.forEach((id) => add(id, l));
      pile.append(l);
    }
    if (!now.length && !rest.length) pile.append(el('p', 'pile-empty', 'The papers wait under the paperweight until you have read the question.'));
  }

  function renderPaper() {
    const keep = paper.scrollTop;
    const same = paper.dataset.doc === shown;
    paper.replaceChildren();
    paper.dataset.doc = shown || '';
    if (!shown) {
      const blank = el('div', 'blotter');
      if (result()) blank.append(el('p', null, 'Now you know what to look for.'), el('p', 'small', 'Click Next → and the papers come out from under the paperweight.'));
      else blank.append(el('p', null, 'Read your research question first.'), el('p', 'small', 'It is pinned at the top of the desk. ↑'));
      paper.append(blank);
      return;
    }
    const onTask = task.docs.includes(shown);
    if (onTask && task.docs.length > 1) {
      const row = el('div', 'doctabs');
      row.setAttribute('role', 'tablist');
      const proofDoc = sel && lookup(docs, sel)?.doc.id;
      for (const id of task.docs) {
        const b = button(`doctab${id === shown ? ' on' : ''}${id === proofDoc ? ' has-proof' : ''}`);
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', id === shown);
        b.append(el('span', 'doctab-who', whoOf(id)), el('span', 'doctab-title', docs[id].src.title));
        if (id === proofDoc) b.title = 'Your proof is in this one';
        b.onclick = () => { shown = id; refresh(); paper.scrollTop = 0; };
        row.append(b);
      }
      paper.append(row);
    } else if (!onTask) {
      const back = button('backbtn', '← Back to the paper you are working on');
      back.onclick = () => { shown = task.docs[0] || null; refresh(); };
      paper.append(el('p', 'readonly', 'You can read this paper, but your proof must come from the papers for this question.'), back);
    }
    const s = onTask && task.stamp ? task.stamp() : null;
    paper.append(renderDoc(docs[shown], {
      version: versions[shown],
      pointing: onTask && task.pointing,
      selected: sel,
      zone: zone && zone.doc === shown ? zone.z : null,
      stamp: s ? { ...s, q: rq().short } : stampOn(shown),
      onPoint: (key) => ctx.setSel(key),
      onVersion: (v) => { versions[shown] = v; renderPaper(); },
    }));
    if (same) paper.scrollTop = keep;
  }

  function renderWork() {
    work.replaceChildren();
    const n = C.tasks.slice(0, save.task + 1).filter((x) => x.type === t().type).length;
    const of = C.tasks.filter((x) => x.type === t().type).length;
    const kicker = el('div', 'work-kicker');
    kicker.append(el('span', null, kindOf(t())), el('span', null, of > 1 ? `${n} of ${of}` : ''));
    work.append(kicker, task.card());
    const r = result();
    if (r) {
      if (t().type !== 'readq') {
        const seal = el('div', `seal ${r.grade}`);
        seal.append(el('span', 'seal-dot'), el('span', null, SEAL[r.grade]));
        work.querySelector('.task').prepend(seal);
      }
      const last = save.task === C.tasks.length - 1;
      const next = button('go next', last ? 'Finish the case →' : 'Next →');
      next.onclick = advance;
      work.append(next);
    }
  }

  function refresh() {
    renderRq();
    renderMeta();
    renderPile();
    renderPaper();
    renderWork();
  }

  // ------------------------------------------------------------------ flow
  function begin() {
    while (save.task < C.tasks.length && result()) save.task++;
    if (save.task >= C.tasks.length) return showReport();
    task = TASKS[t().type](t(), ctx);
    sel = null;
    zone = null;
    shown = task.docs[0] || null;
    persist();
    refresh();
    paper.scrollTop = 0;
    if (!save.introSeen) showIntro();
  }

  function advance() {
    save.task++;
    begin();
  }

  // ------------------------------------------------------------------ letters and the report
  function openModal(node) {
    modal.replaceChildren(node);
    modal.hidden = false;
    node.querySelector('.go')?.focus({ preventScroll: true });
  }
  const closeModal = () => { modal.hidden = true; modal.replaceChildren(); };

  function showIntro() {
    const box = el('section', 'letter');
    box.append(el('div', 'letter-kicker', `${C.title} · from ${C.from}`));
    for (const p of C.intro) box.append(el('p', null, p));
    const q = el('div', 'letter-rq');
    q.append(el('div', 'rq-tag', 'Your research question'), el('p', null, C.rq.text));
    box.append(q);
    const ok = button('go', 'To work');
    ok.onclick = () => { save.introSeen = true; persist(); closeModal(); };
    box.append(ok);
    openModal(box);
  }

  function taskName(x, i) {
    if (x.type === 'readq') return 'Read the research question';
    if (x.type === 'stamp') return `${whoOf(x.doc)}, “${docs[x.doc].src.title}”: ${x.answer}`;
    return x.ask;
  }

  function showReport() {
    save.done = true;
    persist();
    const box = el('section', 'letter report');
    box.append(el('div', 'letter-kicker', 'Case closed'), el('h2', null, C.title));
    const list = el('ol', 'report-list');
    C.tasks.forEach((x, i) => {
      const r = result(i) || { grade: 'red' };
      const li = el('li', `report-row ${r.grade}`);
      li.append(el('span', 'seal-dot'), el('span', 'report-name', taskName(x, i)), el('span', 'report-grade', SEAL[r.grade]));
      list.append(li);
    });
    const cols = el('div', 'report-cols');
    const right = el('div');
    cols.append(list, right);
    box.append(cols);
    const mail = C.tasks.map((_, i) => result(i)?.mail).filter(Boolean);
    if (mail.length) {
      const m = el('div', 'mail');
      m.append(el('h3', null, 'What went wrong out there'));
      for (const x of mail) m.append(el('p', 'slip', x));
      right.append(m);
    }
    const rem = el('p', 'remember');
    rem.append(el('b', null, 'Remember: '), C.remember);
    right.append(rem);
    const ok = button('go', 'Gather the papers and leave the desk');
    ok.onclick = () => close(true);
    right.append(ok);
    openModal(box);
  }

  function close(complete) {
    desk.remove();
    delete window.desk;
    delete document.body.dataset.overlay;
    document.removeEventListener('keydown', onKey);
    if (complete) onComplete?.(save);
    else onLeave?.(save);
  }
  // body[data-overlay] tells the museum behind the desk not to walk
  document.body.dataset.overlay = 'desk';
  function onKey(e) { if (e.key === 'Escape' && modal.hidden) close(false); }
  document.addEventListener('keydown', onKey);

  window.desk = {
    get state() { return save; },
    get task() { return task; },
    solve() { closeModal(); save.introSeen = true; task.solve(); },
    next() { closeModal(); if (result()) advance(); },
  };

  if (save.done) showReport();
  else begin();
}
