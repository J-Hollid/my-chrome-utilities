import assert from "node:assert/strict";
import {
  addProjectEntity,
  createProjectSchemaDraft,
  createSpecificationProject,
  saveProjectAssignment,
} from "../dist/data-layer-specification-project.js";
import {
  FLOW_INSTANCES_STORAGE_KEY,
  SPECIFICATION_PROJECT_STORAGE_KEY,
  recordSpecificationCapture,
} from "../dist/data-layer-specification-runtime.js";

let sequence=0;const id=(kind)=>`${kind}-${++sequence}`;
const values=new Map();const storage={getItem:(key)=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
let state=createSpecificationProject({name:"Production callback routing",site:"shop.example",id});
const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);};
const retailEntry=add("events",{name:"Retail entry",eventName:"retail_entry",sourceId:"event-history"});
const tradeEntry=add("events",{name:"Trade entry",eventName:"trade_entry",sourceId:"event-history"});
const purchase=add("events",{name:"Purchase",eventName:"purchase",sourceId:"event-history"});
const confirmation=add("pages",{name:"Confirmation",pathname:"/checkout/confirmation"});
const retailFlow=add("flows",{name:"Retail checkout",steps:[{id:"retail-entry",name:"Retail entry",eventId:retailEntry.id,minimum:1,maximum:1},{id:"retail-final",name:"Confirmation",eventId:purchase.id,pageId:confirmation.id,minimum:1,maximum:1}]});
const tradeFlow=add("flows",{name:"Trade checkout",steps:[{id:"trade-entry",name:"Trade entry",eventId:tradeEntry.id,minimum:1,maximum:1},{id:"trade-final",name:"Confirmation",eventId:purchase.id,pageId:confirmation.id,minimum:1,maximum:1}]});
state=createProjectSchemaDraft(state,{schemaId:"schema-retail",name:"Retail requirements",baseRevision:3,description:"Retail"},id);
state=createProjectSchemaDraft(state,{schemaId:"schema-trade",name:"Trade requirements",baseRevision:4,description:"Trade"},id);
state=saveProjectAssignment(state,{name:"Retail route",schemaId:"schema-retail",eventName:"purchase",sourceId:"event-history",target:"payload",priority:10,versionPolicy:"pinned",schemaRevision:3,condition:{kind:"all",conditions:[{kind:"predicate",field:"flowId",operator:"equals",value:"retail checkout"}]}},id);
state=saveProjectAssignment(state,{name:"Trade route",schemaId:"schema-trade",eventName:"purchase",sourceId:"event-history",target:"payload",priority:10,versionPolicy:"pinned",schemaRevision:4,condition:{kind:"all",conditions:[{kind:"predicate",field:"flowId",operator:"equals",value:"trade checkout"}]}},id);
storage.setItem(SPECIFICATION_PROJECT_STORAGE_KEY,JSON.stringify(state));

recordSpecificationCapture(storage,{sessionId:"tab:retail",pageUrl:"https://shop.example/products/1",sourceId:"event-history",rawValue:{event:"retail_entry"}});
recordSpecificationCapture(storage,{sessionId:"tab:trade",pageUrl:"https://shop.example/account",sourceId:"event-history",rawValue:{event:"trade_entry"}});
const retail=recordSpecificationCapture(storage,{sessionId:"tab:retail",pageUrl:"https://shop.example/checkout/confirmation",sourceId:"event-history",rawValue:{event:"purchase"}});
const trade=recordSpecificationCapture(storage,{sessionId:"tab:trade",pageUrl:"https://shop.example/checkout/confirmation",sourceId:"event-history",rawValue:{event:"purchase"}});
const persisted=JSON.parse(storage.getItem(FLOW_INSTANCES_STORAGE_KEY));
assert.deepEqual(persisted.map(({flowId,sessionId,status})=>({flowId,sessionId,status})),[
  {flowId:retailFlow.id,sessionId:"tab:retail",status:"complete"},
  {flowId:tradeFlow.id,sessionId:"tab:trade",status:"complete"},
]);
assert.equal(retail.applicability.winner.id,state.project.collections.schemaDrafts[0].workingDraft.assignments[0].id);
assert.equal(trade.applicability.winner.id,state.project.collections.schemaDrafts[1].workingDraft.assignments[0].id);
assert.notEqual(retail.applicability.winner.id,trade.applicability.winner.id);
assert.equal(retail.applicability.ties.length,1);assert.equal(trade.applicability.ties.length,1);
console.log("production Specification Project callback runtime tests passed");
