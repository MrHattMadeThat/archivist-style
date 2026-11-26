// The story: the new archivist's first evening. Every objective and every line anyone says is in this file, so the
// words can be changed without touching the 3D code. The plan behind it is in docs/ONBOARDING.md.
//
// A line is { who: 'harrow' | 'attendant' | 'you', text }. Extras:
//   card: 'duties' | 'rule' | 'rq' | 'slip'   a card shown above the words (rq and slip need `case`)
//   choices: [{ label, ok, reply }]            a question; a wrong choice shows its reply and asks again
//   do: 'stage' | 'toOffice' | 'harrowHome'    something happens (with `stage`: the stage to move to)
// Lines are short on purpose: two sentences at most, so a Grade 6 reader can take each one in at a glance.
//
// Mr. Harrow, the attendant and Miss Lyle are invented. The building's rooms upstairs and downstairs are invented.
(function () {
  const H = (text, more) => ({ who: 'harrow', text, ...more });
  const A = (text, more) => ({ who: 'attendant', text, ...more });
  const Y = (text) => ({ who: 'you', text });

  // stage: { obj (the To do note), case/fetch/file (which case), harrow ('home' | 'desk'), next }
  const stages = {
    arrive: { obj: 'Talk to the attendant at the front desk.' },
    upstairs: { obj: 'Go through the door marked CURATOR, behind the visitors’ book.' },
    meet: { obj: (area) => (area === 'office' ? 'Talk to Mr. Harrow. His office is on the left.' : 'Go up to the offices: the door marked CURATOR.') },
    case1: { obj: 'Sit at your desk and sort the stack of papers.', case: 'c1', harrow: 'desk', next: 'file1' },
    file1: { obj: 'File the papers in the stacks, in the basement. Take the STACKS door on the landing.', file: 'c1', next: 'report1' },
    report1: { obj: 'Go back up to Mr. Harrow’s office.' },
    fetch2: { obj: 'Fetch three boxes from the stacks, in the basement.', fetch: 'c2', next: 'case2' },
    case2: { obj: 'Take the boxes up to your desk. Answer Miss Lyle’s letter.', case: 'c2', next: 'file2' },
    file2: { obj: 'File the papers back in the stacks.', file: 'c2', next: 'report2' },
    report2: { obj: 'Tell Mr. Harrow that Miss Lyle’s letter is answered.' },
    fetch3: { obj: 'Fetch two boxes from the stacks again.', fetch: 'c3', next: 'case3' },
    case3: { obj: 'At your desk: stamp the papers for the NEW questions.', case: 'c3', next: 'file3' },
    file3: { obj: 'File the papers back in the stacks.', file: 'c3', next: 'report3' },
    report3: { obj: 'Tell Mr. Harrow what you found.' },
    free: { obj: 'The museum is yours to explore. More letters will come.' },
  };

  // ------------------------------------------------------------------ meeting the Curator (the onboarding)
  const MEET = [
    H('Ah! You must be our new archivist. Come in, come in. I am Mr. Harrow, the Curator.'),
    H('This Society keeps rocks, birds and fossils by the thousand. But we also keep PAPERS: books, letters and maps.'),
    H('People write to us with questions about the past. The papers hold the answers. Finding them is your job.'),
    H('Your work has four parts. You will do them again and again.', { card: 'duties' }),
    H('Now, the most important lesson in this office. Listen closely.'),
    H('Sources come in two kinds.', { card: 'rule' }),
    H('But here is what most people forget. Primary or secondary depends on the QUESTION you ask.'),
    H('Take my diary. I write in it every night, about my day.'),
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
    H('Same diary. Two questions. Two different answers. So you never sort a paper until you know the question.'),
    H('And one more rule: no answer without proof. In this office you point at the words that prove it. A guess is not an answer.'),
    H('Here is your first research question.', { card: 'rq', case: 'c1' }),
    H('There is a stack of papers about it on your desk. Come, I will show you your office.'),
    { do: 'toOffice', stage: 'case1' },
    H('Here we are. Your desk, your lamp, and your first stack.'),
    H('Sort each paper: primary or secondary, for THIS question. Prove every stamp. Sit at your desk when you are ready.', { card: 'rq', case: 'c1' }),
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

  const REPORT3 = [
    H('Ganong was secondary, then primary. Parkman too. Did the papers change?'),
    H('No. The QUESTION changed. Remember that all your life: you cannot sort a paper until you know the question.'),
    H('That is all the letters for tonight. The galleries are yours. Have a look around.'),
    { do: 'stage', stage: 'free' },
  ];

  const harrow = (stage) => {
    if (stage === 'meet' || stage === 'arrive' || stage === 'upstairs') return MEET;
    if (stage === 'report1') return REPORT1;
    if (stage === 'report2') return REPORT2;
    if (stage === 'report3') return REPORT3;
    const short = {
      case1: 'Your stack is on your desk. Read the question first, then sort!',
      file1: 'The stacks are in the basement: the STACKS door, on the landing. We file by who made it, and when.',
      fetch2: 'The boxes are in the stacks. Shelves go by the maker’s name, A to Z.',
      case2: 'Miss Lyle’s letter is on your desk.',
      file2: 'Back in their boxes, please. By who made it, and when.',
      fetch3: 'Ganong and Parkman. Their boxes are in the stacks.',
      case3: 'New questions, old papers. Read each question first!',
      file3: 'File them by who made them, and when. Never by primary or secondary.',
      free: 'More letters will come. Until then, enjoy the galleries.',
    }[stage];
    return [H(short || 'Yes?')];
  };

  const attendant = (stage) => {
    if (stage === 'arrive') {
      return [
        A('Good evening! You must be the new archivist.'),
        A('Mr. Harrow, the Curator, is expecting you. The offices are upstairs.'),
        A('Take the door marked CURATOR, just behind the visitors’ book. Mind the stairs: they creak.'),
        { do: 'stage', stage: 'upstairs' },
      ];
    }
    if (stage === 'upstairs' || stage === 'meet') return [A('The door marked CURATOR, behind the visitors’ book. Mr. Harrow is waiting.')];
    if (stage === 'free') return [A('The keys are yours now. Mind the moths in Birds & Mammals.')];
    return [A('Busy evening? The stacks are in the basement. Go up to the offices, then take the STACKS door on the landing.')];
  };

  // ------------------------------------------------------------------ after the desk, the fetching and the filing
  const afterCase = (id) => ({
    c1: [
      H('Finished? Let me see. Every stamp with its proof. Well done.'),
      H('Now the papers go back downstairs into the stacks. And here is something new archivists get wrong.'),
      H('We do NOT file papers as primary or secondary. Tomorrow someone will bring a different question, and the stamps will change.'),
      H('We file by WHO MADE IT and WHEN. That never changes. The stacks are in the basement: the STACKS door, on the landing.'),
      { do: 'harrowHome', stage: 'file1' },
    ],
    c2: [Y('Letter answered. Now these papers go back to their boxes in the stacks.')],
    c3: [Y('Same papers, new questions, new stamps. Back to the stacks with them.')],
  }[id]);
  const afterFetch = (id) => [Y(id === 'c2' ? 'That’s all three boxes. Up to my desk with them.' : 'Both boxes. Back up to my desk.')];
  const afterFile = (id) => [Y(id === 'c1' ? 'Every paper back in its box, by who made it and when. Back up to Mr. Harrow.' : 'All filed. Time to see Mr. Harrow.')];
  const deskIdle = (stage) => (stage.startsWith('fetch')
    ? 'The papers aren’t here yet. I need to fetch the boxes from the stacks first.'
    : stage.startsWith('file') ? 'My arms are full of papers. They belong in the stacks, downstairs.'
      : 'My desk is tidy. Nothing to do here right now.');

  // walking through a door can move the story on
  const onEnter = (stage, area) => (stage === 'upstairs' && area === 'office' ? 'meet' : null);

  window.STORY = { stages, talk: { harrow, attendant }, afterCase, afterFetch, afterFile, deskIdle, onEnter };
})();
