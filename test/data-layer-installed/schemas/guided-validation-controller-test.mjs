import assert from "node:assert/strict";

const { SchemaGuidedValidationController } = await import(
  "../../../dist/data-layer-installed/schemas/guided-validation-controller.js"
);
const { SchemaGuidedInstalledWorkflow } = await import(
  "../../../dist/data-layer-installed/schemas/guided-installed-workflow.js"
);
const { schemaPropertyAt } = await import(
  "../../../dist/data-layer-installed/schemas/schema-model.js"
);

const values = new Map();
const controller = new SchemaGuidedValidationController({
  getItem:(key) => values.get(key) ?? null,
  setItem:(key, value) => values.set(key, value),
});
let schemas = [{
  id:"schema:page", name:"One", version:1, published:true,
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
const restoredGuidedCaptures=[];
controller.configure({
  root:{ querySelector:() => null }, guidedRoot:null, document:null, schemas:() => schemas,
  replaceSchemas:() => {}, persistSchemas:() => {}, renderSchemas:() => {}, openDraft:() => {},
  restoreCapture:(eventId,path) => restoredGuidedCaptures.push([eventId,path]), scheduleFrame:() => {}, generation:() => 3, selectSchema:() => {}, result:() => {},
  expansionRules:() => [], replaceExpansionRules:() => {},
});
controller.select({ sourceId:"gtm", name:"checkout" }, "schema:page");

const selectionProjection=controller.selectionState();
assert.equal(Object.keys(selectionProjection).length, 1);
selectionProjection["gtm:checkout"]="schema:caller-write";
assert.equal(controller.selected({ sourceId:"gtm", name:"checkout" })?.id,"schema:page",
  "callers cannot mutate guided selections through the projection");
assert.equal(controller.selections,undefined,"guided selections are not public mutable state");

assert.equal(controller.selected({ sourceId:"gtm", name:"checkout" })?.id, "schema:page");

assert.equal(controller.candidates({
  id:"event:one", sourceId:"gtm", name:"checkout",
  payload:{ email:"a@b.test" }, rawInput:{},
})[0]?.typeCoverage, 2);

assert.deepEqual(controller.uiCandidate(schemas[0], schemas[0]).propertyTypes, { email:"String" });

assert.deepEqual(controller.uiEvent({
  id:"event:one", sourceId:"gtm", name:"checkout",
  payload:"not an object", rawInput:{},
}).payload, {});

assert.deepEqual(controller.uiEvent({
  id:"event:two", sourceId:"page", name:"view",
  pageUrl:"https://example.test", payload:{ email:"a@b.test" }, rawInput:{},
}), {
  id:"event:two", sourceId:"page", name:"view",
  pageUrl:"https://example.test", payload:{ email:"a@b.test" },
});

// retired-schema-assertion: guided-selection-continuation-promotion-001
assert.equal(controller.selected({sourceId:"gtm",name:"missing"}),undefined);
controller.select({sourceId:"page",name:"view"},"schema:page");

assert.equal(Object.keys(controller.selectionState()).length,2);

assert.equal(controller.selected({sourceId:"page",name:"view"})?.id,"schema:page");

// retired-schema-assertion: guided-selection-continuation-promotion-008
assert.match(values.get("my-chrome-utilities.guided-validation-continuations.v1"),/schema:page/u);

assert.equal(controller.candidates({id:"event:two",sourceId:"page",name:"view",payload:{},rawInput:{}}).length,0);
const checkoutCandidates = controller.candidates({
  id:"event:three", sourceId:"gtm", name:"checkout",
  payload:{ email:"a@b.test" }, rawInput:{},
});

assert.equal(checkoutCandidates.length,1);

assert.equal(checkoutCandidates[0].schema.id,"schema:page");

assert.equal(checkoutCandidates[0].assignment.id,"assignment:one");

assert.equal(controller.uiCandidate(schemas[0],schemas[0]).id,"schema:page");

assert.equal(controller.uiCandidate(schemas[0],schemas[0]).name,"One");

assert.equal(controller.uiCandidate(schemas[0],schemas[0]).version,1);

assert.equal(controller.uiCandidate(schemas[0],schemas[0]).target,"payload");

assert.equal(controller.uiCandidate(schemas[0],schemas[0]).assignments.length,1);

const schemaPaths=["/email"].filter((path)=>controller.documentHasPath(schemas[0].document,path));
// retired-schema-assertion: guided-selection-continuation-promotion-003
assert.ok(schemaPaths.length>0);
assert.ok(controller.documentHasPath(schemas[0].document, "email"));

// retired-schema-assertion: guided-selection-continuation-promotion-004
assert.ok(schemaPropertyAt(schemas[0].document, "/email"));

assert.ok(!controller.documentHasPath(schemas[0].document, "/missing"));

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
const unboundGuidedCapture={id:"event:unbound"};
controller.setPropertyReturn({ kind:"capture", eventId:unboundGuidedCapture.id, propertyPath:"/page_type", generation:3 });
const propertyReturnProjection=controller.propertyReturn();
propertyReturnProjection.propertyPath="/caller-write";
assert.equal(controller.propertyReturn().propertyPath,"/page_type",
  "callers cannot mutate the guided return owner through its projection");
assert.equal(controller.consumePropertyReturn({generation:2,kind:"capture"}),undefined,
  "a stale caller cannot consume the guided return");
assert.equal(controller.hasPropertyReturn(),true);
controller.restorePropertyReturn();

// retired-schema-assertion: guided-selection-continuation-promotion-002
assert.deepEqual(restoredGuidedCaptures.at(-1),[unboundGuidedCapture.id,"/page_type"]);
controller.setPropertyReturn({kind:"capture",eventId:"event:clear",propertyPath:"/clear",generation:3});
controller.clearPropertyReturn();
assert.equal(controller.hasPropertyReturn(),false,"the owner clears a guided return through its command");
let disposed = 0;
class CountingElement extends EventTarget {
  children = [];
  dataset = {};
  listenerTotal = 0;
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(type, listener, options) { super.addEventListener(type, listener, options); this.listenerTotal += 1; }
  removeEventListener(type, listener, options) { super.removeEventListener(type, listener, options); this.listenerTotal -= 1; }
  listenerCount() { return this.listenerTotal; }
  setAttribute(name,value) { this[name]=value; }
  removeAttribute(name) { delete this[name]; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  focus() { this.focused = true; }
  remove() { this.removed = true; }
  querySelector(selector) {
    if (selector === 'input[name="allowed-value-expansion-destination"]:checked')
      return this.#find((child) => child.name === "allowed-value-expansion-destination" && child.checked);
    if (selector.startsWith("#")) return this.#find((child) => child.id === selector.slice(1));
    return undefined;
  }
  querySelectorAll() { return []; }
  #find(predicate) {
    for (const child of this.children) {
      if (predicate(child)) return child;
      const nested = child instanceof CountingElement ? child.#find(predicate) : undefined;
      if (nested) return nested;
    }
  }
}
const guidedRoot = new CountingElement();
const testDocument = { createElement:() => new CountingElement() };
controller.configure({
  root:{ querySelector:() => null }, guidedRoot, document:testDocument, schemas:() => schemas,
  replaceSchemas:(next) => { schemas=structuredClone(next); }, persistSchemas:() => {}, renderSchemas:() => {}, openDraft:() => {},
  restoreCapture:(eventId,path) => restoredGuidedCaptures.push([eventId,path]), scheduleFrame:(run) => run(), generation:() => 3,
  selectSchema:() => {}, result:() => {},
  expansionRules:() => [], replaceExpansionRules:() => {},
});
const guidedCapture={id:"event:one",sourceId:"gtm",name:"checkout",
  payload:{email:"a@b.test",checkout:{email:"buyer@example.test"}},rawInput:{}};
let activeSchemaId;
const guidedWorkflow=new SchemaGuidedInstalledWorkflow({controller,root:guidedRoot,schemas:()=>schemas,generation:()=>3,
  result:null,restoreCapture:(eventId,path)=>restoredGuidedCaptures.push([eventId,path]),openDraft(schema){activeSchemaId=schema.id;},openRevisionReview(){},
  flowFactory(){return {open(){},openProperty(){},close(){},currentDraft(){return undefined;}};}});
assert.equal(guidedWorkflow.flow,undefined,"the mutable guided flow is private");
await guidedWorkflow.openProperty(guidedCapture,schemas[0],"checkout.email");
const persistenceSchemaId=schemas[0].id;

// retired-schema-assertion: guided-selection-continuation-promotion-006
assert.equal(guidedRoot.dataset.eventId,guidedCapture.id);

// retired-schema-assertion: guided-selection-continuation-promotion-007
assert.equal(controller.selected(guidedCapture).id,persistenceSchemaId,
  "the Schema-owned guided flow retains the selected continuation draft");

// retired-schema-assertion: guided-selection-continuation-promotion-009
assert.equal(guidedWorkflow.continuation(guidedCapture).schemaId,persistenceSchemaId,
  "guided continuation remains bound to the selected working draft");
guidedWorkflow.continuation(guidedCapture).review();

// retired-schema-assertion: guided-selection-continuation-promotion-010
assert.equal(activeSchemaId,persistenceSchemaId);
controller.openContinuationPicker(guidedCapture);
const guidedPicker=guidedRoot.children[0];

// retired-schema-assertion: guided-selection-continuation-promotion-011
assert.equal(guidedPicker.id,"guided-continuation-schema-picker");

// retired-schema-assertion: guided-selection-continuation-promotion-012
assert.equal(guidedPicker.children[0].id,"guided-continuation-schema-picker-heading");

// retired-schema-assertion: guided-selection-continuation-promotion-013
assert.equal(guidedPicker["aria-labelledby"],"guided-continuation-schema-picker-heading");
const guidedChoice = guidedRoot.children[0].children[1].children[0];
const continuationTrigger = new CountingElement();
continuationTrigger.addEventListener("click", () => controller.openContinuationPicker(guidedCapture));

// retired-schema-assertion: guided-selection-continuation-promotion-014
assert.ok(guidedChoice.listenerCount() > 0, "the continuation picker owns its live choice listener");
guidedRoot.children[0].children[2].dispatchEvent(new Event("click"));

// retired-schema-assertion: guided-selection-continuation-promotion-015
assert.equal(guidedRoot.children.length, 0, "cancelling removes the guided continuation picker");

// retired-schema-assertion: guided-selection-continuation-promotion-016
assert.equal(guidedChoice.listenerCount(), 0, "cancelling disposes the guided continuation choice listener immediately");
controller.openContinuationPicker(guidedCapture);
guidedRoot.children[0].children[1].children[0].dispatchEvent(new Event("click"));

// retired-schema-assertion: guided-selection-continuation-promotion-017
assert.deepEqual(restoredGuidedCaptures.at(-1),[guidedCapture.id,undefined]);
controller.ownDialog(() => { disposed += 1; });
controller.ownLiveProperty(() => { disposed += 1; });
controller.ownAllowedValue(() => { disposed += 1; });

assert.ok(continuationTrigger.listenerCount() > 0, "cancelling a continuation keeps its existing row action live");

controller.select(guidedCapture,schemas[0].id);
const declarationTrigger=new CountingElement();

// retired-schema-assertion: guided-selection-continuation-promotion-018
assert.equal(controller.openLivePropertyDeclaration(guidedCapture,"checkout.email",declarationTrigger),true);
const declarationDialog=guidedRoot.children[0];
const declarationConfirm=declarationDialog.children[3];
declarationConfirm.dispatchEvent(new Event("click"));

// retired-schema-assertion: guided-selection-continuation-promotion-019
assert.ok(controller.documentHasPath(schemas[0].workingDraft.document,"/checkout/email"),
  "the live declaration commits the observed property into the selected Schema draft");

// retired-schema-assertion: guided-selection-continuation-promotion-020
assert.deepEqual(restoredGuidedCaptures.at(-1),[guidedCapture.id,"checkout.email"]);

// retired-schema-assertion: guided-selection-continuation-promotion-042
assert.equal(restoredGuidedCaptures.at(-1)[1],"checkout.email",
  "guided completion restores the exact controller-owned property return");

// retired-schema-assertion: guided-selection-continuation-promotion-021
assert.equal(declarationConfirm.listenerCount(),0);

const expansionSchema = {
  id:"schema:expansion",name:"Expansion",version:2,published:true,
  document:{type:"object",properties:{page_type:{type:"string"}}},assignments:[],
  attachedRules:[{id:"rule:allowed",name:"Known types",version:1,propertyPath:"/page_type",
    operator:"allowed-values",parameters:"product,content"}],
  workingDraft:{baseVersion:2,sourceVersion:2,document:{type:"object",properties:{page_type:{type:"string"}}},
    assignments:[],attachedRules:[{id:"rule:allowed",name:"Known types",version:1,propertyPath:"/page_type",
      operator:"allowed-values",parameters:"product,content"}],pendingChanges:[]},
};
let expansionSchemas=[expansionSchema];
const inspector=new CountingElement();
const expansionDocument={createElement:()=>new CountingElement()};
globalThis.document=expansionDocument;
globalThis.CSS??={escape:(value)=>value};
controller.configure({
  root:{querySelector:(selector)=>selector==="#live-event-inspector"?inspector:null},guidedRoot,document:expansionDocument,
  schemas:()=>expansionSchemas,replaceSchemas:(next)=>{expansionSchemas=next;},persistSchemas(){},renderSchemas(){},openDraft(){},
  restoreCapture:(eventId,path)=>restoredGuidedCaptures.push([eventId,path]),scheduleFrame:(run)=>run(),generation:()=>3,
  selectSchema(){},result(){},expansionRules:()=>[],replaceExpansionRules(){},rules:()=>[],replaceRules(){},applyPersistence(){},beginPersistence:()=>Promise.resolve(),
});
const expansionEvidence={propertyPath:"/page_type",status:"warning",message:"Choose a known type",expected:"product,content",actual:"checkout",
  actualValue:"checkout",rule:"Known types",ruleId:"rule:allowed",ruleVersion:1,operator:"allowed-values",severity:"warning",
  schemaId:expansionSchema.id,schemaName:expansionSchema.name,schemaVersion:2};
const expansionTrigger=new CountingElement();

// retired-schema-assertion: allowed-value-expansion-return-cleanup-001
assert.equal(controller.openAllowedValueExpansion(guidedCapture.id,expansionSchema.id,expansionEvidence,expansionTrigger),true);
const expansionConfirm=inspector.querySelector("#confirm-allowed-value-expansion");
expansionConfirm.dispatchEvent(new Event("click"));

// retired-schema-assertion: allowed-value-expansion-return-cleanup-002
assert.deepEqual(expansionSchemas.find(({id})=>id===expansionSchema.id).workingDraft.attachedRules[0].allowedValues,
  ["product","content","checkout"],"allowed-value expansion persists the exact observed scalar in the Schema-owned working draft");

// retired-schema-assertion: allowed-value-expansion-return-cleanup-003
assert.deepEqual(restoredGuidedCaptures.at(-1),[guidedCapture.id,"/page_type"],"allowed-value completion returns through the Capture port");

// retired-schema-assertion: allowed-value-expansion-return-cleanup-004
assert.equal(expansionConfirm.listenerCount(),0,"allowed-value confirmation disposes its dialog listeners symmetrically");

assert.equal(controller.dialogListenerCount(), 1);
controller.openContinuationPicker({id:"event:dispose",sourceId:"gtm",name:"checkout",payload:{},rawInput:{}});
const disposalGuidedChoice=guidedRoot.children[0].children[1].children[0];
controller.openAllowedValueExpansion("event:dispose",expansionSchema.id,expansionEvidence,expansionTrigger);
const disposalExpansionConfirm=inspector.querySelector("#confirm-allowed-value-expansion");
controller.dispose();

// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-008
assert.equal(disposalGuidedChoice.listenerCount(),0,"disposal removes the guided continuation choice listener");

// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-009
assert.equal(disposalExpansionConfirm.listenerCount(),0,"disposal removes the open allowed-value dialog listeners");

assert.equal(disposed, 3);

assert.equal(controller.propertyReturn(), undefined);
assert.ok(controller, "the direct guided-validation owner is constructed");
assert.deepEqual(controller.constructor.name.split("Controller"), ["SchemaGuidedValidation", ""],
  "the direct guided-validation owner retains its controller identity");
assert.match(controller.constructor.name, /GuidedValidationController/,
  "the direct guided-validation owner is not an aggregate installed controller");
