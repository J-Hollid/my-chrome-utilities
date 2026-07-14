import assert from "node:assert/strict";
import { expectedPropertyChoices, expectedPropertyPresentation, missingEventActualPresentation, reconcileMissingEventJourney } from "../dist/data-layer-unified-defect-builder.js";

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

assert.equal(missingEventActualPresentation({eventName:"purchase",sourceId:"event-history",pathname:"/checkout",startedAt:"2026-07-14T12:00:00Z",endedAt:"2026-07-14T12:01:00Z"}),"No matching purchase event was pushed or observed in event-history during /checkout from 2026-07-14T12:00:00Z to 2026-07-14T12:01:00Z.");

const visits=[{id:"products",pathname:"/products"},{id:"checkout",pathname:"/checkout"},{id:"confirmation",pathname:"/confirmation"}];
const initial=reconcileMissingEventJourney(visits,"products","checkout",[],{eventName:"purchase",sourceId:"event-history"});
assert.deepEqual(initial.map(({kind,text})=>[kind,text]),[["pathname","1. Visit /products"],["pathname","2. Visit /checkout"],["assertion","3. Expect purchase to be pushed to event-history during /checkout"]]);
const withManual=[initial[0],{kind:"manual",id:"manual-1",visitId:"products",pathname:"/products",text:"2. Click Checkout",template:{kind:"click",componentName:"Checkout"}},initial[1],initial[2]];
const changed=reconcileMissingEventJourney(visits,"products","confirmation",withManual,{eventName:"purchase",sourceId:"event-history"});
assert.deepEqual(changed.map(({kind,text})=>[kind,text]),[["pathname","1. Visit /products"],["manual","2. Click Checkout"],["pathname","3. Visit /checkout"],["pathname","4. Visit /confirmation"],["assertion","5. Expect purchase to be pushed to event-history during /confirmation"]]);

console.log("data-layer unified defect builder tests passed");
