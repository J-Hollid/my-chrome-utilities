import assert from "node:assert/strict";
import {addFlowPageFrame,documentaryFlowGraph,saveGraphRelationship,setFlowPageGroupLanes} from "../dist/data-layer-flow-graph.js";
import {flowDocumentationSnapshotFromState} from "../dist/data-layer-flow-table-documentation-export-ui.js";
import {flowPageFrameContributor,layeredContributorPath,layeredContributorsForPath,resetFlowPageInstanceLocalProperty,saveFlowPageInstanceLocalFacets} from "../dist/data-layer-layered-schema-project.js";
import {compileLayeredSchema} from "../dist/data-layer-layered-schema.js";
import {addProjectEntity,createSpecificationProject} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:page-instance-${++sequence}`;
let state=createSpecificationProject({name:"Shop",site:"shop.example",id});
const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);};
const profile=add("profiles",{name:"Commerce",schemaConstraints:[{path:"/currency",type:"string",expectedValue:"EUR"}]}),checkout=add("pageGroups",{name:"Checkout",schemaConstraints:[{path:"/funnel",type:"string",expectedValue:"checkout"}]}),decision=add("pages",{name:"Decision",pageGroupIds:[checkout.id],profileIds:[profile.id]}),confirmation=add("pages",{name:"Confirmation",pageGroupIds:[checkout.id],profileIds:[profile.id],schemaConstraints:[{path:"/confirmation_status",type:"string",expectedValue:"pending",enforcement:"overridable"},{path:"/page_type",type:"string",expectedValue:"confirmation"}]}),flow=add("flows",{name:"Checkout journey",purpose:"Document branches",steps:[]});
state=setFlowPageGroupLanes(state,flow.id,[checkout.id]);
state=addFlowPageFrame(state,flow.id,{pageId:decision.id,pageGroupId:checkout.id,x:40,y:40},id);
for(const x of[300,540,780])state=addFlowPageFrame(state,flow.id,{pageId:confirmation.id,pageGroupId:checkout.id,x,y:40},id);
const graph=documentaryFlowGraph(state.project,flow.id),decisionFrame=graph.pageFrames.find(({pageId})=>pageId===decision.id),instances=graph.pageFrames.filter(({pageId})=>pageId===confirmation.id);
assert.equal(instances.length,3,"every catalog insertion creates another Page instance in the same lane");
assert.equal(new Set(instances.map(({id})=>id)).size,3,"repeated Page instances own distinct stable frame and contributor IDs");
assert.ok(instances.every(({pageId,pageGroupId})=>pageId===confirmation.id&&pageGroupId===checkout.id),"instances retain shared Page and eligible placement-group references");

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
assert.deepEqual(effective(instances[0]).contributors.map(({scope})=>scope),["Shared Profile","Page Group","Page","Flow Page-instance"],"instances compose the canonical Page branch in order");
assert.deepEqual(instances.map((instance)=>effective(instance).compiled.properties["/confirmation_status"].expectedValue),["approved","manual_review","declined"],"each instance compiles its own override");
assert.ok(instances.every((instance)=>effective(instance).compiled.properties["/currency"].expectedValue==="EUR"&&effective(instance).compiled.properties["/page_type"].expectedValue==="confirmation"),"all other inherited properties remain effective");

state=resetFlowPageInstanceLocalProperty(state,flow.id,instances[1].id,"/confirmation_status");
assert.deepEqual(instances.map((instance)=>effective(instance).compiled.properties["/confirmation_status"].expectedValue),["approved","pending","declined"],"Reset to parents deletes one local facet without changing siblings");
assert.deepEqual(documentaryFlowGraph(state.project,flow.id).pageFrames.find(({id})=>id===instances[1].id).localSchemaContributions,[],"reset removes the sparse local property contribution");

const snapshot=flowDocumentationSnapshotFromState(state,flow.id,"2026-07-22T00:00:00.000Z");
const confirmationContexts=snapshot.contexts.filter(({pageName})=>pageName==="Confirmation");
assert.deepEqual(confirmationContexts.map(({pageFrameId})=>pageFrameId),instances.map(({id})=>id),"selected-Flow documentation distinguishes repeated frames");
assert.deepEqual(confirmationContexts.map(({compiled})=>compiled.properties["/confirmation_status"].expectedValue),["approved","pending","declined"],"documentation renders each instance's effective value");

console.log("Flow Page-instance tests passed");
