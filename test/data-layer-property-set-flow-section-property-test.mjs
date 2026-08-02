import assert from "node:assert/strict";

import {
  createFlowSection,
  inspectSectionRemovalWithContents,
  moveFlowSection,
  movePageFrameToSection,
  orderedPropertySetApplications,
  removeFlowSection,
  removeFlowSectionWithContents,
  reorderPropertySetApplication,
  upgradePageGroupsToPropertySets,
} from "../dist/data-layer-property-set-flow-section.js";

let seed=0x51ec710n;
const random=()=>{seed=(seed*1664525n+1013904223n)&0xffffffffn;return Number(seed)/0x100000000;};
const count=(maximum)=>1+Math.floor(random()*maximum);

for(let sample=0;sample<120;sample+=1){
  let sequence=0;
  const id=(kind)=>`${kind}:${sample}:${++sequence}`;
  const groupCount=count(5),pageCount=count(7);
  const groups=Array.from({length:groupCount},(_,index)=>({
    id:`set:${sample}:${index}`,
    name:`Set ${index}`,
    pageIds:[],
    schemaConstraints:[{path:`/value_${index}`,expectedValue:index}],
    applicabilitySetId:index%2?`applicability:${sample}:${index}`:undefined,
  }));
  const pages=Array.from({length:pageCount},(_,index)=>{
    const memberships=groups.filter(()=>random()<0.65).map(({id})=>id);
    for(const group of groups.filter(({id})=>memberships.includes(id)))group.pageIds.push(`page:${sample}:${index}`);
    return{id:`page:${sample}:${index}`,name:`Page ${index}`,pageGroupIds:memberships};
  });
  const frames=pages.map((page,index)=>({
    id:`frame:${sample}:${index}`,
    name:page.name,
    pageId:page.id,
    pageGroupId:groups[index%groups.length].id,
    position:{x:index*90,y:index*70},
  }));
  const relationships=frames.slice(1).map((frame,index)=>({
    id:`edge:${sample}:${index}`,
    sourceEndpoint:{kind:"page-frame",id:frames[index].id},
    targetEndpoint:{kind:"page-frame",id:frame.id},
  }));
  const flowId=`flow:${sample}`;
  const legacy={
    project:{
      id:`project:${sample}`,name:`Project ${sample}`,description:"",site:"test",environments:[],namingConventions:{},publicationPolicy:{warningsBlock:false,fixturesRequired:false},releases:[],
      collections:{profiles:[],pageGroups:groups,pages,events:[],applicabilitySets:groups.flatMap((group)=>group.applicabilitySetId?[{id:group.applicabilitySetId,name:group.name}]:[]),flows:[{id:flowId,name:"Flow"}],fixtures:[],assignments:[]},
      documentationFlowGraphs:{[flowId]:{pageGroupIds:groups.map(({id})=>id),pageFrames:frames,occurrences:[],relationships}},
    },
    draft:{id:`draft:${sample}`,status:"Saved",updatedAt:"2026-08-02T00:00:00.000Z"},
    history:{undo:[],redo:[]},
  };
  const beforeTopology=JSON.stringify(relationships),upgraded=upgradePageGroupsToPropertySets(legacy,id),project=upgraded.project;
  assert.equal(Object.hasOwn(project.collections,"pageGroups"),false);
  assert.deepEqual(project.collections.propertySets.map(({id,schemaConstraints})=>({id,schemaConstraints})),groups.map(({id,schemaConstraints})=>({id,schemaConstraints})),"migration conserves contributor identity and complete schema content");
  for(const page of pages)assert.deepEqual(orderedPropertySetApplications(project,page.id).map(({propertySetId})=>propertySetId),page.pageGroupIds,"migration conserves Page application order");
  assert.equal(JSON.stringify(project.documentationFlowGraphs[flowId].relationships),beforeTopology,"migration conserves Flow topology");
  assert.strictEqual(upgradePageGroupsToPropertySets(upgraded,id),upgraded,"migration reload is idempotent");
  if(pages[0].pageGroupIds.length>1){
    const first=pages[0].pageGroupIds[0],moved=reorderPropertySetApplication(upgraded,pages[0].id,first,1);
    assert.deepEqual(orderedPropertySetApplications(moved.project,pages[0].id).map(({propertySetId})=>propertySetId),[pages[0].pageGroupIds[1],first,...pages[0].pageGroupIds.slice(2)]);
  }
  const schemaBytes=JSON.stringify(project.collections);
  let sectionState=createFlowSection(upgraded,flowId,{name:"Review",bounds:{x:30,y:40,width:320,height:180}},id);
  const section=sectionState.project.documentationFlowGraphs[flowId].sections.at(-1);
  sectionState=movePageFrameToSection(sectionState,flowId,frames[0].id,section.id);
  sectionState=moveFlowSection(sectionState,flowId,section.id,{x:80,y:90});
  assert.equal(JSON.stringify(sectionState.project.collections),schemaBytes,"Section commands are schema-neutral across generated projects");
  sectionState=removeFlowSection(sectionState,flowId,section.id);
  assert.equal(sectionState.project.documentationFlowGraphs[flowId].pageFrames.some(({id,sectionId})=>id===frames[0].id&&sectionId===undefined),true,"default removal conserves frames");
  const populated=project.documentationFlowGraphs[flowId].sections[0];
  if(populated){
    const review=inspectSectionRemovalWithContents(upgraded.project,flowId,populated.id),removed=removeFlowSectionWithContents(upgraded,flowId,populated.id,review);
    assert.equal(removed.project.documentationFlowGraphs[flowId].pageFrames.some(({id})=>review.pageFrames.some((frame)=>frame.id===id)),false,"reviewed removal deletes exactly reviewed frames");
  }
}

console.log("property set and Flow Section separation properties passed");
