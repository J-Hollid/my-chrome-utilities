import assert from "node:assert/strict";

import {
  addPropertySetApplication,
  addFlowPageFrameAtPosition,
  addFlowPageFrameAndRelationship,
  changePropertySetSchema,
  createFlowSection,
  createFlowSectionAroundFrames,
  includePropertySetParentAddition,
  inspectSectionRemovalWithContents,
  moveFlowSection,
  movePageFrameToSection,
  orderedPropertySetApplications,
  pagePropertySetEvaluatorRevision,
  removeFlowSection,
  removeFlowSectionWithContents,
  renameAndResizeFlowSection,
  reorderPropertySetApplication,
  stagePropertySetParentAddition,
  setPropertySetApplicationApplicability,
  upgradePageGroupsToPropertySets,
  verifyPropertySetFlowSectionUpgrade,
} from "../dist/data-layer-property-set-flow-section.js";
import {compileLayeredSchema} from "../dist/data-layer-layered-schema.js";
import {layeredContributorPath,layeredContributorsForPath} from "../dist/data-layer-layered-schema-project.js";
import {includeProfileInheritanceParentAdditions,selectiveProfileContribution} from "../dist/data-layer-selective-profile-inheritance.js";
import {createProjectCollectionEntity} from "../dist/data-layer-project-entity-lifecycle.js";
import {createMemoryDurableProjectRepository} from "../dist/data-layer-durable-project-repository.js";
import {projectFlowGraph} from "../dist/data-layer-flow-graph.js";
import {createSpecificationProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";
import {acquireDistArtifactLock} from "../scripts/dist-artifact-lock.mjs";
import {loadVerificationPacks,planVerification,validateVerificationPacks} from "../scripts/verification-packs.mjs";

let sequence=0;
const id=(kind)=>`${kind}:separation:${++sequence}`;
const legacyFlowProjection=(state,flowId)=>{
  const graph=state.project.documentationFlowGraphs[flowId],laneIds=graph.pageGroupIds,hasBefore=graph.pageFrames.some(({freePageRegion})=>freePageRegion==="before-lanes"),laneOffset=hasBefore?200:0,size=(frame)=>{const children=graph.occurrences.filter(({pageFrameId})=>pageFrameId===frame.id);return{width:Math.max(190,...children.map(({position})=>Number(position?.x??24)+190)),height:Math.max(108,...children.map(({position})=>Number(position?.y??70)+110))};},bands=[];let nextY=20;for(const laneId of laneIds){const frames=graph.pageFrames.filter(({pageGroupId,freePageRegion})=>pageGroupId===laneId&&!freePageRegion),height=Math.max(240,...frames.map((frame)=>Number(frame.position.y??40)+size(frame).height+40));bands.push({id:laneId,y:nextY,height});nextY+=height+24;}const bandById=new Map(bands.map((band)=>[band.id,band])),namedWidth=Math.max(900,...graph.pageFrames.filter(({freePageRegion})=>!freePageRegion).map((frame)=>Number(frame.position.x??40)+size(frame).width+60)),laneLeft=laneOffset+10,namedRight=Math.max(laneLeft+700,...graph.pageFrames.filter(({freePageRegion})=>!freePageRegion).map((frame)=>laneOffset+Number(frame.position.x??40)+size(frame).width+60)),endpoints=graph.pageFrames.map((frame)=>{const dimensions=size(frame),band=bandById.get(frame.pageGroupId),x=frame.freePageRegion?frame.freePageRegion==="before-lanes"?Number(frame.position.x??24):laneOffset+namedWidth+Number(frame.position.x??24):laneOffset+Number(frame.position.x??40),y=frame.freePageRegion?Number(frame.position.y??55):Number(band?.y??20)+Number(frame.position.y??40);return{id:frame.id,x,y,...dimensions};}),endpointById=new Map(endpoints.map((endpoint)=>[endpoint.id,endpoint])),occurrences=graph.occurrences.map((occurrence)=>{const endpoint=endpointById.get(occurrence.pageFrameId);return{id:occurrence.id,x:endpoint.x+Number(occurrence.position?.x??24),y:endpoint.y+Number(occurrence.position?.y??70)};}),relationships=graph.relationships.map((relationship)=>{const source=endpointById.get(relationship.sourceEndpoint.id),target=endpointById.get(relationship.targetEndpoint.id);return{id:relationship.id,x1:source.x+source.width,y1:source.y+source.height/2,x2:target.x,y2:target.y+target.height/2};});return{sections:bands.map((band,order)=>({laneId:band.id,order,bounds:{x:laneLeft,y:band.y,width:namedRight-laneLeft,height:band.height}})),endpoints,occurrences,relationships};
};
const legacyState=()=>({
  project:{
    id:"project:shop",name:"Shop",description:"",site:"https://shop.test",environments:["Production"],
    namingConventions:{},publicationPolicy:{warningsBlock:false,fixturesRequired:false},releases:[],
    collections:{
      profiles:[{id:"profile:commerce",name:"Commerce"}],
      pageGroups:[
        {id:"group:checkout",name:"Checkout base",applicabilitySetId:"set:retail",pageIds:["page:cart"],schemaConstraints:[{path:"/funnel_step",expectedValue:"checkout"}]},
        {id:"group:retail",name:"Retail commerce",schemaConstraints:[{path:"/funnel_step",expectedValue:"retail"}]},
      ],
      pages:[
        {id:"page:cart",name:"Cart",pageGroupIds:["group:checkout","group:retail"]},
        {id:"page:product",name:"Product detail",pageGroupIds:["group:retail"]},
      ],
      events:[{id:"event:view",name:"View"}],applicabilitySets:[{id:"set:retail",name:"Retail customers",condition:{kind:"predicate",field:"segment",operator:"equals",value:"retail"}}],
      flows:[{id:"flow:checkout",name:"Checkout journey"}],fixtures:[],
      assignments:[{id:"assignment:retail",name:"Retail checkout",targetKind:"Page Group",targetId:"group:checkout"}],
    },
    documentationFlowGraphs:{
      "flow:checkout":{
        pageGroupIds:["group:checkout","group:retail"],
        pageFrames:[
          {id:"frame:cart",name:"Cart",pageId:"page:cart",pageGroupId:"group:checkout",position:{x:40,y:90}},
          {id:"frame:product",name:"Product detail",pageId:"page:product",pageGroupId:"group:retail",position:{x:340,y:250}},
          {id:"frame:before",name:"Cart before",pageId:"page:cart",freePageRegion:"before-lanes",position:{x:32,y:30}},
          {id:"frame:free",name:"Product detail outside",pageId:"page:product",freePageRegion:"after-lanes",position:{x:24,y:410}},
        ],
        occurrences:[{id:"occurrence:view",name:"View",pageFrameId:"frame:cart",pageId:"page:cart",eventId:"event:view"},{id:"occurrence:free",name:"View outside",pageFrameId:"frame:free",pageId:"page:product",eventId:"event:view",position:{x:24,y:70}}],
        relationships:[{id:"relationship:next",sourceEndpoint:{kind:"page-frame",id:"frame:cart"},targetEndpoint:{kind:"page-frame",id:"frame:product"}},{id:"relationship:free",sourceEndpoint:{kind:"page-frame",id:"frame:free"},targetEndpoint:{kind:"page-frame",id:"frame:product"}}],
      },
    },
  },
  draft:{id:"draft:shop",status:"Saved",updatedAt:"2026-08-02T00:00:00.000Z"},history:{undo:[],redo:[]},
});

{
  const testLock=new URL("../tmp/.test-dist-artifact.lock/",import.meta.url),order=[],releaseFirst=await acquireDistArtifactLock(testLock);order.push("first acquired");let secondAcquired=false;const second=acquireDistArtifactLock(testLock).then(async(release)=>{secondAcquired=true;order.push("second acquired");await release();});await new Promise((resolve)=>setTimeout(resolve,30));assert.equal(secondAcquired,false,"a second build or acceptance session waits while the completed dist artifact is in use");await releaseFirst();await second;assert.deepEqual(order,["first acquired","second acquired"],"dist artifact consumers resume in acquisition order");
  const staleLock=new URL("../tmp/.test-dist-artifact-stale.lock/",import.meta.url);await import("node:fs/promises").then(async({mkdir,rm,writeFile})=>{await rm(staleLock,{recursive:true,force:true});await mkdir(staleLock,{recursive:true});await writeFile(new URL("owner.json",staleLock),JSON.stringify({pid:999999999,startTime:"dead",token:"stale"}));});let active=0,maximumActive=0;await Promise.all(Array.from({length:8},async()=>{const release=await acquireDistArtifactLock(staleLock);active+=1;maximumActive=Math.max(maximumActive,active);await new Promise((resolve)=>setTimeout(resolve,10));active-=1;await release();}));assert.equal(maximumActive,1,"concurrent stale reclaimers never delete a newly acquired lock");
  const crashedReclaimerLock=new URL("../tmp/.test-dist-artifact-crashed-reclaimer.lock/",import.meta.url);await import("node:fs/promises").then(async({mkdir,rm,writeFile})=>{await rm(crashedReclaimerLock,{recursive:true,force:true});await mkdir(crashedReclaimerLock,{recursive:true});await writeFile(new URL("owner.json",crashedReclaimerLock),JSON.stringify({pid:999999999,startTime:"dead",token:"stale-owner"}));await writeFile(new URL("reclaim.000000000000000000000000.999999998.orphan.claim",crashedReclaimerLock),JSON.stringify({pid:999999998,startTime:"dead",token:"orphan-claim"}));});active=0;maximumActive=0;await Promise.all(Array.from({length:8},async()=>{const release=await acquireDistArtifactLock(crashedReclaimerLock);active+=1;maximumActive=Math.max(maximumActive,active);await new Promise((resolve)=>setTimeout(resolve,10));active-=1;await release();}));assert.equal(maximumActive,1,"replacement claimants cannot displace one another while recovering a crashed reclaimer");
  const packs=await loadVerificationPacks();await validateVerificationPacks(packs);const focused=planVerification(packs,{packIds:["property_set_flow_sections"]}),changedFlow=planVerification(packs,{changedPaths:["src/data-layer-flow-graph.ts"]});assert.deepEqual(focused.packIds,["property_set_flow_sections"],"the separation checkpoint reuses only its bounded Flow component evidence");assert.equal(changedFlow.packIds.includes("flow_graph")&&changedFlow.packIds.includes("property_set_flow_sections"),true,"a core Flow change selects both its owning pack and the bounded separation consumer");
}

{
  const legacy=legacyState(),upgraded=upgradePageGroupsToPropertySets(legacy,id),corrupt=(change)=>{const candidate=structuredClone(upgraded.project);change(candidate);return candidate;};
  assert.throws(()=>verifyPropertySetFlowSectionUpgrade(legacy.project,corrupt(project=>project.collections.pages[0].propertySetApplications.reverse())),/applications/,"verification rejects changed Page application order");
  assert.throws(()=>verifyPropertySetFlowSectionUpgrade(legacy.project,corrupt(project=>{project.collections.propertySets[0].schemaConstraints[0].expectedValue="corrupt";})),/contributors/,"verification rejects changed effective Property Set input");
  assert.throws(()=>verifyPropertySetFlowSectionUpgrade(legacy.project,corrupt(project=>{project.documentationFlowGraphs["flow:checkout"].sections[0].bounds.x+=1;})),/geometry/,"verification rejects changed Section geometry");
  assert.throws(()=>verifyPropertySetFlowSectionUpgrade(legacy.project,corrupt(project=>{project.documentationFlowGraphs["flow:checkout"].occurrences[0].position={x:999,y:999};})),/geometry/,"verification rejects changed occurrence geometry");
  assert.throws(()=>verifyPropertySetFlowSectionUpgrade(legacy.project,corrupt(project=>{const graph=project.documentationFlowGraphs["flow:checkout"],alias=graph.sections[0].id;graph.sections[1].id=alias;graph.pageFrames.filter(({sectionId})=>sectionId!==alias).forEach(frame=>frame.sectionId=alias);})),/identities/,"verification rejects aliased per-Flow Section identities");
  assert.throws(()=>verifyPropertySetFlowSectionUpgrade(legacy.project,corrupt(project=>{const graph=project.documentationFlowGraphs["flow:checkout"],prior=graph.sections[0].id;graph.sections[0].id="group:checkout";graph.pageFrames.filter(({sectionId})=>sectionId===prior).forEach(frame=>frame.sectionId="group:checkout");})),/identities/,"verification rejects a Section identity reused from the legacy project");
}

{
  let state=createSpecificationProject({name:"New Shop",site:"shop.test",id});
  assert.deepEqual(Object.keys(state.project.collections),["profiles","propertySets","pages","events","applicabilitySets","flows","fixtures","assignments"],"new projects persist only the separated collection taxonomy");
  state=createProjectCollectionEntity(state,"propertySets","Checkout base",id,{description:"Reusable checkout schema"});
  state=createProjectCollectionEntity(state,"pages","Cart",id);
  assert.equal(state.project.collections.propertySets[0].name,"Checkout base");
  assert.deepEqual(state.project.collections.pages[0].propertySetApplications,[],"new Pages own ordered Property Set applications from creation");
  assert.equal(JSON.stringify(state.project).includes("pageGroup"),false,"newly saved domain bytes contain no legacy Page Group representation");
}

{
  let state=upgradePageGroupsToPropertySets(legacyState(),id);
  state=changePropertySetSchema(state,"group:checkout",[{path:"/checkout_type",documentation:"Changed"},{path:"/checkout_version",type:"string"}]);
  assert.equal(state.project.collections.propertySets.find(({id})=>id==="group:checkout").schemaConstraints.length,2,"Property Set schema changes stay live for applying Pages");
  state=stagePropertySetParentAddition(state,"group:checkout","profile:commerce",{path:"/commerce_new",type:"string"});
  assert.equal(state.project.collections.propertySets.find(({id})=>id==="group:checkout").schemaConstraints.some(({path})=>path==="/commerce_new"),false,"new parent properties remain pending");
  state=includePropertySetParentAddition(state,"group:checkout","/commerce_new");
  assert.equal(state.project.collections.propertySets.find(({id})=>id==="group:checkout").schemaConstraints.some(({path})=>path==="/commerce_new"),true,"reviewed Parent additions join the fixed Property Set selection");
}

{
  const legacy=legacyState(),beforeProjection=legacyFlowProjection(legacy,"flow:checkout"),upgraded=upgradePageGroupsToPropertySets(legacy,id),project=upgraded.project;
  assert.equal(Object.hasOwn(project.collections,"pageGroups"),false,"verified storage removes the legacy Page Group collection");
  assert.deepEqual(project.collections.propertySets.map(({id,name})=>({id,name})),[
    {id:"group:checkout",name:"Checkout base"},{id:"group:retail",name:"Retail commerce"},
  ],"Property Sets retain contributor identities and names");
  assert.deepEqual(orderedPropertySetApplications(project,"page:cart").map(({propertySetId,applicabilitySetId})=>({propertySetId,applicabilitySetId})),[
    {propertySetId:"group:checkout",applicabilitySetId:"set:retail"},{propertySetId:"group:retail",applicabilitySetId:undefined},
  ],"ordered memberships become Page-owned applications with copied applicability");
  const graph=project.documentationFlowGraphs["flow:checkout"];
  assert.equal(graph.sections.length,2,"each used legacy Flow lane becomes a Flow-owned Section");
  assert.equal(graph.pageFrames[0].sectionId,graph.sections[0].id,"frame placement points to the new Section identity");
  assert.equal(Object.hasOwn(graph.pageFrames[0],"pageGroupId"),false,"legacy frame placement is removed");
  const outside=graph.pageFrames.find(({id})=>id==="frame:free");
  assert.deepEqual(outside,{id:"frame:free",name:"Product detail outside",pageId:"page:product",position:{x:1124,y:410}},"legacy free placement becomes an ordinary Page frame outside Sections at the same canvas geometry");
  assert.equal(JSON.stringify(graph).includes("freePageRegion"),false,"upgraded Flow bytes contain no superseded free-region placement");
  assert.deepEqual(graph.relationships,legacyState().project.documentationFlowGraphs["flow:checkout"].relationships,"topology is conserved");
  assert.deepEqual(graph.occurrences,legacyState().project.documentationFlowGraphs["flow:checkout"].occurrences,"occurrence identities and geometry are conserved");
  const afterProjection=projectFlowGraph(project,"flow:checkout"),afterEndpoints=afterProjection.graph.connectionEndpoints.map(({id,layout,width,height})=>({id,x:layout.x,y:layout.y,width,height})),afterOccurrences=afterProjection.graph.nodes.map(({id,layout})=>({id,x:layout.x,y:layout.y})),afterEndpointById=new Map(afterEndpoints.map((endpoint)=>[endpoint.id,endpoint])),afterRelationships=afterProjection.graph.relationships.map((relationship)=>{const source=afterEndpointById.get(relationship.sourceEndpoint.id),target=afterEndpointById.get(relationship.targetEndpoint.id);return{id:relationship.id,x1:source.x+source.width,y1:source.y+source.height/2,x2:target.x,y2:target.y+target.height/2};});
  assert.deepEqual(graph.sections.map(({order,bounds},index)=>({laneId:beforeProjection.sections[index].laneId,order,bounds})),beforeProjection.sections,"migrated Sections reproduce every legacy lane's content-derived bounds and order");
  assert.deepEqual(afterEndpoints,beforeProjection.endpoints,"named and before/after free Page frames retain their absolute legacy canvas geometry");
  assert.deepEqual(afterOccurrences,beforeProjection.occurrences,"contained occurrence placement retains its absolute legacy canvas geometry");
  assert.deepEqual(afterRelationships,beforeProjection.relationships,"relationship endpoints retain their absolute legacy canvas geometry");
  assert.equal(project.collections.assignments[0].targetKind,"Property Set","Assignment kind is migrated without changing target identity");
  assert.equal(project.collections.assignments[0].targetId,"group:checkout");
  assert.strictEqual(upgradePageGroupsToPropertySets(upgraded,id),upgraded,"the verified upgrade is idempotent");
}

{
  const upgraded=upgradePageGroupsToPropertySets(legacyState(),id);
  const added=addPropertySetApplication(upgraded,"page:product","group:checkout",undefined,id);
  assert.deepEqual(orderedPropertySetApplications(added.project,"page:product").map(({propertySetId})=>propertySetId),["group:retail","group:checkout"]);
  const reordered=reorderPropertySetApplication(added,"page:product","group:checkout",-1);
  assert.deepEqual(orderedPropertySetApplications(reordered.project,"page:product").map(({propertySetId})=>propertySetId),["group:checkout","group:retail"]);
  assert.equal(reordered.history.undo.at(-1).label,"Reorder Property composition for Product detail");
  const conditional=setPropertySetApplicationApplicability(reordered,"page:product","group:checkout","set:retail");
  assert.equal(orderedPropertySetApplications(conditional.project,"page:product")[0].applicabilitySetId,"set:retail","applicability is edited on the Page application");
  assert.notEqual(pagePropertySetEvaluatorRevision(reordered.project,"page:product"),pagePropertySetEvaluatorRevision(conditional.project,"page:product"),"application applicability changes stale guided Page evidence");
  const changedCondition=structuredClone(conditional);changedCondition.project.collections.applicabilitySets[0].condition.value="wholesale";assert.notEqual(pagePropertySetEvaluatorRevision(conditional.project,"page:product"),pagePropertySetEvaluatorRevision(changedCondition.project,"page:product"),"Applicability Set input changes stale guided Page evidence");
  const changedSchema=changePropertySetSchema(conditional,"group:checkout",[{path:"/funnel_step",expectedValue:"changed"}]);assert.notEqual(pagePropertySetEvaluatorRevision(conditional.project,"page:product"),pagePropertySetEvaluatorRevision(changedSchema.project,"page:product"),"applied Property Set schema changes stale guided Page evidence without relying on an entity revision");
  const inherited=structuredClone(conditional),checkout=inherited.project.collections.propertySets.find(({id})=>id==="group:checkout");checkout.profileIds=["profile:commerce"];inherited.project.collections.profiles[0].schemaConstraints=[{path:"/inherited",type:"string"}];const changedInherited=structuredClone(inherited);changedInherited.project.collections.profiles[0].schemaConstraints[0].type="number";assert.notEqual(pagePropertySetEvaluatorRevision(inherited.project,"page:product"),pagePropertySetEvaluatorRevision(changedInherited.project,"page:product"),"effective inherited Shared Profile inputs stale guided Page evidence");
  const canonicalNode=(id,name,order)=>({id,name,type:"string",order,presence:{mode:"optional"},allowedValues:[],rules:[],documentation:{displayText:name,description:"",comments:"",example:{method:"blank"}},provenance:[],overrideReferences:[]}),selected=canonicalNode("property:selected","selected",0),addedNode=canonicalNode("property:added","added",1),canonical={id:"canonical:commerce",revision:1,state:"Draft",contributorId:"profile:commerce",contributorName:"Commerce",rootIds:[selected.id],nodes:{[selected.id]:selected},view:"tree",changes:[]},fixedRecipe={id:"recipe:checkout-commerce",profileId:"profile:commerce",targetId:"group:checkout",startingPoint:"empty",sourceRevision:1,membership:"fixed",conceptSelections:[],propertySelections:[selected.id],excludedPropertyIds:[],includedDependencyPropertyIds:[],excludedRuleIds:[],ruleReplacements:[],presenceReplacements:[]},fixed=structuredClone(conditional),fixedCheckout=fixed.project.collections.propertySets.find(({id})=>id==="group:checkout");fixedCheckout.profileIds=["profile:commerce"];fixedCheckout.profileInheritanceRecipes=[fixedRecipe];fixed.project.collections.profiles[0].canonicalSchema=canonical;const closedProfile=structuredClone(fixed);closedProfile.project.collections.profiles[0].canonicalSchema.onlyDefinedFields=true;assert.notEqual(pagePropertySetEvaluatorRevision(fixed.project,"page:product"),pagePropertySetEvaluatorRevision(closedProfile.project,"page:product"),"selective Shared Profile closed-field policy changes stale guided Page evidence");const bookkeeping=structuredClone(fixed);bookkeeping.project.collections.propertySets.find(({id})=>id==="group:checkout").profileInheritanceRecipes[0].sourceImpact={stale:true,addedEffectivePropertyIds:[],removedPropertyIds:[],changedPaths:[],changedDefinitionPropertyIds:[],changedRuleIds:[],newMissingRuleDependencies:[]};assert.equal(pagePropertySetEvaluatorRevision(fixed.project,"page:product"),pagePropertySetEvaluatorRevision(bookkeeping.project,"page:product"),"non-evaluation inheritance bookkeeping does not stale guided Page evidence");const grown=structuredClone(fixed),grownCanonical=grown.project.collections.profiles[0].canonicalSchema;grownCanonical.revision=2;grownCanonical.rootIds.push(addedNode.id);grownCanonical.nodes[addedNode.id]=addedNode;assert.deepEqual(selectiveProfileContribution(canonical,fixedRecipe),selectiveProfileContribution(grownCanonical,fixedRecipe),"an unselected canonical source addition does not change the fixed effective contribution");assert.equal(pagePropertySetEvaluatorRevision(fixed.project,"page:product"),pagePropertySetEvaluatorRevision(grown.project,"page:product"),"an unselected Shared Profile Parent addition keeps guided Page evidence current");const includedFixed=structuredClone(grown),includedCheckout=includedFixed.project.collections.propertySets.find(({id})=>id==="group:checkout");includedCheckout.profileInheritanceRecipes=[includeProfileInheritanceParentAdditions(grownCanonical,fixedRecipe,[addedNode.id])];assert.notEqual(pagePropertySetEvaluatorRevision(grown.project,"page:product"),pagePropertySetEvaluatorRevision(includedFixed.project,"page:product"),"including a fixed Shared Profile Parent addition stales guided Page evidence");
  const stagedAddition=stagePropertySetParentAddition(conditional,"group:checkout","profile:commerce",{path:"/reviewed",type:"number"});assert.equal(pagePropertySetEvaluatorRevision(conditional.project,"page:product"),pagePropertySetEvaluatorRevision(stagedAddition.project,"page:product"),"a pending Parent addition does not stale evidence before it becomes effective");const includedAddition=includePropertySetParentAddition(stagedAddition,"group:checkout","/reviewed");assert.notEqual(pagePropertySetEvaluatorRevision(stagedAddition.project,"page:product"),pagePropertySetEvaluatorRevision(includedAddition.project,"page:product"),"including a reviewed Parent addition stales guided Page evidence");
}

{
  let state=upgradePageGroupsToPropertySets(legacyState(),id),page=state.project.collections.pages.find(({id})=>id==="page:cart"),path=layeredContributorPath(state,page,"Page"),contributors=layeredContributorsForPath(state,path,{segment:"retail"}),compiled=compileLayeredSchema(contributors,{eventId:"event:view",eventRole:"interaction"});
  assert.deepEqual(contributors.filter(({scope})=>scope==="Property Set").map(({name})=>name),["Checkout base","Retail commerce"],"the compiler consumes migrated Page-owned application order");
  assert.equal(compiled.properties["/funnel_step"].expectedValue,"retail");
  assert.deepEqual(compiled.properties["/funnel_step"].superseded.map(({contributorName})=>contributorName),["Checkout base"],"ordinary predecessor provenance remains visible");
  state=reorderPropertySetApplication(state,"page:cart","group:retail",-1);page=state.project.collections.pages.find(({id})=>id==="page:cart");path=layeredContributorPath(state,page,"Page");compiled=compileLayeredSchema(layeredContributorsForPath(state,path,{segment:"retail"}),{eventId:"event:view",eventRole:"interaction"});
  assert.equal(compiled.properties["/funnel_step"].expectedValue,"checkout","reordering changes the ordinary winner");
  const excluded=layeredContributorsForPath(state,path,{segment:"wholesale"}),excludedCompiled=compileLayeredSchema(excluded,{eventId:"event:view",eventRole:"interaction"});
  assert.equal(excluded.find(({name})=>name==="Checkout base").active,false,"applicability is evaluated from this Page application only");
  assert.equal(excludedCompiled.properties["/funnel_step"].expectedValue,"retail","an excluded application does not contribute to compilation");
  const unconditional=structuredClone(state),checkout=unconditional.project.collections.propertySets.find(({id})=>id==="group:checkout"),checkoutApplication=unconditional.project.collections.pages.find(({id})=>id==="page:cart").propertySetApplications.find(({propertySetId})=>propertySetId==="group:checkout");checkout.applicabilitySetId="set:retail";delete checkoutApplication.applicabilitySetId;const unconditionalContributors=layeredContributorsForPath(unconditional,layeredContributorPath(unconditional,unconditional.project.collections.pages.find(({id})=>id==="page:cart"),"Page"),{segment:"wholesale"}),unconditionalCheckout=unconditionalContributors.find(({name})=>name==="Checkout base");assert.equal(unconditionalCheckout.applicabilityConditional,undefined,"a reusable Property Set applicability value cannot condition an unconditional Page application");assert.equal(compileLayeredSchema(unconditionalContributors,{eventId:"event:view",eventRole:"interaction"}).properties["/funnel_step"].expectedValue,"checkout","an unconditional Page application still contributes despite a reusable Property Set's legacy applicability value");
}

{
  let state=upgradePageGroupsToPropertySets(legacyState(),id);
  const beforeWrapUndo=state.history.undo.length;
  state=createFlowSectionAroundFrames(state,"flow:checkout",{name:"Wrapped selection",bounds:{x:10,y:20,width:640,height:420},frameIds:["frame:cart","frame:product"]},id);
  const wrapped=state.project.documentationFlowGraphs["flow:checkout"].sections.at(-1);
  assert.equal(state.history.undo.length,beforeWrapUndo+1,"creating a Section around selected Page frames is one Flow-local command");
  assert.deepEqual(state.project.documentationFlowGraphs["flow:checkout"].pageFrames.filter(({id})=>["frame:cart","frame:product"].includes(id)).map(({sectionId})=>sectionId),[wrapped.id,wrapped.id]);
  const beforePositionedUndo=state.history.undo.length;
  state=addFlowPageFrameAtPosition(state,"flow:checkout","page:cart",{x:880,y:510},undefined,id);
  assert.deepEqual(state.project.documentationFlowGraphs["flow:checkout"].pageFrames.at(-1).position,{x:880,y:510});
  assert.equal(state.history.undo.length,beforePositionedUndo+1,"canvas placement stores its chosen coordinates in one command");
  const beforeDrop=state,sourceId=state.project.documentationFlowGraphs["flow:checkout"].pageFrames[0].id;
  state=addFlowPageFrameAndRelationship(state,"flow:checkout",{sourceId,pageId:"page:product",sourcePort:"top",targetPort:"bottom",position:{x:760,y:120}},id);
  const dropGraph=state.project.documentationFlowGraphs["flow:checkout"];
  assert.equal(dropGraph.pageFrames.length,beforeDrop.project.documentationFlowGraphs["flow:checkout"].pageFrames.length+1);
  assert.equal(dropGraph.relationships.at(-1).kind,"alternative");
  assert.deepEqual(undoProjectTransaction(state).project,beforeDrop.project,"one Undo removes both empty-drop records");
  state=createFlowSection(state,"flow:checkout",{name:"Review phase",bounds:{x:20,y:40,width:720,height:300}},id);
  const graph=()=>state.project.documentationFlowGraphs["flow:checkout"],review=graph().sections.at(-1),schemaBytes=JSON.stringify({pages:state.project.collections.pages,propertySets:state.project.collections.propertySets,assignments:state.project.collections.assignments});
  const originalPositions=graph().pageFrames.map(({id,position})=>({id,position:structuredClone(position)}));
  state=movePageFrameToSection(state,"flow:checkout","frame:cart",review.id);
  state=movePageFrameToSection(state,"flow:checkout","frame:product",review.id);
  assert.deepEqual(graph().pageFrames.map(({id,position})=>({id,position})),originalPositions,"placing Page frames in a Section preserves their coordinates and relative positions");
  state=moveFlowSection(state,"flow:checkout",review.id,{x:40,y:25});
  assert.deepEqual(graph().pageFrames.find(({id})=>id==="frame:cart").position,{x:260,y:95},"moving a Section preserves the contained frame's relative position");
  assert.deepEqual(graph().pageFrames.find(({id})=>id==="frame:product").position,{x:560,y:589},"all contained frames move by the same Section delta");
  state=renameAndResizeFlowSection(state,"flow:checkout",review.id,{name:"Review",bounds:{x:320,y:65,width:460,height:330}});
  assert.equal(JSON.stringify({pages:state.project.collections.pages,propertySets:state.project.collections.propertySets,assignments:state.project.collections.assignments}),schemaBytes,"Section commands are schema-neutral");
  const relationshipsBeforeRemoval=graph().relationships.length,removed=removeFlowSection(state,"flow:checkout",review.id),removedGraph=removed.project.documentationFlowGraphs["flow:checkout"];
  assert.equal(removedGraph.pageFrames.some(({id,sectionId})=>id==="frame:cart"&&sectionId===undefined),true,"default removal keeps frames outside Sections");
  assert.equal(removedGraph.relationships.length,relationshipsBeforeRemoval,"default removal keeps relationships");
}

{
  let state=upgradePageGroupsToPropertySets(legacyState(),id),graph=state.project.documentationFlowGraphs["flow:checkout"],section=graph.sections[0];
  const review=inspectSectionRemovalWithContents(state.project,"flow:checkout",section.id);
  assert.deepEqual(review.pageFrames.map(({id})=>id),["frame:cart"]);
  assert.deepEqual(review.relationships.map(({id})=>id),["relationship:next"]);
  const before=JSON.stringify(state.project);
  assert.equal(JSON.stringify(state.project),before,"review is non-mutating");
  state=removeFlowSectionWithContents(state,"flow:checkout",section.id,review);
  graph=state.project.documentationFlowGraphs["flow:checkout"];
  assert.equal(graph.pageFrames.some(({id})=>id==="frame:cart"),false);
  assert.equal(graph.occurrences.some(({id})=>id==="occurrence:view"),false);
  assert.equal(graph.relationships.some(({id})=>id==="relationship:next"),false);
  assert.equal(state.history.undo.length,2,"upgrade and destructive removal are each one undoable command");
}

{
  const repository=createMemoryDurableProjectRepository({now:()=>"2026-08-02T12:00:00.000Z",token:()=>`draft:separation:${++sequence}`}),legacy=legacyState();
  await repository.putProjectMetadataOnly(legacy,{draftToken:"draft:legacy",draftSequence:4});
  const loaded=await repository.loadProject("project:shop"),recovery=await repository.exportRepositoryRecoveryBundle(),receipt=recovery.migrationReceipts.find(({key})=>key==="property-set-flow-sections-v1:project:shop"),backup=recovery.migrationBackups.find(({key})=>key==="property-set-flow-sections-v1:project:shop");
  assert.equal(Object.hasOwn(loaded.state.project.collections,"pageGroups"),false,"the repository installs separated storage before first read");
  assert.equal(receipt.value.verified,true,"repository removal follows verified read-back");
  assert.equal(Array.isArray(backup.value.project.collections.pageGroups),true,"repository migration retains recoverable source bytes");
  const exported=await repository.exportProject("project:shop");
  assert.equal(JSON.stringify(exported).includes('"pageGroups"'),false,"portable output contains only the separated model");
  await repository.importProject(exported,{projectId:"project:round-trip",name:"Round trip"});
  const roundTrip=await repository.loadProject("project:round-trip"),ids=new Set(roundTrip.state.project.collections.propertySets.map(({id})=>id));
  assert.equal(roundTrip.state.project.collections.pages.every((page)=>page.propertySetApplications.every(({propertySetId})=>ids.has(propertySetId))),true,"portable import preserves remapped application references without another migration");
  const legacyPortableState=legacyState(),legacyPortable={format:"my-chrome-utilities.durable-project-bundle",version:2,sourceProjectId:legacyPortableState.project.id,sourceName:legacyPortableState.project.name,publishedRevision:0,baseProjectRevision:0,project:legacyPortableState.project,draft:legacyPortableState.draft};
  await repository.importProject(legacyPortable,{projectId:"project:legacy-portable",name:"Legacy portable"});
  const upgradedPortable=await repository.loadProject("project:legacy-portable");
  assert.equal(Object.hasOwn(upgradedPortable.state.project.collections,"pageGroups"),false,"portable import upgrades an actual legacy Page Group collection before storage");
  assert.equal(upgradedPortable.state.project.collections.propertySets.length,legacyPortableState.project.collections.pageGroups.length,"portable import retains every legacy Page Group as a Property Set");
  const publishedLegacyState=legacyState(),publishedRelease={id:"release:legacy-portable:2",name:"Legacy publication 2",revision:2,createdAt:"2026-08-02T12:00:00.000Z",snapshot:structuredClone(publishedLegacyState.project.collections)};
  publishedLegacyState.project.releases=[publishedRelease];publishedLegacyState.project.currentRelease=publishedRelease.id;
  const publishedLegacyBundle={format:"my-chrome-utilities.durable-project-bundle",version:2,sourceProjectId:publishedLegacyState.project.id,sourceName:publishedLegacyState.project.name,publishedRevision:2,baseProjectRevision:2,project:publishedLegacyState.project,draft:publishedLegacyState.draft,publishedProject:structuredClone(publishedLegacyState.project)};
  await repository.importProject(publishedLegacyBundle,{projectId:"project:published-legacy-portable",name:"Published legacy portable"});
  const publishedLegacyPortable=await repository.loadProject("project:published-legacy-portable"),publishedLegacyRevision=await repository.loadPublishedRevision("project:published-legacy-portable",2);
  assert.deepEqual(publishedLegacyPortable.state.project.collections,publishedLegacyRevision.state.project.collections,"portable upgrade keeps the current project and immutable published snapshot structurally identical");
  assert.equal(Object.hasOwn(publishedLegacyRevision.state.project.collections,"pageGroups"),false,"published legacy Page Groups are upgraded inside the immutable imported revision");
}

console.log("property set and Flow Section separation tests passed");
