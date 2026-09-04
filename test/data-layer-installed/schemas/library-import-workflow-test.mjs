import assert from "node:assert/strict";
import { runRetiredSchemaControllerScenario } from "../../support/schema-library-fake-dom.mjs";
import {
  createSchemaLibraryFakeDocument,
  createSchemaLibraryBehaviorPorts,
} from "../../support/schema-library-fake-dom.mjs";

const { SchemaLibraryController } = await import(
  "../../../dist/data-layer-installed/schemas/library-controller.js"
);
const { SchemaLibraryImportWorkflow, inspectSchemaLibraryImport } =
  await import(
    "../../../dist/data-layer-installed/schemas/library-import-workflow.js"
  );

const schema = {
  id: "schema:first",
  name: "First",
  version: 1,
  document: { type: "object", properties: {} },
  assignments: [],
  published: true,
};
const imported = { ...schema, id: "schema:imported", name: "Imported" };
const parsed = inspectSchemaLibraryImport(
  JSON.stringify({ version: 1, schemas: [imported], rules: [] }),
  [schema],
);
assert.deepEqual(
  parsed.schemas.map(({ id }) => id),
  [imported.id],
);
assert.throws(
  () => inspectSchemaLibraryImport("{}", [schema]),
  /version 1 Schema Library export/,
);

const values = new Map([
  ["my-chrome-utilities.schema-library.v1", JSON.stringify([schema])],
]);
const library = new SchemaLibraryController({
  storage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  },
  changed() {},
});
const { element } = createSchemaLibraryFakeDocument();
const behavior = createSchemaLibraryBehaviorPorts(element);
const workflow = new SchemaLibraryImportWorkflow(library, behavior.ports);
workflow.review(
  JSON.stringify({
    version: 1,
    schemas: [imported],
    rules: [
      {
        id: "rule:first",
        name: "First",
        kind: "required",
        version: 1,
        enabled: true,
      },
    ],
  }),
);
assert.equal(behavior.elements.importReview.open, true);
assert.match(
  behavior.elements.importSummary.textContent,
  /1 schemas and 1 reusable rules/,
);
workflow.append();
assert.deepEqual(
  library.schemas.map(({ id }) => id),
  [schema.id, imported.id],
);
assert.deepEqual(
  behavior.rules().map(({ id }) => id),
  ["rule:first"],
);
assert.deepEqual(behavior.calls, {
  persistRules: 1,
  renderAll: 1,
  renderRules: 1,
  downloads: [],
});
assert.equal(behavior.elements.result.textContent, "Schema Library appended.");
// RETIRED_SCHEMA_ASSERTIONS_START:library-import-review
const retiredSchemaAssertions = {
  "library-import-review-001": (...args) => assert.equal(...args),
  "library-import-review-002": (...args) => assert.equal(...args),
  "library-import-review-003": (...args) => assert.equal(...args),
};
await runRetiredSchemaControllerScenario(retiredSchemaAssertions);
// RETIRED_SCHEMA_ASSERTIONS_END:library-import-review
