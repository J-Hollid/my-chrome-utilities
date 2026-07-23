import assert from "node:assert/strict";
import {
  attachLiveFlowDefect,
  createLiveFlowTest,
  liveFlowChoices,
  liveFlowEventLink,
  liveFlowEventStepChoices,
  liveFlowSessionEvidence,
  linkLiveFlowEvent,
  selectLiveFlow,
  serializeLiveFlowSummary,
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
  {id:"frame:confirmation-a",name:"Confirmation A",recommended:false},
  {id:"frame:confirmation-b",name:"Confirmation B",recommended:false},
]);
assert.equal(new Set(run.startChoices.map(({id})=>id)).size,3,"repeated Pages retain distinct frame values");
assert.equal(run.startChoices.some(({id})=>id==="occurrence:view"),false,"an Event occurrence cannot start a run");
assert.deepEqual(
  liveFlowEventStepChoices(run,state,"live-101").choices.map(({id,root})=>({id,root})),
  [
    {id:"frame:cart",root:true},
    {id:"frame:confirmation-a",root:false},
    {id:"frame:confirmation-b",root:false},
  ],
  "an unlinked event offers root Page frames first while retaining every later Page frame",
);

run=linkLiveFlowEvent(run,state,events[1],"frame:cart");
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
assert.deepEqual(
  liveFlowEventStepChoices(run,state,"live-102").choices.map(({id,kind,displayName})=>({id,kind,displayName})),
  [{id:"occurrence:view",kind:"expected_next",displayName:"Cart to Cart page_view"}],
  "another unlinked event offers only direct outgoing graph targets from the traversal cursor",
);
const alteredFacet=structuredClone(state);
alteredFacet.project.documentationFlowGraphs["flow:checkout"].pageFrames[0].localSchemaContributions[0].type="number";
let alteredRun=selectLiveFlow(createLiveFlowTest("run:altered","project-retail"),alteredFacet,"flow:checkout");
alteredRun=linkLiveFlowEvent(alteredRun,alteredFacet,events[1],"frame:cart");
assert.notEqual(alteredRun.history[0].effectiveSchemaRevisionIdentity,run.history[0].effectiveSchemaRevisionIdentity,
  "changing an effective schema facet changes identity even when numeric contributor revisions are unchanged");
assert.notEqual(alteredRun.history[0].effectiveSchemaRevision,run.history[0].effectiveSchemaRevision,
  "the displayed effective revision is derived from the same effective facets");
run=linkLiveFlowEvent(run,state,events[0],"occurrence:view");
assert.deepEqual(run.history[1].matchedPath.map(({stepId,relationshipId,eventId})=>({stepId,relationshipId,eventId})),[
  {stepId:"frame:cart",relationshipId:undefined,eventId:"live-101"},
  {stepId:"occurrence:view",relationshipId:"relationship:cart-view",eventId:"live-100"},
],"an earlier captured feed event may be linked without a chronological restriction");
assert.deepEqual(run.history[1].provenance.map(({scope})=>scope),["Shared Profile","Event","Page Group","Page","Flow Page-instance","Event-occurrence"]);
assert.equal(run.history[1].target.id,"occurrence:view");
assert.ok(run.history[1].effectiveSchemaRevision>0);
assert.equal(liveFlowEventStepChoices(run,state,"live-103").choices[0].displayName,"Success route");
assert.throws(()=>linkLiveFlowEvent(run,state,events[3],"frame:confirmation-b"),/No relationship from current step/);

run=linkLiveFlowEvent(run,state,events[4],"frame:confirmation-a");
assert.deepEqual(run.history.at(-1).issues.map(({path})=>path).sort(),["/currency","/site"],"invalid observations retain concrete canonical property paths");
run=attachLiveFlowDefect(run,"frame:confirmation-a","defect:flow-103");
assert.equal(run.history.at(-1).defectId,"defect:flow-103","saved defects link back to the matching history entry");
const cursorBeforeReview=run.currentStepId;
assert.equal(liveFlowEventStepChoices(run,state,"live-101").mode,"recorded");
assert.equal(liveFlowEventStepChoices(run,state,"live-101").choices[0].id,"frame:cart");
assert.equal(liveFlowEventLink(run,"live-101").stepId,"frame:cart");
assert.equal(run.currentStepId,cursorBeforeReview,"reviewing a recorded event link does not rewind traversal");

const projectBytes=JSON.stringify(state.project),assignmentBytes=JSON.stringify(state.project.collections.assignments);
const completed=liveFlowSessionEvidence(run,state,"2026-07-23T10:00:04.000Z");
assert.equal(completed.label,"Manual Flow test evidence");
assert.equal(completed.unchosenAlternatives[0].status,"Not tested");
assert.equal(completed.history.at(-1).defectId,"defect:flow-103","saved session evidence preserves the defect reference");
assert.equal(completed.currentStepId,"frame:confirmation-a");
assert.equal(JSON.stringify(state.project),projectBytes);
assert.equal(JSON.stringify(state.project.collections.assignments),assignmentBytes);
assert.deepEqual(JSON.parse(serializeLiveFlowSummary(completed)),JSON.parse(JSON.stringify(completed)));

const cyclicState=structuredClone(state);
cyclicState.project.documentationFlowGraphs["flow:checkout"].relationships=[
  ...cyclicState.project.documentationFlowGraphs["flow:checkout"].relationships,
  {id:"relationship:confirm-retry",sourceEndpoint:{kind:"page-frame",id:"frame:confirmation-a"},targetEndpoint:{kind:"event-occurrence",id:"occurrence:view"},sourcePort:"top",targetPort:"bottom",kind:"alternative",label:"Retry event"},
  {id:"relationship:retry-cart",sourceEndpoint:{kind:"event-occurrence",id:"occurrence:view"},targetEndpoint:{kind:"page-frame",id:"frame:cart"},sourcePort:"right",targetPort:"left",kind:"expected_next"},
];
const cyclicEvents=[...events,{
  id:"live-104",name:"page_view",sourceId:"history",sourceName:"Data layer",captureTime:"2026-07-23T10:00:04.000Z",pageUrl:"https://shop.example/cart",
  payload:{site:"shop",currency:"EUR",cart_id:"c1",instance:"retail",event_name:"page_view",occurrence:true},
}];
let cyclicRun=selectLiveFlow(createLiveFlowTest("run:cycle","project-retail"),cyclicState,"flow:checkout");
cyclicRun=linkLiveFlowEvent(cyclicRun,cyclicState,cyclicEvents[1],"frame:cart");
cyclicRun=linkLiveFlowEvent(cyclicRun,cyclicState,cyclicEvents[2],"occurrence:view");
cyclicRun=linkLiveFlowEvent(cyclicRun,cyclicState,cyclicEvents[4],"frame:confirmation-a");
cyclicRun=linkLiveFlowEvent(cyclicRun,cyclicState,cyclicEvents.at(-1),"occurrence:view");
assert.deepEqual(cyclicRun.history.map(({stepId})=>stepId),["frame:cart","occurrence:view","frame:confirmation-a","occurrence:view"]);
assert.deepEqual(cyclicRun.history.at(-1).matchedPath.map(({stepId})=>stepId),["frame:cart","occurrence:view","frame:confirmation-a","occurrence:view"]);
assert.throws(()=>liveFlowEventStepChoices(cyclicRun,inactive,"unlinked"),/project context changed/);

const loopOnly=structuredClone(state);
loopOnly.project.documentationFlowGraphs["flow:checkout"].relationships.push(
  {id:"relationship:confirmation-cart",sourceEndpoint:{kind:"page-frame",id:"frame:confirmation-b"},targetEndpoint:{kind:"page-frame",id:"frame:cart"},sourcePort:"right",targetPort:"left",kind:"expected_next"},
);
const loopRun=selectLiveFlow(createLiveFlowTest("run:loop","project-retail"),loopOnly,"flow:checkout");
assert.equal(liveFlowEventStepChoices(loopRun,loopOnly,"live-101").noRootPage,true);
assert.deepEqual(
  liveFlowEventStepChoices(loopRun,loopOnly,"live-101").choices.map(({id})=>id),
  ["frame:cart","frame:confirmation-a","frame:confirmation-b"],
  "a loop-only Flow retains every Page frame in deterministic graph order",
);

console.log("data-layer Live Flow testing tests passed");
