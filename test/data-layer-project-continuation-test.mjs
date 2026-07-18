import assert from "node:assert/strict";
import {
  adoptSavedSchema,
  commitSavedSchemaSynchronization,
  capturedValidationDestinationChoices,
  createFixtureFromCapturedValidation,
  createSpecificationProject,
  stageSavedSchemaSynchronization,
  transactProject,
} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}-${++sequence}`;
let state=createSpecificationProject({name:"Retail and Trade",site:"shop.example",id});
const saved={id:"schema:purchase",name:"Purchase",version:3,published:true,document:{type:"object",properties:{currency:{type:"string",enum:["EUR"]},order_id:{type:"string"}}},assignments:[]};

state=adoptSavedSchema(state,saved);
let adopted=state.project.collections.schemaDrafts[0];
assert.equal(adopted.id,saved.id);
assert.deepEqual(adopted.sourceLineage,{librarySchemaId:saved.id,adoptedRevision:3,synchronizedRevision:3});
assert.deepEqual(adopted.workingDraft.document,saved.document);
assert.notEqual(adopted.workingDraft.document,saved.document,"adoption must own an independent canonical draft");
assert.throws(()=>adoptSavedSchema(state,saved),/already adopted/);

state=transactProject(state,"Project override",(project)=>({...project,collections:{...project.collections,schemaDrafts:project.collections.schemaDrafts.map((schema)=>schema.id===saved.id?{...schema,workingDraft:{...schema.workingDraft,document:{...schema.workingDraft.document,properties:{...schema.workingDraft.document.properties,currency:{type:"string",enum:["EUR","GBP"]}}}}}:schema)}}));
const revision4={...saved,version:4,document:{type:"object",properties:{currency:{type:"string",enum:["EUR","USD"]},order_id:{type:"string"},value:{type:"number"}}}};
const review=stageSavedSchemaSynchronization(state,revision4);
assert.equal(review.fromRevision,3);
assert.equal(review.toRevision,4);
assert.ok(review.changes.some(({path})=>path==="/properties/value"));
assert.ok(review.localOverrides.some((path)=>path.startsWith("/properties/currency")));
state=commitSavedSchemaSynchronization(state,review);
adopted=state.project.collections.schemaDrafts[0];
assert.deepEqual(adopted.workingDraft.document.properties.currency.enum,["EUR","GBP"]);
assert.equal(adopted.workingDraft.document.properties.value.type,"number");
assert.equal(adopted.sourceLineage.synchronizedRevision,4);

state=transactProject(state,"Named destinations",(project)=>({...project,collections:{...project.collections,events:[{id:"event:purchase",name:"Purchase",eventName:"purchase",sourceId:"event-history"}],pages:[{id:"page:confirmation",name:"Checkout confirmation"}],flows:[{id:"flow:retail",name:"Retail checkout",steps:[{id:"step:confirmation",name:"Confirmation"}]}],profiles:[{id:"profile:retail",name:"Retail",requirements:[]}]}}));
const choices=capturedValidationDestinationChoices(state.project,{eventName:"purchase",sourceId:"event-history"});
assert.deepEqual(choices.events,[{id:"event:purchase",name:"Purchase"}]);
assert.deepEqual(choices.pages,[{id:"page:confirmation",name:"Checkout confirmation"}]);
assert.deepEqual(choices.flowSteps,[{id:"step:confirmation",name:"Retail checkout / Confirmation"}]);
assert.deepEqual(choices.profiles,[{id:"profile:retail",name:"Retail"}]);
assert.equal(choices.suggestedFixtureName,"Purchase captured validation");

state=createFixtureFromCapturedValidation(state,{name:"Captured purchase proves schema",captureId:"capture-17",sourceId:"event-history",eventName:"purchase",payload:{currency:"EUR",order_id:"o-1",value:12},schemaId:saved.id,expected:{status:"pass",issueCodes:[]}},id);
const fixture=state.project.collections.fixtures[0];
assert.equal(fixture.assertions.length,2);
assert.deepEqual(fixture.provenance,{kind:"captured-validation",captureId:"capture-17"});
assert.equal(fixture.observations[0].eventName,"purchase");

console.log("saved-schema and captured-validation continuation tests passed");
