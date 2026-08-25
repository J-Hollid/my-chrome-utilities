import assert from "node:assert/strict";
const { createEventLibraryInstalledController } = await import("../../dist/data-layer-installed/event-library/index.js");
const template = { id:"template:1", name:"Page view", eventName:"page_view", sourceId:"history",
  sourceName:"History", destination:"event.history", tags:[], validation:"Not checked", payload:{ page:"/" },
  version:1, provenance:"captured" };
const values = new Map([["my-chrome-utilities.event-template-library.v1", JSON.stringify([template])]]);
let changed = 0, pushed;
const noOpTransfer = { downloadExport() {}, readImportFile:async () => "", validateDraft() {} };
const controller = createEventLibraryInstalledController({
  root:{ querySelector:() => null },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  defaultPushPath:() => "event.history", push:async (value) => { pushed = value.id; },
  changed:() => { changed += 1; }, createId:() => "template:2",
  ...noOpTransfer,
});
controller.mount(); controller.select("template:1"); controller.beginDraft("template:1");
assert.equal(controller.state().editor.template.id, "template:1");
controller.saveRevision();
assert.equal(controller.templates()[0].version, 2, "Event Library owns revision mutation and persistence");
await controller.pushSelected(); assert.equal(pushed, "template:1");
controller.reviewImport(JSON.stringify({ format:"my-chrome-utilities.event-library", version:1,
  templates:[{ ...template, id:"template:imported", name:"Imported" }] }));
controller.commitImport("append");
assert.equal(controller.templates().length, 2, "Event Library owns reviewed import settlement");
controller.requestDelete("template:imported"); controller.confirmDelete();
assert.deepEqual(controller.templates().map(({ id }) => id), ["template:1"]);
assert.equal(changed, 3);
controller.dispose(); controller.dispose(); controller.mount();
assert.equal(controller.state().editor, undefined, "dispose clears transient editor ownership");
assert.equal(controller.templates()[0].version, 2, "durable template ownership survives remount");

function element() {
  const listeners = new Map();
  return { value:"", textContent:"", hidden:false, dataset:{},
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); },
    dispatch(type) { listeners.get(type)?.({ preventDefault() {}, target:this }); }, click() { this.dispatch("click"); },
    showModal() { this.open = true; }, close() { this.open = false; }, listenerCount:() => listeners.size,
  };
}
const selectors = ["#library-draft-schema-selector", "#refresh-library-draft-validation", "#export-event-library",
  "#import-event-library", "#event-library-file", "#event-library-transfer-result", "#clear-event-library",
  "#event-library-delete-review", "#event-library-delete-review-heading", "#event-library-delete-review-summary",
  "#confirm-event-library-delete", "#cancel-event-library-delete", "#event-library-import-review",
  "#event-library-import-review-heading", "#event-library-import-review-summary", "#replace-event-library",
  "#append-event-library", "#cancel-event-library-import"];
const elements = new Map(selectors.map((selector) => [selector, element()]));
const transferCalls = [];
const transferController = createEventLibraryInstalledController({
  root:{ querySelector:(selector) => elements.get(selector) ?? null }, storage:{ getItem:() => null, setItem() {} },
  defaultPushPath:() => "event.history", push:async () => {}, changed() {}, createId:() => "template:transfer",
  downloadExport:(exported) => transferCalls.push(`export:${JSON.stringify(exported).includes("event-library")}`),
  readImportFile:async () => JSON.stringify({ format:"my-chrome-utilities.event-library", version:1, templates:[template] }),
  validateDraft:(schemaId) => transferCalls.push(`validate:${schemaId}`),
});
transferController.mount();
elements.get("#library-draft-schema-selector").value = "schema:checkout";
elements.get("#refresh-library-draft-validation").click(); elements.get("#export-event-library").click();
elements.get("#import-event-library").click(); await new Promise((resolve) => setTimeout(resolve, 0));
assert.deepEqual(transferCalls, ["validate:schema:checkout", "export:true"]);
assert.ok(transferController.state().pendingImport, "file selection opens controller-owned import review");
elements.get("#append-event-library").click(); assert.equal(transferController.templates().length, 1);
elements.get("#clear-event-library").click(); assert.equal(elements.get("#event-library-delete-review").open, true);
elements.get("#cancel-event-library-delete").click(); assert.equal(transferController.state().pendingDeletion, undefined);
transferController.dispose();
assert.equal([...elements.values()].reduce((count, item) => count + item.listenerCount(), 0), 0,
  "Event Library removes transfer and review listeners on disposal");
