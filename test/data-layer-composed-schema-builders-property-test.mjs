import assert from "node:assert/strict";
import {
  addComposedConditionPredicate,
  composedConditionPredicate,
  composedFacetDraft,
  evaluateComposedCondition,
  moveComposedAllowedValue,
  sparseComposedFacets,
} from "../dist/data-layer-composed-schema-builders.js";
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
}

console.log("data-layer composed schema builder property tests passed");
