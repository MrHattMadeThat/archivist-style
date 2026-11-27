# Handoff: The Archivist (museum game samples)

Read `README.md` first. This file is for agents working in the repo.

## Direction from the user (keep to these)

- Educational game. Setting: **Saint John, N.B., around 1910**, the Natural History Society of New Brunswick's museum on Union Street.
- Palette: **Gaslight** (blue night, amber gas light). Mothball and Formaldehyde stay in `arrival.html` only for comparison.
- Weirdness must be **historically accurate**. No invented creatures, glowing eyes or fake mottos. Every exhibit label states something true; where a 1910 label was wrong, the card says so under "What we know now".
- The Archivist stands **upright** (the user asked for less hunch).
- Wolastoqey and Mi'kmaq belongings are deliberately not shown yet. Don't add them without the user deciding how.

## How the art works

- Every sprite is drawn in code: `T(w, h, drawFn, {border})` makes a canvas texture. `compose()` adds the pale paper cut margin and grain. `S(tex, ppu, ax, ay)` makes a pivoted plane.
- The Archivist is a pinned paper rig: legs, coat, arms, head, hat, scarf and suitcase. Side and back body drawings plus side, front and back heads are swapped at the edge-on frame of a flip.
- The ink toolkit (`path`, `ink`, `hatch`, `shade`, `mottle`...) is copied in both pages. If a third page appears, pull it into a shared script.

## Character style (both figures; keep new characters to it)

- `cel()` shading: flat base colour, a hard-edged shadow crescent on the side away from the light (light from upper right) with hatching inside, and a thin warm gaslight rim on the lit edge.
- Heavy outer outline, thin inner lines, dashed `stitch()` seams, `flecks()` for wool texture.
- Period dress drawn as cut cloth. The Archivist wears a Chesterfield overcoat with a velvet collar, pinstripe trousers with turn-ups, and spats over boots. The attendant wears a striped 1910 shirtwaist with a high boned lace collar, a cameo and a ruffled jabot, and a Gibson-style pompadour with a pencil tucked in.
- Signatures: round spectacles, the striped scarf, the quill in the hat, index cards in the pocket.
- The Archivist has side, back and **front** drawings for coat, legs and head. Walking toward the camera shows the front, and standing still for a few seconds or opening a card turns them to face the viewer.
- Arms are two pinned pieces (`makeArm`): upper arm at the shoulder and forearm at the elbow. The case hand uses the gripping forearm. The case hand is the Archivist's left: screen right from the front, screen left from behind.
- The attendant is a small rig: body, head, eyes and writing arm. She writes until the Archivist comes within about 4.5 units, then looks up, follows them with her eyes and blinks.
- `arrival.html` still uses the older, simpler Archivist drawings.

## Interior (`index.html`, the main page)

- World: x from -20 to 20 (four 10-unit rooms), z from -5 (back wall) to +5 (open front), floor at y = 0. Partitions at x = -10, 0 and 10 have a doorway at z between -2 and 1.
- `EXHIBITS` holds every card's text, room and interaction spot (`at`). `solid()` adds collision boxes. Tap-to-walk uses A* on a 0.25-unit grid (`routeTo`). (The galleries are one of three areas now; see below.)
- Test hooks on `window.museum`: `tick(n)` steps the simulation (needed when the browser pane is hidden, because animation frames stop), `frame()` returns a JPEG data URL of the current view, `walk(x, z)`, `open(id)`, `close()`, `go(x, z)`.
- **Trap:** `tick()` skips the real `frame()` loop, so it can't prove the game runs. A crash inside `frame()` once froze all movement while `tick()` tests passed. Before calling it working, run the real loop: reload, replace `window.requestAnimationFrame` with a `setTimeout` shim straight away, then send real keyboard and pointer events and check `window.museum.me` moved and no errors were thrown. Load with a fresh `?v=` query, because the browser caches the old file.
- The page is the whole experience, full-screen, with no surrounding page. Sources live in `README.md`, not on the page.

## The offices, the stacks and the story (2026-11-26)

- The script moved out of `index.html` into `js/world.js` (classic script). `js/story.js` (loaded first) holds the
  stages, objectives and every line of dialogue as `window.STORY`. `js/desk/` is ES modules: `main.js` exposes
  `window.Activities` with `.desk()` and `.shelf()`, which open over the world in `#overlays`.
- **Areas**: `AREAS` in world.js. The galleries are x -20..20; the offices (Curator's office, landing, your office)
  are x 60..90; the basement stacks x 120..140. Same z range and floor everywhere. Doors (`DOORS`) fade and move
  you. `blocked()`, the A* grid, the camera clamp and `roomAt()` all read the current `AREA`.
- **Interactables**: `EXHIBITS` (cards) plus `THINGS` (doors, Mr. Harrow, your desk, the shelves), each with an
  `area`. `interact()` routes them. The prompt bubble is clickable (for touch).
- **Mr. Harrow** (invented Curator): a standing rig (body, head, eyes, gesturing arm), same cel style. He stands in
  his office, or beside your desk during case 1 (`STORY.stages[...].harrow`). His collision box moves with him.
- **Story state** is saved in localStorage `archivist:save-v1`: stage, boxes fetched (`have`), papers carried, desk
  progress per case. Only **New game** on the start menu clears it (see below); `?fresh` is gone.
- While the desk or a shelf is open, `document.body.dataset.overlay` is set: the world ignores keys and pointer, and
  skips rendering while the (opaque) desk is up.
- The desk's content is in `js/desk/cases.js` and `js/desk/sources.js`. Word every task with `docs/WRITING_TASKS.md`
  and run `node scripts/check.mjs` after any content edit. Only sources that existed by 1910 (the desk is in 1910).
- Test hooks added to `window.museum`: `go(x, z, area)`, `area()`, `stage(name)` (set or read), `game()`,
  `say(lines)`, `open(id)` (any exhibit or thing, e.g. `open('mydesk')`). On the desk: `desk.solve()`, `desk.state`.
- **Layout check**: replaced on 2026-11-28 by `desk.fits()` at nine screen sizes (see "The desk redesign" below). The
  old rule (the work card must never scroll at 1366 × 650) is gone: the card now scrolls inside itself.
- Port 5544 is often taken by another session's server; `archivist-office` in `REPOS/.claude/launch.json` serves the
  same folder on 5546.

## Guided sample, markers, looking back (2026-11-26, second pass)

- **The pointing hand** (`js/hand.js`, classic script, `window.HAND`): a printer's manicule drawn in code. One drawing,
  three uses: the **quest marker** in the world (`questGoal()` / `questMarker()` in world.js: it points at the stage's
  `goal` from `js/story.js`, or at the door that leads toward it, or along the screen edge when it is off screen), the
  **idle nudge** on the desk (after 6 s without a click), and **Mr. Harrow's coaching**.
- **The guided sample** (stages `sample` and `sampleFile`): after the meeting, Mr. Harrow stands by your desk and coaches
  case `c0` (George Stewart's 1877 book on the Great Fire of St. John) with `js/desk/coach.js` + `js/desk/tutorial.js`:
  a bubble with Back/Next and the hand moving with his words. Steps with `until` wait for the student. Then he walks you
  to the stacks (`DO.toStacks`) and runs a coached, locked filing at shelf P – Z (`DO.tutorShelf`), then sends you back
  up (`DO.toDesk`) to case 1 on your own.
- **The coach locks the page** (user, 2026-11-26: running ahead of the tutorial was confusing). While Mr. Harrow talks
  only his bubble works; on a "Your turn" step only the step's `allow` (or `point`) target works; everything else is
  stopped and the bubble says what to do. Next can never skip a step the student hasn't done. His place is saved
  (`save.coachStep`) and resumes if the student leaves the desk; `readq` resumes from the saved marks.
- **Next is big and pulses** (brass, one slow beat a second; off with prefers-reduced-motion), in the coach bubble and
  in every world dialogue. The user asked for a "big flashing next button"; a hard flash was avoided on purpose.
- **Dialogue Back/Next**: buttons and the ← → keys. Back never crosses a `do` line (a walk, a fade or a stage change).
- **Looking back on the desk**: ◂ Back in the work card's top row, or a finished task's card in the top bar, shows an earlier answer
  read-only with its proof underlined. Results now keep `proof` (the line key) and `first` (a wrong first answer).
- **Paper seams**: `T(..., {cut:{t, b}})` removes the white paper margin above `t` / below `b` px, where two pieces join.
  Used for the necks (they tuck under the collars) and the elbows (the upper sleeve also overlaps the forearm). Keep
  new jointed pieces to this.
- **Thick walls**: partitions are `thickWall()`: the cutaway outline extruded 0.22 units, faces textured, cut edges
  hatched plaster (`TX.poche`).
- **No spinning**: the Archivist turns by the way they actually moved, and only when they moved, so pushing into a wall
  never flips them.
- Browser module caching: `?v=` on the page does not refresh ES module imports. In the preview, `fetch(file, {cache:
  'reload'})` each changed module before reloading.

## The desk redesign (2026-11-28)

- **Why**: kids were confused when the desk popped up, and on square monitors the paper was squeezed (139 px wide at
  1024 × 768 with Windows at 125 %) and **Finish the case** fell off the screen. Plan: `docs/DESK_REDESIGN.md`; the
  approved mockup: `docs/mockups/desk.html` (open it through the local server).
- **The look**: your desk under the gas lamp. Wood falling into the Gaslight blue, a green baize blotter with the paper
  in the lamp light, cut-paper sheets (pale margin + hard shadow via stacked `drop-shadow`, slightly uneven
  `clip-path` edges, an SVG-noise grain in `--grain`), the task on a ruled index card. All in the desk section of
  `css/desk.css`; the desk uses `box-sizing: border-box` (the rest of the game doesn't).
- **Two areas, not three** (`js/desk/desk.js`): the papers column is gone. The task's papers are **folder tabs** on the
  blotter; papers used earlier in the case are in **Other papers ▾** (a drawer). The versions of a paper are one
  switch inside the sheet: "Read it in: Easy words · His own words · The 1613 page" (`js/desk/doc.js`). The progress dots
  are now a card per task with a word (`WORD` in desk.js: Question · Sort · Ask · Compare ...), seal colour when done.
- **The card never pushes a button off the screen**: `.card-body` scrolls; `.actions` (hint + Check) and Next are moved
  into `.card-foot`, which never scrolls. The card scrolls itself to the current step after each render.
- **The Now line**: the title of the LAST `.step.now` is lifted out of the card into the Now line at the top (a stamp
  or an answer stays open while its proof step is current). `step(..., 'later')` returns nothing now: later steps are
  hidden, not greyed (kids read greyed steps as things to do). With no current step the Now line uses `.ask`.
- **The research question opens BIG** (user, 2026-11-28): while a `readq` task is under way, `.rqstage` covers the desk
  with the question in the middle, "Your Research Question" larger still, a pulsing lamp glow and a gleam across the
  title. The words are clicked there. Done: a green ✓, then (900 ms) it flies onto its slip under the top bar
  (`flyUp()`, Web Animations) and a brass pin drops in (`.pin.drop`, the `box` sound). `rqPhase` is
  'big' → 'leaving' → 'pinned'; `updatePhase()` lands it at once if the task moves on mid-flight. A second `readq` with a
  new `rq` (case c3) does it again, marked "A new question". The case letter no longer repeats the question; its
  button says **Read your question**. Reduced motion: no glow, no flight.
- **`.rqcard` is whichever question is showing** (the big card while it is up, else the pinned slip): the tutorial
  points at `.rqcard` and `.rq-mark[data-tag]`, and the big card comes first in the DOM. Keep the class names listed at
  the top of desk.js; js/desk/tutorial.js points at them.
- **No words on an empty desk** (user): with no paper out, the blotter shows only the paperweight.
- **The lamp follows the work**: `desk.dataset.focus` = 'paper' while a proof line is wanted (the blotter gets an amber
  ring, the Now line an arrow), 'card' otherwise (the card glows, the paper dims a little).
- **The hand points from beside, never over words**: `HAND.make(...).beside(target)` (js/hand.js) tries left, above,
  below and right, scoring each by how many of nine points would cover text or buttons (`WORDS`), and aims at the first
  line of words that wrap. The desk's idle nudge and Mr. Harrow's coaching both use it; the coach also scrolls his
  target into view once per step (the paper and the card scroll inside themselves).
- **Guided sample**: one step added after WHERE ("There. Now it is pinned to the top of your desk..."), step 2 reworded.
  Walked end to end at 1366 × 650 (2026-11-28): all 18 steps, hand on screen each time, no errors.
- **Layout check** (`desk.fits()` → `{ ok, offscreen, sideways, paper }`): no button outside the screen (buttons in the
  paper, the card body, the drawer or a letter are reached by scrolling), the big question and letters inside the
  screen, nothing scrolls sideways, and the paper's width. Run it for every task of every case in three states (fresh;
  wrong answer, a non-proof line, Check, every hint; solved), plus each case letter and report, at 1366 × 650,
  1366 × 768, 1280 × 1024, 1024 × 768, 1093 × 614, 820 × 615, 1536 × 864, 1920 × 1080 and 640 × 700. Last run
  (2026-11-28): 102 checks × 9 sizes, all pass; the narrowest paper is 423 px (820 × 615).
- **Testing traps**: the start menu (`#title`, z 50) covers the overlays; hide it to test a desk opened with
  `Activities.desk({caseId, save: {}, persist(){}, ...})` (a throwaway save). In a hidden browser pane CSS animations
  barely advance, so the desk can look stuck half faded in: add a test-only style that sets the desk's
  `animation-duration` to 0, and `finish()` the flight's Web Animations by hand.

## Start menu and pause menu (2026-11-26)

- **User's rule: no Start over button in the game window.** The only way to begin again is **New game** on the start
  menu (`#title`). With a save (or after playing this visit) New game asks first, then clears the save, sets
  sessionStorage `archivist:begin` and reloads; that flag skips the start menu once so the new game starts straight away.
- The start menu shows on every load: **Continue** (with the current To do) when there is a save, and **New game**.
- **Pause**: the button (top right; the dialogue box covered it at the bottom) or **Esc** in the world, including during
  dialogue. Esc with a catalogue card open still closes the card. `#pausemenu` is a `<dialog>`: Resume (Esc also
  resumes) and Main menu. It never erases anything. No pause inside the desk or stacks (Esc closes those).
- `paused()` (title up or pause open) stops `frame()` entirely: no stepping, no animation, keys ignored.
- Testing: clear `localStorage['archivist:save-v1']` for a fresh game, and set `sessionStorage['archivist:begin']='1'`
  before a reload to skip the start menu.

## Chapters 2 and 3, and new task types (2026-11-27)

- The class's first playtest: "the questions were basically all the same" (every task was stamp + proof). The desk now
  has seven task types: `readq`, `stamp`, `question`, `compare`, `sort`, `order`, `catalogue` (js/desk/tasks.js; the
  table is in `docs/WRITING_TASKS.md`). `node scripts/check.mjs` fails a case with three tasks of one type in a row.
- `papersOf(task)` (tasks.js) is the ONE place that lists a task's papers (compare keeps them in `find`, not `docs`).
  The world's `docsOf` and the desk's pile both use it: forgetting this once left compare papers out of the filing.
- Tasks may handle line clicks themselves (`point`), underline several lines (`selected`), and blank label lines
  (`hide`, for catalogue; the pile then says "Maker not known yet"). `ctx.show(id)` switches paper AND opens its easy
  words (the map opens on its scan otherwise, where nothing can be clicked); `ctx.reveal()` scrolls to the chosen line.
- Chapter 1 trimmed: case 1 is two stamps and a "can a map be a source?" question; case 2 opens with a compare.
- Chapter 2 (`c4`, stages fetch4 → report4) and chapter 3 (`c5`, fetch5 → report5) in `js/story.js`; a narrator line
  ("Chapter 2 · Two accounts") marks each start. Sources: Lescarbot via Ganong 1902; Pagan's 1797 deposition via Kilby
  1888 (`printedIn`: filed in Kilby's box); Wright's via Ganong. Details in `docs/SOURCES.md`.
- Card height: superseded by the desk redesign (2026-11-28): the card scrolls and its buttons are pinned to its foot.
- Preview: `archivist-chapters` in `REPOS/.claude/launch.json` serves this folder on 5547 (5544/5546 are often taken).

## The title screen, Options, Credits (2026-11-28)

- The user asked for a title screen and start menu that feel like a real game, with the voice switch and other
  settings in Options, reachable from the title and the pause menu, and an animation behind the title.
- **The live title** (world.js, "THE TITLE SCREEN"): while `#title` is up, Union Street at night plays behind it.
  `enterTitle()` (from `showTitle`) saves your place (`TITLE.saved`) and moves to the street; `leaveTitle()` (from
  `startPlay`) puts it back. `titleTick()` runs from `frame()` while paused at the title: the camera follows
  `TITLE_SHOTS` (a 46 s loop, ended behind a quick fade; the menu is on the left so the subject sits right of centre),
  a cab passes every ~31 s, a woman under an umbrella (`W.folk[1]`) walks by, fog sprites drift (`W.titleFog`),
  and Halley's comet (`TX.comet`, additive, `W.titleComet`) hangs over the open lot beside No. 72 (in front of the far
  roofs at z -24: the museum and its neighbours hide anything lower). The moon is hidden on the title. `isNight()` is
  true on the title; you (the rig) are hidden. Music: the street cue, from the first click or key (browsers need a
  gesture). It never touches the cab while an opening is paused (`CUT.on`).
- **The menu**: logo + `.menu` buttons in period type on a dark shade (`.title-shade`); the pointing hand (`HAND.make`,
  class `menu`) points at the chosen button; arrow keys move, hover focuses. `root.pointHand()` places the hand
  directly (focus events do not fire while the window lacks focus, as in a hidden preview pane). Esc backs out of
  Credits and the New game question. `body.at-title` hides the HUD, the prompt, the To do and the dialogue box.
- **Trap (fixed 2026-11-28): soft see-through sprites must not write depth.** The title's fog puffs and the train's
  smoke used the normal sprite material, which writes depth wherever a pixel passes `alphaTest`. A nearly invisible
  puff drawn first (draw order follows each sprite's anchor, and wide sprites are anchored at a corner) then blocked
  whatever was behind it and drawn later: parts of the horse and the building beside No. 72 vanished. `haze(sprite)`
  turns depth writing off and draws it last (`renderOrder` 10). Use it for any new fog, smoke, steam or mist. Measured:
  6,321 wrongly darkened pixels in one title shot before, a few edge pixels after.
- **Options** (`#options`, a `<dialog>`): sound sliders, the read-aloud switch with the voice slider, and the controls.
  Opened from the title (`#title-options`) or the pause menu (`#pause-options`); `audio.js` binds its sliders and the
  switch by their data attributes, so they are the only ones now. `paused()` is true while it is open.
- **Credits & sources** (`#credits`): real and invented, the type, three.js. The logo hides while it is open
  (`.title.reading`) so it fits 650 px.
- Verified at 1366 × 650: title shots, Options from both places, Credits, arrow keys, Continue back to your place,
  Main menu and back, a New game ("Board the train" over the live title), and pausing mid-opening. Not checked on a
  phone-sized screen; the comet is only visible in the later shots of the loop.

## The new opening, the town and the real newspaper (2026-11-27, evening)

- The plan is in `docs/STORY.md`: who you are (a compulsive cataloguer), the theme as a joke (Percy Gage's comet
  pills), a mystery (Mr. Tull, Box 17), real dates (Tue 17 – Thu 19 May 1910), and the pacing rule.
- **New areas** (`AREAS`): `line` (x 430..560, the train from outside, opening only), `square` (x 300..372: King Square,
  Sydney Street, the old burial ground), `lodgings` (x 400..420: Mrs. Hanlon's kitchen and your room). New doors:
  `to-square` / `to-union` (Union Street's west end ↔ the square's east end), `to-lodgings` / `to-sydney`. The quest
  marker routes through any doors with `doorToward()` (a breadth-first search over `DOORS`); `DOOR_TOWARD` is gone.
- **Day and night**: a stage with `night: true` is dark and gaslit; any other stage is a foggy day. `applyTime()` (from
  `setStage` and `enterArea`) swaps the outdoor skies (`W.skies`: TX.sky / TX.skyDay), hides the moons, uses the area's
  `fogDay`, and dims outdoor gas glows (`g.outdoor`, `g.dayK`). Indoors is gaslit either way.
- **The townspeople**: `makePerson(spec, id)` builds a body, a head (and a looking-up head for the comet night) and an
  optional arm from a description (`GAGE`, `HANLON`, `FOLK` near Mr. Harrow's drawings; `drawPerson`,
  `drawPersonHead`, `drawPersonArm`). `placeCast()` (from `setStage`) puts them where `CAST_AT` says for the stage, or
  hides them (and switches their THING off with `off: true`; the prompt and the quest marker skip `off` things).
- **The opening** (`runOpening`): outside (`CUT.line`, `CUT.follow` tracks the train; `lineTick` turns the wheels, moves
  the side rod and puffs smoke), inside with Gage (`DO.cards` spills your index cards, `DO.gageGo` walks him off), the
  cab with the cabman talking (`STORY.opening.cab`, said while the cab drives), then the door as before. `CUT.cam.k`
  sets how tightly the camera follows.
- **New DO lines**: `cards`, `gageGo`, `paper` (opens the newspaper, goes on when it is folded), `sleep`, `toSquare`,
  `toHarrowOffice`. A choice may set `who` (e.g. `narrator`) so its reply is not said by the line's speaker. Cards of
  type `note` show a letter or an index card (`note: { tag, lines }`).
- **The newspaper** (`js/desk/paper.js`, `Activities.paper()`): the real Standard of 18 May 1910, set in type (with
  `UnifrakturMaguntia` and `Oswald` from Google Fonts) and as the scan in `sources/`, comet stories marked.
- **Town catalogue cards** (`TOWN_CARDS`, pushed into `EXHIBITS` with `area`, `place` and `head: 'Your index card'`).
- A saved game starts where its stage happens (`START` in `boot`). The bed only works at stage `sleep`; the desk at a
  stage with no case can play `STORY.deskEvent` (the stuck drawer).
- Fixed in passing: on Union Street a comment had swallowed the line that puts up the telegraph poles.
- Verified in the browser at 1366 × 650 (2026-11-27): the whole path from a new game to chapter 2, no errors. Not
  heard: nothing new has sound of its own yet (the foghorn the cabman mentions, the train from outside, the square's
  crowd all use the existing cues).

## Union Street, outside No. 72 (2026-11-26)

- **The building is 72 Union Street, not Douglas Avenue.** The user asked about the NBM's Douglas Avenue building; it
  opened in 1934 (finished c. 1932), so in 1910 the museum was at 72 Union Street (the Society bought it in 1906).
  The user chose to keep 1910 and Union Street.
- **Drawn from one photo**: New Brunswick Museum 13305, "Natural History Society Building, Union Street, Saint John,
  1900-1910" (shown small on the Catherine Murdoch page of womenandmuseum.com). It shows: four storeys (three brick over
  a stone base, then a mansard with three pairs of dormers), a cornice under the roof, two arched ground-floor
  openings, telegraph poles with crossarms, a lower darker building on the left, an open lot on the right.
  **Guesses** (the photo is small and sepia): colours, the sign board's wording, the lamp by the door, the "72" in the
  fanlight, the neighbours, the flagstone sidewalk and the earth road. Replace them if a better source turns up.
- Area `street` in `AREAS` (x 170..230), `outdoor: true`: `buildStreet()` builds it instead of the room loop. Areas
  may now carry `cam` ({h, back, look, ahead, m}: camera height, distance, look height, clamp margin) and `fog`
  ([near, far, colour]); `enterArea()` applies the fog. The facade is drawn at 80 px a unit (`F72_DOOR` = the door's x).
- Doors: `to-museum` (the front door, its own clickable cut-out `drawFrontDoor`) and `to-street` (a doormat at the open
  front of the Entrance Hall: in the cutaway the street door is on the side we look in from). Doors may set `verb`,
  `labelY` and `face` ('back' = arrive facing into the room).
- **A new game (stage `arrive`) starts on the street**, left of the museum; the To do and the pointing hand lead to the
  door. Other stages still load inside the museum.
- The telegraph poles stand at the road edge of the curb (z -2.4) so they don't block the sidewalk.

## The opening (2026-11-27)

- The user asked for a real opening, not a cold open in the street: the train with some exposition, then arriving at
  the museum. **Order**: the evening train (narration: the job, the Society since 1862, Gesner 1842 → the Society 1890,
  Union Street 1906, what an archivist does), the conductor ("Saint John! Union Depot!"), a fade to Union Street, a
  hired cab pulls up at No. 72, you step down behind it and it drives off, you walk to the door, the camera rises up
  the building with the title card (`#optitle`), one line at the door in close-up, then play.
- **History checked**: trains into Saint John in 1910 used the Union Depot (1884, Station Street; CPR from 1889).
  Saint John had electric streetcars from 1893 (the Saint John Railway Co., 1897-1917) and trolleys ran on Dock
  Street, but no source found puts a line **on Union Street**, so the arrival is by horse-drawn cab and there are no
  tracks. Coach, cab, horse and cabman are typical of the period, not drawn from a particular one.
- All the words are in `STORY.opening` (`js/story.js`): narrator lines (`who: 'narrator'`, no face, italic) and the
  conductor (no face). New speakers in `SPEAKERS` with `face: null` get the `.noface` dialogue box.
- **How it runs** (world.js, "THE OPENING"): `runOpening()` is an async script over `CUT` (`cutWait`, `cutUntil`,
  `cutSay`, `cutFade`). Waits run on `CUT.t`, advanced by `cutTick()` from `frame()` only when not paused, so Pause
  holds it. `CUT.cam` takes the camera (slow glide); `CUT.lockView` stops the turn-to-face-us; `CUT.hideMe` hides you
  (riding in the cab, the camera follows `ME.x` = the cab); `ME.sink` sits you down on the train. While `CUT.on`,
  `busy()` is true, keys only drive dialogue, and `ME.target` walks still run.
- Plays once per new game: `startPlay()` runs it when stage is `arrive` and `G.opening` is unset; the end (or **Skip
  the opening**, top left) sets `G.opening` and leaves you at the museum door. Main menu → Continue mid-opening
  resumes it; it never starts twice.
- Area `train` (x 258..282, `buildTrain`): window holes in the wall texture (cut with an OPAQUE fill: a translucent
  `destination-out` only half-cuts), the country and the telegraph line scroll behind (`TX.country`, `TX.trackPoles`
  offsets). Seats are drawn at 200 px a unit to match the character. The cab is `W.cabS` (`buildCab`, `cabTick`: a
  four-beat walk, wheels turning by distance, reins as a line).
- **The cab, redrawn 2026-11-27** (the user found the first one "pretty derpy"): a brougham (curved body dropped at the
  door, bowed front glass, raised box seat, curved dashboard, lamp, whip in its socket as its own thin, margin-free
  piece), wheels drawn with no paper margin (a margin fills the gaps between spokes), slim dark shafts with the
  traces. The horse is the body and neck in one piece (no seam at the neck; the padded collar sits over the
  shoulder), the head pinned at the poll (it nods), a tail, and two-part legs (forearm/gaskin + cannon) so knees and
  hocks fold. `cabTick` walks it in four beats (near hind, near fore, far hind, far fore): ~60% of a stride on the
  ground sweeping back, then lift, fold and swing. Horse frame: x 0 at the point of the buttock, 2.55 at the withers.
- Testing: the browser pane is often hidden, which stalls `requestAnimationFrame` (and throttles `setTimeout` to about
  once a second); drive frames with a `MessageChannel` pump instead. A hidden pane's screenshot shows only its top-left
  800 px or so, so an emulated 1366-wide viewport looks zoomed in: render `museum.frame(w, h, [cam xyz, look xyz])` into
  a fixed `<img>` in the top-left to inspect a view. `museum.opening()`, `museum.skip()`, `museum.cut`, `museum.cab()`
  are test hooks.

## Sound (2026-11-27)

- **Everything in `audio/` except `audio/voice/` comes from `node scripts/render_audio.mjs`** (pass names to render only
  those, e.g. `node scripts/render_audio.mjs hoof_0 street`). No dependencies, deterministic, about 5 s. Python has no
  NumPy on this machine, so the old `render_score.py` was replaced. Never hand-edit a WAV; change the script and re-render.
- **Music**: `CUES` in the script, one per area (`audioScene()` in world.js picks it; the desk is `bench_keys`). Written as
  chords (one a bar, `Dm,A7` splits a bar) plus melody lines (`A4:2 D5:1 | ...`, lengths in beats; the parser throws if
  a bar doesn't add up) plus an `accomp(chord, bar, put)` pattern. Instruments are period ones only (1910). Loops are
  rendered twice and the second pass kept, so reverb rings across the seam. Loop noise must come from `loopNoise()`
  (plain noise clicks at the seam).
- **Effects**: one-shots are levelled by their loudest 50 ms (`{win}`), loops by RMS. `ring()` is peak-normalised: a raw
  high-Q band-pass is ~100x quieter than its burst, which is why the old hoof was only a click.
- **Hooves**: `cabTick` plays `hoof_0..3` as each leg touches down (four-beat walk); the far-side legs (0, 1) at half
  volume. `MuseumAudio.drive('cab_roll', level)` holds the wheels loop at a level that follows the cab's speed; 0 stops it.
- **Footsteps**: `wood_0..3` / `stone_0..3`, left foot 0|1, right foot 2|3. The stacks' box pick-up is `box`.
- **Voices**: `muted.voices` (saved in `archivist:audio-v1`) is separate from the slider, so switching back on restores
  the level. The cast in `js/audio.js` enables Game Sound Kit's read-aloud rules: 1906 -> nineteen oh six,
  1860s -> eighteen sixties, 1897-1917 -> ... to ...,
  c. 1910 -> about, St./Mr./Mrs./No. -> Saint/Mister/Missus/Number, · -> a comma. Screen text is unchanged.
- **Testing**: browsers cache WAVs hard; fetch each changed file with `{cache: 'reload'}` before reloading. To see what
  plays, wrap `AudioBufferSourceNode.prototype.start` and log `buffer.duration`. Nobody has listened to the 2026-11-27
  render yet: the checks were spectrograms, loop seams, harmony against the chords, and the in-game trigger log.

## Arrival (`arrival.html`)

- `window.stage.set(t)`, `style(key)`, `play(bool)`, `frame(t)`.
- Known mismatch: the exterior is still a grand temple facade (the real exterior is now Union Street in `index.html`). The real Union Street building was a bought building, not one built as a museum, so the exterior needs a redo for Saint John.

## Local preview

`REPOS/.claude/launch.json` has an `archivist-style` entry (python http.server on port 5544).
