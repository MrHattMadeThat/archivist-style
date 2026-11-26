// The bridge between the museum (js/world.js, a classic script) and the paper activities (these modules).
// The world calls window.Activities.desk(...) and .shelf(...); each opens over the museum and calls back when done.
//
// The source desk is ONE activity. Other social studies activities can sit beside it: add a module and a method here,
// and an interactable in the world that opens it.
import { openDesk } from './desk.js';
import { openShelf } from './stacks.js';
import { SOURCES, SHELVES, BOXES, shelfOf } from './sources.js';
import { CASES } from './cases.js';

const root = () => document.getElementById('overlays');

window.Activities = {
  CASES, SOURCES, SHELVES, BOXES, shelfOf,
  caseById: (id) => CASES.find((c) => c.id === id),
  docsOf: (c) => [...new Set(c.tasks.flatMap((t) => t.docs || (t.doc ? [t.doc] : [])))],
  desk({ caseId, save, persist, onLeave, onComplete }) {
    openDesk(root(), { theCase: this.caseById(caseId), sources: SOURCES, save, persist, onLeave, onComplete });
  },
  shelf(opts) { openShelf(root(), { ...opts, sources: SOURCES }); },
};
window.dispatchEvent(new Event('activities-ready'));
