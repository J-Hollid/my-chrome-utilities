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

// retired-schema-assertion: library-export-choice-compatibility-io-010
assert.equal(omittedRuleStatus(1), "1 omitted rule");

assert.equal(omittedRuleStatus(2), "2 omitted rules");
const schema = {
  id: "schema:first",
  name: "First",
  version: 1,
  document: { type: "object", properties: { value:{ type:"string" } } },
  assignments: [],
  attachedRules:[
    { id:"custom:one", name:"Custom one", version:1, propertyPath:"/value", operator:"partner-contract" },
    { id:"custom:two", name:"Custom two", version:1, propertyPath:"/value", operator:"vendor-contract" },
  ],
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

// retired-schema-assertion: library-export-choice-compatibility-io-001
assert.equal(workflow.openChoices(behavior.elements.exportButton), true);

// retired-schema-assertion: library-export-choice-compatibility-io-002
assert.equal(behavior.elements.exportChoices.open, true);

// retired-schema-assertion: library-export-choice-compatibility-io-003
assert.equal(
  behavior.elements.exportChoices.children[0].textContent,
  "Export Schema Library",
);

// retired-schema-assertion: library-export-choice-compatibility-io-004
assert.equal(
  behavior.elements.exportChoices.children[3].textContent,
  "JSON Schema Draft 2020-12 bundle",
);

// retired-schema-assertion: library-export-choice-compatibility-io-005
assert.equal(behavior.elements.exportChoices.children[4].textContent,
  "For third-party standards-based validation; not extension configuration.");
behavior.elements.exportChoices.children[5].click();

// retired-schema-assertion: library-export-choice-compatibility-io-006
assert.deepEqual(behavior.calls.downloads, []);
workflow.openChoices(behavior.elements.exportButton);
behavior.elements.exportChoices.children[3].click();

// retired-schema-assertion: library-export-choice-compatibility-io-007
assert.equal(behavior.elements.exportReview.open, true);

// retired-schema-assertion: library-export-choice-compatibility-io-008
assert.equal(behavior.elements.exportReview.children[0].textContent,
  "JSON Schema Draft 2020-12 compatibility review");

// retired-schema-assertion: library-export-choice-compatibility-io-009
assert.equal(behavior.elements.exportReview.children[2]["aria-label"],
  "Standard export conversions");
behavior.elements.exportReview.children.at(-2).click();

// retired-schema-assertion: library-export-choice-compatibility-io-011
assert.match(behavior.calls.downloads[0].filename,/schema.*\.json/);

// retired-schema-assertion: library-export-choice-compatibility-io-012
assert.equal(behavior.elements.result.textContent,
  "Exported JSON Schema Draft 2020-12 bundle · 1 schemas · 2 omitted rules.");

// retired-schema-assertion: library-export-choice-compatibility-io-013
assert.deepEqual(behavior.elements.exportButton.focusOptions,{ preventScroll:true });

workflow.openChoices(behavior.elements.exportButton);
behavior.elements.exportChoices.children[1].click();

// retired-schema-assertion: library-export-choice-compatibility-io-014
assert.equal(behavior.elements.result.textContent,
  "Exported Extension backup · 1 schemas and 0 rules.");

const exportedSchema = { ...schema, id:"schema:clean", name:"Exported", attachedRules:[] };
library.replaceSchemas([exportedSchema]);
workflow.openChoices(behavior.elements.exportButton, exportedSchema);
behavior.elements.exportChoices.children[1].click();

// retired-schema-assertion: library-export-choice-compatibility-io-015
assert.equal(behavior.elements.result.textContent,
  "Exported Extension schema package · Exported revision 1.");
workflow.openChoices(behavior.elements.exportButton, exportedSchema);
behavior.elements.exportChoices.children[3].click();
behavior.elements.exportReview.children.at(-2).click();

// retired-schema-assertion: library-export-choice-compatibility-io-016
assert.equal(behavior.elements.result.textContent,
  "Exported JSON Schema Draft 2020-12 · Exported revision 1 · 0 omitted rules.");

assert.equal(behavior.calls.downloads.length,4,
  "the direct export owner crosses the download port once per confirmation");
