import assert from "node:assert/strict";
import { runRetiredSchemaControllerScenario } from "./fixtures/retired-controller-scenario.mjs";
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

assert.equal(omittedRuleStatus(1), "1 omitted rule");
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
assert.equal(behavior.elements.exportChoices.open, true);
assert.equal(
  behavior.elements.exportChoices.children[0].textContent,
  "Export First",
);
behavior.elements.exportChoices.children[1].click();
assert.equal(
  behavior.calls.downloads[0].filename,
  "first-extension-package-v1.json",
);
assert.equal(behavior.elements.exportButton.focused, true);
workflow.openChoices(behavior.elements.exportButton);
behavior.elements.exportChoices.children[3].click();
assert.equal(behavior.elements.exportReview.open, true);
behavior.elements.exportReview.children.at(-2).click();
assert.equal(
  behavior.calls.downloads.at(-1).filename,
  "schema-library-draft-2020-12.schema.json",
);
assert.match(behavior.elements.result.textContent, /Draft 2020-12 bundle/);
// RETIRED_SCHEMA_ASSERTIONS_START:library-export-choice-compatibility-io
const retiredSchemaAssertions = {
  "library-export-choice-compatibility-io-001": (...args) => assert.equal(...args),
  "library-export-choice-compatibility-io-002": (...args) => assert.equal(...args),
  "library-export-choice-compatibility-io-003": (...args) => assert.equal(...args),
  "library-export-choice-compatibility-io-004": (...args) => assert.equal(...args),
  "library-export-choice-compatibility-io-005": (...args) => assert.equal(...args),
  "library-export-choice-compatibility-io-006": (...args) => assert.deepEqual(...args),
  "library-export-choice-compatibility-io-007": (...args) => assert.equal(...args),
  "library-export-choice-compatibility-io-008": (...args) => assert.equal(...args),
  "library-export-choice-compatibility-io-009": (...args) => assert.equal(...args),
  "library-export-choice-compatibility-io-010": (...args) => assert.equal(...args),
  "library-export-choice-compatibility-io-011": (...args) => assert.match(...args),
  "library-export-choice-compatibility-io-012": (...args) => assert.equal(...args),
  "library-export-choice-compatibility-io-013": (...args) => assert.deepEqual(...args),
  "library-export-choice-compatibility-io-014": (...args) => assert.equal(...args),
  "library-export-choice-compatibility-io-015": (...args) => assert.equal(...args),
  "library-export-choice-compatibility-io-016": (...args) => assert.equal(...args),
};
await runRetiredSchemaControllerScenario(retiredSchemaAssertions);
// RETIRED_SCHEMA_ASSERTIONS_END:library-export-choice-compatibility-io
