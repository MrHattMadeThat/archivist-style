# The Archivist (working title)

An educational museum game set in Saint John, New Brunswick, around 1910, at the Natural History Society of New Brunswick's museum on Union Street.

The look: paper-cutout puppets on a 3D cardboard stage (Paper Mario structure), drawn in scratchy ink with a little Don't Starve / Earthworm Jim in the bones. The chosen palette is **Gaslight**. The oddness in the world is always historically true, never invented.

## What's here

| File | What it is |
|---|---|
| `arrival.html` | The arrival scene: a 26-second animated loop, taxi to museum doors. Three palettes to compare. |
| `index.html` | The game: the walkable museum (four galleries, 13 exhibits), the offices upstairs, and the stacks in the basement. |
| `js/world.js` | The 3D world, the Archivist, Mr. Harrow, and the story engine (doors, dialogue, objectives, save). |
| `js/audio.js`, `audio/` | Web Audio mixer (master, music, voices, effects; set in the pause menu, plus a **Read the lines aloud** switch on the start and pause menus). Every WAV except the voice is rendered by `node scripts/render_audio.mjs` (no dependencies): a period chamber score, one cue per area, for parlour piano, reed organ, string quartet, clarinet, flute, harp, music box, celesta and glass armonica; ambience beds (room tone, rail joints, and Union Street's wind, bell buoy and the Partridge Island fog horn); four takes each of hooves and footsteps; the cab's wheels and harness. Dialogue and coaching use the local Chimera speech synthesizer and CMU Pronouncing Dictionary in a background worker (licenses in `audio/voice/`); `spoken()` in `js/voice-worker.js` turns years, decades and abbreviations into words first. |
| `js/story.js` | Every objective and every line of dialogue: the new archivist's first evening. |
| `js/hand.js` | The pointing hand (a printer's manicule): the quest marker, the desk's "what next" nudge, and Mr. Harrow's pointing. |
| `js/desk/` | The paper activities that open over the world: the **source desk** (primary and secondary, with proof) and **the stacks** (fetch boxes, file papers). Adapted from `../archive-desk`. |
| `css/desk.css` | Gaslight styling for the desk, the stacks, the dialogue box and the To do note. |
| `docs/` | `WRITING_TASKS.md` (how every desk question is worded), `ONBOARDING.md` (the first evening), `SOURCES.md`. |

The world uses three.js r128 from cdnjs, and every drawing is made in code on a canvas. The only image files are the Champlain page scans in `sources/`.

## Run it

Any static server works. From `REPOS`:

```powershell
C:\Python313\python.exe -m http.server 5544 --directory archivist-style
```

Then open http://localhost:5544/ (the museum) or http://localhost:5544/arrival.html (the arrival scene).

## The game so far

A new game opens on Tuesday 17 May 1910, on the evening train into Saint John, seen first from outside, then inside, where your index cards burst out of your case and a travelling salesman tries to sell you comet pills (the Earth passes through the tail of Halley's comet the next night). A cab brings you to the door, the cabman talking about the fog and the tides. After your first evening you walk home through King Square, past the old Loyalist burial ground, to Mrs. Hanlon's boarding house, where the last archivist, Mr. Tull, left his trunk behind. In the morning there is a real newspaper at breakfast, *The Standard* of 18 May 1910, and that night all of Saint John waits in King Square for a comet's tail that nobody can see. The plan is in `docs/STORY.md`. You arrive as the new archivist, on Union Street outside the museum: the building is drawn from a photograph of the Natural History Society's building there (New Brunswick Museum 13305, 1900–1910). Inside, the attendant sends you upstairs to Mr. Harrow, the Curator, who explains the job in four parts (read the letter and its research question, fetch papers from the stacks, sort them with proof at your desk, file them back) and the rule of the office: **primary or secondary depends on the research question.** Then he sits with you for a practice paper on a different subject (George Stewart's 1877 book on the Great Fire of St. John), pointing as he talks, and walks you down to the stacks to file it. Then three cases about St. Croix Island, 1604–1605: a first stack to sort, a schoolteacher's letter, and the same papers under new questions. That is chapter 1. Chapter 2, **Two accounts**, is a reporter's letter: Champlain says 35 men died, Lescarbot says 36, so who was in a better position to know, where do they agree, and which lines are opinion? Chapter 3, **The ruins that drew a border**, is the schoolteacher again: how do we *know* Dochet Island is the real St. Croix Island? In 1797 Robert Pagan took Champlain's 1613 plan to the island and dug, and in 1798 the ruins helped settle the border between the United States and the British colonies. The sources are Champlain (1613), Lescarbot (1609/1612), Parkman (1865), Kilby (1888, printing Pagan's 1797 statement) and Ganong (1902, printing Wright's): all real, all on the shelves by 1910.

The source desk is one activity. Other social studies activities can open from other things in the building (see `js/desk/main.js`).

The game opens on a **start menu**: **Continue** (when this computer has a saved game) or **New game**. New game is the only way to begin again; over an old save it asks first, because it erases that save (for the next student on a shared PC). In play, **Pause** (top right) or **Esc** opens the pause menu: Resume, or Main menu. Pausing never erases anything; the game saves itself as you play.

## Controls (interior)

- WASD or arrow keys to walk, E (or Enter/Space) to examine
- Tap or click the floor to walk there; tap an exhibit to walk to it and examine it
- Drag to peek around the room
- Esc or the Pause button to pause
- The counter in the top corner shows how many of the 13 exhibits you've examined

## History: sources and what's made up

- From the record: Gesner's museum opened in Saint John in 1842. The Natural History Society (founded 1862) took over that collection in 1890 and moved to Union Street in 1906. Its collections became the New Brunswick Museum.
- Invented: the floor plan (galleries, offices and basement), furniture, wallpaper, the attendant, Mr. Harrow, Miss Lyle and her pupil Tom Nason, and Mr. Silas Mott the newspaperman. No source found describes the building's rooms.
- The desk's sources and where they came from: `docs/SOURCES.md`.
- Left out on purpose: the Society's Wolastoqey and Mi'kmaq belongings, pending a decision made with those communities.

Sources:

- [New Brunswick Museum (Wikipedia)](https://en.wikipedia.org/wiki/New_Brunswick_Museum)
- [Gesner's Museum of Natural History (Geoscience Canada)](https://journals.lib.unb.ca/index.php/GC/article/download/10232/10611?inline=1)
- [George Frederic Matthew (Canadian Encyclopedia)](https://thecanadianencyclopedia.ca/en/article/george-frederic-matthew)
- [Stonehammer Geopark: Our Geology](https://stonehammergeopark.com/?p=457)
