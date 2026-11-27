# The first evening: onboarding

The player arrives as the new archivist and learns the job by doing it once, with the Curator beside them. The
words are in `js/story.js`; the stages are run by the story code in `js/world.js`.

## Goals

1. Meet the boss, hear the job in four parts, see the office and the stacks.
2. Learn the rule of the office **before** touching a paper: primary or secondary depends on the research
   question. Practise it on something with no history in it (the Curator's diary) so the idea is clean.
3. Sort the first stack with every instruction printed, then do the full loop (letter → fetch → desk → file) with
   less help.
4. Hit the big idea again, hard: the same papers, new questions, new stamps.

## The flow

| Stage | Where | What happens |
|---|---|---|
| `arrive` | Entrance Hall | The attendant: "You must be the new archivist… the door marked CURATOR." |
| `upstairs` / `meet` | The offices | Mr. Harrow: the Society keeps papers; your job in four parts (card); PRIMARY / SECONDARY (card); "it depends on the QUESTION"; the diary quiz (two questions, same diary, two answers; a wrong pick explains and asks again); no answer without proof; your first research question (card). He walks you to your office. |
| `sample` | Your office | **The guided sample.** Mr. Harrow stands by the desk and coaches a practice paper on another subject: George Stewart's *Story of the Great Fire in St. John* (1877). His words appear in a bubble with Back and Next, and a pointing hand moves to what he is talking about: the pinned question, the WHEN and WHERE words, the label's MADE BY and WHEN lines, the stamps, the proof box, Check. "Your turn" steps wait for the student. Before the end he shows the twist: Stewart's last paragraph is about a fire in 1784, so for a question about 1784 the same book would be secondary. |
| `sampleFile` | The stacks | He walks you down. "Every box holds the papers of ONE maker… We never file by primary or secondary." A coached filing at shelf P – Z: read the paper's label, find S between P and Z, click the STEWART 1877 box. Then he sends you back up. |
| `case1` | Your office | The desk, case 1, on your own: read the question (click WHEN and WHERE), then two papers to stamp with proof (where to look is printed), and a question: can a map be a primary source? |
| `file1` | The stacks | Put three papers back in their boxes on shelves A–F, G–O, P–Z. |
| `report1` → `fetch2` | Curator's office → the stacks | A letter from Miss Lyle, a schoolteacher. The request slip: fetch three boxes. |
| `case2` | Your office | Same research question, read again. A first **compare** (Champlain and Parkman both say the ice cut them off), then two questions with proof (where Parkman got his facts; Ganong's fact or opinion). |
| `file2` → `report2` → `fetch3` | | Mr. Harrow's puzzle: what if the question changes? Fetch Ganong and Parkman again. |
| `case3` | Your office | Two NEW questions ("What was St. Croix Island like around 1900?", "How did historians in the 1860s tell the story?"). Ganong and Parkman are now PRIMARY. Last question: "What changed?" The question. |
| `file3` → `report3` | | "You cannot sort a paper until you know the question." Then **Chapter 2**. |

## Chapter 2: Two accounts (case `c4`)

Mr. Mott, a newspaperman, writes: Mr. Harrow said 35 men died on St. Croix Island, but a French book says 36. Fetch
Champlain, Lescarbot and Ganong (`fetch4`), then at the desk (`case4`): **compare** the two numbers (they disagree);
was Lescarbot there? (no: Ganong says he came two years later); so who was in a better position to count? (Champlain);
**compare** the frozen cider (they agree, but Lescarbot learned it from the men who were there); **sort** Lescarbot's
lines into CAN BE CHECKED and HIS OPINION; and what does Lescarbot think of the island? (a prison; Champlain saw a fort).
File (`file4`), report (`report4`).

## Chapter 3: The ruins that drew a border (case `c5`)

Miss Lyle again: her pupil Tom asks how we KNOW Dochet Island is the real St. Croix Island. Fetch Ganong, Kilby and
Champlain (`fetch5`), then (`case5`): put the story in **order** (1604 → 1613 → the 1783 treaty → Pagan digs, 1797 →
the 1798 decision); **write the label** of Pagan's sworn statement, whose MADE BY and WHEN are blank (Pagan, 1797, not
Kilby, who printed it in 1888); stamp it primary for the 1797 question; **compare** Pagan's "spot marked A" with A on
Champlain's map; **compare** Wright's 1797 survey with Champlain on fresh water; the American agent's rival
explanation (a later trading post); and Ganong's judgement: the island didn't decide the border alone, but it helped
the commissioners all agree. Filing teaches that a paper printed in someone else's book lives in that book's box.
File (`file5`), report (`report5`), then `free`.

## Knowing where to go

- The **To do** note (bottom left) always says the next step.
- A **pointing hand** floats over the next thing to use (the attendant, a door, Mr. Harrow, your desk, the right
  shelf), or over the door that leads toward it, or at the edge of the screen when it is off to the side.
- On the desk, if nothing is clicked for six seconds, the hand points at what to do next.
- Dialogue has **Back** and **Next** (and the ← → keys), so a line read too fast can be read again.
- On the desk, **◂ Back** (or a coloured pip) shows earlier answers with their proof.

## How the big idea keeps coming back

- The research question is pinned to the top of the desk all the time, with its WHEN / WHERE marked.
- Every case starts by reading the question, even when it is the same question as before.
- Stamp buttons say what PRIMARY and SECONDARY mean *for this question*; stamps say which question they were for.
- Filing is by maker and date, and the Curator says why: tomorrow's question will be different.
- The end-of-case report closes with a "Remember" line.

## Not done yet (ideas)

- More letters after `free`, arriving in the LETTERS rack on the landing.
- Other activities in the same building that are not about sources (the user wants the museum to hold other
  social studies activities too). `js/desk/main.js` is where a new activity plugs in.
- Mr. Harrow walking (he only appears and disappears behind a fade).
- A teacher view of seals per student.
