import assert from "node:assert/strict";
import {
  addEventOccurrenceToPage,
  addFlowPageFrame,
  deriveFlowPageFrameExample,
  documentaryFlowGraph,
  inspectOccurrencePageChange,
  projectFlowGraph,
  reassignFlowOccurrencePage,
  saveGraphRelationship,
  setFlowPageGroupLanes,
} from "../dist/data-layer-flow-graph.js";
import {
  createProjectCollectionEntity,
  projectCollectionCreationFields,
} from "../dist/data-layer-project-entity-lifecycle.js";
import {
  addProjectEntity,
  createSpecificationProject,
} from "../dist/data-layer-specification-project.js";

let sequence=0;
const id=(kind)=>`${kind}:page-event-${++sequence}`;
let state=createSpecificationProject({name:"Page event shop",site:"shop.example",id});
state=createProjectCollectionEntity(state,"pages","Cart",id,{eventName:"pageview"});
state=createProjectCollectionEntity(state,"pages","Payment",id,{eventName:"pageview"});
state=createProjectCollectionEntity(state,"events","Button click",id,{eventName:"button_click"});
const [cart,payment]=state.project.collections.pages;
const [buttonClick]=state.project.collections.events;
assert.equal(cart.eventName,"pageview");
assert.equal(buttonClick.eventName,"button_click");
assert.equal("role" in cart,false);
assert.equal("role" in buttonClick,false);
assert.deepEqual(
  projectCollectionCreationFields.pages.map(({label})=>label),
  ["Observed event name","Path matcher","Page Groups"],
);

const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);};
const checkout=add("pageGroups",{name:"Checkout"});
const flow=add("flows",{name:"Checkout journey",steps:[]});
state={...state,project:{...state.project,collections:{...state.project.collections,
  pages:state.project.collections.pages.map((page)=>({...page,pageGroupIds:[checkout.id],localSchemaContributions:[{path:page.id===cart.id?"/cart_only":"/payment_only",type:"string",presence:"required"}]})),
  events:state.project.collections.events.map((event)=>({...event,schemaConstraints:[{path:"/interaction",type:"string"}]})),
}}};
state=setFlowPageGroupLanes(state,flow.id,[checkout.id]);
state=addFlowPageFrame(state,flow.id,{pageId:cart.id,pageGroupId:checkout.id,x:40,y:40},id);
state=addFlowPageFrame(state,flow.id,{pageId:payment.id,pageGroupId:checkout.id,x:320,y:40},id);
const [cartFrame,paymentFrame]=documentaryFlowGraph(state.project,flow.id).pageFrames;
assert.equal(documentaryFlowGraph(state.project,flow.id).occurrences.length,0,"a Page context event is not a nested occurrence");

state=addEventOccurrenceToPage(state,flow.id,{
  name:"Button click",pageFrameId:cartFrame.id,pageGroupId:checkout.id,pageId:cart.id,eventId:buttonClick.id,
  trigger:"Continue clicked",obligation:"Required",minimum:1,maximum:1,x:24,y:70,
},id);
const occurrence=documentaryFlowGraph(state.project,flow.id).occurrences[0];
assert.equal("role" in occurrence,false);
assert.equal(occurrence.pageFrameId,cartFrame.id);

const projected=projectFlowGraph(state.project,flow.id).graph;
assert.deepEqual(projected.connectionEndpoints.map(({kind,id})=>({kind,id})),[
  {kind:"page-frame",id:cartFrame.id},
  {kind:"page-frame",id:paymentFrame.id},
]);
assert.throws(
  ()=>saveGraphRelationship(state,flow.id,occurrence.id,{toStepId:paymentFrame.id,sourcePort:"right",targetPort:"left"},id),
  /Page frames/,
);
state=saveGraphRelationship(state,flow.id,cartFrame.id,{toStepId:paymentFrame.id,sourcePort:"right",targetPort:"left"},id);
assert.deepEqual(documentaryFlowGraph(state.project,flow.id).relationships[0].sourceEndpoint,{kind:"page-frame",id:cartFrame.id});
assert.deepEqual(documentaryFlowGraph(state.project,flow.id).relationships[0].targetEndpoint,{kind:"page-frame",id:paymentFrame.id});

const review=inspectOccurrencePageChange(state.project,flow.id,occurrence.id,paymentFrame.id);
assert.equal(review.rejected,false);
assert.match(review.message,/Cart.*Payment.*effective-schema/i);
assert.deepEqual(review.impact.source,{pageFrameId:cartFrame.id,pageName:"Cart",status:"ready",propertyPaths:["/cart_only","/interaction"]});
assert.deepEqual(review.impact.target,{pageFrameId:paymentFrame.id,pageName:"Payment",status:"ready",propertyPaths:["/interaction","/payment_only"]});
assert.deepEqual(review.impact.addedPaths,["/payment_only"]);
assert.deepEqual(review.impact.removedPaths,["/cart_only"]);
assert.deepEqual(review.impact.changedPaths,[]);
assert.match(review.message,/source ready.*target ready.*added.*payment_only.*removed.*cart_only/i);
const beforeEvent=JSON.stringify(buttonClick),beforePages=JSON.stringify(state.project.collections.pages);
state=reassignFlowOccurrencePage(state,flow.id,occurrence.id,paymentFrame.id);
const moved=documentaryFlowGraph(state.project,flow.id).occurrences[0];
assert.equal(moved.id,occurrence.id);
assert.equal(moved.eventId,buttonClick.id);
assert.equal(moved.trigger,"Continue clicked");
assert.equal(moved.pageFrameId,paymentFrame.id);
assert.equal(moved.pageId,payment.id);
assert.equal(JSON.stringify(buttonClick),beforeEvent);
assert.equal(JSON.stringify(state.project.collections.pages),beforePages);

const pageExample=deriveFlowPageFrameExample(state.project,flow.id,paymentFrame.id);
assert.equal(pageExample.status,"Incomplete");
assert.deepEqual(pageExample.payload,{});
assert.deepEqual(pageExample.issues.map(({path,code})=>({path,code})),[{path:"/payment_only",code:"REQUIRED_EXAMPLE"}]);

console.log("Flow Page context-event model tests passed");
