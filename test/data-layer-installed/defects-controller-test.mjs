import assert from "node:assert/strict";

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
const controller = createDefectsInstalledController({ root:{ querySelector:(selector) => nodes.get(selector) ?? null },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  recopy:() => "Copied", attachCurrentSession() {}, openLinkedSession() {} });
controller.mount(); controller.mount();
assert.equal(listeners.size, 2, "Defects installs one owned input/change listener pair per shared control");
controller.dispose(); controller.dispose();
assert.equal(listeners.size, 0, "Defects removes its installed listeners");
controller.mount();
assert.equal(controller.library().defects.length, 0);
