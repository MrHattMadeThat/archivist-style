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
//   tabs   optional names for the tabs, e.g. { orig: 'In English, 1902' } (the default is "His own words")
//   printedIn  the words are one maker's, but this copy is printed in another's book, so it is filed in THAT box
//              (Pagan's 1797 statement lives in Kilby's 1888 book). The stacks say so.
//   pages  Champlain only: scans of the 1613 book
import { CHAMPLAIN } from './champlain.js';

const PARKMAN_CREDIT = 'Francis Parkman, Pioneers of France in the New World, chapter 3 (preface dated Boston, 1 January 1865). Text from the Project Gutenberg e-text, via the Internet Archive. Public domain.';
const GANONG_CREDIT = 'W. F. Ganong, Dochet (St. Croix) Island: A Monograph. Transactions of the Royal Society of Canada, 1902. Ottawa: J. Hope & Sons. Scan via Canadiana and the Internet Archive. Public domain.';
const LESCARBOT_CREDIT = 'Marc Lescarbot, Histoire de la Nouvelle-France (Paris, 1609; the 1612 edition), as printed with an English translation by W. F. Ganong in Dochet (St. Croix) Island: A Monograph (Transactions of the Royal Society of Canada, 1902). Scan via Canadiana and the Internet Archive. Public domain.';
const LESCARBOT = (what) => ({
  by: 'Marc Lescarbot, a lawyer from Paris who came to Acadia in 1606',
  when: 'Printed in Paris in 1609. This copy is the 1612 edition',
  what,
  words: 'Easy words: retold simply for you, nothing added. The next tab has the original.',
});
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

  // ------------------------------------------------------------------ chapter 2: two accounts (Lescarbot, and Ganong on Lescarbot)
  'lescarbot-winter': {
    title: 'A winter he heard about', look: 'old', box: 'lescarbot',
    meta: LESCARBOT('Pages 477 to 479 of his History of New France'),
    tabs: { orig: 'In English, 1902' },
    body: [
      'When winter came, everyone had to stay indoors. Our people had three big troubles on the island: no wood (the island’s trees had gone into the buildings), no fresh water, and keeping watch every night in case of a surprise attack.',
      'To get water or wood, they had to cross the river, which is more than three times as wide as the Seine on each side. Often they had to keep the boat out a whole day to get what they needed.',
      'Then came the cold and snow. The cider froze in the barrels, and each man’s share was handed out by weight. Many lazy fellows drank melted snow rather than cross the river.',
      'Then came an unknown sickness, like the one Captain Jacques Cartier wrote about. No cure was found.',
      'Thirty-six died of this sickness. Another thirty-six or forty who had it got better when spring came.',
    ],
    orig: [
      'The most needful things having been done, the hoary father, that is to say, the winter, being come, made it necessary to keep to the house and each to live at his own home. During this time our people suffered three principal discomforts on the island, namely, lack of wood (for that which was on the island had been used for the buildings), want of fresh water, and the watching which was done at night through fear of some surprise by the Indians who were encamped at the foot of the island, or some other enemy…',
      'Now, when it was necessary to have fresh water or wood one had to pass the river which is more than thrice as large as the Seine on each side. It is a painful and tedious business. So that it was needful to keep the boat very often a whole day before obtaining the things needed.',
      'Then the cold and snow arrived, and the freezing was so strong that the cider was frozen in the barrels, and it was necessary to portion out the share of each one by weight. As for the wine, it was only served out on certain days of the week. Many lazy fellows drank snow water without taking the trouble to cross the river.',
      'In brief here came a certain unknown sickness like to those which Captain Jacques Cartier has described to us earlier, which for this reason I shall not describe again, to avoid a vain repetition. No remedy was found…',
      'Of this malady there died thirty-six, and another thirty-six or forty who were affected improved by the help of the spring as soon as it came.',
    ],
    credit: LESCARBOT_CREDIT, link: 'https://archive.org/details/cihm_74303',
  },

  'lescarbot-island': {
    title: 'What Lescarbot thought of the island', look: 'old', box: 'lescarbot',
    meta: LESCARBOT('Pages 460 to 462 of his History of New France'),
    tabs: { orig: 'His own words, 1612' },
    body: [
      'The company came to a little island in the middle of the river, which Champlain had gone ahead to look at. It was strong and easy to guard, and the season was getting late, so they decided to stay.',
      'I don’t want to dig into everyone’s reasons for choosing it. But I will always think that people who go to a country to take the land should not stop on islands and make themselves prisoners.',
      'Before everything else, the land must be farmed. How will you farm it if you must cross a wide stretch of water morning, noon and night for everything you need from the mainland?',
      'An island is not a good place to start a colony. Small islands have no streams of fresh water to drink, and no wood to burn.',
      'Above all, you need shelter from bad winds and cold. That is hard to find on a small piece of land with water all around it.',
      'Even so, the company stayed there, in the middle of a wide river where the north and north-west winds blow as they please.',
    ],
    orig: [
      '…ilz vindrent en vne grande riviere (qui est proprement mer) où ilz se camperent en vne petite ile size au milieu de cette riviere, que ledit sieur Champlein avoit esté reconoitre. Et la voyant forte de nature, & de facile garde, joint que la saison commençoit à se passer, & partant falloit penser de se loger, sans plus courir, ilz resolurent de s’y arréter.',
      'Ie ne veux point rechercher curieusement les raisons des vns & des autres sur la resolution de cette demeure, mais je seray toujours d’avis que quiconque va en vn païs pour posseder la terre ne s’arréte point aux iles pour y estre prisonnier.',
      'Car avant toutes choses il faut se proposer la culture d’icelle terre. Et je demanderois volontiers comme on la cultivera s’il faut à toute heure, matin, midi & soir passer avec grand’peine vn large trajet d’eau pour aller aux choses qu’on requiert de la terre ferme?',
      '…vne ile n’est pas propre pour commencer l’établissement d’vne colonie s’il n’y a des courans d’eau douce pour le boire, & le menage, ce qui n’est point en des petites iles. Il faut du bois pour le chauffage: ce qui n’y est point semblablement.',
      'Mais sur tout il faut avoir les abris des mauvais vents, & des froidures: ce qui est difficile de trouver en vn petit espace environné d’eau de toutes parts.',
      'Neantmoins la compagnie s’arréta là au milieu d’vne riviere large où le vent de Nort & de Norouëst bat à plaisir.',
    ],
    credit: LESCARBOT_CREDIT, link: 'https://archive.org/details/cihm_74303',
  },

  'ganong-lescarbot': {
    title: 'How Lescarbot knew', look: 'old', box: 'ganong',
    meta: GANONG('Pages from his study “Dochet (St. Croix) Island”, about the writers he used'),
    body: [
      'There is another account of these events from that time, by the historian Lescarbot. He did not see them himself.',
      'But Lescarbot spent two winters at Port Royal, from 1606 to 1608, with many of the men who had been on St. Croix Island with de Monts, Champlain among them.',
      'The men surely talked about that first winter around the fire on long evenings, and Lescarbot’s notebook must often have been out.',
      'Lescarbot got his facts from Champlain. His story is livelier than Champlain’s, and it has some facts that Champlain leaves out.',
      'One writer has said that Lescarbot was on the island in 1604. But the proof is clear that Lescarbot did not come to Acadia until two years later.',
    ],
    orig: [
      'There is, happily, yet another contemporary account of these events, that by the historian Lescarbot, who, though not himself a witness of them,',
      'spent two winters at Port Royal, 1606-1608, with many of those, including Champlain, who had been at St. Croix Island with de Monts.',
      'Doubtless the events of that first winter were often discussed around the fires at Port Royal during the long winter evenings, and Lescarbot’s ready note-book must have been often in use.',
      'He obtained his facts, of course, from Champlain… Lescarbot’s narrative shows more liveliness and imagination than Champlain’s, and contains many facts not in the latter’s works.',
      '[Willis, in 1861] infers that Lescarbot was at the island in 1604… while the evidence is perfectly conclusive that Lescarbot was not in Acadia until two years later.',
    ],
    credit: GANONG_CREDIT, link: 'https://archive.org/details/cihm_74303',
  },

  // ------------------------------------------------------------------ chapter 3: the ruins that drew a border
  'ganong-boundary': {
    title: 'Which river is the St. Croix?', look: 'old', box: 'ganong',
    meta: GANONG('Pages 198 to 200 of his study “Dochet (St. Croix) Island”'),
    body: [
      'In 1783, the Treaty of Paris ended the war of the American Revolution. It made the St. Croix River, from its source to its mouth, part of the border between the United States and the British lands.',
      'Within a year, people argued about which river was the St. Croix of the treaty. The British said it was the river we call the St. Croix today. The Americans said it was the Magaguadavic.',
      'The French had named the river long before. But by then nobody remembered de Monts’ settlement, so nobody could tell which river was the true St. Croix.',
      'So a commission of three men was chosen to decide. It met at St. Andrews in August 1796, and in Boston in August 1797.',
      'In June or July 1797, the British agent, Ward Chipman, got a copy of Champlain’s map from Europe. He sent a copy to Robert Pagan of St. Andrews, who took it to Dochet Island.',
    ],
    orig: [
      'The Treaty of Paris in 1783, which formally closed the unhappy war of the Revolution, established the St. Croix river from its source to its mouth as a part of the International Boundary between the United States and the British Possessions.',
      'The Treaty was not a year old, however, before disputes arose locally as to the identity of the River St. Croix of the Treaty, the British residents claiming the present river of that name, and the American residents claiming the Magaguadavic.',
      'All that was definitely known about the River St. Croix was that it was one of the rivers emptying into Passamaquoddy Bay which had been named by the French when they settled there. But all tradition of de Monts’ settlement had long since vanished…',
      '…a commission of three men… The commission assembled at St. Andrews, New Brunswick, in August, 1796… When the commission met in Boston in August, 1797, very lengthy arguments were submitted by the agents of the two countries.',
      'In June or July, 1797, Mr. Chipman, the British agent, received from Europe a copy of Champlain’s map of 1604, which now became known to the members of the commission for the first time. He sent a copy of this map to Robert Pagan, a prominent citizen of St. Andrews, who, guided by the map, proceeded to Dochet Island…',
    ],
    credit: GANONG_CREDIT, link: 'https://archive.org/details/cihm_74303',
  },

  'pagan-1797': {
    title: 'A sworn statement about the ruins', look: 'old', box: 'kilby', printedIn: 'Kilby’s book, 1888',
    meta: {
      by: 'Robert Pagan, of St. Andrews, N.B.',
      when: 'Sworn at St. Andrews on 20 July 1797',
      what: 'A sworn statement for the Boundary Commission, printed in W. H. Kilby’s book Eastport and Passamaquoddy (1888)',
      words: 'Easy words: retold simply for you, nothing added. Kilby’s printing is in the next tab.',
    },
    tabs: { orig: 'As Kilby printed it, 1888' },
    body: [
      'Robert Pagan says that he got a plan of St. Croix Island, said to be printed in Paris in 1613. He compared it with the shores, coves and points of Doceas Island, a few miles below the mouth of the Scudiac River. Every part of these shores agreed most strikingly with the plan.',
      'On the 7th day of this July, he went to Doceas Island with William Cookson, Thomas Greenlaw, Nehemiah Gilman and John Rigby, to look for more.',
      'At the north end of the island, where the plan shows the French buildings, he found four piles of ruins. They stand just where the plan shows the spot marked A.',
      'The piles were raised above the ground around them. Tree roots and fallen trees lay over some of them, and mould and rotten leaves 6 to 18 inches deep covered them all.',
      'Inside were layers of stone laid in clay mortar. There were marks of fire on the stones in many places.',
      'Digging, he found charcoal and part of a stone pitcher. Bricks laid together showed him that a large oven had once been built there.',
      'On the 18th of July he went back with a large party. Digging with a spade for a few minutes, they turned up a metal spoon, a musket ball, a piece of an earthen pot and a spike nail. All had clearly been underground a long time.',
      'Signed by Robert Pagan, and sworn at St. Andrews on 20 July 1797, before Daniel McMasters, Justice of the Peace.',
    ],
    orig: [
      'Robert Pagan declares that having obtained a plan of St. Croix Island said to have been published in Paris Anno 1613, and having compared it with the shore, coves, and points, of the Island laying a few miles below the mouth of the Scudiac River at the Devil’s head, commonly called Doceas Island, and also with the shore &c. of the main land westward and eastward of it as laid down in that plan, and having found a most striking agreement between every part of these shores, coves and points and that plan.',
      'He on the 7th day of this instant July went to said Doceas Island accompanied by William Cookson, Thomas Greenlaw, Nehemiah Gilman and John Rigby for the purpose of making further discoveries there.',
      'On the north end of said Doceas Island where in the plan above mentioned the French buildings are laid down, he found four distinct piles of ruins agreeing in their situation and distances from each other with the spot at A as laid down in that plan…',
      'On examining these piles he found them considerably raised above the general level of the ground around them, some parts of them covered with roots of trees and windfalls, and all of them with mould and rotten leaves from six to eighteen inches deep.',
      'On further examining he discovered distinctly several tiers of stone in each of the piles, laid in clay mortar one on the top of another… there are evident marks of fire on the stones in many places.',
      'In digging he found charcoal in a perfect state only it was easily crumbled to pieces in handling, he also found part of a stone pitcher in full preservation. On one side of one of the piles he discovered a number of bricks so laid together as to convince him that a large oven had formerly been built there.',
      'He further declares — That on the 18th day of this instant July being at said Doceas Island on a party of pleasure with a large company… In digging with a spade for a few minutes near one of these piles they turned up a metal spoon, a musket ball, a piece of an earthen vessel, and a spike nail, all of which bore evident marks of having laid a long time under the surface.',
      'This deposition is signed by Robert Pagan, and sworn to at St. Andrews, July 20, 1797, before Daniel McMasters, Justice of the Peace. [Kilby’s note]',
    ],
    credit: 'Robert Pagan’s deposition of 20 July 1797, as printed in W. H. Kilby, Eastport and Passamaquoddy: A Collection of Historical and Biographical Sketches (Eastport, Maine: Edward E. Shead & Company, 1888), pages 124–125. Also printed by Ganong, 1902. Scan via the Internet Archive. Public domain.',
    link: 'https://archive.org/details/eastportpassamaq00kilb',
  },

  'wright-1797': {
    title: 'The surveyor’s statement', look: 'old', box: 'ganong', printedIn: 'Ganong’s study, 1902',
    meta: {
      by: 'Thomas Wright, Surveyor General of the Island of St. John (now Prince Edward Island)',
      when: 'Sworn at St. Andrews on 24 October 1797',
      what: 'Two sworn statements for the Boundary Commission, printed in W. F. Ganong’s study Dochet (St. Croix) Island (1902)',
      words: 'Easy words: retold simply for you, nothing added. Ganong’s printing is in the next tab.',
    },
    tabs: { orig: 'As Ganong printed it, 1902' },
    body: [
      'Thomas Wright says he compared the French settlers’ plan of the island with his own survey of 1772: its place, its size and its shape.',
      'They matched so closely that he had not the least doubt. Bone Island was the very spot where the French made their settlement.',
      'No other place in the whole of Passamaquoddy Bay fits the French description and plan.',
      'On the 11th and 12th of October 1797 he surveyed the island. He took bricks from under a cedar and a fir tree that were ten to twelve inches thick at the base.',
      'All around the island he did not see a single stream or spring of fresh water. The men with him searched hard for some to drink, but they had to send to the mainland for it.',
      'Near the old foundations he saw several deep holes that seemed to have been dug in search of water.',
    ],
    orig: [
      '…Have compared it in every particular respecting the situation (as described by the said French Settlers) its measurement, shape, &c, with that of my said Survey made in 1772;',
      'and find such the said French Description and plan of the said Isle de Sainte Croix, so very nearly to correspond therewith as to leave me not the least room for doubt, that the said Isle de St. Croix or Bone Island was the Identical spot on which the said Frenchmen made their settlement…',
      '…there is no other situation to be found in the circuit of the whole Bay of Passamaquoddy to which such the said French Description of and plan would in the least apply to…',
      '[whilst on the Survey thereof October the eleventh and twelfth 1797] …he took some Bricks from under a Cedar and Fir Tree (whilst the people were grubbing and pulling them down) which trees measured from ten to twelve Inches through at their But…',
      '8th. In surveying around the Island, he did not observe the least Run, or any Springs, of fresh water; though the People with him made diligent Search for some to drink; but, they were obliged to send to the Main Land for some.',
      '9th. In the Neighbourhood of the before mentioned Foundations and piles of (to Appearance) tumbled chimnies, he observed several deep Holes that seemed to have been dug in Search of Water.',
    ],
    credit: 'Thomas Wright’s depositions of 24 October 1797, from the manuscript records of the Boundary Commission, as first printed in W. F. Ganong, Dochet (St. Croix) Island: A Monograph (Transactions of the Royal Society of Canada, 1902), pages 202–204. Scan via Canadiana and the Internet Archive. Public domain.',
    link: 'https://archive.org/details/cihm_74303',
  },

  'ganong-decision': {
    title: 'How much did the island matter?', look: 'old', box: 'ganong',
    meta: GANONG('Pages 208 to 210 of his study “Dochet (St. Croix) Island”'),
    body: [
      'The American agent said the ruins were not proven to be de Monts’ settlement. He said they were more likely an early trading post from later French times.',
      'But the commissioners all agreed that the St. Croix of the treaty was the same river as the St. Croix of de Monts and Champlain. So the island proved which river it was.',
      'On October 25, 1798, they decided together that the Scoodic, the river we call the St. Croix today, was the true St. Croix of the treaty. It became the border we know today.',
      'It is too much to say that the border depended on the island alone. There was probably enough other evidence to give the same result.',
      'But one commissioner at first believed strongly in the Magaguadavic. Without the evidence from the island, the commissioners would probably have been divided instead of all agreeing.',
      'So Dochet Island has done a little for peace between nations.',
    ],
    orig: [
      'The latter claimed that the ruins were not proven to be those of de Monts’ settlement, but were much more likely those of some early trading post of Razilly or other early Seignior…',
      'The commissioners, however, unanimously agreed that the St. Croix of the Treaty could be traced back continuously to the St. Croix of de Monts and Champlain, and that the two were one and the same river. Hence Isle St. Croix proved the identity of the river.',
      'On October 25, 1798, they rendered a unanimous decision in which they declared the Scoodic, or present St. Croix, to be the River St. Croix truly intended by the Treaty of 1783, and it thus became the International Boundary as we know it to-day.',
      'It is too much to say that upon it alone depended the identification of the river and hence its selection as the boundary, for there was probably enough other evidence to have produced the same result.',
      'But, on the other hand, it is very probable, since one of the commissioners is known to have held at first strongly for the Magaguadavic, that without the evidence drawn from the island, the commissioners would have been divided in opinion instead of unanimous.',
      'Dochet Island, therefore, has contributed somewhat to the peace between nations.',
    ],
    credit: GANONG_CREDIT, link: 'https://archive.org/details/cihm_74303',
  },
};

// The archive boxes in the basement. Shelves are by the maker's name, A to Z, the way an archive keeps papers together
// by who made them. A few boxes are only there to be looked past.
export const SHELVES = [
  { id: 'a-f', name: 'A – F', boxes: ['bird-labels', 'champlain'] },
  { id: 'g-o', name: 'G – O', boxes: ['ganong', 'gesner', 'kilby', 'lescarbot', 'society'] },
  { id: 'p-z', name: 'P – Z', boxes: ['parkman', 'stewart', 'visitors'] },
];

export const BOXES = {
  champlain: { maker: 'CHAMPLAIN, Samuel de', what: 'His book of voyages', year: '1613', place: 'Paris' },
  parkman: { maker: 'PARKMAN, Francis', what: 'Pioneers of France in the New World', year: '1865', place: 'Boston' },
  ganong: { maker: 'GANONG, W. F.', what: 'Dochet (St. Croix) Island', year: '1902', place: 'Ottawa' },
  stewart: { maker: 'STEWART, George, Jr.', what: 'The Story of the Great Fire in St. John', year: '1877', place: 'Toronto' },
  lescarbot: { maker: 'LESCARBOT, Marc', what: 'History of New France', year: '1612', place: 'Paris' },
  kilby: { maker: 'KILBY, W. H.', what: 'Eastport and Passamaquoddy', year: '1888', place: 'Eastport, Maine' },
  gesner: { maker: 'GESNER, Abraham', what: 'Catalogue of his museum', year: '1842', place: 'Saint John', decoy: true },
  society: { maker: 'NATURAL HISTORY SOCIETY', what: 'Minutes of meetings', year: '1890–1899', place: 'Saint John', decoy: true },
  'bird-labels': { maker: 'BIRDS & MAMMALS ROOM', what: 'Old specimen labels', year: '1904', place: 'Saint John', decoy: true },
  visitors: { maker: 'VISITORS’ BOOKS', what: 'Signed at the door', year: '1906–1909', place: 'Saint John', decoy: true },
};

export const shelfOf = (boxId) => SHELVES.find((s) => s.boxes.includes(boxId));
