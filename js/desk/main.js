// The bridge between the museum (js/world.js, a classic script) and the paper activities (these modules).
// The world calls window.Activities.desk(...) and .shelf(...); each opens over the museum and calls back when done.
//
// The source desk is ONE activity. Other social studies activities can sit beside it: add a module and a method here,
// and an interactable in the world that opens it.
import { openDesk } from './desk.js';
import { openShelf } from './stacks.js';
import { openPaper } from './paper.js';
import { SOURCES, SHELVES, BOXES, shelfOf } from './sources.js';
import { CASES } from './cases.js';
import { papersOf } from './tasks.js';
import { SAMPLE_COACH, SHELF_COACH } from './tutorial.js';

const root = () => document.getElementById('overlays');

window.Activities = {
  CASES, SOURCES, SHELVES, BOXES, shelfOf,
  caseById: (id) => CASES.find((c) => c.id === id),
  docsOf: (c) => [...new Set(c.tasks.flatMap(papersOf))],
  // face: an image URL of Mr. Harrow's head, for the coaching bubble
  desk({ caseId, save, persist, onLeave, onComplete, face }) {
    const C = this.caseById(caseId);
    openDesk(root(), { theCase: C, sources: SOURCES, save, persist, onLeave, onComplete, face, coach: C.coach ? SAMPLE_COACH : null });
  },
  // tutor: true runs Mr. Harrow's filing lesson on this shelf
  // the morning paper (The Standard, 18 May 1910): onClose(read) when it is folded up
  paper(opts) { openPaper(root(), opts || {}); },
  shelf(opts) { openShelf(root(), { ...opts, sources: SOURCES, coach: opts.tutor ? SHELF_COACH : null, locked: opts.tutor }); },
};
window.dispatchEvent(new Event('activities-ready'));
