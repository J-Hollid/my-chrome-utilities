import assert from "node:assert/strict";
import {
  addGraphOccurrence,
  addEventOccurrenceToPage,
  addFlowPageFrame,
  addFreePageFrame,
  documentaryFlowGraph,
  migrateLegacyFlowContextBindings,
  projectFlowGraph,
  reviewLegacyFlowContextMigration,
  setFlowPageGroupLanes,
} from "../dist/data-layer-flow-graph.js";
import {layeredEventRole} from "../dist/data-layer-layered-schema-ui.js";
import {addProjectEntity,createSpecificationProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:page-context-${++sequence}`;
let state=createSpecificationProject({name:"Page context shop",site:"shop.example",id});
const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);};
const pageView=add("events",{name:"page_view",eventName:"page_view",role:"context-setting"});
const routeView=add("events",{name:"route_view",eventName:"route_view",role:"context-setting"});
const cart=add("pages",{name:"Cart"}),landing=add("pages",{name:"Landing"}),returns=add("pages",{name:"Returns"});
const checkout=add("pageGroups",{name:"Checkout"});
const support=add("pageGroups",{name:"Support"});state={...state,project:{...state.project,collections:{...state.project.collections,pages:state.project.collections.pages.map((page)=>page.id===cart.id?{...page,pageGroupIds:[checkout.id]}:page.id===returns.id?{...page,pageGroupIds:[support.id]}:page)}}};
const flow=add("flows",{name:"Checkout journey",steps:[]});
const otherFlow=add("flows",{name:"Returns journey",steps:[]});
state=setFlowPageGroupLanes(state,flow.id,[checkout.id]);
state=setFlowPageGroupLanes(state,otherFlow.id,[checkout.id]);
state=addFlowPageFrame(state,flow.id,{pageId:cart.id,pageGroupId:checkout.id,y:90},id);
state=addFlowPageFrame(state,otherFlow.id,{pageId:cart.id,pageGroupId:checkout.id,y:110},id);
const cartFrame=documentaryFlowGraph(state.project,flow.id).pageFrames[0];
const otherCartFrame=documentaryFlowGraph(state.project,otherFlow.id).pageFrames[0];

state=addEventOccurrenceToPage(state,flow.id,{name:"page_view",pageFrameId:cartFrame.id,pageGroupId:checkout.id,pageId:cart.id,eventId:pageView.id,role:"interaction",trigger:"Initial load",obligation:"Required",minimum:1,maximum:1,y:130},id);
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
const legacyGraph=documentaryFlowGraph(state.project,flow.id),otherLegacyGraph=documentaryFlowGraph(state.project,otherFlow.id),legacyOccurrences=[{...legacyGraph.occurrences[0],eventId:undefined,role:undefined,trigger:undefined,contextBindingId:"binding:legacy-page"},{id:"occurrence:legacy-route",name:"Cart route context",pageFrameId:cartFrame.id,pageGroupId:checkout.id,pageId:cart.id,contextBindingId:"binding:legacy-route",position:{y:235},obligation:"Required",minimum:1,maximum:1,optional:false}],otherLegacyOccurrence={id:"occurrence:returns-page-view",name:"Returns initial context",pageFrameId:otherCartFrame.id,pageGroupId:checkout.id,pageId:cart.id,contextBindingId:"binding:legacy-page",position:{y:155},obligation:"Required",minimum:1,maximum:1,optional:false};
state={...state,project:{...state.project,collections:{...state.project.collections,events:state.project.collections.events.map((event)=>event.id===pageView.id?{...event,role:"interaction"}:event),pages:state.project.collections.pages.map((page)=>page.id===cart.id?legacyPage:page)},documentationFlowGraphs:{...state.project.documentationFlowGraphs,[flow.id]:{...legacyGraph,occurrences:legacyOccurrences},[otherFlow.id]:{...otherLegacyGraph,occurrences:[otherLegacyOccurrence],relationships:[{id:"relationship:returns-self",sourceNodeId:otherLegacyOccurrence.id,targetNodeId:otherLegacyOccurrence.id,kind:"expected-next"}]}}}};
const oppositeRoleReview=reviewLegacyFlowContextMigration(state.project,flow.id);assert.equal(oppositeRoleReview.blockers.length,2);assert.ok(oppositeRoleReview.blockers.some(({message})=>/page_view.*Checkout journey.*Cart.*page_view.*interaction.*context-setting/.test(message)));assert.ok(oppositeRoleReview.blockers.some(({message})=>/Returns initial context.*Returns journey.*Cart.*page_view.*interaction.*context-setting/.test(message)));assert.equal(migrateLegacyFlowContextBindings(state,flow.id),state,"an interaction Event blocks legacy Page-context migration without a transaction");
state={...state,project:{...state.project,collections:{...state.project.collections,events:state.project.collections.events.map((event)=>event.id===pageView.id?{...event,role:"context-setting"}:event)}}};
const beforeMigration=structuredClone(state.project),review=reviewLegacyFlowContextMigration(state.project,flow.id);
assert.deepEqual(review.blockers,[]);
assert.deepEqual(review.items.map(({flowName,pageName,eventName,trigger,occurrenceName})=>({flowName,pageName,eventName,trigger,occurrenceName})),[{flowName:"Checkout journey",pageName:"Cart",eventName:"page_view",trigger:"initial-load",occurrenceName:"page_view"},{flowName:"Checkout journey",pageName:"Cart",eventName:"route_view",trigger:"spa-route-change",occurrenceName:"Cart route context"},{flowName:"Returns journey",pageName:"Cart",eventName:"page_view",trigger:"initial-load",occurrenceName:"Returns initial context"}]);
assert.throws(()=>addGraphOccurrence(state,flow.id,{name:"Forbidden binding copy",pageFrameId:cartFrame.id,pageGroupId:checkout.id,pageId:cart.id,eventId:pageView.id,contextBindingId:"binding:legacy-page",obligation:"Required",minimum:1,maximum:1,y:260},id),/legacy Page-context binding is migration input/);
const blockedState={...state,project:{...state.project,documentationFlowGraphs:{...state.project.documentationFlowGraphs,[otherFlow.id]:{...state.project.documentationFlowGraphs[otherFlow.id],occurrences:[{...otherLegacyOccurrence,contextBindingId:"binding:missing"}]}}}};
const blockedReview=reviewLegacyFlowContextMigration(blockedState.project,flow.id);assert.equal(blockedReview.blockers.length,1);assert.match(blockedReview.blockers[0].message,/Returns initial context.*Returns journey.*missing Page binding/);assert.equal(migrateLegacyFlowContextBindings(blockedState,flow.id),blockedState,"an unresolved cross-Flow reference blocks the whole migration transaction");
state=migrateLegacyFlowContextBindings(state,flow.id);
const migrated=documentaryFlowGraph(state.project,flow.id);
assert.deepEqual(migrated.occurrences.map(({id,eventId,role,trigger})=>({id,eventId,role,trigger})),[{id:direct.id,eventId:pageView.id,role:"context-setting",trigger:"initial-load"},{id:"occurrence:legacy-route",eventId:routeView.id,role:"context-setting",trigger:"spa-route-change"}]);
const migratedOther=documentaryFlowGraph(state.project,otherFlow.id);assert.deepEqual(migratedOther.occurrences.map(({id,eventId,role,trigger,position})=>({id,eventId,role,trigger,position})),[{id:otherLegacyOccurrence.id,eventId:pageView.id,role:"context-setting",trigger:"initial-load",position:{y:155}}]);assert.deepEqual(migratedOther.relationships,[{id:"relationship:returns-self",sourceNodeId:otherLegacyOccurrence.id,targetNodeId:otherLegacyOccurrence.id,kind:"expected-next"}]);
assert.ok(migrated.occurrences.every((item)=>!("contextBindingId" in item)));
assert.ok(migratedOther.occurrences.every((item)=>!("contextBindingId" in item)));
assert.ok(state.project.collections.pages.every((page)=>!("contextEventBindings" in page)));
assert.equal(Object.values(state.project.documentationFlowGraphs).flatMap(({occurrences})=>occurrences).some(({contextBindingId})=>contextBindingId),false);
const projectedContext=projectFlowGraph(state.project,flow.id).graph.nodes.find(({id})=>id===direct.id);
assert.deepEqual({eventId:projectedContext.eventId,role:projectedContext.role,occurrenceType:projectedContext.occurrenceType,contextBindingId:projectedContext.contextBindingId},{eventId:pageView.id,role:"context-setting",occurrenceType:undefined,contextBindingId:undefined});
assert.equal(layeredEventRole(migrated.occurrences.find(({id})=>id===direct.id)),"context");
assert.deepEqual(undoProjectTransaction(state).project,beforeMigration);

console.log("Flow Page-context model tests passed");
