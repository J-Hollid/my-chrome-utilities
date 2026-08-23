import assert from "node:assert/strict";
import {documentaryFlowGraph,projectFlowGraph,renameFlowPageFrame,resetFlowPageFrameName,saveGraphRelationship} from "../dist/data-layer-flow-graph.js";
import {addFlowPageFrameToSection,createFlowSection} from "../dist/data-layer-property-set-flow-section.js";
import {flowDocumentationSnapshotFromState} from "../dist/data-layer-flow-table-documentation-export-ui.js";
import {contextualPropertyExclusionAssessment,excludeFlowPageInstanceInheritedProperty,flowPageFrameContributor,layeredContributorPath,layeredContributorsForPath,resetFlowPageInstanceLocalProperty,saveFlowPageInstanceLocalFacets} from "../dist/data-layer-layered-schema-project.js";
import {compileLayeredSchema} from "../dist/data-layer-layered-schema.js";
import {addProjectEntity,createSpecificationProject,transactProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:page-instance-${++sequence}`;
let state=createSpecificationProject({name:"Shop",site:"shop.example",id});
const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);};
const profile=add("profiles",{name:"Commerce",schemaConstraints:[{path:"/currency",type:"string",expectedValue:"EUR"}]}),checkout=add("propertySets",{name:"Checkout",schemaConstraints:[{path:"/funnel",type:"string",expectedValue:"checkout"}]}),decision=add("pages",{name:"Decision",pageGroupIds:[checkout.id],propertySetApplications:[{propertySetId:checkout.id}],profileIds:[profile.id]}),confirmation=add("pages",{name:"Confirmation",pageGroupIds:[checkout.id],propertySetApplications:[{propertySetId:checkout.id}],profileIds:[profile.id],schemaConstraints:[{path:"/confirmation_status",type:"string",expectedValue:"pending",enforcement:"overridable"},{path:"/page_type",type:"string",expectedValue:"confirmation"}]}),flow=add("flows",{name:"Checkout journey",purpose:"Document branches",steps:[]});
state=createFlowSection(state,flow.id,{name:"Checkout",bounds:{x:20,y:20,width:1000,height:300}},id);
const sectionId=documentaryFlowGraph(state.project,flow.id).sections[0].id;
state=addFlowPageFrameToSection(state,flow.id,decision.id,sectionId,id);
for(const _ of[300,540,780])state=addFlowPageFrameToSection(state,flow.id,confirmation.id,sectionId,id);
const graph=documentaryFlowGraph(state.project,flow.id),decisionFrame=graph.pageFrames.find(({pageId})=>pageId===decision.id),instances=graph.pageFrames.filter(({pageId})=>pageId===confirmation.id);
assert.equal(instances.length,3,"every catalog insertion creates another Page instance in the same lane");
assert.equal(new Set(instances.map(({id})=>id)).size,3,"repeated Page instances own distinct stable frame and contributor IDs");
assert.ok(instances.every(({pageId,sectionId:storedSectionId})=>pageId===confirmation.id&&storedSectionId===sectionId),"instances retain their shared Page reference and independent Flow Section placement");
assert.deepEqual(projectFlowGraph(state.project,flow.id).graph.connectionEndpoints.filter(({pageId})=>pageId===confirmation.id).map(({name})=>name),["Confirmation","Confirmation","Confirmation"],"repeated Page instances initially use the Page name without generated suffixes");
const unnamedDocumentation=flowDocumentationSnapshotFromState(state,flow.id,"2026-08-03T00:00:00.000Z");

const names=["Approved confirmation","Review confirmation","Declined confirmation"];
for(const [index,name] of names.entries())state=renameFlowPageFrame(state,flow.id,instances[index].id,name);
assert.deepEqual(documentaryFlowGraph(state.project,flow.id).pageFrames.filter(({pageId})=>pageId===confirmation.id).map(({nameInFlow})=>nameInFlow),names,"each Flow Page instance stores only its independent non-empty Flow name");
assert.deepEqual(projectFlowGraph(state.project,flow.id).graph.connectionEndpoints.filter(({pageId})=>pageId===confirmation.id).map(({name})=>name),names,"canvas, outline, relationships, and contextual projections share effective Flow names");
assert.notEqual(flowDocumentationSnapshotFromState(state,flow.id,"2026-08-03T00:00:00.000Z").graphRevision,unnamedDocumentation.graphRevision,"naming a Flow Page instance makes the Flow documentation snapshot stale");
const renamedFrameBytes=Object.fromEntries(documentaryFlowGraph(state.project,flow.id).pageFrames.map((frame)=>[frame.id,JSON.stringify({...frame,nameInFlow:undefined})]));
state=transactProject(state,"Rename source Page",(project)=>({...project,collections:{...project.collections,pages:project.collections.pages.map((page)=>page.id===confirmation.id?{...page,name:"Reusable confirmation Page"}:page)}}));
assert.deepEqual(projectFlowGraph(state.project,flow.id).graph.connectionEndpoints.filter(({pageId})=>pageId===confirmation.id).map(({name})=>name),names,"Flow-specific names remain stable when the source Page is renamed");
assert.deepEqual(documentaryFlowGraph(state.project,flow.id).pageFrames.filter(({pageId})=>pageId===confirmation.id).map((frame)=>JSON.stringify({...frame,nameInFlow:undefined})),instances.map(({id})=>renamedFrameBytes[id]),"naming never changes frame identity, Page reference, placement, schema contribution, or configured values");
const beforeReset=state,undoCount=state.history.undo.length;
state=resetFlowPageFrameName(state,flow.id,instances[1].id);
assert.deepEqual(projectFlowGraph(state.project,flow.id).graph.connectionEndpoints.filter(({pageId})=>pageId===confirmation.id).map(({name})=>name),[names[0],"Reusable confirmation Page",names[2]],"reset removes only one Flow-specific name and resumes the current Page name");
assert.equal(state.history.undo.length,undoCount+1,"a naming reset creates one Undo action");
assert.match(state.history.undo.at(-1).label,/Reset Flow Page frame name/);
assert.deepEqual(undoProjectTransaction(state).project,beforeReset.project,"one Undo restores the exact Flow-specific name");

for(const instance of instances)state=saveGraphRelationship(state,flow.id,decisionFrame.id,{toStepId:instance.id,sourcePort:"top",targetPort:"bottom"},id);
assert.deepEqual(documentaryFlowGraph(state.project,flow.id).relationships.map(({targetEndpoint,kind})=>({targetEndpoint,kind})),instances.map(({id})=>({targetEndpoint:{kind:"page-frame",id},kind:"alternative"})),"alternative relationships target distinct frame identities");

const pageBytes=JSON.stringify(state.project.collections.pages.find(({id})=>id===confirmation.id)),beforeFrames=Object.fromEntries(documentaryFlowGraph(state.project,flow.id).pageFrames.map((frame)=>[frame.id,JSON.stringify(frame)]));
for(const[instance,value]of instances.map((instance,index)=>[instance,["approved","manual_review","declined"][index]])){
  state=saveFlowPageInstanceLocalFacets(state,flow.id,instance.id,"/confirmation_status",{expectedValue:value});
  assert.equal(JSON.stringify(state.project.collections.pages.find(({id})=>id===confirmation.id)),pageBytes,"an instance save leaves canonical Page bytes unchanged");
  for(const sibling of instances.filter(({id})=>id!==instance.id))assert.equal(JSON.stringify(documentaryFlowGraph(state.project,flow.id).pageFrames.find(({id})=>id===sibling.id)),beforeFrames[sibling.id],"an instance save leaves unrelated sibling bytes unchanged");
  beforeFrames[instance.id]=JSON.stringify(documentaryFlowGraph(state.project,flow.id).pageFrames.find(({id})=>id===instance.id));
}
const effective=(instance)=>{const contributor=flowPageFrameContributor(state,flow.id,instance.id),path=layeredContributorPath(state,contributor,"Flow Page-instance",flow.id),contributors=layeredContributorsForPath(state,path);return{contributors,compiled:compileLayeredSchema(contributors,{eventId:instance.id,eventRole:"interaction",occurrenceId:instance.id})};};
assert.deepEqual(effective(instances[0]).contributors.map(({scope})=>scope),["Shared Profile","Property Set","Page","Flow Page-instance"],"instances compose the canonical Page branch in order");
assert.deepEqual(instances.map((instance)=>effective(instance).compiled.properties["/confirmation_status"].expectedValue),["approved","manual_review","declined"],"each instance compiles its own override");
assert.ok(instances.every((instance)=>effective(instance).compiled.properties["/currency"].expectedValue==="EUR"&&effective(instance).compiled.properties["/page_type"].expectedValue==="confirmation"),"all other inherited properties remain effective");

state=resetFlowPageInstanceLocalProperty(state,flow.id,instances[1].id,"/confirmation_status");
assert.deepEqual(instances.map((instance)=>effective(instance).compiled.properties["/confirmation_status"].expectedValue),["approved","pending","declined"],"Reset to parents deletes one local facet without changing siblings");
assert.deepEqual(documentaryFlowGraph(state.project,flow.id).pageFrames.find(({id})=>id===instances[1].id).localSchemaContributions,[],"reset removes the sparse local property contribution");

const exclusionPropertyId="property:customer-status";
state=transactProject(state,"Add inherited exclusion fixture",(project)=>({...project,collections:{...project.collections,
  profiles:project.collections.profiles.map((candidate)=>candidate.id===profile.id?{...candidate,schemaConstraints:[...candidate.schemaConstraints,{path:"/customer_status",definitionId:exclusionPropertyId,type:"string",documentation:"Sitewide customer"}]}:candidate),
  propertySets:project.collections.propertySets.map((candidate)=>candidate.id===checkout.id?{...candidate,schemaConstraints:[...candidate.schemaConstraints,{path:"/customer_status",definitionId:exclusionPropertyId,documentation:"Checkout customer"}]}:candidate),
  pages:project.collections.pages.map((candidate)=>candidate.id===confirmation.id?{...candidate,schemaConstraints:[...candidate.schemaConstraints,{path:"/customer_status",definitionId:exclusionPropertyId,examples:["shipping"]}]}:candidate),
}}));
const exclusionFrame=instances[0];
state=saveFlowPageInstanceLocalFacets(state,flow.id,exclusionFrame.id,"/customer_status",{documentation:"Instance-only customer note"});
const sourceHashes=JSON.stringify({profile:state.project.collections.profiles.find(({id})=>id===profile.id),group:state.project.collections.propertySets.find(({id})=>id===checkout.id),page:state.project.collections.pages.find(({id})=>id===confirmation.id),sibling:documentaryFlowGraph(state.project,flow.id).pageFrames.find(({id})=>id===instances[1].id)}),exclusionBefore=state;
assert.equal(effective(exclusionFrame).compiled.properties["/customer_status"].documentation,"Instance-only customer note","the exclusion fixture starts with an effective sparse local facet");
const exclusionAssessment=contextualPropertyExclusionAssessment(effective(exclusionFrame).compiled,"/customer_status");
assert.deepEqual(exclusionAssessment,{allowed:true,propertyId:exclusionPropertyId,descendantPaths:[],affectedPaths:["/customer_status"]},"an ordinary inherited stable property is directly excludable without structural ownership");
state=excludeFlowPageInstanceInheritedProperty(state,flow.id,exclusionFrame.id,exclusionAssessment.propertyId,"/customer_status");
const excludedFrame=documentaryFlowGraph(state.project,flow.id).pageFrames.find(({id})=>id===exclusionFrame.id);
assert.deepEqual(excludedFrame.excludedPropertyIds,[exclusionPropertyId],"the Page instance stores one sparse stable-identity exclusion");
assert.equal(excludedFrame.localSchemaContributions?.some(({path})=>path==="/customer_status"),false,"the exclusion stores no copied parent definition");
assert.equal(effective(exclusionFrame).compiled.properties["/customer_status"],undefined,"the exclusion applies after the complete Page parent stack composes");
assert.ok(effective(instances[1]).compiled.properties["/customer_status"],"a sibling Page instance retains the inherited property");
assert.equal(JSON.stringify({profile:state.project.collections.profiles.find(({id})=>id===profile.id),group:state.project.collections.propertySets.find(({id})=>id===checkout.id),page:state.project.collections.pages.find(({id})=>id===confirmation.id),sibling:documentaryFlowGraph(state.project,flow.id).pageFrames.find(({id})=>id===instances[1].id)}),sourceHashes,"exclusion leaves every source and sibling byte unchanged");
state=undoProjectTransaction(state);
assert.deepEqual(state.project,exclusionBefore.project,"one Undo removes the exclusion and restores the exact local facet plus live inherited definition");
const protectedCompiled=compileLayeredSchema([{id:"profile:protected",name:"Protected",scope:"Shared Profile",constraints:[{path:"/protected",definitionId:"property:protected",type:"string",enforcement:"invariant"}]}],{eventId:"pageview",eventRole:"context"});
assert.deepEqual(contextualPropertyExclusionAssessment(protectedCompiled,"/protected"),{allowed:false,propertyId:"property:protected",blocker:"Protected protects /protected as an invariant.",repairRoute:"Open Protected and repair the invariant at its source."},"an invariant exposes its named source blocker and repair route instead of an exclusion command");
const dependencyCompiled=compileLayeredSchema([{id:"profile:dependency",name:"Dependency source",scope:"Shared Profile",constraints:[{path:"/required",definitionId:"property:required",type:"string"},{path:"/consumer",definitionId:"property:consumer",type:"string",rules:[{id:"rule:requires-property",kind:"conditional",dependencyPropertyId:"property:required"}]}]}],{eventId:"pageview",eventRole:"context"});
assert.deepEqual(contextualPropertyExclusionAssessment(dependencyCompiled,"/required"),{allowed:false,propertyId:"property:required",blocker:"Dependency source depends on /required.",repairRoute:"Open Dependency source and repair the required dependency."},"a surviving rule dependency names its source and repair route instead of exposing an exclusion command");

const snapshot=flowDocumentationSnapshotFromState(state,flow.id,"2026-07-22T00:00:00.000Z");
const confirmationContexts=snapshot.contexts.filter(({sourcePageName})=>sourcePageName==="Reusable confirmation Page");
assert.deepEqual(confirmationContexts.map(({pageFrameId})=>pageFrameId),instances.map(({id})=>id),"selected-Flow documentation distinguishes repeated frames");
assert.deepEqual(confirmationContexts.map(({compiled})=>compiled.properties["/confirmation_status"].expectedValue),["approved","pending","declined"],"documentation renders each instance's effective value");
assert.deepEqual(confirmationContexts.map(({pageName})=>pageName),[names[0],"Reusable confirmation Page",names[2]],"documentation headings use each effective Flow name while retaining source Page provenance");

console.log("Flow Page-instance tests passed");
