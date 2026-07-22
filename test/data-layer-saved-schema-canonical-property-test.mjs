import assert from "node:assert/strict";
import {canonicalPropertyPath} from "../dist/data-layer-canonical-schema.js";
import {savedSchemaCanonicalDocument} from "../dist/data-layer-saved-schema-canonical.js";

let seed=0x5a9ed123;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/0x100000000;};
const cases=[
  {type:"string",values:["News","Guide"]},
  {type:"number",values:[1.5,42]},
  {type:"integer",values:[1,42]},
  {type:"boolean",values:[true,false]},
];

for(let sample=0;sample<128;sample+=1){
  const selected=cases[Math.floor(random()*cases.length)],schema={
    id:`schema:property-${sample}`,name:`Property ${sample}`,version:1+Math.floor(random()*20),
    document:{type:"object",properties:{exact:{type:selected.type},allowed:{type:selected.type},conditional:{type:selected.type}}},
    attachedRules:[
      {id:`rule:exact-${sample}`,name:"Exact source",version:3,propertyPath:"/exact",operator:"exact-value",parameters:String(selected.values[0]),severity:"warning",message:"Exact message"},
      {id:`rule:allowed-${sample}`,name:"Allowed source",version:5,propertyPath:"/allowed",operator:"allowed-values",parameters:selected.values.map(String).join(","),severity:"warning",message:"Allowed message"},
      {id:`rule:conditional-${sample}`,name:"Conditional source",version:7,propertyPath:"/conditional",operator:"exact-value",parameters:String(selected.values[0]),conditionGroup:{operator:"All",predicates:[{propertyPath:"/allowed",operator:"Exists"}]},severity:"warning",message:"Conditional message"},
    ],
    documentation:{properties:{"/exact":{displayName:"Exact",description:"Exact description",comments:"Exact comments"}}},
  },before=JSON.stringify(schema);let sequence=0;
  const canonical=savedSchemaCanonicalDocument(schema,(kind)=>`${kind}:${sample}:${++sequence}`),byPath=Object.fromEntries(Object.values(canonical.nodes).map((node)=>[canonicalPropertyPath(canonical,node.id),node]));
  assert.equal(byPath["/exact"].expectedValue,selected.values[0],`sample ${sample} must preserve the exact value's type`);
  assert.deepEqual(byPath["/allowed"].allowedValues.map(({value})=>value),selected.values,`sample ${sample} must preserve allowed value types and order`);
  assert.equal(byPath["/conditional"].expectedValue,undefined,`sample ${sample} must not project a conditional exact value as unconditional`);
  assert.deepEqual(byPath["/exact"].documentation,{displayText:"Exact",description:"Exact description",comments:"Exact comments",example:{method:"blank"}});
  assert.deepEqual(byPath["/exact"].rules[0].provenance,{source:"saved-schema",sourceId:schema.id,revision:schema.version});
  assert.equal(JSON.stringify(schema),before,`sample ${sample} must leave the immutable source unchanged`);
}

console.log("saved-schema canonical property tests passed");
