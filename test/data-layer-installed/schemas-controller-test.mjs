import assert from "node:assert/strict";
const { createSchemasInstalledController } = await import("../../dist/data-layer-installed/schemas/index.js");
const schema = { id:"schema:page", name:"Page", version:1, document:{ type:"object", properties:{ title:{ type:"string" } } },
  assignments:[], published:true };
const values = new Map([["my-chrome-utilities.schema-library.v1", JSON.stringify([schema])]]);
let changed = 0, guided;
const controller = createSchemasInstalledController({
  root:{ querySelector:() => null },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  changed:() => { changed += 1; }, runGuidedValidation:async (id) => { guided = id; },
  subscribe:() => () => {},
});
controller.mount(); controller.open("schema:page"); controller.beginDraft();
controller.updateDraft({ document:{ type:"object", required:["title"], properties:{ title:{ type:"string" } } } }, "Require title");
assert.equal(controller.state().draftDirty, true);
const evaluation = controller.validate({ sourceId:"history", eventName:"page_view", payload:{}, rawInput:{} });
assert.equal(evaluation.state, "Not checked", "unassigned events retain the exact validation contract");
const published = controller.publish();
assert.equal(published.version, 2, "Schemas exclusively owns draft publication");
assert.equal(published.document.required[0], "title");
await controller.runGuidedValidation(); assert.equal(guided, "schema:page");
assert.ok(changed >= 3);
controller.dispose(); controller.mount();
assert.equal(controller.state().activeSchemaId, "schema:page");
assert.equal(controller.state().draftDirty, false);

function element() {
  const listeners = new Map();
  return { value:"", textContent:"", hidden:false, disabled:false, open:false, isConnected:true, dataset:{},
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); },
    dispatch(type) { listeners.get(type)?.({ preventDefault() {}, target:this }); }, click() { this.dispatch("click"); },
    showModal() { this.open = true; }, close() { this.open = false; }, focus() {},
    setAttribute() {}, removeAttribute() {}, replaceChildren() {}, listenerCount:() => listeners.size,
  };
}
const selectors = ["#schema-editor", "#schema-detail", "#schema-detail-empty", "#schema-editor-name",
  "#schema-editor-name-assistance", "#schema-editor-description", "#save-schema-description", "#schema-description-origin",
  "#schema-editor-target", "#save-schema", "#save-schema-reason", "#schema-revision-review",
  "#schema-revision-review-summary", "#confirm-schema-revision", "#cancel-schema-revision",
  "#close-schema-editor-review", "#schema-close-review-summary", "#discard-schema-draft", "#keep-editing-schema",
  "#close-schema-editor", "#save-and-close-schema", "#save-schema-close-review", "#discard-working-schema-draft",
  "#schema-revision-selector", "#schema-revision-comparison", "#duplicate-schema-revision", "#restore-schema-revision",
  "#add-schema-property", "#schema-property-view-controls", "#schema-property-filter-label", "#schema-property-filter",
  "#schema-property-sort-label", "#schema-property-sort", "#schema-property-result-status", "#schema-property-empty",
  "#schema-property-empty-message", "#clear-schema-property-filter", "#schema-property-tree"];
const elements = new Map(selectors.map((selector) => [selector, element()]));
const uiValues = new Map([["my-chrome-utilities.schema-library.v1", JSON.stringify([schema])]]);
const uiController = createSchemasInstalledController({
  root:{ querySelector:(selector) => elements.get(selector) ?? null },
  storage:{ getItem:(key) => uiValues.get(key) ?? null, setItem:(key, value) => uiValues.set(key, value) },
  changed() {}, runGuidedValidation:async () => {}, subscribe:() => () => {},
});
uiController.mount(); uiController.open("schema:page"); uiController.beginDraft();
elements.get("#schema-editor-name").value = "Page checkout"; elements.get("#schema-editor-name").dispatch("input");
elements.get("#schema-editor-description").value = "Checkout payload"; elements.get("#save-schema-description").click();
elements.get("#save-schema").click();
assert.equal(elements.get("#schema-revision-review").open, true, "saving opens the controller-owned revision review");
elements.get("#confirm-schema-revision").click();
assert.equal(uiController.schemas()[0].version, 2);
assert.equal(uiController.schemas()[0].name, "Page checkout");
assert.equal(uiController.schemas()[0].documentation.description, "Checkout payload");
elements.get("#schema-revision-selector").value = "1"; elements.get("#duplicate-schema-revision").click();
assert.equal(uiController.schemas().length, 2, "revision duplication remains schema-controller behavior");
assert.equal(elements.get("#schema-property-result-status").textContent, "1 of 1 properties");
elements.get("#schema-property-filter").value = "missing"; elements.get("#schema-property-filter").dispatch("input");
assert.equal(elements.get("#schema-property-empty").hidden, false);
assert.equal(elements.get("#schema-property-empty-message").textContent, "No properties match missing");
elements.get("#clear-schema-property-filter").click();
assert.equal(elements.get("#schema-property-filter").value, "");
uiController.dispose();
assert.equal([...elements.values()].reduce((count, item) => count + item.listenerCount(), 0), 0,
  "Schemas removes every editor and revision listener it owns");
