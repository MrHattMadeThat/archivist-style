# Writing tasks for the source desk

How every question on the desk is worded and laid out, so a Grade 6–8 student always knows **what is being asked,
what to click, and where to find the proof.** These rules came out of The Archive Desk, where even the teacher
sometimes couldn't tell what a question wanted clicked.

`node scripts/check.mjs` enforces the parts a machine can check (every task has `look` and `shows`, every proof ref
finds exactly one line, no more than four options, questions under 25 words).

## The big idea comes first

**Primary or secondary depends on the research question.** So the research question is always on the desk, pinned
at the top, and the desk never asks anyone to sort a paper before they have read it.

- Every case starts with **Read the question** (`readq`): the student clicks the words that say WHEN and WHERE
  (or WHO). The desk then says, in plain words, what PRIMARY and SECONDARY mean *for this question*
  (`rq.primary`, `rq.secondary`).
- The stamp buttons repeat that meaning. They never just say "Primary"; they say "PRIMARY: made by someone who was
  there: on St. Croix Island, in the winter of 1604–1605."
- Every stamp on a paper says which question it was for: "PRIMARY for the 1604–05 question".
- When a task brings a new question, the pinned card says **New question!** and the student reads it again.
- Archive boxes are filed by **who made it and when**, never by primary or secondary. Mr. Harrow says why.

## The card: same parts, same order, every time

```
SORT A PAPER                                   2 of 5
① Is this paper primary or secondary for your question?
   Your question is about: the winter of 1604–1605 · St. Croix Island
   [ PRIMARY  made by someone who was there… ] [ SECONDARY  made later… ]
② Prove it. Click the line in the paper that shows it.
   Where to look: The label at the top of the paper, the line WHEN.
   Your proof should show: That it was written long after 1604–1605.
   ┌ YOUR PROOF ─────────────────────────────┐
   │ Click a line in the paper. It will appear here. │
   └─────────────────────────────────────────┘
   [Need a hint?]                                  [Check]
```

1. **One thing per step, numbered.** Step 2 is greyed until step 1 is done. A student can always see which step is
   "now" (red number) and which are done (green tick).
2. **Steps start with a verb**: Choose, Click, Prove it. Never "Consider" or "Identify".
3. **One click means one thing.** On the desk, clicking a line of a paper always means "this is my proof". (The old
   desk also used clicks to collect notebook words; that is gone here.)
4. **The card never scrolls** at 1366 × 650 (the lab PCs), in any state: before answering, after a wrong answer
   with every hint open, and after it's done. Finished steps collapse to one line. Test with the loop in CLAUDE.md.

## Wording the question (`ask`)

- **One question, one sentence, under 25 words.** If it needs a setup sentence, the setup comes first and is short:
  "Parkman says 35 of the 79 men died. Where did Parkman get his facts?"
- **Ask about something the student can point at.** If no single line proves the answer, it is not a desk question.
- Use the **source's name**, not "the source" or "Document B": "Champlain's frozen-cider pages", "Parkman's paper".
- Avoid double negatives and "Which of the following is NOT…".
- Keep words at a Grade 6 level. A hard word the question needs is explained in the same sentence.

## Options (`options`)

- **Four at most**, each under 12 words, each a full answer on its own ("Ice in the river cut them off.").
- One clearly right answer. The wrong ones are **believable mistakes students actually make** ("Newer is always
  more correct", "Old books turn primary after 50 years"), not jokes.
- Don't make the right answer the longest one every time.

## Where to look (`look`): the most important line

The student must never have to guess *which part of which paper* holds the proof.

- Name the paper and the part: **"The label at the top of the paper, the line WHEN."**, **"Champlain's
  frozen-cider pages, paragraph 2."**, **"Ganong's paper, the last paragraph."**
- Paper parts have fixed names, the same on the card and on the paper: *the label* (MADE BY, WHEN, WHAT IT IS,
  WORDS), *the easy words*, *paragraph 1, 2, 3*.
- Proof can only be picked in the **label** or the **easy words**. The other tabs (his own words, the 1613 pages)
  are for reading. The paper says so when another tab is open.

## What the proof must show (`shows`)

Say what the right line *does*, not what it says, so the student still has to find it:
"Who made it, and whether they were on the island that winter." / "Words that tell you it is about something that
did NOT happen."

## `guide`: teach first, then step back

- `guide: 'show'`: WHERE TO LOOK and WHAT IT MUST SHOW are printed from the start. Use it the first time a skill
  appears (the first stamp, the first multiple-choice question, the first stamp for a new question).
- `guide: 'hint'`: both are behind **Need a hint?** Hint 1 = where to look, hint 2 = what it must show, hint 3
  outlines the part of the paper with a dashed box. Using a hint gives a silver seal, never a failure.

## Feedback

- **A wrong line** empties the proof box and shows a hint in its place. Write a `near` hint for every line a student
  is likely to pick by mistake, and say *why it isn't proof* and *where to go instead*: "That is a fact about 1604,
  but anyone can repeat a fact. When was this written?"
- **A wrong stamp or answer** is corrected straight away ("This one is primary…") and the student still finds the
  proof. Keep `wrong` to two short sentences.
- **`right`** explains in one or two sentences, quoting the source where it helps: "“Of the 79 of us, 35 died.” He
  counted his own companions."
- **`mail`** is what happens in the world when a paper is mis-stamped. It is a small, funny, believable 1910
  consequence, never a scolding.

## Coaching steps (the guided sample)

- One `say` per step, two short sentences at most, about the thing the hand points at. If the hand points at the
  label's WHEN line, the words are about WHEN.
- A step where the student must act has `until`, and the bubble shows **Your turn**. Give it a `wrong` / `wrongSay`
  for the likely mistake.
- Never let a coached step hand out a red seal: guide the student to the right choice before they can press Check.

## Sources

- **Real sources only**, public domain or quoted with credit, and **only sources that existed by 1910** (the desk is
  in Saint John in 1910). No modern web pages on this desk.
- The **easy words** retell the source simply and add nothing. Every fact in them must be in the original, which is
  always one tab away.
- Write down where each source came from in `docs/SOURCES.md`.
