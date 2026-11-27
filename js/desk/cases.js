// The source desk's cases. Word every task with docs/WRITING_TASKS.md: one question, where to look, what the proof
// must show. `node scripts/check.mjs` checks every proof ref finds exactly one line.
//
// A case has one research question (rq) unless a task brings a new one (case 3 does: same paper, new question).
//   rq.text      the question, word for word as it shows on the desk
//   rq.marks     the words the student clicks in "Read the question": [{ tag: 'WHEN', words }, ...]
//   rq.primary   what PRIMARY means for this question, in plain words (shown on the stamp button)
//   rq.secondary what SECONDARY means for this question
//   rq.short     a name for the question, printed on stamps: "PRIMARY for the 1900 question"
//
// Task types (js/desk/tasks.js). Mix them: a case that is all one type feels like the same question over and over.
//   readq     click the WHEN and WHERE (or WHO) words in the research question
//   stamp     primary or secondary for this question, then click the line that proves it
//   question  pick an answer, then click the line that proves it
//   compare   find the same thing in two papers (find: [{doc, proof, near}, {…}]), then say if they agree (options)
//   sort      put lines of the papers into two bins (bins, items: [{ref, bin, why, text?}]); no hints, a wrong bin is
//             put right at once with its `why`
//   order     click events earliest first (items in the right order, with `when`; shuffle = the order shown)
//   catalogue the paper's label is blank: choose each missing line (fields: [{k, ask, options, answer, proof, …}])
//             and prove it from the paper's own words
// A case may have `chapter` (2, 3…): js/story.js tells the story between the cases.
// Every stamp and question has:
//   look      WHERE TO LOOK: which part of which paper. Plain words: "the label, the line MADE BY".
//   shows     WHAT THE PROOF MUST SHOW: "who made it, and whether they were there".
//   guide     'show' = both are printed on the card from the start (teaching tasks)
//             'hint' = behind the "Need a hint?" button (using it gives a silver seal, not gold)
//   proof     refs that count: 'doc#words in the sentence' or 'doc@by' / '@when' / '@what' (a label line)
//   near      refs that are close but not proof, each with its own hint
//   mail      what goes wrong in the world if the first answer was wrong (shown in the report)

const RQ1 = {
  short: 'the 1604–05 question',
  text: 'What happened to the French on St. Croix Island in the winter of 1604–1605?',
  marks: [{ tag: 'WHEN', words: 'the winter of 1604–1605' }, { tag: 'WHERE', words: 'St. Croix Island' }],
  primary: 'Made by someone who was there: on St. Croix Island, in the winter of 1604–1605.',
  secondary: 'Made later, by someone who was not there. They learned it from other sources.',
};

const RQ_1900 = {
  short: 'the 1900 question',
  text: 'What was St. Croix Island like around 1900?',
  marks: [{ tag: 'WHEN', words: 'around 1900' }, { tag: 'WHERE', words: 'St. Croix Island' }],
  primary: 'Made by someone who saw St. Croix Island around 1900.',
  secondary: 'Made by someone who did not see it then. They learned it from other sources.',
};

const RQ_1860S = {
  short: 'the 1860s question',
  text: 'How did historians in the 1860s tell the story of St. Croix?',
  marks: [{ tag: 'WHEN', words: 'in the 1860s' }, { tag: 'WHO', words: 'historians' }],
  primary: 'Written by a historian in the 1860s. The writing itself is what you are studying.',
  secondary: 'Written at another time, about those historians.',
};

const RQ_FIRE = {
  short: 'the fire question',
  text: 'What happened in St. John during the Great Fire of June 20, 1877?',
  marks: [{ tag: 'WHEN', words: 'June 20, 1877' }, { tag: 'WHERE', words: 'St. John' }],
  primary: 'Made by someone who was there: in St. John, at the time of the fire.',
  secondary: 'Made later, by someone who was not there. They learned it from other sources.',
};

const RQ_DEAD = {
  short: 'the how-many question',
  text: 'How many French died on St. Croix Island in the winter of 1604–1605?',
  marks: [{ tag: 'WHEN', words: 'the winter of 1604–1605' }, { tag: 'WHERE', words: 'St. Croix Island' }],
  primary: 'Made by someone who was there: on St. Croix Island, in the winter of 1604–1605.',
  secondary: 'Made by someone who was not there. They learned it from others.',
};

const RQ_1797 = {
  short: 'the 1797 question',
  text: 'How did people prove, in 1797, which island was St. Croix Island?',
  marks: [{ tag: 'WHEN', words: 'in 1797' }, { tag: 'WHERE', words: 'St. Croix Island' }],
  primary: 'Made in 1797 by the people doing the proving. They were there.',
  secondary: 'Made later, by someone who read about it.',
};

const LABEL_BY = 'The label at the top of the paper, the line MADE BY.';
const LABEL_WHEN = 'The label at the top of the paper, the line WHEN.';

export const CASES = [
  // ------------------------------------------------------------------ 0: the guided sample (Mr. Harrow coaches)
  {
    id: 'c0', title: 'A practice paper', from: 'Mr. Harrow, the Curator', coach: true,
    rq: RQ_FIRE,
    intro: ['A practice paper about a different subject: the Great Fire of 1877 in St. John.'],
    tasks: [
      { type: 'readq' },
      {
        type: 'stamp', doc: 'stewart-fire', answer: 'primary', guide: 'show',
        look: 'The label at the top of the paper, the line WHEN.',
        shows: 'That it was made in St. John, at the time of the fire.',
        proof: ['stewart-fire@when', 'stewart-fire@by'],
        near: { 'stewart-fire#first fire we know of': 'That is about 1784. Your question is about 1877. Try the label.' },
        right: 'Primary. Stewart lived in St. John and wrote his book the same year as the fire.',
        wrong: 'This one is primary. Stewart lived in St. John and wrote in 1877.',
        mail: 'The fire book was filed as “written in 1784”. Stewart would have laughed.',
      },
    ],
    remember: 'The question first, then the label, then the stamp, then the proof. And the same book can be primary for one question and secondary for another.',
  },

  // ------------------------------------------------------------------ 1: the first stack (onboarding)
  {
    id: 'c1', title: 'The first stack', from: 'Mr. Harrow, the Curator',
    rq: RQ1,
    intro: [
      'These papers are about St. Croix Island, where the French spent the winter of 1604–1605.',
      'First read your research question. Then sort each paper: primary or secondary FOR THIS QUESTION. Prove every stamp.',
    ],
    tasks: [
      { type: 'readq' },
      {
        type: 'stamp', doc: 'ch-cider', answer: 'primary', guide: 'show',
        look: LABEL_BY,
        shows: 'Who made it, and whether they were on the island that winter.',
        proof: ['ch-cider@by', 'ch-cider#all our drinks froze', 'ch-cider#We had to drink', 'ch-cider#we could not get to the shore', 'ch-cider#Most of us slept badly', 'ch-cider#I think that food'],
        near: { 'ch-cider@when': '1613 is a few years after the winter. The date alone doesn’t tell you if he was there. Who made it?' },
        right: 'Primary. Champlain sailed with de Mons in 1604. He was on the island that winter, and he writes “we”.',
        wrong: 'This one is primary. Champlain sailed with de Mons in 1604 and spent that winter on the island.',
        mail: 'Champlain’s pages were filed with the history books. A visiting professor wrote to complain that the eyewitness had gone missing.',
      },
      {
        type: 'stamp', doc: 'parkman', answer: 'secondary', guide: 'show',
        look: LABEL_WHEN,
        shows: 'That it was written long after 1604–1605.',
        proof: ['parkman@when', 'parkman#showed all of this in plans'],
        near: {
          'parkman@by': 'That says who he was. Does it show he was on the island in 1604? Look at WHEN.',
          'parkman#Seventy-nine men': 'That is a fact about 1604, but anyone can repeat a fact. When was this written?',
          'parkman#Of the seventy-nine': 'That is a fact about 1604, but anyone can repeat a fact. When was this written?',
        },
        right: 'Secondary. Parkman wrote in 1865, about 260 years later. He even tells you where he read it: Champlain’s book of 1613.',
        wrong: 'This one is secondary for your question. Parkman wrote it in 1865. He was not on the island in 1604.',
        mail: 'A public lecture in Saint John called Parkman “an eyewitness”. Somebody in the audience laughed.',
      },
      {
        type: 'question', docs: ['ch-map'], guide: 'hint',
        ask: 'The last paper isn’t writing at all. It’s a map. Can a map be a primary source for your question?',
        options: ['Yes: Champlain drew the island he was living on.', 'No: only writing can be a source.', 'No: it was printed in 1613, after the winter.', 'Only if it has a date on it.'],
        answer: 0,
        look: LABEL_BY,
        shows: 'Who drew it, and whether he was there.',
        proof: ['ch-map@by'],
        near: { 'ch-map@when': 'The date is the printing, not the drawing. Who drew it, and was he there?' },
        right: 'Yes. A map can be a source too, and so can a drawing, a photograph or a building. Champlain drew the island he was living on.',
        mail: 'Champlain’s map went into the drawer of modern maps. A surveyor spent a whole afternoon looking for it.',
      },
    ],
    remember: 'You sorted these papers for ONE question: what happened on the island in 1604–1605. Ask a different question, and the same paper can sort differently.',
  },

  // ------------------------------------------------------------------ 2: a letter from a teacher
  {
    id: 'c2', title: 'A letter from a teacher', from: 'Miss Agnes Lyle, a schoolteacher in Saint John',
    rq: RQ1,
    fetch: ['champlain', 'parkman', 'ganong'],
    intro: [
      '“Dear Sir or Madam, my class is studying the French on St. Croix Island. They have three questions, and they want PROOF, not guesses. Can you help?”',
      'Same research question as your first stack. For each of her questions: pick the answer, then click the line that proves it.',
    ],
    tasks: [
      { type: 'readq' },
      {
        type: 'compare', guide: 'show',
        ask: 'Why couldn’t the men get firewood and fresh water from the mainland? Champlain and Parkman both say. Find it in each.',
        find: [
          { doc: 'ch-cider', proof: ['ch-cider#we could not get to the shore', 'ch-cider#short of firewood'], near: { 'ch-cider#We had to drink': 'That says WHAT they drank. Find the line that says WHY they couldn’t reach the shore.' } },
          { doc: 'parkman', proof: ['parkman#cut them off from wood and water'], near: { 'parkman#Cider and wine froze': 'That is about the drinks. Find what cut them off from the mainland.' } },
        ],
        verdict: 'What stopped them? Do the two papers agree?',
        options: ['They agree: ice in the river cut them off.', 'They disagree: Parkman says the ships had gone.', 'They agree: de Mons ordered everyone inside.'],
        answer: 0,
        look: 'Champlain’s frozen-cider pages, paragraph 2. Parkman, paragraph 3.',
        shows: 'What stopped them from reaching the shore, in each paper.',
        right: 'Ice. And two sources agree: Champlain, who was there, and Parkman, who read Champlain.',
      },
      {
        type: 'question', docs: ['parkman', 'ch-scurvy'], guide: 'hint',
        ask: 'Parkman says 35 of the 79 men died. Where did Parkman get his facts?',
        options: ['From Champlain’s book of 1613.', 'He was on the island that winter.', 'He made up the number.', 'From a Saint John newspaper.'],
        answer: 0,
        look: 'Parkman’s paper, paragraph 2.',
        shows: 'Parkman naming the book he learned from.',
        proof: ['parkman#showed all of this in plans'],
        near: {
          'ch-scurvy#Of the 79 of us': 'That is Champlain’s own count. Now find the line where PARKMAN shows he read Champlain.',
          'parkman#Of the seventy-nine': 'That is Parkman’s number. Find the line where he says what he read.',
        },
        right: 'From Champlain. A secondary source is built from primary ones. Good historians tell you which ones.',
      },
      {
        type: 'question', docs: ['ganong-winter'], guide: 'hint',
        ask: 'Ganong says the French would have stayed if the winter had been mild. Is that a fact, or his opinion?',
        options: ['His opinion: a careful guess about what might have happened.', 'A fact: Champlain wrote it down.', 'A fact: Ganong was there in 1604.', 'A fact: everything in a book is a fact.'],
        answer: 0,
        look: 'Ganong’s paper, the last paragraph.',
        shows: 'Words that tell you it is about something that did NOT happen.',
        proof: ['ganong-winter#Had that first winter been a mild one'],
        near: { 'ganong-winter#left full accounts': 'That is about his sources. Find the sentence with his guess in it.' },
        right: 'An opinion. Nobody can prove what would have happened. “Had that first winter been mild…” is a historian thinking, not a fact.',
      },
    ],
    remember: 'Primary does not mean true. Secondary does not mean false. Parkman and Ganong were not there, but they read the people who were.',
  },

  // ------------------------------------------------------------------ 3: same paper, new question
  {
    id: 'c3', title: 'Same paper, new question', from: 'Mr. Harrow, the Curator',
    rq: RQ_1900,
    fetch: ['ganong', 'parkman'],
    intro: [
      'Two new research questions. You have seen these papers before. Don’t trust your old stamps!',
      'Read each question first. Then stamp each paper for THAT question.',
    ],
    tasks: [
      { type: 'readq' },
      {
        type: 'stamp', doc: 'ganong-island', answer: 'primary', guide: 'show',
        look: 'The easy words, paragraph 2 or 3.',
        shows: 'Ganong telling what the island is like NOW, in his own day.',
        proof: ['ganong-island#now almost all washed away', 'ganong-island#keeper of the lighthouse tells me', 'ganong-island#All that is left'],
        near: {
          'ganong-island#were surely buried': 'That is about 1605. Your question is about 1900. Find what Ganong saw himself.',
          'ganong-island@by': 'True, but it doesn’t say when he saw it. Find a line about the island NOW.',
        },
        right: 'Primary! For a question about 1900, Ganong is an eyewitness: he saw the washed-away knoll and talked to the lighthouse keeper.',
        wrong: 'For THIS question, Ganong is primary. He saw the island himself around 1900.',
        mail: 'A geologist studying how the island is wearing away left out Ganong’s note. It was the best evidence there was.',
      },
      {
        type: 'readq', rq: RQ_1860S,
      },
      {
        type: 'stamp', doc: 'parkman', answer: 'primary', guide: 'hint',
        look: LABEL_WHEN,
        shows: 'That it was written in the 1860s.',
        proof: ['parkman@when'],
        near: { 'parkman#Seventy-nine men': 'That is about 1604. Your question is about how historians wrote in the 1860s. When was THIS written?' },
        right: 'Primary! Parkman’s book IS the evidence of how a historian of the 1860s told the story. Listen to him: “very unlucky”, “only good points”. That is his voice.',
        wrong: 'For THIS question, Parkman is primary. His 1865 book is exactly what you are studying.',
        mail: 'A student writing about historians of the 1860s skipped Parkman because “he wasn’t there in 1604”. Wrong question!',
      },
      {
        type: 'question', docs: ['parkman'], guide: 'hint',
        ask: 'In your first stack, Parkman was SECONDARY. Now he is PRIMARY. What changed?',
        options: ['The research question changed.', 'Parkman’s book changed.', 'We found out Parkman was on the island.', 'Old books turn primary after 50 years.'],
        answer: 0,
        look: 'The label, the line WHEN. Then read your research question again.',
        shows: 'The date that matches THIS question but not the first one.',
        proof: ['parkman@when'],
        right: 'The question changed. The paper did not. That is the rule of this office: you can’t sort a paper until you know the question.',
      },
    ],
    remember: 'Same paper, new question, new stamp. This is why the archive files papers by who made them and when, and never by primary or secondary.',
  },

  // ================================================================== CHAPTER 2: TWO ACCOUNTS
  // Corroboration and perspective: two accounts of one winter. Where they disagree, who was in a better position to
  // know? Where they agree, how much does that prove? Which lines are claims you can check, and which are opinions?
  {
    id: 'c4', title: 'Two accounts', chapter: 2, from: 'Mr. Silas Mott, who writes for a Saint John newspaper',
    rq: RQ_DEAD,
    fetch: ['champlain', 'lescarbot', 'ganong'],
    intro: [
      '“Sir or Madam: Mr. Harrow once told my readers that 35 men died on St. Croix Island. Now I have found a French book that says 36. Which is it? I mean to print the answer, and the name of whoever is wrong. S. Mott”',
      'Two accounts of one winter. Find where they agree and where they don’t, and work out who was in a better position to know.',
    ],
    tasks: [
      { type: 'readq' },
      {
        type: 'compare', guide: 'show',
        ask: 'Champlain and Lescarbot both say how many men died. Find the number in each paper.',
        find: [
          { doc: 'ch-scurvy', proof: ['ch-scurvy#Of the 79 of us'], near: { 'ch-scurvy#teeth got so loose': 'That is about the sickness, not the number who died.' } },
          { doc: 'lescarbot-winter', proof: ['lescarbot-winter#Thirty-six died'], near: { 'lescarbot-winter#Another thirty-six or forty': 'Those are the men who got BETTER. Find the number who died.' } },
        ],
        verdict: 'Put the two numbers side by side. Do they agree?',
        options: ['They disagree: Champlain says 35, Lescarbot says 36.', 'They agree: both say 35.', 'They agree: both say 36.'],
        answer: 0,
        look: 'Champlain’s sickness pages, paragraph 3. Lescarbot’s winter pages, the last paragraph.',
        shows: 'The number of men who died, in each paper.',
        right: 'They disagree, by one man. When two sources disagree, a historian asks: which writer was in a better position to know?',
        mail: 'Mr. Mott printed that the museum “cannot count to thirty-six”. Mr. Harrow did not enjoy his breakfast.',
      },
      {
        type: 'question', docs: ['ganong-lescarbot', 'lescarbot-winter'], guide: 'show',
        ask: 'Lescarbot tells the story of that winter. Was he on the island to see it?',
        options: ['No. He came to Acadia two years later.', 'Yes. He writes “our people”, so he was there.', 'Yes. His book came out first, in 1609.', 'We can’t tell from these papers.'],
        answer: 0,
        look: 'Ganong’s paper “How Lescarbot knew”, paragraph 1 or the last paragraph.',
        shows: 'Ganong saying whether Lescarbot saw it himself.',
        proof: ['ganong-lescarbot#He did not see them himself', 'ganong-lescarbot#did not come to Acadia until two years later'],
        near: {
          'lescarbot-winter#Our people had three big troubles': '“Our people” means the French. It doesn’t say he was there. Look in Ganong’s paper.',
          'ganong-lescarbot#notebook': 'That is how he collected his facts. Does it say whether he saw the winter himself?',
          'ganong-lescarbot#One writer has said': 'Careful: that is the mistake Ganong is about to correct. Read the next sentence.',
        },
        right: 'No. Lescarbot heard about the winter from the men who lived through it, two years later, at Port Royal.',
        mail: 'A Saint John lecturer called Lescarbot “an eyewitness of St. Croix”. Ganong would have written him a stiff letter.',
      },
      {
        type: 'question', docs: ['ch-scurvy', 'ganong-lescarbot'], guide: 'hint',
        ask: 'So which writer was in a better position to count the dead?',
        options: ['Champlain: he was there, and counted his own companions.', 'Lescarbot: his book was printed first, in 1609.', 'Lescarbot: his story is livelier and has more facts.', 'Neither: they are both old books.'],
        answer: 0,
        look: 'Champlain’s sickness pages, paragraph 3.',
        shows: 'Champlain counting the men as one of them.',
        proof: ['ch-scurvy#Of the 79 of us', 'ganong-lescarbot#got his facts from Champlain'],
        near: {
          'ganong-lescarbot#livelier': 'Livelier is not the same as better informed. Who was there, counting?',
          'ganong-lescarbot#He did not see them himself': 'True, that is about Lescarbot. Now find the line that shows Champlain was one of the men.',
        },
        right: 'Champlain. “Of the 79 of us, 35 died.” He counted his own companions. Lescarbot heard the number later, and it came out one different.',
        mail: 'Mr. Mott printed “36, from the newest book”. Newer is not the same as better.',
      },
      {
        type: 'compare', guide: 'hint',
        ask: 'Now look for something they agree on. Both say what happened to the cider. Find it in each paper.',
        find: [
          { doc: 'ch-cider', proof: ['ch-cider#all our drinks froze', 'ch-cider#cider was handed out by the pound'], near: { 'ch-cider#We had to drink very bad water': 'That is about the water. Find the cider.' } },
          { doc: 'lescarbot-winter', proof: ['lescarbot-winter#cider froze in the barrels'], near: { 'lescarbot-winter#drank melted snow': 'That is about the water. Find the cider.' } },
        ],
        verdict: 'Do they agree?',
        options: ['They agree: it froze, and was handed out by weight.', 'They disagree: only Champlain says it froze.', 'They disagree: Lescarbot says the cider was fine.'],
        answer: 0,
        look: 'Champlain’s frozen-cider pages, paragraph 1. Lescarbot’s winter pages, paragraph 3.',
        shows: 'The same thing happening, in each paper.',
        right: 'They agree. But remember where Lescarbot got his facts: from Champlain and the men who were there. When one writer learned it from the other, agreeing proves less.',
      },
      {
        type: 'sort', docs: ['lescarbot-island', 'lescarbot-winter'],
        ask: 'Lescarbot mixes what happened with what he thinks. Sort each line.',
        bins: [
          { id: 'check', name: 'CAN BE CHECKED', means: 'Something that happened. Other papers can say if it is right.' },
          { id: 'opinion', name: 'HIS OPINION', means: 'What Lescarbot thinks. Nobody can prove it right or wrong.' },
        ],
        items: [
          { ref: 'lescarbot-island#make themselves prisoners', text: '…people who go to a country to take the land should not stop on islands and make themselves prisoners.', bin: 'opinion', why: 'His opinion: “I will always think…” Champlain thought the island was a fine choice.' },
          { ref: 'lescarbot-winter#cider froze in the barrels', bin: 'check', why: 'It can be checked, and it was: Champlain says the same.' },
          { ref: 'lescarbot-island#not a good place to start a colony', bin: 'opinion', why: 'His opinion. “Not a good place” is a judgement, not something that happened.' },
          { ref: 'lescarbot-winter#Thirty-six died', bin: 'check', why: 'It can be checked, and we did: Champlain says 35. A claim you can check can still be wrong!' },
          { ref: 'lescarbot-winter#To get water or wood', text: 'To get water or wood, they had to cross the river…', bin: 'check', why: 'It can be checked: Champlain says the ice cut them off from the shore.' },
        ],
        right: 'An opinion isn’t wrong just because it is an opinion, and a claim you can check isn’t right just because you can check it. Only a checked claim is proof.',
        mail: 'Mr. Mott printed Lescarbot’s opinion as “a fact proven by the museum”.',
      },
      {
        type: 'question', docs: ['ch-island', 'lescarbot-island'], guide: 'hint',
        ask: 'Champlain explains why they chose the island. What does Lescarbot think of the choice?',
        options: ['A mistake: on an island you are a prisoner.', 'A good choice: it was easy to defend.', 'He agrees with every reason Champlain gives.', 'He does not say what he thinks.'],
        answer: 0,
        look: 'Lescarbot’s pages about the island, paragraph 2 or 4.',
        shows: 'Lescarbot giving his own view of the choice.',
        proof: ['lescarbot-island#make themselves prisoners', 'lescarbot-island#not a good place to start a colony'],
        near: {
          'ch-island#easy to defend': 'That is Champlain’s reason. Now find what LESCARBOT thinks.',
          'lescarbot-island#strong and easy to guard': 'That is why they stopped there. Find what Lescarbot himself thinks of it.',
        },
        right: 'Two writers, two points of view. Champlain saw a fort that guarded the river. Lescarbot saw a prison. Knowing who thinks what, and why, is part of the job.',
      },
    ],
    remember: 'When two accounts disagree, ask who was in a better position to know. When they agree, ask whether one learned it from the other. And an opinion is never proof.',
  },

  // ================================================================== CHAPTER 3: THE RUINS THAT DREW A BORDER
  // Evidence in action, a source inside a source, and judging significance: in 1797, a map printed in 1613 and a few
  // old bricks settled which river was the border between the United States and the British colonies.
  {
    id: 'c5', title: 'The ruins that drew a border', chapter: 3, from: 'Miss Agnes Lyle, a schoolteacher in Saint John',
    rq: RQ_1797,
    fetch: ['ganong', 'kilby', 'champlain'],
    intro: [
      '“Dear Archivist, thank you again for the St. Croix proofs. But now Tom Nason asks: how do we KNOW Dochet Island is the real St. Croix Island? The French left in 1605. How could anyone tell, two hundred years later, which island was theirs? I confess I don’t know either. Agnes Lyle”',
      'Somebody had to prove it once, a long time ago. Find out who, and how.',
    ],
    tasks: [
      { type: 'readq' },
      {
        type: 'order', docs: ['ganong-boundary', 'ganong-decision'],
        ask: 'Before you dig in, get the story straight. Put these in order, earliest first.',
        items: [
          { text: 'The French spend a hard winter on the island.', when: '1604–05' },
          { text: 'Champlain’s book, with his plan of the island, is printed in Paris.', when: '1613' },
          { text: 'A peace treaty makes the St. Croix River part of the border. But which river is it?', when: '1783' },
          { text: 'Robert Pagan takes a copy of Champlain’s plan to Dochet Island, and digs.', when: '1797' },
          { text: 'The commissioners decide: the Schoodic is the true St. Croix.', when: '1798' },
        ],
        shuffle: [3, 0, 4, 2, 1],
        look: 'The dates are in Ganong’s two papers on your desk. The first two you know from Champlain.',
        right: 'The treaty came first, then the argument, then the proof. Almost two hundred years after the French left, their ruins were called as witnesses.',
      },
      {
        type: 'catalogue', doc: 'pagan-1797', guide: 'hint',
        ask: 'This paper came up from the stacks with half its label blank. Write the missing lines from what the paper itself says.',
        fields: [
          {
            k: 'by', ask: 'MADE BY: whose words are these?',
            options: ['Robert Pagan, of St. Andrews', 'W. H. Kilby, who printed them', 'Samuel de Champlain, who made the plan', 'Daniel McMasters, the Justice of the Peace'],
            answer: 0,
            look: 'The easy words, paragraph 1 or the last paragraph.',
            shows: 'Whose statement it is.',
            proof: ['pagan-1797#Robert Pagan says', 'pagan-1797#Signed by Robert Pagan'],
            near: { 'pagan-1797@what': 'That line says who PRINTED it, in 1888. Whose words are they? Look in the easy words.' },
            right: 'Robert Pagan. Kilby only printed his words, ninety-one years later.',
          },
          {
            k: 'when', ask: 'WHEN: when were these words made?',
            options: ['20 July 1797', '1888', '1613', '1604'],
            answer: 0,
            look: 'The easy words, the last paragraph.',
            shows: 'The day Pagan swore to his statement, with the year.',
            proof: ['pagan-1797#sworn at St. Andrews on 20 July 1797'],
            near: {
              'pagan-1797#said to be printed in Paris in 1613': 'That is when the PLAN was printed. When did Pagan make his statement?',
              'pagan-1797@what': 'That is when Kilby printed it. When did Pagan swear to it?',
              'pagan-1797#On the 7th day of this July': 'Close! That is when he dug. But which year? Find the line with the full date.',
            },
            right: '20 July 1797. Always ask when the WORDS were made, not just when the book was printed.',
          },
        ],
        right: 'A source can sit inside another source. The words are Pagan’s, from 1797. The book is Kilby’s, from 1888.',
        mail: 'The Pagan statement was catalogued as “written by Kilby, 1888”. A lawyer hunting for 1797 evidence never found it.',
      },
      {
        type: 'stamp', doc: 'pagan-1797', answer: 'primary', guide: 'hint',
        look: 'The label, now that you have written it: MADE BY and WHEN.',
        shows: 'Who made it, and that it was made in 1797 by someone doing the proving.',
        proof: ['pagan-1797@by', 'pagan-1797@when', 'pagan-1797#On the 7th day of this July', 'pagan-1797#On the 18th of July'],
        near: { 'pagan-1797@what': 'That says when Kilby printed it, in 1888. For a question about 1797, look at when Pagan made it.' },
        right: 'Primary. Pagan dug on the island himself in July 1797. The book is from 1888, but the words inside it are from 1797.',
        wrong: 'This one is primary for your question. Pagan was there, digging, in 1797.',
        mail: 'Pagan’s statement was stamped secondary “because the book is from 1888”. A visiting surveyor laughed out loud.',
      },
      {
        type: 'compare', guide: 'show',
        ask: 'Pagan says his ruins stand at the spot marked A on the plan. Check the plan: what does A mark?',
        find: [
          { doc: 'pagan-1797', proof: ['pagan-1797#spot marked A', 'pagan-1797#where the plan shows the French buildings'], near: { 'pagan-1797#agreed most strikingly': 'Good, but that is about the shores. Find the line about the ruins and the letter on the plan.' } },
          { doc: 'ch-map', proof: ['ch-map#A the houses'], near: { 'ch-map#E the cemetery': 'That is E, the cemetery. Pagan’s ruins are at A.', 'ch-map#B gardens': 'That is B. Pagan’s ruins are at A.' } },
        ],
        verdict: 'Does Pagan’s dig match Champlain’s plan?',
        options: ['They match: the ruins are where Champlain drew the houses.', 'They don’t match: the plan shows gardens there.', 'They don’t match: the plan shows the cemetery there.'],
        answer: 0,
        look: 'Pagan’s statement, paragraph 3. Champlain’s map, the easy words, paragraph 2.',
        shows: 'The letter A, in each paper.',
        right: 'They match. A plan drawn in 1604 and printed in 1613 led Pagan to the very spot where the houses had stood. That is how a map becomes evidence.',
        mail: 'Somebody filed Champlain’s plan as “decoration”. It was the most important paper in the case.',
      },
      {
        type: 'compare', guide: 'hint',
        ask: 'Thomas Wright surveyed the island that October. Find what he and Champlain each say about fresh water.',
        find: [
          { doc: 'wright-1797', proof: ['wright-1797#did not see a single stream or spring'], near: { 'wright-1797#deep holes': 'Holes dug for water? Interesting! But find the line that says whether there WAS any fresh water.' } },
          { doc: 'ch-cider', proof: ['ch-cider#no springs or streams'], near: { 'ch-cider#We had to drink very bad water': 'That is what they drank. Find the line that says what the island did not have.' } },
        ],
        verdict: 'Do they agree?',
        options: ['They agree: there was no fresh water on the island.', 'They disagree: Wright found a spring.', 'They can’t be compared: they are almost 200 years apart.'],
        answer: 0,
        look: 'Wright’s statement, paragraph 5. Champlain’s frozen-cider pages, paragraph 2.',
        shows: 'Each man saying there was no fresh water on the island.',
        right: 'They agree. Champlain lived there in 1604–05 and Wright searched it in 1797, almost 200 years apart. Two eyewitnesses who never met describe the same island.',
      },
      {
        type: 'question', docs: ['ganong-decision'], guide: 'hint',
        ask: 'The American agent explained the ruins another way. What did he say they were?',
        options: ['A trading post from later French times.', 'A British fort from the war of the Revolution.', 'Ruins Pagan had built himself.', 'An old lighthouse.'],
        answer: 0,
        look: 'Ganong’s paper “How much did the island matter?”, paragraph 1.',
        shows: 'The other explanation for the ruins.',
        proof: ['ganong-decision#trading post'],
        near: { 'ganong-decision#not proven to be de Monts': 'Right idea! That says he doubted it. Now find what he thought the ruins WERE.' },
        right: 'A rival explanation! Good historians always ask what ELSE could explain the evidence. The commissioners heard it, and still all agreed with the British agent.',
      },
      {
        type: 'question', docs: ['ganong-decision'], guide: 'hint',
        ask: 'Did the island alone decide the border? What does Ganong think?',
        options: ['Not alone, but it helped the commissioners all agree.', 'Yes: without the island there would be no border.', 'No: the island did not matter at all.', 'Ganong does not say.'],
        answer: 0,
        look: 'Ganong’s paper “How much did the island matter?”, paragraphs 4 and 5.',
        shows: 'Ganong weighing how much the island mattered.',
        proof: ['ganong-decision#too much to say', 'ganong-decision#would probably have been divided', 'ganong-decision#enough other evidence'],
        near: {
          'ganong-decision#On October 25, 1798': 'That is what they decided. Find where Ganong weighs how much the island mattered.',
          'ganong-decision#peace between nations': 'That is his conclusion. Find the reasons he gives for it.',
        },
        right: 'A careful judgement. The island was not the ONLY evidence, but without it the commissioners would probably have been divided. Ganong weighs it, and gives his reasons.',
      },
    ],
    remember: 'A source can sit inside another source: Pagan’s words of 1797, printed by Kilby in 1888. Maps and ruins are evidence too. And a careful historian says how much something mattered, not just that it did.',
  },
];
