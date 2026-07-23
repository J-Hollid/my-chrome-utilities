import assert from "node:assert/strict";
import {FLOW_GRAPH_GEOMETRY,addEventOccurrenceToPage,addFlowPageFrame,addFreePageFrame,addGraphOccurrence,addInteractionOccurrenceToPage,applyFlowPageGroupLaneSelection,deriveFlowOccurrenceExample,documentaryFlowGraph,flowOccurrenceEventSchema,flowOccurrenceExampleEditorRows,flowOutline,flowRelationshipText,inferFlowRelationshipKind,inspectFlowGraph,inspectFreePageEdgeMove,inspectOccurrenceContainmentMove,inspectPageFrameDrop,migrateLegacyFlowRelationshipKinds,moveFlowPageFrame,moveFreePageFrame,moveGraphOccurrence,projectFlowGraph,reassignFlowOccurrencePage,removeFlowPageFrame,removeFlowRelationship,removeGraphOccurrence,reorderFlowPageGroupLane,reorderGraphOccurrence,saveFlowViewState,saveGraphRelationship,setFlowOccurrenceExample,setFlowPageGroupLanes,updateGraphOccurrence} from "../dist/data-layer-flow-graph.js";
import {consumeRelationshipDeletionFocus,contextSettingPageLabel,flowEdgeGeometry,flowViewAfterRelationshipDeletion,ownsPointerDrag,restorePointerCancellationFocus} from "../dist/data-layer-flow-graph-ui.js";
import {compileSpecificationProject,createCanonicalProjectEnvelope} from "../dist/data-layer-specification-engine.js";
import {addFlowStep,addProjectEntity,createSpecificationProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";

let sequence=0;
assert.equal(contextSettingPageLabel("Landing"),"Landing · Context-setting Page","every Page surface uses the fixed context-setting semantic label");
const id=(kind)=>`${kind}:graph-${++sequence}`;
let state=createSpecificationProject({name:"Shop",site:"shop.example",id});
const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);};
const checkout=add("pages",{name:"Checkout",eventName:"pageview"}),confirmation=add("pages",{name:"Confirmation",eventName:"pageview"}),route=add("events",{name:"route_view",eventName:"route_view"}),payment=add("events",{name:"add_payment_info",eventName:"add_payment_info"}),fallbackEvent=add("events",{name:"role_pending",eventName:"role_pending"}),rootCheckoutGroup=add("pageGroups",{name:"Checkout"}),flow=add("flows",{name:"Checkout journey",purpose:"Document checkout",steps:[]});

state=addFlowStep(state,flow.id,{name:"Executable legacy step",pageId:checkout.id,eventId:route.id,minimum:1,maximum:1,transitions:[]},id);
const executableBefore=structuredClone(state.project.collections.flows[0].steps);
state={...state,project:{...state.project,collections:{...state.project.collections,pages:state.project.collections.pages.map((page)=>[checkout.id,confirmation.id].includes(page.id)?{...page,pageGroupIds:[rootCheckoutGroup.id]}:page)}}};state=setFlowPageGroupLanes(state,flow.id,[rootCheckoutGroup.id]);state=addFlowPageFrame(state,flow.id,{pageId:checkout.id,pageGroupId:rootCheckoutGroup.id,x:40,y:40},id);state=addFlowPageFrame(state,flow.id,{pageId:confirmation.id,pageGroupId:rootCheckoutGroup.id,x:520,y:40},id);const [checkoutFrame,confirmationFrame]=documentaryFlowGraph(state.project,flow.id).pageFrames,compiledBefore=compileSpecificationProject(createCanonicalProjectEnvelope(state.project,"published"));
assert.equal(compiledBefore.status,"compiled");

const occurrence=(name,event,_lane,x,y)=>{state=addGraphOccurrence(state,flow.id,{name,pageFrameId:checkoutFrame.id,pageGroupId:rootCheckoutGroup.id,pageId:checkout.id,eventId:event.id,fallbackRole:event.role??"interaction",obligation:"Required",minimum:1,maximum:1,x,y},id);return documentaryFlowGraph(state.project,flow.id).occurrences.at(-1);};
const context=occurrence("Checkout context",route,"Context",30,70),interaction=occurrence("Checkout payment",payment,"Payment",430,190);
state=saveGraphRelationship(state,flow.id,checkoutFrame.id,{toStepId:confirmationFrame.id,sourcePort:"right",targetPort:"left",group:"checkout",label:"continue",documentationCondition:"checkout is open",expectation:"confirmation follows checkout",condition:{kind:"predicate",field:"forbidden",operator:"equals",value:"x"}},id);

const projection=projectFlowGraph(state.project,flow.id),relationship=projection.graph.relationships[0];
assert.deepEqual(projection.graph.nodes.map(({id,role,layout})=>({id,role,layout})),[
  {id:context.id,role:"interaction",layout:{lane:"Checkout",x:70,y:130}},
  {id:interaction.id,role:"interaction",layout:{lane:"Checkout",x:470,y:250}},
]);
assert.deepEqual(flowOutline(projection.graph).map(({nodeId,relationshipIds})=>({nodeId,relationshipIds})),[{nodeId:context.id,relationshipIds:[]},{nodeId:interaction.id,relationshipIds:[]}]);
assert.match(flowRelationshipText(projection.graph,relationship),/Checkout · expected_next · Confirmation/);
assert.equal(relationship.documentationCondition,"checkout is open");
assert.deepEqual({sourcePort:relationship.sourcePort,targetPort:relationship.targetPort,kind:relationship.kind},{sourcePort:"right",targetPort:"left",kind:"expected_next"});
assert.equal("condition" in documentaryFlowGraph(state.project,flow.id).relationships[0],false,"documentary storage rejects executable condition fields");
assert.deepEqual(inspectFlowGraph(projection.graph,projection.catalog),[]);
const isolated={...projection.graph,nodes:[...projection.graph.nodes,{...projection.graph.nodes[0],id:"isolated"}]};
assert.deepEqual(inspectFlowGraph(isolated,projection.catalog),[],"an isolated documentary occurrence is not a broken reference");

const input={name:"Authoritative Event role",pageFrameId:checkoutFrame.id,pageGroupId:rootCheckoutGroup.id,pageId:checkout.id,eventId:route.id,fallbackRole:"interaction",obligation:"Required",minimum:1,maximum:1,x:230,y:310};
assert.throws(()=>addGraphOccurrence(state,flow.id,{...input,pageFrameId:undefined,layout:{lane:"Any",x:230,y:310}},id),/containing Page frame/,"public authoring rejects every uncontained arbitrary lane");
for(const invalid of[{...input,name:"  "},{...input,pageId:"missing-page"},{...input,eventId:"missing-event"}])assert.throws(()=>addGraphOccurrence(state,flow.id,invalid,id),/requires/);
state=addGraphOccurrence(state,flow.id,input,id);
const authoritative=documentaryFlowGraph(state.project,flow.id).occurrences.at(-1);
assert.equal(authoritative.role,undefined,"the direct occurrence does not persist a documentary role");
assert.equal("fallbackRole" in authoritative,false,"an Event-owned role does not persist a redundant fallback");
assert.equal(projectFlowGraph(state.project,flow.id).graph.nodes.at(-1).role,"interaction","every Event occurrence projects as an interaction");
assert.equal("layout" in authoritative,false,"only lane and position are persisted");
const beforeNoOp=state;
assert.equal(reorderGraphOccurrence(state,flow.id,0,0),beforeNoOp);
assert.equal(reorderGraphOccurrence(state,flow.id,0,-10),beforeNoOp,"a clamped reorder to the current index is a no-op revision");
state={...state,project:{...state.project,documentationFlowGraphs:{...state.project.documentationFlowGraphs,[flow.id]:{...state.project.documentationFlowGraphs[flow.id],occurrences:state.project.documentationFlowGraphs[flow.id].occurrences.map((occurrence)=>occurrence.id===authoritative.id?{...occurrence,layout:{lane:"legacy",x:1,y:2}}:occurrence)}}}};
state=updateGraphOccurrence(state,flow.id,authoritative.id,input);
assert.equal("layout" in documentaryFlowGraph(state.project,flow.id).occurrences.at(-1),false,"editing strips an input layout object");
const fallback=occurrence("Fallback role",fallbackEvent,"Context",30,430);
assert.equal(fallback.role,undefined);assert.equal("fallbackRole" in fallback,false);
assert.equal(projectFlowGraph(state.project,flow.id).graph.nodes.at(-1).role,"interaction");
assert.throws(()=>updateGraphOccurrence(state,flow.id,"missing-occurrence",input),/Unknown/);
assert.equal(moveGraphOccurrence(state,flow.id,"missing-occurrence",{lane:"Context",x:30,y:70}),state);
assert.equal(removeGraphOccurrence(state,flow.id,"missing-occurrence"),state);
assert.throws(()=>saveGraphRelationship(state,flow.id,"missing-frame",{toStepId:checkoutFrame.id,sourcePort:"top",targetPort:"bottom"},id),/Page frames/);
assert.equal(inferFlowRelationshipKind("right","left"),"expected_next");
assert.equal(inferFlowRelationshipKind("top","bottom"),"alternative");
assert.equal(inferFlowRelationshipKind("bottom","top"),"merge");
for(const [sourcePort,targetPort] of [["left","right"],["right","top"],["top","left"],["bottom","left"]])assert.equal(inferFlowRelationshipKind(sourcePort,targetPort),undefined,`${sourcePort} to ${targetPort} is not a relationship gesture`);
const beforeInvalidPortPair=state;
assert.equal(saveGraphRelationship(state,flow.id,checkoutFrame.id,{toStepId:confirmationFrame.id,sourcePort:"right",targetPort:"top"},id),beforeInvalidPortPair,"an invalid port pair is an atomic no-op");
const deletionState=saveGraphRelationship(state,flow.id,confirmationFrame.id,{toStepId:checkoutFrame.id,sourcePort:"top",targetPort:"bottom",group:"review",documentationCondition:"identity remains",expectation:"manual",label:"Unrelated"},id),deletionGraph=documentaryFlowGraph(deletionState.project,flow.id),deletedRelationship=structuredClone(deletionGraph.relationships.find(({id})=>id===relationship.id)),unrelatedRelationship=structuredClone(deletionGraph.relationships.find(({id})=>id!==relationship.id)),endpointBytes=JSON.stringify(deletionGraph.pageFrames);
const afterRelationshipDeletion=removeFlowRelationship(deletionState,flow.id,relationship.id),afterDeletionGraph=documentaryFlowGraph(afterRelationshipDeletion.project,flow.id);
assert.equal(afterDeletionGraph.relationships.some(({id})=>id===relationship.id),false,"relationship deletion removes the exact stable record");
assert.deepEqual(afterDeletionGraph.relationships.find(({id})=>id===unrelatedRelationship.id),unrelatedRelationship,"relationship deletion leaves unrelated relationship bytes unchanged");
assert.equal(JSON.stringify(afterDeletionGraph.pageFrames),endpointBytes,"relationship deletion leaves both Page endpoints byte-identical");
assert.match(afterRelationshipDeletion.history.undo.at(-1).label,/Delete Flow relationship/);
const relationshipDeletionUndone=undoProjectTransaction(afterRelationshipDeletion),restoredDeletionGraph=documentaryFlowGraph(relationshipDeletionUndone.project,flow.id);
assert.deepEqual(restoredDeletionGraph.relationships.find(({id})=>id===relationship.id),deletedRelationship,"one Undo restores the complete relationship exactly once");
assert.equal(restoredDeletionGraph.relationships.filter(({id})=>id===relationship.id).length,1);
assert.equal(removeFlowRelationship(state,flow.id,"missing-relationship"),state,"deleting an unknown relationship is an atomic no-op");
const legacyRelationshipProject=structuredClone(state.project),legacyRelationships=legacyRelationshipProject.documentationFlowGraphs[flow.id].relationships;
legacyRelationships.push({id:"relationship:legacy-parallel",sourceEndpoint:{kind:"page-frame",id:checkoutFrame.id},targetEndpoint:{kind:"page-frame",id:confirmationFrame.id},kind:"parallel",group:"legacy",documentationCondition:"documented",expectation:"manual"});
const legacyRelationshipState={...state,project:legacyRelationshipProject},migratedRelationshipState=migrateLegacyFlowRelationshipKinds(legacyRelationshipState,flow.id),migratedRelationship=documentaryFlowGraph(migratedRelationshipState.project,flow.id).relationships.at(-1);
assert.deepEqual(migratedRelationship,{id:"relationship:legacy-parallel",sourceEndpoint:{kind:"page-frame",id:checkoutFrame.id},targetEndpoint:{kind:"page-frame",id:confirmationFrame.id},sourcePort:"top",targetPort:"bottom",kind:"alternative",group:"legacy",documentationCondition:"documented",expectation:"manual"});
const legacyProject=structuredClone(state.project),legacyId="flow-occurrence:stored-legacy";legacyProject.documentationFlowGraphs[flow.id].occurrences.push({id:legacyId,name:"Stored legacy",pageId:checkout.id,eventId:route.id,lane:"Imported lane",position:{x:12,y:34},obligation:"Required",minimum:1,maximum:1});assert.deepEqual(projectFlowGraph(legacyProject,flow.id).graph.nodes.find(({id})=>id===legacyId).layout,{lane:"Imported lane",x:12,y:34},"already-stored explicit legacy lanes remain projectable without reopening public authoring");

const compiledAfter=compileSpecificationProject(createCanonicalProjectEnvelope(state.project,"published"));
assert.equal(compiledAfter.status,"compiled");
assert.deepEqual(state.project.collections.flows[0].steps,executableBefore,"documentary graph authoring must not touch executable steps or transitions");
assert.equal(compiledAfter.plan.evaluatorContentIdentity,compiledBefore.plan.evaluatorContentIdentity,"documentary graph authoring must not change compiled/runtime evaluator behavior");

const directedCheckoutToPayment=flowEdgeGeometry({x:30,y:70},{x:430,y:210});
const deletionViewport={x:42,y:18,zoom:1.25},selectedRelationshipView={selectedItem:{kind:"relationship",id:relationship.id},viewport:deletionViewport};
assert.deepEqual(flowViewAfterRelationshipDeletion(selectedRelationshipView,relationship.id),{viewport:deletionViewport},"deletion clears its stale session selection without clearing the viewport");
assert.deepEqual(flowViewAfterRelationshipDeletion({selectedItem:{kind:"occurrence",id:context.id},viewport:deletionViewport},relationship.id),{selectedItem:{kind:"occurrence",id:context.id},viewport:deletionViewport},"deletion preserves an unrelated session selection");
const deletionFocus={id:relationship.id,sourceKind:"page-frame",sourceId:checkoutFrame.id,sourceFocused:false},firstDeletionFocus=consumeRelationshipDeletionFocus(deletionFocus,false),settledDeletionFocus=consumeRelationshipDeletionFocus(firstDeletionFocus.next,false),restoredRelationshipFocus=consumeRelationshipDeletionFocus(settledDeletionFocus.next,true);
assert.deepEqual(firstDeletionFocus,{target:"source",next:{...deletionFocus,sourceFocused:true}},"deletion requests source focus once");
assert.deepEqual(settledDeletionFocus,{next:firstDeletionFocus.next},"an unrelated re-render does not steal focus back to the source");
assert.deepEqual(restoredRelationshipFocus,{target:"relationship"},"Undo consumes the intent by requesting restored-edge focus once");
assert.equal(ownsPointerDrag(undefined,41),false,"a drag has no owner before pointerdown");
assert.equal(ownsPointerDrag(41,42),false,"a second pointer cannot finish or cancel the active pointer's drag");
assert.equal(ownsPointerDrag(41,41),true,"only the pointer that started a drag owns its move, finish, and cancel lifecycle");
const cancellationFocusCalls=[],microtasks=[],settledTasks=[],focusTarget={isConnected:true,focus:()=>cancellationFocusCalls.push("focus")};
restorePointerCancellationFocus(focusTarget,(callback)=>microtasks.push(callback),(callback)=>settledTasks.push(callback));
assert.equal(cancellationFocusCalls.length,1,"pointer cancellation restores focus synchronously before the protocol dispatch completes");
microtasks.shift()();settledTasks.shift()();
assert.equal(cancellationFocusCalls.length,3,"pointer cancellation repeats focus restoration after microtask and multi-pointer protocol settlement");
focusTarget.isConnected=false;restorePointerCancellationFocus(focusTarget,(callback)=>callback(),(callback)=>callback());
assert.equal(cancellationFocusCalls.length,3,"detached replacement frames are never focused");
assert.deepEqual(FLOW_GRAPH_GEOMETRY,{eventWidth:170,eventHeight:94,eventMinX:12,eventMinY:40,pageFrameMinWidth:190,pageFrameMinHeight:108,pageFrameChildRightPadding:20,pageFrameChildBottomPadding:16},"Flow projection and rendering share one explicit geometry contract");
assert.deepEqual({startX:directedCheckoutToPayment.startX,startY:directedCheckoutToPayment.startY,endX:directedCheckoutToPayment.endX,endY:directedCheckoutToPayment.endY},{startX:200,startY:117,endX:430,endY:257},"known source output and target input ports must not reverse");
assert.deepEqual(flowEdgeGeometry({x:10,y:20},{x:400,y:80},{width:190,height:108},{width:170,height:94}),{startX:200,startY:74,endX:400,endY:127,arrow:flowEdgeGeometry({x:10,y:20},{x:400,y:80},{width:190,height:108},{width:170,height:94}).arrow},"mixed Page/Event edges use distinct source and target dimensions");

for(const [source,target] of [[{x:230,y:70},{x:30,y:70}],[{x:230,y:70},{x:230,y:190}],[{x:230,y:70},{x:230,y:70}]]){
  const geometry=flowEdgeGeometry(source,target);
  assert.equal(Object.values(geometry).every((value)=>typeof value==="string"||Number.isFinite(value)),true,"edge geometry must remain finite");
  assert.equal(geometry.arrow.split(/[ ,]/).map(Number).every(Number.isFinite),true,"arrowhead coordinates must remain finite");
}

let laneSequence=0,laneState=createSpecificationProject({name:"Lane shop",site:"shop.example",id:(kind)=>`${kind}:lane-${++laneSequence}`});
const laneId=(kind)=>`${kind}:lane-${++laneSequence}`,laneAdd=(kind,entity)=>{laneState=addProjectEntity(laneState,kind,entity,laneId);return laneState.project.collections[kind].at(-1);};
const laneCheckoutPage=laneAdd("pages",{name:"Checkout"}),laneRoute=laneAdd("events",{name:"route_view",eventName:"route_view",role:"context-setting"}),lanePurchase=laneAdd("events",{name:"Purchase",eventName:"purchase"});
const checkoutGroup=laneAdd("pageGroups",{name:"Checkout"}),deliveryGroup=laneAdd("pageGroups",{name:"Delivery"}),confirmationGroup=laneAdd("pageGroups",{name:"Confirmation"}),tradeGroup=laneAdd("pageGroups",{name:"Trade"}),laneFlow=laneAdd("flows",{name:"Checkout journey",steps:[]});laneState={...laneState,project:{...laneState.project,collections:{...laneState.project.collections,pages:laneState.project.collections.pages.map((page)=>page.id===laneCheckoutPage.id?{...page,pageGroupIds:[checkoutGroup.id,deliveryGroup.id,confirmationGroup.id,tradeGroup.id]}:page)}}};const laneCompiledBefore=compileSpecificationProject(createCanonicalProjectEnvelope(laneState.project,"published"));
laneState=setFlowPageGroupLanes(laneState,laneFlow.id,[checkoutGroup.id,deliveryGroup.id,confirmationGroup.id]);
laneState=addFlowPageFrame(laneState,laneFlow.id,{pageId:laneCheckoutPage.id,pageGroupId:checkoutGroup.id,x:40,y:40},laneId);laneState=addFlowPageFrame(laneState,laneFlow.id,{pageId:laneCheckoutPage.id,pageGroupId:deliveryGroup.id,x:40,y:40},laneId);
assert.deepEqual(documentaryFlowGraph(laneState.project,laneFlow.id).pageGroupIds,[checkoutGroup.id,deliveryGroup.id,confirmationGroup.id]);
assert.equal(applyFlowPageGroupLaneSelection(laneState,laneFlow.id,undefined),laneState,"saving unrelated Flow fields preserves documentary lanes when the lane control is managed separately");
assert.equal("pageGroupIds" in laneState.project.collections.flows.at(-1),false,"documentary lane order stays outside the executable Flow entity");
assert.equal(compileSpecificationProject(createCanonicalProjectEnvelope(laneState.project,"published")).plan.evaluatorContentIdentity,laneCompiledBefore.plan.evaluatorContentIdentity,"documentary lane order must not change evaluator identity");
const addLaneOccurrence=(input)=>{const event=input.role==="context-setting"?laneRoute:lanePurchase,frame=documentaryFlowGraph(laneState.project,laneFlow.id).pageFrames.find(({pageGroupId})=>pageGroupId===input.pageGroupId);laneState=addGraphOccurrence(laneState,laneFlow.id,{name:event.name,pageFrameId:frame.id,pageGroupId:input.pageGroupId,pageId:laneCheckoutPage.id,eventId:event.id,role:input.role??"interaction",...(input.trigger?{trigger:input.trigger}:{}),obligation:"Required",minimum:1,maximum:1,y:input.y},laneId);return documentaryFlowGraph(laneState.project,laneFlow.id).occurrences.at(-1);};
const initialContext=addLaneOccurrence({pageGroupId:checkoutGroup.id,role:"context-setting",trigger:"Initial load",y:70}),routeContext=addLaneOccurrence({pageGroupId:checkoutGroup.id,role:"context-setting",trigger:"SPA route change",y:190}),purchaseOccurrence=addLaneOccurrence({pageGroupId:deliveryGroup.id,y:310});
assert.throws(()=>setFlowPageGroupLanes(laneState,laneFlow.id,[checkoutGroup.id,confirmationGroup.id]),/reassigned or removed/,"a referenced lane cannot be removed without consequential review");
for(const occurrenceRecord of [initialContext,routeContext,purchaseOccurrence])assert.equal(["fallbackRole","lane","layout","schema","schemaId","contextBindingId"].some((key)=>key in occurrenceRecord),false,"semantic occurrence storage excludes bindings, lane strings, coordinates, and Event schema copies");
assert.equal(purchaseOccurrence.position.x,24,"contained occurrences persist their position within the Page frame");assert.equal(initialContext.eventId,laneRoute.id);assert.equal(initialContext.trigger,"Initial load");assert.equal(purchaseOccurrence.eventId,lanePurchase.id);
assert.equal(flowOccurrenceEventSchema(laneState.project,laneFlow.id,purchaseOccurrence.id),lanePurchase.id,"a Flow occurrence resolves its Event contributor identity without a standalone schema reference");
let laneProjection=projectFlowGraph(laneState.project,laneFlow.id);
assert.deepEqual(laneProjection.lanes.map(({id,name})=>[id,name]),[[checkoutGroup.id,"Checkout"],[deliveryGroup.id,"Delivery"],[confirmationGroup.id,"Confirmation"]]);
assert.deepEqual(laneProjection.graph.nodes.map(({pageGroupId,layout})=>[pageGroupId,layout.x,layout.y]),[[checkoutGroup.id,64,130],[checkoutGroup.id,64,250],[deliveryGroup.id,64,774]]);
laneState={...laneState,project:{...laneState.project,collections:{...laneState.project.collections,pageGroups:laneState.project.collections.pageGroups.map((group)=>group.id===deliveryGroup.id?{...group,name:"Fulfilment"}:group)}}};
laneState=setFlowPageGroupLanes(laneState,laneFlow.id,[checkoutGroup.id,confirmationGroup.id,deliveryGroup.id]);laneProjection=projectFlowGraph(laneState.project,laneFlow.id);
assert.deepEqual(laneProjection.lanes.map(({name})=>name),["Checkout","Confirmation","Fulfilment"]);assert.equal(laneProjection.graph.nodes.find(({id})=>id===purchaseOccurrence.id).layout.x,64);assert.equal(documentaryFlowGraph(laneState.project,laneFlow.id).occurrences.find(({id})=>id===purchaseOccurrence.id).position.y,310);
const tradePage=laneAdd("pages",{name:"Trade Page",contextEventBindings:[],pageGroupIds:[tradeGroup.id]});laneState=setFlowPageGroupLanes(laneState,laneFlow.id,[checkoutGroup.id,confirmationGroup.id,deliveryGroup.id,tradeGroup.id]);laneState=addFlowPageFrame(laneState,laneFlow.id,{pageId:tradePage.id,pageGroupId:tradeGroup.id,x:40,y:40},laneId);const tradeFrame=documentaryFlowGraph(laneState.project,laneFlow.id).pageFrames.find(({pageId})=>pageId===tradePage.id);
const containment=inspectOccurrenceContainmentMove(laneState.project,laneFlow.id,purchaseOccurrence.id,tradeGroup.id,tradePage.id);assert.equal(containment.rejected,false);for(const name of["Purchase","Checkout","Trade Page"])assert.ok(containment.message.includes(name));const beforeRejectedMove=laneState;assert.equal(moveGraphOccurrence(laneState,laneFlow.id,purchaseOccurrence.id,{pageGroupId:tradeGroup.id,y:430}),beforeRejectedMove,"drag movement cannot implicitly change the containing Page");const purchaseIdentity=JSON.stringify({id:purchaseOccurrence.id,eventId:purchaseOccurrence.eventId,trigger:purchaseOccurrence.trigger,position:purchaseOccurrence.position});laneState=reassignFlowOccurrencePage(laneState,laneFlow.id,purchaseOccurrence.id,tradeFrame.id);const reassignedPurchase=documentaryFlowGraph(laneState.project,laneFlow.id).occurrences.find(({id})=>id===purchaseOccurrence.id);assert.equal(reassignedPurchase.pageFrameId,tradeFrame.id);assert.equal(reassignedPurchase.pageId,tradePage.id);assert.equal(JSON.stringify({id:reassignedPurchase.id,eventId:reassignedPurchase.eventId,trigger:reassignedPurchase.trigger,position:reassignedPurchase.position}),purchaseIdentity);
laneState=addInteractionOccurrenceToPage(laneState,laneFlow.id,{name:"Trade Purchase",pageFrameId:tradeFrame.id,pageGroupId:tradeGroup.id,pageId:tradePage.id,eventId:lanePurchase.id,obligation:"Required",minimum:1,maximum:1,y:70},laneId);const afterPalette=documentaryFlowGraph(laneState.project,laneFlow.id),movedPurchase=afterPalette.occurrences.find(({id})=>id===purchaseOccurrence.id),tradePurchase=afterPalette.occurrences.find(({name})=>name==="Trade Purchase");assert.equal(movedPurchase.pageGroupId,tradeGroup.id);assert.equal(tradePurchase.pageGroupId,tradeGroup.id);assert.equal(tradePurchase.eventId,movedPurchase.eventId);
const landingPage=laneAdd("pages",{name:"Landing Page"}),campaignPage=laneAdd("pages",{name:"Campaign Page"}),lanesBeforeFree=structuredClone(documentaryFlowGraph(laneState.project,laneFlow.id).pageGroupIds),groupsBeforeFree=structuredClone(laneState.project.collections.pageGroups);laneState=addFreePageFrame(laneState,laneFlow.id,{pageId:landingPage.id,region:"before-lanes",x:24,y:70},laneId);laneState=addFreePageFrame(laneState,laneFlow.id,{pageId:campaignPage.id,region:"after-lanes",x:38,y:110},laneId);const [freeFrame,campaignFrame]=documentaryFlowGraph(laneState.project,laneFlow.id).pageFrames.slice(-2);assert.deepEqual({freePageRegion:freeFrame.freePageRegion,position:freeFrame.position},{freePageRegion:"before-lanes",position:{x:24,y:70}});assert.deepEqual({freePageRegion:campaignFrame.freePageRegion,position:campaignFrame.position},{freePageRegion:"after-lanes",position:{x:38,y:110}});assert.equal("pageGroupId" in freeFrame,false);assert.deepEqual(documentaryFlowGraph(laneState.project,laneFlow.id).pageGroupIds,lanesBeforeFree);assert.deepEqual(laneState.project.collections.pageGroups,groupsBeforeFree);const freeIdentity=JSON.stringify({id:freeFrame.id,pageId:freeFrame.pageId});laneState=moveFreePageFrame(laneState,laneFlow.id,freeFrame.id,{region:"after-lanes",x:46,y:90});const editedFreeFrame=documentaryFlowGraph(laneState.project,laneFlow.id).pageFrames.find(({id})=>id===freeFrame.id);assert.deepEqual({freePageRegion:editedFreeFrame.freePageRegion,position:editedFreeFrame.position},{freePageRegion:"after-lanes",position:{x:46,y:90}});assert.equal(JSON.stringify({id:editedFreeFrame.id,pageId:editedFreeFrame.pageId}),freeIdentity);assert.equal(moveFreePageFrame(laneState,laneFlow.id,freeFrame.id,{region:"after-lanes",x:46,y:90}),laneState,"an unchanged free-frame key projection is a byte-identical no-op");laneState=moveFreePageFrame(laneState,laneFlow.id,freeFrame.id,{region:"before-lanes",x:46,y:55});assert.equal(moveFreePageFrame(laneState,laneFlow.id,freeFrame.id,{region:"before-lanes",x:46,y:35}),laneState,"a clamped free-frame key projection is a byte-identical no-op");laneState=moveFreePageFrame(laneState,laneFlow.id,freeFrame.id,{region:"after-lanes",x:46,y:90});laneState=addInteractionOccurrenceToPage(laneState,laneFlow.id,{name:"Landing Purchase",pageFrameId:freeFrame.id,pageId:landingPage.id,eventId:lanePurchase.id,obligation:"Required",minimum:1,maximum:1,y:190},laneId);const landingPurchase=documentaryFlowGraph(laneState.project,laneFlow.id).occurrences.at(-1),deliveryFrame=documentaryFlowGraph(laneState.project,laneFlow.id).pageFrames.find(({pageGroupId})=>pageGroupId===deliveryGroup.id);laneState=saveGraphRelationship(laneState,laneFlow.id,freeFrame.id,{toStepId:deliveryFrame.id,sourcePort:"right",targetPort:"left"},laneId);const freeProjection=projectFlowGraph(laneState.project,laneFlow.id),projectedChild=freeProjection.graph.nodes.find(({id})=>id===landingPurchase.id);assert.equal(freeProjection.graph.relationships.at(-1).sourceNodeId,freeFrame.id);assert.equal(projectedChild.layout.lane,"after-lanes");assert.ok(projectedChild.layout.x>freeProjection.graph.nodes.find(({pageGroupId})=>pageGroupId===checkoutGroup.id).layout.x);const rejectedDrop=inspectFreePageEdgeMove(laneState.project,laneFlow.id,purchaseOccurrence.id,"after-lanes");assert.equal(rejectedDrop.rejected,true);assert.match(rejectedDrop.guidance,/kind=pages.*entity=.*field=pageGroupIds/);

// Canvas-first correction: lanes contain explicitly placed Page frames rather than
// implicitly rendering every Page Group member.
let canvasSequence=0,canvasState=createSpecificationProject({name:"Canvas shop",site:"shop.example",id:(kind)=>`${kind}:canvas-${++canvasSequence}`});
const canvasId=(kind)=>`${kind}:canvas-${++canvasSequence}`,canvasAdd=(kind,entity)=>{canvasState=addProjectEntity(canvasState,kind,entity,canvasId);return canvasState.project.collections[kind].at(-1);};
const cartPage=canvasAdd("pages",{name:"Cart",eventName:"pageview"}),shippingPage=canvasAdd("pages",{name:"Shipping",eventName:"pageview"});
const canvasPayment=canvasAdd("events",{name:"add_payment_info",eventName:"add_payment_info"});
const canvasCheckout=canvasAdd("pageGroups",{name:"Checkout"}),canvasDelivery=canvasAdd("pageGroups",{name:"Delivery"}),canvasFlow=canvasAdd("flows",{name:"Fresh journey",steps:[]});canvasState={...canvasState,project:{...canvasState.project,collections:{...canvasState.project.collections,pages:canvasState.project.collections.pages.map((page)=>page.id===cartPage.id?{...page,pageGroupIds:[canvasCheckout.id]}:page.id===shippingPage.id?{...page,pageGroupIds:[canvasDelivery.id]}:page)}}};
assert.deepEqual(documentaryFlowGraph(canvasState.project,canvasFlow.id).pageFrames,[]);
canvasState=setFlowPageGroupLanes(canvasState,canvasFlow.id,[canvasCheckout.id,canvasDelivery.id]);
canvasState=addFlowPageFrame(canvasState,canvasFlow.id,{pageId:cartPage.id,pageGroupId:canvasCheckout.id,y:90},canvasId);
const cartFrame=documentaryFlowGraph(canvasState.project,canvasFlow.id).pageFrames[0];
assert.deepEqual({pageId:cartFrame.pageId,pageGroupId:cartFrame.pageGroupId,position:cartFrame.position},{pageId:cartPage.id,pageGroupId:canvasCheckout.id,position:{x:40,y:90}});
const wrongFrameBefore=canvasState;
assert.equal(addFlowPageFrame(canvasState,canvasFlow.id,{pageId:shippingPage.id,pageGroupId:canvasCheckout.id,y:90},canvasId),wrongFrameBefore,"a wrong-group Page drop is an atomic no-op");
assert.equal(inspectPageFrameDrop(canvasState.project,canvasFlow.id,shippingPage.id,canvasCheckout.id).rejected,true);
canvasState=addInteractionOccurrenceToPage(canvasState,canvasFlow.id,{name:"add_payment_info",pageFrameId:cartFrame.id,pageGroupId:canvasCheckout.id,pageId:cartPage.id,eventId:canvasPayment.id,obligation:"Required",minimum:1,maximum:1,y:250},canvasId);
const [canvasInteraction]=documentaryFlowGraph(canvasState.project,canvasFlow.id).occurrences;
assert.equal(canvasInteraction.pageFrameId,cartFrame.id);assert.equal(canvasInteraction.eventId,canvasPayment.id);
assert.equal(removeFlowPageFrame(canvasState,canvasFlow.id,"missing-frame"),canvasState);
assert.throws(()=>setFlowPageGroupLanes(canvasState,canvasFlow.id,[canvasDelivery.id]),/Cart.*Move Page frame.*Remove Page frame/);
canvasState=reorderFlowPageGroupLane(canvasState,canvasFlow.id,canvasDelivery.id,-1);
assert.deepEqual(documentaryFlowGraph(canvasState.project,canvasFlow.id).pageGroupIds,[canvasDelivery.id,canvasCheckout.id]);
const beforeTransientView=canvasState;
canvasState=saveFlowViewState(canvasState,canvasFlow.id,{selectedItem:{kind:"occurrence",id:canvasInteraction.id},viewport:{x:42,y:18,zoom:1.25}});
assert.equal(canvasState,beforeTransientView,"Flow selection and viewport are transient and do not advance the canonical Draft");
assert.equal(documentaryFlowGraph(canvasState.project,canvasFlow.id).selectedItem,undefined);
assert.equal(documentaryFlowGraph(canvasState.project,canvasFlow.id).viewport,undefined);
const invalidConnectionBytes=JSON.stringify(canvasState.project),invalidConnectionRevision=canvasState.revision;
assert.throws(()=>saveGraphRelationship(canvasState,canvasFlow.id,canvasInteraction.id,{toStepId:cartFrame.id,sourcePort:"right",targetPort:"left"},canvasId),/Page frames/,"Event occurrences are not relationship endpoints");
assert.equal(JSON.stringify(canvasState.project),invalidConnectionBytes);assert.equal(canvasState.revision,invalidConnectionRevision);

let membershipSequence=0,membershipState=createSpecificationProject({name:"Multi-membership Flow",site:"shop.example",id:(kind)=>`${kind}:multi-${++membershipSequence}`});
const membershipId=(kind)=>`${kind}:multi-${++membershipSequence}`,membershipAdd=(kind,entity)=>{membershipState=addProjectEntity(membershipState,kind,entity,membershipId);return membershipState.project.collections[kind].at(-1);};
const multiCheckout=membershipAdd("pageGroups",{name:"Checkout"}),multiRetail=membershipAdd("pageGroups",{name:"Retail Checkout"}),multiDelivery=membershipAdd("pageGroups",{name:"Delivery"}),multiCart=membershipAdd("pages",{name:"Cart",pageGroupIds:[multiCheckout.id,multiRetail.id]}),multiEvent=membershipAdd("events",{name:"Purchase",eventName:"purchase",role:"interaction"}),multiFlow=membershipAdd("flows",{name:"Checkout journey",steps:[]});
membershipState=setFlowPageGroupLanes(membershipState,multiFlow.id,[multiCheckout.id,multiRetail.id,multiDelivery.id]);
assert.equal(inspectPageFrameDrop(membershipState.project,multiFlow.id,multiCart.id,multiCheckout.id).rejected,false);assert.equal(inspectPageFrameDrop(membershipState.project,multiFlow.id,multiCart.id,multiRetail.id).rejected,false);assert.equal(inspectPageFrameDrop(membershipState.project,multiFlow.id,multiCart.id,multiDelivery.id).rejected,true);
membershipState=addFlowPageFrame(membershipState,multiFlow.id,{pageId:multiCart.id,pageGroupId:multiRetail.id,y:90},membershipId);let multiGraph=documentaryFlowGraph(membershipState.project,multiFlow.id),multiFrame=multiGraph.pageFrames[0];membershipState=addEventOccurrenceToPage(membershipState,multiFlow.id,{name:"Purchase",pageFrameId:multiFrame.id,pageGroupId:multiRetail.id,pageId:multiCart.id,eventId:multiEvent.id,role:"interaction",obligation:"Required",minimum:1,maximum:1,y:130},membershipId);multiGraph=documentaryFlowGraph(membershipState.project,multiFlow.id);const multiOccurrence=multiGraph.occurrences[0],multiIdentity=JSON.stringify({frame:multiFrame.id,occurrence:multiOccurrence.id,eventId:multiOccurrence.eventId,pageId:multiOccurrence.pageId,memberships:multiCart.pageGroupIds});
membershipState=moveFlowPageFrame(membershipState,multiFlow.id,multiFrame.id,{pageGroupId:multiCheckout.id,y:110});multiGraph=documentaryFlowGraph(membershipState.project,multiFlow.id);multiFrame=multiGraph.pageFrames[0];const movedOccurrence=multiGraph.occurrences[0];assert.deepEqual({pageGroupId:multiFrame.pageGroupId,position:multiFrame.position,occurrenceGroup:movedOccurrence.pageGroupId,projectedGroup:projectFlowGraph(membershipState.project,multiFlow.id).graph.nodes[0].pageGroupId},{pageGroupId:multiCheckout.id,position:{x:40,y:110},occurrenceGroup:multiRetail.id,projectedGroup:multiCheckout.id});assert.equal(JSON.stringify({frame:multiFrame.id,occurrence:movedOccurrence.id,eventId:movedOccurrence.eventId,pageId:movedOccurrence.pageId,memberships:membershipState.project.collections.pages.find(({id})=>id===multiCart.id).pageGroupIds}),multiIdentity);
const rejectedMembershipMove=membershipState;assert.equal(moveFlowPageFrame(membershipState,multiFlow.id,multiFrame.id,{pageGroupId:multiDelivery.id,y:130}),rejectedMembershipMove,"moving a frame to a non-membership lane is a byte-identical no-op");

// Horizontal-band topology retains authored Page and Event coordinates, permits a
// grouped Page to use an edge region without changing membership, and persists
// every supported relationship as typed stable endpoints.
let topologySequence=0,topologyState=createSpecificationProject({name:"Topology shop",site:"shop.example",id:(kind)=>`${kind}:topology-${++topologySequence}`});
const topologyId=(kind)=>`${kind}:topology-${++topologySequence}`,topologyAdd=(kind,entity)=>{topologyState=addProjectEntity(topologyState,kind,entity,topologyId);return topologyState.project.collections[kind].at(-1);};
const topologyCheckout=topologyAdd("pageGroups",{name:"Checkout"}),topologyDelivery=topologyAdd("pageGroups",{name:"Delivery"}),topologyCustomer=topologyAdd("pages",{name:"Customer details",pageGroupIds:[topologyCheckout.id]}),topologyPayment=topologyAdd("pages",{name:"Payment",pageGroupIds:[topologyCheckout.id]}),topologyEvent=topologyAdd("events",{name:"Product view",eventName:"view_item",role:"interaction"}),topologyFlow=topologyAdd("flows",{name:"Topology journey",steps:[]});
topologyState=setFlowPageGroupLanes(topologyState,topologyFlow.id,[topologyCheckout.id,topologyDelivery.id]);
topologyState=addFlowPageFrame(topologyState,topologyFlow.id,{pageId:topologyCustomer.id,pageGroupId:topologyCheckout.id,x:80,y:150},topologyId);
topologyState=addFlowPageFrame(topologyState,topologyFlow.id,{pageId:topologyPayment.id,pageGroupId:topologyCheckout.id,x:520,y:150},topologyId);
let topologyGraph=documentaryFlowGraph(topologyState.project,topologyFlow.id);const [customerFrame,paymentFrame]=topologyGraph.pageFrames;
assert.deepEqual(topologyGraph.pageFrames.map(({position})=>position),[{x:80,y:150},{x:520,y:150}]);
topologyState=addEventOccurrenceToPage(topologyState,topologyFlow.id,{name:"Product view A",pageFrameId:customerFrame.id,pageGroupId:topologyCheckout.id,pageId:topologyCustomer.id,eventId:topologyEvent.id,role:"interaction",obligation:"Required",minimum:1,maximum:1,x:36,y:110},topologyId);
topologyState=addEventOccurrenceToPage(topologyState,topologyFlow.id,{name:"Product view B",pageFrameId:customerFrame.id,pageGroupId:topologyCheckout.id,pageId:topologyCustomer.id,eventId:topologyEvent.id,role:"interaction",obligation:"Required",minimum:1,maximum:1,x:250,y:110},topologyId);
topologyGraph=documentaryFlowGraph(topologyState.project,topologyFlow.id);const [eventA,eventB]=topologyGraph.occurrences;
assert.deepEqual(topologyGraph.occurrences.map(({position})=>position),[{x:36,y:110},{x:250,y:110}],"Event occurrences retain side-by-side coordinates inside their Page frame");
topologyState=moveGraphOccurrence(topologyState,topologyFlow.id,eventB.id,{x:310,y:180});
assert.deepEqual(documentaryFlowGraph(topologyState.project,topologyFlow.id).occurrences[1].position,{x:310,y:180});
const membershipsBeforeEdge=structuredClone(topologyState.project.collections.pages.find(({id})=>id===topologyCustomer.id).pageGroupIds);
topologyState=moveFreePageFrame(topologyState,topologyFlow.id,customerFrame.id,{region:"before-lanes",x:28,y:95});
let movedCustomer=documentaryFlowGraph(topologyState.project,topologyFlow.id).pageFrames.find(({id})=>id===customerFrame.id);
assert.deepEqual({pageGroupId:movedCustomer.pageGroupId,freePageRegion:movedCustomer.freePageRegion,position:movedCustomer.position},{pageGroupId:undefined,freePageRegion:"before-lanes",position:{x:28,y:95}});
assert.deepEqual(topologyState.project.collections.pages.find(({id})=>id===topologyCustomer.id).pageGroupIds,membershipsBeforeEdge,"edge placement does not change ordered Page Group membership");
topologyState=moveFlowPageFrame(topologyState,topologyFlow.id,customerFrame.id,{pageGroupId:topologyCheckout.id,x:90,y:160});
movedCustomer=documentaryFlowGraph(topologyState.project,topologyFlow.id).pageFrames.find(({id})=>id===customerFrame.id);
assert.deepEqual({pageGroupId:movedCustomer.pageGroupId,freePageRegion:movedCustomer.freePageRegion,position:movedCustomer.position},{pageGroupId:topologyCheckout.id,freePageRegion:undefined,position:{x:90,y:160}});
const beforeIneligible=topologyState;assert.equal(moveFlowPageFrame(topologyState,topologyFlow.id,customerFrame.id,{pageGroupId:topologyDelivery.id,x:90,y:160}),beforeIneligible);
topologyState=saveGraphRelationship(topologyState,topologyFlow.id,customerFrame.id,{toStepId:paymentFrame.id,sourcePort:"right",targetPort:"left"},topologyId);
for(const [source,target] of [[customerFrame.id,eventB.id],[eventA.id,paymentFrame.id],[eventA.id,eventB.id]])assert.throws(()=>saveGraphRelationship(topologyState,topologyFlow.id,source,{toStepId:target,sourcePort:"right",targetPort:"left"},topologyId),/Page frames/);
const typedRelationships=documentaryFlowGraph(topologyState.project,topologyFlow.id).relationships;
assert.deepEqual(typedRelationships.map(({sourceEndpoint,targetEndpoint})=>[sourceEndpoint.kind,targetEndpoint.kind]),[["page-frame","page-frame"]]);
assert.equal(typedRelationships.some((relationship)=>"sourceNodeId" in relationship||"targetNodeId" in relationship),false,"canonical relationships use typed endpoints, not occurrence-only aliases");
const topologyProjection=projectFlowGraph(topologyState.project,topologyFlow.id);
assert.deepEqual(topologyProjection.graph.connectionEndpoints.map(({kind,id})=>[kind,id]),[["page-frame",customerFrame.id],["page-frame",paymentFrame.id]]);
assert.ok(topologyProjection.laneBands[0].y<topologyProjection.laneBands[1].y,"selected Page Groups project as top-to-bottom horizontal bands");

// Event JSON is derived from the effective layered schema; examples remain on
// their canonical contributors and are never copied into a stored payload.
let exampleSequence=0,exampleState=createSpecificationProject({name:"Example shop",site:"shop.example",id:(kind)=>`${kind}:example-${++exampleSequence}`});
const exampleId=(kind)=>`${kind}:example-${++exampleSequence}`,exampleAdd=(kind,entity)=>{exampleState=addProjectEntity(exampleState,kind,entity,exampleId);return exampleState.project.collections[kind].at(-1);};
const sitewide=exampleAdd("profiles",{name:"Sitewide",schemaConstraints:[{path:"/page_type",type:"string",examples:["product_detail"]}]}),exampleGroup=exampleAdd("pageGroups",{name:"Product",schemaConstraints:[{path:"/forbidden",presence:"forbidden",examples:["omit-me"]}]}),examplePage=exampleAdd("pages",{name:"Product detail Page",profileId:sitewide.id,pageGroupIds:[exampleGroup.id],schemaConstraints:[{path:"/product_id",type:"string",examples:["SKU-BASE"]},{path:"/product_name",type:"string",presence:"required"},{path:"/quantity",type:"number"}]}),exampleEvent=exampleAdd("events",{name:"Product view Event",eventName:"view_item",role:"interaction",schemaConstraints:[{path:"/event",type:"string",examples:["view_item"]}]}),exampleFlow=exampleAdd("flows",{name:"Product journey",steps:[]});
exampleState=setFlowPageGroupLanes(exampleState,exampleFlow.id,[exampleGroup.id]);exampleState=addFlowPageFrame(exampleState,exampleFlow.id,{pageId:examplePage.id,pageGroupId:exampleGroup.id,x:80,y:120},exampleId);const exampleFrame=documentaryFlowGraph(exampleState.project,exampleFlow.id).pageFrames[0];exampleState=addEventOccurrenceToPage(exampleState,exampleFlow.id,{name:"Product view occurrence",pageFrameId:exampleFrame.id,pageGroupId:exampleGroup.id,pageId:examplePage.id,eventId:exampleEvent.id,role:"interaction",obligation:"Required",minimum:1,maximum:1,x:40,y:100},exampleId);const exampleOccurrence=documentaryFlowGraph(exampleState.project,exampleFlow.id).occurrences[0];
exampleState=setFlowOccurrenceExample(exampleState,exampleFlow.id,exampleOccurrence.id,"/product_id","SKU-42",exampleId);exampleState=setFlowOccurrenceExample(exampleState,exampleFlow.id,exampleOccurrence.id,"/ecommerce/currency","EUR",exampleId);
let derived=deriveFlowOccurrenceExample(exampleState.project,exampleFlow.id,exampleOccurrence.id);
assert.equal(derived.status,"Incomplete");assert.deepEqual(derived.payload,{page_type:"product_detail",product_id:"SKU-42",event:"view_item",ecommerce:{currency:"EUR"}});assert.deepEqual(derived.provenance,{"/page_type":"Sitewide","/product_id":"Product view occurrence","/event":"Product view Event","/ecommerce/currency":"Product view occurrence"});assert.equal("product_name" in derived.payload,false);assert.equal("forbidden" in derived.payload,false);assert.deepEqual(derived.issues.map(({path,code})=>[path,code]),[["/product_name","REQUIRED_EXAMPLE"]]);assert.match(derived.issues[0].editHref,/flow-page-instance.*product_name/);assert.equal(JSON.stringify(documentaryFlowGraph(exampleState.project,exampleFlow.id)).includes('"payload"'),false);
const editorRows=flowOccurrenceExampleEditorRows(exampleState.project,exampleFlow.id,exampleOccurrence.id).map(({path,value})=>[path,value]).sort(([left],[right])=>left.localeCompare(right));
assert.deepEqual(editorRows,[["/ecommerce",{currency:"EUR"}],["/ecommerce/currency","EUR"],["/event","view_item"],["/forbidden",undefined],["/page_type","product_detail"],["/product_id","SKU-42"],["/product_name",undefined],["/quantity",undefined]],"the occurrence editor exposes every effective path, including valid optional fields");
exampleState=setFlowOccurrenceExample(exampleState,exampleFlow.id,exampleOccurrence.id,"/product_name","Phone",exampleId);derived=deriveFlowOccurrenceExample(exampleState.project,exampleFlow.id,exampleOccurrence.id);assert.equal(derived.status,"Complete");assert.equal(derived.payload.product_name,"Phone");
exampleState=setFlowOccurrenceExample(exampleState,exampleFlow.id,exampleOccurrence.id,"/quantity","many",exampleId);derived=deriveFlowOccurrenceExample(exampleState.project,exampleFlow.id,exampleOccurrence.id);assert.equal(derived.status,"Invalid");assert.deepEqual(derived.issues.map(({path,code})=>[path,code]),[["/quantity","TYPE"]]);

console.log("Flow graph projection tests passed");
