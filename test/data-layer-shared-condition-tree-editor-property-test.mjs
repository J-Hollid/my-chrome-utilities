import assert from "node:assert/strict";
import {projectConditionEditorDraft} from "../dist/data-layer-project-condition-editor.js";
import {conditionMatches} from "../dist/data-layer-specification-project.js";

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
