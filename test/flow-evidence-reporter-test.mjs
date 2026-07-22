import assert from "node:assert/strict";
import {
  FLOW_RUNTIME_KEYS,
  FLOW_RUNTIME_EXECUTION_PLAN,
  flowEvidenceFailures,
  flowInterruptionReport,
} from "./support/flow-evidence-reporter.mjs";

const complete=()=>Object.fromEntries([
  ...FLOW_RUNTIME_KEYS.map((runtime)=>[runtime,{observed:true}]),
  ["installedBoundary",true],
]);

assert.deepEqual(FLOW_RUNTIME_EXECUTION_PLAN,FLOW_RUNTIME_KEYS);

assert.deepEqual(flowEvidenceFailures(complete()),[]);

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

console.log("flow evidence reporter tests passed");
