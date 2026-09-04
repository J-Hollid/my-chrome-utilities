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

assert.equal(renders, 1);

assert.equal(picker.children.length, 4);

assert.equal(picker.children[0].id, "schema-property-rule-picker-heading");

assert.match(picker.children[0].textContent, /title/u);

assert.match(picker.children[0].textContent, /type string/u);

assert.equal(picker.children[1].id, "schema-property-rule-search");

assert.equal(picker.children[2].id, "schema-property-rule-results");

assert.equal(picker.children[3].textContent, "Cancel");

assert.equal(picker["aria-labelledby"], "schema-property-rule-picker-heading");

assert.equal(picker.children[2].children[0]["aria-label"], "Create a rule");

assert.equal(picker.children[2].children[1]["aria-label"], "Attach from Rule Library");
const reusableChoice = picker.children[2].children[1].children[1].children[0];

assert.equal(reusableChoice.textContent, "Reusable title version 3");

assert.equal(reusableChoice.disabled, false);

const requiredChoice = picker.children[2].children[0].children[1].children[0];
requiredChoice.click();
assert.equal(renders, 2);

assert.equal(picker.children.length, 1);

assert.equal(picker.children[0].id, "schema-local-rule-configuration");

assert.equal(find(picker, "schema-local-rule-parameters")?.children[0].textContent, "Rule parameters");

assert.equal(find(picker, "schema-local-rule-severity")?.value, "error");

assert.equal(find(picker, "schema-local-rule-message")?.value, "");

assert.equal(find(picker, "schema-local-rule-enabled")?.checked, true);

assert.equal(find(picker, "schema-local-rule-conditional")?.checked, false);

assert.equal(find(picker, "schema-local-rule-reusable")?.checked, false);

assert.match(picker.dataset.conditionPreview, /"propertyPath":"\/title"/u);

const conditional = find(picker, "schema-local-rule-conditional");
conditional.checked = true;
conditional.dispatch("change");

assert.equal(controller.configuration.applyOnlyWhen, true);

assert.equal(controller.configuration.conditions.length, 1);

assert.ok(find(picker, "schema-local-rule-conditions"));

assert.ok(find(picker, "schema-local-rule-current-preview"));
assert.match(find(picker, "schema-local-rule-current-preview").textContent, /Current event preview/u);

const reusable = find(picker, "schema-local-rule-reusable");
reusable.checked = true;
reusable.dispatch("change");
assert.equal(controller.configuration.saveReusable, true);

assert.ok(find(picker, "schema-local-rule-reusable-explanation"));

assert.equal(find(picker, "schema-local-rule-reusable-explanation").textContent,
  "This reusable rule will be available to other schemas.");

assert.ok(find(picker, "schema-local-rule-name"));

assert.ok(find(picker, "schema-local-rule-description"));

controller.setConfiguration(createRuleConfiguration("Allowed values", "string"));
view.render();

assert.ok(find(picker, "schema-local-rule-allowed-values"));

assert.equal(find(picker, "schema-local-rule-allowed-values").children.at(-1).textContent,
  "Add another value");
find(picker, "schema-local-rule-allowed-values").children.at(-1).click();

assert.deepEqual(controller.configuration.allowedValues, ["", ""]);
assert.ok(find(picker, "schema-local-rule-allowed-value-1"));
assert.equal(commits, 0);
assert.equal(closes, 0);

assert.deepEqual(controller.configuration.allowedValues, ["", ""],
  "the direct picker owner retains both configured allowed-value fields");
