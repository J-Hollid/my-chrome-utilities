import assert from "node:assert/strict";
import {
  attachLiveFlowDefect,
  completeLiveFlowTest,
  createLiveFlowTest,
  liveFlowCandidateEvents,
  liveFlowChoices,
  liveFlowGraphNodes,
  liveFlowNextSteps,
  matchLiveFlowEvent,
  selectLiveFlow,
  selectLiveFlowStep,
  serializeLiveFlowSummary,
  startLiveFlowPath,
} from "../dist/data-layer-live-flow-testing.js";
import {canonicalSchemaWithConstraint,createCanonicalSchema} from "../dist/data-layer-canonical-schema.js";

const constraint=(path,values)=>({path,...values});
let canonicalId=0;
const canonical=(entityId,entityName,constraints)=>constraints.reduce(
  (document,item)=>canonicalSchemaWithConstraint(document,item,(kind)=>`${kind}:${++canonicalId}`),
  createCanonicalSchema({id:`canonical:${entityId}`,contributorId:entityId,contributorName:entityName}),
);
const project={
  id:"project-retail",name:"Retail website",collections:{
    profiles:[{id:"profile:sitewide",name:"Sitewide",canonicalSchema:canonical("profile:sitewide","Sitewide",[constraint("/site",{presence:"required",type:"string"})])}],
    pageGroups:[{id:"group:checkout",name:"Checkout",canonicalSchema:canonical("group:checkout","Checkout",[constraint("/currency",{presence:"required",allowedValues:["EUR"]})])}],
    pages:[
      {id:"page:cart",name:"Cart",pageGroupIds:["group:checkout"],profileId:"profile:sitewide",pathname:"/cart",canonicalSchema:canonical("page:cart","Cart",[constraint("/cart_id",{presence:"required",type:"string"})])},
      {id:"page:confirmation",name:"Confirmation",pageGroupIds:["group:checkout"],profileId:"profile:sitewide",pathname:"/confirmation"},
    ],
    events:[{id:"event:view",name:"page_view",sourceId:"history",canonicalSchema:canonical("event:view","page_view",[constraint("/event_name",{expectedValue:"page_view"})])}],
    applicabilitySets:[],assignments:[],fixtures:[],
    flows:[{id:"flow:checkout",name:"Checkout journey"}],
  },
  documentationFlowGraphs:{
    "flow:checkout":{
      pageGroupIds:["group:checkout"],
      pageFrames:[
        {id:"frame:cart",name:"Cart frame",pageId:"page:cart",pageGroupId:"group:checkout",localSchemaContributions:[constraint("/instance",{presence:"required",type:"string"})]},
        {id:"frame:confirmation-a",name:"Confirmation A",pageId:"page:confirmation",pageGroupId:"group:checkout"},
        {id:"frame:confirmation-b",name:"Confirmation B",pageId:"page:confirmation",pageGroupId:"group:checkout"},
      ],
      occurrences:[{id:"occurrence:view",name:"Cart page_view",pageFrameId:"frame:cart",pageId:"page:cart",eventId:"event:view",localSchemaContributions:[constraint("/occurrence",{presence:"required",type:"boolean"})]}],
      relationships:[
        {id:"relationship:cart-view",sourceEndpoint:{kind:"page-frame",id:"frame:cart"},targetEndpoint:{kind:"event-occurrence",id:"occurrence:view"},sourcePort:"right",targetPort:"left",kind:"expected_next"},
        {id:"relationship:view-confirm",sourceEndpoint:{kind:"event-occurrence",id:"occurrence:view"},targetEndpoint:{kind:"page-frame",id:"frame:confirmation-a"},sourcePort:"top",targetPort:"bottom",kind:"alternative",label:"Success route"},
        {id:"relationship:confirm-repeat",sourceEndpoint:{kind:"page-frame",id:"frame:confirmation-a"},targetEndpoint:{kind:"page-frame",id:"frame:confirmation-b"},sourcePort:"right",targetPort:"left",kind:"expected_next"},
      ],
    },
  },releases:[],publicationPolicy:{warningsBlock:false,fixturesRequired:false},namingConventions:{},
};
const state={project,draft:{status:"Draft"},history:{undo:[],redo:[]}};
const inactive={...state,project:{...project,id:"project-trade",name:"Trade portal",collections:{...project.collections,flows:[{id:"flow:trade",name:"Trade journey"}]}}};
const events=[
  {id:"live-100",name:"page_view",sourceId:"history",sourceName:"Data layer",captureTime:"2026-07-23T10:00:00.000Z",pageUrl:"https://shop.example/cart",payload:{}},
  {id:"live-101",name:"page_view",sourceId:"history",sourceName:"Data layer",captureTime:"2026-07-23T10:00:01.000Z",pageUrl:"https://shop.example/cart",payload:{site:"shop",currency:"EUR",cart_id:"c1",instance:"retail"}},
  {id:"live-102",name:"page_view",sourceId:"history",sourceName:"Data layer",captureTime:"2026-07-23T10:00:02.000Z",pageUrl:"https://shop.example/cart",payload:{site:"shop",currency:"EUR",cart_id:"c1",instance:"retail",event_name:"page_view",occurrence:true}},
  {id:"live-102-wrong-source",name:"page_view",sourceId:"gtm",sourceName:"GTM",captureTime:"2026-07-23T10:00:02.500Z",pageUrl:"https://shop.example/cart",payload:{event_name:"page_view"}},
  {id:"live-103",name:"purchase",sourceId:"history",sourceName:"Data layer",captureTime:"2026-07-23T10:00:03.000Z",pageUrl:"https://shop.example/confirmation",payload:{}},
];

assert.deepEqual(liveFlowChoices(undefined,[state,inactive]),{flows:[],recovery:["Open project","Create project"]});
assert.deepEqual(liveFlowChoices("project-retail",[state,inactive]).flows.map(({id,name})=>({id,name})),[{id:"flow:checkout",name:"Checkout journey"}]);

let run=createLiveFlowTest("run:checkout","project-retail");
run=selectLiveFlow(run,state,"flow:checkout");
assert.deepEqual(run.startChoices.map(({id,name,recommended})=>({id,name,recommended})),[
  {id:"frame:cart",name:"Cart",recommended:true},
  {id:"frame:confirmation-a",name:"Confirmation",recommended:false},
  {id:"frame:confirmation-b",name:"Confirmation",recommended:false},
]);
assert.equal(new Set(run.startChoices.map(({id})=>id)).size,3,"repeated Pages retain distinct frame values");
assert.equal(run.startChoices.some(({id})=>id==="occurrence:view"),false,"an Event occurrence cannot start a run");

run=startLiveFlowPath(run,"frame:cart");
let candidates=liveFlowCandidateEvents(run,state,events);
assert.equal(candidates.some(({eventId,eligible})=>eventId==="live-101"&&eligible),true);
assert.equal(candidates.every(({selected})=>selected===false),true,"candidate derivation never selects automatically");
run=matchLiveFlowEvent(run,state,events,"live-101");
assert.equal(run.history[0].selectionMode,"Manual Flow test");
assert.deepEqual(
  {projectId:run.history[0].projectId,flowId:run.history[0].flowId,flowName:run.history[0].flowName},
  {projectId:"project-retail",flowId:"flow:checkout",flowName:"Checkout journey"},
  "each persisted manual result retains its own active-project and Flow identity",
);
assert.deepEqual(run.history[0].matchedPath.map(({stepId,eventId})=>({stepId,eventId})),[
  {stepId:"frame:cart",eventId:"live-101"},
]);
assert.deepEqual(run.history[0].provenance.map(({scope})=>scope),["Shared Profile","Page Group","Page","Flow Page-instance"]);
assert.equal("contributors" in run.history[0],false,"run evidence stores provenance rather than copied schema contributors");
assert.equal(run.history[0].issues.length,0);
assert.ok(run.history[0].effectiveSchemaRevision>0,"the effective revision comes from canonical contributors");
assert.match(run.history[0].effectiveSchemaRevisionIdentity,/^flow-schema:[0-9a-f]{8}$/,"the effective revision has a stable facet-aware identity");
assert.equal("assignment" in run.history[0],false);

const next=liveFlowNextSteps(run,state);
assert.deepEqual(next.map(({id,kind,displayName})=>({id,kind,displayName})),[{id:"occurrence:view",kind:"expected_next",displayName:"Cart to Cart page_view"}]);
assert.deepEqual(liveFlowGraphNodes(run,state).map(({id,enabled,reason})=>({id,enabled,reason})),[
  {id:"frame:cart",enabled:false,reason:"Current graph step"},
  {id:"frame:confirmation-a",enabled:false,reason:"No relationship from current step"},
  {id:"frame:confirmation-b",enabled:false,reason:"No relationship from current step"},
  {id:"occurrence:view",enabled:true,reason:"Connected by expected_next"},
],"every graph node remains rendered with an actionable or blocked explanation");
const alteredFacet=structuredClone(state);
alteredFacet.project.documentationFlowGraphs["flow:checkout"].pageFrames[0].localSchemaContributions[0].type="number";
let alteredRun=selectLiveFlow(createLiveFlowTest("run:altered","project-retail"),alteredFacet,"flow:checkout");
alteredRun=startLiveFlowPath(alteredRun,"frame:cart");
alteredRun=matchLiveFlowEvent(alteredRun,alteredFacet,events,"live-101");
assert.notEqual(alteredRun.history[0].effectiveSchemaRevisionIdentity,run.history[0].effectiveSchemaRevisionIdentity,
  "changing an effective schema facet changes identity even when numeric contributor revisions are unchanged");
assert.notEqual(alteredRun.history[0].effectiveSchemaRevision,run.history[0].effectiveSchemaRevision,
  "the displayed effective revision is derived from the same effective facets");
run=selectLiveFlowStep(run,state,"occurrence:view");
candidates=liveFlowCandidateEvents(run,state,events);
assert.equal(candidates.find(({eventId})=>eventId==="live-100").reason,"Captured before the previous match");
assert.equal(candidates.find(({eventId})=>eventId==="live-101").reason,"Already matched in this run");
assert.equal(candidates.find(({eventId})=>eventId==="live-103").reason,"Event identity does not match page_view");
assert.equal(candidates.find(({eventId})=>eventId==="live-102-wrong-source").reason,"Observation source does not match history");
run=matchLiveFlowEvent(run,state,events,"live-102");
assert.deepEqual(run.history[1].matchedPath.map(({stepId,relationshipId,eventId})=>({stepId,relationshipId,eventId})),[
  {stepId:"frame:cart",relationshipId:undefined,eventId:"live-101"},
  {stepId:"occurrence:view",relationshipId:"relationship:cart-view",eventId:"live-102"},
],"each result carries the exact path prefix needed by later defect reporting");
assert.deepEqual(run.history[1].provenance.map(({scope})=>scope),["Shared Profile","Event","Page Group","Page","Flow Page-instance","Event-occurrence"]);
assert.equal(run.history[1].target.id,"occurrence:view");
assert.ok(run.history[1].effectiveSchemaRevision>0);
assert.equal(liveFlowNextSteps(run,state)[0].displayName,"Success route");
assert.throws(()=>selectLiveFlowStep(run,state,"frame:confirmation-b"),/No relationship from current step/);

run=selectLiveFlowStep(run,state,"frame:confirmation-a");
run=matchLiveFlowEvent(run,state,events,"live-103");
assert.deepEqual(run.history.at(-1).issues.map(({path})=>path).sort(),["/currency","/site"],"invalid observations retain concrete canonical property paths");
run=attachLiveFlowDefect(run,"frame:confirmation-a","defect:flow-103");
assert.equal(run.history.at(-1).defectId,"defect:flow-103","saved defects link back to the matching history entry");

const projectBytes=JSON.stringify(state.project),assignmentBytes=JSON.stringify(state.project.collections.assignments);
const completed=completeLiveFlowTest(run,state,"2026-07-23T10:00:04.000Z");
assert.equal(completed.label,"Completed selected path");
assert.equal(completed.unchosenAlternatives[0].status,"Not tested");
assert.equal(completed.history.at(-1).defectId,"defect:flow-103","completed summaries preserve the defect reference");
assert.equal(JSON.stringify(state.project),projectBytes);
assert.equal(JSON.stringify(state.project.collections.assignments),assignmentBytes);
assert.deepEqual(JSON.parse(serializeLiveFlowSummary(completed)),JSON.parse(JSON.stringify(completed)));

const cyclicState=structuredClone(state);
cyclicState.project.documentationFlowGraphs["flow:checkout"].relationships.push(
  {id:"relationship:confirm-retry",sourceEndpoint:{kind:"page-frame",id:"frame:confirmation-a"},targetEndpoint:{kind:"event-occurrence",id:"occurrence:view"},sourcePort:"top",targetPort:"bottom",kind:"alternative",label:"Retry event"},
);
const cyclicEvents=[...events,{
  id:"live-104",name:"page_view",sourceId:"history",sourceName:"Data layer",captureTime:"2026-07-23T10:00:04.000Z",pageUrl:"https://shop.example/cart",
  payload:{site:"shop",currency:"EUR",cart_id:"c1",instance:"retail",event_name:"page_view",occurrence:true},
}];
let cyclicRun=selectLiveFlow(createLiveFlowTest("run:cycle","project-retail"),cyclicState,"flow:checkout");
cyclicRun=startLiveFlowPath(cyclicRun,"frame:cart");
cyclicRun=matchLiveFlowEvent(cyclicRun,cyclicState,cyclicEvents,"live-101");
assert.deepEqual(liveFlowCandidateEvents(cyclicRun,cyclicState,cyclicEvents),[],"a matched step cannot consume another event until a relationship target is selected");
assert.throws(()=>matchLiveFlowEvent(cyclicRun,cyclicState,cyclicEvents,"live-102"),/Select a Flow graph step/);
cyclicRun=selectLiveFlowStep(cyclicRun,cyclicState,"occurrence:view");
cyclicRun=matchLiveFlowEvent(cyclicRun,cyclicState,cyclicEvents,"live-102");
cyclicRun=selectLiveFlowStep(cyclicRun,cyclicState,"frame:confirmation-a");
cyclicRun=matchLiveFlowEvent(cyclicRun,cyclicState,cyclicEvents,"live-103");
cyclicRun=selectLiveFlowStep(cyclicRun,cyclicState,"occurrence:view");
assert.equal(liveFlowCandidateEvents(cyclicRun,cyclicState,cyclicEvents).find(({eventId})=>eventId==="live-104").eligible,true,"a revisited graph node awaits a later unmatched observation");
cyclicRun=matchLiveFlowEvent(cyclicRun,cyclicState,cyclicEvents,"live-104");
assert.deepEqual(cyclicRun.history.map(({stepId})=>stepId),["frame:cart","occurrence:view","frame:confirmation-a","occurrence:view"]);
assert.deepEqual(cyclicRun.history.at(-1).matchedPath.map(({stepId})=>stepId),["frame:cart","occurrence:view","frame:confirmation-a","occurrence:view"]);
assert.throws(()=>liveFlowCandidateEvents(cyclicRun,inactive,cyclicEvents),/project context changed/);

console.log("data-layer Live Flow testing tests passed");
