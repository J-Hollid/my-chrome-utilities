import assert from "node:assert/strict";
import {addFlowPageFrame,addGraphOccurrence,documentaryFlowGraph,removeFlowRelationship,saveGraphRelationship,setFlowPageGroupLanes} from "../dist/data-layer-flow-graph.js";
import {consumeRelationshipDeletionFocus,flowRelationshipDeletionAccessibleName,flowViewAfterRelationshipDeletion} from "../dist/data-layer-flow-graph-ui.js";
import {addProjectEntity,createSpecificationProject,undoProjectTransaction} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:relationship-deletion-${++sequence}`;
let state=createSpecificationProject({name:"Shop",site:"shop.example",id});
const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);};
const customer=add("pages",{name:"Customer details",eventName:"pageview"}),payment=add("pages",{name:"Payment",eventName:"pageview"}),verify=add("events",{name:"verify_identity",eventName:"verify_identity"}),group=add("pageGroups",{name:"Checkout"}),flow=add("flows",{name:"Checkout journey",purpose:"Document checkout",steps:[]});
state={...state,project:{...state.project,collections:{...state.project.collections,pages:state.project.collections.pages.map((page)=>page.id===customer.id||page.id===payment.id?{...page,pageGroupIds:[group.id]}:page)}}};
state=setFlowPageGroupLanes(state,flow.id,[group.id]);
state=addFlowPageFrame(state,flow.id,{pageId:customer.id,pageGroupId:group.id,x:40,y:40},id);
state=addFlowPageFrame(state,flow.id,{pageId:payment.id,pageGroupId:group.id,x:420,y:40},id);
const [customerFrame,paymentFrame]=documentaryFlowGraph(state.project,flow.id).pageFrames;
state=addGraphOccurrence(state,flow.id,{name:"ID verification",pageFrameId:customerFrame.id,pageGroupId:group.id,pageId:customer.id,eventId:verify.id,fallbackRole:"interaction",obligation:"Required",minimum:1,maximum:1,x:30,y:70},id);
const verification=documentaryFlowGraph(state.project,flow.id).occurrences[0];
state=saveGraphRelationship(state,flow.id,customerFrame.id,{toStepId:paymentFrame.id,sourcePort:"right",targetPort:"left",label:"Checkout route",group:"primary",documentationCondition:"checkout is open",expectation:"payment follows details"},id);
state=saveGraphRelationship(state,flow.id,paymentFrame.id,{toStepId:customerFrame.id,sourcePort:"top",targetPort:"bottom",group:"identity",documentationCondition:"identity required",expectation:"details can be revisited"},id);

const before=documentaryFlowGraph(state.project,flow.id),labelled=structuredClone(before.relationships[0]),unlabelled=structuredClone(before.relationships[1]),endpointBytes=JSON.stringify(before.pageFrames),unrelatedBytes=JSON.stringify(unlabelled);
assert.equal(flowRelationshipDeletionAccessibleName(labelled.label,"Customer details","Payment"),"Delete relationship Checkout route, Customer details to Payment","a labelled relationship has a unique accessible deletion name");
assert.equal(flowRelationshipDeletionAccessibleName(undefined,"Payment","Customer details"),"Delete relationship Payment to Customer details","an unlabelled relationship is named by both Page endpoints");

const deleted=removeFlowRelationship(state,flow.id,labelled.id),after=documentaryFlowGraph(deleted.project,flow.id);
assert.deepEqual(after.relationships,[unlabelled],"deletion removes only the exact relationship record");
assert.equal(JSON.stringify(after.relationships[0]),unrelatedBytes,"deletion leaves unrelated relationship bytes unchanged");
assert.equal(JSON.stringify(after.pageFrames),endpointBytes,"deletion leaves both endpoint records byte-identical");
assert.match(deleted.history.undo.at(-1).label,/Delete Flow relationship/);
const undone=undoProjectTransaction(deleted),restored=documentaryFlowGraph(undone.project,flow.id);
assert.deepEqual(restored.relationships.find(({id})=>id===labelled.id),labelled,"one Undo restores all relationship metadata");
assert.equal(restored.relationships.filter(({id})=>id===labelled.id).length,1,"Undo restores the relationship exactly once");
assert.equal(removeFlowRelationship(state,flow.id,"missing-relationship"),state,"an unknown relationship is an atomic no-op");

const viewport={x:42,y:18,zoom:1.25},selected={selectedItem:{kind:"relationship",id:labelled.id},viewport};
assert.deepEqual(flowViewAfterRelationshipDeletion(selected,labelled.id),{viewport},"deletion clears the stale relationship selection and preserves the viewport");
assert.deepEqual(flowViewAfterRelationshipDeletion({selectedItem:{kind:"occurrence",id:verification.id},viewport},labelled.id),{selectedItem:{kind:"occurrence",id:verification.id},viewport},"deletion preserves unrelated selection");
const intent={id:labelled.id,sourceKind:"page-frame",sourceId:customerFrame.id,sourceFocused:false},first=consumeRelationshipDeletionFocus(intent,false),settled=consumeRelationshipDeletionFocus(first.next,false),restoredFocus=consumeRelationshipDeletionFocus(settled.next,true);
assert.deepEqual(first,{target:"source",next:{...intent,sourceFocused:true}},"deletion requests source focus once");
assert.deepEqual(settled,{next:first.next},"an unrelated re-render does not steal focus back to the source");
assert.deepEqual(restoredFocus,{target:"relationship"},"Undo consumes the intent by requesting restored-edge focus once");

console.log("flow relationship deletion unit passed");
