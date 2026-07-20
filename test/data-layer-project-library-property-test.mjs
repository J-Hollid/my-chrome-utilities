import assert from "node:assert/strict";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {
  commitProjectImport,
  exportProjectBundle,
  projectLibrary,
  replayProjectCommand,
  resolveProjectWrite,
  restoreProjectLibrary,
  serializeProjectLibrary,
  setProjectPendingWrite,
  stageProjectImport,
} from "../dist/data-layer-project-library.js";

let seed=0x70a1ec7;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/0x100000000;};

for(let example=0;example<120;example+=1){
  const suffix=`${example}-${Math.floor(random()*1_000_000)}`,projectId=`project:${suffix}`;
  const state=createSpecificationProject({name:`Project ${suffix}`,site:`${suffix}.example`,id:(kind)=>kind==="project"?projectId:`${kind}:${suffix}`});
  const groupId=`group:${suffix}`,pageId=`page:${suffix}`,eventId=`event:${suffix}`,flowId=`flow:${suffix}`,frameId=`frame:${suffix}`,occurrenceId=`occurrence:${suffix}`;
  state.project.collections.profiles.push({id:`profile:${suffix}`,name:"Sitewide",sourceLineage:{schemaId:`external:${suffix}`,revision:example+1}});
  state.project.collections.pageGroups.push({id:groupId,name:"Group"});
  state.project.collections.pages.push({id:pageId,name:"Page",pageGroupIds:[groupId]});
  state.project.collections.events.push({id:eventId,name:"Event"});
  state.project.collections.flows.push({id:flowId,name:"Flow"});
  state.project.documentationFlowGraphs={[flowId]:{pageFrames:[{id:frameId,name:"Frame",pageId,pageGroupId:groupId}],occurrences:[{id:occurrenceId,name:"Occurrence",pageFrameId:frameId,pageId,eventId}],relationships:[]}};
  const timestamp=`2026-07-20T12:${String(example%60).padStart(2,"0")}:00.000Z`,library=projectLibrary([{state,revision:example,createdAt:timestamp,lastModifiedAt:timestamp}],projectId);

  assert.deepEqual(restoreProjectLibrary(serializeProjectLibrary(library)),library,"library serialization must round-trip exactly");

  const bundle=exportProjectBundle(library,projectId),prefix=`copy:${suffix}:`,staged=stageProjectImport(bundle,library,{id:(oldId)=>`${prefix}${oldId}`});
  assert.equal(staged.blockers.length,0);
  assert.equal(staged.projectId,`${prefix}${projectId}`);
  assert.equal(staged.state.project.collections.pages[0].pageGroupIds[0],`${prefix}${groupId}`);
  assert.equal(staged.state.project.documentationFlowGraphs[`${prefix}${flowId}`].pageFrames[0].pageId,`${prefix}${pageId}`);
  assert.equal(staged.state.project.documentationFlowGraphs[`${prefix}${flowId}`].occurrences[0].eventId,`${prefix}${eventId}`);
  assert.deepEqual(staged.state.project.collections.profiles[0].sourceLineage,{schemaId:`external:${suffix}`,revision:example+1},"external lineage must not be remapped");

  const imported=commitProjectImport(library,staged,()=>timestamp);
  assert.equal(imported.activeProjectId,projectId,"import must not activate the new project");
  assert.deepEqual(imported.projects[projectId],library.projects[projectId],"import must not mutate the active project");

  const value=random()<0.5?`currency-${suffix}`:Math.floor(random()*10_000),pendingWrite={label:`Set currency ${suffix}`,baseRevision:example,fields:["/currency"],command:{kind:"set-project-value",path:"/namingConventions/currency",value}},pendingLibrary=setProjectPendingWrite(library,projectId,pendingWrite),pendingBytes=serializeProjectLibrary(pendingLibrary),latest=structuredClone(state),latestNote=`Concurrent note ${suffix}`,collectionBytes=JSON.stringify(latest.project.collections);
  latest.project.notes=latestNote;
  const mergedState=replayProjectCommand(latest,pendingWrite),merged=resolveProjectWrite(pendingLibrary,projectId,"merge",{state:mergedState,revision:example+1},()=>timestamp),record=merged.projects[projectId];
  assert.equal(record.state.project.namingConventions.currency,value,"merge applies the exact pending value");
  assert.equal(record.state.project.notes,latestNote,"merge preserves an unrelated persisted edit");
  assert.equal(JSON.stringify(record.state.project.collections),collectionBytes,"merge preserves unrelated collections");
  assert.equal(record.revision,example+1,"merge advances from the persisted revision");
  assert.equal(record.pendingWrite,undefined,"merge clears only the resolved pending marker");
  assert.equal(serializeProjectLibrary(pendingLibrary),pendingBytes,"merge does not mutate its input library");
}

console.log("data-layer project library properties passed");
