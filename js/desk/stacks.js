// The stacks in the basement: one shelf seen up close. Three modes:
//   fetch   a request slip lists the boxes to bring up; click the right box to take it
//   file    the papers in your arms go back in their boxes: pick a paper, then its box
//   browse  just looking
// Boxes are kept by WHO MADE THE PAPERS and WHEN, A to Z by name. Never by primary or secondary: that depends on the
// question, and tomorrow's question will be different.
import { el, button } from './dom.js';
import { BOXES, SHELVES } from './sources.js';
import { startCoach } from './coach.js';

// coach: Mr. Harrow's steps (the guided sample); locked: Step back stays hidden until every paper is filed
export function openShelf(root, { shelfId, mode, need = [], have = [], carrying = [], sources, onTake, onFile, onClose, coach, face, locked }) {
  const shelf = SHELVES.find((s) => s.id === shelfId);
  let pick = carrying[0] || null;
  let say = null, tone = null, wrong = false;
  const wrap = el('div', 'stacks');
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-label', `Shelf ${shelf.name}`);
  root.append(wrap);
  document.body.dataset.overlay = 'shelf';

  const boxLabel = (id) => { const b = BOXES[id]; return `${b.maker} · ${b.year}`; };

  function render() {
    wrap.replaceChildren();
    const panel = el('div', 'shelfview');
    const head = el('header', 'shelf-head');
    const h = el('div');
    h.append(el('div', 'shelf-kicker', 'The stacks'), el('h2', null, `Shelf ${shelf.name}`));
    const back = button('leave', 'Step back');
    back.onclick = close;
    back.hidden = !!locked && carrying.length > 0;
    head.append(h, back);
    panel.append(head);

    const lead = el('p', 'shelf-lead');
    if (mode === 'fetch') lead.textContent = 'Find the boxes on your request slip. Click a box to take it.';
    else if (mode === 'file' && carrying.length) lead.textContent = 'Put each paper back in its box. Click a paper, then click the box it belongs in.';
    else if (mode === 'file') lead.textContent = 'Your arms are empty. Every paper is back in its box.';
    else lead.textContent = 'Boxes are kept by who made the papers, A to Z.';
    panel.append(lead);

    const body = el('div', 'shelf-body');
    const rack = el('div', 'rack');
    rack.append(el('div', 'rack-sign', shelf.name));
    const plank = el('div', 'plank');
    for (const id of shelf.boxes) {
      const b = BOXES[id];
      const taken = have.includes(id);
      const box = button(`abox${taken ? ' taken' : ''}${mode === 'file' && pick ? ' target' : ''}`);
      box.dataset.box = id;
      const card = el('span', 'abox-card');
      card.append(el('b', null, b.maker), el('span', null, b.what), el('span', 'abox-year', `${b.place}, ${b.year}`));
      box.append(card);
      box.setAttribute('aria-label', `${b.maker}, ${b.what}, ${b.year}${taken ? ' (taken)' : ''}`);
      box.onclick = () => clickBox(id);
      plank.append(box);
    }
    rack.append(plank);
    body.append(rack);

    if (mode === 'fetch') {
      const slip = el('div', 'reqslip');
      slip.append(el('div', 'reqslip-head', 'Request slip'));
      const ul = el('ul');
      for (const id of need) {
        const li = el('li', have.includes(id) ? 'got' : null);
        li.append(el('span', 'tick', have.includes(id) ? '✓' : ''), boxLabel(id));
        ul.append(li);
      }
      slip.append(ul, el('p', 'small', 'Shelves go by the maker’s name: A – F, G – O, P – Z.'));
      body.append(slip);
    }
    panel.append(body);

    if (mode === 'file') {
      const arms = el('div', 'arms');
      arms.append(el('div', 'arms-head', 'In your arms'));
      const row = el('div', 'arms-row');
      for (const id of carrying) {
        const s = sources[id];
        const c = button(`armpaper${pick === id ? ' on' : ''}`);
        c.append(el('b', null, s.title), el('span', null, `Made by: ${s.meta.by.split(',')[0]}`), el('span', null, `When: ${s.meta.when}`));
        // a paper printed inside someone else's book lives in that book's box
        if (s.printedIn) c.append(el('span', 'printed-in', `Printed in: ${s.printedIn}`));
        c.setAttribute('aria-pressed', pick === id);
        c.onclick = () => { pick = id; say = null; render(); };
        row.append(c);
      }
      if (!carrying.length) row.append(el('p', 'small', 'Nothing left to file.'));
      arms.append(row, el('p', 'rule-line', 'File by WHO MADE IT and WHEN. Never by primary or secondary.'));
      panel.append(arms);
    }
    if (say) panel.append(el('p', `shelf-say ${tone || ''}`, say));
    wrap.append(panel);
    panel.querySelector('.armpaper.on, .abox:not(.taken), .leave')?.focus({ preventScroll: true });
  }

  function clickBox(id) {
    const b = BOXES[id];
    if (mode === 'fetch') {
      if (have.includes(id)) { say = 'You already have that box.'; tone = 'warn'; }
      else if (need.includes(id)) { have = [...have, id]; window.MuseumAudio.play('box', 0.4); onTake?.(id); say = `You take the box: ${b.maker}, ${b.year}.`; tone = 'good'; }
      else { say = `Not this one: it holds ${b.what.toLowerCase()} (${b.maker}, ${b.year}). Check your request slip.`; tone = 'warn'; }
    } else if (mode === 'file') {
      if (!pick) { say = 'Click a paper in your arms first.'; tone = 'warn'; }
      else {
        const s = sources[pick];
        wrong = s.box !== id;
        if (s.box === id) {
          window.MuseumAudio.play('whoosh', 0.3);
          onFile?.(pick);
          carrying = carrying.filter((x) => x !== pick);
          say = `Filed: “${s.title}” is back with ${b.maker}, ${b.year}.`;
          tone = 'good';
          pick = carrying[0] || null;
        } else {
          say = s.printedIn
            ? `That box holds papers made by ${b.maker}, ${b.year}. These words are ${s.meta.by.split(',')[0]}’s, but the copy you hold is printed in ${s.printedIn}. It goes back in that book’s box.${shelf.boxes.includes(s.box) ? '' : ' Its box is on another shelf.'}`
            : `That box holds papers made by ${b.maker}, ${b.year}. This paper was made by ${s.meta.by.split(',')[0]} (${s.meta.when.toLowerCase()}).${shelf.boxes.includes(s.box) ? '' : ' Its box is on another shelf.'}`;
          tone = 'warn';
        }
      }
    } else {
      say = `${b.maker}: ${b.what}, ${b.place}, ${b.year}. You don’t need this box right now.`;
      tone = null;
    }
    render();
  }

  function onKey(e) { if (e.key === 'Escape' && !(locked && carrying.length)) close(); }
  document.addEventListener('keydown', onKey);
  function close() {
    coachRun?.stop();
    delete window.shelf;
    document.removeEventListener('keydown', onKey);
    delete document.body.dataset.overlay;
    wrap.remove();
    onClose?.();
  }
  window.shelf = { get carrying() { return carrying; }, get pick() { return pick; }, get wrong() { return wrong; } };
  render();
  const coachRun = coach ? startCoach(root, coach(window.shelf), { face }) : null;
}
