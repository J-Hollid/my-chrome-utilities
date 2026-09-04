import assert from "node:assert/strict";
import { activeSchemaForRuleIdentity, fixture } from "./retired-property-controller-contract-test.mjs";

const { elements, findByText, uiController } = fixture;

// retired-schema-assertion: rule-choice-parameters-predicates-preview-001
assert.equal(uiController.attachReusableRule(activeSchemaForRuleIdentity, "rule:quantities", "checkout.total"), true);
uiController.openRulePicker("checkout.tax");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-002
assert.equal(findByText(elements.get("#schema-property-rule-picker"), "Reusable quantities version 3").disabled, false,
  "a reusable rule attached to one property remains available on another compatible property");
elements.get("#schema-property-rule-picker").dispatch("cancel");
uiController.openRulePicker("checkout.total");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-003
assert.equal(findByText(elements.get("#schema-property-rule-picker"), "Reusable quantities version 3 · already attached").disabled, true,
  "canonical dotted and pointer paths identify the same property attachment");
elements.get("#schema-property-rule-picker").dispatch("cancel");
uiController.openContextualManualProperty("/items/*");
elements.get("#schema-manual-property-child-name").value = "sku";
elements.get("#schema-manual-property-type").value = "string";
elements.get("#schema-manual-property-child-name").dispatch("input");
elements.get("#schema-manual-property-form").dispatch("submit");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-004
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId)
  .workingDraft.document.properties.items.items.properties.sku.type, "string");
const openConfiguredRulePicker = (path) => {
  uiController.openRulePicker(path);
  findByText(elements.get("#schema-property-rule-picker"), "Required").click();
};
openConfiguredRulePicker("items.*.sku");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-005
assert.equal(elements.get("#schema-property-rule-picker").open, true);
// retired-schema-assertion: rule-choice-parameters-predicates-preview-006
assert.equal(uiController.rulePickerState().configuration.propertyType, "string");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-007
assert.match(elements.get("#schema-property-rule-picker").dataset.conditionPreview, /items\/\*\/sku/);
// retired-schema-assertion: rule-choice-parameters-predicates-preview-008
assert.deepEqual(uiController.conditionPredicate("checkout.total"), { operator:"All", predicates:[{
  propertyPath:"/checkout/total", operator:"Equals", comparison:{ type:"number", value:12 },
}] }, "sampled primitive condition values become typed Equals comparisons");
elements.get("#schema-property-rule-picker").dispatch("cancel");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-009
assert.equal(uiController.rulePickerState().path, undefined,
  "rule-picker close owns its state transition after removal of the notification-only port");
openConfiguredRulePicker("checkout.total");
for (const id of ["schema-local-rule-configuration", "schema-property-rule-picker-heading", "schema-local-rule-parameters",
  "schema-local-rule-assistance", "schema-local-rule-severity", "schema-local-rule-message", "schema-local-rule-enabled",
  "schema-local-rule-conditional", "schema-local-rule-reusable"]) {
// retired-schema-assertion: rule-choice-parameters-predicates-preview-010
  assert.ok(elements.get("#schema-property-rule-picker").querySelector(`#${id}`), `Schemas creates dynamic rule control #${id}`);
}
const conditionalControl = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-conditional");
conditionalControl.checked = true; conditionalControl.dispatch("change");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-011
assert.deepEqual(uiController.rulePickerState().configuration.conditions[0], {
  propertyPath:"/title", operator:"Exists", detectedType:"string",
}, "the live conditional editor defaults to another schema property rather than its own consequence");
const reusableControl = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-reusable");
reusableControl.checked = true; reusableControl.dispatch("change");
const conditionGroup = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-condition-group");
conditionGroup.value = "Any"; conditionGroup.dispatch("change");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-012
assert.equal(uiController.rulePickerState().configuration.conditionGroupOperator, "Any");
const conditionProperty = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-condition-property-0");
conditionProperty.value = "/title"; conditionProperty.dispatch("change");
const conditionComparison = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-condition-value-0");
conditionComparison.value = "13"; conditionComparison.dispatch("input");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-013
assert.deepEqual(uiController.rulePickerState().configuration.conditions[0].comparison, { type:"string", value:"13" });
elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-condition-add").click();
// retired-schema-assertion: rule-choice-parameters-predicates-preview-014
assert.equal(uiController.rulePickerState().configuration.conditions.length, 2, "the live editor adds conditional predicates");
elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-condition-remove-1").click();
// retired-schema-assertion: rule-choice-parameters-predicates-preview-015
assert.equal(uiController.rulePickerState().configuration.conditions.length, 1, "the live editor removes conditional predicates");
const conditionOperator = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-condition-operator-0");
conditionOperator.value = "Exists"; conditionOperator.dispatch("change");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-016
assert.equal(uiController.rulePickerState().configuration.conditions[0].comparison, undefined);
const severityControl = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-severity");
severityControl.value = "warning"; severityControl.dispatch("change");
const messageControl = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-message");
messageControl.value = "Observed checkout total is required"; messageControl.dispatch("input");
const enabledControl = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-enabled");
enabledControl.checked = false; enabledControl.dispatch("change");
const configuredName = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-name");
configuredName.value = "Sampled checkout total"; configuredName.dispatch("input");
const configuredDescription = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-description");
configuredDescription.value = "Created from the current capture"; configuredDescription.dispatch("input");
elements.get("#schema-property-rule-picker").children[0].dispatch("submit");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-017
assert.equal(uiController.rules().some(({ name }) => name === "Sampled checkout total"), true,
  "the live rule form commits its validated reusable rule through Schema ownership");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-018
assert.equal(uiController.rules().find(({ name }) => name === "Sampled checkout total").severity, "warning");
openConfiguredRulePicker("checkout.total"); uiController.configureRule("Exact value");
const exactValueControl = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-exactValue");
exactValueControl.value = "12"; exactValueControl.dispatch("input");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-019
assert.equal(uiController.rulePickerState().configuration.exactValue, "12", "parameter controls update the live rule configuration");
elements.get("#schema-property-rule-picker").children[0].children.at(-1).click();
openConfiguredRulePicker("checkout.total"); uiController.configureRule("Allowed values");
let allowedValue = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-allowed-value-1");
allowedValue.value = "12"; allowedValue.dispatch("input");
findByText(elements.get("#schema-property-rule-picker"), "Add another value").click();
allowedValue = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-allowed-value-2"); allowedValue.value = "13"; allowedValue.dispatch("input");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-020
assert.deepEqual(uiController.rulePickerState().configuration.allowedValues, ["12", "13"]);
findByText(elements.get("#schema-property-rule-picker"), "Remove value 1").click();
// retired-schema-assertion: rule-choice-parameters-predicates-preview-021
assert.deepEqual(uiController.rulePickerState().configuration.allowedValues, ["13"]);
elements.get("#schema-property-rule-picker").children[0].children.at(-1).click();
openConfiguredRulePicker("checkout.total");
elements.get("#schema-property-rule-picker").children[0].children.at(-2).click();
// retired-schema-assertion: rule-choice-parameters-predicates-preview-022
assert.ok(elements.get("#schema-property-rule-picker").querySelector("#schema-property-rule-picker-heading"));
// retired-schema-assertion: rule-choice-parameters-predicates-preview-023
assert.ok(elements.get("#schema-property-rule-picker").querySelector("#schema-property-rule-results"),
  "Schemas preserves the dynamic legacy rule-results ID when returning to rule choices");
const pickerSearch = elements.get("#schema-property-rule-picker").querySelector("#schema-property-rule-search"); pickerSearch.value = "missing"; pickerSearch.dispatch("input");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-024
assert.equal(elements.get("#schema-property-rule-picker").children[2].children[0].id, "schema-property-rule-empty");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-025
assert.equal(elements.get("#schema-property-rule-picker").children[2].children[1].textContent, "Clear search");
elements.get("#schema-property-rule-picker").children[2].children[1].click();
// retired-schema-assertion: rule-choice-parameters-predicates-preview-026
assert.ok(elements.get("#schema-property-rule-picker").children[2].children.length > 1, "clearing restores compatible rule choices");
elements.get("#schema-property-rule-picker").children.at(-1).click();

export { fixture };
