import assert from "node:assert/strict";
import {
  addProjectEntity,
  createProjectSchemaDraft,
  createSpecificationProject,
  restoreReleaseAsDraft,
  saveProjectAssignment,
  transactProject,
} from "../dist/data-layer-specification-project.js";
import {publishCompiledRelease} from "../dist/data-layer-specification-assurance.js";
import {
  FLOW_INSTANCES_STORAGE_KEY,
  FLOW_ROUTING_STORAGE_KEY,
  SPECIFICATION_PROJECT_STORAGE_KEY,
  recordSpecificationCapture,
  recordSpecificationNavigation,
} from "../dist/data-layer-specification-runtime.js";

let sequence=0;const id=(kind)=>`${kind}-${++sequence}`;
const values=new Map();const storage={getItem:(key)=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
let state=createSpecificationProject({name:"Production callback routing",site:"shop.example",id});
const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);};
const retailEntry=add("events",{name:"Retail entry",eventName:"retail_entry",sourceId:"event-history"});
const tradeEntry=add("events",{name:"Trade entry",eventName:"trade_entry",sourceId:"event-history"});
const purchase=add("events",{name:"Purchase",eventName:"purchase",sourceId:"event-history"});
const confirmation=add("pages",{name:"Confirmation",pathname:"/checkout/confirmation"});
const retailFlow=add("flows",{name:"Retail checkout",steps:[{id:"retail-entry",name:"Retail entry",eventId:retailEntry.id,pageId:"",minimum:1,maximum:1},{id:"retail-final",name:"Confirmation",eventId:purchase.id,pageId:confirmation.id,minimum:1,maximum:1}]});
const tradeFlow=add("flows",{name:"Trade checkout",steps:[{id:"trade-entry",name:"Trade entry",eventId:tradeEntry.id,pageId:"",minimum:1,maximum:1},{id:"trade-final",name:"Confirmation",eventId:purchase.id,pageId:confirmation.id,minimum:1,maximum:1}]});
const retailApplicability=add("applicabilitySets",{name:"Retail checkout applicability",priority:10,condition:{kind:"all",conditions:[{kind:"predicate",field:"flowId",operator:"equals",value:retailFlow.id}]}});
const tradeApplicability=add("applicabilitySets",{name:"Trade checkout applicability",priority:10,condition:{kind:"all",conditions:[{kind:"predicate",field:"flowId",operator:"equals",value:tradeFlow.id}]}});
state=createProjectSchemaDraft(state,{schemaId:"schema-retail",name:"Retail requirements",baseRevision:3,description:"Retail"},id);
state=createProjectSchemaDraft(state,{schemaId:"schema-trade",name:"Trade requirements",baseRevision:4,description:"Trade"},id);
state=saveProjectAssignment(state,{name:"Retail route",schemaId:"schema-retail",eventId:purchase.id,eventName:"purchase",applicabilitySetId:retailApplicability.id,sourceId:"event-history",target:"payload",priority:10,versionPolicy:"pinned",schemaRevision:3},id);
state=saveProjectAssignment(state,{name:"Trade route",schemaId:"schema-trade",eventId:purchase.id,eventName:"purchase",applicabilitySetId:tradeApplicability.id,sourceId:"event-history",target:"payload",priority:10,versionPolicy:"pinned",schemaRevision:4},id);
state={...state,project:{...state.project,publicationPolicy:{...state.project.publicationPolicy,fixturesRequired:false}}};state=publishCompiledRelease(state,{id,write:()=>{}});
storage.setItem(SPECIFICATION_PROJECT_STORAGE_KEY,JSON.stringify(state));

recordSpecificationCapture(storage,{sessionId:"tab:retail",pageUrl:"https://shop.example/products/1",sourceId:"event-history",rawValue:{event:"retail_entry"}});
const beforeUnmatchedNavigation=storage.getItem(FLOW_INSTANCES_STORAGE_KEY);
recordSpecificationNavigation(storage,{sessionId:"tab:retail",pageUrl:"https://shop.example/checkout/confirmation"});
assert.equal(storage.getItem(FLOW_INSTANCES_STORAGE_KEY),beforeUnmatchedNavigation,"navigation without a matching Page entity must not discard an active flow");
recordSpecificationCapture(storage,{sessionId:"tab:trade",pageUrl:"https://shop.example/account",sourceId:"event-history",rawValue:{event:"trade_entry"}});
const retail=recordSpecificationCapture(storage,{sessionId:"tab:retail",pageUrl:"https://shop.example/checkout/confirmation",sourceId:"event-history",rawValue:{event:"purchase"}});
const trade=recordSpecificationCapture(storage,{sessionId:"tab:trade",pageUrl:"https://shop.example/checkout/confirmation",sourceId:"event-history",rawValue:{event:"purchase"}});
const persisted=JSON.parse(storage.getItem(FLOW_INSTANCES_STORAGE_KEY));
const routingEvidence=JSON.parse(storage.getItem(FLOW_ROUTING_STORAGE_KEY));
assert.deepEqual(routingEvidence.slice(-2).map(({sourceId,eventId})=>({sourceId,eventId})),[
  {sourceId:"event-history",eventId:purchase.id},
  {sourceId:"event-history",eventId:purchase.id},
]);
assert.deepEqual(persisted.map(({flowId,sessionId,status})=>({flowId,sessionId,status})),[
  {flowId:retailFlow.id,sessionId:"tab:retail",status:"complete"},
  {flowId:tradeFlow.id,sessionId:"tab:trade",status:"complete"},
]);
assert.equal(retail.evaluation.winner.assignmentId,state.project.collections.assignments[0].id);
assert.equal(trade.evaluation.winner.assignmentId,state.project.collections.assignments[1].id);
assert.notEqual(retail.evaluation.winner.assignmentId,trade.evaluation.winner.assignmentId);
assert.equal(retail.evaluation.ties.length,1);assert.equal(trade.evaluation.ties.length,1);
const correlatedValues=new Map([[SPECIFICATION_PROJECT_STORAGE_KEY,JSON.stringify(state)]]),correlatedStorage={getItem:(key)=>correlatedValues.get(key)??null,setItem:(key,value)=>correlatedValues.set(key,value)};
recordSpecificationCapture(correlatedStorage,{sessionId:"tab:shared",correlationKey:"retail-order",pageUrl:"https://shop.example/products/1",sourceId:"event-history",rawValue:{event:"retail_entry"}});recordSpecificationCapture(correlatedStorage,{sessionId:"tab:shared",correlationKey:"trade-order",pageUrl:"https://shop.example/account",sourceId:"event-history",rawValue:{event:"trade_entry"}});const beforeAmbiguous=correlatedStorage.getItem(FLOW_INSTANCES_STORAGE_KEY),ambiguous=recordSpecificationCapture(correlatedStorage,{sessionId:"tab:shared",pageUrl:"https://shop.example/checkout/confirmation",sourceId:"event-history",rawValue:{event:"purchase"}});assert.equal(ambiguous.ambiguity.instanceIds.length,2);assert.equal(correlatedStorage.getItem(FLOW_INSTANCES_STORAGE_KEY),beforeAmbiguous,"ambiguous observations must not advance either correlated instance");
const released=state,release=released.project.releases.at(-1);let changedDraft=restoreReleaseAsDraft(released,release.id,id);changedDraft=transactProject(changedDraft,"Change unpublished Retail matcher",(project)=>({...project,collections:{...project.collections,applicabilitySets:project.collections.applicabilitySets.map((entry)=>entry.id===retailApplicability.id?{...entry,condition:{kind:"predicate",field:"flowId",operator:"equals",value:"flow:unpublished"}}:entry)}}));
const releaseValues=new Map([[SPECIFICATION_PROJECT_STORAGE_KEY,JSON.stringify(changedDraft)]]),releaseStorage={getItem:(key)=>releaseValues.get(key)??null,setItem:(key,value)=>releaseValues.set(key,value)};
recordSpecificationCapture(releaseStorage,{sessionId:"tab:published",pageUrl:"https://shop.example/products/1",sourceId:"event-history",rawValue:{event:"retail_entry"}});const publishedResult=recordSpecificationCapture(releaseStorage,{sessionId:"tab:published",pageUrl:"https://shop.example/checkout/confirmation",sourceId:"event-history",rawValue:{event:"purchase"}});
assert.equal(publishedResult.evaluation.winner.assignmentId,state.project.collections.assignments[0].id,"Live must ignore an unpublished matcher change");assert.equal(publishedResult.evaluation.releaseIdentity,release.id);assert.equal(publishedResult.evaluation.planContentIdentity,release.executablePlan.contentIdentity);
console.log("production Specification Project callback runtime tests passed");
