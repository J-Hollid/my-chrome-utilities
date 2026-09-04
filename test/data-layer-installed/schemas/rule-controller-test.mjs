import assert from "node:assert/strict";

const { SCHEMA_RULE_STORAGE_KEY, SchemaRuleController } = await import(
  "../../../dist/data-layer-installed/schemas/rule-controller.js"
);
const { installSchemaRuleElements } = await import(
  "../../../dist/data-layer-installed/schemas/rule-installed-view.js"
);
const queried = [];
const installed = installSchemaRuleElements({ querySelector(selector) { queried.push(selector); return null; } });
assert.equal(queried.includes("#schema-rule-editor"), true);
assert.equal(installed.elements.editor, null);

const values = new Map([[SCHEMA_RULE_STORAGE_KEY, JSON.stringify([
  { id:"rule:one", name:"Required", version:1, operator:"required" },
])]]);
const controller = new SchemaRuleController({
  getItem:(key) => values.get(key) ?? null,
  setItem:(key, value) => values.set(key, value),
});
assert.deepEqual(controller.rules.map(({ enabled }) => enabled), [true]);
controller.rules[0] = { ...controller.rules[0], enabled:false };
controller.persist();
assert.match(values.get(SCHEMA_RULE_STORAGE_KEY), /"enabled":false/);

const row = new EventTarget();
let actions = 0;
controller.listenRow(row, "click", () => { actions += 1; });
row.dispatchEvent(new Event("click"));
controller.pendingRevision = { id:"rule:one", changes:{ name:"Revised" } };
controller.pickerPath = "/checkout/email";
controller.dispose();
row.dispatchEvent(new Event("click"));
assert.equal(actions, 1, "rule disposal removes owned row actions");
assert.equal(controller.pendingRevision, undefined);
assert.equal(controller.pickerPath, undefined);
