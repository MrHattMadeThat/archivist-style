// Mr. Harrow coaching inside the desk or the stacks: a speech bubble with Back and Next, and the pointing hand moving
// to whatever he is talking about. Used by the guided sample (js/desk/tutorial.js).
//
// The coach LOCKS the page to the current step, so a student can't run ahead of him:
//   - while he is talking (a step without `until`), only his bubble works: Next, Back
//   - on a "Your turn" step, only the thing the step allows works (`allow`, or else `point`)
//   - "Leave the desk" always works
// A click anywhere else is stopped, and the bubble says what to do instead.
//
// A step: { say, point, allow, until, wrong, wrongSay }
//   say       his words (two short sentences at most)
//   point     a CSS selector, an element, or a function returning one: where the hand points
//   allow     optional: a CSS selector for what may be clicked on a "Your turn" step (defaults to `point`)
//   until     optional: a function; while it returns false the step waits for the student ("Your turn")
//             and moves on by itself the first time it becomes true
//   wrong     optional: a function; while it returns true, `wrongSay` replaces his words
// Back always works. Going back to a step the student already did never undoes it.
import { el, button } from './dom.js';

// start / onStep: resume where the student left off (the desk saves the step)
export function startCoach(root, steps, { face, name = 'Mr. Harrow', onEnd, start = 0, onStep } = {}) {
  let i = Math.min(start, steps.length - 1), alive = true, fuss = 0;
  const fired = new Set();
  const box = el('aside', 'coach');
  box.setAttribute('aria-live', 'polite');
  const img = el('img', 'coach-face');
  img.alt = '';
  if (face) img.src = face;
  const who = el('div', 'coach-who', name);
  const text = el('p', 'coach-text');
  const tell = el('p', 'coach-tell');
  const back = button('coach-back', '◂ Back');
  const next = button('coach-next', 'Next ▸');
  const turn = el('span', 'coach-turn', 'Your turn');
  const nav = el('div', 'coach-nav');
  nav.append(back, turn, next);
  const col = el('div');
  col.append(who, text, tell, nav);
  box.append(img, col);
  root.append(box);
  root.classList.add('coached');
  const hand = window.HAND.make(root, 'coach-hand');

  const pick = (p) => (typeof p === 'function' ? p() : p);
  const waiting = (s) => !!(s?.until && !s.until());
  function render() {
    const s = steps[i];
    if (!s) return end();
    const w = waiting(s);
    const line = s.wrong && s.wrong() ? s.wrongSay : s.say;
    if (text.textContent !== line) {
      text.textContent = line;
      window.MuseumAudio.speak('harrow', line);
    }
    back.disabled = i === 0;
    next.hidden = w;
    turn.hidden = !w;
    next.textContent = i === steps.length - 1 ? 'Done ✓' : 'Next ▸';
    tell.hidden = Date.now() > fuss;
    hand.to(pick(s.point));
  }
  function go(d) { i = Math.max(0, Math.min(steps.length, i + d)); fuss = 0; onStep?.(i); render(); }
  back.onclick = () => go(-1);
  next.onclick = () => { if (!waiting(steps[i])) go(1); }; // never past a step the student hasn't done

  // ------------------------------------------------------------------ the lock
  function allowed(target) {
    if (box.contains(target)) return true;
    if (target.closest('.desk-top .leave')) return true;
    const s = steps[i];
    if (!waiting(s)) return false; // he is talking: Next first
    const a = s.allow || pick(s.point);
    if (!a) return false;
    if (typeof a === 'string') return !!target.closest(a);
    return a.contains(target);
  }
  function complain() {
    const s = steps[i];
    tell.textContent = waiting(s) ? 'Click where the hand is pointing.' : 'Read what Mr. Harrow says, then click Next ▸.';
    fuss = Date.now() + 2500;
    box.classList.remove('fuss');
    void box.offsetWidth; // restart the shake
    box.classList.add('fuss');
    render();
  }
  const guard = (e) => {
    if (!alive || allowed(e.target)) return;
    if (e.type === 'keydown' && !['Enter', ' '].includes(e.key)) return; // arrows, Tab and Escape still work
    e.preventDefault();
    e.stopPropagation();
    if (e.type !== 'pointerdown') complain();
  };
  for (const t of ['pointerdown', 'click', 'keydown']) root.addEventListener(t, guard, true);

  // keys: left and right arrows step through his words
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
  function stop() {
    window.MuseumAudio.stopVoice();
    alive = false;
    clearInterval(tick);
    document.removeEventListener('keydown', onKey);
    for (const t of ['pointerdown', 'click', 'keydown']) root.removeEventListener(t, guard, true);
    root.classList.remove('coached');
    box.remove();
    hand.remove();
  }
  render();
  next.focus({ preventScroll: true });
  return { stop, get step() { return i; } };
}
