// Mr. Harrow coaching inside the desk or the stacks: a speech bubble with Back and Next, and the pointing hand moving
// to whatever he is talking about. Used by the guided sample (js/desk/tutorial.js).
//
// A step: { say, point, until, wrong, wrongSay }
//   say       his words (two short sentences at most)
//   point     a CSS selector, an element, or a function returning one: where the hand points
//   until     optional: a function; while it returns false the step waits for the student ("Your turn")
//             and moves on by itself the first time it becomes true
//   wrong     optional: a function; while it returns true, `wrongSay` replaces his words
// Back always works. Going back to a step the student already did never undoes it.
import { el, button } from './dom.js';

export function startCoach(root, steps, { face, name = 'Mr. Harrow', onEnd } = {}) {
  let i = 0, alive = true;
  const fired = new Set();
  const box = el('aside', 'coach');
  box.setAttribute('aria-live', 'polite');
  const img = el('img', 'coach-face');
  img.alt = '';
  if (face) img.src = face;
  const who = el('div', 'coach-who', name);
  const text = el('p', 'coach-text');
  const back = button('coach-back', '◂ Back');
  const next = button('coach-next', 'Next ▸');
  const turn = el('span', 'coach-turn', 'Your turn');
  const nav = el('div', 'coach-nav');
  nav.append(back, turn, next);
  const col = el('div');
  col.append(who, text, nav);
  box.append(img, col);
  root.append(box);
  const hand = window.HAND.make(root, 'coach-hand');

  const pick = (p) => (typeof p === 'function' ? p() : p);
  function render() {
    const s = steps[i];
    if (!s) return end();
    const waiting = s.until && !s.until();
    text.textContent = s.wrong && s.wrong() ? s.wrongSay : s.say;
    back.disabled = i === 0;
    next.hidden = waiting;
    turn.hidden = !waiting;
    next.textContent = i === steps.length - 1 ? 'Done ✓' : 'Next ▸';
    hand.to(pick(s.point));
  }
  function go(d) { i = Math.max(0, Math.min(steps.length, i + d)); render(); }
  back.onclick = () => go(-1);
  next.onclick = () => go(1);
  // keys: left and right arrows step through his words (when no text box has the focus)
  const onKey = (e) => {
    if (!alive || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) return;
    if (e.key === 'ArrowLeft' && !back.disabled) { e.preventDefault(); go(-1); }
    if (e.key === 'ArrowRight' && !next.hidden) { e.preventDefault(); go(1); }
  };
  document.addEventListener('keydown', onKey);
  // the page re-renders as the student works, so look again often: re-point the hand, and move on when they've done it
  const tick = setInterval(() => {
    if (!alive) return;
    const s = steps[i];
    if (s?.until && !fired.has(i) && s.until()) { fired.add(i); setTimeout(() => { if (alive && steps[i] === s) go(1); }, 450); }
    render();
  }, 200);
  function end() { stop(); onEnd?.(); }
  function stop() { alive = false; clearInterval(tick); document.removeEventListener('keydown', onKey); box.remove(); hand.remove(); }
  render();
  return { stop, get step() { return i; } };
}
