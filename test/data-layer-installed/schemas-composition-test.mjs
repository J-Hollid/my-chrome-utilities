import assert from "node:assert/strict";
import { verifyPreparedInstalledController } from "../support/data-layer-installed-controller-contract.mjs";

await verifyPreparedInstalledController("schemas");
const { createSchemasInstalledController } = await import("../../dist/data-layer-installed/schemas/index.js");
const schema = { id:"schema:page", name:"Page", version:1, document:{ type:"object", properties:{ title:{ type:"string" } } },
  assignments:[], published:true };
const untouchedSchema = { id:"schema:untouched", name:"Untouched", version:1,
  document:{ type:"object", properties:{ title:{ type:"string" } } }, assignments:[], published:true,
  attachedRules:[{ id:"rule:untouched", version:1, operator:"required", propertyPath:"/title" }] };
const values = new Map([["my-chrome-utilities.schema-library.v1", JSON.stringify([schema, untouchedSchema])]]);
let changed = 0;
const controller = createSchemasInstalledController({
  root:{ querySelector:() => null, querySelectorAll:() => [] },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value), removeItem:(key) => values.delete(key) },
  relationshipViewStorage:{ getItem:()=>null, setItem() {} },
  changed:() => { changed += 1; }, subscribe:() => () => {}, createRuleId:() => "rule:first",
  capturedAssignmentValue:() => undefined, renderAssignmentConditions() {},
  localRulePromotionDialog:{ open() {}, close() {} }, subscribeSchemaPersistence:() => () => {},
  downloadSchema() {},
  relationshipTree:()=>({ projectId:"no-project", nodes:[] }), openProjectLibrary() {}, openContributor() {},
  openContributorInStudio() {}, adoptSavedSchema() {}, renderSchemaSpecification() {}, reportMissingSchemaEvent() {},
  scheduleFrame:(callback)=>callback(), restoreGuidedCapture() {}, mountLayeredProfileEditor:() => undefined,
  showSchemasView() {},
  canonicalConceptSuggestions:() => [], activeProjectId:()=>undefined,
  ensureProjectSchemaContributors:async()=>({ name:"" }),
});
controller.mount(); controller.open("schema:page"); controller.beginDraft();
controller.updateDraft({ document:{ type:"object", required:["title"], properties:{ title:{ type:"string" } } } }, "Require title");
assert.equal(controller.state().draftDirty, true);
const evaluation = controller.validate({ sourceId:"history", eventName:"page_view", payload:{}, rawInput:{} });
assert.equal(evaluation.state, "Not checked", "unassigned events retain the exact validation contract");
const published = controller.publish();
assert.equal(published.version, 2, "Schemas exclusively owns draft publication");
assert.equal(published.document.required[0], "title");
const persistedSchemas = JSON.parse(values.get("my-chrome-utilities.schema-library.v1"));
assert.equal(persistedSchemas[0].id === schema.id && persistedSchemas[1].id === untouchedSchema.id, true,
  "schema persistence stages changed schemas before migration-only settled projections");
await controller.runGuidedValidation();
assert.ok(changed >= 3);
controller.dispose(); controller.mount();
assert.equal(controller.state().activeSchemaId, "schema:page");
assert.equal(controller.state().draftDirty, false);
controller.dispose();
