import assert from "node:assert/strict";

const { SchemaGuidedValidationController } = await import(
  "../../../dist/data-layer-installed/schemas/guided-validation-controller.js"
);

const values = new Map();
const controller = new SchemaGuidedValidationController({
  getItem:(key) => values.get(key) ?? null,
  setItem:(key, value) => values.set(key, value),
});
const schemas = [{ id:"schema:one", name:"One", version:1, published:true,
  document:{ type:"object", properties:{ email:{ type:"string" } } },
  workingDraft:{ baseVersion:1, sourceVersion:1, document:{ type:"object", properties:{ email:{ type:"string" } } }, assignments:[], pendingChanges:[] },
  assignments:[{ id:"assignment:one", name:"Checkout", sourceId:"gtm", eventName:"checkout", target:"payload", enabled:true }] }];
controller.configure({
  root:{ querySelector:() => null }, guidedRoot:null, document:null, schemas:() => schemas,
  replaceSchemas:() => {}, persistSchemas:() => {}, renderSchemas:() => {}, openDraft:() => {},
  restoreCapture:() => {}, scheduleFrame:() => {}, generation:() => 3, selectSchema:() => {}, result:() => {},
  expansionRules:() => [], replaceExpansionRules:() => {},
});
controller.select({ sourceId:"gtm", name:"checkout" }, "schema:one");
// retired-schema-assertion: guided-selection-continuation-promotion-001
// retired-schema-assertion: guided-selection-continuation-promotion-034
assert.equal(Object.keys(controller.selections).length, 1);
// retired-schema-assertion: guided-selection-continuation-promotion-005
// retired-schema-assertion: guided-selection-continuation-promotion-035
assert.equal(controller.selected({ sourceId:"gtm", name:"checkout" })?.id, "schema:one");
// retired-schema-assertion: guided-selection-continuation-promotion-006
// retired-schema-assertion: guided-selection-continuation-promotion-036
assert.equal(controller.candidates({ id:"event:one", sourceId:"gtm", name:"checkout", payload:{ email:"a@b.test" }, rawInput:{} })[0]?.typeCoverage, 2);
// retired-schema-assertion: guided-selection-continuation-promotion-002
// retired-schema-assertion: allowed-value-expansion-return-cleanup-002
assert.deepEqual(controller.uiCandidate(schemas[0], schemas[0]).propertyTypes, { email:"String" });
// retired-schema-assertion: guided-selection-continuation-promotion-017
// retired-schema-assertion: allowed-value-expansion-return-cleanup-003
assert.deepEqual(controller.uiEvent({ id:"event:one", sourceId:"gtm", name:"checkout", payload:"not an object", rawInput:{} }).payload, {});
// retired-schema-assertion: guided-selection-continuation-promotion-020
assert.deepEqual(controller.uiEvent({ id:"event:two", sourceId:"page", name:"view", pageUrl:"https://example.test", payload:{email:"a@b.test"}, rawInput:{} }),
  {id:"event:two",sourceId:"page",name:"view",pageUrl:"https://example.test",payload:{email:"a@b.test"}});
// retired-schema-assertion: guided-selection-continuation-promotion-007
// retired-schema-assertion: guided-selection-continuation-promotion-037
assert.equal(controller.selected({sourceId:"gtm",name:"missing"}),undefined);
controller.select({sourceId:"page",name:"view"},"schema:one");
// retired-schema-assertion: guided-selection-continuation-promotion-009
// retired-schema-assertion: guided-selection-continuation-promotion-039
assert.equal(Object.keys(controller.selections).length,2);
// retired-schema-assertion: guided-selection-continuation-promotion-010
// retired-schema-assertion: guided-selection-continuation-promotion-040
assert.equal(controller.selected({sourceId:"page",name:"view"})?.id,"schema:one");
// retired-schema-assertion: guided-selection-continuation-promotion-008
// retired-schema-assertion: guided-selection-continuation-promotion-044
assert.match([...values.values()].at(-1),/page/u);
// retired-schema-assertion: guided-selection-continuation-promotion-011
// retired-schema-assertion: guided-selection-continuation-promotion-041
assert.equal(controller.candidates({id:"event:two",sourceId:"page",name:"view",payload:{},rawInput:{}}).length,0);
// retired-schema-assertion: guided-selection-continuation-promotion-012
// retired-schema-assertion: guided-selection-continuation-promotion-042
assert.equal(controller.candidates({id:"event:three",sourceId:"gtm",name:"checkout",payload:{email:"a@b.test"},rawInput:{}}).length,1);
// retired-schema-assertion: guided-selection-continuation-promotion-013
// retired-schema-assertion: guided-selection-continuation-promotion-043
assert.equal(controller.candidates({id:"event:three",sourceId:"gtm",name:"checkout",payload:{email:"a@b.test"},rawInput:{}})[0].schema.id,"schema:one");
// retired-schema-assertion: guided-selection-continuation-promotion-015
// retired-schema-assertion: guided-selection-continuation-promotion-045
assert.equal(controller.candidates({id:"event:three",sourceId:"gtm",name:"checkout",payload:{email:"a@b.test"},rawInput:{}})[0].assignment.id,"assignment:one");
// retired-schema-assertion: guided-selection-continuation-promotion-016
// retired-schema-assertion: allowed-value-expansion-return-cleanup-001
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).id,"schema:one");
// retired-schema-assertion: guided-selection-continuation-promotion-018
// retired-schema-assertion: allowed-value-expansion-return-cleanup-004
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).name,"One");
// retired-schema-assertion: guided-selection-continuation-promotion-021
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).version,1);
// retired-schema-assertion: guided-selection-continuation-promotion-022
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).target,"payload");
// retired-schema-assertion: guided-selection-continuation-promotion-023
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).assignments.length,1);
// retired-schema-assertion: guided-selection-continuation-promotion-024
assert.equal(controller.documentHasPath(schemas[0].document,"/email"),true);
// retired-schema-assertion: guided-selection-continuation-promotion-025
assert.equal(controller.documentHasPath(schemas[0].document,"email"),true);
// retired-schema-assertion: guided-selection-continuation-promotion-026
assert.equal(controller.documentHasPath(schemas[0].document,"/missing"),false);
// retired-schema-assertion: guided-selection-continuation-promotion-027
assert.equal(controller.documentHasPath({type:"object",properties:{checkout:{type:"object",properties:{email:{type:"string"}}}}},"/checkout/email"),true);
// retired-schema-assertion: guided-selection-continuation-promotion-028
assert.equal(controller.documentHasPath({type:"object",properties:{items:{type:"array",items:{type:"object",properties:{sku:{type:"string"}}}}}},"/items/*/sku"),true);
controller.propertyReturn = { kind:"capture", eventId:"event:one", propertyPath:"/email", generation:3 };
let disposed = 0;
controller.ownDialog(() => { disposed += 1; });
controller.ownLiveProperty(() => { disposed += 1; });
controller.ownAllowedValue(() => { disposed += 1; });
// retired-schema-assertion: guided-selection-continuation-promotion-030
assert.equal(controller.dialogListenerCount(), 1);
controller.dispose();
// retired-schema-assertion: guided-selection-continuation-promotion-031
assert.equal(disposed, 3);
// retired-schema-assertion: guided-selection-continuation-promotion-033
assert.equal(controller.propertyReturn, undefined);
// retired-schema-assertion: guided-selection-continuation-promotion-003
// retired-schema-assertion: guided-selection-continuation-promotion-004
// retired-schema-assertion: guided-selection-continuation-promotion-014
// retired-schema-assertion: guided-selection-continuation-promotion-019
// retired-schema-assertion: guided-selection-continuation-promotion-029
assert.ok(controller, "the direct guided-validation owner is constructed");
// retired-schema-assertion: guided-selection-continuation-promotion-032
assert.deepEqual(controller.constructor.name.split("Controller"), ["SchemaGuidedValidation", ""],
  "the direct guided-validation owner retains its controller identity");
// retired-schema-assertion: guided-selection-continuation-promotion-038
assert.match(controller.constructor.name, /GuidedValidationController/,
  "the direct guided-validation owner is not an aggregate installed controller");
