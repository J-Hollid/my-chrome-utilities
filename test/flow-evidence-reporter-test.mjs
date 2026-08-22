import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  FLOW_RUNTIME_KEYS,
  FLOW_RUNTIME_EXECUTION_PLAN,
  flowEvidenceFailures,
  flowInterruptionReport,
} from "./support/flow-evidence-reporter.mjs";
import {flowGraphCorrectiveWorkflow} from "./support/flow-graph-corrective-workflow.mjs";

const complete=()=>Object.fromEntries([
  ...FLOW_RUNTIME_KEYS.map((runtime)=>[runtime,{observed:true}]),
  ["installedBoundary",true],
]);

assert.deepEqual(FLOW_RUNTIME_EXECUTION_PLAN,FLOW_RUNTIME_KEYS);
assert.equal(FLOW_RUNTIME_KEYS.at(-1),"runtime050","the reporter must audit the latest Page-card identity runtime independently");
const controlsWorkflow=flowGraphCorrectiveWorkflow({projectId:"project",flowId:"flow"},
  {stopAfterRuntime:20});
assert.match(controlsWorkflow,/evidence\.runtime020=/u,
  "the controls workflow retains its final assigned producer");
assert.ok(controlsWorkflow.indexOf("return evidence;")<controlsWorkflow.indexOf("evidence.runtime021="),
  "the controls workflow stops before unrelated semantic and editor producers");

assert.deepEqual(flowEvidenceFailures(complete()),[]);

const falseNewest=complete();
falseNewest.runtime050={observed:false};
assert.deepEqual(flowEvidenceFailures(falseNewest),[
  {path:"runtime050.observed",value:false,expected:true},
]);

const measured=complete();
measured.runtime009={observed:true,measurements:[{previewDelta:0}]};
assert.deepEqual(flowEvidenceFailures(measured),[],"causal measurements remain diagnostic rather than boolean evidence leaves");

for(const [label,value,expectedPath] of [
  ["missing",undefined,"runtime008"],
  ["empty",{},"runtime008"],
  ["false",{observed:false},"runtime008.observed"],
  ["truthy string",{observed:"false"},"runtime008.observed"],
  ["truthy object",{observed:{}},"runtime008.observed"],
]){
  const evidence=complete();
  if(value===undefined)delete evidence.runtime008;
  else evidence.runtime008=value;
  const failures=flowEvidenceFailures(evidence);
  assert.equal(failures.length,1,label);
  assert.equal(failures[0].path,expectedPath,label);
}

for(const boundary of [false,"true",{},undefined]){
  const evidence=complete();
  evidence.installedBoundary=boundary;
  assert.deepEqual(flowEvidenceFailures(evidence),[
    {path:"installedBoundary",value:boundary,expected:true},
  ]);
}

for(const [index,runtime] of FLOW_RUNTIME_EXECUTION_PLAN.entries()){
  const interrupted=flowInterruptionReport(runtime,new Error(`injected ${runtime} failure`));
  assert.equal(interrupted.interrupted,runtime);
  assert.equal(interrupted.message,`injected ${runtime} failure`);
  assert.deepEqual(
    interrupted.later.map(({runtime:laterRuntime})=>laterRuntime),
    FLOW_RUNTIME_EXECUTION_PLAN.slice(index+1),
  );
  assert.ok(interrupted.later.every(({status})=>status==="unexecuted"));
  assert.ok(!interrupted.later.some(({runtime:laterRuntime})=>laterRuntime===runtime));
}

const startup=flowInterruptionReport("startup","injected startup failure");
assert.deepEqual(startup.later.map(({runtime})=>runtime),FLOW_RUNTIME_EXECUTION_PLAN);

if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION),
    normalized=(value)=>Array.isArray(value)?value.map(normalized):value&&typeof value==="object"
      ?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right))
        .map(([key,nested])=>[key,normalized(nested)])):value,
    digest=(value)=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex"),
    workflow=flowGraphCorrectiveWorkflow({projectId:"project",flowId:"flow"}),
    runtime035=workflow.match(/evidence\.runtime035=\{[^\n]+/u)?.[0]??"",
    runtime036=workflow.match(/evidence\.runtime036=\{[^\n]+/u)?.[0]??"",
    fixture={id:"flow-exact-evidence-leaf-projection-v1",causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{assignedLeavesExclude:["runtime035.viewerControlsWork","runtime036.validRecovery"]},
      expectedPreRepairFailure:{directAssertions:false,
        unexpectedEvidenceLeaves:["runtime035.viewerControlsWork","runtime036.validRecovery"]},
      expectedRepairResult:{directAssertions:true,unexpectedEvidenceLeaves:[]}},
    preRepairResult=fixture.expectedPreRepairFailure,
    repairResult={directAssertions:workflow.includes("if(!viewerControlsWork)throw new Error")&&
        workflow.includes("if(!validRecovery)throw new Error"),
      unexpectedEvidenceLeaves:[
        ...(runtime035.includes("viewerControlsWork")?["runtime035.viewerControlsWork"]:[]),
        ...(runtime036.includes("validRecovery")?["runtime036.validRecovery"]:[]),
      ]},fixtureDigest=digest(fixture);
  assert.deepEqual(repairResult,fixture.expectedRepairResult);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:preRepairResult},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}}}));
}

console.log("flow evidence reporter tests passed");
