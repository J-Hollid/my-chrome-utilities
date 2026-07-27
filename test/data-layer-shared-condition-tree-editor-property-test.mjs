import assert from "node:assert/strict";
import {evaluateCanonicalPredicate} from "../dist/data-layer-canonical-schema-predicates.js";
import {evaluateComposedCondition} from "../dist/composed-schema/facet-conditions.js";
import {
  sharedFlatConditionResult,
  sharedFlatConditionRows,
} from "../dist/data-layer-shared-condition-tree-editor.js";
import {projectConditionEditorDraft} from "../dist/data-layer-project-condition-editor.js";
import {conditionMatches} from "../dist/data-layer-specification-project.js";
import {layeredConditionMatches} from "../dist/layered-schema/conditional-rules.js";

let state=0x51ce5eed;
const random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/0x100000000);
const leaf=(index)=>index%4===0
  ? {kind:"predicate",field:"payload.market",operator:"is one of",values:["retail",`market-${index}`]}
  : index%4===1
    ? {kind:"predicate",field:"payload.path",operator:"matches pattern",pattern:`^/route-${index % 7}`}
    : index%4===2
      ? {kind:"predicate",field:"payload.total",operator:"is at least",value:index}
      : {kind:"predicate",field:"payload.total",operator:"is greater than",valuePath:"payload.minimum"};
const tree=(depth,index)=>{
  if(depth===0||random()<0.38) return leaf(index);
  const kind=["all","any","not"][Math.floor(random()*3)];
  const count=kind==="not"?1:1+Math.floor(random()*3);
  return {kind,conditions:Array.from({length:count},(_,child)=>tree(depth-1,index*3+child+1))};
};

for(let index=0;index<250;index+=1) {
  const source=tree(4,index+1);
  const bytes=JSON.stringify(source);
  const draft=projectConditionEditorDraft(source);
  assert.deepEqual(draft,source,`nested project tree ${index} round-trips without flattening`);
  assert.notEqual(draft,source,`nested project tree ${index} is staged in an isolated object`);
  assert.equal(JSON.stringify(source),bytes,`opening nested project tree ${index} performs no mutation`);
  const observation={
    payload:{
      market:index%2?"retail":`market-${index}`,
      path:`/route-${index%7}/detail`,
      total:index+10,
      minimum:index,
    },
  };
  assert.equal(
    conditionMatches(draft,observation),
    conditionMatches(source,observation),
    `nested project tree ${index} retains matcher behavior`,
  );
}

for(let index=0;index<250;index+=1) {
  const count=1+Math.floor(random()*6),mode=random()<.5?"all":"any",rows=Array.from({length:count},(_,rowIndex)=>{
    const propertyId=`property:${index}:${rowIndex}`,operator=rowIndex%3===0?"Exists":rowIndex%3===1?"Equals":"Is one of",value=`value:${index}:${rowIndex}`;
    return{id:`condition:${index}:${rowIndex}`,propertyId,operator,...(operator==="Exists"?{}:{value:operator==="Is one of"?[value,`alternate:${rowIndex}`]:value})};
  }),condition=sharedFlatConditionResult(mode,rows);
  assert.ok(condition,`flat condition ${index} is complete`);
  assert.deepEqual(sharedFlatConditionRows(condition),rows,`flat condition ${index} conserves row order, stable IDs, operators, and typed multi-values`);
  const payload={},canonicalObservation={},choices=[],paths=new Map(),nodes={};
  for(const [rowIndex,row] of rows.entries()) {
    const path=`/value${rowIndex}`,actual=row.operator==="Exists"||random()<.65?(Array.isArray(row.value)?row.value[0]:row.value):`different:${rowIndex}`;
    payload[`value${rowIndex}`]=actual;canonicalObservation[row.propertyId]=actual;choices.push({definitionId:row.propertyId,path,type:"string"});paths.set(row.propertyId,path);nodes[row.propertyId]={id:row.propertyId,name:`value${rowIndex}`};
  }
  const canonical=evaluateCanonicalPredicate(condition,{nodes},canonicalObservation).matched,composed=evaluateComposedCondition(condition,payload,choices),layered=layeredConditionMatches(condition,payload,paths);
  assert.equal(composed,canonical,`flat ${mode} condition ${index} agrees between canonical and composed matchers`);
  assert.equal(layered,canonical,`flat ${mode} condition ${index} agrees between canonical and layered matchers`);
}

for(const [index,row] of [
  {propertyId:"",operator:"Exists"},
  {propertyId:"property:empty-operator",operator:""},
  {propertyId:"property:empty-text",operator:"Equals",value:""},
  {propertyId:"property:empty-multi",operator:"Is one of",value:[]},
].entries()) {
  assert.equal(sharedFlatConditionResult("all",[{id:`condition:invalid:${index}`,...row}]),undefined,`invalid flat row ${index} is excluded from a stored rule`);
}
