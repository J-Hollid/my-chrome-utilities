import assert from "node:assert/strict";
import {createSpecificationProject,transactProject} from "../dist/data-layer-specification-project.js";
import {createMemoryDurableProjectRepository,durableDraftCommand} from "../dist/data-layer-durable-project-repository.js";

let sequence=0;const repository=createMemoryDurableProjectRepository({token:()=>`property-token:${++sequence}`,now:()=>"2026-07-21T12:00:00.000Z"}),projects=[];
for(let index=0;index<24;index+=1){const state=createSpecificationProject({name:`Project ${index}`,site:`project-${index}.example`,id:(kind)=>kind==="project"?`project:${index}`:`${kind}:${index}`});state.project.collections.pages.push({id:`page:${index}`,name:`Page ${index}`,literal:`page:${(index+1)%24}`});state.project.collections.fixtures.push({id:`fixture:${index}`,name:`Fixture ${index}`,payload:{body:String(index).repeat(2048)}});const publishedRevision=index%4;if(publishedRevision){const release={id:`release:${index}:${publishedRevision}`,name:`Release ${publishedRevision}`,revision:publishedRevision,createdAt:"2026-07-21T00:00:00.000Z",snapshot:structuredClone(state.project.collections)};state.project.releases.push(release);state.project.currentRelease=release.id;}projects.push(state);await repository.putProject(state,{draftSequence:index,publishedRevision,active:index===0});}
for(let index=0;index<projects.length;index+=1){const projectId=`project:${index}`,otherId=`project:${(index+1)%projects.length}`,otherHash=await repository.hashProject(otherId),base=await repository.loadProject(projectId),next=transactProject(base.state,`Property edit ${index}`,project=>({...project,description:`changed ${index}`})),result=await repository.saveDraft(durableDraftCommand(base,next,{commandId:`property:${index}`,label:`Property edit ${index}`}));assert.notEqual(result.status,"conflict");assert.equal((await repository.loadProject(projectId)).draftSequence,index+1);assert.equal(await repository.hashProject(otherId),otherHash,"a scoped Draft command never mutates another project");}
const bodyStores=new Set(["projectEntities","flowGraphs","fixtures","releases","projectRevisions"]);assert.deepEqual(repository.trace().reads.filter(({store,key})=>bodyStores.has(store)&&key==="*"),[]);assert.ok(repository.trace().reads.filter(({store,key})=>store==="projectEntities"&&key.startsWith("prefix:")).length>=projects.length);

let repairToken=0;
const repairRepository=createMemoryDurableProjectRepository({token:()=>`repair-token:${++repairToken}`,now:()=>"2026-07-24T08:30:00.000Z"}),repairCases=[];
for(let index=0;index<32;index+=1){
  const projectId=`repair-project:${index}`,flowId=`flow:${index}`,owned=index%2===1,state=createSpecificationProject({name:`Repair project ${index}`,site:`repair-${index}.example`,id:(kind)=>kind==="project"?projectId:`${kind}:repair:${index}`}),graph={pageFrames:[{id:`frame:${index}`,pageId:`page:${index}`,position:{x:index*7,y:index*11}}],occurrences:[{id:`occurrence:${index}`,pageFrameId:`frame:${index}`,eventId:`event:${index}`}],relationships:index%3?[{id:`relationship:${index}`,sourceFrameId:`frame:${index}`,targetFrameId:`frame:${index}`,kind:"alternative"}]:[]};
  if(owned)state.project.collections.flows.push({id:flowId,name:`Owned Flow ${index}`,steps:[]});
  state.project.documentationFlowGraphs={[flowId]:graph};
  const publishedRevision=index%5,draftSequence=index+3;
  if(publishedRevision){
    const release={id:`repair-release:${index}`,name:`Repair release ${publishedRevision}`,revision:publishedRevision,createdAt:"2026-07-24T08:00:00.000Z",snapshot:structuredClone(state.project.collections)};
    state.project.releases.push(release);
    state.project.currentRelease=release.id;
  }
  await repairRepository.putProject(state,{draftSequence,publishedRevision});
  repairCases.push({projectId,flowId,owned,graph,publishedRevision,draftSequence});
}
const repairReceipts=await repairRepository.repairOrphanFlowGraphs();
assert.equal(repairReceipts.length,repairCases.filter(({owned})=>!owned).length,"repair finds every and only generated orphan graph");
for(const testCase of repairCases){
  const loaded=await repairRepository.loadProject(testCase.projectId),graph=loaded.state.project.documentationFlowGraphs[testCase.flowId];
  assert.deepEqual(graph,testCase.owned?testCase.graph:undefined,`repair ${testCase.owned?"preserves owned":"removes orphan"} graph ${testCase.flowId}`);
  assert.equal(loaded.publishedRevision,testCase.publishedRevision,"repair never changes a generated Published revision");
  assert.equal(loaded.draftSequence,testCase.draftSequence+(testCase.owned?0:1),"repair advances only the affected Saved Draft");
}
const recovery=await repairRepository.exportRepositoryRecoveryBundle();
for(const {projectId,flowId,graph} of repairCases.filter(({owned})=>!owned)){
  const key=`flow-graph-ownership:${projectId}:${flowId}`,backup=recovery.migrationBackups.find((entry)=>entry.key===key),receipt=recovery.migrationReceipts.find((entry)=>entry.key===key);
  assert.deepEqual(backup.value.record.graph,graph,"each generated orphan has an exact recoverable backup");
  assert.equal(receipt.value.verified,true);
  assert.equal(receipt.value.deletedRecord.key,`${projectId}:${flowId}`);
}
const repairedHashes=await Promise.all(repairCases.map(({projectId})=>repairRepository.hashProject(projectId)));
assert.deepEqual(await repairRepository.repairOrphanFlowGraphs(),[],"the versioned ownership repair is idempotent");
assert.deepEqual(await Promise.all(repairCases.map(({projectId})=>repairRepository.hashProject(projectId))),repairedHashes,"an idempotent repair changes no project bytes");

console.log("durable project repository property tests passed");
