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
const sourceStorageBefore=sourceStorage.get("my-chrome-utilities.schema-library.v1");
const sourceLibraryBefore=sourceLibrary.schemas;

const captured = controller.open({
  sourceId:"gtm",
  eventName:"checkout",
  name:"Checkout",
  label:"Library template",
  payload:{ total:12, coupon:"WELCOME" },
});

// retired-schema-assertion: source-drafts-revision-publication-close-001
assert.deepEqual(captured.assignments, [
  { sourceId:"gtm", eventName:"checkout", target:"payload" },
]);

// retired-schema-assertion: source-drafts-revision-publication-close-002
assert.deepEqual(captured.workingDraft.assignments,[{sourceId:"gtm",eventName:"checkout",target:"payload"}]);

// retired-schema-assertion: source-drafts-revision-publication-close-003
assert.equal(selectedPath, "total");

// retired-schema-assertion: source-drafts-revision-publication-close-004
assert.equal(calls.at(-2)[1], "Library template fields loaded into a new schema draft.");
assert.equal(calls.at(-1), "focus-name");

// retired-schema-assertion: source-drafts-revision-publication-close-005
assert.equal(editorName.focused, true);

// retired-schema-assertion: source-drafts-revision-publication-close-006
assert.equal(relationshipActions.at(-1), "view:Schemas");

// retired-schema-assertion: source-drafts-revision-publication-close-011
assert.equal(sourceStorage.get("my-chrome-utilities.schema-library.v1"),sourceStorageBefore,
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
const expandedRulePaths = new Set();
const propertyController = {
  selectedPath:"",
  isRulePathExpanded:(path) => expandedRulePaths.has(path),
  setRulePathExpanded:(path, expanded) => expanded ? expandedRulePaths.add(path) : expandedRulePaths.delete(path),
  selectPath(path) { this.selectedPath=path; },
};
const propertyView = new SchemaPropertyView({
  root:propertyRoot, document:propertyDocument,
  library:{ activeSchemaId:captured.id, draft:undefined, schemas:[captured] },
  property:propertyController, rules:{ promotionFocusReturn:undefined },
  canonical:{ editorDocument:()=>undefined,hasEditor:()=>false }, active:() => captured, editorDraft:schemaEditorDraft,
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

// retired-schema-assertion: source-drafts-revision-publication-close-007
assert.deepEqual(propertyTree.children.map(({ dataset }) => dataset.schemaPropertyCanonicalPath), ["/total", "/coupon"]);

// retired-schema-assertion: source-drafts-revision-publication-close-008
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

// retired-schema-assertion: source-drafts-revision-publication-close-012
assert.equal(primitive.workingDraft.document.type, "object");

// retired-schema-assertion: source-drafts-revision-publication-close-013
assert.equal(primitive.workingDraft.document.properties.value.type, "boolean");

// retired-schema-assertion: source-drafts-revision-publication-close-014
assert.deepEqual(primitive.workingDraft.assignments, [
  { sourceId:"page", eventName:"consent", target:"payload" },
]);

// retired-schema-assertion: source-drafts-revision-publication-close-015
assert.equal(selectedPath, "value");

const array = controller.open({
  sourceId:"capture",
  eventName:"items",
  name:"Items",
  label:"Array source",
  payload:[{ quantity:2 }],
});

// retired-schema-assertion: source-drafts-revision-publication-close-016
assert.equal(array.workingDraft.document.properties.value.type, "array");

// retired-schema-assertion: source-drafts-revision-publication-close-017
assert.equal(array.workingDraft.document.properties.value.items.type, "object");

// retired-schema-assertion: source-drafts-revision-publication-close-018
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

// retired-schema-assertion: source-drafts-revision-publication-close-019
assert.deepEqual(emptyArray.workingDraft.document.properties.value, {
  type:"array",
  items:{},
});

// retired-schema-assertion: source-drafts-revision-publication-close-020
assert.deepEqual(sourceLibrary.schemas,sourceLibraryBefore,"opening all source shapes keeps drafts outside the stored library");

// retired-schema-assertion: source-drafts-revision-publication-close-021
assert.equal(sourceStorage.get("my-chrome-utilities.schema-library.v1"),sourceStorageBefore,
  "opening all source shapes performs no Schema Library storage write");

assert.equal(draft.id, emptyArray.id);

controller.createEmpty();

assert.equal(draft.published, false);

assert.equal(draft.workingDraft.document.type, "object");

assert.deepEqual(draft.workingDraft.assignments, []);
assert.equal(selectedPath, "");
