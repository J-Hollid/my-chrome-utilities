import assert from "node:assert/strict";
import {createSpecificationProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";
import {createProjectCollectionEntity,hasCanonicalProfileOverviewActions,inspectProjectEntityRemoval,projectCollectionDefinitions,projectInspectorTogglePresentation,removeProjectCollectionEntity} from "../dist/data-layer-project-entity-lifecycle.js";

let sequence=0;const id=(kind)=>`${kind}:lifecycle:${sequence++}`;
let state=createSpecificationProject({name:"Retail website",site:"retail.example.com",id});
const examples={profiles:"Sitewide",pageGroups:"Checkout",pages:"Cart",events:"Purchase",applicabilitySets:"Retail checkout",flows:"Checkout journey",schemaDrafts:"Purchase payload",assignments:"Retail Purchase",fixtures:"Valid purchase"};
for(const [kind,name] of Object.entries(examples))state=createProjectCollectionEntity(state,kind,name,id);
for(const [kind,name] of Object.entries(examples)){const entities=state.project.collections[kind];assert.equal(entities.length,1,`${kind} has one entity`);assert.equal(entities[0].name,name);assert.match(projectCollectionDefinitions[kind].addAction,/^Add /);}
assert.equal(hasCanonicalProfileOverviewActions("profiles",undefined),true,"Shared Profiles overview retains canonical create and adoption actions");
assert.equal(hasCanonicalProfileOverviewActions("profiles",state.project.collections.profiles[0].id),false,"an open profile uses its canonical editor instead of overview actions");
assert.equal(hasCanonicalProfileOverviewActions("pages",undefined),false,"other collection overviews do not mount Shared Profile actions");
assert.deepEqual(projectInspectorTogglePresentation(true),{label:"Hide Inspector",expanded:"true"});
assert.deepEqual(projectInspectorTogglePresentation(false),{label:"Show Inspector",expanded:"false"});
const landingState=createProjectCollectionEntity(state,"pages","Landing",id),landing=landingState.project.collections.pages.find(({name})=>name==="Landing"),review=inspectProjectEntityRemoval(landingState,"pages",landing.id);
assert.equal(review.blocked,false);assert.match(review.summary,/one Page removal · 0 dependent references/);
const removed=removeProjectCollectionEntity(landingState,"pages",landing.id);assert.equal(removed.project.collections.pages.some(({id:entityId})=>entityId===landing.id),false);
const restored=undoProjectTransaction(removed);assert.equal(restored.project.collections.pages.find(({name})=>name==="Landing").id,landing.id,"Undo restores the same identity");
const purchase=state.project.collections.events[0],blocked=inspectProjectEntityRemoval(state,"events",purchase.id);assert.equal(blocked.blocked,true);assert.deepEqual(new Set(blocked.dependencies.map(({name})=>name)),new Set(["Checkout journey","Retail Purchase","Valid purchase"]));assert.throws(()=>removeProjectCollectionEntity(state,"events",purchase.id),/blocked/);
assert.throws(()=>createProjectCollectionEntity(state,"events","purchase",id),/unique/);
console.log("project entity lifecycle unit tests passed");
