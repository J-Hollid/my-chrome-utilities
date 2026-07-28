import assert from "node:assert/strict";
import {
  addComposedConditionPredicate,
  composedConditionPredicate,
  composedFacetDraft,
  composedFacetDraftWithoutRemovedItems,
  evaluateComposedCondition,
  moveComposedAllowedValue,
  moveComposedConditionBranch,
  sparseComposedFacets,
  typedComposedValue,
} from "../dist/data-layer-composed-schema-builders.js";
import {ensureComposedConditionIds} from "../dist/data-layer-composed-schema-workspace-focused-conditions.js";
import {compileLayeredSchema,validateLayeredObservation} from "../dist/data-layer-layered-schema.js";

let seed=0x6275696c;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/0x100000000);
const token=(prefix)=>`${prefix}_${Math.floor(random()*1_000_000)}`;

for(let example=0;example<150;example+=1){
  const count=2+Math.floor(random()*7),allowedValues=Array.from({length:count},()=>token("allowed")),index=Math.floor(random()*(count-1)),draft=composedFacetDraft({path:"/value",allowedValues},{path:"/value"}),moved=moveComposedAllowedValue(draft,index,1),restored=moveComposedAllowedValue(moved,index+1,-1);
  assert.deepEqual(restored.allowedValues,allowedValues,"moving an allowed value forward and back conserves its ordered values");
  assert.equal(moveComposedAllowedValue(draft,0,-1),draft,"a clamped allowed-value move is a true no-op");

  const propertyName=token("property"),path=`/${propertyName}`,definitionId=`definition:${token("id")}`,matchingValue=token("matching"),choice={path,definitionId,type:"string"},conditionDraft=addComposedConditionPredicate(composedFacetDraft({path:"/required_value",type:"string",presence:"required"},{path:"/required_value"}),[],composedConditionPredicate(choice,"Equals",matchingValue)),facets=sparseComposedFacets(conditionDraft,{path:"/required_value"});
  assert.equal(facets.condition.children[0].propertyId,definitionId);
  assert.equal(evaluateComposedCondition(facets.condition,{[propertyName]:matchingValue},[choice]),true);
  const compiled=compileLayeredSchema([{id:`page:${example}`,name:`Page ${example}`,scope:"Page",constraints:[{path,definitionId,type:"string"},{path:"/required_value",definitionId:`definition:required:${example}`,...facets}]}],{eventId:`event:${example}`,eventRole:"interaction"}),validate=(payload)=>validateLayeredObservation({targetId:`target:${example}`,targetName:`Page ${example}`,revision:1,compiled},payload).issues;
  assert.deepEqual(validate({[propertyName]:matchingValue}).map(({path:issuePath,code})=>({path:issuePath,code})),[{path:"/required_value",code:"REQUIRED"}]);
  assert.deepEqual(validate({[propertyName]:token("different")}),[]);

  const identityDraft=ensureComposedConditionIds({kind:"all",children:[{kind:"predicate",propertyId:path,operator:"Exists"},{kind:"predicate",propertyId:path,operator:"Equals",value:matchingValue}]},(kind)=>`${kind}:${token("identity")}`),beforeIds=identityDraft.children.map(({id})=>id);
  const movedIdentity=moveComposedConditionBranch({condition:identityDraft,allowedValues:[],rules:[],documentation:"",exampleMethod:"blank"},[0],1).condition;
  assert.deepEqual(movedIdentity.children.map(({id})=>id),[beforeIds[1],beforeIds[0]],"condition identity is conserved when branches move");
  const removed=composedFacetDraftWithoutRemovedItems({...conditionDraft,allowedValues:["a","b"],allowedValueIds:["value:a","value:b"],rules:[{id:"rule:a"},{id:"rule:b"}]},new Set(["rule:a"]),new Set(["value:b"]));
  assert.deepEqual(removed.allowedValues,["a"],"removed value IDs are excluded from sparse drafts");
  assert.deepEqual(removed.rules,[{id:"rule:b"}],"removed rule IDs are excluded from sparse drafts");
}

for(let depth=1;depth<=8;depth+=1){
  const terminal={id:`item:number:${depth}`,type:"number",allowedValues:[depth,depth+1]};
  const itemSchema=Array.from({length:depth-1},(_,index)=>`item:array:${depth}:${index}`)
    .reduceRight((items,id)=>({id,type:"array",items}),terminal);
  const nested=(value,remaining)=>remaining===1?[value]:[nested(value,remaining-1)];
  const validInput=JSON.stringify(nested(depth,depth));
  assert.deepEqual(
    typedComposedValue("array",validInput,itemSchema),
    JSON.parse(validInput),
    `depth ${depth} recursively homogeneous custom examples survive the typed staging round trip`,
  );
  const invalidInput=JSON.stringify(nested(String(depth),depth));
  assert.throws(
    ()=>typedComposedValue("array",invalidInput,itemSchema),
    new RegExp(`Item ${Array.from({length:depth},()=>1).join("\\.")}: Expected Number`),
    `depth ${depth} mixed terminal items are rejected at their recursive item path`,
  );
  const invalidDraft={
    ...composedFacetDraft({path:"/matrix"},{path:"/matrix",type:"array",itemSchema}),
    exampleMethod:"custom",
    exampleInput:invalidInput,
    exampleIssue:`Item ${Array.from({length:depth},()=>1).join(".")}: Expected Number.`,
  },before=structuredClone(invalidDraft);
  assert.throws(()=>sparseComposedFacets(invalidDraft,{path:"/matrix",type:"array",itemSchema}),/Expected Number/);
  assert.deepEqual(invalidDraft,before,`depth ${depth} rejected save leaves staged input and canonical draft byte-identical`);
}

console.log("data-layer composed schema builder property tests passed");
