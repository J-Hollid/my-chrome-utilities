import assert from "node:assert/strict";
const { createSchemasInstalledController } = await import("../../dist/data-layer-installed/schemas/index.js");
const schema = { id:"schema:page", name:"Page", version:1, document:{ type:"object", properties:{ title:{ type:"string" } } },
  assignments:[], published:true };
const values = new Map([["my-chrome-utilities.schema-library.v1", JSON.stringify([schema])]]);
let changed = 0, guided;
const controller = createSchemasInstalledController({
  root:{ querySelector:() => null, querySelectorAll:() => [] },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  changed:() => { changed += 1; }, runGuidedValidation:async (id) => { guided = id; },
  subscribe:() => () => {}, specificIndexSelected() {}, rulePickerChanged() {},
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
  return { id:"", value:"", textContent:"", hidden:false, disabled:false, open:false, isConnected:true, dataset:{},
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); },
    dispatch(type) { listeners.get(type)?.({ preventDefault() {}, target:this, currentTarget:this }); }, click() { this.dispatch("click"); },
    showModal() { this.open = true; }, close() { this.open = false; }, focus() {},
    setAttribute(name, value) { this[name] = value; }, removeAttribute(name) { delete this[name]; },
    getAttribute(name) { return this[name] ?? null; }, replaceChildren() {}, prepend() {}, contains() { return false; },
    listenerCount:() => listeners.size,
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
  "#schema-property-empty-message", "#clear-schema-property-filter", "#schema-property-tree",
  "#schema-property-removal-feedback", "#undo-schema-property-removal", "#schema-property-removal-dialog",
  "#schema-property-removal-heading", "#schema-property-removal-summary", "#confirm-schema-property-removal",
  "#cancel-schema-property-removal", "#schema-documentation-removal-dialog", "#schema-documentation-removal-heading",
  "#schema-documentation-removal-summary", "#confirm-schema-documentation-removal", "#cancel-schema-documentation-removal",
  "#schema-property-copy-feedback", "#undo-schema-property-copy", "#schema-property-copy-dialog",
  "#schema-specific-index-dialog", "#schema-specific-index-form", "#schema-specific-index-heading",
  "#schema-specific-index-label", "#schema-specific-index", "#schema-specific-index-assistance",
  "#confirm-schema-specific-index", "#cancel-schema-specific-index", "#schema-manual-property-dialog",
  "#schema-manual-property-form", "#schema-manual-property-heading", "#schema-manual-property-path-label",
  "#schema-manual-property-path", "#schema-manual-property-parent-context", "#schema-manual-property-child-name-label",
  "#schema-manual-property-child-name", "#schema-manual-property-type-label", "#schema-manual-property-type",
  "#schema-manual-array-type-group", "#schema-manual-array-item-type", "#schema-manual-property-preview",
  "#schema-manual-property-assistance", "#go-to-existing-schema-property", "#confirm-schema-manual-property",
  "#cancel-schema-manual-property", "#schema-property-rule-picker"];
const elements = new Map(selectors.map((selector) => [selector, element()]));
elements.set("#side-panel-layered-profile-editor", element()); elements.set("#live-event-query", element());
const schemaMasterTab = Object.assign(element(), { textContent:"Schemas", dataset:{ schemaSubview:"schema-master" } });
const schemaRulesTab = Object.assign(element(), { textContent:"Rules", dataset:{ schemaSubview:"schema-rule-library" } });
const schemaMasterPanel = Object.assign(element(), { id:"schema-master" });
const schemaRulesPanel = Object.assign(element(), { id:"schema-rule-library" });
const uiValues = new Map([["my-chrome-utilities.schema-library.v1", JSON.stringify([schema])]]);
let selectedSpecificIndex;
const rulePickerChanges = [];
const uiController = createSchemasInstalledController({
  root:{ querySelector:(selector) => elements.get(selector) ?? null,
    querySelectorAll:(selector) => selector.includes("role=tab") ? [schemaMasterTab, schemaRulesTab] : [schemaMasterPanel, schemaRulesPanel] },
  storage:{ getItem:(key) => uiValues.get(key) ?? null, setItem:(key, value) => uiValues.set(key, value) },
  changed() {}, runGuidedValidation:async () => {}, subscribe:() => () => {},
  specificIndexSelected:(path) => { selectedSpecificIndex = path; },
  rulePickerChanged:(path, open) => rulePickerChanges.push(`${path}:${open}`),
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
schemaRulesTab.click();
assert.equal(schemaMasterPanel.hidden, true); assert.equal(schemaRulesPanel.hidden, false);
uiController.beginDraft();
uiController.updateDraft({ documentation:{ properties:{ "/title":{ displayName:"Title", description:"Page title" } } } });
uiController.requestPropertyRemoval("/title");
assert.equal(elements.get("#schema-property-removal-dialog").open, true);
assert.match(elements.get("#schema-property-removal-summary").textContent, /Documentation entries: \/title/);
elements.get("#confirm-schema-property-removal").click();
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).workingDraft.document.properties.title,
  undefined);
elements.get("#undo-schema-property-removal").click();
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).workingDraft.document.properties.title.type,
  "string", "Undo restores the exact property definition");
uiController.requestDocumentationRemoval("/title");
elements.get("#confirm-schema-documentation-removal").click();
const documentationDraft = uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).workingDraft;
assert.equal(documentationDraft.document.properties.title.type, "string");
assert.equal(documentationDraft.documentation.properties, undefined,
  "documentation-only removal leaves the schema property intact");
const sourceId = uiController.state().activeSchemaId;
const destinationId = uiController.schemas().find(({ id }) => id !== sourceId).id;
uiController.updateDraft({ document:{ type:"object", properties:{ title:{ type:"string" }, checkout:{ type:"boolean" } } } });
uiController.requestPropertyCopy("/checkout", destinationId);
assert.equal(elements.get("#schema-property-copy-dialog").open, true);
uiController.confirmPropertyCopy();
assert.equal(uiController.schemas().find(({ id }) => id === destinationId).workingDraft.document.properties.checkout.type, "boolean");
elements.get("#undo-schema-property-copy").click();
assert.equal(uiController.schemas().find(({ id }) => id === destinationId).workingDraft, undefined,
  "property-copy undo restores the complete destination schema state");
uiController.updateDraft({ document:{ type:"object", properties:{ items:{ type:"array", items:{ type:"object",
  properties:{ name:{ type:"string" } } } } } } });
uiController.openSpecificIndex("/items");
elements.get("#schema-specific-index").value = "2"; elements.get("#schema-specific-index").dispatch("input");
assert.equal(elements.get("#confirm-schema-specific-index").disabled, false);
elements.get("#schema-specific-index-form").dispatch("submit");
assert.equal(selectedSpecificIndex, "items.2");
uiController.openManualProperty();
elements.get("#schema-manual-property-path").value = "checkout.total";
elements.get("#schema-manual-property-type").value = "number";
elements.get("#schema-manual-property-path").dispatch("input");
assert.match(elements.get("#schema-manual-property-preview").textContent, /checkout.total is number/);
elements.get("#schema-manual-property-form").dispatch("submit");
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId)
  .workingDraft.document.properties.checkout.properties.total.type, "number");
uiController.openManualProperty("/items/*");
elements.get("#schema-manual-property-child-name").value = "sku";
elements.get("#schema-manual-property-type").value = "string";
elements.get("#schema-manual-property-child-name").dispatch("input");
elements.get("#schema-manual-property-form").dispatch("submit");
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId)
  .workingDraft.document.properties.items.items.properties.sku.type, "string");
uiController.openRulePicker("items.*.sku");
assert.equal(elements.get("#schema-property-rule-picker").open, true);
assert.equal(uiController.rulePickerState().configuration.propertyType, "string");
elements.get("#schema-property-rule-picker").dispatch("cancel");
assert.deepEqual(rulePickerChanges, ["items.*.sku:true", "items.*.sku:false"]);
uiController.dispose();
assert.equal([...elements.values()].reduce((count, item) => count + item.listenerCount(), 0), 0,
  "Schemas removes every editor and revision listener it owns");
