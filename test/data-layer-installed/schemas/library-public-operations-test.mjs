import assert from "node:assert/strict";

const { createSchemaLibraryPublicOperations } = await import(
  "../../../dist/data-layer-installed/schemas/library-public-operations.js"
);

const schema = {
  id: "schema:first",
  name: "First",
  version: 1,
  document: { type: "object", properties: {} },
  assignments: [],
  published: true,
};
const exportButton = {};
const calls = [];
const library = {
  schemas: [schema],
  openExportChoices: (trigger, selected) => calls.push([trigger, selected]),
};
const operations = createSchemaLibraryPublicOperations({
  library,
  active: () => schema,
  activeIndex: () => 0,
  persist() {},
  render() {},
  publish: () => schema,
  exportButton,
  mounted: () => true,
});

// retired-schema-assertion: library-export-choice-compatibility-io-001
assert.equal(operations.openExportChoices(), true);
assert.deepEqual(calls, [[exportButton, undefined]]);
assert.equal(operations.openExportChoices("missing"), false);

