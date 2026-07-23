import assert from "node:assert/strict";
import {
  attachLiveFlowDefect,
  completeLiveFlowTest,
  createLiveFlowTest,
  liveFlowCandidateEvents,
  liveFlowNextSteps,
  matchLiveFlowEvent,
  restoreLiveFlowSummary,
  selectLiveFlow,
  selectLiveFlowStep,
  serializeLiveFlowSummary,
  startLiveFlowPath,
} from "../dist/data-layer-live-flow-testing.js";
import {canonicalSchemaWithConstraint,createCanonicalSchema} from "../dist/data-layer-canonical-schema.js";

const canonical=(id,name,path)=>canonicalSchemaWithConstraint(
  createCanonicalSchema({id:`canonical:${id}`,contributorId:id,contributorName:name}),
  {path,presence:"required",type:"string"},
  (kind)=>`${kind}:${id}:${path}`,
);
const state={project:{
  id:"project:property",name:"Property project",collections:{
    profiles:[],pageGroups:[],applicabilitySets:[],assignments:[],fixtures:[],
    pages:[
      {id:"page:start",name:"Start",pathname:"/start",canonicalSchema:canonical("page:start","Start","/journey")},
      {id:"page:success",name:"Success",pathname:"/success",canonicalSchema:canonical("page:success","Success","/result")},
      {id:"page:failure",name:"Failure",pathname:"/failure",canonicalSchema:canonical("page:failure","Failure","/result")},
    ],
    events:[{id:"event:submit",name:"submit",eventName:"submit",canonicalSchema:canonical("event:submit","submit","/action")}],
    flows:[{id:"flow:branch",name:"Branch journey"}],
  },
  documentationFlowGraphs:{"flow:branch":{
    pageGroupIds:[],
    pageFrames:[
      {id:"frame:start",name:"Start frame",pageId:"page:start",freePageRegion:"before-lanes"},
      {id:"frame:success",name:"Success frame",pageId:"page:success",freePageRegion:"after-lanes"},
      {id:"frame:failure",name:"Failure frame",pageId:"page:failure",freePageRegion:"after-lanes"},
    ],
    occurrences:[{id:"occurrence:submit",name:"Submit occurrence",pageFrameId:"frame:start",pageId:"page:start",eventId:"event:submit"}],
    relationships:[
      {id:"relationship:start-submit",sourceEndpoint:{kind:"page-frame",id:"frame:start"},targetEndpoint:{kind:"event-occurrence",id:"occurrence:submit"},sourcePort:"right",targetPort:"left",kind:"expected_next"},
      {id:"relationship:submit-success",sourceEndpoint:{kind:"event-occurrence",id:"occurrence:submit"},targetEndpoint:{kind:"page-frame",id:"frame:success"},sourcePort:"right",targetPort:"left",kind:"alternative"},
      {id:"relationship:submit-failure",sourceEndpoint:{kind:"event-occurrence",id:"occurrence:submit"},targetEndpoint:{kind:"page-frame",id:"frame:failure"},sourcePort:"right",targetPort:"left",kind:"alternative"},
    ],
  }},releases:[],publicationPolicy:{warningsBlock:false,fixturesRequired:false},namingConventions:{},
},draft:{status:"Draft"},history:{undo:[],redo:[]}};

const rotate=(values,count)=>values.map((_,index)=>values[(index+count)%values.length]);
for(let sample=0;sample<24;sample+=1){
  const chooseSuccess=sample%2===0,target=chooseSuccess?"success":"failure",other=chooseSuccess?"failure":"success";
  const chronological=[
    {id:`event:${sample}:start`,name:"page_view",sourceId:"history",captureTime:`2026-07-23T10:00:00.${String(sample).padStart(3,"0")}Z`,pageUrl:"https://example.test/start",payload:{journey:`j-${sample}`}},
    {id:`event:${sample}:submit`,name:"submit",sourceId:"history",captureTime:`2026-07-23T10:00:01.${String(sample).padStart(3,"0")}Z`,pageUrl:"https://example.test/start",payload:{journey:`j-${sample}`,action:"submit"}},
    {id:`event:${sample}:${target}`,name:"page_view",sourceId:"history",captureTime:`2026-07-23T10:00:02.${String(sample).padStart(3,"0")}Z`,pageUrl:`https://example.test/${target}`,payload:{}},
    {id:`event:${sample}:late-${other}`,name:"page_view",sourceId:"history",captureTime:`2026-07-23T10:00:03.${String(sample).padStart(3,"0")}Z`,pageUrl:`https://example.test/${other}`,payload:{result:other}},
  ];
  const events=sample%3===0?[...chronological].reverse():rotate(chronological,sample%chronological.length);
  let run=selectLiveFlow(createLiveFlowTest(`run:${sample}`,state.project.id),state,"flow:branch");
  run=startLiveFlowPath(run,"frame:start");
  run=matchLiveFlowEvent(run,state,events,chronological[0].id);
  assert.deepEqual(liveFlowNextSteps(run,state).map(({id,relationshipId})=>({id,relationshipId})),[
    {id:"occurrence:submit",relationshipId:"relationship:start-submit"},
  ]);
  run=selectLiveFlowStep(run,state,"occurrence:submit");
  const submitCandidates=liveFlowCandidateEvents(run,state,events);
  assert.equal(submitCandidates.find(({eventId})=>eventId===chronological[0].id).eligible,false);
  assert.equal(submitCandidates.find(({eventId})=>eventId===chronological[1].id).eligible,true);
  run=matchLiveFlowEvent(run,state,events,chronological[1].id);
  assert.deepEqual(new Set(liveFlowNextSteps(run,state).map(({relationshipId})=>relationshipId)),new Set(["relationship:submit-success","relationship:submit-failure"]));
  run=selectLiveFlowStep(run,state,`frame:${target}`);
  const finalCandidates=liveFlowCandidateEvents(run,state,events);
  assert.equal(finalCandidates.find(({eventId})=>eventId===chronological[0].id).reason,"Already matched in this run");
  assert.equal(finalCandidates.find(({eventId})=>eventId===chronological[1].id).reason,"Already matched in this run");
  assert.equal(finalCandidates.find(({eventId})=>eventId===chronological[2].id).eligible,true);
  run=matchLiveFlowEvent(run,state,events,chronological[2].id);
  run=attachLiveFlowDefect(run,`frame:${target}`,`defect:${sample}`,chronological[2].id);

  assert.deepEqual(run.history.map(({stepId})=>stepId),["frame:start","occurrence:submit",`frame:${target}`]);
  assert.deepEqual(run.history.map(({relationshipId})=>relationshipId),[undefined,"relationship:start-submit",`relationship:submit-${target}`]);
  assert.deepEqual(run.history.map(({eventId})=>eventId),chronological.slice(0,3).map(({id})=>id));
  assert.equal(run.history.every((entry,index,history)=>index===0||Date.parse(entry.captureTime)>Date.parse(history[index-1].captureTime)),true);
  assert.equal(run.history[0].effectiveSchemaRevision>0,true);
  assert.equal(run.history[0].provenance.length>0,true);
  assert.equal(run.history.at(-1).status,"Invalid");
  assert.equal(run.history.at(-1).issues.some(({path})=>path==="/result"),true);

  const completed=completeLiveFlowTest(run,state,`2026-07-23T10:00:04.${String(sample).padStart(3,"0")}Z`);
  assert.deepEqual(completed.unchosenAlternatives,[{relationshipId:`relationship:submit-${other}`,stepId:`frame:${other}`,status:"Not tested"}]);
  assert.equal(completed.resumeMatching,false);
  const restored=restoreLiveFlowSummary(serializeLiveFlowSummary(completed));
  assert.deepEqual(restored,JSON.parse(JSON.stringify(completed)),"serialization conserves persisted traversal chronology and validation evidence");
  restored.history[0].target.name="mutated restored summary";
  assert.notEqual(completed.history[0].target.name,restored.history[0].target.name,"restored summaries are isolated from completed runs");
}

assert.equal(restoreLiveFlowSummary("not json"),undefined);
assert.equal(restoreLiveFlowSummary(JSON.stringify({label:"Incomplete",history:[]})),undefined);
console.log("data-layer Live Flow testing property tests passed");
