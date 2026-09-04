import assert from "node:assert/strict";
import { fixture } from "./retired-library-deletion-controller-contract-test.mjs";

const { elements, schemaDownloads, uiController } = fixture;

// retired-schema-assertion: library-export-choice-compatibility-io-001
assert.equal(uiController.openExportChoices(), true);
// retired-schema-assertion: library-export-choice-compatibility-io-002
assert.equal(elements.get("#schema-export-choices").open, true);
// retired-schema-assertion: library-export-choice-compatibility-io-003
assert.equal(elements.get("#schema-export-choices").children[0].textContent, "Export Schema Library");
// retired-schema-assertion: library-export-choice-compatibility-io-004
assert.equal(elements.get("#schema-export-choices").children[3].textContent, "JSON Schema Draft 2020-12 bundle");
// retired-schema-assertion: library-export-choice-compatibility-io-005
assert.equal(elements.get("#schema-export-choices").children[4].textContent, "For third-party standards-based validation; not extension configuration.");
elements.get("#schema-export-choices").children[5].click();
// retired-schema-assertion: library-export-choice-compatibility-io-006
assert.deepEqual(schemaDownloads, [], "cancelled export produces no download");
uiController.openExportChoices(); elements.get("#schema-export-choices").children[3].click();
// retired-schema-assertion: library-export-choice-compatibility-io-007
assert.equal(elements.get("#schema-export-compatibility-review").open, true);
// retired-schema-assertion: library-export-choice-compatibility-io-008
assert.equal(elements.get("#schema-export-compatibility-review").children[0].textContent, "JSON Schema Draft 2020-12 compatibility review");
// retired-schema-assertion: library-export-choice-compatibility-io-009
assert.equal(elements.get("#schema-export-compatibility-review").children[2]["aria-label"], "Standard export conversions");
// retired-schema-assertion: library-export-choice-compatibility-io-010
assert.equal(uiController.omittedRuleStatus(1), "1 omitted rule");
elements.get("#schema-export-compatibility-review").children[4].click();
// retired-schema-assertion: library-export-choice-compatibility-io-011
assert.match(schemaDownloads[0], /schema.*\.json/, "confirmed standard export crosses the typed download port");
const publishedExportCount=uiController.schemas().filter(({published,version})=>published!==false&&version>0).length;
// retired-schema-assertion: library-export-choice-compatibility-io-012
assert.equal(elements.get("#schema-result").textContent,`Exported JSON Schema Draft 2020-12 bundle · ${publishedExportCount} schemas · 2 omitted rules.`);
// retired-schema-assertion: library-export-choice-compatibility-io-013
assert.deepEqual(elements.get("#export-schema").focusOptions,{preventScroll:true},"export completion restores trigger focus without scrolling");
uiController.openExportChoices();elements.get("#schema-export-choices").children[1].click();
// retired-schema-assertion: library-export-choice-compatibility-io-014
assert.equal(elements.get("#schema-result").textContent,`Exported Extension backup · ${uiController.schemas().length} schemas and ${uiController.rules().length} rules.`);
const exportedSchemaId=uiController.state().activeSchemaId;uiController.openExportChoices(exportedSchemaId);elements.get("#schema-export-choices").children[1].click();
const exportedSchema=uiController.schemas().find(({id})=>id===exportedSchemaId);
// retired-schema-assertion: library-export-choice-compatibility-io-015
assert.equal(elements.get("#schema-result").textContent,`Exported Extension schema package · ${exportedSchema.name} revision ${exportedSchema.version}.`);
uiController.openExportChoices(exportedSchemaId);elements.get("#schema-export-choices").children[3].click();elements.get("#schema-export-compatibility-review").children[4].click();
// retired-schema-assertion: library-export-choice-compatibility-io-016
assert.equal(elements.get("#schema-result").textContent,`Exported JSON Schema Draft 2020-12 · ${exportedSchema.name} revision ${exportedSchema.version} · 0 omitted rules.`);

export { fixture };
