import assert from "node:assert/strict";
import { createSchemaLibraryFakeDocument } from "../../support/schema-library-fake-dom.mjs";

const { createRuleConfiguration } = await import(
  "../../../dist/utilities/data-layer/schemas.js"
);
const { SchemaRuleController } = await import(
  "../../../dist/data-layer-installed/schemas/rule-controller.js"
);
const { SchemaRulePickerView } = await import(
  "../../../dist/data-layer-installed/schemas/rule-picker-view.js"
);

const { element } = createSchemaLibraryFakeDocument();
const picker = element();
const schema = {
  id:"schema:one", name:"One", version:1, published:true,
  document:{ type:"object", properties:{
    title:{ type:"string" }, quantity:{ type:"number" }, items:{ type:"array", items:{ type:"string" } },
  } },
  assignments:[], attachedRules:[],
};
const storage = { getItem:() => null, setItem() {} };
const controller = new SchemaRuleController(storage);
controller.replaceRules([
  { id:"rule:one", name:"Reusable title", kind:"Required", version:3,
    operator:"required", applicableType:"string", enabled:true },
]);
controller.setPicker("title");
controller.configure({
  elements:{},
  presentation:{},
  schemas:() => [schema],
  replaceSchemas() {},
  persistRules() {},
  persistLibrary() {},
  renderAll() {},
  renderDraft() {},
  createId:() => "id:one",
  download() {},
  createRuleId:() => "rule:new",
  capturedValue:() => undefined,
  editableSchema:() => schema,
  propertyType:(_document, path) => path === "/quantity" ? "number" : "string",
  draft:() => schema,
  replaceDraft() {},
  presentDraft:(value) => value,
  activeSchemaId:() => schema.id,
  promotionDialog:{ open() {}, close() {} },
  detail:null,
  root:{ querySelector:() => null, querySelectorAll:() => [] },
  scheduleFrame:(run) => run(),
  result() {},
  commitPromotion:async () => {},
});
let renders = 0;
let closes = 0;
let commits = 0;
const ports = {
  picker,
  active:() => schema,
  draft:() => schema,
  capturedValue:() => ({ title:"Checkout", quantity:2, items:["one", "two"] }),
  propertyType:(_document, path) => path === "/quantity" ? "number" : "string",
  incrementRender:() => { renders += 1; },
  close:() => { closes += 1; },
  closeForCommit:() => { commits += 1; },
  createConfigured:() => true,
};
const view = new SchemaRulePickerView(controller, ports);
const find = (root, id) => {
  if (root?.id === id) return root;
  for (const child of root?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
};

view.render();

// retired-schema-assertion: rule-choice-parameters-predicates-preview-003
assert.equal(renders, 1);

assert.equal(picker.children.length, 4);

// retired-schema-assertion: property-filter-removal-copy-manual-index-015
assert.equal(picker.children[0].id, "schema-property-rule-picker-heading");

// retired-schema-assertion: source-drafts-revision-publication-close-058
assert.match(picker.children[0].textContent, /title/u);

// retired-schema-assertion: assignment-conflicts-003
assert.match(picker.children[0].textContent, /type string/u);

// retired-schema-assertion: guided-selection-continuation-promotion-012
assert.equal(picker.children[1].id, "schema-property-rule-search");

// retired-schema-assertion: rule-choice-parameters-predicates-preview-024
assert.equal(picker.children[2].id, "schema-property-rule-results");

// retired-schema-assertion: guided-selection-continuation-promotion-026
assert.equal(picker.children[3].textContent, "Cancel");

// retired-schema-assertion: guided-selection-continuation-promotion-013
assert.equal(picker["aria-labelledby"], "schema-property-rule-picker-heading");

// retired-schema-assertion: library-export-choice-compatibility-io-009
assert.equal(picker.children[2].children[0]["aria-label"], "Create a rule");

assert.equal(picker.children[2].children[1]["aria-label"], "Attach from Rule Library");
const reusableChoice = picker.children[2].children[1].children[1].children[0];

// retired-schema-assertion: property-filter-removal-copy-manual-index-001
assert.equal(reusableChoice.textContent, "Reusable title version 3");

// retired-schema-assertion: property-filter-removal-copy-manual-index-017
assert.equal(reusableChoice.disabled, false);

const requiredChoice = picker.children[2].children[0].children[1].children[0];
requiredChoice.click();
assert.equal(renders, 2);

assert.equal(picker.children.length, 1);

// retired-schema-assertion: rule-choice-parameters-predicates-preview-004
assert.equal(picker.children[0].id, "schema-local-rule-configuration");

// retired-schema-assertion: guided-selection-continuation-promotion-028
assert.equal(find(picker, "schema-local-rule-parameters")?.children[0].textContent, "Rule parameters");

// retired-schema-assertion: rule-choice-parameters-predicates-preview-018
assert.equal(find(picker, "schema-local-rule-severity")?.value, "error");

// retired-schema-assertion: property-filter-removal-copy-manual-index-024
assert.equal(find(picker, "schema-local-rule-message")?.value, "");

assert.equal(find(picker, "schema-local-rule-enabled")?.checked, true);

// retired-schema-assertion: property-filter-removal-copy-manual-index-002
assert.equal(find(picker, "schema-local-rule-conditional")?.checked, false);

// retired-schema-assertion: property-filter-removal-copy-manual-index-018
assert.equal(find(picker, "schema-local-rule-reusable")?.checked, false);

// retired-schema-assertion: rule-choice-parameters-predicates-preview-007
assert.match(picker.dataset.conditionPreview, /"propertyPath":"\/title"/u);

const conditional = find(picker, "schema-local-rule-conditional");
conditional.checked = true;
conditional.dispatch("change");

// retired-schema-assertion: rule-choice-parameters-predicates-preview-015
assert.equal(controller.configuration.applyOnlyWhen, true);

// retired-schema-assertion: rule-choice-parameters-predicates-preview-014
assert.equal(controller.configuration.conditions.length, 1);

// retired-schema-assertion: source-drafts-revision-publication-close-078
assert.ok(find(picker, "schema-local-rule-conditions"));

// retired-schema-assertion: source-drafts-revision-publication-close-081
assert.ok(find(picker, "schema-local-rule-current-preview"));
assert.match(find(picker, "schema-local-rule-current-preview").textContent, /Current event preview/u);

const reusable = find(picker, "schema-local-rule-reusable");
reusable.checked = true;
reusable.dispatch("change");
assert.equal(controller.configuration.saveReusable, true);

// retired-schema-assertion: rule-choice-parameters-predicates-preview-010
assert.ok(find(picker, "schema-local-rule-reusable-explanation"));

// retired-schema-assertion: property-filter-removal-copy-manual-index-003
assert.equal(find(picker, "schema-local-rule-reusable-explanation").textContent,
  "This reusable rule will be available to other schemas.");

// retired-schema-assertion: rule-choice-parameters-predicates-preview-022
assert.ok(find(picker, "schema-local-rule-name"));

// retired-schema-assertion: rule-choice-parameters-predicates-preview-023
assert.ok(find(picker, "schema-local-rule-description"));

controller.setConfiguration(createRuleConfiguration("Allowed values", "string"));
view.render();

// retired-schema-assertion: rule-choice-parameters-predicates-preview-026
assert.ok(find(picker, "schema-local-rule-allowed-values"));

// retired-schema-assertion: rule-choice-parameters-predicates-preview-025
assert.equal(find(picker, "schema-local-rule-allowed-values").children.at(-1).textContent,
  "Add another value");
find(picker, "schema-local-rule-allowed-values").children.at(-1).click();

// retired-schema-assertion: rule-choice-parameters-predicates-preview-020
assert.deepEqual(controller.configuration.allowedValues, ["", ""]);
assert.ok(find(picker, "schema-local-rule-allowed-value-1"));
assert.equal(commits, 0);
assert.equal(closes, 0);

assert.deepEqual(controller.configuration.allowedValues, ["", ""],
  "the direct picker owner retains both configured allowed-value fields");
