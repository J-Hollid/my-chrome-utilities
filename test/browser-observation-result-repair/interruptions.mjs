import assert from "node:assert/strict";
import {completeBrowserObservationOutput,validateBrowserObservationProcessOutput} from
  "../../scripts/browser-observation/complete-output.mjs";
import {createBrowserObservationOutputForwarder} from "../../scripts/browser-observation/forward-output.mjs";
import {deriveObservationResultRepairProof} from "../../scripts/verification-reliability-observation-result-proof.mjs";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";

export function checkInterruptedOutput(makeFixture) {
  const observations=[{id:"FIRST",observationKey:"first",evidenceLeaves:[["first","ready"]]},
    {id:"SECOND",observationKey:"second"},{id:"THIRD",observationKey:"third"}];
  const input=[{first:{ready:true}},
    {swarmforgeBrowserTargetResult:{id:"FIRST",status:"passed",durationMs:1}},
    {swarmforgeBrowserTargetTiming:{id:"FIRST",durationMs:1}},
    {swarmforgeBrowserTargetResult:{id:"SECOND",status:"failed",error:"resize failed"}},
    {swarmforgeBrowserTargetTiming:{id:"SECOND",durationMs:2}}].map(JSON.stringify).join("\n")+"\n";
  let forwarded="";
  const forward=createBrowserObservationOutputForwarder(observations.map(({id})=>id),line=>{forwarded+=line;});
  forward.write(Buffer.from(input));forward.end();
  const selectFailed=output=>{
    const results=Object.fromEntries(observations.map(({id})=>[id,{}]));
    for(const line of output.trim().split("\n")) {
      const result=JSON.parse(line).swarmforgeBrowserTargetResult;
      if(result)Object.assign(results[result.id],result);
    }
    return Object.entries(results).find(([,result])=>result.status!=="passed")[0];
  };
  assert.throws(()=>completeBrowserObservationOutput(input,observations,3),/THIRD.*own timing/);
  const before={target:selectFailed(forwarded)};
  assert.deepEqual(before,{target:"FIRST"});
  const originalForwarded=forwarded;
  assert.throws(()=>validateBrowserObservationProcessOutput(input,observations,3,
    line=>{forwarded+=`${line}\n`;}),/THIRD.*own timing/);
  const after={target:selectFailed(forwarded)};
  assert.deepEqual(after,{target:"SECOND"});

  const value=makeFixture(),failure=value.incident.failure,entry=value.receipt.tasks[failure.task.key];
  failure.failureClass="incomplete-result";
  failure.failedBoundary={boundary:"target",logicalTargetId:"FIRST"};
  failure.retryScope={kind:"target",logicalTargetIds:["FIRST"],
    executionArgs:["scripts/run-browser-observation.mjs","FIRST"]};
  entry.output=originalForwarded;
  entry.logicalResults={FIRST:{durationMs:1},SECOND:{id:"SECOND",status:"failed",error:"resize failed",durationMs:2}};
  failure.outputSha256=timeoutIncidentDigest(entry.output);
  value.incident.failureDigest=timeoutIncidentDigest(failure);
  entry.reliabilityFailureDigest=value.incident.failureDigest;
  const proof=deriveObservationResultRepairProof(value.incident,value.loaders);
  assert.deepEqual(proof.boundary.logicalTargetIds,["SECOND"]);
  entry.logicalResults.SECOND.status="passed";
  assert.throws(()=>deriveObservationResultRepairProof(value.incident,value.loaders),/authenticated/);
  entry.logicalResults.SECOND.status="failed";
  entry.output+="tampered";
  assert.throws(()=>deriveObservationResultRepairProof(value.incident,value.loaders),/authenticated/);

  const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
    ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):null;
  if(context?.causalCategory==="other:interrupted batch result publication") {
    const fixture={id:"interrupted-batch-publication-v1",causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),input:{targets:3,failed:"SECOND"},
      expectedPreRepairFailure:before,expectedRepairResult:after};
    const fixtureDigest=timeoutIncidentDigest(fixture);
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
      incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:before},
      repairResult:{status:"passed",fixtureDigest,observed:after}}}));
  }
}
