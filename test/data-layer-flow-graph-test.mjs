import assert from "node:assert/strict";
import {addGraphOccurrence,documentaryFlowGraph,flowOutline,flowRelationshipText,inspectFlowGraph,moveGraphOccurrence,projectFlowGraph,removeGraphOccurrence,reorderGraphOccurrence,saveGraphRelationship,updateGraphOccurrence} from "../dist/data-layer-flow-graph.js";
import {flowEdgeGeometry} from "../dist/data-layer-flow-graph-ui.js";
import {compileSpecificationProject,createCanonicalProjectEnvelope} from "../dist/data-layer-specification-engine.js";
import {addFlowStep,addProjectEntity,createSpecificationProject} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:graph-${++sequence}`;
let state=createSpecificationProject({name:"Shop",site:"shop.example",id});
const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);};
const checkout=add("pages",{name:"Checkout"}),route=add("events",{name:"route_view",eventName:"route_view",role:"context-setting"}),payment=add("events",{name:"add_payment_info",eventName:"add_payment_info",role:"interaction"}),fallbackEvent=add("events",{name:"role_pending",eventName:"role_pending"}),flow=add("flows",{name:"Checkout journey",purpose:"Document checkout",steps:[]});

state=addFlowStep(state,flow.id,{name:"Executable legacy step",pageId:checkout.id,eventId:route.id,minimum:1,maximum:1,transitions:[]},id);
const executableBefore=structuredClone(state.project.collections.flows[0].steps),compiledBefore=compileSpecificationProject(createCanonicalProjectEnvelope(state.project,"published"));
assert.equal(compiledBefore.status,"compiled");

const occurrence=(name,event,lane,x,y)=>{state=addGraphOccurrence(state,flow.id,{name,pageId:checkout.id,eventId:event.id,fallbackRole:event.role??"interaction",obligation:"Required",minimum:1,maximum:1,layout:{lane,x,y}},id);return documentaryFlowGraph(state.project,flow.id).occurrences.at(-1);};
const context=occurrence("Checkout context",route,"Context",30,70),interaction=occurrence("Checkout payment",payment,"Payment",430,190);
state=saveGraphRelationship(state,flow.id,context.id,{toStepId:interaction.id,kind:"expected-next",group:"checkout",label:"continue",documentationCondition:"checkout is open",expectation:"payment follows context",condition:{kind:"predicate",field:"forbidden",operator:"equals",value:"x"}},id);

const projection=projectFlowGraph(state.project,flow.id),relationship=projection.graph.relationships[0];
assert.deepEqual(projection.graph.nodes.map(({id,role,layout})=>({id,role,layout})),[
  {id:context.id,role:"context-setting",layout:{lane:"Context",x:30,y:70}},
  {id:interaction.id,role:"interaction",layout:{lane:"Payment",x:430,y:190}},
]);
assert.deepEqual(flowOutline(projection.graph).map(({nodeId,relationshipIds})=>({nodeId,relationshipIds})),[{nodeId:context.id,relationshipIds:[relationship.id]},{nodeId:interaction.id,relationshipIds:[]}]);
assert.match(flowRelationshipText(projection.graph,relationship),/Checkout context · expected-next · Checkout payment/);
assert.equal(relationship.documentationCondition,"checkout is open");
assert.equal("condition" in documentaryFlowGraph(state.project,flow.id).relationships[0],false,"documentary storage rejects executable condition fields");
assert.deepEqual(inspectFlowGraph(projection.graph,projection.catalog),[]);
const isolated={...projection.graph,nodes:[...projection.graph.nodes,{...projection.graph.nodes[0],id:"isolated"}]};
assert.deepEqual(inspectFlowGraph(isolated,projection.catalog),[],"an isolated documentary occurrence is not a broken reference");

const input={name:"Authoritative Event role",pageId:checkout.id,eventId:route.id,fallbackRole:"interaction",obligation:"Required",minimum:1,maximum:1,layout:{lane:"Shipping",x:230,y:310}};
for(const invalid of[{...input,name:"  "},{...input,pageId:"missing-page"},{...input,eventId:"missing-event"}])assert.throws(()=>addGraphOccurrence(state,flow.id,invalid,id),/requires/);
state=addGraphOccurrence(state,flow.id,input,id);
const authoritative=documentaryFlowGraph(state.project,flow.id).occurrences.at(-1);
assert.equal("role" in authoritative,false,"an occurrence never persists an authoritative Event role");
assert.equal("fallbackRole" in authoritative,false,"an Event-owned role does not persist a redundant fallback");
assert.equal(projectFlowGraph(state.project,flow.id).graph.nodes.at(-1).role,"context-setting","the selected Event definition owns the projected Flow role");
assert.equal("layout" in authoritative,false,"only lane and position are persisted");
const beforeNoOp=state;
assert.equal(reorderGraphOccurrence(state,flow.id,0,0),beforeNoOp);
assert.equal(reorderGraphOccurrence(state,flow.id,0,-10),beforeNoOp,"a clamped reorder to the current index is a no-op revision");
state={...state,project:{...state.project,documentationFlowGraphs:{...state.project.documentationFlowGraphs,[flow.id]:{...state.project.documentationFlowGraphs[flow.id],occurrences:state.project.documentationFlowGraphs[flow.id].occurrences.map((occurrence)=>occurrence.id===authoritative.id?{...occurrence,layout:{lane:"legacy",x:1,y:2}}:occurrence)}}}};
state=updateGraphOccurrence(state,flow.id,authoritative.id,input);
assert.equal("layout" in documentaryFlowGraph(state.project,flow.id).occurrences.at(-1),false,"editing strips an input layout object");
const fallback=occurrence("Fallback role",fallbackEvent,"Context",30,430);
assert.equal(fallback.fallbackRole,"interaction");
assert.equal(projectFlowGraph(state.project,flow.id).graph.nodes.at(-1).role,"interaction");
assert.throws(()=>updateGraphOccurrence(state,flow.id,"missing-occurrence",input),/Unknown/);
assert.equal(moveGraphOccurrence(state,flow.id,"missing-occurrence",{lane:"Context",x:30,y:70}),state);
assert.equal(removeGraphOccurrence(state,flow.id,"missing-occurrence"),state);
assert.throws(()=>saveGraphRelationship(state,flow.id,"missing-occurrence",{toStepId:context.id,kind:"parallel"},id),/existing Flow/);

const compiledAfter=compileSpecificationProject(createCanonicalProjectEnvelope(state.project,"published"));
assert.equal(compiledAfter.status,"compiled");
assert.deepEqual(state.project.collections.flows[0].steps,executableBefore,"documentary graph authoring must not touch executable steps or transitions");
assert.equal(compiledAfter.plan.evaluatorContentIdentity,compiledBefore.plan.evaluatorContentIdentity,"documentary graph authoring must not change compiled/runtime evaluator behavior");

const directedCheckoutToPayment=flowEdgeGeometry({x:30,y:70},{x:430,y:210});
assert.deepEqual({startX:directedCheckoutToPayment.startX,startY:directedCheckoutToPayment.startY,endX:directedCheckoutToPayment.endX,endY:directedCheckoutToPayment.endY},{startX:200,startY:140.75,endX:430,endY:221.25},"known source-right to target-left ports must not reverse");

for(const [source,target] of [[{x:230,y:70},{x:30,y:70}],[{x:230,y:70},{x:230,y:190}],[{x:230,y:70},{x:230,y:70}]]){
  const geometry=flowEdgeGeometry(source,target);
  assert.equal(Object.values(geometry).every((value)=>typeof value==="string"||Number.isFinite(value)),true,"edge geometry must remain finite");
  assert.equal(geometry.arrow.split(/[ ,]/).map(Number).every(Number.isFinite),true,"arrowhead coordinates must remain finite");
}

console.log("Flow graph projection tests passed");
