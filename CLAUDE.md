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

## Interior (`index.html`, the main page)

- World: x from -20 to 20 (four 10-unit rooms), z from -5 (back wall) to +5 (open front), floor at y = 0. Partitions at x = -10, 0 and 10 have a doorway at z between -2 and 1.
- `EXHIBITS` holds every card's text, room and interaction spot (`at`). `solid()` adds collision boxes. Tap-to-walk uses A* on a 0.25-unit grid (`routeTo`).
- Test hooks on `window.museum`: `tick(n)` steps the simulation (needed when the browser pane is hidden, because animation frames stop), `frame()` returns a JPEG data URL of the current view, `walk(x, z)`, `open(id)`, `close()`, `go(x, z)`.
- **Trap:** `tick()` skips the real `frame()` loop, so it can't prove the game runs. A crash inside `frame()` once froze all movement while `tick()` tests passed. Before calling it working, run the real loop: reload, replace `window.requestAnimationFrame` with a `setTimeout` shim straight away, then send real keyboard and pointer events and check `window.museum.me` moved and no errors were thrown. Load with a fresh `?v=` query, because the browser caches the old file.
- The page is the whole experience, full-screen, with no surrounding page. Sources live in `README.md`, not on the page.

## Arrival (`arrival.html`)

- `window.stage.set(t)`, `style(key)`, `play(bool)`, `frame(t)`.
- Known mismatch: the exterior is still a grand temple facade. The real Union Street building was a bought building, not one built as a museum, so the exterior needs a redo for Saint John.

## Local preview

`REPOS/.claude/launch.json` has an `archivist-style` entry (python http.server on port 5544).
