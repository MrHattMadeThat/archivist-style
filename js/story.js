// The story. Every objective and every line anyone says is in this file, so the words can be changed without touching
// the 3D code. The plan behind it is in docs/STORY.md (the opening and chapter 1) and docs/ONBOARDING.md (the desk).
//
// A line is { who, text }. who: 'harrow' | 'attendant' | 'you' | 'narrator' | 'conductor' | 'gage' | 'hanlon' |
// 'cabman' | 'newsboy' | 'folk'. Extras:
//   card: 'duties' | 'rule' | 'rq' | 'slip' | 'note'   a card above the words (rq and slip need `case`; note needs
//                                                      `note: { tag, lines }`, a letter or an index card)
//   choices: [{ label, ok, reply, who }]   a question; a choice without ok shows its reply and asks again (who: the
//                                     reply's speaker, e.g. 'narrator', if not the line's). When every choice
//                                     is ok, they are just different answers, and the story goes on after any of them.
//   do: '…'                           something happens (js/world.js DO): stage, toOffice, toStacks, tutorShelf, toDesk,
//                                     cards (your index cards spill), gageGo, paper (the morning paper opens), sleep,
//                                     toSquare, toHarrowOffice
// Lines are short on purpose: two sentences at most, so a Grade 6 reader can take each one in at a glance.
//
// THE CALENDAR (real dates): Tuesday 17 May 1910, evening: you arrive. Wednesday 18 May: your first day, and that night
// the Earth passes through the tail of Halley's comet. The morning paper is the real Standard of 18 May 1910.
//
// Invented: Mr. Harrow, the attendant (Miss Doucet), Miss Lyle and her pupil Tom, Mr. Mott, Percy Gage the pill
// seller, Mrs. Hanlon and her boarding house, the cabman, the townsfolk, Mr. Tull and his card, and the building's
// rooms upstairs and downstairs. Real: the places in Saint John, the dates, the newspaper, the comet and the pills
// people bought, and every fact on a catalogue card. Sources: docs/SOURCES.md.
//
// Chapters: 1 the new archivist (the opening, c0–c3: primary or secondary depends on the question; the comet night),
// 2 two accounts (c4), 3 the ruins that drew a border (c5).
(function () {
  const H = (text, more) => ({ who: 'harrow', text, ...more });
  const A = (text, more) => ({ who: 'attendant', text, ...more });
  const Y = (text, more) => ({ who: 'you', text, ...more });
  const N = (text, more) => ({ who: 'narrator', text, ...more });
  const G = (text, more) => ({ who: 'gage', text, ...more });
  const M = (text, more) => ({ who: 'hanlon', text, ...more });
  const C = (text, more) => ({ who: 'cabman', text, ...more });

  // stage: { obj (the To do note: text, or a function of the area you are in), goal (what the pointing hand marks: a
  // thing's id, or 'shelf' for the right shelf), case/fetch/file (which case), harrow ('home' | 'desk' | 'stacks' |
  // 'square'), next, night (true: the streets are dark and gaslit; otherwise it is a foggy day) }
  const stages = {
    // ---- evening 1: Tuesday 17 May 1910
    arrive: { night: true, obj: (area) => (area === 'street' ? 'Go into the museum: the door under the lamp.' : 'Talk to the attendant at the front desk.'), goal: 'attendant' },
    upstairs: { night: true, obj: 'Go through the door marked CURATOR, behind the visitors’ book.', goal: 'harrow' },
    meet: { night: true, obj: (area) => (area === 'office' ? 'Talk to Mr. Harrow. His office is on the left.' : 'Go up to the offices: the door marked CURATOR.'), goal: 'harrow' },
    sample: { night: true, obj: 'Sit at your desk. Mr. Harrow will show you how the job is done.', goal: 'mydesk', case: 'c0', harrow: 'desk', next: 'sampleFile' },
    sampleFile: { night: true, obj: 'Put the fire book away in the stacks, on shelf P – Z.', goal: 'shelf', file: 'c0', harrow: 'stacks', next: 'drawer' },
    drawer: { night: true, obj: 'Before you go home: open your desk drawer. It sticks.', goal: 'mydesk' },
    home1: {
      night: true, goal: 'to-lodgings',
      obj: (area) => ({
        office: 'Go home. Down the stairs to the galleries, then out the front door.',
        basement: 'Go home. Up the stairs, then down to the galleries and out the front door.',
        museum: 'Go home: out the front door to Union Street.',
        street: 'Go home: walk left along Union Street to King Square.',
        square: 'Mrs. Hanlon’s boarding house is on Sydney Street: the door with ROOMS in the window.',
      }[area] || 'Go home to Mrs. Hanlon’s boarding house.'),
    },
    hanlon1: { night: true, obj: 'Say good evening to Mrs. Hanlon, your landlady.', goal: 'hanlon' },
    sleep: { night: true, obj: 'Go to bed. Your room is through the kitchen, on the right.', goal: 'bed' },
    // ---- day 2: Wednesday 18 May 1910
    breakfast: { obj: 'Breakfast! Talk to Mrs. Hanlon in the kitchen.', goal: 'hanlon' },
    towork: {
      goal: 'harrow',
      obj: (area) => ({
        lodgings: 'Walk to work. Out the front door, through King Square.',
        square: 'Walk to work: right, past the old burial ground, to Union Street.',
        street: 'The museum is No. 72, the brick building with the lamp.',
        museum: 'Go up to Mr. Harrow’s office: the door marked CURATOR.',
        office: 'Say good morning to Mr. Harrow.',
      }[area] || 'Walk to work at the museum.'),
    },
    case1: { obj: 'Sit at your desk and sort the stack of papers. On your own this time!', goal: 'mydesk', case: 'c1', next: 'file1' },
    file1: { obj: 'File the papers in the stacks, in the basement. Take the STACKS door on the landing.', goal: 'shelf', file: 'c1', next: 'report1' },
    report1: { obj: 'Go back up to Mr. Harrow’s office.', goal: 'harrow' },
    fetch2: { obj: 'Fetch three boxes from the stacks, in the basement.', goal: 'shelf', fetch: 'c2', next: 'case2' },
    case2: { obj: 'Take the boxes up to your desk. Answer Miss Lyle’s letter.', goal: 'mydesk', case: 'c2', next: 'file2' },
    file2: { obj: 'File the papers back in the stacks.', goal: 'shelf', file: 'c2', next: 'report2' },
    report2: { obj: 'Tell Mr. Harrow that Miss Lyle’s letter is answered.', goal: 'harrow' },
    fetch3: { obj: 'Fetch two boxes from the stacks again.', goal: 'shelf', fetch: 'c3', next: 'case3' },
    case3: { obj: 'At your desk: stamp the papers for the NEW questions.', goal: 'mydesk', case: 'c3', next: 'file3' },
    file3: { obj: 'File the papers back in the stacks.', goal: 'shelf', file: 'c3', next: 'report3' },
    report3: { obj: 'Tell Mr. Harrow what you found.', goal: 'harrow' },
    // ---- the comet night: Wednesday 18 May, about nine o'clock
    comet: { night: true, obj: 'Find Mr. Harrow in the crowd in King Square.', goal: 'harrow', harrow: 'square' },
    // ---- chapter 2: two accounts (Thursday 19 May)
    fetch4: { obj: 'Fetch three boxes from the stacks: Champlain, Lescarbot and Ganong.', goal: 'shelf', fetch: 'c4', next: 'case4' },
    case4: { obj: 'At your desk: compare the two accounts for Mr. Mott.', goal: 'mydesk', case: 'c4', next: 'file4' },
    file4: { obj: 'File the papers back in the stacks.', goal: 'shelf', file: 'c4', next: 'report4' },
    report4: { obj: 'Tell Mr. Harrow who was right.', goal: 'harrow' },
    // ---- chapter 3: the ruins that drew a border
    fetch5: { obj: 'Fetch three boxes from the stacks: Ganong, Kilby and Champlain.', goal: 'shelf', fetch: 'c5', next: 'case5' },
    case5: { obj: 'At your desk: find out how the island was proved.', goal: 'mydesk', case: 'c5', next: 'file5' },
    file5: { obj: 'File the papers back in the stacks. Mind the ones printed in other men’s books!', goal: 'shelf', file: 'c5', next: 'report5' },
    report5: { obj: 'Tell Mr. Harrow how the island was proved.', goal: 'harrow' },
    free: { obj: 'The museum is yours to explore. More letters will come.' },
  };

  // ------------------------------------------------------------------ the opening (js/world.js runs it, once per new game)
  // Outside: the evening train crossing the dark country. Inside: Percy Gage and his comet pills, your index cards, the
  // job letter. Then a cab from the Union Depot to Union Street, with a talkative cabman, and the door.
  // Facts: Halley's comet's tail passed over the Earth on the night of 18 May 1910 (The Standard, 18 May 1910, page 1:
  // "Prof. Blake on the Comet"); comet pills were sold that week ("Comet pills would find a ready sale here", same
  // page). Partridge Island had the world's first steam foghorn (1859, Robert Foulis). The Reversing Falls are real.
  // King Edward VII died on 6 May 1910; his funeral was on Friday 20 May.
  const TULL_LETTER = {
    tag: 'A letter in your pocket',
    lines: [
      'Natural History Society of New Brunswick, 72 Union Street, Saint John. 2nd May, 1910.',
      'Dear Sir or Madam, the Council is glad you have accepted. Our last archivist, Mr. Tull, left us suddenly in April, and the papers are in some disorder. Come straight to the museum when you arrive.',
      'Yours faithfully, J. Harrow, Curator.',
      'P.S. Please do not touch the boxes on the bottom shelf until we have spoken.',
    ],
  };
  const opening = {
    line: [
      N('Tuesday, the seventeenth of May, 1910.'),
      N('The evening train is running through the dark toward Saint John, New Brunswick.'),
    ],
    train: [
      N('You have never seen Saint John. Tomorrow you start a new job there. You are very, very prepared.'),
      { do: 'cards' },
      Y('Oh no. Not again.'),
      G('Whoa there, friend! It’s snowing paper!'),
      G('“SANDWICH. Ham. MADE BY: me. WHEN: Tuesday morning.” You put a label on your sandwich?'),
      Y('There was another sandwich. They might have been mixed up.'),
      G('Ha! A careful sort. Careful folk are my best customers. Percy Gage, travelling in remedies.'),
      G('You’ve heard? Tomorrow night the Earth goes right through the tail of Halley’s comet.'),
      G('Poison gas, friend! It’s in all the papers. One of these little pills, and you’ll breathe easy all night.', {
        choices: [
          { label: 'Buy a box of comet pills.', who: 'narrator', reply: 'You reach for your purse. Then you stop. Something about this is bothering you.' },
          { label: '“Which papers? Who says it’s poison?”', ok: true, who: 'narrator', reply: 'Mr. Gage blinks. “Well… a scientist. A famous one. In Paris, I think. Or was it Portland?”' },
          { label: 'Say nothing.', who: 'narrator', reply: '“Silence means yes, in my experience!” He holds out a box. You keep your hands firmly in your pockets.' },
        ],
      }),
      Y('A scientist. Which one? Where did he say it?'),
      G('It was… in a newspaper.'),
      Y('Which newspaper?'),
      G('A… big one. You’ll be sorry tomorrow night, friend! Pills! Comet pills!'),
      { do: 'gageGo' },
      Y('Hm. Now, where was I? Ah. The letter.', { card: 'note', note: TULL_LETTER }),
      Y('“Left suddenly.” And what is on the bottom shelf?'),
      { who: 'conductor', text: 'Saint John! Union Depot! All out for Saint John!' },
    ],
    cab: [
      C('Number 72 Union Street? The museum? At this hour?'),
      Y('I am the new archivist.'),
      C('Are you now. Then you’d best learn the fog. Hear that? That’s the foghorn out on Partridge Island.'),
      C('First steam foghorn in the world, that. A Saint John man thought it up.'),
      C('And mind the tides. Twice a day the harbour comes up higher than a house. Up at the falls, the river runs backwards.'),
      Y('Backwards?'),
      C('Backwards. The King’s dead, there’s a comet coming, and the river runs backwards. Strange week to start a job!'),
    ],
    // at the door, after the cab has gone and the title has shown
    door: [Y('Number 72 Union Street. The lamp is lit, so somebody is expecting me.')],
  };

  // ------------------------------------------------------------------ evening 1: meeting the Curator
  const MEET = [
    H('Ah! You must be our new archivist. Come in, come in. I am Mr. Harrow, the Curator. Good journey?'),
    Y('A man on the train tried to sell me comet pills.'),
    H('Ha! Half of Saint John has bought them. Tomorrow night they will all stand in King Square, holding their breath.'),
    H('Now. This Society keeps rocks, birds and fossils by the thousand. And PAPERS: books, letters and maps.'),
    H('People write to us with questions about the past. The papers hold the answers. Your job has four parts.', { card: 'duties' }),
    H('And the most important lesson in this office. Sources come in two kinds.', { card: 'rule' }),
    H('But primary or secondary depends on the QUESTION you ask. Take my diary. I write in it every night.'),
    H('Suppose someone asks: “What did Mr. Harrow do today?” For THAT question, is my diary primary or secondary?', {
      choices: [
        { label: 'Primary', ok: true, reply: 'Right! I was there, and I wrote it the same day.' },
        { label: 'Secondary', reply: 'Think again. Who wrote it, and were they there? I was! I wrote it that very night.' },
      ],
    }),
    H('Now a new question: “What happened on St. Croix Island in 1604?” For THAT question, is my diary primary or secondary?', {
      choices: [
        { label: 'Secondary', ok: true, reply: 'Exactly. I wasn’t born yet! Anything I write about 1604, I learned from other sources.' },
        { label: 'Primary', reply: 'Hmm. Was I on St. Croix Island in 1604? I am old, but not THAT old. Try again.' },
      ],
    }),
    H('Same diary. Two questions. Two answers. And one more rule: no answer without proof. You point at the words that prove it.'),
    Y('Your letter said Mr. Tull left suddenly.'),
    H('Yes. Well. Mr. Tull was a… very private man. We shall talk about him another time.'),
    H('Come, I will show you your desk. One practice paper tonight. Your first real stack can wait for the morning.'),
    { do: 'toOffice', stage: 'sample' },
    H('Your desk. Sit down, and I will stand right here and point.'),
  ];

  // after the practice paper: he walks you to the stacks, shows you how to file it, and sends you home
  const SAMPLE_DONE = [
    H('Well done. Now the paper goes back where it lives. Come with me to the stacks.'),
    { do: 'toStacks', stage: 'sampleFile' },
    H('The stacks. Every box holds the papers of ONE maker, and the shelves go A to Z by the maker’s name.'),
    H('We never file by primary or secondary. Tomorrow someone will ask a different question, and the stamp would be wrong.'),
    H('Stewart starts with S, and S comes between P and Z. So: this shelf. Let us put it away.'),
    { do: 'tutorShelf' },
    H('That is the whole job. Every paper has a home, and anyone can find it again.'),
    H('And it is late. Mrs. Hanlon on Sydney Street has a room for you: across King Square, past the old burial ground.'),
    H('Fetch your hat from your office, and go home to bed. Oh, and mind your desk drawer. It sticks.'),
    { do: 'toDesk', stage: 'drawer' },
  ];

  // the stuck drawer: Mr. Tull's card
  const TULL_CARD = {
    tag: 'An index card, jammed at the back of the drawer',
    lines: [
      'TULL. 14th April, 1910.',
      'BOX 17 IS NOT ON THE BOTTOM SHELF. Somebody has been in the stacks at night.',
      'Say nothing to H. until I am sure.',
    ],
  };
  const DRAWER = [
    Y('Stuck. Of course it is.'),
    Y('There! And something was jammed at the back.', { card: 'note', note: TULL_CARD }),
    Y('Mr. Tull’s writing. Box 17, missing. And “say nothing to H.” H for Harrow?'),
    Y('I think I will keep this. And I think I will go home.'),
    { do: 'stage', stage: 'home1' },
  ];

  // ------------------------------------------------------------------ day 2: the morning, then the first stack
  const MORNING = [
    H('Good morning! Sleep well? Mrs. Hanlon’s porridge has defeated better archivists than you.'),
    Y('The paper says the comet’s tail “will scarcely be noticed.” Professor Blake, of the Toronto Observatory.'),
    H('An astronomer! A man in a position to know. Mr. Gage, I suspect, is in a position to sell pills.'),
    H('Now. Your first stack is on your desk. Here is its question.', { card: 'rq', case: 'c1' }),
    { do: 'stage', stage: 'case1' },
  ];

  const REPORT1 = [
    H('All filed? Good. A tidy archive is a useful archive.'),
    H('And here is your first real letter. It is from Miss Lyle, a schoolteacher here in Saint John.'),
    H('Her class is studying St. Croix Island, and they want proof, not guesses. Same question as your first stack.', { card: 'rq', case: 'c2' }),
    H('You will need three boxes from the stacks. Here is the request slip.', { card: 'slip', case: 'c2' }),
    { do: 'stage', stage: 'fetch2' },
  ];

  const REPORT2 = [
    H('Miss Lyle’s class will be pleased. Proof, every time.'),
    H('Now, a puzzle. You stamped Parkman and Ganong SECONDARY. Quite right, for that question.'),
    H('But what if someone asks a DIFFERENT question? What the island looked like around 1900, say. Or how historians wrote in the 1860s.'),
    H('Fetch the Ganong and Parkman boxes again, and stamp them for the new questions. Don’t trust your old stamps!', { card: 'slip', case: 'c3' }),
    { do: 'stage', stage: 'fetch3' },
  ];

  // the end of the first day: out to King Square for the comet
  const REPORT3 = [
    H('Ganong was secondary, then primary. Parkman too. Did the papers change?'),
    H('No. The QUESTION changed. Remember that all your life: you cannot sort a paper until you know the question.'),
    H('And look at the time! Nearly nine. Half of Saint John is in King Square, waiting for the end of the world.'),
    H('Shall we go and watch it not happen?'),
    { do: 'toSquare', stage: 'comet' },
  ];

  // ------------------------------------------------------------------ the comet night, then chapter 2
  const COMET = [
    H('Nine o’clock. If Professor Blake is right, we are passing through the tail of a comet at this very moment.'),
    Y('I don’t feel anything.'),
    H('“It will scarcely be noticed,” he said. The astronomer was in a position to know.'),
    N('Everybody in King Square looks up. There is fog, and a few stars, and nothing else at all.'),
    H('Mrs. Hanlon tells me you have Mr. Tull’s old room. Did he… leave anything behind?', {
      choices: [
        { label: 'Show him Mr. Tull’s card.', ok: true, who: 'narrator', reply: 'He reads it twice. “Box 17,” he says quietly. “So Tull noticed too.” He hands it back. “Keep it safe. And keep your eyes open.”' },
        { label: 'Say nothing about the card.', ok: true, who: 'narrator', reply: 'He looks at you over his pince-nez for a long moment. “Hm. Well. If you find anything, you know where my office is.”' },
      ],
    }),
    H('Go home, archivist. Tomorrow there will be letters.'),
    N('Nothing happened that night. The comet’s tail passed over, the pills went unswallowed, and the fog came in from the harbour.'),
    N('Chapter 2 · Two accounts'),
    { do: 'toHarrowOffice', stage: 'mott' },
    H('Good morning. The post has brought a letter, and not a friendly one.'),
    H('A Mr. Mott, who writes for a newspaper. I once told his readers that 35 men died on St. Croix Island. He has found a book that says 36.', { card: 'rq', case: 'c4' }),
    H('I said 35 because Champlain says 35. But Mr. Mott means to print the name of whoever is wrong. Let it not be mine!'),
    H('Fetch Champlain, Lescarbot and Ganong. Lescarbot is the French book. Two accounts of one winter: put them side by side.', { card: 'slip', case: 'c4' }),
    { do: 'stage', stage: 'fetch4' },
  ];

  const REPORT4 = [
    H('Well? Who was wrong?'),
    Y('Champlain was there, and counted 35. Lescarbot heard about it two years later, and wrote 36.'),
    H('One man different. So Champlain was in the better position to know, and I can sleep tonight.'),
    H('But I will write to Mr. Mott kindly. Lescarbot was not lying. He passed on what the men told him, and one number slipped.'),
    H('When two accounts disagree, ask who was in a better position to know. When they agree, ask whether one learned it from the other.'),
    N('Chapter 3 · The ruins that drew a border'),
    H('And here is Miss Lyle again. Her pupils have caught us out.'),
    H('A boy asks how we KNOW Dochet Island is the real St. Croix Island. A fair question! Nobody put up a sign in 1605.', { card: 'rq', case: 'c5' }),
    H('The answer is a story about a border, a map and some old bricks. You will need these three boxes.', { card: 'slip', case: 'c5' }),
    { do: 'stage', stage: 'fetch5' },
  ];

  const REPORT5 = [
    H('A plan printed in 1613, a few old bricks, and two men with spades. And a border between two countries was settled.'),
    H('Ganong puts it well. The island was not the only evidence, but it helped the commissioners all agree. Evidence can keep the peace.'),
    H('Write to Miss Lyle. Her Tom will have his answer, with proof.'),
    H('That is all the letters for now. The galleries are yours. More letters will come.'),
    { do: 'stage', stage: 'free' },
  ];

  const harrow = (stage) => {
    if (stage === 'meet' || stage === 'arrive' || stage === 'upstairs') return MEET;
    if (stage === 'towork') return MORNING;
    if (stage === 'report1') return REPORT1;
    if (stage === 'report2') return REPORT2;
    if (stage === 'report3') return REPORT3;
    if (stage === 'comet') return COMET;
    if (stage === 'report4') return REPORT4;
    if (stage === 'report5') return REPORT5;
    const short = {
      sample: 'Sit at your desk, and I will show you how it is done.',
      sampleFile: 'Stewart starts with S. Shelf P to Z. Click the shelf, and we will put the book away.',
      drawer: 'Still here? Fetch your hat, and mind that drawer. Then home to bed!',
      home1: 'Go home! Mrs. Hanlon locks the door at ten.',
      case1: 'Your stack is on your desk. Read the question first, then sort!',
      file1: 'The stacks are in the basement: the STACKS door, on the landing. We file by who made it, and when.',
      fetch2: 'The boxes are in the stacks. Shelves go by the maker’s name, A to Z.',
      case2: 'Miss Lyle’s letter is on your desk.',
      file2: 'Back in their boxes, please. By who made it, and when.',
      fetch3: 'Ganong and Parkman. Their boxes are in the stacks.',
      case3: 'New questions, old papers. Read each question first!',
      file3: 'File them by who made them, and when. Never by primary or secondary.',
      fetch4: 'Champlain, Lescarbot and Ganong. Lescarbot is on shelf G to O.',
      case4: 'Two accounts of one winter. Where they disagree, ask who was in a better position to know.',
      file4: 'Back in their boxes, please. Lescarbot goes on shelf G to O.',
      fetch5: 'Ganong, Kilby and Champlain. Kilby is on shelf G to O.',
      case5: 'Somebody proved it once, in 1797. Find out who, and how.',
      file5: 'Careful: Pagan’s words are printed in Kilby’s book, and Wright’s in Ganong’s. A paper goes back in the box of the book it is printed in.',
      free: 'More letters will come. Until then, enjoy the galleries.',
    }[stage];
    return [H(short || 'Yes?')];
  };

  const attendant = (stage) => {
    if (stage === 'arrive') {
      return [
        A('Good evening! You must be the new archivist. I’m Miss Doucet.'),
        A('Mr. Harrow, the Curator, is expecting you. The offices are upstairs.'),
        A('Take the door marked CURATOR, just behind the visitors’ book. Mind the stairs: they creak.'),
        { do: 'stage', stage: 'upstairs' },
      ];
    }
    if (stage === 'upstairs' || stage === 'meet') return [A('The door marked CURATOR, behind the visitors’ book. Mr. Harrow is waiting.')];
    if (stage === 'home1' || stage === 'drawer') return [A('Good night! King Square is to the left along Union Street. Mind the fog.')];
    if (stage === 'towork') return [A('Good morning! Did you buy any comet pills? My brother bought two boxes.'), A('Mr. Harrow is upstairs. Your first stack is waiting.')];
    if (stage === 'free') return [A('The keys are yours now. Mind the moths in Birds & Mammals.')];
    return [A('Busy day? The stacks are in the basement. Go up to the offices, then take the STACKS door on the landing.')];
  };

  // Mrs. Hanlon, the landlady (invented). Her boarding house on Sydney Street faces King Square.
  const hanlon = (stage) => {
    if (stage === 'hanlon1') {
      return [
        M('There you are! The new one from the museum. I’m Mrs. Hanlon. You’ll have the back room.'),
        M('Mr. Tull had it before you. Paid to the end of April, never came back for his trunk. Not a word!'),
        M('Breakfast is at seven. Porridge waits for no one.'),
        M('And if you’ve bought comet pills, don’t take them on an empty stomach.'),
        { do: 'stage', stage: 'sleep' },
      ];
    }
    if (stage === 'breakfast') {
      return [
        M('Morning! Porridge, tea, and the Standard. Everyone in Saint John is talking about one thing.'),
        M('My sister says the tail is poison. My husband says it’s nonsense. Read it and tell me who’s right.'),
        { do: 'paper' },
        Y('“I don’t expect any great change… it will scarcely be noticed.” Professor Blake, of the Toronto Observatory.'),
        Y('And Mr. Gage’s “scientist in Paris, or Portland”? The only Portland in here is about people falling off porches.'),
        M('So the astronomer says no, and the pill man says yes. I know which one I’d believe. Off to work with you!'),
        { do: 'stage', stage: 'towork' },
      ];
    }
    if (stage === 'sleep') return [M('Your room’s through there, on the right. Sleep well, and mind Mr. Tull’s trunk. It’s heavy.')];
    if (stage === 'towork') return [M('Off you go, or you’ll be late on your first day!')];
    return [M('Busy day at the museum?')];
  };

  // Percy Gage (invented), selling comet pills in King Square
  const gage = (stage) => {
    if (stage === 'towork') {
      return [
        G('My friend from the train! Changed your mind? Only a few boxes left!'),
        Y('I read the Standard. Professor Blake of the Toronto Observatory says the tail will scarcely be noticed.'),
        G('Blake! What does a professor know about comets?'),
        Y('Quite a lot, I should think. It is his job.'),
        G('…Pills! Comet pills!'),
      ];
    }
    if (stage === 'comet') return [G('Any minute now, folks! Any minute! …Any minute.')];
    return [G('Pills! Comet pills!')];
  };

  // the townsfolk in King Square (invented): ordinary people, ordinary worries
  const folk = (stage, n) => {
    const day = [
      [{ who: 'newsboy', text: 'Standard! Get your Standard! Comet tonight! Two cents!' }],
      [{ who: 'folk', text: 'They’re saying the tail goes over tonight. I’ve stuffed rags under all the doors, just in case.' }],
      [{ who: 'folk', text: 'Mourning for the King all month, and now a comet. What a May.' }],
    ];
    const night = [
      [{ who: 'newsboy', text: 'I sold every paper I had! Is it here yet? Mister! Is it here yet?' }],
      [{ who: 'folk', text: 'I can’t see a thing. Can you see a thing?' }],
      [{ who: 'folk', text: 'My husband took two pills. He says he feels wonderful. He also says he can’t feel his teeth.' }],
      [{ who: 'folk', text: 'Shh! I think it’s starting. …No. That’s the fog.' }],
      [{ who: 'folk', text: 'My grandfather saw it in 1835. He said it was the most beautiful thing he ever saw.' }],
    ];
    const set = stage === 'comet' ? night : day;
    return set[n % set.length];
  };

  // things to look at that are not catalogue cards
  const look = (id, stage) => ({
    trunk: [Y('A battered trunk. The initials E. T. are painted on the lid.'), Y('It is locked. Mr. Tull left it behind, and never came back for it.')],
    bed: stage === 'sleep' ? null : [Y(stage === 'breakfast' || stage === 'towork' ? 'No time for that! Breakfast, then work.' : 'Not yet. It has been a long day, but not that long.')],
    paper: [Y('The Standard. I will read it again.'), { do: 'paper' }],
    closed: [Y('The City Market is that way, up Charlotte Street. It is shut at this hour.')],
  }[id]);

  // going to bed: the night passes
  const sleep = [
    N('You sleep in Mr. Tull’s old room. Somewhere out in the fog, the foghorn sounds all night.'),
    { do: 'sleep', stage: 'breakfast' },
    N('Wednesday, the eighteenth of May, 1910. Tonight, says everybody, the Earth will pass through the tail of a comet.'),
  ];

  // ------------------------------------------------------------------ after the desk, the fetching and the filing
  const afterCase = (id) => ({
    c0: SAMPLE_DONE,
    c1: [Y('My first stack, sorted and proven. Now down to the stacks: every paper goes back in its box, by who made it and when.')],
    c2: [Y('Letter answered. Now these papers go back to their boxes in the stacks.')],
    c3: [Y('Same papers, new questions, new stamps. Back to the stacks with them.')],
    c4: [Y('Champlain counted 35, and he was there. Mr. Harrow can sleep tonight. Now, back to the stacks with these.')],
    c5: [Y('A map, some bricks and a border. Back to the stacks with these, and mind which book each one is printed in.')],
  }[id]);
  const afterFetch = (id) => [Y(id === 'c3' ? 'Both boxes. Back up to my desk.' : 'That’s all three boxes. Up to my desk with them.')];
  const afterFile = (id) => [Y(id === 'c1' ? 'Every paper back in its box, by who made it and when. Back up to Mr. Harrow.' : 'All filed. Time to see Mr. Harrow.')];
  const deskIdle = (stage) => (stage.startsWith('fetch')
    ? 'The papers aren’t here yet. I need to fetch the boxes from the stacks first.'
    : stage.startsWith('file') ? 'My arms are full of papers. They belong in the stacks, downstairs.'
      : 'My desk is tidy. Nothing to do here right now.');
  // the desk at a stage with no case can still hold a surprise
  const deskEvent = (stage) => (stage === 'drawer' ? DRAWER : null);

  // walking through a door can move the story on
  const onEnter = (stage, area) => {
    if (stage === 'upstairs' && area === 'office') return 'meet';
    if (stage === 'home1' && area === 'lodgings') return 'hanlon1';
    return null;
  };

  window.STORY = {
    stages, talk: { harrow, attendant, hanlon, gage, folk }, afterCase, afterFetch, afterFile, deskIdle, deskEvent, onEnter,
    opening, look, sleep,
  };
})();
