import assert from "node:assert/strict";
import {
  addEventOccurrenceToPage,
  documentaryFlowGraph,
  migrateLegacyFlowContextBindings,
  projectFlowGraph,
  reviewLegacyFlowContextMigration,
} from "../dist/data-layer-flow-graph.js";
import {addFlowPageFrameToSection,createFlowSection} from "../dist/data-layer-property-set-flow-section.js";
import {addProjectEntity,createSpecificationProject} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:fixed-event-${++sequence}`;
let state=createSpecificationProject({name:"Fixed Flow semantics",site:"shop.example",id});
const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);};
const checkout=add("propertySets",{name:"Checkout"});
const application=()=>[{id:id("property-set-application"),name:checkout.name,propertySetId:checkout.id}];
const cart=add("pages",{name:"Cart",eventName:"pageview",propertySetApplications:application()});
const payment=add("pages",{name:"Payment",eventName:"pageview",propertySetApplications:application()});
const pageView=add("events",{name:"page_view",eventName:"page_view",role:"context-setting",trigger:"Initial load"});
const flow=add("flows",{name:"Checkout journey",steps:[]});

assert.equal("role" in pageView,false,"new Event definitions do not persist a documentary role");
assert.equal(pageView.trigger,"Initial load","the optional trigger remains descriptive Event metadata");

state=createFlowSection(state,flow.id,{name:"Checkout",bounds:{x:20,y:20,width:720,height:300}},id);
const sectionId=documentaryFlowGraph(state.project,flow.id).sections[0].id;
state=addFlowPageFrameToSection(state,flow.id,cart.id,sectionId,id);
state=addFlowPageFrameToSection(state,flow.id,payment.id,sectionId,id);
const [frame,paymentFrame]=documentaryFlowGraph(state.project,flow.id).pageFrames;
state=addEventOccurrenceToPage(state,flow.id,{name:pageView.name,pageFrameId:frame.id,pageId:cart.id,eventId:pageView.id,role:"context-setting",trigger:pageView.trigger,obligation:"Required",minimum:1,maximum:1,y:70},id);
const occurrence=documentaryFlowGraph(state.project,flow.id).occurrences[0];
assert.deepEqual({pageFrameId:occurrence.pageFrameId,pageId:occurrence.pageId,sectionId:occurrence.sectionId,eventId:occurrence.eventId,trigger:occurrence.trigger},{pageFrameId:frame.id,pageId:cart.id,sectionId:undefined,eventId:pageView.id,trigger:"Initial load"});
assert.equal("role" in occurrence,false,"direct Event occurrences do not persist a documentary role");
assert.equal(projectFlowGraph(state.project,flow.id).graph.nodes[0].role,"interaction","the Event projection has fixed interaction semantics");

const binding={id:"binding:legacy",name:"Legacy initial load",eventId:pageView.id,trigger:"Legacy trigger"};
const beforeLegacy=documentaryFlowGraph(state.project,flow.id);
const legacyRelationships=[
  {id:"relationship:legacy-from-event",sourceEndpoint:{kind:"event-occurrence",id:occurrence.id},targetEndpoint:{kind:"page-frame",id:paymentFrame.id},sourcePort:"right",targetPort:"left",kind:"expected_next",group:"legacy",label:"Continue",documentationCondition:"cart ready",expectation:"manual"},
  {id:"relationship:legacy-to-event",sourceEndpoint:{kind:"page-frame",id:paymentFrame.id},targetEndpoint:{kind:"event-occurrence",id:occurrence.id},sourcePort:"bottom",targetPort:"top",kind:"merge",group:"return",documentationCondition:"retry",expectation:"review"},
];
state={...state,project:{...state.project,collections:{...state.project.collections,events:state.project.collections.events.map((event)=>({...event,role:"context-setting"})),pages:state.project.collections.pages.map((page)=>page.id===cart.id?{...page,contextEventBindings:[binding]}:page)},documentationFlowGraphs:{...state.project.documentationFlowGraphs,[flow.id]:{...beforeLegacy,occurrences:[{...occurrence,eventId:undefined,role:"context-setting",trigger:undefined,contextBindingId:binding.id}],relationships:legacyRelationships}}}};
assert.deepEqual(reviewLegacyFlowContextMigration(state.project,flow.id).blockers,[]);
state=migrateLegacyFlowContextBindings(state,flow.id);
const migrated=documentaryFlowGraph(state.project,flow.id),migratedEvent=state.project.collections.events.find(({id:eventId})=>eventId===pageView.id),migratedPage=state.project.collections.pages.find(({id:pageId})=>pageId===cart.id);
assert.deepEqual(migrated.occurrences,[],"the legacy primary context occurrence is absorbed into its Page");
assert.deepEqual(migrated.relationships,[
  {...legacyRelationships[0],sourceEndpoint:{kind:"page-frame",id:frame.id}},
  {...legacyRelationships[1],targetEndpoint:{kind:"page-frame",id:frame.id}},
],"legacy Event endpoints become Page-frame endpoints without losing relationship identity or metadata");
assert.equal("eventName" in migratedPage,false,"migration removes obsolete Page event metadata");
assert.equal("role" in migratedEvent,false,"migration removes Event-definition role fields");
assert.equal("contextEventBindings" in migratedPage,false);

console.log("Flow Event insertion semantics tests passed");
