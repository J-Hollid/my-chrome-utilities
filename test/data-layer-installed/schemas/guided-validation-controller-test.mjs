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
assert.equal(Object.keys(controller.selections).length, 1);
assert.equal(controller.selected({ sourceId:"gtm", name:"checkout" })?.id, "schema:one");
assert.equal(controller.candidates({ id:"event:one", sourceId:"gtm", name:"checkout", payload:{ email:"a@b.test" }, rawInput:{} })[0]?.typeCoverage, 2);
assert.deepEqual(controller.uiCandidate(schemas[0], schemas[0]).propertyTypes, { email:"String" });
assert.deepEqual(controller.uiEvent({ id:"event:one", sourceId:"gtm", name:"checkout", payload:"not an object", rawInput:{} }).payload, {});
assert.deepEqual(controller.uiEvent({ id:"event:two", sourceId:"page", name:"view", pageUrl:"https://example.test", payload:{email:"a@b.test"}, rawInput:{} }),
  {id:"event:two",sourceId:"page",name:"view",pageUrl:"https://example.test",payload:{email:"a@b.test"}});
assert.equal(controller.selected({sourceId:"gtm",name:"missing"}),undefined);
controller.select({sourceId:"page",name:"view"},"schema:one");
assert.equal(Object.keys(controller.selections).length,2);
assert.equal(controller.selected({sourceId:"page",name:"view"})?.id,"schema:one");
assert.match([...values.values()].at(-1),/page/u);
assert.equal(controller.candidates({id:"event:two",sourceId:"page",name:"view",payload:{},rawInput:{}}).length,0);
assert.equal(controller.candidates({id:"event:three",sourceId:"gtm",name:"checkout",payload:{email:"a@b.test"},rawInput:{}}).length,1);
assert.equal(controller.candidates({id:"event:three",sourceId:"gtm",name:"checkout",payload:{email:"a@b.test"},rawInput:{}})[0].schema.id,"schema:one");
assert.equal(controller.candidates({id:"event:three",sourceId:"gtm",name:"checkout",payload:{email:"a@b.test"},rawInput:{}})[0].assignment.id,"assignment:one");
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).id,"schema:one");
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).name,"One");
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).version,1);
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).target,"payload");
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).assignments.length,1);
assert.equal(controller.documentHasPath(schemas[0].document,"/email"),true);
assert.equal(controller.documentHasPath(schemas[0].document,"email"),true);
assert.equal(controller.documentHasPath(schemas[0].document,"/missing"),false);
assert.equal(controller.documentHasPath({type:"object",properties:{checkout:{type:"object",properties:{email:{type:"string"}}}}},"/checkout/email"),true);
assert.equal(controller.documentHasPath({type:"object",properties:{items:{type:"array",items:{type:"object",properties:{sku:{type:"string"}}}}}},"/items/*/sku"),true);
controller.propertyReturn = { kind:"capture", eventId:"event:one", propertyPath:"/email", generation:3 };
let disposed = 0;
controller.ownDialog(() => { disposed += 1; });
controller.ownLiveProperty(() => { disposed += 1; });
controller.ownAllowedValue(() => { disposed += 1; });
assert.equal(controller.dialogListenerCount(), 1);
controller.dispose();
assert.equal(disposed, 3);
assert.equal(controller.propertyReturn, undefined);
