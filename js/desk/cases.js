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
// Task types (js/desk/tasks.js):
//   readq     click the WHEN and WHERE (or WHO) words in the research question
//   stamp     primary or secondary for this question, then click the line that proves it
//   question  pick an answer, then click the line that proves it
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

const LABEL_BY = 'The label at the top of the paper, the line MADE BY.';
const LABEL_WHEN = 'The label at the top of the paper, the line WHEN.';

export const CASES = [
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
        type: 'stamp', doc: 'ch-map', answer: 'primary', guide: 'hint',
        look: LABEL_BY,
        shows: 'Who drew it, and whether he was there.',
        proof: ['ch-map@by'],
        near: { 'ch-map@when': 'The date is the printing, not the drawing. Who drew it, and was he there?' },
        right: 'Primary. A map can be a source too. Champlain drew the island he was living on.',
        wrong: 'This one is primary. Sources are not only writing. Champlain drew this map of the island he was living on.',
        mail: 'Champlain’s map went into the drawer of modern maps. A surveyor spent a whole afternoon looking for it.',
      },
      {
        type: 'stamp', doc: 'ganong-winter', answer: 'secondary', guide: 'hint',
        look: 'The label (WHEN), or the first sentence of the easy words.',
        shows: 'That he wrote long after, using other people’s accounts.',
        proof: ['ganong-winter@when', 'ganong-winter#left full accounts'],
        near: { 'ganong-winter#mild one': 'That is his idea about what might have happened. It doesn’t show when he wrote, or how he knew.' },
        right: 'Secondary. Ganong wrote in 1902, and he says how he knows: from the accounts Champlain and Lescarbot left.',
        wrong: 'This one is secondary for your question. Ganong wrote in 1902, using Champlain’s and Lescarbot’s accounts.',
        mail: 'Ganong’s study was filed as “written on the island, 1605”. Ganong himself would have been surprised.',
      },
      {
        type: 'stamp', doc: 'ch-scurvy', answer: 'primary', guide: 'hint',
        look: 'The label, or any line where Champlain says “we” or “us”.',
        shows: 'That the maker was there that winter.',
        proof: ['ch-scurvy@by', 'ch-scurvy#Of the 79 of us', 'ch-scurvy#We could not find any cure', 'ch-scurvy#many of our men', 'ch-scurvy#We thought the change'],
        near: { 'ch-scurvy#Learned men later told me': 'Close! But this line is about what he heard LATER. Find a line that shows he was there that winter.' },
        right: 'Primary. “Of the 79 of us, 35 died.” He counted his own companions.',
        wrong: 'This one is primary. Champlain lived through that winter. He writes “of the 79 of us”.',
        mail: 'The sickness pages ended up in a box of medical books. A doctor borrowed them and never knew who wrote them.',
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
        type: 'question', docs: ['ch-cider', 'parkman'], guide: 'show',
        ask: 'Why couldn’t the men get firewood and fresh water from the mainland?',
        options: ['Ice in the river cut them off.', 'The ships had all gone back to France.', 'De Mons ordered everyone to stay inside.', 'The mainland had no trees.'],
        answer: 0,
        look: 'Champlain’s frozen-cider pages, paragraph 2. Or Parkman, paragraph 3.',
        shows: 'What stopped them from reaching the shore.',
        proof: ['ch-cider#we could not get to the shore', 'ch-cider#short of firewood', 'parkman#cut them off from wood and water'],
        near: { 'ch-cider#We had to drink': 'That says WHAT they drank. Find the line that says WHY they couldn’t reach the shore.' },
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
];
