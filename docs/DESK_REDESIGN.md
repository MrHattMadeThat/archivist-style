# The source desk: redesign plan (2026-11-27)

The user's report: the desk "has kids confused when it pops up". On square monitors it squeezes the paper in the
centre and pushes buttons off the screen. The goal: a modern interface that is easy to read and easy to follow, and
that still looks like it belongs to the Gaslight world (card stock, ink, brass and gas light, the paper cut-out look).

**Status (2026-11-28): built in the game** (mockup approved by the user). What was built, and how to check it, is in
CLAUDE.md under "The desk redesign". Not built from this plan: the stacks and the newspaper restyle (Risks).

**The mockup**: `docs/mockups/desk.html` (open it through the local server, e.g. `http://localhost:5546/docs/mockups/desk.html`).
It is a clickable desk built only from real content: reading the question (case 1), stamping Parkman (case 1) and the
Champlain / Parkman compare (case 2), with a size switcher. It is not wired to the game and saves nothing. Checked in
the browser: in ten states (fresh, wrong answer with hints, the papers drawer, solved), at all eight target sizes plus a
narrow one, every button stays on the screen and nothing scrolls sideways. The paper is at least 423 px wide at 820 × 615 (it was 139 px).

## 1. What is wrong now (measured in the browser, 2026-11-27)

The desk is a fixed three-column grid: **papers 200 px | the paper | the work card 410 px** (`.desk-main` in
`css/desk.css`). The paper gets only what is left over.

| Screen (CSS px)                         | Width left for the paper | Result                                                        |
|-----------------------------------------|--------------------------|---------------------------------------------------------------|
| 1366 × 650 (lab PC, the only size tested) | ~700 px                | fine                                                          |
| 1280 × 1024 (5:4 "square" monitor)      | 614 px                   | readable; the work card floats in a mostly empty 930 px column |
| 1024 × 768 (4:3)                        | 343 px                   | the label table fills the column; tabs wrap to two rows        |
| 820 × 615 (1024 × 768 at Windows 125 %) | **139 px**               | the title runs one word a line; the label is unreadable        |

**Buttons off the screen.** `.work` has no scrolling. At 820 × 615, after solving the compare tasks in cases 4 and 5,
**Finish the case** sits at 631 px on a 615 px screen: it cannot be reached. The card height rule was only ever
checked at 1366 × 650, so this slipped through.

Other problems seen on screen:

1. **Three places to look at once.** The question bar, the case title and dots, the papers list, the paper (with two
   rows of tabs), and the work card all appear together. Nothing says "start here".
2. **Two rows of tabs** on the paper: which paper (`.doctabs`) and which version (Easy words / his own words / the 1613
   page, `.tabs`). They look alike and do different things.
3. **The papers column** is 200 px wide even with one paper, and the "Already used" list grows down the side.
4. **Research question tags overlap.** The WHEN / WHERE tags sit above the marked words; when the question wraps, a tag
   covers the line above ("How did people prove" was hidden at 820 px).
5. **The work card shows every step at once**, greyed later steps included. Kids read the greyed steps as things to do.
6. **The idle hand covers the words it points at** (seen on "Click the words that say WHEN").
7. **The progress dots** (diamond, circles, gold/silver/red) are not explained anywhere.
8. **Tiny labels.** Many labels are 10–12 px typewriter capitals (`.proof-label`, `.slots .proof-label`, `.tally-col`).
   Hard for Grade 6–8 readers and low contrast on the wood (`#cbbf9f` on brown).
9. **On tall screens** the work card is 400 px tall in a 930 px column: the space is wasted, the card looks lost.
10. **It arrives all at once.** The desk is an opaque screen that replaces the world with no change of scene, then a
    letter covers it.

## 2. The design

### The idea: your desk under the gas lamp

Make the screen look like what it is: a desk seen from above, lit by one lamp. The paper you are reading lies in the
pool of light in the middle. Around it the wood falls away into the blue night of the Gaslight palette. Everything you
use is a thing on the desk, drawn in the same cut-paper style as the world:

- the **research question**: a slip pinned at the top (as now, but cleaner)
- the **paper**: a sheet in the lamp light, with its archive tag tied on
- the **task**: an index card from the Archivist's own pocket (ruled blue lines, a red margin rule, as the `note` cards
  in the dialogue already look)
- the **papers for this task**: folder tabs sticking out from under the sheet
- **progress**: a strip of index cards or small wax seals along the top, each with a word, not a bare dot
- **stamps**: rubber-stamp ink, as now

"Cutting edge" here means how it behaves, not chrome: it fits any screen, shows one thing to do at a time, always
keeps the next button in reach, and lights up only what matters now.

### Layout: two areas, not three

```
┌ Case title · progress cards (with words) ······················· Leave the desk ┐
│ YOUR RESEARCH QUESTION: What happened to the French on St. Croix Island …          │
├────────────────────────────────────────────────┬──────────────────────────────────┤
│ [Champlain ▾][Ganong][Pagan]   Other papers (4) │  NOW: Choose primary or secondary │
│ ┌────────────────────────────────────────────┐ │  ┌──────────────────────────────┐ │
│ │ FROZEN CIDER, MELTED SNOW …                │ │  │ ✓ 1 Read the label            │ │
│ │ ┌ tag: made by / when / what it is ┐       │ │  │ ● 2 Primary or secondary?     │ │
│ │ Read it in: (Easy words)(1878)(1613)       │ │  │   [PRIMARY]   [SECONDARY]      │ │
│ │ That winter all our drinks froze …         │ │  │                                │ │
│ │                                            │ │  ├──────────────────────────────┤ │
│ └────────────────────────────────────────────┘ │  │ [ Check ]        (always here) │ │
└────────────────────────────────────────────────┴──┴──────────────────────────────┴─┘
```

- **The papers column goes.** The papers for this task become **folder tabs** along the top of the sheet (this merges
  `.pile` and `.doctabs` into one row). Papers already used go behind an **Other papers (n)** button that opens a small
  drawer. That gives the paper back 214 px.
- **The version tabs become one small switch inside the sheet**, under the label: "Read it in: Easy words · His own
  words · The 1613 page". It looks like a switch, not like a second set of folder tabs.
- **The paper keeps a readable width**: never narrower than about 440 px (55–60 characters a line), never wider than
  about 720 px. The label (archive tag) stacks its rows ("MADE BY" above the name) when the sheet is narrow, using a
  container query, so it never eats the column.
- **The task card scrolls inside itself, and its button bar is pinned to the bottom of the card** (Check / Next /
  Finish the case). The rule becomes: **no button is ever off the screen, at any size.** The card fills the height of
  its column on tall screens instead of floating.

### Fitting every screen

Sizes are by the desk's own width and height (container queries), so Windows scaling is covered too:

| Desk width   | Layout                                                                                            |
|--------------|---------------------------------------------------------------------------------------------------|
| ≥ 1200 px    | paper (up to 720) + task card 400 px; spare width goes to the wood around them, centred under the lamp |
| 800–1200 px  | paper (≥ 440) + task card 320–360 px; label stacks; smaller title                                 |
| < 800 px     | one column: the paper on top, the task card as a dock at the bottom (up to ~45 % of the height, scrolls inside, button bar pinned). A "Read the paper ↑ / Back to the task ↓" handle switches the focus |
| height < 640 | the question bar shrinks to one line with a "show all" toggle; progress cards shrink to seals      |

The target list for checking (CSS px): **1366 × 650** (lab), 1366 × 768, 1280 × 1024, 1024 × 768, 1093 × 614
(1366 × 768 at 125 %), 820 × 615 (1024 × 768 at 125 %), 1536 × 864, 1920 × 1080.

### Making it obvious what to do

- **One "Now" line at the top of the task card**, in plain words: "Now: click the words in your question that say
  WHEN." It changes with each step. It is the first thing a student's eye should land on.
- **One step at a time.** Done steps fold to a single line with a tick (click to re-open); the current step is full
  size; later steps are hidden, not greyed. A small "Step 2 of 3" shows there is more.
- **The lamp follows the work.** While a step needs the question, the paper or the card, that part sits in full light
  and the rest dims a little (the coach already does a mild version of this with `.desk.coached`). This is the
  everyday version of what Mr. Harrow does in the tutorial. Not a flash, no animation beyond 0.15 s.
- **Clickable lines look clickable before you hover.** On a "Prove it" step, every line in the paper gets a faint
  dotted underline and the sheet shows a small pencil note in the margin: "Click a line to use it as proof". (Now it
  only shows on hover, and the hint is a 11 px label above the tag.)
- **The idle hand points from the side** and never covers the words it points at (place it beside the target's box,
  and pick the side with room).
- **Progress with words.** The top strip shows each task as a small card: "Question · Sort · Sort · Ask", with the
  seal colour on finished ones and a key in the tooltip ("Gold: proven first time"). Clicking a finished one still
  looks back, as now.
- **Arriving at the desk** (user, 2026-11-28). A 0.15 s fade to the desk, then the case letter, which no longer repeats
  the question (its button is **Read your question**). Then the research question floats **big in the middle of the
  screen**, "Your Research Question" larger still, with a pulsing lamp glow round the card and a gleam across the title
  to draw the eye (the user asked for an effect here; it stops with prefers-reduced-motion). The `readq` task happens on
  that big card: click the words that say WHEN, then WHERE. A moment later the card **flies up** into its place (a slip
  sized to its words, centred under the top bar) and a **brass pin drops in**. The desk behind is dimmed until then.
- **No words on an empty desk.** While there is no paper yet, the blotter is blank except for the paperweight. Extra
  sentences there only gave students more to scan.

### Matching the world's look

- **Paper as cut paper.** Sheets, cards and slips get the world's pale cut margin and a light paper grain (one small
  grain texture drawn once on a canvas with the same ink toolkit, reused as a CSS background), slightly uneven edges
  (`clip-path`, as `.title-card` already does) and the hard offset shadows already in use.
- **The desk surface.** Dark wood at the edges falling into the Gaslight blue-black; a green baize blotter under the
  paper; one warm pool of lamp light (`--amber`) centred on the paper. No bright flat brown background.
- **Type, three roles only.** Source Serif 4 for everything students read (raise the paper text to 18 px and the
  smallest text on the desk to 14 px); IM Fell English SC for titles; Special Elite only for short stamped or typed
  labels, never below 13 px. Fewer letter-spaced capitals.
- **One set of colour tokens.** `desk.css` uses `--card`, `--card2`, `--f-read`, and also `--paper`, `--dim`,
  `--f-type`, `--f-display` from `index.html`. Put the shared ones in one place and name the roles (surface, ink,
  primary red, secondary blue, focus amber).
- **Contrast.** All text at WCAG AA at least: the pale `#cbbf9f` labels on the wood fail at the sizes used.
- **Buttons sized for kids**: at least 40 px tall, the main action in brass (as the coach's Next already is).

## 3. How to build it (in order, each step shippable)

1. **A layout check first** (`desk.layoutCheck()` hook, run in the browser): for every task of every case, at every
   target size, in three states (fresh; wrong first answer with every hint open; solved), assert: every button is
   inside the screen, no part of the desk scrolls sideways, the paper is at least 440 px wide (or the desk is in its
   one-column layout). It replaces the 1366 × 650 card height check. It fails today (cases 4 and 5 at 820 × 615).
2. **Stop the breakage** (small, ship it alone, fixes the report from class): the task card scrolls with its button bar
   pinned; the paper gets a minimum width and the papers column folds away under ~1100 px; the label stacks when
   narrow; the question's WHEN / WHERE tags move under the words so they cannot cover the line above.
3. **The new layout**: folder tabs + Other papers drawer; the version switch inside the sheet; two areas; the
   one-column dock below 800 px.
4. **Making it obvious**: the Now line, one step at a time, the lamp dimming, visible clickable lines, the idle hand
   placement, progress cards with words, the arrival.
5. **The look**: desk surface and lamp pool, cut-paper sheets and cards, type and colour tokens, contrast.
6. **Check it**: the layout check at all sizes; the guided sample end to end (see Risks); `node scripts/check.mjs`; a
   class playtest on a lab PC and on the square monitors.

## 4. Risks

- **The guided sample points at class names.** `js/desk/tutorial.js` points and locks with selectors such as
  `.rqcard`, `.rq-mark[data-tag="WHEN"]`, `.pads`, `.sheet .tag`, `.sheet .tag-row:nth-child(2)`, `.sheet .body p`,
  `.sheet .ink`, `.work .go:not(.next)`, `.work .next`, `.desk-modal .go`. The desk's idle hand (`nudgeTarget()` in
  `desk.js`) does the same. Keep these class names, or change the tutorial in the same step, and walk the guided sample
  end to end after every stage.
- **Hiding later steps changes what the coach can point at.** If a coach step points at a step that is now folded or
  hidden, open it for him.
- **Other sessions share this checkout.** `css/desk.css` also holds the dialogue, title, pause and Options styles, and
  has uncommitted work from the title screen session. Stage only the desk hunks. Moving the desk styles into their own
  file early would make this easier.
- **The stacks and the newspaper** (`.stacks`, `.newsroom`) have their own layouts. They are not part of this plan, but
  they should get the same look (step 5) so the three paper screens feel like one game.
- **The coach bubble** sits bottom left at `min(600px, 100vw - 460px)`. With the new layout it should sit over the
  wood, not the paper; place it per layout.

## 5. Decisions for the user

1. **Below 800 px wide**: the paper on top with the task docked at the bottom (recommended), or a Paper / Task switch
   that shows one at a time.
2. **Later steps**: hidden until reached (recommended) or shown greyed as now.
3. **A mockup first**: a clickable HTML mockup of one stamp task and one compare task at three sizes, to approve the
   look before the real desk changes (recommended, since the look is the user's call).
