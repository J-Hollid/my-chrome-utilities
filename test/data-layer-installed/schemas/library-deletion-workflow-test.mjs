import assert from "node:assert/strict";
import { runRetiredSchemaControllerScenario } from "./fixtures/retired-controller-scenario.mjs";
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
assert.match(
  inspectSchemaDeletion([parent, child], parent.id).message,
  /parent of Child/,
);
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
assert.equal(workflow.request(parent.id), true);
assert.equal(behavior.elements.deleteReview.open, true);
assert.match(behavior.elements.deleteSummary.textContent, /Parent v1/);
workflow.confirm();
assert.deepEqual(library.schemas, []);
assert.equal(library.activeSchemaId, undefined);
assert.equal(behavior.elements.result.textContent, "Deleted Parent.");
assert.equal(behavior.calls.renderAll, 1);
// RETIRED_SCHEMA_ASSERTIONS_START:library-deletion-review
const retiredSchemaAssertions = {
  "library-deletion-review-001": (...args) => assert.equal(...args),
  "library-deletion-review-002": (...args) => assert.match(...args),
  "library-deletion-review-003": (...args) => assert.equal(...args),
  "library-deletion-review-004": (...args) => assert.equal(...args),
};
await runRetiredSchemaControllerScenario(retiredSchemaAssertions);
// RETIRED_SCHEMA_ASSERTIONS_END:library-deletion-review
