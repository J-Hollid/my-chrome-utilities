import assert from "node:assert/strict";
import {
  createSchemaLibraryFakeDocument,
  createSchemaLibraryBehaviorPorts,
} from "../../support/schema-library-fake-dom.mjs";

const { SchemaLibraryController } = await import(
  "../../../dist/data-layer-installed/schemas/library-controller.js"
);
const { SchemaLibraryExportWorkflow, omittedRuleStatus } = await import(
  "../../../dist/data-layer-installed/schemas/library-export-workflow.js"
);
// retired-schema-assertion: library-export-choice-compatibility-io-001
// retired-schema-assertion: library-export-choice-compatibility-io-010
assert.equal(omittedRuleStatus(1), "1 omitted rule");
// retired-schema-assertion: library-export-choice-compatibility-io-002
// retired-schema-assertion: library-export-choice-compatibility-io-012
assert.equal(omittedRuleStatus(2), "2 omitted rules");
const schema = {
  id: "schema:first",
  name: "First",
  version: 1,
  document: { type: "object", properties: {} },
  assignments: [],
  published: true,
};
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
const workflow = new SchemaLibraryExportWorkflow(library, behavior.ports);
workflow.openChoices(behavior.elements.exportButton, schema);
// retired-schema-assertion: library-export-choice-compatibility-io-003
// retired-schema-assertion: library-export-choice-compatibility-io-014
assert.equal(behavior.elements.exportChoices.open, true);
// retired-schema-assertion: library-export-choice-compatibility-io-004
// retired-schema-assertion: library-export-choice-compatibility-io-015
assert.equal(
  behavior.elements.exportChoices.children[0].textContent,
  "Export First",
);
behavior.elements.exportChoices.children[1].click();
// retired-schema-assertion: library-export-choice-compatibility-io-005
// retired-schema-assertion: library-export-choice-compatibility-io-016
assert.equal(
  behavior.calls.downloads[0].filename,
  "first-extension-package-v1.json",
);
// retired-schema-assertion: library-export-choice-compatibility-io-007
assert.equal(behavior.elements.exportButton.focused, true);
workflow.openChoices(behavior.elements.exportButton);
behavior.elements.exportChoices.children[3].click();
// retired-schema-assertion: library-export-choice-compatibility-io-008
assert.equal(behavior.elements.exportReview.open, true);
behavior.elements.exportReview.children.at(-2).click();
// retired-schema-assertion: library-export-choice-compatibility-io-009
assert.equal(
  behavior.calls.downloads.at(-1).filename,
  "schema-library-draft-2020-12.schema.json",
);
// retired-schema-assertion: library-export-choice-compatibility-io-011
assert.match(behavior.elements.result.textContent, /Draft 2020-12 bundle/);
// retired-schema-assertion: library-export-choice-compatibility-io-006
// retired-schema-assertion: library-export-choice-compatibility-io-013
assert.deepEqual(behavior.calls.downloads.map(({ filename }) => filename),
  ["first-extension-package-v1.json", "schema-library-draft-2020-12.schema.json"],
  "the direct export owner preserves standard and draft download order");
