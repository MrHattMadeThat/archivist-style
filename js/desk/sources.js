// Every paper the source desk can show. A paper needs a real, public-domain source that existed by 1910 (the game is
// set in Saint John, 1910): no modern web pages on this desk. Copies of the texts are in docs/source-texts/, and
// docs/SOURCES.md says where each came from. Don't add facts from memory.
//
//   look   'old' (a printed page) | 'map'
//   box    which archive box it is filed in (see BOXES): filing is by WHO MADE IT and WHEN, never by primary/secondary
//   meta   the label: by, when, what, words. Each line can be clicked as proof.
//   body   easy words, in paragraphs. Each sentence can be clicked as proof. Nothing added to what the source says.
//   orig   the source's own words (shown in a tab, for reading)
//   en/fr  Champlain only: Otis's 1878 English and the 1613 French
//   pages  Champlain only: scans of the 1613 book
import { CHAMPLAIN } from './champlain.js';

const PARKMAN_CREDIT = 'Francis Parkman, Pioneers of France in the New World, chapter 3 (preface dated Boston, 1 January 1865). Text from the Project Gutenberg e-text, via the Internet Archive. Public domain.';
const GANONG_CREDIT = 'W. F. Ganong, Dochet (St. Croix) Island: A Monograph. Transactions of the Royal Society of Canada, 1902. Ottawa: J. Hope & Sons. Scan via Canadiana and the Internet Archive. Public domain.';
const GANONG = (what) => ({
  by: 'W. F. Ganong, a scholar who wrote a long study of the island',
  when: 'Written in 1902, printed in Ottawa',
  what,
  words: 'Easy words: retold simply for you, nothing added. His own words are in the next tab.',
});

export const SOURCES = {
  ...CHAMPLAIN,

  // the guided sample: a different subject, so the new archivist sees the method, not the answer to their first stack
  'stewart-fire': {
    title: 'The Great Fire of 1877', look: 'old', box: 'stewart',
    meta: {
      by: 'George Stewart, Jr., of St. John, N.B.',
      when: 'Printed in 1877, the same year as the fire',
      what: 'Chapter 1 of his book The Story of the Great Fire in St. John, N.B.',
      words: 'Easy words: retold simply for you, nothing added. His own words are in the next tab.',
    },
    body: [
      'One of the worst fires of modern times happened in St. John, N.B., on Wednesday, June 20, 1877.',
      'In only nine hours, two-fifths of the city burned, and 1,612 houses were destroyed. At one time, three parts of the city were burning at once.',
      'Thick smoke rolled up into the sky. A brisk north-west wind carried burning embers for miles. Men and women stood frozen in the streets.',
      'Even old stone buildings that had stood for sixty years crumbled. About 200 acres burned: all of the city south of King Street.',
      'Fires are nothing new here. The first fire we know of was on June 18, 1784, when eleven houses burned.',
    ],
    orig: [
      'One of the most destructive fires of modern times occurred at St. John, N.B., on Wednesday, the 20th June, 1877.',
      '…in St. John an immense area of territory was destroyed in the incredibly short space of nine hours, and fully two-fifths of the entire city were laid in ashes, and one thousand six hundred and twelve houses levelled to the earth… At one time three portions of the city were burning at once…',
      'The blinding smoke rolled heavenwards in a thick heavy mass; the flying embers were carried along for miles, and the brisk north-western wind brought the destroying flame to a thousand households. Men and women stood paralyzed in the streets, fearing the worst and hoping against hope.',
      'Even old stone buildings that had stood for sixty years, in the outskirts of the city, and had withstood many a serious fire before, now crumbled and tumbled before the conquering scourge. 200 acres were destroyed, all that part of the city south of King Street…',
      'A glance at the earlier history of St. John will show that destructive fires have been of frequent occurrence… In 1784, on Friday, the 18th June, the first fire of which we have any knowledge took place… Eleven houses were burned…',
    ],
    credit: 'George Stewart, Jr., The Story of the Great Fire in St. John, N.B., June 20th, 1877 (Toronto: Belford Brothers, 1877), chapter 1. Text from the Project Gutenberg e-text, via the Internet Archive. Public domain.',
    link: 'https://archive.org/details/thestoryofthegre39260gut',
  },

  parkman: {
    title: 'A historian tells the story', look: 'old', box: 'parkman',
    meta: {
      by: 'Francis Parkman, a writer of history in Boston',
      when: 'Written in 1865',
      what: 'Part of chapter 3, “Acadia Occupied”, of his book Pioneers of France in the New World',
      words: 'Easy words: retold simply for you, nothing added. His own words are in the next tab.',
    },
    body: [
      'Champlain found a small island near the mouth of the river, fenced round with rocks. He named it St. Croix. Choosing this spot was very unlucky. It controlled the river and was easy to defend, but those were its only good points.',
      'Before winter, the north end of the island was covered with buildings around a square. Champlain tried to make a garden, but nothing would grow in the sandy soil. Champlain showed all of this in plans and drawings in his little book of 1613.',
      'Seventy-nine men stayed on the island for the winter. Ice swept past the island with the tide and often cut them off from wood and water on the mainland. Cider and wine froze in the barrels and were handed out by the pound.',
      'Then scurvy broke out. Of the seventy-nine, thirty-five died before spring.',
      'Spring came at last. On the sixteenth of June, Pontgravé arrived from France with forty men.',
    ],
    orig: [
      'Near its mouth he found an islet, fenced round with rocks and shoals, and called it St. Croix, a name now borne by the river itself. With singular infelicity this spot was chosen as the site of the new colony. It commanded the river, and was well fitted for defence: these were its only merits…',
      'Before the winter closed in, the northern end of the island was covered with buildings, surrounding a square… Adjacent there was an attempt at a garden, under the auspices of Champlain; but nothing would grow in the sandy soil… Such was the “Habitation de l’Isle Saincte-Croix,” as set forth by Champlain in quaint plans and drawings, in that musty little quarto of 1613…',
      'Seventy-nine men remained at St. Croix… Ice in sheets, or broken masses, swept by their island with the ebbing and flowing tide, often debarring all access to the main, and cutting off their supplies of wood and water… Cider and wine froze in the casks, and were served out by the pound.',
      'Soon the scurvy broke out, and raged with a fearful malignity. Of the seventy-nine, thirty-five died before spring, and many more were brought to the verge of death.',
      'Spring came at last… Pontgrave, with forty men, cast anchor before their island on the sixteenth of June…',
    ],
    credit: PARKMAN_CREDIT, link: 'https://archive.org/details/pioneersoffrance03721gut',
  },

  'ganong-winter': {
    title: 'Why the French left the island', look: 'old', box: 'ganong',
    meta: GANONG('Pages from his study “Dochet (St. Croix) Island”'),
    body: [
      'Champlain and Lescarbot both left full accounts of that winter. They show it must have been a very harsh winter, maybe an extremely harsh one.',
      'More than anything else, that winter made the French give up St. Croix.',
      'Had that first winter been a mild one, the settlement would not have moved to Port Royal. The St. Croix valley would have become the centre of French power in Acadia.',
    ],
    orig: [
      'The full account of that winter left us by Champlain and Lescarbot, and given later in this paper, shows that it must have been one of marked, if not of extreme, severity.',
      'This, without doubt, more than anything else, determined the abandonment of the St. Croix as the site of a settlement.',
      'Had that first winter been a mild one, the settlement would not have been removed to Port Royal; and the St. Croix valley, if not the island itself, would have become the centre of French settlement and power in Acadia.',
    ],
    credit: GANONG_CREDIT, link: 'https://archive.org/details/cihm_74303',
  },

  'ganong-island': {
    title: 'The island in Ganong’s day', look: 'old', box: 'ganong',
    meta: GANONG('A note at the foot of a page in his study “Dochet (St. Croix) Island”'),
    body: [
      'The thirty-five men who died that winter were surely buried in the cemetery shown on Champlain’s map, on a little knoll.',
      'That knoll is now almost all washed away. All that is left is a small rise where the birch trees stand.',
      'The keeper of the lighthouse tells me that some years ago he dug up human bones where the garden was, near the north end of the island.',
      'The bones washing out of the bank probably gave the island its old name: Bone Island.',
    ],
    orig: [
      'These thirty-five were without doubt buried in the cemetery shown as occupying a little knoll on Champlain’s map. This knoll is now almost entirely washed away, though its position is readily recognizable, and its only remnant is the slight rise where the birch trees stand at the north entrance to Treats Cove.',
      'It was very probably the exposure of the skeletons of these victims of the scurvy by the washing away of the bank which gave origin to the former name of the island, Bone Island. The keeper of the lighthouse tells me that some years ago he dug up human bones on the site of the garden near the north end of the island…',
    ],
    credit: GANONG_CREDIT, link: 'https://archive.org/details/cihm_74303',
  },
};

// The archive boxes in the basement. Shelves are by the maker's name, A to Z, the way an archive keeps papers together
// by who made them. A few boxes are only there to be looked past.
export const SHELVES = [
  { id: 'a-f', name: 'A – F', boxes: ['bird-labels', 'champlain'] },
  { id: 'g-o', name: 'G – O', boxes: ['ganong', 'gesner', 'society'] },
  { id: 'p-z', name: 'P – Z', boxes: ['parkman', 'stewart', 'visitors'] },
];

export const BOXES = {
  champlain: { maker: 'CHAMPLAIN, Samuel de', what: 'His book of voyages', year: '1613', place: 'Paris' },
  parkman: { maker: 'PARKMAN, Francis', what: 'Pioneers of France in the New World', year: '1865', place: 'Boston' },
  ganong: { maker: 'GANONG, W. F.', what: 'Dochet (St. Croix) Island', year: '1902', place: 'Ottawa' },
  stewart: { maker: 'STEWART, George, Jr.', what: 'The Story of the Great Fire in St. John', year: '1877', place: 'Toronto' },
  gesner: { maker: 'GESNER, Abraham', what: 'Catalogue of his museum', year: '1842', place: 'Saint John', decoy: true },
  society: { maker: 'NATURAL HISTORY SOCIETY', what: 'Minutes of meetings', year: '1890–1899', place: 'Saint John', decoy: true },
  'bird-labels': { maker: 'BIRDS & MAMMALS ROOM', what: 'Old specimen labels', year: '1904', place: 'Saint John', decoy: true },
  visitors: { maker: 'VISITORS’ BOOKS', what: 'Signed at the door', year: '1906–1909', place: 'Saint John', decoy: true },
};

export const shelfOf = (boxId) => SHELVES.find((s) => s.boxes.includes(boxId));
