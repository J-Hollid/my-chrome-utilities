import assert from "node:assert/strict";
import {testAssignmentRouting} from "../dist/data-layer-assignment-routing.js";

let seed=0xa5516e;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/0x100000000;};
for(let sample=0;sample<180;sample+=1){
  const count=1+Math.floor(random()*7),pathname=`/route/${sample}`,winningPriority=1+Math.floor(random()*100),project={collections:{events:[{id:"event:view",name:"Page View",eventName:"page_view"}],applicabilitySets:[{id:"set:route",name:"Route",condition:{kind:"all",conditions:[{kind:"predicate",field:"pathname",operator:"equals",value:pathname}]}}],assignments:Array.from({length:count},(_,index)=>({id:`assignment:${sample}:${index}`,name:`Assignment ${index}`,targetKind:"Page",targetId:`page:${index}`,sourceId:"browser",eventId:"event:view",target:"payload",applicabilitySetId:"set:route",priority:index===0?winningPriority:Math.max(0,winningPriority-index)})),pages:[],profiles:[],pageGroups:[],flows:[],fixtures:[]}},before=JSON.stringify(project),result=testAssignmentRouting(project,{sourceId:"browser",eventName:"page_view",pathname});
  assert.equal(result.winner?.assignmentId,`assignment:${sample}:0`,`sample ${sample} selects the unique highest priority`);
  assert.equal(result.candidates.length,count,`sample ${sample} retains every candidate's evidence`);
  assert.ok(result.candidates.every(({event,applicability})=>event.accepted&&applicability.accepted),`sample ${sample} exposes accepted Event and applicability evidence`);
  assert.equal(JSON.stringify(project),before,`sample ${sample} does not mutate repository-shaped bytes`);
  const tied=structuredClone(project);if(count===1)tied.collections.assignments.push({...tied.collections.assignments[0],id:`assignment:${sample}:tie`,name:"Tie"});else tied.collections.assignments[1].priority=winningPriority;
  const ambiguous=testAssignmentRouting(tied,{sourceId:"browser",eventName:"page_view",pathname});
  assert.equal(ambiguous.winner,undefined,`sample ${sample} blocks an equal highest-priority tie`);assert.ok(ambiguous.ties.length>=2);
}
console.log("assignment routing properties passed");
