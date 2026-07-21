import assert from "node:assert/strict";
import {compileLayeredSchema,resolveLayeredTarget,validateLayeredObservation} from "../dist/data-layer-layered-schema.js";
import {flowPageFrameContributor,layeredContributorPath} from "../dist/data-layer-layered-schema-project.js";

let seed=0x51a7e;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/0x100000000;};
const pickSubset=(values)=>values.filter(()=>random()>=0.5);

for(let iteration=0;iteration<200;iteration+=1){
  const universe=Array.from({length:2+Math.floor(random()*7)},(_,index)=>`value-${iteration}-${index}`),selected=pickSubset(universe),narrowed=selected.length?selected:[universe[0]];
  const contributors=[
    {id:`base:${iteration}`,name:"Base",scope:"Shared Profile",constraints:[{path:"/choice",type:"string",allowedValues:universe}]},
    {id:`specific:${iteration}`,name:"Specific",scope:"Event",constraints:[{path:"/choice",allowedValues:narrowed}]},
    {id:`excluded:${iteration}`,name:"Excluded",scope:"Page",constraints:[{path:"/excluded",type:"number",target:"other-event"}]},
  ],context={eventId:"selected-event",eventRole:"interaction"},first=compileLayeredSchema(contributors,context),roundTrip=compileLayeredSchema(JSON.parse(JSON.stringify(contributors)),context);
  assert.equal(first.status,"ready");
  assert.deepEqual(first.properties["/choice"].allowedValues,narrowed,"a valid specific subset is conserved exactly");
  assert.equal("/excluded" in first.properties,false,"a non-targeted contribution never leaks into the effective schema");
  assert.deepEqual(roundTrip,first,"JSON persistence preserves deterministic compilation");

  const priority=1+Math.floor(random()*50),compiled=first,automatic={id:`auto:${iteration}`,name:"Automatic",activation:"automatic",priority,applicability:[],compiled},lower={...automatic,id:`lower:${iteration}`,name:"Lower",priority:priority-1},documentation={...automatic,id:`docs:${iteration}`,name:"Docs",activation:"documentation-only",priority:priority+100},resolution=resolveLayeredTarget([lower,documentation,automatic],{});
  assert.equal(resolution.winner?.id,automatic.id,"the unique highest automatic priority wins");
  assert.equal(resolution.candidates.some(({id})=>id===documentation.id),false,"documentation-only targets never enter automatic candidates");

  const actual=Math.floor(random()*101),expected=Math.floor(random()*101),operator=["Greater than","At least","Less than","At most"][Math.floor(random()*4)],matches={"Greater than":actual>expected,"At least":actual>=expected,"Less than":actual<expected,"At most":actual<=expected}[operator],conditional=compileLayeredSchema([{id:`numeric:${iteration}`,name:"Numeric",scope:"Event",constraints:[{path:"/actual",definitionId:`definition:actual:${iteration}`,type:"number"},{path:"/conditional",type:"string",presence:"required",condition:{kind:"predicate",propertyId:`definition:actual:${iteration}`,operator,value:expected}}]}],context),conditionalIssues=validateLayeredObservation({targetId:`numeric:${iteration}`,targetName:"Numeric",revision:1,compiled:conditional},{actual}).issues;
  assert.equal(conditionalIssues.some(({path,code})=>path==="/conditional"&&code==="REQUIRED"),matches,`${operator} remains truthful for ${actual} and ${expected}`);

  const flowId=`flow:${iteration}`,pageId=`page:${iteration}`,groupId=`group:${iteration}`,frameId=`frame:${iteration}`,frameName=random()>=0.5?`Named frame ${iteration}`:"",frame={id:frameId,name:frameName,pageId,pageGroupId:groupId,canonicalSchema:{id:`schema:${iteration}`}},state={project:{collections:{profiles:[],events:[],pageGroups:[{id:groupId,name:`Group ${iteration}`,pageIds:[pageId]}],pages:[{id:pageId,name:`Page ${iteration}`}],flows:[{id:flowId,name:`Flow ${iteration}`}],applicabilitySets:[],fixtures:[],schemaDrafts:[],assignments:[]},documentationFlowGraphs:{[flowId]:{pageGroupIds:[groupId],pageFrames:[frame],occurrences:[],relationships:[]}}}},contributor=flowPageFrameContributor(state,flowId,frameId);
  assert.deepEqual({id:contributor.id,pageId:contributor.pageId,pageGroupId:contributor.pageGroupId,schemaId:contributor.canonicalSchema.id},{id:frameId,pageId,pageGroupId:groupId,schemaId:`schema:${iteration}`},"frame projection conserves every stable reference");
  assert.equal(contributor.name,frameName||`Page ${iteration} in Flow ${iteration}`,"blank frame names derive from stable human context");
  assert.deepEqual(layeredContributorPath(state,contributor,"Flow Page-instance",flowId),{pageGroupId:groupId,pageGroupIds:[groupId],pageId,flowId,pageFrameId:frameId},"frame contributor paths retain the selected lane and ordered Page Group inheritance path");
  assert.equal(flowPageFrameContributor(state,flowId,`missing:${iteration}`),undefined,"unknown frame IDs never fall back to a Page or Flow entity");
}

console.log("data-layer layered schema property tests passed");
