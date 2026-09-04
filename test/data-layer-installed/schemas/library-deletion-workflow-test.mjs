import assert from "node:assert/strict";
import {
  createSchemaLibraryFakeDocument,
  createSchemaLibraryBehaviorPorts,
} from "../../support/schema-library-fake-dom.mjs";

const { SchemaLibraryController } = await import(
  "../../../dist/data-layer-installed/schemas/library-controller.js"
);
const { SchemaLibraryDeletionWorkflow, inspectSchemaDeletion } = await import(
  "../../../dist/data-layer-installed/schemas/library-deletion-workflow.js"
);

const parent = {
  id: "schema:parent",
  name: "Parent",
  version: 1,
  document: { type: "object", properties: {} },
  assignments: [],
  published: true,
};
const child = {
  ...parent,
  id: "schema:child",
  name: "Child",
  parentSchemaId: parent.id,
};

// retired-schema-assertion: source-drafts-revision-publication-close-056
assert.match(
  inspectSchemaDeletion([parent, child], parent.id).message,
  /parent of Child/,
);

// retired-schema-assertion: library-deletion-review-001
assert.equal(inspectSchemaDeletion([parent], parent.id).status, "ready");

assert.equal(inspectSchemaDeletion([parent], "missing"), undefined);

const values = new Map([
  ["my-chrome-utilities.schema-library.v1", JSON.stringify([parent])],
]);
const library = new SchemaLibraryController({
  storage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  },
  changed() {},
});
library.select(parent.id, parent);
const { element } = createSchemaLibraryFakeDocument();
const behavior = createSchemaLibraryBehaviorPorts(element);
const workflow = new SchemaLibraryDeletionWorkflow(library, behavior.ports);

// retired-schema-assertion: library-deletion-review-003
assert.equal(workflow.request(parent.id), true);

// retired-schema-assertion: source-drafts-revision-publication-close-022
assert.equal(behavior.elements.deleteReview.open, true);

// retired-schema-assertion: library-deletion-review-002
assert.match(behavior.elements.deleteSummary.textContent, /Parent v1/);
workflow.confirm();
assert.deepEqual(library.schemas, []);

// retired-schema-assertion: source-drafts-revision-publication-close-064
assert.equal(library.activeSchemaId, undefined);

// retired-schema-assertion: guided-selection-continuation-promotion-036
assert.equal(behavior.elements.result.textContent, "Deleted Parent.");
assert.equal(behavior.calls.renderAll, 1);
