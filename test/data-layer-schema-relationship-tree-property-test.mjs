import assert from "node:assert/strict";

import {
  filterSchemaRelationshipTree,
  projectSchemaRelationshipTree,
  restoreSchemaRelationshipTreeView,
  saveSchemaRelationshipTreeView,
} from "../dist/schema-relationship-tree.js";

let seed=0x5c4e3a21;
const random=()=>{
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  return seed/0x100000000;
};
const count=(maximum)=>Math.floor(random()*(maximum+1));
const flatten=(nodes)=>nodes.flatMap((node)=>[node,...flatten(node.children)]);
const entity=(id,name,extra={})=>({id,name,...extra});
const categories=["All","Saved schemas","Shared Profiles","Property Sets","Pages","Events","Flow Page instances","Event occurrences"];

for(let sample=0;sample<200;sample+=1){
  const groupCount=count(4),pageCount=count(6),eventCount=count(5),flowCount=count(4);
  const groups=Array.from({length:groupCount},(_,index)=>entity(`group:${sample}:${index}`,`Group ${sample} ${index}`));
  const pages=Array.from({length:pageCount},(_,index)=>{
    const pageGroupIds=groups.filter(()=>random()<0.55).map(({id})=>id);
    return entity(`page:${sample}:${index}`,`Page ${sample} ${index}`,{pageGroupIds});
  });
  const events=Array.from({length:eventCount},(_,index)=>entity(`event:${sample}:${index}`,`Event ${sample} ${index}`));
  const flows=Array.from({length:flowCount},(_,index)=>entity(`flow:${sample}:${index}`,`Flow ${sample} ${index}`));
  const documentationFlowGraphs=Object.fromEntries(flows.map((flow,flowIndex)=>{
    const pageFrames=pages.filter(()=>random()<0.6).map((page,index)=>entity(
      `frame:${sample}:${flowIndex}:${index}`,
      `Frame ${sample} ${flowIndex} ${index}`,
      {pageId:page.id},
    ));
    const occurrences=pageFrames.flatMap((frame,frameIndex)=>events.filter(()=>random()<0.45).map((event,eventIndex)=>entity(
      `occurrence:${sample}:${flowIndex}:${frameIndex}:${eventIndex}`,
      `Occurrence ${sample} ${flowIndex} ${frameIndex} ${eventIndex}`,
      {pageFrameId:frame.id,pageId:frame.pageId,eventId:event.id},
    )));
    return[flow.id,{pageFrames,occurrences}];
  }));
  const state={project:{
    id:`project:${sample}`,
    name:`Project ${sample}`,
    collections:{
      profiles:Array.from({length:count(3)},(_,index)=>entity(`profile:${sample}:${index}`,`Profile ${sample} ${index}`)),
      pageGroups:groups,
      pages,
      events,
      flows,
      applicabilitySets:[],
      fixtures:[],
      assignments:[],
    },
    documentationFlowGraphs,
  },history:{undo:[],redo:[]}};
  const saved=Array.from({length:count(3)},(_,index)=>({id:`saved:${sample}:${index}`,name:`Saved ${sample} ${index}`,version:index+1}));
  const stateBytes=JSON.stringify(state),savedBytes=JSON.stringify(saved);
  const tree=projectSchemaRelationshipTree(state,saved),nodes=flatten(tree);

  assert.equal(JSON.stringify(state),stateBytes,"projection must not mutate canonical project data");
  assert.equal(JSON.stringify(saved),savedBytes,"projection must not mutate the global Saved Schema Library");
  assert.equal(new Set(nodes.map(({key})=>key)).size,nodes.length,"every rendered appearance needs a stable unique key");

  for(const page of pages){
    const membershipCount=page.pageGroupIds.length;
    const references=nodes.filter(({targetKey})=>targetKey===`pages:${page.id}`);
    assert.equal(references.length,1+membershipCount,"a Page has one canonical row plus one reference per membership");
    assert.equal(references.filter(({role})=>role==="Flow Page instance").length,0,"Page references never impersonate Flow instances");
  }
  for(const [flowId,{occurrences}] of Object.entries(documentationFlowGraphs)){
    for(const occurrence of occurrences){
      assert.equal(nodes.filter(({targetKey})=>targetKey===`occurrences:${flowId}:${occurrence.id}`).length,2,
        "each occurrence has one reusable-Event reference and one owning-Flow reference");
    }
  }

  const view={category:categories[count(categories.length-1)],query:random()<0.5?String(sample):"not-present"};
  const before=JSON.stringify(tree),filtered=filterSchemaRelationshipTree(tree,view);
  assert.equal(JSON.stringify(tree),before,"filter and search must be transient projections");
  assert.equal(new Set(flatten(filtered).map(({key})=>key)).size,flatten(filtered).length,"filtering preserves unique appearance keys");

  const validKeys=new Set(nodes.map(({key})=>key)),expandedKeys=[...validKeys].filter(()=>random()<0.3);
  const storage=new Map(),savedView={query:`query ${sample}`,category:categories[count(categories.length-1)],expandedKeys:[...expandedKeys,"stale"],scrollTop:count(5000)};
  saveSchemaRelationshipTreeView(storage,state.project.id,savedView);
  assert.deepEqual(restoreSchemaRelationshipTreeView(storage,state.project.id,validKeys),{
    ...savedView,
    expandedKeys,
  },"project-scoped view state round trips while stale relationship keys are pruned");
}

console.log("Schema relationship tree property tests passed");
