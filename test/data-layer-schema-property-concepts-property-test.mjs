import assert from "node:assert/strict";

import {
  canonicalConceptIndex,
  canonicalJsonSchemaDocument,
  canonicalSchemaFromJsonSchema,
  createCanonicalSchema,
} from "../dist/data-layer-canonical-schema.js";

let seed=0xc0ce57;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/0x100000000);
const casing=(value)=>[value.toLowerCase(),value.toUpperCase(),value[0].toUpperCase()+value.slice(1).toLowerCase()][Math.floor(random()*3)];
const whitespace=(value)=>`${" ".repeat(Math.floor(random()*3))}${value}${" ".repeat(Math.floor(random()*3))}`;
const documentation={displayText:"",description:"",comments:"",example:{method:"blank"}};
const node=(id,name,order,concept,parentId)=>({
  id,name,order,...(parentId?{parentId}:{}),type:parentId?"string":"object",
  presence:{mode:"optional"},allowedValues:[],rules:[],documentation,
  provenance:[{source:"created"}],overrideReferences:[],...(concept?{concept}:{}),
});

for(let example=0;example<200;example+=1){
  const unique=Array.from({length:2+Math.floor(random()*7)},(_,index)=>`concept_${example}_${index}`);
  const firstSpellings=new Map(),documents=Array.from({length:2+Math.floor(random()*4)},(_,documentIndex)=>{
    const nodes={};
    for(let index=0;index<unique.length;index+=1){
      const repetitions=1+Math.floor(random()*4);
      for(let repetition=0;repetition<repetitions;repetition+=1){
        const display=whitespace(casing(unique[index]));
        if(!firstSpellings.has(unique[index]))firstSpellings.set(unique[index],display.trim());
        nodes[`${documentIndex}:${index}:${repetition}`]={concept:display};
      }
    }
    return{nodes};
  });
  const indexed=canonicalConceptIndex(documents),keys=indexed.map((value)=>value.toLocaleLowerCase());
  assert.equal(new Set(keys).size,unique.length,"normalization emits one case-insensitive suggestion per concept");
  assert.deepEqual(new Set(keys),new Set(unique),"normalization conserves every distinct concept");
  assert.deepEqual(
    Object.fromEntries(indexed.map((value)=>[value.toLocaleLowerCase(),value])),
    Object.fromEntries([...firstSpellings].map(([key,value])=>[key,value])),
    "normalization preserves the first trimmed display spelling",
  );
}

for(let example=0;example<150;example+=1){
  const rootConcept=whitespace(casing(`commerce_${example}`)),root=node(`root:${example}`,"products",0,rootConcept),child=node(`child:${example}`,"id",0,undefined,root.id),other=node(`other:${example}`,"page_name",1,whitespace(casing(`page_${example}`)));
  const document={
    ...createCanonicalSchema({id:`schema:${example}`,contributorId:`profile:${example}`,contributorName:`Profile ${example}`}),
    rootIds:[root.id,other.id],nodes:{[root.id]:root,[child.id]:child,[other.id]:other},
  };
  const exported=canonicalJsonSchemaDocument(document),roundTrip=canonicalSchemaFromJsonSchema({
    id:`round-trip:${example}`,contributorId:`copy:${example}`,contributorName:`Copy ${example}`,
    sourceIdentity:`json:${example}`,sourceRevision:example+1,document:exported,
    idFactory:(kind)=>`${kind}:${example}:${Math.floor(random()*1_000_000)}`,
  });
  const restoredRoot=Object.values(roundTrip.nodes).find(({name})=>name==="products"),restoredChild=Object.values(roundTrip.nodes).find(({name,parentId})=>name==="id"&&parentId===restoredRoot.id),restoredOther=Object.values(roundTrip.nodes).find(({name})=>name==="page_name");
  assert.equal(exported.properties.products["x-concept"],rootConcept.trim(),"JSON Schema preserves the trimmed annotation");
  assert.equal(restoredRoot.concept,rootConcept.trim(),"round-trip restores the parent annotation");
  assert.equal(restoredChild.concept,undefined,"round-trip never propagates a concept to a child");
  assert.equal(restoredOther.concept,other.concept.trim(),"round-trip conserves independent property annotations");
}

console.log("schema property concept property tests passed");
