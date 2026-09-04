import assert from "node:assert/strict";

const { SchemaSourceController } = await import(
  "../../../dist/data-layer-installed/schemas/source-controller.js"
);
const { schemaDocumentPaths } = await import(
  "../../../dist/data-layer-installed/schemas/schema-model.js"
);

const calls = [];
let draft;
let selectedPath;
const controller = new SchemaSourceController({
  setDraft:(value) => { draft = value; calls.push("set-draft"); },
  setSelectedPath:(value) => { selectedPath = value; calls.push("select-path"); },
  showSchemas:() => calls.push("show-schemas"),
  render:() => calls.push("render"),
  result:(message) => calls.push(["result", message]),
  focusName:() => calls.push("focus-name"),
});

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
// retired-schema-assertion: source-drafts-revision-publication-close-014
assert.deepEqual(captured.workingDraft.assignments, captured.assignments);
// retired-schema-assertion: source-drafts-revision-publication-close-003
assert.equal(selectedPath, "total");
// retired-schema-assertion: source-drafts-revision-publication-close-004
assert.equal(calls.at(-2)[1], "Library template fields loaded into a new schema draft.");
assert.equal(calls.at(-1), "focus-name");
assert.equal(calls.includes("show-schemas"), true);
// retired-schema-assertion: source-drafts-revision-publication-close-008
assert.deepEqual(schemaDocumentPaths(captured.workingDraft.document), ["/total", "/coupon"]);
// retired-schema-assertion: source-drafts-revision-publication-close-007
assert.deepEqual(Object.keys(captured.workingDraft.document.properties), ["total", "coupon"]);
// retired-schema-assertion: source-drafts-revision-publication-close-031
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
// retired-schema-assertion: source-drafts-revision-publication-close-002
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
assert.equal(draft.id, emptyArray.id);

controller.createEmpty();
assert.equal(draft.published, false);
// retired-schema-assertion: source-drafts-revision-publication-close-009
assert.equal(draft.workingDraft.document.type, "object");
// retired-schema-assertion: allowed-value-expansion-return-cleanup-002
assert.deepEqual(draft.workingDraft.assignments, []);
assert.equal(selectedPath, "");
