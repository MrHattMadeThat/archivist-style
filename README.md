# The Archivist (working title)

An educational museum game set in Saint John, New Brunswick, around 1910, at the Natural History Society of New Brunswick's museum on Union Street.

The look: paper-cutout puppets on a 3D cardboard stage (Paper Mario structure), drawn in scratchy ink with a little Don't Starve / Earthworm Jim in the bones. The chosen palette is **Gaslight**. The oddness in the world is always historically true, never invented.

## What's here

| File | What it is |
|---|---|
| `index.html` | The arrival scene: a 26-second animated loop, taxi to museum doors. Three palettes to compare. |
| `interior.html` | The walkable museum interior: four rooms, 13 exhibits with catalogue cards. |

Both pages are single files. They use three.js r128 from cdnjs, and every drawing is made in code on a canvas, so there are no image assets.

## Run it

Any static server works. From `REPOS`:

```powershell
C:\Python313\python.exe -m http.server 5544 --directory archivist-style
```

Then open http://localhost:5544/ (arrival) or http://localhost:5544/interior.html (interior).

## Controls (interior)

- WASD or arrow keys to walk, E (or Enter/Space) to examine
- Tap or click the floor to walk there; tap an exhibit to walk to it and examine it
- Drag to peek around the room
- The catalogue under the stage lists every exhibit; tapping one walks you there

## History: sources and what's made up

See the "True, and made up" section at the bottom of `interior.html`. In short:

- From the record: Gesner's museum opened in Saint John in 1842. The Natural History Society (founded 1862) took over that collection in 1890 and moved to Union Street in 1906. Its collections became the New Brunswick Museum.
- Invented: the floor plan, furniture, wallpaper and the attendant. No source found describes the building's rooms.
- Left out on purpose: the Society's Wolastoqey and Mi'kmaq belongings, pending a decision made with those communities.
