import assert from "node:assert/strict";
import {addGraphOccurrence,documentaryFlowGraph,projectFlowGraph,saveGraphRelationship,updateGraphOccurrence} from "../dist/data-layer-flow-graph.js";
import {addProjectEntity,createSpecificationProject,transactProject} from "../dist/data-layer-specification-project.js";
import {commitCanonicalProjectState,restoreCanonicalProjectState} from "../dist/data-layer-specification-repository.js";

let sequence=0;
const id=(kind)=>`${kind}:persistence-${++sequence}`;
let state=createSpecificationProject({name:"Shop",site:"shop.example",id});
const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);};
const checkout=add("pages",{name:"Checkout"}),confirmation=add("pages",{name:"Confirmation"}),route=add("events",{name:"route_view",eventName:"route_view",role:"context-setting"}),shipping=add("events",{name:"add_shipping_info",role:"interaction"}),payment=add("events",{name:"add_payment_info",role:"interaction"}),flow=add("flows",{name:"Checkout journey",steps:[]});
const occurrence=(name,page,event,lane,x)=>{state=addGraphOccurrence(state,flow.id,{name,pageId:page.id,eventId:event.id,fallbackRole:event.role??"interaction",obligation:"Required",minimum:1,maximum:1,layout:{lane,x,y:lane==="Context"?70:190}},id);return documentaryFlowGraph(state.project,flow.id).occurrences.at(-1);};
const context=occurrence("Checkout context",checkout,route,"Context",30),shippingNode=occurrence("Shipping",checkout,shipping,"Shipping",230),paymentNode=occurrence("Payment",checkout,payment,"Payment",430);
for(const target of[shippingNode,paymentNode])state=saveGraphRelationship(state,flow.id,context.id,{toStepId:target.id,kind:"parallel",group:"checkout"},id);
state=updateGraphOccurrence(state,flow.id,shippingNode.id,{name:"Delivery options",pageId:confirmation.id,eventId:shipping.id,fallbackRole:"interaction",obligation:"Required",minimum:1,maximum:1,layout:{lane:"Shipping",x:230,y:190}});

const values=new Map(),storage={getItem:(key)=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
assert.equal(commitCanonicalProjectState(storage,state).status,"committed");
const reloaded=restoreCanonicalProjectState(values.values().next().value),before=structuredClone(documentaryFlowGraph(reloaded.project,flow.id));
const renamed=transactProject(reloaded,"Rename shared definitions",(project)=>({...project,collections:{...project.collections,pages:project.collections.pages.map((page)=>page.id===confirmation.id?{...page,name:"Order confirmation"}:page),events:project.collections.events.map((event)=>event.id===route.id?{...event,name:"route_context"}:event)}}));
const projection=projectFlowGraph(renamed.project,flow.id),stored=documentaryFlowGraph(renamed.project,flow.id);
assert.deepEqual(stored,before,"renaming shared definitions must leave persisted graph IDs and bindings unchanged");
assert.equal(stored.occurrences.find(({id})=>id===paymentNode.id).pageId,checkout.id,"Payment branch must remain isolated");
assert.equal(projection.catalog.events.find(({id})=>id===route.id).name,"route_context");
assert.equal(projection.catalog.pages.find(({id})=>id===confirmation.id).name,"Order confirmation");
assert.deepEqual(projection.graph.relationships.map(({kind})=>kind),["parallel","parallel"]);
assert.deepEqual(renamed.project.collections.flows[0].steps,[],"documentary persistence must leave executable Flow steps empty");

console.log("Flow graph persistence tests passed");
