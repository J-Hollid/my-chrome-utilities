import assert from "node:assert/strict";
import {
  addExpectedArrayItem,
  createExpectedPayloadDraft,
  duplicateExpectedArrayItem,
  expectedPayloadComplete,
  expectedPayloadFields,
  expectedPayloadPresentation,
  expectedPropertyChoices,
  expectedPropertyPresentation,
  missingEventActualPresentation,
  reconcileMissingEventJourney,
  reconcileMissingEventJourneyWithReview,
  removeExpectedArrayItem,
  setExpectedPayloadValue,
} from "../dist/data-layer-unified-defect-builder.js";

const schema={id:"schema:checkout",name:"Checkout purchase",version:4,document:{type:"object",required:["order_id","currency"],properties:{order_id:{type:"string"},currency:{type:"string"},coupon:{type:"string"}}},assignments:[],attachedRules:[{id:"currency-values",name:"Currencies",version:1,propertyPath:"/currency",operator:"allowed-values",allowedValues:["EUR","USD"]}]};
const choices=expectedPropertyChoices(schema);
assert.deepEqual(choices,[
  {property:"order_id",pointer:"/order_id",required:true,type:"string",constraint:"required string",schemaValues:[]},
  {property:"currency",pointer:"/currency",required:true,type:"string",constraint:"one of EUR or USD",schemaValues:["EUR","USD"]},
  {property:"coupon",pointer:"/coupon",required:false,type:"string",constraint:"optional string",schemaValues:[]},
]);
assert.deepEqual(expectedPropertyPresentation(choices[1],{method:"generic"}),{text:"currency is EUR OR USD",source:"schema constraint"});
assert.deepEqual(expectedPropertyPresentation(choices[1],{method:"schema-value",value:"EUR"}),{text:"currency is EUR",source:"schema-provided value"});
assert.deepEqual(expectedPropertyPresentation(choices[0],{method:"custom",value:"A-123"}),{text:"order_id is A-123",source:"operator custom response"});
assert.throws(()=>expectedPropertyPresentation(choices[1],{method:"schema-value",value:"GBP"}),/schema-provided value/i);
assert.deepEqual(schema.document.properties.currency,{type:"string"});

assert.equal(missingEventActualPresentation({eventName:"purchase",sourceId:"event-history",pathname:"/checkout",visitId:"checkout"}),"No matching purchase event was pushed or observed in event-history during the selected /checkout page visit.");

const recursiveSchema={
  id:"schema:pageview",name:"Generic pageview",version:4,
  document:{type:"object",required:["page_name","products"],properties:{
    page_name:{type:"string"},
    products:{type:"array",items:{type:"object",required:["id","name"],properties:{id:{type:"number"},name:{type:"string"}}}},
    logged_in:{type:"boolean"},
  }},
  assignments:[],
  attachedRules:[
    {id:"page-name",version:1,propertyPath:"/page_name",operator:"allowed-values",allowedValues:["home","test"]},
    {id:"product-name",version:1,propertyPath:"/products/*/name",operator:"allowed-values",allowedValues:["robot","vehicle"]},
    {id:"logged-in",version:1,propertyPath:"/logged_in",operator:"allowed-values",allowedValues:[true,false]},
  ],
};
assert.deepEqual(expectedPayloadFields(recursiveSchema).map(({path,pointer,type,required,schemaValues})=>({path,pointer,type,required,schemaValues})),[
  {path:"page_name",pointer:"/page_name",type:"string",required:true,schemaValues:["home","test"]},
  {path:"products",pointer:"/products",type:"array",required:true,schemaValues:[]},
  {path:"products.0",pointer:"/products/0",type:"object",required:true,schemaValues:[]},
  {path:"products.0.id",pointer:"/products/0/id",type:"number",required:true,schemaValues:[]},
  {path:"products.0.name",pointer:"/products/0/name",type:"string",required:true,schemaValues:["robot","vehicle"]},
  {path:"logged_in",pointer:"/logged_in",type:"boolean",required:false,schemaValues:[true,false]},
]);
let payloadDraft=createExpectedPayloadDraft(recursiveSchema);
assert.deepEqual(payloadDraft.payload,{products:[]});
assert.equal(expectedPayloadComplete(recursiveSchema,payloadDraft),false);
payloadDraft=setExpectedPayloadValue(recursiveSchema,payloadDraft,"/page_name",{method:"schema-value",value:"test"});
payloadDraft=addExpectedArrayItem(recursiveSchema,payloadDraft,"/products");
payloadDraft=setExpectedPayloadValue(recursiveSchema,payloadDraft,"/products/0/id",{method:"custom",value:"1"});
payloadDraft=setExpectedPayloadValue(recursiveSchema,payloadDraft,"/products/0/name",{method:"custom",value:"robot"});
assert.deepEqual(payloadDraft.payload,{page_name:"test",products:[{id:1,name:"robot"}]});
assert.deepEqual(payloadDraft.responseSources,{"/page_name":"schema-provided value","/products/0/id":"operator custom response","/products/0/name":"operator custom response"});
assert.equal(expectedPayloadComplete(recursiveSchema,payloadDraft),true);
assert.equal(expectedPayloadPresentation("pageview",payloadDraft.payload),'pageview is fired with {"page_name":"test","products":[{"id":1,"name":"robot"}]}');
payloadDraft=addExpectedArrayItem(recursiveSchema,payloadDraft,"/products");
payloadDraft=setExpectedPayloadValue(recursiveSchema,payloadDraft,"/products/1/id",{method:"custom",value:"2"});
payloadDraft=setExpectedPayloadValue(recursiveSchema,payloadDraft,"/products/1/name",{method:"schema-value",value:"vehicle"});
payloadDraft=duplicateExpectedArrayItem(recursiveSchema,payloadDraft,"/products",0);
assert.deepEqual(payloadDraft.payload.products,[{id:1,name:"robot"},{id:1,name:"robot"},{id:2,name:"vehicle"}]);
assert.equal(payloadDraft.responseSources["/products/1/name"],"operator custom response");
assert.equal(payloadDraft.responseSources["/products/2/name"],"schema-provided value");
payloadDraft=removeExpectedArrayItem(recursiveSchema,payloadDraft,"/products",1);
assert.equal(payloadDraft.responseSources["/products/0/id"],"operator custom response");
assert.equal(payloadDraft.responseSources["/products/0/name"],"operator custom response");
assert.equal(payloadDraft.responseSources["/products/1/name"],"schema-provided value");
payloadDraft=setExpectedPayloadValue(recursiveSchema,payloadDraft,"/logged_in",{method:"schema-value",value:false});
assert.equal(payloadDraft.payload.logged_in,false);
assert.equal(expectedPayloadComplete(recursiveSchema,payloadDraft),true);

const optionalArraySchema={
  id:"schema:optional-array",name:"Optional array",version:1,
  document:{type:"object",properties:{tags:{type:"array",items:{type:"string"}}}},
  assignments:[],attachedRules:[],
};
let optionalArrayDraft=createExpectedPayloadDraft(optionalArraySchema);
assert.deepEqual(optionalArrayDraft.payload,{});
optionalArrayDraft=addExpectedArrayItem(optionalArraySchema,optionalArrayDraft,"/tags");
optionalArrayDraft=setExpectedPayloadValue(optionalArraySchema,optionalArrayDraft,"/tags/0",{method:"custom",value:"reviewed"});
assert.deepEqual(optionalArrayDraft.payload,{tags:["reviewed"]});

const visits=[{id:"products",pathname:"/products"},{id:"checkout",pathname:"/checkout"},{id:"confirmation",pathname:"/confirmation"}];
const initial=reconcileMissingEventJourney(visits,"products","checkout",[],{eventName:"purchase",sourceId:"event-history"});
assert.deepEqual(initial.map(({kind,text})=>[kind,text]),[["pathname","1. Visit /products"],["pathname","2. Visit /checkout"],["assertion","3. Expect purchase to be pushed to event-history during /checkout"]]);
const withManual=[initial[0],{kind:"manual",id:"manual-1",visitId:"products",pathname:"/products",text:"2. Click Checkout",template:{kind:"click",componentName:"Checkout"}},initial[1],initial[2]];
const changed=reconcileMissingEventJourney(visits,"products","confirmation",withManual,{eventName:"purchase",sourceId:"event-history"});
assert.deepEqual(changed.map(({kind,text})=>[kind,text]),[["pathname","1. Visit /products"],["manual","2. Click Checkout"],["pathname","3. Visit /checkout"],["pathname","4. Visit /confirmation"],["assertion","5. Expect purchase to be pushed to event-history during /confirmation"]]);
const narrowed=reconcileMissingEventJourneyWithReview(visits,"checkout","checkout",withManual,{eventName:"purchase",sourceId:"event-history"});
assert.deepEqual(narrowed.journey.map(({kind,text})=>[kind,text]),[["pathname","1. Visit /checkout"],["assertion","2. Expect purchase to be pushed to event-history during /checkout"]]);
assert.deepEqual(narrowed.review.map(({kind,text})=>[kind,text]),[["manual","2. Click Checkout"]]);
const sameVisitPrevious=[{kind:"pathname",visitId:"checkout",pathname:"/checkout",text:"1. Visit /checkout"},{kind:"manual",id:"manual-2",visitId:"checkout",pathname:"/checkout",text:"2. Apply coupon",template:{kind:"custom",text:"Apply coupon"}}];
assert.deepEqual(reconcileMissingEventJourney(visits,"checkout","checkout",sameVisitPrevious,{eventName:"purchase",sourceId:"event-history"}).map(({kind,text})=>[kind,text]),[["pathname","1. Visit /checkout"],["manual","2. Apply coupon"],["assertion","3. Expect purchase to be pushed to event-history during /checkout"]]);

console.log("data-layer unified defect builder tests passed");
