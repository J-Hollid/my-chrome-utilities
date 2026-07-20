import assert from "node:assert/strict";
import {addFlowPageFrame,addFreePageFrame,addGraphOccurrence,addInteractionOccurrenceToPage,addPageContextOccurrence,applyFlowPageGroupLaneSelection,documentaryFlowGraph,flowOccurrenceEventSchema,flowOutline,flowRelationshipText,inspectFlowGraph,inspectFreePageEdgeMove,inspectOccurrenceContainmentMove,inspectPageFrameDrop,moveFreePageFrame,moveGraphOccurrence,projectFlowGraph,removeFlowPageFrame,removeGraphOccurrence,reorderFlowPageGroupLane,reorderGraphOccurrence,saveFlowViewState,saveGraphRelationship,setFlowPageGroupLanes,updateGraphOccurrence} from "../dist/data-layer-flow-graph.js";
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

let laneSequence=0,laneState=createSpecificationProject({name:"Lane shop",site:"shop.example",id:(kind)=>`${kind}:lane-${++laneSequence}`});
const laneId=(kind)=>`${kind}:lane-${++laneSequence}`,laneAdd=(kind,entity)=>{laneState=addProjectEntity(laneState,kind,entity,laneId);return laneState.project.collections[kind].at(-1);};
const laneCheckoutPage=laneAdd("pages",{name:"Checkout",contextEventBindings:[]}),laneRoute=laneAdd("events",{name:"route_view",eventName:"route_view"}),lanePurchase=laneAdd("events",{name:"Purchase",eventName:"purchase",schemaId:"schema:purchase"});
const initialBinding={id:"context-binding:initial",name:"Initial load",eventId:laneRoute.id,trigger:"initial-load"},routeBinding={id:"context-binding:route",name:"Route change",eventId:laneRoute.id,trigger:"route-change"};
laneState={...laneState,project:{...laneState.project,collections:{...laneState.project.collections,pages:laneState.project.collections.pages.map((page)=>page.id===laneCheckoutPage.id?{...page,contextEventBindings:[initialBinding,routeBinding]}:page)}}};
const checkoutGroup=laneAdd("pageGroups",{name:"Checkout",pageIds:[laneCheckoutPage.id]}),deliveryGroup=laneAdd("pageGroups",{name:"Delivery",pageIds:[laneCheckoutPage.id]}),confirmationGroup=laneAdd("pageGroups",{name:"Confirmation",pageIds:[laneCheckoutPage.id]}),tradeGroup=laneAdd("pageGroups",{name:"Trade",pageIds:[laneCheckoutPage.id]}),laneFlow=laneAdd("flows",{name:"Checkout journey",steps:[]}),laneCompiledBefore=compileSpecificationProject(createCanonicalProjectEnvelope(laneState.project,"published"));
laneState=setFlowPageGroupLanes(laneState,laneFlow.id,[checkoutGroup.id,deliveryGroup.id,confirmationGroup.id]);
assert.deepEqual(documentaryFlowGraph(laneState.project,laneFlow.id).pageGroupIds,[checkoutGroup.id,deliveryGroup.id,confirmationGroup.id]);
assert.equal(applyFlowPageGroupLaneSelection(laneState,laneFlow.id,undefined),laneState,"saving unrelated Flow fields preserves documentary lanes when the lane control is managed separately");
assert.equal("pageGroupIds" in laneState.project.collections.flows.at(-1),false,"documentary lane order stays outside the executable Flow entity");
assert.equal(compileSpecificationProject(createCanonicalProjectEnvelope(laneState.project,"published")).plan.evaluatorContentIdentity,laneCompiledBefore.plan.evaluatorContentIdentity,"documentary lane order must not change evaluator identity");
const addLaneOccurrence=(input)=>{laneState=addGraphOccurrence(laneState,laneFlow.id,{name:input.name,pageGroupId:input.pageGroupId,pageId:laneCheckoutPage.id,...(input.contextBindingId?{contextBindingId:input.contextBindingId}:{eventId:lanePurchase.id}),obligation:"Required",minimum:1,maximum:1,y:input.y},laneId);return documentaryFlowGraph(laneState.project,laneFlow.id).occurrences.at(-1);};
const initialContext=addLaneOccurrence({name:"Checkout initial",pageGroupId:checkoutGroup.id,contextBindingId:initialBinding.id,y:70}),routeContext=addLaneOccurrence({name:"Checkout route",pageGroupId:checkoutGroup.id,contextBindingId:routeBinding.id,y:190}),purchaseOccurrence=addLaneOccurrence({name:"Purchase",pageGroupId:deliveryGroup.id,y:310});
assert.throws(()=>setFlowPageGroupLanes(laneState,laneFlow.id,[checkoutGroup.id,confirmationGroup.id]),/reassigned or removed/,"a referenced lane cannot be removed without consequential review");
for(const occurrenceRecord of [initialContext,routeContext,purchaseOccurrence])assert.equal(["role","fallbackRole","lane","layout","schema","schemaId"].some((key)=>key in occurrenceRecord),false,"semantic occurrence storage excludes derived role, lane, coordinates, and Event schema copies");
assert.equal("x" in purchaseOccurrence.position,false);assert.equal(initialContext.contextBindingId,initialBinding.id);assert.equal(purchaseOccurrence.eventId,lanePurchase.id);
assert.equal(flowOccurrenceEventSchema(laneState.project,laneFlow.id,purchaseOccurrence.id),"schema:purchase");
let laneProjection=projectFlowGraph(laneState.project,laneFlow.id);
assert.deepEqual(laneProjection.lanes.map(({id,name})=>[id,name]),[[checkoutGroup.id,"Checkout"],[deliveryGroup.id,"Delivery"],[confirmationGroup.id,"Confirmation"]]);
assert.deepEqual(laneProjection.graph.nodes.map(({pageGroupId,layout})=>[pageGroupId,layout.x,layout.y]),[[checkoutGroup.id,30,70],[checkoutGroup.id,30,190],[deliveryGroup.id,230,310]]);
laneState={...laneState,project:{...laneState.project,collections:{...laneState.project.collections,pageGroups:laneState.project.collections.pageGroups.map((group)=>group.id===deliveryGroup.id?{...group,name:"Fulfilment"}:group)}}};
laneState=setFlowPageGroupLanes(laneState,laneFlow.id,[checkoutGroup.id,confirmationGroup.id,deliveryGroup.id]);laneProjection=projectFlowGraph(laneState.project,laneFlow.id);
assert.deepEqual(laneProjection.lanes.map(({name})=>name),["Checkout","Confirmation","Fulfilment"]);assert.equal(laneProjection.graph.nodes.find(({id})=>id===purchaseOccurrence.id).layout.x,430);assert.equal(documentaryFlowGraph(laneState.project,laneFlow.id).occurrences.find(({id})=>id===purchaseOccurrence.id).position.y,310);
const tradePage=laneAdd("pages",{name:"Trade Page",contextEventBindings:[]});laneState={...laneState,project:{...laneState.project,collections:{...laneState.project.collections,pageGroups:laneState.project.collections.pageGroups.map((group)=>group.id===tradeGroup.id?{...group,pageIds:[tradePage.id]}:group)}}};laneState=setFlowPageGroupLanes(laneState,laneFlow.id,[checkoutGroup.id,confirmationGroup.id,deliveryGroup.id,tradeGroup.id]);
const containment=inspectOccurrenceContainmentMove(laneState.project,laneFlow.id,purchaseOccurrence.id,tradeGroup.id,tradePage.id);assert.equal(containment.rejected,true);for(const name of["Purchase","Checkout","Trade Page","Checkout journey"])assert.ok(containment.message.includes(name));const beforeRejectedMove=laneState;assert.equal(moveGraphOccurrence(laneState,laneFlow.id,purchaseOccurrence.id,{pageGroupId:tradeGroup.id,y:430}),beforeRejectedMove,"cross-Page or cross-Page-Group movement is a byte-identical no-op");
laneState=addInteractionOccurrenceToPage(laneState,laneFlow.id,{name:"Trade Purchase",pageGroupId:tradeGroup.id,pageId:tradePage.id,eventId:lanePurchase.id,obligation:"Required",minimum:1,maximum:1,y:70},laneId);const afterPalette=documentaryFlowGraph(laneState.project,laneFlow.id),checkoutPurchase=afterPalette.occurrences.find(({id})=>id===purchaseOccurrence.id),tradePurchase=afterPalette.occurrences.find(({name})=>name==="Trade Purchase");assert.equal(checkoutPurchase.pageGroupId,deliveryGroup.id);assert.equal(tradePurchase.pageGroupId,tradeGroup.id);assert.equal(tradePurchase.eventId,checkoutPurchase.eventId);
const landingPage=laneAdd("pages",{name:"Landing Page",contextEventBindings:[{id:"context-binding:landing",name:"page_view",eventId:laneRoute.id}]}),campaignPage=laneAdd("pages",{name:"Campaign Page",contextEventBindings:[{id:"context-binding:campaign",name:"route_view",eventId:laneRoute.id}]});const lanesBeforeFree=structuredClone(documentaryFlowGraph(laneState.project,laneFlow.id).pageGroupIds),groupsBeforeFree=structuredClone(laneState.project.collections.pageGroups);laneState=addFreePageFrame(laneState,laneFlow.id,{name:"Landing Page entry",pageId:landingPage.id,contextBindingId:"context-binding:landing",region:"before-lanes",x:24,y:70},laneId);laneState=addFreePageFrame(laneState,laneFlow.id,{name:"Campaign Page entry",pageId:campaignPage.id,contextBindingId:"context-binding:campaign",region:"after-lanes",x:38,y:110},laneId);const [freeFrame,campaignFrame]=documentaryFlowGraph(laneState.project,laneFlow.id).occurrences.slice(-2);assert.deepEqual({freePageFrame:freeFrame.freePageFrame,freePageRegion:freeFrame.freePageRegion,position:freeFrame.position},{freePageFrame:true,freePageRegion:"before-lanes",position:{x:24,y:70}});assert.deepEqual({freePageFrame:campaignFrame.freePageFrame,freePageRegion:campaignFrame.freePageRegion,position:campaignFrame.position},{freePageFrame:true,freePageRegion:"after-lanes",position:{x:38,y:110}});assert.equal("pageGroupId" in freeFrame,false);assert.equal("lane" in freeFrame,false);assert.deepEqual(documentaryFlowGraph(laneState.project,laneFlow.id).pageGroupIds,lanesBeforeFree);assert.equal("pageGroupIds" in laneState.project.collections.flows.find(({id})=>id===laneFlow.id),false);assert.deepEqual(laneState.project.collections.pageGroups,groupsBeforeFree);const freeIdentity=JSON.stringify({id:freeFrame.id,pageId:freeFrame.pageId,contextBindingId:freeFrame.contextBindingId,minimum:freeFrame.minimum,maximum:freeFrame.maximum}),beforeCrossRegionMove=laneState;assert.equal(moveGraphOccurrence(laneState,laneFlow.id,freeFrame.id,{pageGroupId:checkoutGroup.id,y:190}),beforeCrossRegionMove,"free Page frames cannot move into named Page Group lanes");laneState=moveFreePageFrame(laneState,laneFlow.id,freeFrame.id,{region:"after-lanes",x:46,y:90});const editedFreeFrame=documentaryFlowGraph(laneState.project,laneFlow.id).occurrences.find(({id})=>id===freeFrame.id);assert.deepEqual({freePageRegion:editedFreeFrame.freePageRegion,position:editedFreeFrame.position},{freePageRegion:"after-lanes",position:{x:46,y:90}});assert.equal(JSON.stringify({id:editedFreeFrame.id,pageId:editedFreeFrame.pageId,contextBindingId:editedFreeFrame.contextBindingId,minimum:editedFreeFrame.minimum,maximum:editedFreeFrame.maximum}),freeIdentity);laneState=addInteractionOccurrenceToPage(laneState,laneFlow.id,{name:"Landing Purchase",freePageFrameId:freeFrame.id,pageId:landingPage.id,eventId:lanePurchase.id,obligation:"Required",minimum:1,maximum:1,y:190},laneId);const landingPurchase=documentaryFlowGraph(laneState.project,laneFlow.id).occurrences.at(-1);laneState=saveGraphRelationship(laneState,laneFlow.id,landingPurchase.id,{toStepId:purchaseOccurrence.id,kind:"expected-next"},laneId);const freeProjection=projectFlowGraph(laneState.project,laneFlow.id),projectedFrame=freeProjection.graph.nodes.find(({id})=>id===freeFrame.id),projectedChild=freeProjection.graph.nodes.find(({id})=>id===landingPurchase.id);assert.equal(freeProjection.graph.relationships.at(-1).sourceNodeId,landingPurchase.id);assert.equal(projectedFrame.layout.lane,"after-lanes");assert.equal(projectedChild.layout.lane,"after-lanes");assert.ok(projectedFrame.layout.x>freeProjection.graph.nodes.find(({pageGroupId})=>pageGroupId===checkoutGroup.id).layout.x);assert.ok(projectedChild.layout.x>projectedFrame.layout.x);const rejectedDrop=inspectFreePageEdgeMove(laneState.project,laneFlow.id,purchaseOccurrence.id,"after-lanes");assert.equal(rejectedDrop.rejected,true);assert.match(rejectedDrop.guidance,/kind=pages.*entity=.*field=pageGroupIds/);

// Canvas-first correction: lanes contain explicitly placed Page frames rather than
// implicitly rendering every Page Group member.
let canvasSequence=0,canvasState=createSpecificationProject({name:"Canvas shop",site:"shop.example",id:(kind)=>`${kind}:canvas-${++canvasSequence}`});
const canvasId=(kind)=>`${kind}:canvas-${++canvasSequence}`,canvasAdd=(kind,entity)=>{canvasState=addProjectEntity(canvasState,kind,entity,canvasId);return canvasState.project.collections[kind].at(-1);};
const cartPage=canvasAdd("pages",{name:"Cart",contextEventBindings:[]}),shippingPage=canvasAdd("pages",{name:"Shipping",contextEventBindings:[]});
const canvasPageView=canvasAdd("events",{name:"page_view",eventName:"page_view",schemaId:"schema:page-view"}),canvasPayment=canvasAdd("events",{name:"add_payment_info",eventName:"add_payment_info",schemaId:"schema:payment"});
const canvasBinding={id:"binding:canvas-initial",name:"Initial load",eventId:canvasPageView.id,trigger:"initial-load"};
canvasState={...canvasState,project:{...canvasState.project,collections:{...canvasState.project.collections,pages:canvasState.project.collections.pages.map((page)=>page.id===cartPage.id?{...page,contextEventBindings:[canvasBinding]}:page)}}};
const canvasCheckout=canvasAdd("pageGroups",{name:"Checkout",pageIds:[cartPage.id]}),canvasDelivery=canvasAdd("pageGroups",{name:"Delivery",pageIds:[shippingPage.id]}),canvasFlow=canvasAdd("flows",{name:"Fresh journey",steps:[]});
assert.deepEqual(documentaryFlowGraph(canvasState.project,canvasFlow.id).pageFrames,[]);
canvasState=setFlowPageGroupLanes(canvasState,canvasFlow.id,[canvasCheckout.id,canvasDelivery.id]);
canvasState=addFlowPageFrame(canvasState,canvasFlow.id,{pageId:cartPage.id,pageGroupId:canvasCheckout.id,y:90},canvasId);
const cartFrame=documentaryFlowGraph(canvasState.project,canvasFlow.id).pageFrames[0];
assert.deepEqual({pageId:cartFrame.pageId,pageGroupId:cartFrame.pageGroupId,position:cartFrame.position},{pageId:cartPage.id,pageGroupId:canvasCheckout.id,position:{y:90}});
const wrongFrameBefore=canvasState;
assert.equal(addFlowPageFrame(canvasState,canvasFlow.id,{pageId:shippingPage.id,pageGroupId:canvasCheckout.id,y:90},canvasId),wrongFrameBefore,"a wrong-group Page drop is an atomic no-op");
assert.equal(inspectPageFrameDrop(canvasState.project,canvasFlow.id,shippingPage.id,canvasCheckout.id).rejected,true);
canvasState=addPageContextOccurrence(canvasState,canvasFlow.id,{pageFrameId:cartFrame.id,contextBindingId:canvasBinding.id,y:130},canvasId);
canvasState=addInteractionOccurrenceToPage(canvasState,canvasFlow.id,{name:"add_payment_info",pageFrameId:cartFrame.id,pageGroupId:canvasCheckout.id,pageId:cartPage.id,eventId:canvasPayment.id,obligation:"Required",minimum:1,maximum:1,y:250},canvasId);
const [canvasContext,canvasInteraction]=documentaryFlowGraph(canvasState.project,canvasFlow.id).occurrences;
assert.equal(canvasContext.pageFrameId,cartFrame.id);assert.equal(canvasContext.contextBindingId,canvasBinding.id);assert.equal("schema" in canvasContext,false);
assert.equal(canvasInteraction.pageFrameId,cartFrame.id);assert.equal(canvasInteraction.eventId,canvasPayment.id);
assert.equal(removeFlowPageFrame(canvasState,canvasFlow.id,"missing-frame"),canvasState);
assert.throws(()=>setFlowPageGroupLanes(canvasState,canvasFlow.id,[canvasDelivery.id]),/Cart.*Move Page frame.*Remove Page frame/);
canvasState=reorderFlowPageGroupLane(canvasState,canvasFlow.id,canvasDelivery.id,-1);
assert.deepEqual(documentaryFlowGraph(canvasState.project,canvasFlow.id).pageGroupIds,[canvasDelivery.id,canvasCheckout.id]);
canvasState=saveFlowViewState(canvasState,canvasFlow.id,{selectedItem:{kind:"occurrence",id:canvasInteraction.id},viewport:{x:42,y:18,zoom:1.25}});
assert.deepEqual(documentaryFlowGraph(canvasState.project,canvasFlow.id).selectedItem,{kind:"occurrence",id:canvasInteraction.id});
assert.deepEqual(documentaryFlowGraph(canvasState.project,canvasFlow.id).viewport,{x:42,y:18,zoom:1.25});
const invalidConnectionBytes=JSON.stringify(canvasState.project),invalidConnectionRevision=canvasState.revision;
assert.equal(saveGraphRelationship(canvasState,canvasFlow.id,canvasContext.id,{toStepId:canvasContext.id,kind:"expected-next"},canvasId),canvasState,"self-connections are atomic no-ops");
assert.equal(JSON.stringify(canvasState.project),invalidConnectionBytes);assert.equal(canvasState.revision,invalidConnectionRevision);

console.log("Flow graph projection tests passed");
