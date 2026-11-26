// One paper on the desk: the label (a typed archive tag), then the easy words, with tabs for the original words and
// the page scans. Ported from ../archive-desk/src/engine/doc.js and restyled for the 1910 office.
//
// renderDoc(p, opts) returns a fresh element. opts:
//   pointing   true while a task wants proof: every line can be clicked
//   selected   the key of the chosen line
//   stamp      { kind: 'primary'|'secondary', q: 'question 1', fresh } the ink on this paper for this task
//   version    which tab is open
//   zone       third hint: 'label' or a paragraph number to outline
//   onPoint(key), onVersion(v)
import { el, button } from './dom.js';

const TAB = {
  plain: 'Easy words',
  orig: 'His own words',
  en: 'English, 1878',
  fr: 'French, 1613',
  page: (src) => (src.look === 'map' ? 'The map' : src.pages?.length > 1 ? 'The 1613 pages' : 'The 1613 page'),
};

export function versionsOf(src) {
  const v = ['plain'];
  if (src.pages?.length && src.pageFirst) v.unshift('page');
  if (src.orig) v.push('orig');
  if (src.en) v.push('en');
  if (src.fr) v.push('fr');
  if (src.pages?.length && !src.pageFirst) v.push('page');
  return v;
}

function line(span, opts, tag = 'span') {
  const s = el(tag, 'line', span.text);
  s.dataset.key = span.key;
  if (opts.pointing) {
    s.classList.add('pointable');
    s.tabIndex = 0;
    s.setAttribute('role', 'button');
    s.title = 'Use this line as your proof';
    s.addEventListener('click', () => opts.onPoint?.(span.key));
    s.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onPoint?.(span.key); } });
  }
  if (opts.selected === span.key) {
    s.classList.add('chosen');
    s.setAttribute('aria-pressed', 'true');
  }
  return s;
}

export function renderDoc(p, opts = {}) {
  const src = p.src;
  const versions = versionsOf(src);
  const version = versions.includes(opts.version) ? opts.version : versions[0];
  const sheet = el('article', `sheet look-${src.look}${opts.pointing ? ' pointing' : ''}${opts.stamp ? ' stamped' : ''}`);

  sheet.append(el('h2', 'sheet-title', src.title));

  // the label: who made it, when, what it is. Always pointable, whatever tab is open.
  const label = el('dl', `tag${opts.zone === 'label' ? ' zone' : ''}`);
  for (const m of p.meta) {
    const row = el('div', 'tag-row');
    row.append(el('dt', null, m.label));
    const dd = el('dd');
    dd.append(line(m, opts));
    row.append(dd);
    label.append(row);
  }
  sheet.append(label);

  if (versions.length > 1) {
    const tabs = el('div', 'tabs');
    tabs.setAttribute('role', 'tablist');
    for (const v of versions) {
      const name = typeof TAB[v] === 'function' ? TAB[v](src) : TAB[v];
      const b = button(`tab${v === version ? ' on' : ''}`, name);
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', v === version);
      b.onclick = () => opts.onVersion?.(v);
      tabs.append(b);
    }
    sheet.append(tabs);
  }

  const body = el('div', `body v-${version}`);
  if (version === 'plain') {
    p.paras.forEach((para, i) => {
      const pe = el('p', opts.zone === i + 1 ? 'zone' : null);
      pe.dataset.n = i + 1;
      para.forEach((s, j) => { if (j) pe.append(' '); pe.append(line(s, opts)); });
      body.append(pe);
    });
  } else if (version === 'page') {
    for (const pg of src.pages) {
      const fig = el('figure', 'scan');
      const wrap = el('div', 'scan-wrap');
      const img = el('img');
      img.src = pg.src;
      img.alt = `${src.title}: ${pg.label}`;
      img.loading = 'lazy';
      wrap.append(img);
      for (const [a, b] of pg.marks || []) {
        const band = el('div', 'band');
        band.style.top = `${a}%`;
        band.style.height = `${b - a}%`;
        wrap.append(band);
      }
      fig.append(wrap, el('figcaption', null, pg.label + (pg.marks?.length ? ' · the shaded bands mark the passage' : '')));
      body.append(fig);
    }
  } else {
    for (const par of src[version]) body.append(el('p', 'orig', par));
  }
  if (version !== 'plain' && opts.pointing) {
    const note = el('p', 'tabnote');
    const back = button('linkish', 'Easy words');
    back.onclick = () => opts.onVersion?.('plain');
    note.append('To pick a line of the text as proof, go back to ', back, '. (The label above works from any tab.)');
    body.prepend(note);
  }
  sheet.append(body);

  const foot = el('footer', 'credit');
  foot.append(src.credit || '');
  if (src.link) {
    foot.append(' ');
    const a = el('a', null, 'See the original');
    a.href = src.link;
    a.target = '_blank';
    a.rel = 'noopener';
    foot.append(a);
  }
  sheet.append(foot);

  if (opts.stamp) {
    const ink = el('div', `ink ink-${opts.stamp.kind}${opts.stamp.fresh ? ' fresh' : ''}`);
    ink.append(el('b', null, opts.stamp.kind === 'primary' ? 'PRIMARY' : 'SECONDARY'), el('small', null, `for ${opts.stamp.q}`));
    sheet.append(ink);
  }
  return sheet;
}
