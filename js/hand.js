// The pointing hand: a printer's manicule (☞), drawn in the game's ink and paper style. One drawing, used three ways:
// the quest marker in the museum, the "what to do next" nudge on the desk, and Mr. Harrow's pointing in the guided
// sample. A classic script, so both js/world.js and the desk modules can use window.HAND.
//
//   const h = HAND.make(parent, cls, size)   a hand element inside `parent` (hidden until pointed), `size` px wide
//   h.at(x, y, dir)                   fingertip at screen point (x, y); dir 'down' | 'up' | 'left' | 'right'
//   h.to(element)                     point at an element (from above, or from below if it is near the top)
//   h.hide()
(function () {
  function draw() {
    const c = document.createElement('canvas');
    c.width = 184; c.height = 104;
    const x = c.getContext('2d');
    const ink = '#151820', skin = '#e7d9c2', paper = '#efe8d6', coat = '#272833';
    x.lineJoin = 'round'; x.lineCap = 'round';
    const shape = () => {
      const p = new Path2D();
      p.rect(6, 28, 36, 50); // sleeve
      p.rect(38, 24, 16, 58); // cuff
      p.moveTo(54, 32); p.bezierCurveTo(70, 22, 96, 22, 108, 34); // back of the hand
      p.lineTo(168, 34); p.quadraticCurveTo(180, 41, 168, 49); p.lineTo(108, 49); // the pointing finger
      p.bezierCurveTo(112, 58, 108, 66, 100, 68); p.bezierCurveTo(104, 76, 96, 84, 86, 82); // curled fingers
      p.bezierCurveTo(80, 90, 62, 88, 54, 80); p.closePath();
      return p;
    };
    // the paper margin, then a hard shadow, then the drawing
    x.save(); x.strokeStyle = paper; x.lineWidth = 14; x.stroke(shape()); x.fill(shape()); x.restore();
    x.save(); x.translate(3, 3); x.fillStyle = 'rgba(0,0,0,.35)'; x.fill(shape()); x.restore();
    x.fillStyle = coat; x.fillRect(6, 28, 36, 50);
    x.strokeStyle = 'rgba(226,218,198,.5)'; x.setLineDash([4, 3]); x.lineWidth = 1.5; x.strokeRect(10, 32, 28, 42); x.setLineDash([]);
    x.fillStyle = paper; x.fillRect(38, 24, 16, 58);
    const hand = new Path2D();
    hand.moveTo(54, 32); hand.bezierCurveTo(70, 22, 96, 22, 108, 34); hand.lineTo(168, 34); hand.quadraticCurveTo(180, 41, 168, 49);
    hand.lineTo(108, 49); hand.bezierCurveTo(112, 58, 108, 66, 100, 68); hand.bezierCurveTo(104, 76, 96, 84, 86, 82);
    hand.bezierCurveTo(80, 90, 62, 88, 54, 80); hand.closePath();
    x.fillStyle = skin; x.fill(hand);
    x.save(); x.clip(hand); x.fillStyle = 'rgba(21,24,32,.18)'; x.fillRect(54, 60, 70, 40); x.restore();
    x.strokeStyle = ink; x.lineWidth = 3.5; x.stroke(hand);
    x.lineWidth = 2;
    x.beginPath(); x.moveTo(100, 68); x.quadraticCurveTo(88, 64, 80, 66); x.moveTo(86, 82); x.quadraticCurveTo(76, 76, 68, 78); x.stroke(); // finger creases
    x.beginPath(); x.moveTo(70, 30); x.quadraticCurveTo(86, 40, 100, 38); x.stroke(); // the thumb over the knuckles
    x.beginPath(); x.moveTo(160, 37); x.quadraticCurveTo(165, 41, 160, 46); x.stroke(); // the nail
    x.lineWidth = 3; x.strokeRect(6, 28, 36, 50); x.strokeRect(38, 24, 16, 58);
    return c.toDataURL();
  }
  const src = draw();
  // the fingertip, as a fraction of the drawing
  const TIP = { x: 176 / 184, y: 41 / 104 };
  const ROT = { right: 'rotate(0deg)', down: 'rotate(90deg)', up: 'rotate(-90deg)', left: 'scaleX(-1)' };

  function make(parent, cls = '', size = 92) {
    const el = document.createElement('div');
    el.className = `hand ${cls}`;
    el.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.style.width = `${size}px`;
    img.style.height = `${size * 104 / 184}px`;
    img.style.left = `${-TIP.x * size}px`;
    img.style.top = `${-TIP.y * size * 104 / 184}px`;
    el.append(img);
    el.hidden = true;
    parent.append(el);
    return {
      el,
      at(x, y, dir = 'down') {
        el.hidden = false;
        el.style.left = `${Math.round(x)}px`;
        el.style.top = `${Math.round(y)}px`;
        el.style.transform = ROT[dir] || ROT.down;
      },
      to(target, prefer) {
        const t = typeof target === 'string' ? document.querySelector(target) : target;
        if (!t || !t.getClientRects().length) return this.hide();
        const r = t.getBoundingClientRect();
        if (prefer === 'right' || (prefer !== 'down' && r.width > 360 && r.left > 110)) return this.at(r.left - 4, r.top + Math.min(r.height / 2, 22), 'right');
        if (r.top > 90) return this.at(r.left + Math.min(r.width / 2, 60), r.top - 4, 'down');
        return this.at(r.left + Math.min(r.width / 2, 60), r.bottom + 4, 'up');
      },
      hide() { el.hidden = true; },
      remove() { el.remove(); },
    };
  }
  window.HAND = { src, make };
})();
