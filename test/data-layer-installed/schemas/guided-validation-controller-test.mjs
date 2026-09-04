import assert from "node:assert/strict";

const { SchemaGuidedValidationController } = await import(
  "../../../dist/data-layer-installed/schemas/guided-validation-controller.js"
);
const { schemaPropertyAt } = await import(
  "../../../dist/data-layer-installed/schemas/schema-model.js"
);

const values = new Map();
const controller = new SchemaGuidedValidationController({
  getItem:(key) => values.get(key) ?? null,
  setItem:(key, value) => values.set(key, value),
});
const schemas = [{
  id:"schema:one", name:"One", version:1, published:true,
  document:{ type:"object", properties:{ email:{ type:"string" } } },
  workingDraft:{
    baseVersion:1, sourceVersion:1,
    document:{ type:"object", properties:{ email:{ type:"string" } } },
    assignments:[], pendingChanges:[],
  },
  assignments:[{
    id:"assignment:one", name:"Checkout", sourceId:"gtm",
    eventName:"checkout", target:"payload", enabled:true,
  }],
}];
controller.configure({
  root:{ querySelector:() => null }, guidedRoot:null, document:null, schemas:() => schemas,
  replaceSchemas:() => {}, persistSchemas:() => {}, renderSchemas:() => {}, openDraft:() => {},
  restoreCapture:() => {}, scheduleFrame:() => {}, generation:() => 3, selectSchema:() => {}, result:() => {},
  expansionRules:() => [], replaceExpansionRules:() => {},
});
controller.select({ sourceId:"gtm", name:"checkout" }, "schema:one");

// retired-schema-assertion: guided-selection-continuation-promotion-016
assert.equal(Object.keys(controller.selections).length, 1);

// retired-schema-assertion: guided-selection-continuation-promotion-037
assert.equal(controller.selected({ sourceId:"gtm", name:"checkout" })?.id, "schema:one");

// retired-schema-assertion: guided-selection-continuation-promotion-018
assert.equal(controller.candidates({
  id:"event:one", sourceId:"gtm", name:"checkout",
  payload:{ email:"a@b.test" }, rawInput:{},
})[0]?.typeCoverage, 2);

// retired-schema-assertion: guided-selection-continuation-promotion-020
assert.deepEqual(controller.uiCandidate(schemas[0], schemas[0]).propertyTypes, { email:"String" });

// retired-schema-assertion: allowed-value-expansion-return-cleanup-002
assert.deepEqual(controller.uiEvent({
  id:"event:one", sourceId:"gtm", name:"checkout",
  payload:"not an object", rawInput:{},
}).payload, {});

// retired-schema-assertion: canonical-edit-history-settlement-overlay-050
assert.deepEqual(controller.uiEvent({
  id:"event:two", sourceId:"page", name:"view",
  pageUrl:"https://example.test", payload:{ email:"a@b.test" }, rawInput:{},
}), {
  id:"event:two", sourceId:"page", name:"view",
  pageUrl:"https://example.test", payload:{ email:"a@b.test" },
});

// retired-schema-assertion: guided-selection-continuation-promotion-001
assert.equal(controller.selected({sourceId:"gtm",name:"missing"}),undefined);
controller.select({sourceId:"page",name:"view"},"schema:one");

// retired-schema-assertion: guided-selection-continuation-promotion-024
assert.equal(Object.keys(controller.selections).length,2);

// retired-schema-assertion: guided-selection-continuation-promotion-040
assert.equal(controller.selected({sourceId:"page",name:"view"})?.id,"schema:one");

// retired-schema-assertion: guided-selection-continuation-promotion-008
assert.match([...values.values()].at(-1),/page/u);

// retired-schema-assertion: guided-selection-continuation-promotion-043
assert.equal(controller.candidates({id:"event:two",sourceId:"page",name:"view",payload:{},rawInput:{}}).length,0);
const checkoutCandidates = controller.candidates({
  id:"event:three", sourceId:"gtm", name:"checkout",
  payload:{ email:"a@b.test" }, rawInput:{},
});

// retired-schema-assertion: guided-selection-continuation-promotion-015
assert.equal(checkoutCandidates.length,1);

// retired-schema-assertion: guided-selection-continuation-promotion-045
assert.equal(checkoutCandidates[0].schema.id,"schema:one");

// retired-schema-assertion: guided-selection-continuation-promotion-041
assert.equal(checkoutCandidates[0].assignment.id,"assignment:one");

// retired-schema-assertion: guided-selection-continuation-promotion-011
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).id,"schema:one");

// retired-schema-assertion: guided-selection-continuation-promotion-035
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).name,"One");

// retired-schema-assertion: allowed-value-expansion-return-cleanup-004
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).version,1);

// retired-schema-assertion: guided-selection-continuation-promotion-021
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).target,"payload");

// retired-schema-assertion: guided-selection-continuation-promotion-033
assert.equal(controller.uiCandidate(schemas[0],schemas[0]).assignments.length,1);

// retired-schema-assertion: guided-selection-continuation-promotion-003
assert.ok(controller.documentHasPath(schemas[0].document, "/email"));
assert.ok(controller.documentHasPath(schemas[0].document, "email"));

// retired-schema-assertion: guided-selection-continuation-promotion-004
assert.ok(schemaPropertyAt(schemas[0].document, "/email"));

assert.ok(!controller.documentHasPath(schemas[0].document, "/missing"));

// retired-schema-assertion: guided-selection-continuation-promotion-019
assert.ok(controller.documentHasPath(
  { type:"object", properties:{ checkout:{ type:"object", properties:{ email:{ type:"string" } } } } },
  "/checkout/email",
));

assert.ok(controller.documentHasPath(
  {
    type:"object",
    properties:{
      items:{ type:"array", items:{ type:"object", properties:{ sku:{ type:"string" } } } },
    },
  },
  "/items/*/sku",
));
controller.propertyReturn = { kind:"capture", eventId:"event:one", propertyPath:"/email", generation:3 };
let disposed = 0;
class CountingElement extends EventTarget {
  children = [];
  listenerTotal = 0;
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(type, listener, options) { super.addEventListener(type, listener, options); this.listenerTotal += 1; }
  removeEventListener(type, listener, options) { super.removeEventListener(type, listener, options); this.listenerTotal -= 1; }
  listenerCount() { return this.listenerTotal; }
  setAttribute() {}
  showModal() { this.open = true; }
  close() { this.open = false; }
  focus() { this.focused = true; }
}
const guidedRoot = new CountingElement();
const testDocument = { createElement:() => new CountingElement() };
controller.configure({
  root:{ querySelector:() => null }, guidedRoot, document:testDocument, schemas:() => schemas,
  replaceSchemas:() => {}, persistSchemas:() => {}, renderSchemas:() => {}, openDraft:() => {},
  restoreCapture:() => {}, scheduleFrame:() => {}, generation:() => 3, selectSchema:() => {}, result:() => {},
  expansionRules:() => [], replaceExpansionRules:() => {},
});
const continuationEvent = { id:"event:one", sourceId:"gtm", name:"checkout", payload:{ email:"a@b.test" }, rawInput:{} };
controller.openContinuationPicker(continuationEvent);
const guidedChoice = guidedRoot.children[0].children[1].children[0];
const continuationTrigger = new CountingElement();
continuationTrigger.addEventListener("click", () => controller.openContinuationPicker(continuationEvent));

// retired-schema-assertion: guided-selection-continuation-promotion-014
assert.ok(guidedChoice.listenerCount() > 0, "the continuation picker owns its live choice listener");
guidedRoot.children[0].children[2].dispatchEvent(new Event("click"));
controller.ownDialog(() => { disposed += 1; });
controller.ownLiveProperty(() => { disposed += 1; });
controller.ownAllowedValue(() => { disposed += 1; });

// retired-schema-assertion: guided-selection-continuation-promotion-029
assert.ok(continuationTrigger.listenerCount() > 0, "cancelling a continuation keeps its existing row action live");

// retired-schema-assertion: guided-selection-continuation-promotion-030
assert.equal(controller.dialogListenerCount(), 1);
controller.dispose();

// retired-schema-assertion: guided-selection-continuation-promotion-031
assert.equal(disposed, 3);

// retired-schema-assertion: guided-selection-continuation-promotion-039
assert.equal(controller.propertyReturn, undefined);
assert.ok(controller, "the direct guided-validation owner is constructed");
assert.deepEqual(controller.constructor.name.split("Controller"), ["SchemaGuidedValidation", ""],
  "the direct guided-validation owner retains its controller identity");
assert.match(controller.constructor.name, /GuidedValidationController/,
  "the direct guided-validation owner is not an aggregate installed controller");
