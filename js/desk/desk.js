// The source desk: plays one case, task by task. Redesigned 2026-11-28 (docs/DESK_REDESIGN.md, mockup in
// docs/mockups/desk.html): your desk under the gas lamp, two areas instead of three.
//
//   ┌ top bar: the case · a card per task, with a word (Question · Sort · Ask...) · Leave the desk ─────┐
//   │                 the research question, pinned (a slip with a brass pin)                          │
//   │ the blotter: folder tabs for this task's papers, the paper   │ the task card: Now line, steps,   │
//   │ (Other papers ▾ holds the ones already used)                 │ buttons pinned to its foot        │
//   └──────────────────────────────────────────────────────────────────────────────────────────────────┘
//
// The research question comes first and never leaves the desk. When a case starts (a `readq` task), the question is
// BIG in the middle of the screen, glowing, and the student finds its WHEN and WHERE on it; then it flies up to its
// slip and the pin goes in (user, 2026-11-28). A case that asks a new question mid-way does the same again.
//
// The card scrolls inside itself, and its buttons (Check, Next) sit in its foot, so no button is ever off the screen.
// The title of the step being done now is lifted into the Now line at the top of the card; later steps are not shown.
//
// Looking back: ◂ Back (or a finished card in the top bar) shows an earlier answer, read-only, with its proof; Next ▸
// comes forward again. A pointing hand appears after a few idle seconds beside what to do next. In the guided sample,
// Mr. Harrow coaches instead (opts.coach, js/desk/coach.js); js/desk/tutorial.js points at these class names, so keep
// them: .rqcard, .rq-mark[data-tag], .rule-now, .work .next, .work .go, .sheet .tag, .sheet .tag-row, .sheet .body p,
// .sheet .ink, .pads, .desk-modal .go.
//
// Console while the desk is open: desk.solve() answers the current task, desk.next() moves on, desk.state, and
// desk.fits() checks this screen size (no button off the screen, nothing scrolls sideways, the paper's width).
import { el, button } from './dom.js';
import { renderDoc } from './doc.js';
import { TASKS, papersOf, MARK_ASK } from './tasks.js';
import { prepareAll, matches, lookup } from './text.js';
import { startCoach } from './coach.js';

const SEAL = { gold: 'Proven first time', silver: 'Proven, with help', red: 'Fixed' };
const KIND = { readq: 'Read the question', stamp: 'Sort a paper', question: 'Answer a question', compare: 'Compare two papers', sort: 'Sort the lines', order: 'Put them in order', catalogue: 'Write the label' };
// one word for each task, on its card in the top bar
const WORD = { readq: 'Question', stamp: 'Sort', question: 'Ask', compare: 'Compare', sort: 'Sort lines', order: 'Order', catalogue: 'Label' };
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function openDesk(root, { theCase: C, sources, save, persist, onLeave, onComplete, coach, face }) {
  const docs = prepareAll(sources);
  if (!save.results) Object.assign(save, { task: 0, results: {}, marked: {}, introSeen: false });

  let task = null, shown = null, sel = null, zone = null, viewing = null, drawer = false;
  // the research question: 'big' (in the middle, being read), 'leaving' (flying up to its slip), 'pinned'
  let rqPhase = null, pinDrop = false;
  const versions = {};
  const t = () => C.tasks[save.task];
  const rqAt = (i) => { let q = C.rq; for (let k = 0; k <= i; k++) if (C.tasks[k]?.rq) q = C.tasks[k].rq; return q; };
  const rq = () => rqAt(save.task);
  const caseDocs = [...new Set(C.tasks.flatMap(papersOf))];

  // ------------------------------------------------------------------ layout
  const desk = el('div', 'desk');
  desk.setAttribute('role', 'dialog');
  desk.setAttribute('aria-label', `Your desk: ${C.title}`);
  // the big question comes first in the page, so `.rqcard` finds it while it is up (the tutorial points at it)
  const stage = el('div', 'rqstage');
  const big = el('section', 'rqbig');
  big.setAttribute('aria-label', 'Your research question');
  stage.append(big);
  const top = el('header', 'desk-top');
  const caseBox = el('div', 'desk-case');
  const progress = el('ol', 'progress');
  progress.setAttribute('aria-label', 'The tasks in this case');
  const leave = button('leave');
  leave.append('Leave the desk', el('small', null, 'your place is saved'));
  leave.onclick = () => close(false);
  top.append(caseBox, progress, leave);
  const slipWrap = el('div', 'rqwrap');
  const main = el('div', 'desk-main');
  const reading = el('div', 'reading');
  const blotter = el('div', 'blotter');
  const folders = el('div', 'folders');
  folders.setAttribute('role', 'tablist');
  folders.setAttribute('aria-label', 'Papers for this task');
  const paper = el('div', 'paperarea');
  blotter.append(folders, paper);
  const drawerBox = el('div', 'drawer');
  drawerBox.hidden = true;
  reading.append(blotter, drawerBox);
  const work = el('aside', 'work');
  work.setAttribute('aria-label', 'Your task');
  main.append(reading, work);
  const modal = el('div', 'desk-modal');
  modal.hidden = true;
  desk.append(stage, top, slipWrap, main, modal);
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
    whoOf: (id) => whoOf(id),
    // the task moved the student to another paper: open its easy words, where lines can be clicked
    show(id) { if (docs[id]) { shown = id; versions[id] = 'plain'; } },
    // scroll the paper so the chosen line is in view (sort: the line was picked on the card, not in the paper)
    reveal() { paper.querySelector('.line.chosen')?.scrollIntoView({ block: 'center' }); },
    markedTags: () => save.marked[rq().text] || [],
    finish(result) {
      window.MuseumAudio.play('stamp');
      save.results[save.task] = { proof: sel, ...result };
      persist();
      refresh();
      work.querySelector('.next')?.focus({ preventScroll: true });
    },
    refresh: () => refresh(),
  };

  const result = (i = save.task) => save.results[i];
  const kindOf = (x) => KIND[x.type] || 'A task';
  const firstKey = (p) => [].concat(p || []).find(Boolean) || null;

  // ------------------------------------------------------------------ the research question
  // its words; while it is being read (big), every word can be clicked
  function questionText(q, clickable) {
    const marked = new Set(save.marked[q.text] || []);
    const text = el('p', 'rq-text');
    const spans = q.marks.map((m, i) => ({ i, m, at: q.text.indexOf(m.words) })).filter((s) => s.at >= 0).sort((a, b) => a.at - b.at);
    const word = (w, markIndex) => {
      if (!clickable || !w.trim()) return document.createTextNode(w);
      const b = button('rq-word', w);
      b.onclick = () => task.word(markIndex);
      return b;
    };
    const words = (s, markIndex, into) => s.split(/(\s+)/).forEach((w) => w && into.append(word(w, markIndex)));
    let pos = 0;
    for (const s of spans) {
      words(q.text.slice(pos, s.at), -1, text);
      const on = marked.has(s.m.tag);
      const m = el('span', `rq-mark${on ? ' marked' : ''}`);
      m.dataset.tag = s.m.tag;
      words(s.m.words, s.i, m);
      if (on) m.append(el('span', 'mk-tag', s.m.tag));
      text.append(m);
      pos = s.at + s.m.words.length;
    }
    words(q.text.slice(pos), -1, text);
    return text;
  }

  // big while a read-the-question task is under way; when it is done, a moment to see the words marked, then up
  function updatePhase() {
    const want = viewing == null && t()?.type === 'readq' && !result();
    // moved on mid-flight (looking back, or Next pressed by a test or the coach): land at once
    if (rqPhase === 'leaving' && (viewing != null || t()?.type !== 'readq' || want)) { stopFlight(); rqPhase = want ? 'big' : 'pinned'; return; }
    if (rqPhase == null || viewing != null) rqPhase = want ? 'big' : 'pinned';
    else if (want && rqPhase === 'pinned') rqPhase = 'big';
    else if (!want && rqPhase === 'big') {
      rqPhase = 'leaving';
      setTimeout(() => { if (rqPhase === 'leaving') flyUp(); }, 900);
    }
  }

  function renderRq() {
    const q = rqAt(viewing ?? save.task);
    const changed = save.task > 0 && rqAt(save.task - 1) !== q;
    const pinned = rqPhase === 'pinned';

    // the slip at the top: laid out even while the big card is up (the flight needs its place), but hidden
    slipWrap.className = `rqwrap${pinned ? '' : ' waiting'}${pinDrop ? ' thunk' : ''}`;
    const slip = el('section', pinned ? 'rqcard' : 'rqslip');
    slip.append(el('span', 'rq-label', 'Your research question'), questionText(q, false));
    slipWrap.replaceChildren(slip);
    if (pinned) slipWrap.append(el('span', `pin${pinDrop ? ' drop' : ''}`));

    // the big card in the middle
    stage.hidden = pinned;
    big.classList.toggle('rqcard', !pinned);
    if (pinned) return;
    const marked = new Set(save.marked[q.text] || []);
    const next = q.marks.find((m) => !marked.has(m.tag));
    big.replaceChildren();
    if (changed) big.append(el('div', 'rq-new', 'A new question'));
    big.append(el('h2', 'rqbig-label', 'Your Research Question'), questionText(q, rqPhase === 'big' && !!next && !!task?.rqWords));
    if (rqPhase === 'big' && next) {
      const ask = el('p', 'rqbig-ask');
      ask.append('Click the words that say ', el('b', null, MARK_ASK[next.tag] || next.tag));
      big.append(ask);
      const said = work.querySelector('.card-body .msg'); // the readq card's "Not those words..." goes here too
      if (said) big.append(said.cloneNode(true));
    } else {
      const ok = el('p', 'rqbig-ask ok', '✓');
      ok.setAttribute('aria-label', 'Found them');
      big.append(ok);
    }
  }

  // the big question flies up onto its slip; then the pin goes in
  function flyUp() {
    const slip = slipWrap.querySelector('section');
    if (!desk.isConnected) return;
    if (reduced() || stage.hidden || !slip) return land();
    const b = big.getBoundingClientRect(), s = slip.getBoundingClientRect();
    const end = `translate(${s.left - b.left}px, ${s.top - b.top}px) scale(${s.width / b.width})`;
    stage.classList.add('flying');
    window.MuseumAudio.play('whoosh', 0.25);
    stage.animate([{ backgroundColor: 'rgba(5,6,9,.66)' }, { backgroundColor: 'rgba(5,6,9,0)' }], { duration: 650, fill: 'forwards' });
    big.animate([{ transform: 'none', opacity: 1 }, { transform: end, opacity: 1, offset: 0.82 }, { transform: end, opacity: 0 }],
      { duration: 650, easing: 'cubic-bezier(.55,0,.25,1)', fill: 'forwards' }).onfinish = land;
  }
  // the flight's own animations only (cancelling the CSS glow would stop it for the next question)
  function stopFlight() {
    stage.classList.remove('flying');
    for (const a of [...big.getAnimations(), ...stage.getAnimations()]) if (!(a instanceof CSSAnimation)) a.cancel();
  }
  function land() {
    if (!desk.isConnected || rqPhase !== 'leaving') return;
    rqPhase = 'pinned';
    pinDrop = !reduced();
    stopFlight();
    if (pinDrop) setTimeout(() => window.MuseumAudio.play('box', 0.3), 230); // the pin goes in
    refresh();
    pinDrop = false;
  }

  // ------------------------------------------------------------------ the top bar
  function renderMeta() {
    caseBox.replaceChildren(el('small', null, 'Your desk'), el('span', 'case-title', C.title));
    progress.replaceChildren();
    C.tasks.forEach((x, i) => {
      const r = result(i), now = i === (viewing ?? save.task), back = i < save.task;
      const p = el(back ? 'button' : 'span', `pg${r ? ` done ${r.grade}` : ''}${now ? ' now' : ''}${!r && !now ? ' later' : ''}`);
      p.title = `${kindOf(x)}${r ? ` · ${SEAL[r.grade]}` : now ? ' · you are here' : ' · still to do'}${back ? ' · click to look back' : ''}`;
      if (back) { p.type = 'button'; p.onclick = () => view(i); }
      p.append(el('span', 'pg-n', r ? '✓' : String(i + 1)), el('span', 'pg-w', WORD[x.type] || 'Task'));
      const li = el('li');
      li.append(p);
      progress.append(li);
    });
  }

  // while the student is writing a paper's label (catalogue), its maker stays a secret everywhere on the desk
  const whoOf = (id) => (viewing == null && task?.hide?.includes('by') && task.docs.includes(id) ? 'Maker not known yet' : docs[id].src.meta.by.split(',')[0]);
  function stampOn(id) {
    // the latest stamp this case gave the paper, with the question it was for
    for (let i = C.tasks.length - 1; i >= 0; i--) {
      const x = C.tasks[i];
      if (x.type === 'stamp' && x.doc === id && result(i)?.stamp && i !== save.task) return { kind: result(i).stamp, q: rqAt(i).short };
    }
    return null;
  }

  // ------------------------------------------------------------------ the blotter: folder tabs, the drawer, the paper
  function openPaper(id) {
    if (shown !== id) window.MuseumAudio.play('whoosh', 0.22);
    shown = id;
    drawer = false;
    refresh();
    paper.scrollTop = 0;
  }

  function renderFolders() {
    const x = C.tasks[viewing ?? save.task];
    const now = viewing != null ? papersOf(x) : task.docs;
    const picked = viewing != null ? [].concat(result(viewing)?.proof || []) : [].concat(task.selected !== undefined ? task.selected : sel);
    const proofDocs = picked.filter(Boolean).map((k) => lookup(docs, k)?.doc.id);
    folders.replaceChildren();
    for (const id of now) {
      const on = id === shown, has = proofDocs.includes(id);
      const b = button(`ftab${on ? ' on' : ''}${has ? ' has-proof' : ''}`);
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', on);
      b.append(el('span', 'ftab-who', whoOf(id)), el('span', 'ftab-title', docs[id].src.title));
      if (has) { b.append(el('span', 'ftab-tick', '✓')); b.title = 'Your proof is in this one'; }
      b.onclick = () => openPaper(id);
      folders.append(b);
    }
    // papers this case used before: in the drawer, out of the way
    const rest = caseDocs.filter((id) => !now.includes(id) && C.tasks.findIndex((y) => papersOf(y).includes(id)) < save.task);
    drawerBox.hidden = !drawer || !rest.length;
    if (!rest.length) return;
    const o = button('others', `Other papers (${rest.length}) ▾`);
    o.setAttribute('aria-expanded', drawer);
    o.onclick = () => { drawer = !drawer; refresh(); };
    folders.append(o);
    if (!drawer) return;
    drawerBox.replaceChildren(el('h4', null, 'Papers you have already used'));
    for (const id of rest) {
      const b = button(shown === id ? 'on' : null);
      b.append(el('b', null, docs[id].src.title), el('span', 'who', whoOf(id)));
      const s = stampOn(id);
      if (s) b.append(el('span', `pile-stamp ${s.kind}`, `${s.kind === 'primary' ? 'PRIMARY' : 'SECONDARY'} · ${s.q}`));
      b.onclick = () => openPaper(id);
      drawerBox.append(b);
    }
  }

  // no paper out yet: the blotter and the paperweight, and no words (user, 2026-11-28)
  const paperweight = () => {
    const w = el('div', 'weight');
    w.append(el('div', 'stone'));
    w.setAttribute('aria-hidden', 'true');
    return w;
  };
  const sheet = (node) => { const w = el('div', 'sheetwrap'); w.append(node); return w; };

  function renderPaper() {
    const keep = paper.scrollTop;
    const same = paper.dataset.doc === (shown || '');
    renderFolders();
    paper.replaceChildren();
    paper.dataset.doc = shown || '';
    if (!shown) { paper.append(paperweight()); return; }
    if (viewing != null) {
      const r = result(viewing), x = C.tasks[viewing];
      const bar = el('div', 'readonlybar');
      bar.append(el('span', null, 'Looking back: the underlined line is the proof you chose.'));
      paper.append(bar, sheet(renderDoc(docs[shown], {
        version: versions[shown], pointing: false, selected: r.proof,
        stamp: x.type === 'stamp' && x.doc === shown ? { kind: r.stamp, q: rqAt(viewing).short } : null,
        onVersion: (v) => { versions[shown] = v; renderPaper(); },
      })));
      return;
    }
    const onTask = task.docs.includes(shown);
    if (!onTask) {
      const bar = el('div', 'readonlybar');
      const back = button(null, '← Back to your paper');
      back.onclick = () => openPaper(task.docs[0] || null);
      bar.append(el('span', null, 'You can read this paper. Your proof must come from the papers for this task.'));
      if (task.docs.length) bar.append(back);
      paper.append(bar);
    }
    const s = onTask && task.stamp ? task.stamp() : null;
    paper.append(sheet(renderDoc(docs[shown], {
      version: versions[shown],
      pointing: onTask && task.pointing,
      selected: task.selected !== undefined ? task.selected : sel,
      hide: onTask ? task.hide : null,
      zone: zone && zone.doc === shown ? zone.z : null,
      stamp: s ? { ...s, q: rq().short } : stampOn(shown),
      onPoint: (key) => (task.point ? task.point(key) : ctx.setSel(key)),
      onVersion: (v) => { versions[shown] = v; renderPaper(); },
    })));
    if (same) paper.scrollTop = keep;
  }

  // ------------------------------------------------------------------ the task card
  function renderWork() {
    work.replaceChildren();
    const at = viewing ?? save.task, x = C.tasks[at];
    const n = C.tasks.slice(0, at + 1).filter((y) => y.type === x.type).length;
    const of = C.tasks.filter((y) => y.type === x.type).length;
    const cardp = el('div', 'cardpaper');
    const head = el('div', 'card-head');
    head.append(el('span', 'card-kind', `${viewing != null ? 'Looking back · ' : ''}${kindOf(x)}${of > 1 ? ` · ${n} of ${of}` : ''}`));
    const nav = el('span', 'work-nav');
    if (at > 0 && result(at - 1)) {
      const b = button('navbtn', '◂ Back');
      b.title = 'Look at your answer before this one';
      b.onclick = () => view(at - 1);
      nav.append(b);
    }
    if (viewing != null) {
      const fwd = viewing + 1 < save.task;
      const b = button('navbtn fwd', fwd ? 'Next ▸' : 'Back to my work ▸');
      b.onclick = () => view(fwd ? viewing + 1 : null);
      nav.append(b);
    }
    head.append(nav);
    const nowBox = el('div', 'now');
    nowBox.setAttribute('aria-live', 'polite');
    const body = el('div', 'card-body');
    const foot = el('div', 'card-foot');
    cardp.append(head, nowBox, body, foot);
    work.append(cardp);
    work.classList.toggle('reviewing', viewing != null);

    if (viewing != null) {
      nowBox.append(el('small', null, 'Looking back'), el('p', null, 'An earlier answer. Your proof is underlined in the paper.'));
      body.append(reviewCard(viewing));
      foot.hidden = true;
      desk.dataset.focus = 'card';
      return;
    }
    const card = task.card();
    body.append(card);
    const r = result();
    if (r && t().type !== 'readq') {
      const seal = el('div', `seal ${r.grade}`);
      seal.append(el('span', 'seal-dot'), el('span', null, SEAL[r.grade]));
      card.prepend(seal);
    }
    // the Now line: the title of the step being done now, lifted to the top of the card
    const last = save.task === C.tasks.length - 1;
    // (a stamp or an answer stays open to change while its proof step is current: the LAST current step is the one)
    const nowStep = [...card.querySelectorAll('.step.now')].pop();
    let say;
    if (r) say = `${r.grade === 'red' ? 'Fixed.' : t().type === 'readq' ? 'Done!' : 'Proven!'} Press ${last ? 'Finish the case' : 'Next'}.`;
    else if (nowStep?.querySelector('.step-title')) {
      const h = nowStep.querySelector('.step-head');
      say = h.querySelector('.step-title').textContent;
      h.remove();
    } else say = card.querySelector('.ask')?.textContent || kindOf(t());
    const wantsProof = !r && task.pointing && !!card.querySelector('.step.now .proof:not(.filled)');
    const p = el('p', null, say);
    if (wantsProof) p.append(el('span', 'arrow-left', ' ←'), el('span', 'arrow-up', ' ↑'));
    nowBox.append(el('small', null, 'Now'), p);
    // the lamp: on the paper while a proof is wanted, on the card otherwise
    desk.dataset.focus = rqPhase !== 'pinned' ? '' : wantsProof ? 'paper' : 'card';
    // the buttons go to the card's foot, which never scrolls away
    const acts = card.querySelector('.actions');
    if (acts) foot.append(acts);
    if (r) {
      const next = button('go next', last ? 'Finish the case →' : 'Next →');
      next.onclick = advance;
      foot.append(next);
    }
    foot.hidden = !foot.childElementCount;
    // keep what matters now in view on the card: the current step and any message under it (or, when done, the end)
    const show = r ? card.lastElementChild : [nowStep, ...card.querySelectorAll('.msg')].filter(Boolean).pop();
    if (show && show !== card.firstElementChild) {
      const top = nowStep && !r ? nowStep.offsetTop : show.offsetTop, bottom = show.offsetTop + show.offsetHeight;
      body.scrollTop = Math.max(0, Math.min(top - 10, bottom - body.clientHeight + 12));
    }
  }

  // an earlier answer, read-only: what was asked, the answer, the proof, and why
  function reviewCard(i) {
    const x = C.tasks[i], r = result(i), q = rqAt(i);
    const c = el('div', 'task task-review');
    if (x.type === 'readq') {
      c.append(el('p', 'ask', 'You read the research question first.'));
      const rule = el('div', 'rule-now');
      rule.append(el('p', 'rule-lead', 'So, for that question:'));
      const p = el('p', 'rule-p'); p.append(el('b', null, 'PRIMARY '), q.primary); rule.append(p);
      const s = el('p', 'rule-s'); s.append(el('b', null, 'SECONDARY '), q.secondary); rule.append(s);
      c.append(rule);
      return c;
    }
    const seal = el('div', `seal ${r.grade}`);
    seal.append(el('span', 'seal-dot'), el('span', null, SEAL[r.grade]));
    c.append(seal, el('p', 'ask', x.ask || `${docs[x.doc].src.title}: primary or secondary for ${q.short}?`));
    const quoteBox = (label, key) => {
      const pf = el('div', 'proof filled');
      const qt = key && lookup(docs, key);
      pf.append(el('div', 'proof-label', label), el('blockquote', null, qt ? `“${qt.text}”` : '—'));
      return pf;
    };
    const why = (text) => { const m = el('div', 'msg good'); m.append(el('p', null, text)); return m; };
    if (x.type === 'compare') {
      x.find.forEach((f, k) => c.append(quoteBox(`${whoOf(f.doc)} says`, [].concat(r.proof || [])[k])));
      const ans = el('p', 'review-answer');
      ans.append(el('b', null, 'Answer: '), x.options[x.answer]);
      c.append(ans, why(x.right));
      return c;
    }
    if (x.type === 'sort') {
      const tally = el('div', 'tally');
      x.bins.forEach((bn, j) => {
        const col = el('div', `tally-col tally-${j ? 'b' : 'a'}`);
        col.append(el('b', null, bn.name));
        x.items.forEach((it, k) => { if (it.bin === bn.id) col.append(el('span', `tally-item${(r.wrong || []).includes(k) ? ' fixed' : ''}`, it.text || lookup(docs, matches(docs, it.ref)[0])?.text || '')); });
        tally.append(col);
      });
      c.append(tally, why(x.right));
      return c;
    }
    if (x.type === 'order') {
      const ol = el('ol', 'ordered');
      for (const it of x.items) { const li = el('li'); if (it.when) li.append(el('b', 'when', it.when)); li.append(el('span', null, it.text)); ol.append(li); }
      c.append(ol, why(x.right));
      return c;
    }
    if (x.type === 'catalogue') {
      x.fields.forEach((f, k) => {
        const got = el('p', 'filled-line');
        got.append(el('b', null, `${f.k === 'by' ? 'MADE BY' : 'WHEN'}  `), f.options[f.answer]);
        c.append(got, quoteBox('Your proof', [].concat(r.proof || [])[k]));
      });
      c.append(why(x.right));
      return c;
    }
    const ans = el('p', 'review-answer');
    if (x.type === 'stamp') {
      ans.className = `stamped-as ${x.answer}`;
      ans.append('Your stamp: ', el('b', null, x.answer.toUpperCase()));
      if (r.first) ans.append(el('span', 'small', ` (you first chose ${r.first})`));
    } else {
      ans.append(el('b', null, 'Answer: '), x.options[x.answer]);
      if (r.first != null) ans.append(el('span', 'small', ` (you first chose ${'ABCD'[r.first]})`));
    }
    c.append(ans);
    const pf = el('div', 'proof filled');
    const qt = firstKey(r.proof) && lookup(docs, firstKey(r.proof));
    pf.append(el('div', 'proof-label', 'Your proof'), el('blockquote', null, qt ? `“${qt.text}”` : '—'));
    c.append(pf);
    const m = el('div', 'msg good');
    m.append(el('p', null, x.right));
    c.append(m);
    return c;
  }

  function view(i) {
    viewing = i;
    drawer = false;
    if (i != null) {
      const x = C.tasks[i], r = result(i);
      shown = (firstKey(r?.proof) && lookup(docs, firstKey(r.proof))?.doc.id) || papersOf(x)[0] || null;
    } else shown = task.docs.includes(shown) ? shown : task.docs[0] || null;
    refresh();
    paper.scrollTop = 0;
    if (i != null) requestAnimationFrame(() => paper.querySelector('.line.chosen')?.scrollIntoView({ block: 'center' }));
  }

  function refresh() {
    if (task) updatePhase();
    renderMeta();
    renderPaper();
    renderWork();
    renderRq(); // last: the big question copies the card's message
  }

  // ------------------------------------------------------------------ flow
  function begin() {
    while (save.task < C.tasks.length && result()) save.task++;
    if (save.task >= C.tasks.length) return showReport();
    task = TASKS[t().type](t(), ctx);
    sel = null;
    zone = null;
    drawer = false;
    shown = task.docs[0] || null;
    persist();
    refresh();
    paper.scrollTop = 0;
    if (!save.introSeen && !coach) showIntro();
  }

  function advance() {
    viewing = null;
    save.task++;
    begin();
  }

  // ------------------------------------------------------------------ letters and the report
  function openModal(node) {
    modal.replaceChildren(node);
    modal.hidden = false;
    desk.classList.add('modal-open');
    node.querySelector('.go')?.focus({ preventScroll: true });
  }
  const closeModal = () => { modal.hidden = true; modal.replaceChildren(); desk.classList.remove('modal-open'); };

  // the case's letter: who sent it and why. The question itself comes next, big (it is not repeated here).
  function showIntro() {
    const box = el('section', 'letter');
    box.append(el('div', 'letter-kicker', `From ${C.from}`), el('h2', null, C.title));
    for (const p of C.intro) box.append(el('p', null, p));
    const ok = button('go', rqPhase === 'pinned' ? 'To work' : 'Read your question');
    ok.onclick = () => { save.introSeen = true; persist(); closeModal(); };
    box.append(ok);
    openModal(box);
  }

  function taskName(x) {
    if (x.type === 'readq') return 'Read the research question';
    if (x.type === 'stamp') return `${whoOf(x.doc)}, “${docs[x.doc].src.title}”: ${x.answer}`;
    if (x.type === 'catalogue') return `Write the label: “${docs[x.doc].src.title}”`;
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
      li.append(el('span', 'seal-dot'), el('span', 'report-name', taskName(x)), el('span', 'report-grade', SEAL[r.grade]));
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
    coachRun?.stop();
    clearInterval(idleTick);
    desk.remove();
    delete window.desk;
    delete document.body.dataset.overlay;
    document.removeEventListener('keydown', onKey);
    if (complete) onComplete?.(save);
    else onLeave?.(save);
  }
  // body[data-overlay] tells the museum behind the desk not to walk
  document.body.dataset.overlay = 'desk';
  function onKey(e) {
    if (e.key !== 'Escape' || !modal.hidden) return;
    if (drawer) { drawer = false; refresh(); return; }
    close(false);
  }
  document.addEventListener('keydown', onKey);

  // does the desk fit this screen? (see CLAUDE.md: run it at each target size, for every task, in its tallest states)
  function fits() {
    const W = innerWidth, H = innerHeight, off = [];
    const out = (r) => r.top < -1 || r.left < -1 || r.bottom > H + 1 || r.right > W + 1;
    for (const b of desk.querySelectorAll('button')) {
      // buttons inside a scrolling area or a letter are reached by scrolling it
      if (!b.getClientRects().length || b.closest('.paperarea, .card-body, .drawer, .letter, .rqwrap')) continue;
      if (out(b.getBoundingClientRect())) off.push(b.textContent.trim().slice(0, 30));
    }
    for (const box of desk.querySelectorAll('.letter, .rqstage:not([hidden]) .rqbig')) if (out(box.getBoundingClientRect())) off.push(`(${box.className})`);
    const sideways = [desk, main, paper, work.querySelector('.card-body')].some((e) => e && e.scrollWidth > e.clientWidth + 1);
    const s = paper.querySelector('.sheet');
    return { ok: !off.length && !sideways, offscreen: off, sideways, paper: s ? s.offsetWidth : null };
  }

  window.desk = {
    get state() { return save; },
    get task() { return task; },
    get sel() { return sel; },
    get question() { return rqPhase; },
    fits,
    solve() { closeModal(); save.introSeen = true; task.solve(); },
    next() { closeModal(); if (result()) advance(); },
  };

  // ------------------------------------------------------------------ the hand: what to do next, after a few idle seconds
  const nudge = window.HAND.make(desk, 'nudge');
  let idle = 0;
  const wake = () => { idle = 0; nudge.hide(); };
  desk.addEventListener('pointerdown', wake, true);
  desk.addEventListener('keydown', wake, true);
  function nudgeTarget() {
    if (!modal.hidden) return modal.querySelector('.go');
    if (rqPhase === 'leaving') return null;
    if (viewing != null) return work.querySelector('.navbtn.fwd');
    if (result()) return work.querySelector('.next');
    if (rqPhase === 'big') return big.querySelector('.rq-mark:not(.marked)') && rq().marks.map((m) => big.querySelector(`.rq-mark[data-tag="${m.tag}"]:not(.marked)`)).find(Boolean);
    const go = work.querySelector('.card-foot .go:not(.next):not(:disabled)');
    if (go) return go;
    return work.querySelector('.pads button:not(:disabled)') || work.querySelector('.options') || work.querySelector('.sortitem, .orderitem')
      || (task.pointing && paper.querySelector('.sheet .tag')) || work.querySelector('.proof');
  }
  const idleTick = setInterval(() => {
    if (coachRun) return;
    idle += 0.5;
    if (idle >= 6) { const n = nudgeTarget(); if (n) nudge.beside(n); else nudge.hide(); } // it follows the page as it changes
  }, 500);

  let coachRun = null;
  if (save.done) showReport();
  else begin();
  if (coach && !save.done) {
    coachRun = startCoach(desk, coach(window.desk), {
      face, start: save.coachStep || 0,
      onStep: (i) => { save.coachStep = i; persist(); },
      onEnd: () => { coachRun = null; },
    });
  }
}
