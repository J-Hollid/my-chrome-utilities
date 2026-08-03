import assert from "node:assert/strict";
import {
  addGraphOccurrence,
  addEventOccurrenceToPage,
  documentaryFlowGraph,
  migrateLegacyFlowContextBindings,
  projectFlowGraph,
  reviewLegacyFlowContextMigration,
} from "../dist/data-layer-flow-graph.js";
import {layeredEventRole} from "../dist/data-layer-layered-schema-ui.js";
import {addFlowPageFrameToSection,createFlowSection} from "../dist/data-layer-property-set-flow-section.js";
import {addProjectEntity,createSpecificationProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:page-context-${++sequence}`;
let state=createSpecificationProject({name:"Page context shop",site:"shop.example",id});
const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);};
const pageView=add("events",{name:"page_view",eventName:"page_view",role:"context-setting"});
const routeView=add("events",{name:"route_view",eventName:"route_view",role:"context-setting"});
const cart=add("pages",{name:"Cart"}),landing=add("pages",{name:"Landing"}),returns=add("pages",{name:"Returns"});
const checkout=add("propertySets",{name:"Checkout"});
const support=add("propertySets",{name:"Support"});state={...state,project:{...state.project,collections:{...state.project.collections,pages:state.project.collections.pages.map((page)=>page.id===cart.id?{...page,propertySetApplications:[{id:id("property-set-application"),name:checkout.name,propertySetId:checkout.id}]}:page.id===returns.id?{...page,propertySetApplications:[{id:id("property-set-application"),name:support.name,propertySetId:support.id}]}:page)}}};
const flow=add("flows",{name:"Checkout journey",steps:[]});
const otherFlow=add("flows",{name:"Returns journey",steps:[]});
state=createFlowSection(state,flow.id,{name:"Checkout",bounds:{x:20,y:20,width:720,height:300}},id);
state=createFlowSection(state,otherFlow.id,{name:"Checkout",bounds:{x:20,y:20,width:720,height:300}},id);
const sectionId=documentaryFlowGraph(state.project,flow.id).sections[0].id;
const otherSectionId=documentaryFlowGraph(state.project,otherFlow.id).sections[0].id;
state=addFlowPageFrameToSection(state,flow.id,cart.id,sectionId,id);
state=addFlowPageFrameToSection(state,otherFlow.id,cart.id,otherSectionId,id);
const cartFrame=documentaryFlowGraph(state.project,flow.id).pageFrames[0];
const otherCartFrame=documentaryFlowGraph(state.project,otherFlow.id).pageFrames[0];

state=addEventOccurrenceToPage(state,flow.id,{name:"page_view",pageFrameId:cartFrame.id,pageId:cart.id,eventId:pageView.id,role:"interaction",trigger:"Initial load",obligation:"Required",minimum:1,maximum:1,y:130},id);
const direct=documentaryFlowGraph(state.project,flow.id).occurrences[0];
assert.deepEqual({pageFrameId:direct.pageFrameId,pageId:direct.pageId,sectionId:direct.sectionId,eventId:direct.eventId,role:direct.role,trigger:direct.trigger},{pageFrameId:cartFrame.id,pageId:cart.id,sectionId:undefined,eventId:pageView.id,role:undefined,trigger:"Initial load"});
assert.equal("contextBindingId" in direct,false);
assert.equal("contextEventBindings" in state.project.collections.pages.find(({id})=>id===cart.id),false);

state=addFlowPageFrameToSection(state,flow.id,landing.id,undefined,id);
const freeFrame=documentaryFlowGraph(state.project,flow.id).pageFrames.find(({pageId})=>pageId===landing.id);
assert.deepEqual({pageId:freeFrame.pageId,sectionId:freeFrame.sectionId,position:freeFrame.position},{pageId:landing.id,sectionId:undefined,position:{x:64,y:74}});
assert.equal(documentaryFlowGraph(state.project,flow.id).occurrences.length,1,"a free Page frame is not an Event occurrence");

const propertySetApplications=structuredClone(state.project.collections.pages.find(({id})=>id===returns.id).propertySetApplications);
state=addFlowPageFrameToSection(state,flow.id,returns.id,undefined,id);
const groupedFree=documentaryFlowGraph(state.project,flow.id).pageFrames.find(({pageId})=>pageId===returns.id);
assert.deepEqual({sectionId:groupedFree.sectionId,position:groupedFree.position},{sectionId:undefined,position:{x:284,y:74}},"a composed Page may be placed outside a Section without changing semantic membership");
assert.deepEqual(state.project.collections.pages.find(({id})=>id===returns.id).propertySetApplications,propertySetApplications);

const legacyPage={...state.project.collections.pages.find(({id})=>id===cart.id),contextEventBindings:[{id:"binding:legacy-page",name:"Initial load",eventId:pageView.id,trigger:"initial-load"},{id:"binding:legacy-route",name:"SPA route change",eventId:routeView.id,trigger:"spa-route-change"}]};
const legacyGraph=documentaryFlowGraph(state.project,flow.id),otherLegacyGraph=documentaryFlowGraph(state.project,otherFlow.id),legacyOccurrences=[{...legacyGraph.occurrences[0],eventId:undefined,role:undefined,trigger:undefined,contextBindingId:"binding:legacy-page"},{id:"occurrence:legacy-route",name:"Cart route context",pageFrameId:cartFrame.id,pageId:cart.id,contextBindingId:"binding:legacy-route",position:{y:235},obligation:"Required",minimum:1,maximum:1,optional:false}],otherLegacyOccurrence={id:"occurrence:returns-page-view",name:"Returns initial context",pageFrameId:otherCartFrame.id,pageId:cart.id,contextBindingId:"binding:legacy-page",position:{y:155},obligation:"Required",minimum:1,maximum:1,optional:false};
state={...state,project:{...state.project,collections:{...state.project.collections,events:state.project.collections.events.map((event)=>event.id===pageView.id?{...event,role:"interaction"}:event),pages:state.project.collections.pages.map((page)=>page.id===cart.id?legacyPage:page)},documentationFlowGraphs:{...state.project.documentationFlowGraphs,[flow.id]:{...legacyGraph,occurrences:legacyOccurrences},[otherFlow.id]:{...otherLegacyGraph,occurrences:[otherLegacyOccurrence],relationships:[{id:"relationship:returns-self",sourceNodeId:otherLegacyOccurrence.id,targetNodeId:otherLegacyOccurrence.id,kind:"expected_next"}]}}}};
const beforeMigration=structuredClone(state.project),review=reviewLegacyFlowContextMigration(state.project,flow.id);
assert.deepEqual(review.blockers,[]);
assert.deepEqual(review.items.map(({flowName,pageName,eventName,trigger,occurrenceName})=>({flowName,pageName,eventName,trigger,occurrenceName})),[{flowName:"Checkout journey",pageName:"Cart",eventName:"page_view",trigger:"initial-load",occurrenceName:"page_view"},{flowName:"Checkout journey",pageName:"Cart",eventName:"route_view",trigger:"spa-route-change",occurrenceName:"Cart route context"},{flowName:"Returns journey",pageName:"Cart",eventName:"page_view",trigger:"initial-load",occurrenceName:"Returns initial context"}]);
assert.throws(()=>addGraphOccurrence(state,flow.id,{name:"Forbidden binding copy",pageFrameId:cartFrame.id,pageId:cart.id,eventId:pageView.id,contextBindingId:"binding:legacy-page",obligation:"Required",minimum:1,maximum:1,y:260},id),/legacy Page-context binding is migration input/);
const blockedState={...state,project:{...state.project,documentationFlowGraphs:{...state.project.documentationFlowGraphs,[otherFlow.id]:{...state.project.documentationFlowGraphs[otherFlow.id],occurrences:[{...otherLegacyOccurrence,contextBindingId:"binding:missing"}]}}}};
const blockedReview=reviewLegacyFlowContextMigration(blockedState.project,flow.id);assert.equal(blockedReview.blockers.length,1);assert.match(blockedReview.blockers[0].message,/Returns initial context.*Returns journey.*missing Page binding/);assert.equal(migrateLegacyFlowContextBindings(blockedState,flow.id),blockedState,"an unresolved cross-Flow reference blocks the whole migration transaction");
state=migrateLegacyFlowContextBindings(state,flow.id);
const migrated=documentaryFlowGraph(state.project,flow.id);
assert.deepEqual(migrated.occurrences.map(({id,eventId,role,trigger})=>({id,eventId,role,trigger})),[{id:"occurrence:legacy-route",eventId:routeView.id,role:undefined,trigger:"spa-route-change"}],"the primary Page context becomes Page identity rather than a nested occurrence");
const migratedOther=documentaryFlowGraph(state.project,otherFlow.id);assert.deepEqual(migratedOther.occurrences,[]);assert.deepEqual(migratedOther.relationships,[{id:"relationship:returns-self",kind:"expected_next",sourceEndpoint:{kind:"page-frame",id:otherCartFrame.id},targetEndpoint:{kind:"page-frame",id:otherCartFrame.id}}],"relationships touching absorbed Page-context occurrences retain identity and resolvable Page endpoints");
assert.ok(migrated.occurrences.every((item)=>!("contextBindingId" in item)));
assert.ok(migratedOther.occurrences.every((item)=>!("contextBindingId" in item)));
assert.ok(state.project.collections.pages.every((page)=>!("contextEventBindings" in page)));
assert.ok(state.project.collections.events.every((event)=>!("role" in event)));
assert.equal(Object.values(state.project.documentationFlowGraphs).flatMap(({occurrences})=>occurrences).some(({contextBindingId})=>contextBindingId),false);
assert.equal("eventName" in state.project.collections.pages.find(({id})=>id===cart.id),false,"migration removes obsolete Page event metadata");
assert.equal(projectFlowGraph(state.project,flow.id).graph.nodes[0].eventId,routeView.id);
assert.equal(layeredEventRole(migrated.occurrences[0]),"interaction");
assert.deepEqual(undoProjectTransaction(state).project,beforeMigration);

console.log("Flow Page-context model tests passed");
