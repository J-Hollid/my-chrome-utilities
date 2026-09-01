import assert from "node:assert/strict";

import {validateBootstrapEarlyGate} from
  "../../scripts/verification-bootstrap/preflight.mjs";
import {validateBootstrapEvidenceState} from
  "../../scripts/verification-bootstrap/evidence-state.mjs";
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

const identity={candidateCommit:"a",candidateTree:"b",planDigest:"c",toolchainDigest:"d",
  registryDigest:"e",task:"task",incidentIds:[]};
assert.deepEqual(validateBootstrapEvidenceState({run:null,promotion:null,identity}),
  {eligible:true,action:"start"});
assert.deepEqual(validateBootstrapEvidenceState({run:{...identity,status:"running"},
  promotion:null,identity}),{eligible:true,action:"wait"});
assert.deepEqual(validateBootstrapEvidenceState({run:{...identity,status:"completed",
  receiptSha256:"f"},promotion:{receiptSha256:"f"},identity}),
{eligible:true,action:"use-receipt"});
assert.throws(()=>validateBootstrapEvidenceState({run:{...identity,status:"failed"},
  promotion:null,identity}),/not eligible/u);
assert.throws(()=>validateBootstrapEvidenceState({run:null,promotion:{receiptSha256:"f"},identity}),
  /without a durable receipt/u);

console.log("verification bootstrap early-gate contracts passed");
