import assert from "node:assert/strict";
import { createSchemaLibraryFakeDocument } from "../../support/schema-library-fake-dom.mjs";

const { SchemaValidationController } = await import(
  "../../../dist/data-layer-installed/schemas/validation-controller.js"
);

const values = new Map();
const controller = new SchemaValidationController({
  getItem:(key) => values.get(key) ?? null,
  setItem:(key, value) => values.set(key, value),
});
controller.addRecord({ eventId:"event:one", eventName:"checkout", state:"Valid", checkedAt:"now", issueCodes:[] });
controller.setManualOverride("event:one", "schema:one");

assert.equal(controller.records, undefined, "validation records are not public mutable state");
assert.equal(controller.manualOverrides, undefined, "manual overrides are not public mutable state");
assert.equal(controller.recordsProjection().length, 1);

assert.equal(controller.manualSchemaId("event:one"), "schema:one");

assert.equal(values.size, 2, "record and manual override bytes have separate keys");

assert.equal(controller.recordsProjection()[0].eventId,"event:one");

assert.equal(controller.recordsProjection()[0].eventName,"checkout");

assert.equal(controller.recordsProjection()[0].state,"Valid");

assert.deepEqual(controller.recordsProjection()[0].issueCodes,[]);

const recordsProjection=controller.recordsProjection();
recordsProjection[0].eventId="event:caller-write";
const overridesProjection=controller.manualOverridesProjection();
overridesProjection["event:one"]="schema:caller-write";
assert.equal(controller.recordsProjection()[0].eventId,"event:one",
  "callers cannot mutate validation records through their projection");
assert.equal(controller.manualSchemaId("event:one"),"schema:one",
  "callers cannot mutate manual overrides through their projection");
controller.setManualOverride("event:one",undefined);

assert.equal(controller.manualSchemaId("event:one"),undefined);

assert.match([...values.values()].find((value)=>value.includes("checkout")),/Valid/u);
controller.replaceRecords(Array.from({length:55},(_,index)=>({eventId:`event:${index}`,eventName:`event-${index}`,state:"Not checked",checkedAt:"now",issueCodes:[]})));

assert.equal(controller.recordsProjection().length,50);

assert.equal(controller.recordsProjection()[0].eventId,"event:5");

assert.equal(controller.recordsProjection().at(-1).eventId,"event:54");
const projected=controller.recheck([]);
assert.deepEqual(projected,[]);
assert.equal(controller.recordsProjection().length,50);
controller.addRecord({eventId:"event:last",eventName:"last",state:"Invalid",checkedAt:"later",issueCodes:["required"]});
assert.equal(controller.recordsProjection().length,50);
assert.equal(controller.recordsProjection().at(-1).eventId,"event:last");

assert.deepEqual(controller.recordsProjection().at(-1).issueCodes,["required"]);
let disposed = 0;
controller.ownRow(() => { disposed += 1; });
controller.ownDialog(() => { disposed += 1; });
controller.dispose();
assert.equal(disposed, 2);

const {document,element}=createSchemaLibraryFakeDocument();
const validationList=element(),guidedRoot=element(),validationResult=element();
const guidedCapture={id:"capture:checkout",sourceId:"gtm",name:"checkout",payload:{checkout:{email:"buyer@example.test"}},rawInput:{}};
const validationSchema={id:"schema:checkout",name:"Checkout",version:1,document:{type:"object",properties:{checkout:{type:"object",
  properties:{email:{type:"string"}}}}},assignments:[{id:"assignment:checkout",name:"Checkout assignment",sourceId:"gtm",eventName:"checkout",
  target:"payload",enabled:true}]};
let continuationPreparation,continuationCommit,preparationFailure;
const uiController=new SchemaValidationController({getItem:()=>null,setItem(){}},{list:validationList,issues:element(),result:validationResult,
  guidedRoot,document,schemas:()=>[validationSchema],generation:()=>5,isCurrent:(generation)=>generation===5,
  prepare:async(record)=>{continuationPreparation=record;if(preparationFailure)throw preparationFailure;return{
    summary:"Checkout is valid",review:"Review captured evidence",suggestedName:"Checkout captured validation",
    events:[{id:"event:checkout",name:"Checkout event"}],pages:[],flowSteps:[],profiles:[{id:"profile:checkout",name:"Checkout"}],
    commit:async(input)=>{continuationCommit=input;return{entityName:"Checkout profile"};},
  };}});
const validationRecords=uiController.recheck([guidedCapture]);

// retired-schema-assertion: guided-selection-continuation-promotion-022
assert.equal(validationRecords.length,1);

// retired-schema-assertion: guided-selection-continuation-promotion-023
assert.equal(validationList.children.length,1);

// retired-schema-assertion: guided-selection-continuation-promotion-024
assert.equal(validationList.children[0].children[1].disabled,true,
  "ordinary validation results cannot continue without canonical evaluator evidence");
uiController.addRecord({eventId:guidedCapture.id,eventName:"checkout",state:"Valid",checkedAt:"now",schemaId:validationSchema.id,
  schemaName:validationSchema.name,schemaVersion:1,target:"payload",assignmentId:"assignment:checkout",assignmentName:"Checkout assignment",
  assignmentEvidence:"canonical winner",issueCodes:[],evaluated:{resultIdentity:"evaluation:checkout:1",
    winner:{schemaId:validationSchema.id,schemaRevision:1},issueDetails:[]}});
uiController.render();
const continuationTrigger=validationList.children[1].children[1];
continuationTrigger.click();
await Promise.resolve();

// retired-schema-assertion: guided-selection-continuation-promotion-025
assert.equal(continuationPreparation.eventId,guidedCapture.id);
let continuationDialog=guidedRoot.children[0];

// retired-schema-assertion: guided-selection-continuation-promotion-026
assert.equal(continuationDialog.children[0].textContent,"Continue captured validation in project");

// retired-schema-assertion: guided-selection-continuation-promotion-027
assert.equal(continuationDialog.children[4].children[0].children[0].textContent,"Event validation Test case");

// retired-schema-assertion: guided-selection-continuation-promotion-028
assert.equal(continuationDialog.children[9].textContent,"Create Test case and open in Specification Studio");
continuationDialog.children[10].click();

// retired-schema-assertion: guided-selection-continuation-promotion-029
assert.ok(continuationTrigger.listenerCount()>0,"cancelling a continuation keeps its existing row action live");

// retired-schema-assertion: guided-selection-continuation-promotion-030
assert.equal(continuationTrigger.focused,true);
continuationTrigger.focused=false;
continuationTrigger.click();
await Promise.resolve();
continuationDialog=guidedRoot.children[0];
const continuationDestination=continuationDialog.children[4].children[0];
const continuationProfile=continuationDialog.children[8].children[0];
const continuationConfirm=continuationDialog.children[9];
continuationDestination.value="profile";
continuationDestination.dispatch("change");

// retired-schema-assertion: guided-selection-continuation-promotion-031
assert.equal(continuationConfirm.textContent,"Add requirements and open Profile");
continuationProfile.value="profile:checkout";
continuationConfirm.click();
await Promise.resolve();
await Promise.resolve();

// retired-schema-assertion: guided-selection-continuation-promotion-032
assert.deepEqual(continuationCommit,{destination:"profile",name:"Checkout captured validation",eventId:"event:checkout",profileId:"profile:checkout"});

// retired-schema-assertion: guided-selection-continuation-promotion-033
assert.equal(validationResult.textContent,"Saved evaluated capture evidence in Checkout profile; opening it in Specification Studio.");

// retired-schema-assertion: guided-selection-continuation-promotion-034
assert.equal(continuationTrigger.focused,false);

// retired-schema-assertion: guided-selection-continuation-promotion-035
assert.equal(continuationConfirm.listenerCount(),0);
preparationFailure=new Error("Create or open a Specification Project before continuing captured validation.");
continuationTrigger.click();
await Promise.resolve();

// retired-schema-assertion: guided-selection-continuation-promotion-036
assert.equal(validationResult.textContent,"Create or open a Specification Project before continuing captured validation.");
