import assert from "node:assert/strict";
import {presentQuery,queryText} from "../../scripts/verification-ownership-query/presentation.mjs";
import {classifyOwnershipReadiness} from "../../scripts/verification-ownership-readiness-core.mjs";
const base={mode:"path",worktree:"/fixture",head:"a".repeat(40),registryIdentity:"sha256:"+"b".repeat(64),dirty:false,
  registryDirty:false,packIds:["pack_a"],slices:[{id:"slice:pack_a/slice_a",provenance:{path:"manifest.json"},declaration:{tasks:["unit:one"]}}],
  checks:[],consumers:[],restrictions:["required restriction"],terminalFullObligations:["terminal obligation"]};
for(const [count,list,json] of [[2,"checks",false],[12,"checks",false],[15,"consumers",true]]) {
  const answer={...base,[list]:Array.from({length:count},(_,index)=>({key:`unit:check-${index}`,provenance:{path:"manifest.json"}}))};
  const short=presentQuery(answer,{mode:"path",path:"authored/file.mjs",json});
  assert.equal(short[list].entries.length,Math.min(10,count));assert.equal(short[list].omitted,Math.max(0,count-10));
  assert.deepEqual(short.restrictions,base.restrictions);assert.deepEqual(short.packIds,base.packIds);
  assert.match(queryText(short),/required restriction/);assert.match(queryText(short),/terminal obligation/);
  const full=presentQuery(answer,{mode:"path",path:"authored/file.mjs",expand:list});assert.equal(full[list].entries.length,count);
  assert.equal(presentQuery(answer,{mode:"path",path:"a",expand:"slice:pack_a/slice_a"}).slices[0].declaration.tasks[0],"unit:one");
}
const rows=[
  ["bounded-ready",{plannedPackIds:["a"],allPackIds:["a","b"]}],
  ["coarse-boundary",{plannedPackIds:["a","b"],allPackIds:["a","b"],expansionCauses:[{credibleBoundary:true}]}],
  ["granularity-assessment-required",{plannedPackIds:["a"],allPackIds:["a","b"],expansionCauses:[{credibleBoundary:true,sliced:false}]}],
  ["coarse-within-pack",{plannedPackIds:["a"],allPackIds:["a","b"],withinPack:{unrelatedCompleteTaskFamily:true,stableObservableBoundary:true,reducesTaskScope:true,meaningPreserved:true}}],
];
for(const [expected,input] of rows){const readiness={...classifyOwnershipReadiness(input),expansionCauses:input.expansionCauses??[]};
  assert.equal(readiness.classification,expected);
  const shown=presentQuery({...base,readiness},{mode:"path",path:"a"});
  assert.deepEqual(shown.readiness,readiness);assert.ok(queryText(shown).includes(readiness.nextStage));}
console.log(JSON.stringify({ownershipPresentation:{limits:true,expansions:true,restrictions:true,classifications:rows.map(r=>r[0])}}));
