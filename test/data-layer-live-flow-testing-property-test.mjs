import assert from "node:assert/strict";
import {
  attachLiveFlowDefect,
  createLiveFlowTest,
  liveFlowEventStepChoices,
  liveFlowSessionEvidence,
  linkLiveFlowEvent,
  restoreLiveFlowSummary,
  selectLiveFlow,
  serializeLiveFlowSummary,
} from "../dist/data-layer-live-flow-testing.js";
import { createManualFlowDefectEvent } from "../dist/data-layer-live-flow-defect-report.js";
import { createDefectReport } from "../dist/data-layer-defect-report.js";
import { defectCapturedEvent } from "../dist/data-layer-defect-report-browser.js";
import { generateReportDetails, renderJiraReport } from "../dist/data-layer-defect-report-export.js";
import {
  createValidationDefect,
  currentDefectIssues,
  serializeDefectLibrary,
} from "../dist/data-layer-defect-library.js";
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
const contributorFacetBytes=JSON.stringify(state.project.collections);
const assertDefectSnapshot=(entry,event,expectedKind,expectedLabel,sample)=>{
  const mutableEntry=structuredClone(entry),mutableEvent=structuredClone(event);
  const manualEvent=createManualFlowDefectEvent(mutableEntry,mutableEvent);
  const report=generateReportDetails(createDefectReport(defectCapturedEvent(manualEvent)));
  const rendered=renderJiraReport(report);
  const reportBytes=JSON.stringify(report);
  const persisted=serializeDefectLibrary({defects:[createValidationDefect({
    id:`defect:snapshot:${expectedKind}:${sample}`,
    now:`2026-07-23T10:00:05.${String(sample).padStart(3,"0")}Z`,
    report,
    issues:currentDefectIssues(manualEvent),
  })]});
  mutableEntry.flowName="mutated Flow";
  mutableEntry.stepName="mutated step";
  mutableEntry.target.name="mutated target";
  mutableEntry.provenance[0].contributorName="mutated contributor";
  mutableEntry.matchedPath[0].stepName="mutated path";
  mutableEvent.id="mutated event";
  mutableEvent.payload={mutated:true};
  assert.equal(JSON.stringify(report),reportBytes,"generated Flow defect reports isolate every source object");
  assert.equal(renderJiraReport(report).text,rendered.text,"clipboard serialization remains stable after source mutation");
  const stored=JSON.parse(persisted).defects[0].report;
  assert.equal(stored.event.flowContext.linkEvidence.kind,expectedKind);
  assert.equal(stored.event.flowContext.linkEvidence.label,expectedLabel);
  assert.equal(stored.event.flowContext.eventStepLink.eventId,event.id);
  assert.equal(stored.event.flowContext.eventStepLink.stepId,entry.stepId);
  assert.equal(stored.event.flowContext.effectiveTarget.id,entry.target.id);
  assert.equal(stored.event.flowContext.effectiveSchemaRevision,entry.effectiveSchemaRevision);
  assert.deepEqual(stored.evidence.flow,stored.event.flowContext);
  assert.equal(rendered.text.includes(expectedLabel),true);
  assert.equal(rendered.text.includes(entry.effectiveSchemaRevisionIdentity),true);
};
for(let sample=0;sample<24;sample+=1){
  const chooseSuccess=sample%2===0,target=chooseSuccess?"success":"failure",other=chooseSuccess?"failure":"success";
  const chronological=[
    {id:`event:${sample}:start`,name:"page_view",sourceId:"history",captureTime:`2026-07-23T10:00:00.${String(sample).padStart(3,"0")}Z`,pageUrl:"https://example.test/start",payload:{journey:`j-${sample}`}},
    {id:`event:${sample}:submit`,name:"submit",sourceId:"history",captureTime:`2026-07-23T10:00:01.${String(sample).padStart(3,"0")}Z`,pageUrl:"https://example.test/start",payload:{journey:`j-${sample}`,action:"submit"}},
    {id:`event:${sample}:${target}`,name:"page_view",sourceId:"history",captureTime:`2026-07-23T10:00:02.${String(sample).padStart(3,"0")}Z`,pageUrl:`https://example.test/${target}`,payload:{}},
    {id:`event:${sample}:late-${other}`,name:"page_view",sourceId:"history",captureTime:`2026-07-23T10:00:03.${String(sample).padStart(3,"0")}Z`,pageUrl:`https://example.test/${other}`,payload:{result:other}},
  ];
  const events=sample%3===0?[...chronological].reverse():rotate(chronological,sample%chronological.length);
  const feedBytes=JSON.stringify(events);
  let run=selectLiveFlow(createLiveFlowTest(`run:${sample}`,state.project.id),state,"flow:branch");
  assert.deepEqual(liveFlowEventStepChoices(run,state,chronological[2].id).choices.map(({id})=>id),[
    "frame:start","frame:success","frame:failure",
  ]);
  run=linkLiveFlowEvent(run,state,chronological[2],"frame:start");
  assert.deepEqual(liveFlowEventStepChoices(run,state,chronological[1].id).choices.map(({id,relationshipId})=>({id,relationshipId})),[
    {id:"occurrence:submit",relationshipId:"relationship:start-submit"},
  ]);
  run=linkLiveFlowEvent(run,state,chronological[1],"occurrence:submit");
  assert.deepEqual(new Set(liveFlowEventStepChoices(run,state,chronological[0].id).choices.map(({relationshipId})=>relationshipId)),new Set(["relationship:submit-success","relationship:submit-failure"]));
  run=linkLiveFlowEvent(run,state,chronological[0],`frame:${target}`);
  run=attachLiveFlowDefect(run,`frame:${target}`,`defect:${sample}`,chronological[0].id);

  assert.deepEqual(run.history.map(({stepId})=>stepId),["frame:start","occurrence:submit",`frame:${target}`]);
  assert.deepEqual(run.history.map(({relationshipId})=>relationshipId),[undefined,"relationship:start-submit",`relationship:submit-${target}`]);
  assert.deepEqual(run.history.map(({eventId})=>eventId),[chronological[2].id,chronological[1].id,chronological[0].id]);
  assert.equal(run.history.every((entry,index,history)=>index===0||Date.parse(entry.captureTime)<Date.parse(history[index-1].captureTime)),true,
    "generated traversals accept operator-selected feed evidence in reverse capture chronology");
  assert.equal(JSON.stringify(events),feedBytes,"Flow linking does not reorder, hide, select, or mutate feed events");
  const currentStep=run.currentStepId;
  assert.equal(liveFlowEventStepChoices(run,state,chronological[2].id).mode,"recorded");
  assert.equal(run.currentStepId,currentStep,"reviewing generated earlier links conserves the current traversal cursor");
  assert.equal(run.history[0].effectiveSchemaRevision>0,true);
  assert.equal(run.history[0].provenance.length>0,true);
  assert.equal(run.history.at(-1).status,"Invalid");
  assert.equal(run.history.at(-1).issues.some(({path})=>path==="/result"),true);
  assertDefectSnapshot(
    run.history[0],
    chronological[2],
    "start",
    "Started at Start",
    sample,
  );
  assertDefectSnapshot(
    run.history.at(-1),
    chronological[0],
    "path",
    `path Start to Submit occurrence to ${chooseSuccess?"Success":"Failure"}`,
    sample,
  );

  const completed=liveFlowSessionEvidence(run,state,`2026-07-23T10:00:04.${String(sample).padStart(3,"0")}Z`);
  assert.equal(completed.label,"Manual Flow test evidence");
  assert.equal(completed.currentStepId,`frame:${target}`);
  assert.deepEqual(completed.unchosenAlternatives,[{relationshipId:`relationship:submit-${other}`,stepId:`frame:${other}`,status:"Not tested"}]);
  assert.equal(completed.resumeMatching,false);
  const serialized=serializeLiveFlowSummary(completed);
  assert.equal(serialized.includes('"contributors"'),false,"saved summaries do not codify copied schema contributors");
  assert.equal(serialized.includes('"constraints"'),false,"saved summaries do not embed contributor facets");
  const restored=restoreLiveFlowSummary(serialized);
  assert.deepEqual(restored,JSON.parse(JSON.stringify(completed)),"serialization conserves selected Flow, cursor, event links, and validation evidence");
  restored.history[0].target.name="mutated restored summary";
  assert.notEqual(completed.history[0].target.name,restored.history[0].target.name,"restored summaries are isolated from completed runs");
}
assert.equal(JSON.stringify(state.project.collections),contributorFacetBytes,"generated traversals conserve every canonical contributor facet");

assert.equal(restoreLiveFlowSummary("not json"),undefined);
assert.equal(restoreLiveFlowSummary(JSON.stringify({label:"Incomplete",history:[]})),undefined);
console.log("data-layer Live Flow testing property tests passed");
