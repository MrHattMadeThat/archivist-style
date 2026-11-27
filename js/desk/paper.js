// The morning paper: The Standard, Saint John, Wednesday 18 May 1910, page 1. A real newspaper (public domain), from
// the Library and Archives Canada microfilm on Canadiana. The day the Earth passed through the tail of Halley's comet.
//
// Two tabs: "The front page" sets a few of the page's articles in type, word for word (only spelling of the scan's
// smudges fixed; […] marks what is left out), and "The real page" shows the scan, with the two comet stories marked.
// Left out on purpose: grim accidents, and one paragraph in the Portland story written in the racist language of the
// day. The scan is the whole page, as printed. Sources: docs/SOURCES.md.
//
// openPaper(root, { onClose(read) }): read = the set of article ids the student opened (they all start folded shut on
// a phone-sized screen; on the lab PCs every article is open, so read lists them all).
import { el, button } from './dom.js';

const SCAN = 'sources/standard-1910-05-18-p1.jpg';
const LINK = 'https://www.canadiana.ca/view/oocihm.N_00384_19100518';
const CREDIT = 'The Standard (Saint John, N.B.), Vol. II, No. 47, Wednesday, May 18, 1910, page 1. Library and Archives Canada microfilm, via Canadiana. Public domain.';

// [id, headline lines, decks, paragraphs, scan box (% of the page: x, y, w, h) or null]
const ARTICLES = [
  {
    id: 'blake', big: true,
    head: ['PROF. BLAKE', 'ON THE COMET'],
    decks: ['Chief Of The Toronto Observatory Staff Says Earth Will Be Immersed In Tail For Several Hours.'],
    body: [
      'Special to The Standard.',
      'Toronto, May 17.—“We will go through the tail of the comet and will be immersed in it for several hours,” said Prof. Blake of the observatory today.',
      'This, according to Prof. Blake, will occur tomorrow night between nine and eleven o’clock. “While we are passing through the tail I don’t expect any great change,” said Prof. Blake. “We are going to travel right through the thin part of it and it is so much less dense than the atmosphere on the earth that it will scarcely be noticed. There may be magnetic charges. These will be noted at our station at Agincourt. There may be a faint glow in the air but we really cannot tell just what will happen.”',
      'The comet will be nearest to the earth on Thursday night, when it will approach within 14,000,000 miles.',
    ],
    scan: [57, 58, 13.5, 16],
  },
  {
    id: 'portland', big: true,
    head: ['COMET WORKS', 'DESTRUCTION', 'AT PORTLAND'],
    decks: ['Many Serious Mishaps Recorded In One Day—One Man Crushed To Death—Want Comet Pills.'],
    body: [
      'Portland, Me., May 17—The approach of the comet’s tail was noted by strange happenings in Portland today. George Tufts hired a truckman and hauled from a house on Morning street a couple of chests of carpenter’s tools belonging to some workmen. He sold the tools to the truckman, but was arrested later.',
      'Mrs. Carrie Buell fell backwards from a piazza of a cottage at Peak’s Island, a distance of eight feet and struck a rock. She will recover.',
      'The two year old daughter of Daniel Herrick fell from a second story window and escaped with a few scratches. […]',
      'Comet pills would find a ready sale here. […]',
      'SHOWER OF METEORS. Des Moines, Iowa, May 17.—Prof. D. F. Morehouse, astronomer at Drake university tonight reported that he saw a brilliant and beautiful meteor shower at 2.30 this morning in the east. He stated that the shower was due to Halley’s comet.',
    ],
    scan: [70.5, 16, 14.5, 36],
  },
  {
    id: 'king',
    head: ['LONDON WRAPPED', 'IN SILENT GRIEF'],
    decks: ['Signs of Mourning Among All Classes The Feature of Funeral March Through Streets.', 'Royalties Arriving in London as King’s Body Lies in State at Westminster.'],
    body: ['London, May 17.—Simple ceremonies marked the removal today of the body of Edward VII from Buckingham Palace to Westminster Hall […]'],
    scan: null,
  },
  {
    id: 'cpr',
    head: ['ALL WORK ON', 'C.P.R. CEASES'],
    decks: ['For Three Minutes On Friday Not a Wheel Will Turn Out Of Respect To The Late King.'],
    body: [],
    scan: null,
  },
  {
    id: 'cook',
    head: ['DR. COOK SAID TO', 'HAVE BEEN IN', 'NEW YORK'],
    decks: ['A. S. Cheeseborough In St. John Last Week In Communication With Long Missing Explorer.', 'THOUGHT TO BE AT BROTHER’S HOME'],
    body: [
      'New York, May 17.—A rumor is going the rounds that won’t be downed to the effect that Dr. Frederick A. Cook, the Bushwick explorer who said he went to the north pole, is back in town. He mysteriously disappeared from the Gramatan Inn, Bronxville, Nov. 24 last, and was not located until several months later, when he was discovered in Chile by an American tourist, who said the explorer was registering at South American hotels as “F. Craig.” […]',
    ],
    scan: null,
  },
  {
    id: 'peary',
    head: ['COMMANDER PEARY', 'HONORED IN VIENNA'],
    decks: [],
    body: [],
    scan: null,
  },
];

export function openPaper(root, { onClose } = {}) {
  const read = new Set(ARTICLES.map((a) => a.id));
  let tab = 'type', zoom = 1;
  const wrap = el('div', 'newsroom');
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-label', 'The Standard, Wednesday, May 18, 1910');
  root.append(wrap);
  document.body.dataset.overlay = 'paper';

  function render() {
    wrap.replaceChildren();
    const bar = el('header', 'news-bar');
    const tabs = el('div', 'news-tabs');
    for (const [k, name] of [['type', 'The front page'], ['scan', 'The real page, 1910']]) {
      const b = button(`news-tab${tab === k ? ' on' : ''}`, name);
      b.setAttribute('aria-pressed', tab === k);
      b.onclick = () => { tab = k; render(); };
      tabs.append(b);
    }
    const shut = button('leave', 'Fold up the paper');
    shut.onclick = close;
    bar.append(el('div', 'news-kicker', 'Your morning paper'), tabs, shut);
    wrap.append(bar);
    const body = el('div', `news-body ${tab}`);
    body.append(tab === 'type' ? frontPage() : scanPage());
    const foot = el('footer', 'news-credit');
    foot.append(CREDIT, ' ');
    const a = el('a', null, 'See it on Canadiana');
    a.href = LINK; a.target = '_blank'; a.rel = 'noopener';
    foot.append(a);
    body.append(foot);
    wrap.append(body);
    wrap.querySelector('.news-tab.on')?.focus({ preventScroll: true });
  }

  function frontPage() {
    const page = el('article', 'sheet-news');
    const mast = el('div', 'mast');
    mast.append(el('div', 'ear', 'Latest Morning Edition'), el('h1', 'mast-title', 'The Standard.'), el('div', 'ear', 'The World’s News'));
    const date = el('div', 'dateline');
    date.append(el('span', null, 'VOL. II. NO. 47.'), el('span', null, 'THE WEATHER: Fair.'), el('span', null, 'SAINT JOHN, CANADA, WEDNESDAY, MAY 18, 1910.'), el('span', null, 'SINGLE COPY TWO CENTS'));
    page.append(mast, date);
    const cols = el('div', 'news-cols');
    for (const a of ARTICLES) {
      const s = el('section', `story${a.big ? ' big' : ''}`);
      const h = el('h2', 'head');
      a.head.forEach((ln, i) => { if (i) h.append(el('br')); h.append(ln); });
      s.append(h);
      for (const d of a.decks) s.append(el('p', 'deck', d));
      for (const p of a.body) s.append(el('p', p === 'Special to The Standard.' ? 'special' : null, p));
      if (!a.body.length) s.append(el('p', 'more', 'The rest of this story is on the real page.'));
      cols.append(s);
    }
    page.append(cols, el('p', 'news-note', '[…] marks parts left out here. Some stories are cut short. The whole page, as it was printed in 1910, is in the next tab.'));
    return page;
  }

  function scanPage() {
    const box = el('div', 'scanbox');
    const tools = el('div', 'scan-tools');
    for (const [z, name] of [[1, 'Whole page'], [2.2, 'Zoom in']]) {
      const b = button(`news-tab${zoom === z ? ' on' : ''}`, name);
      b.onclick = () => { zoom = z; render(); };
      tools.append(b);
    }
    tools.append(el('span', 'small', 'The two comet stories are marked. Drag the scroll bars to read the rest.'));
    const holder = el('div', 'scan-holder');
    const fig = el('div', 'scan-page');
    // the whole page fits the height of the screen; zoomed in, it is wider than the screen and scrolls
    fig.style.width = zoom === 1 ? `calc((100vh - 175px) * ${2000 / 2750})` : `${zoom * 100}%`;
    const img = el('img');
    img.src = SCAN;
    img.alt = 'The front page of The Standard, Saint John, Wednesday, May 18, 1910';
    fig.append(img);
    for (const a of ARTICLES.filter((x) => x.scan)) {
      const [x, y, w, h] = a.scan;
      const m = el('div', 'scan-mark');
      Object.assign(m.style, { left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` });
      m.append(el('span', null, a.head.join(' ')));
      fig.append(m);
    }
    holder.append(fig);
    box.append(tools, holder);
    return box;
  }

  function onKey(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onKey);
  function close() {
    document.removeEventListener('keydown', onKey);
    delete document.body.dataset.overlay;
    wrap.remove();
    delete window.paper;
    onClose?.(read);
  }
  window.paper = { close, get tab() { return tab; } };
  render();
}
