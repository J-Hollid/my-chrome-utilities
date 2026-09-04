import assert from "node:assert/strict";
import { fixture } from "./retired-source-controller-contract-test.mjs";

const { elements, schemaMasterPanel, schemaRulesPanel, schemaRulesTab, uiController } = fixture;

// retired-schema-assertion: property-filter-removal-copy-manual-index-001
assert.equal(elements.get("#schema-property-result-status").textContent, "1 of 1 properties");
elements.get("#schema-property-filter").value = "missing"; elements.get("#schema-property-filter").dispatch("input");
// retired-schema-assertion: property-filter-removal-copy-manual-index-002
assert.equal(elements.get("#schema-property-empty").hidden, false);
// retired-schema-assertion: property-filter-removal-copy-manual-index-003
assert.equal(elements.get("#schema-property-empty-message").textContent, "No properties match missing");
elements.get("#clear-schema-property-filter").click();
// retired-schema-assertion: property-filter-removal-copy-manual-index-004
assert.equal(elements.get("#schema-property-filter").value, "");
const propertyToggle = elements.get("#schema-property-tree").children[0].children[0];
propertyToggle.click();
// retired-schema-assertion: property-filter-removal-copy-manual-index-005
assert.equal(propertyToggle.listenerCount(), 0, "property selection rerender disposes the replaced row listeners");
schemaRulesTab.click();
// retired-schema-assertion: property-filter-removal-copy-manual-index-006
assert.equal(schemaMasterPanel.hidden, true);
// retired-schema-assertion: property-filter-removal-copy-manual-index-007
assert.equal(schemaRulesPanel.hidden, false);
uiController.beginDraft();
uiController.updateDraft({ documentation:{ properties:{ "/title":{ displayName:"Title", description:"Page title" } } } });
uiController.requestPropertyRemoval("/title");
// retired-schema-assertion: property-filter-removal-copy-manual-index-008
assert.equal(elements.get("#schema-property-removal-dialog").open, true);
// retired-schema-assertion: property-filter-removal-copy-manual-index-009
assert.match(elements.get("#schema-property-removal-summary").textContent, /Documentation entries: \/title/);
elements.get("#confirm-schema-property-removal").click();
// retired-schema-assertion: property-filter-removal-copy-manual-index-010
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).workingDraft.document.properties.title,
  undefined);
elements.get("#undo-schema-property-removal").click();
// retired-schema-assertion: property-filter-removal-copy-manual-index-011
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).workingDraft.document.properties.title.type,
  "string", "Undo restores the exact property definition");
uiController.requestDocumentationRemoval("/title");
elements.get("#confirm-schema-documentation-removal").click();
const documentationDraft = uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).workingDraft;
// retired-schema-assertion: property-filter-removal-copy-manual-index-012
assert.equal(documentationDraft.document.properties.title.type, "string");
// retired-schema-assertion: property-filter-removal-copy-manual-index-013
assert.equal(documentationDraft.documentation.properties, undefined,
  "documentation-only removal leaves the schema property intact");
const sourceId = uiController.state().activeSchemaId;
const destinationId = uiController.schemas().find(({ id }) => id !== sourceId).id;
uiController.updateDraft({ document:{ type:"object", properties:{ title:{ type:"string" }, checkout:{ type:"boolean" } } } });
uiController.requestPropertyCopy("/checkout", destinationId);
// retired-schema-assertion: property-filter-removal-copy-manual-index-014
assert.equal(elements.get("#schema-property-copy-dialog").open, true);
uiController.confirmPropertyCopy();
// retired-schema-assertion: property-filter-removal-copy-manual-index-015
assert.equal(uiController.schemas().find(({ id }) => id === destinationId).workingDraft.document.properties.checkout.type, "boolean");
elements.get("#undo-schema-property-copy").click();
// retired-schema-assertion: property-filter-removal-copy-manual-index-016
assert.equal(uiController.schemas().find(({ id }) => id === destinationId).workingDraft, undefined,
  "property-copy undo restores the complete destination schema state");
uiController.updateDraft({ document:{ type:"object", properties:{ items:{ type:"array", items:{ type:"object",
  properties:{ name:{ type:"string" } } } } } } });
uiController.openSpecificIndex("/items");
elements.get("#schema-specific-index").value = "2"; elements.get("#schema-specific-index").dispatch("input");
// retired-schema-assertion: property-filter-removal-copy-manual-index-017
assert.equal(elements.get("#confirm-schema-specific-index").disabled, false);
elements.get("#schema-specific-index-form").dispatch("submit");
// retired-schema-assertion: property-filter-removal-copy-manual-index-018
assert.equal(elements.get("#schema-specific-index-dialog").open, false);
// retired-schema-assertion: property-filter-removal-copy-manual-index-019
assert.equal(elements.get("#schema-property-rule-picker").open, true,
  "an accepted specific index transitions directly into the controller-owned rule picker");
// retired-schema-assertion: property-filter-removal-copy-manual-index-020
assert.equal(uiController.rulePickerState().path, "items.2");
// retired-schema-assertion: property-filter-removal-copy-manual-index-021
assert.match(elements.get("#schema-property-rule-picker").dataset.conditionPreview, /items\/2/,
  "the dotted controller path retains the accepted canonical array index");
elements.get("#schema-property-rule-picker").dispatch("cancel");
// retired-schema-assertion: property-filter-removal-copy-manual-index-022
assert.equal(uiController.rulePickerState().path, undefined,
  "closing the owned rule picker clears its transition state without an external callback");
uiController.openManualProperty();
elements.get("#schema-manual-property-path").value = "checkout.total";
elements.get("#schema-manual-property-type").value = "number";
elements.get("#schema-manual-property-path").dispatch("input");
// retired-schema-assertion: property-filter-removal-copy-manual-index-023
assert.match(elements.get("#schema-manual-property-preview").textContent, /checkout.total is number/);
elements.get("#schema-manual-property-form").dispatch("submit");
// retired-schema-assertion: property-filter-removal-copy-manual-index-024
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId)
  .workingDraft.document.properties.checkout.properties.total.type, "number");
uiController.openManualProperty();
elements.get("#schema-manual-property-path").value = "checkout.tax";
elements.get("#schema-manual-property-type").value = "number";
elements.get("#schema-manual-property-path").dispatch("input");
elements.get("#schema-manual-property-form").dispatch("submit");
const activeSchemaForRuleIdentity = uiController.state().activeSchemaId;

export { activeSchemaForRuleIdentity, fixture };
