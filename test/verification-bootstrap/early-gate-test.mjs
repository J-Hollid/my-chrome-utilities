import assert from "node:assert/strict";

import {validateBootstrapEarlyGate} from
  "../../scripts/verification-bootstrap/preflight.mjs";
import {bootstrapPlan} from "./fixtures.mjs";

const plan=bootstrapPlan({changedPaths:["scripts/verification-bootstrap/runner.mjs"],
  changedPathProjection:[{path:"scripts/verification-bootstrap/runner.mjs",
    owner:"transition-only",sliceId:"process_fast_path_bootstrap"}],
  tasks:[{key:"mutation:bootstrap",stage:"mutation-discovery",executable:"node",
    args:["mutation.mjs","unit:bootstrap"],requiredCapabilities:[],outputLimitBytes:1024,
    display:"node mutation.mjs unit:bootstrap"},
  {key:"unit:bootstrap",stage:"unit",executable:"node",args:["test.mjs"],
    requiredCapabilities:[],outputLimitBytes:1024,display:"node test.mjs"}]});
const valid={plan,conservation:{changed:false},handlerClosure:{closed:true},incidents:[],
  repairProtocols:[],executables:{node:true},availableCapabilities:[],
  maximumOutputBytes:64*1024*1024,evidenceState:{eligible:true}};
assert.equal(validateBootstrapEarlyGate(valid).launchEligible,true);
for (const [field,value,pattern] of [
  ["conservation",{changed:true},/conservation/u],
  ["handlerClosure",{closed:false},/handler closure/u],
  ["executables",{node:false},/executable/u],
  ["maximumOutputBytes",512,/output capacity/u],
  ["evidenceState",{eligible:false},/evidence state/u],
]) assert.throws(()=>validateBootstrapEarlyGate({...valid,[field]:value}),pattern);

const incident={id:"incident-1",failure:{task:{key:"acceptance-session:verification_process"},
  retryScope:{taskKey:"acceptance-session:verification_process"}},
repair:{regression:{key:"acceptance-session:verification_process"}}};
assert.equal(validateBootstrapEarlyGate({...valid,incidents:[incident],repairProtocols:[{
  incidentId:"incident-1",taskKey:"acceptance-session:verification_process",
}]}).launchEligible,true);
assert.throws(()=>validateBootstrapEarlyGate({...valid,incidents:[{...incident,
  repair:{regression:{key:"unit:wrong"}}}],repairProtocols:[{
  incidentId:"incident-1",taskKey:"acceptance-session:verification_process",
}]}),/incident.*key alignment/u);
assert.throws(()=>validateBootstrapEarlyGate({...valid,incidents:[incident],repairProtocols:[]}),
  /incident.*key alignment/u);

console.log("verification bootstrap early-gate contracts passed");
