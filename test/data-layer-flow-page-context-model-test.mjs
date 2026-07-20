import assert from "node:assert/strict";
import {
  addEventOccurrenceToPage,
  addFlowPageFrame,
  addFreePageFrame,
  documentaryFlowGraph,
  migrateLegacyFlowContextBindings,
  reviewLegacyFlowContextMigration,
  setFlowPageGroupLanes,
} from "../dist/data-layer-flow-graph.js";
import {addProjectEntity,createSpecificationProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:page-context-${++sequence}`;
let state=createSpecificationProject({name:"Page context shop",site:"shop.example",id});
const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);};
const pageView=add("events",{name:"page_view",eventName:"page_view",role:"context-setting"});
const routeView=add("events",{name:"route_view",eventName:"route_view",role:"context-setting"});
const cart=add("pages",{name:"Cart"}),landing=add("pages",{name:"Landing"}),returns=add("pages",{name:"Returns"});
const checkout=add("pageGroups",{name:"Checkout",pageIds:[cart.id]});
add("pageGroups",{name:"Support",pageIds:[returns.id]});
const flow=add("flows",{name:"Checkout journey",steps:[]});
state=setFlowPageGroupLanes(state,flow.id,[checkout.id]);
state=addFlowPageFrame(state,flow.id,{pageId:cart.id,pageGroupId:checkout.id,y:90},id);
const cartFrame=documentaryFlowGraph(state.project,flow.id).pageFrames[0];

state=addEventOccurrenceToPage(state,flow.id,{name:"page_view",pageFrameId:cartFrame.id,pageGroupId:checkout.id,pageId:cart.id,eventId:pageView.id,role:"context-setting",trigger:"Initial load",obligation:"Required",minimum:1,maximum:1,y:130},id);
const direct=documentaryFlowGraph(state.project,flow.id).occurrences[0];
assert.deepEqual({pageFrameId:direct.pageFrameId,pageId:direct.pageId,pageGroupId:direct.pageGroupId,eventId:direct.eventId,role:direct.role,trigger:direct.trigger},{pageFrameId:cartFrame.id,pageId:cart.id,pageGroupId:checkout.id,eventId:pageView.id,role:"context-setting",trigger:"Initial load"});
assert.equal("contextBindingId" in direct,false);
assert.equal("contextEventBindings" in state.project.collections.pages.find(({id})=>id===cart.id),false);

state=addFreePageFrame(state,flow.id,{pageId:landing.id,region:"before-lanes",x:24,y:70},id);
const freeFrame=documentaryFlowGraph(state.project,flow.id).pageFrames.find(({pageId})=>pageId===landing.id);
assert.deepEqual({pageId:freeFrame.pageId,freePageRegion:freeFrame.freePageRegion,position:freeFrame.position},{pageId:landing.id,freePageRegion:"before-lanes",position:{x:24,y:70}});
assert.equal("pageGroupId" in freeFrame,false);
assert.equal(documentaryFlowGraph(state.project,flow.id).occurrences.length,1,"a free Page frame is not an Event occurrence");

const beforeGroupedFree=state;
state=addFreePageFrame(state,flow.id,{pageId:returns.id,region:"after-lanes",x:24,y:90},id);
assert.equal(state,beforeGroupedFree,"membership in an unselected Page Group rejects free-frame creation without a transaction");
assert.equal(documentaryFlowGraph(state.project,flow.id).pageFrames.some(({pageId})=>pageId===returns.id),false);

const legacyPage={...state.project.collections.pages.find(({id})=>id===cart.id),contextEventBindings:[{id:"binding:legacy-page",name:"Initial load",eventId:pageView.id,trigger:"initial-load"},{id:"binding:legacy-route",name:"SPA route change",eventId:routeView.id,trigger:"spa-route-change"}]};
const legacyGraph=documentaryFlowGraph(state.project,flow.id),legacyOccurrences=[{...legacyGraph.occurrences[0],eventId:undefined,role:undefined,trigger:undefined,contextBindingId:"binding:legacy-page"},{id:"occurrence:legacy-route",name:"SPA route change",pageFrameId:cartFrame.id,pageGroupId:checkout.id,pageId:cart.id,contextBindingId:"binding:legacy-route",position:{y:235},obligation:"Required",minimum:1,maximum:1,optional:false}];
state={...state,project:{...state.project,collections:{...state.project.collections,pages:state.project.collections.pages.map((page)=>page.id===cart.id?legacyPage:page)},documentationFlowGraphs:{...state.project.documentationFlowGraphs,[flow.id]:{...legacyGraph,occurrences:legacyOccurrences}}}};
const beforeMigration=structuredClone(state.project),review=reviewLegacyFlowContextMigration(state.project,flow.id);
assert.deepEqual(review.items.map(({pageName,eventName,trigger,occurrenceId})=>({pageName,eventName,trigger,occurrenceId})),[{pageName:"Cart",eventName:"page_view",trigger:"initial-load",occurrenceId:direct.id},{pageName:"Cart",eventName:"route_view",trigger:"spa-route-change",occurrenceId:"occurrence:legacy-route"}]);
state=migrateLegacyFlowContextBindings(state,flow.id);
const migrated=documentaryFlowGraph(state.project,flow.id);
assert.deepEqual(migrated.occurrences.map(({id,eventId,role,trigger})=>({id,eventId,role,trigger})),[{id:direct.id,eventId:pageView.id,role:"context-setting",trigger:"initial-load"},{id:"occurrence:legacy-route",eventId:routeView.id,role:"context-setting",trigger:"spa-route-change"}]);
assert.ok(migrated.occurrences.every((item)=>!("contextBindingId" in item)));
assert.ok(state.project.collections.pages.every((page)=>!("contextEventBindings" in page)));
assert.deepEqual(undoProjectTransaction(state).project,beforeMigration);

console.log("Flow Page-context model tests passed");
