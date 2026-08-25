import assert from "node:assert/strict";
import { verifyPreparedInstalledController } from "../support/data-layer-installed-controller-contract.mjs";
await verifyPreparedInstalledController("defects");

const { createDefectsInstalledController, installedControllerDefinition } = await import(
  "../../dist/data-layer-installed/defects/index.js"
);
assert.equal(installedControllerDefinition.id, "defects");
const listeners = new Map();
const control = { value:"", addEventListener(type, listener) { listeners.set(type, listener); },
  removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); } };
const empty = { hidden:false };
const replaceable = { replaceChildren() {} };
const nodes = new Map([["#defect-library-search", control], ["#defect-library-status", control],
  ["#defect-library-type", control], ["#defect-library-event", control],
  ["#defect-library-schema", control], ["#defect-library-path", control],
  ["#defect-library-count", {}], ["#defect-library-list", replaceable],
  ["#defect-library-empty-state", empty], ["#defect-library-detail", replaceable],
  ["#defect-delete-confirmation", replaceable]]);
const values = new Map();
let shown = 0, liveRenders = 0, returned, missingBuilderInput, missingBuilderClosed = 0;
const controller = createDefectsInstalledController({ root:{ querySelector:(selector) => nodes.get(selector) ?? null },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  recopy:() => "Copied", attachCurrentSession() {}, openLinkedSession() {}, liveEvents:() => [],
  showDefectsView:() => { shown += 1; }, returnToLive:(position) => { returned = position; },
  renderLive:() => { liveRenders += 1; },
  missingEventContext:() => ({ events:[{ id:"event:missing", name:"checkout", sourceId:"gtm", pageUrl:"https://example.test/checkout",
    captureTime:"2026-08-25T10:00:00.000Z", payload:{} }], pageUrl:"https://example.test/checkout",
    archived:{ startedAt:"2026-08-25T09:59:00.000Z", endedAt:"2026-08-25T10:01:00.000Z" } }),
  mountMissingEventBuilder:(input) => { missingBuilderInput = input; return { close:() => { missingBuilderClosed += 1; } }; } });
controller.mount(); controller.mount();
assert.equal(listeners.size, 2, "Defects installs one owned input/change listener pair per shared control");
controller.dispose(); controller.dispose();
assert.equal(listeners.size, 0, "Defects removes its installed listeners");
controller.mount();
assert.equal(controller.library().defects.length, 0);
controller.dispose();
const defect = { id:"defect:1", type:"Missing event", status:"Saved", createdAt:"2026-08-25T00:00:00.000Z",
  updatedAt:"2026-08-25T00:00:00.000Z", report:{ summary:"Missing checkout", actual:{} }, notes:"", issues:[] };
assert.equal(controller.add(defect).added, true);
assert.equal(controller.library().defects.length, 1, "Defects exclusively owns persisted library mutation");
controller.open("defect:1", { returnPosition:{ eventId:"event:1", issueIndex:2, listScrollTop:31 } });
assert.equal(shown, 1);
assert.equal(controller.selectedId(), "defect:1");
controller.close();
assert.deepEqual(returned, { eventId:"event:1", issueIndex:2, listScrollTop:31 },
  "Defects exclusively owns the Live inspector return position");
assert.equal(liveRenders, 1, "Defect mutation projects through the explicit Live render port");
assert.equal(controller.library().defects.length, 1, "Defect state remains owned after disposal");
controller.openMissingEventBuilder("Live session actions", "schema:checkout");
assert.equal(missingBuilderInput.initialSchemaId, "schema:checkout");
assert.equal(missingBuilderInput.visits[0].immutable, true, "archived visits retain immutable session boundaries in Defects ownership");
missingBuilderInput.save({ type:"Missing event", expected:"purchase" });
assert.equal(controller.library().defects.length, 2, "the Defects-owned missing-event builder saves through its local library transaction");
controller.openMissingEventBuilder("Schema event"); assert.equal(missingBuilderClosed, 1, "reopening closes the previous builder lifecycle");
controller.dispose(); assert.equal(missingBuilderClosed, 2, "Defects disposal closes the active missing-event builder");
