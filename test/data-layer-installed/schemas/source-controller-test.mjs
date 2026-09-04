import assert from "node:assert/strict";

const { SchemaSourceController } = await import(
  "../../../dist/data-layer-installed/schemas/source-controller.js"
);
const { schemaEditorDraft } = await import(
  "../../../dist/data-layer-installed/schemas/schema-model.js"
);
const { SchemaLibraryController } = await import(
  "../../../dist/data-layer-installed/schemas/library-controller.js"
);
const { SchemaPropertyView } = await import(
  "../../../dist/data-layer-installed/schemas/property-view.js"
);

const calls = [];
const editorName = { focused:false, focus() { this.focused = true; } };
const relationshipActions = [];
let draft;
let selectedPath;
const sourceStorage = new Map([["my-chrome-utilities.schema-library.v1", "[]"]]);
let sourceStorageWrites = 0;
const sourceLibrary = new SchemaLibraryController({
  storage:{
    getItem:(key) => sourceStorage.get(key) ?? null,
    setItem:(key, value) => { sourceStorageWrites += 1; sourceStorage.set(key, value); },
  },
  changed() {},
});
const controller = new SchemaSourceController({
  setDraft:(value) => { draft = value; sourceLibrary.setDraft(value); calls.push("set-draft"); },
  setSelectedPath:(value) => { selectedPath = value; calls.push("select-path"); },
  showSchemas:() => { calls.push("show-schemas"); relationshipActions.push("view:Schemas"); },
  render:() => calls.push("render"),
  result:(message) => calls.push(["result", message]),
  focusName:() => { calls.push("focus-name"); editorName.focus(); },
});

const captured = controller.open({
  sourceId:"gtm",
  eventName:"checkout",
  name:"Checkout",
  label:"Library template",
  payload:{ total:12, coupon:"WELCOME" },
});

assert.deepEqual(captured.assignments, [
  { sourceId:"gtm", eventName:"checkout", target:"payload" },
]);

assert.deepEqual(captured.workingDraft.assignments, captured.assignments);

assert.equal(selectedPath, "total");

assert.equal(calls.at(-2)[1], "Library template fields loaded into a new schema draft.");
assert.equal(calls.at(-1), "focus-name");

assert.equal(editorName.focused, true);

assert.equal(relationshipActions.at(-1), "view:Schemas");

assert.equal(sourceStorageWrites, 0,
  "opening a source performs no premature Schema Library storage write");

const makeElement = (tagName="DIV") => ({
  tagName, children:[], dataset:{}, classList:{ contains:() => false }, textContent:"",
  value:"", hidden:false, scrollTop:0, append(...children) { this.children.push(...children); },
  prepend(...children) { this.children.unshift(...children); },
  replaceChildren(...children) { this.children = children; }, addEventListener() {},
  removeEventListener() {}, setAttribute(name,value) { this[name]=value; },
  querySelectorAll:() => [], querySelector:() => null, contains:() => false, closest:() => null,
});
const propertyTree = makeElement("UL");
const propertyFilter = makeElement("INPUT");
const propertySort = makeElement("SELECT");
propertySort.value = "schema";
const propertyStatus = makeElement("OUTPUT");
const propertyEmpty = makeElement();
const propertyEmptyMessage = makeElement();
const propertyElements = new Map([
  ["#schema-property-tree", propertyTree], ["#schema-property-filter", propertyFilter],
  ["#schema-property-sort", propertySort], ["#schema-property-result-status", propertyStatus],
  ["#schema-property-empty", propertyEmpty], ["#schema-property-empty-message", propertyEmptyMessage],
]);
const propertyDocument = {
  activeElement:undefined, createElement:(name) => makeElement(name.toUpperCase()),
  querySelector:() => null, getElementById:() => null,
};
const propertyRoot = { querySelector:(selector) => propertyElements.get(selector) ?? null };
const propertyController = { selectedPath:"", expandedRulePaths:new Set() };
const propertyView = new SchemaPropertyView({
  root:propertyRoot, document:propertyDocument,
  library:{ activeSchemaId:captured.id, draft:undefined, schemas:[captured] },
  property:propertyController, rules:{ promotionFocusReturn:undefined },
  canonical:{ editor:undefined }, active:() => captured, editorDraft:schemaEditorDraft,
  parentDocuments:() => [], normalizedPath:(path) => path, replaceActive() {}, persistLibrary() {},
  persistLibraries() {}, queuePersistence() {}, renderAll() {}, createId:() => "test:id",
  settleCanonical:false, openCanonicalActions() {}, openCanonicalRule() {}, openManual() {},
  openRulePicker() {}, openSpecificIndex() {}, openCopy() {}, requestRemoval() {},
  requestDocumentationRemoval() {}, updateAttachedRule() {}, openAttachedRule() {}, promoteRule() {},
});
const originalDocument = globalThis.document;
globalThis.document = propertyDocument;
propertyView.render();
globalThis.document = originalDocument;

assert.deepEqual(propertyTree.children.map(({ dataset }) => dataset.schemaPropertyCanonicalPath), ["/total", "/coupon"]);

assert.deepEqual(propertyTree.children.map(({ children }) => children[0].textContent), ["total", "coupon"]);
assert.deepEqual(Object.keys(captured.workingDraft.document.properties), ["total", "coupon"]);

assert.equal(captured.workingDraft.document.properties.total.type, "number");

assert.equal(captured.published, false);
assert.equal(calls.filter((call) => call === "set-draft").length, 1);

const primitive = controller.open({
  sourceId:"page",
  eventName:"consent",
  name:"Consent",
  label:"Primitive source",
  payload:true,
});

assert.equal(primitive.workingDraft.document.type, "object");

assert.equal(primitive.workingDraft.document.properties.value.type, "boolean");

assert.deepEqual(primitive.workingDraft.assignments, [
  { sourceId:"page", eventName:"consent", target:"payload" },
]);

assert.equal(selectedPath, "value");

const array = controller.open({
  sourceId:"capture",
  eventName:"items",
  name:"Items",
  label:"Array source",
  payload:[{ quantity:2 }],
});

assert.equal(array.workingDraft.document.properties.value.type, "array");

assert.equal(array.workingDraft.document.properties.value.items.type, "object");

assert.equal(
  array.workingDraft.document.properties.value.items.properties.quantity.type,
  "number",
);

const emptyArray = controller.open({
  sourceId:"capture",
  eventName:"empty",
  name:"Empty",
  label:"Empty array",
  payload:[],
});

assert.deepEqual(emptyArray.workingDraft.document.properties.value, {
  type:"array",
  items:{},
});

assert.equal(draft.id, emptyArray.id);

controller.createEmpty();

assert.equal(draft.published, false);

assert.equal(draft.workingDraft.document.type, "object");

assert.deepEqual(draft.workingDraft.assignments, []);
assert.equal(selectedPath, "");
