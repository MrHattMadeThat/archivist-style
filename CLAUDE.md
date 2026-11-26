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
- **Card height check** (lab PCs, 1366 × 650): for every task, force the tallest states (wrong first answer, a
  non-proof line, every hint open, then solved) and assert `.work` scrollHeight ≤ clientHeight. The last run passed
  for all 15 tasks and the three reports.
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
- **Looking back on the desk**: ◂ Back in the work card's top row, or a coloured pip, shows an earlier answer
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

## Arrival (`arrival.html`)

- `window.stage.set(t)`, `style(key)`, `play(bool)`, `frame(t)`.
- Known mismatch: the exterior is still a grand temple facade. The real Union Street building was a bought building, not one built as a museum, so the exterior needs a redo for Saint John.

## Local preview

`REPOS/.claude/launch.json` has an `archivist-style` entry (python http.server on port 5544).
