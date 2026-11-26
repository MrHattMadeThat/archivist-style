// The guided sample: Mr. Harrow sits with the new archivist and shows the whole job once, on a paper about a
// different subject (the Great Fire of 1877 in St. John), then files it with them in the stacks.
// Each step's words go with what the hand points at. See coach.js for how a step works (and how it locks the page to
// the current step). Keep each `say` to two short sentences.

const marked = (d, tag) => (d.state.marked?.[Object.keys(d.state.marked).find((k) => k.includes('Great Fire'))] || []).includes(tag);
const PROOF = ['stewart-fire@when', 'stewart-fire@by'];

// at the desk; d is window.desk
export const SAMPLE_COACH = (d) => [
  { say: 'Before your stack, let me show you how it is done, on a different paper. This one is about the Great Fire of 1877, right here in St. John.', point: '.rqcard' },
  { say: 'Always start with the research question. It is pinned to the top of your desk, and it stays there.', point: '.rqcard' },
  { say: 'Find WHEN this question is about. Click those words in the question.', point: '.rq-mark[data-tag="WHEN"]', until: () => marked(d, 'WHEN') },
  { say: 'Good. Now click the words that say WHERE.', point: '.rq-mark[data-tag="WHERE"]', until: () => marked(d, 'WHERE') },
  { say: 'So, for THIS question, a primary source was made by someone in St. John, at the time of the fire. The card says it too.', point: '.rule-now' },
  { say: 'Click Next, and the paper comes out from under the paperweight.', point: '.work .next', until: () => d.state.task >= 1 },
  { say: 'Here it is: a book about the fire. Don’t read it all yet. Read the LABEL first.', point: '.sheet .tag' },
  { say: 'MADE BY: George Stewart, of St. John. He lived in the city that burned.', point: '.sheet .tag-row:nth-child(1)' },
  { say: 'WHEN: 1877. The same year as the fire.', point: '.sheet .tag-row:nth-child(2)' },
  { say: 'Under the label are the easy words: what he wrote, told simply. His own words are in the next tab, if you want them.', point: '.sheet .body p' },
  {
    say: 'Now you decide. Was this made by someone who was there, at the time? Choose a stamp.',
    point: '.pads', until: () => d.task?.pick === 'primary',
    wrong: () => d.task?.pick === 'secondary', wrongSay: 'Look at the label again. He lived in St. John, and he wrote in 1877. Was he there? Choose again.',
  },
  {
    say: 'Yes. Now prove it. Click the line in the label that shows WHEN it was made.',
    point: '.sheet .tag-row:nth-child(2) .line', allow: '.sheet .tag', until: () => PROOF.includes(d.sel) && d.task?.pick === 'primary',
    wrong: () => !!d.sel && !PROOF.includes(d.sel), wrongSay: 'That line is about the fire, not about when the book was made. Try the label, the line WHEN.',
  },
  { say: 'Your proof is in the box. Click Check.', point: '.work .go:not(.next)', until: () => !!d.state.results?.[1] },
  { say: 'There is the stamp: PRIMARY, for THIS question. Not primary forever. Only for this question.', point: '.sheet .ink' },
  { say: 'A secret. Look at his last paragraph: a fire in 1784. Stewart was not born yet. For a question about 1784, this same book would be SECONDARY.', point: '.sheet .body p:last-child' },
  { say: 'That is the whole job: the question first, then the label, then a stamp, then the proof. Click Finish.', point: '.work .next', until: () => !!d.state.done },
  { say: 'Now click the button to gather up the paper. We will put it away together.', point: '.desk-modal .go', until: () => false },
];

// at the shelf; s is window.shelf
export const SHELF_COACH = (s) => [
  { say: 'This is the paper from your desk, in your arms. Read its label: who made it, and when?', point: '.armpaper' },
  { say: 'George Stewart, in 1877. We file by WHO MADE IT and WHEN. Never by primary or secondary.', point: '.armpaper' },
  { say: 'This shelf holds makers from P to Z. Stewart starts with S, so his box is on this shelf.', point: '.rack-sign' },
  {
    say: 'Click the paper, then click the box that says STEWART, 1877.',
    point: () => (s.pick ? '.abox[data-box="stewart"]' : '.armpaper'), allow: '.armpaper, .abox', until: () => s.carrying.length === 0,
    wrong: () => !!s.wrong, wrongSay: 'Not that box. Read the box labels: you want STEWART, 1877.',
  },
  { say: 'Filed. Tomorrow, anyone with any question can find it again. Click Step back.', point: '.stacks .leave', until: () => false },
];
