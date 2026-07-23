import assert from "node:assert/strict";
import {
  addEventOccurrenceToPage,
  addFlowPageFrame,
  documentaryFlowGraph,
  migrateLegacyFlowContextBindings,
  projectFlowGraph,
  reviewLegacyFlowContextMigration,
  setFlowPageGroupLanes,
} from "../dist/data-layer-flow-graph.js";
import {addProjectEntity,createSpecificationProject} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:fixed-event-${++sequence}`;
let state=createSpecificationProject({name:"Fixed Flow semantics",site:"shop.example",id});
const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);};
const checkout=add("pageGroups",{name:"Checkout"});
const cart=add("pages",{name:"Cart",eventName:"pageview",pageGroupIds:[checkout.id]});
const pageView=add("events",{name:"page_view",eventName:"page_view",role:"context-setting",trigger:"Initial load"});
const flow=add("flows",{name:"Checkout journey",steps:[]});

assert.equal("role" in pageView,false,"new Event definitions do not persist a documentary role");
assert.equal(pageView.trigger,"Initial load","the optional trigger remains descriptive Event metadata");

state=setFlowPageGroupLanes(state,flow.id,[checkout.id]);
state=addFlowPageFrame(state,flow.id,{pageId:cart.id,pageGroupId:checkout.id,y:90},id);
const frame=documentaryFlowGraph(state.project,flow.id).pageFrames[0];
state=addEventOccurrenceToPage(state,flow.id,{name:pageView.name,pageFrameId:frame.id,pageGroupId:checkout.id,pageId:cart.id,eventId:pageView.id,role:"context-setting",trigger:pageView.trigger,obligation:"Required",minimum:1,maximum:1,y:70},id);
const occurrence=documentaryFlowGraph(state.project,flow.id).occurrences[0];
assert.deepEqual({pageFrameId:occurrence.pageFrameId,pageId:occurrence.pageId,pageGroupId:occurrence.pageGroupId,eventId:occurrence.eventId,trigger:occurrence.trigger},{pageFrameId:frame.id,pageId:cart.id,pageGroupId:checkout.id,eventId:pageView.id,trigger:"Initial load"});
assert.equal("role" in occurrence,false,"direct Event occurrences do not persist a documentary role");
assert.equal(projectFlowGraph(state.project,flow.id).graph.nodes[0].role,"interaction","the Event projection has fixed interaction semantics");

const binding={id:"binding:legacy",name:"Legacy initial load",eventId:pageView.id,trigger:"Legacy trigger"};
const beforeLegacy=documentaryFlowGraph(state.project,flow.id);
state={...state,project:{...state.project,collections:{...state.project.collections,events:state.project.collections.events.map((event)=>({...event,role:"context-setting"})),pages:state.project.collections.pages.map((page)=>page.id===cart.id?{...page,contextEventBindings:[binding]}:page)},documentationFlowGraphs:{...state.project.documentationFlowGraphs,[flow.id]:{...beforeLegacy,occurrences:[{...occurrence,eventId:undefined,role:"context-setting",trigger:undefined,contextBindingId:binding.id}]}}}};
assert.deepEqual(reviewLegacyFlowContextMigration(state.project,flow.id).blockers,[]);
state=migrateLegacyFlowContextBindings(state,flow.id);
const migrated=documentaryFlowGraph(state.project,flow.id),migratedEvent=state.project.collections.events.find(({id:eventId})=>eventId===pageView.id),migratedPage=state.project.collections.pages.find(({id:pageId})=>pageId===cart.id);
assert.deepEqual(migrated.occurrences,[],"the legacy primary context occurrence is absorbed into its Page");
assert.equal(migratedPage.eventName,"page_view");
assert.equal("role" in migratedEvent,false,"migration removes Event-definition role fields");
assert.equal("contextEventBindings" in migratedPage,false);

console.log("Flow Event insertion semantics tests passed");
