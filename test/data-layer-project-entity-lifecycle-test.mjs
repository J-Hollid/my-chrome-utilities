import assert from "node:assert/strict";
import {createSpecificationProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";
import {createProjectCollectionEntity,hasCanonicalProfileOverviewActions,inspectProjectEntityRemoval,projectCollectionCreationFields,projectCollectionDefinitions,projectEntityWorkspaceRoute,projectInspectorTogglePresentation,removeProjectCollectionEntity} from "../dist/data-layer-project-entity-lifecycle.js";

let sequence=0;const id=(kind)=>`${kind}:lifecycle:${sequence++}`;
let state=createSpecificationProject({name:"Retail website",site:"retail.example.com",id});
const examples={profiles:"Sitewide",pageGroups:"Checkout",pages:"Cart",events:"Purchase",applicabilitySets:"Retail checkout",flows:"Checkout journey",schemaDrafts:"Purchase payload",assignments:"Retail Purchase",fixtures:"Valid purchase"};
for(const [kind,name] of Object.entries(examples))state=createProjectCollectionEntity(state,kind,name,id);
for(const [kind,name] of Object.entries(examples)){const entities=state.project.collections[kind];assert.equal(entities.length,1,`${kind} has one entity`);assert.equal(entities[0].name,name);assert.match(projectCollectionDefinitions[kind].addAction,/^Add /);}
for(const [kind,name] of Object.entries(examples)){const definition=projectCollectionDefinitions[kind],entity=state.project.collections[kind][0];assert.deepEqual(projectEntityWorkspaceRoute(kind,entity.id,name),{kind,entityId:entity.id,heading:`${definition.singular}: ${name}`,label:`${definition.singular} workspace for ${name}`,backAction:`Back to ${definition.overview}`});}
assert.deepEqual(state.project.collections.flows[0].steps,[],"Add Flow starts a documentary canvas without executable steps");
const expectedCreationFields={profiles:["Profile purpose"],pageGroups:["Membership matcher"],pages:["Path matcher","Page Groups"],events:["Canonical event name","Documentary role"],applicabilitySets:["Priority","Fallback"],flows:["Correlation field"],fixtures:["Fixture mode","Event","Page","Flow","Release policy"],schemaDrafts:["Schema description"],assignments:["Schema","Event","Applicability Set","Priority","Version policy"]};
for(const [kind,labels] of Object.entries(expectedCreationFields))assert.deepEqual(projectCollectionCreationFields[kind].map(({label})=>label),labels,`${kind} exposes type-specific creation fields`);
const configuredPageState=createProjectCollectionEntity(state,"pages","Product detail",id,{pathname:"/products/:product_id",pageGroupIds:[state.project.collections.pageGroups[0].id]}),configuredPage=configuredPageState.project.collections.pages.find(({name})=>name==="Product detail");
assert.equal(configuredPage.pathname,"/products/:product_id");assert.deepEqual(configuredPage.pageGroupIds,[state.project.collections.pageGroups[0].id]);
const configuredEventState=createProjectCollectionEntity(state,"events","Route view",id,{eventName:"route_view",role:"context-setting"}),configuredEvent=configuredEventState.project.collections.events.find(({name})=>name==="Route view");
assert.equal(configuredEvent.eventName,"route_view");assert.equal(configuredEvent.role,"context-setting");
const configuredAssignmentState=createProjectCollectionEntity(configuredEventState,"assignments","Route assignment",id,{schemaDraftId:state.project.collections.schemaDrafts[0].id,eventId:configuredEvent.id,applicabilitySetId:state.project.collections.applicabilitySets[0].id,priority:25,versionPolicy:"pinned"}),configuredAssignment=configuredAssignmentState.project.collections.assignments.find(({name})=>name==="Route assignment");
assert.equal(configuredAssignment.eventName,"route_view");assert.equal(configuredAssignment.schemaId,state.project.collections.schemaDrafts[0].id);assert.equal(configuredAssignment.priority,25);assert.equal(configuredAssignment.versionPolicy,"pinned");
assert.equal(hasCanonicalProfileOverviewActions("profiles",undefined),true,"Shared Profiles overview retains canonical create and adoption actions");
assert.equal(hasCanonicalProfileOverviewActions("profiles",state.project.collections.profiles[0].id),false,"an open profile uses its canonical editor instead of overview actions");
assert.equal(hasCanonicalProfileOverviewActions("pages",undefined),false,"other collection overviews do not mount Shared Profile actions");
assert.deepEqual(projectInspectorTogglePresentation(true),{label:"Hide Inspector",expanded:"true"});
assert.deepEqual(projectInspectorTogglePresentation(false),{label:"Show Inspector",expanded:"false"});
const landingState=createProjectCollectionEntity(state,"pages","Landing",id),landing=landingState.project.collections.pages.find(({name})=>name==="Landing"),review=inspectProjectEntityRemoval(landingState,"pages",landing.id);
assert.equal(review.blocked,false);assert.match(review.summary,/one Page removal · 0 dependent references/);
const removed=removeProjectCollectionEntity(landingState,"pages",landing.id);assert.equal(removed.project.collections.pages.some(({id:entityId})=>entityId===landing.id),false);
const restored=undoProjectTransaction(removed);assert.equal(restored.project.collections.pages.find(({name})=>name==="Landing").id,landing.id,"Undo restores the same identity");
const purchase=state.project.collections.events[0],checkoutJourney=state.project.collections.flows[0],referencedState={...state,project:{...state.project,documentationFlowGraphs:{[checkoutJourney.id]:{occurrences:[{id:"occurrence:purchase",eventId:purchase.id}]}}}},blocked=inspectProjectEntityRemoval(referencedState,"events",purchase.id);assert.equal(blocked.blocked,true);assert.deepEqual(new Set(blocked.dependencies.map(({name})=>name)),new Set(["Checkout journey","Retail Purchase","Valid purchase"]));assert.throws(()=>removeProjectCollectionEntity(referencedState,"events",purchase.id),/blocked/);
assert.throws(()=>createProjectCollectionEntity(state,"events","purchase",id),/unique/);
console.log("project entity lifecycle unit tests passed");
