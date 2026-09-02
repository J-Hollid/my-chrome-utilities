import assert from "node:assert/strict";

import {validateBootstrapEarlyGate} from
  "../../scripts/verification-bootstrap/preflight.mjs";
import {validateBootstrapEvidenceState} from
  "../../scripts/verification-bootstrap/evidence-state.mjs";
import {prepareMutationCapability,validateMutationCapabilityPlan} from
  "../../scripts/verification-bootstrap/mutation-capability.mjs";
import {bootstrapPlan} from "./fixtures.mjs";

const plan=bootstrapPlan({changedPaths:["scripts/verification-bootstrap/runner.mjs"],
  changedPathProjection:[{path:"scripts/verification-bootstrap/runner.mjs",
    owner:"transition-only",sliceId:"process_fast_path_bootstrap"}],
  tasks:[{key:"checkpoint:mutation-tool",stage:"checkpoint",executable:"node",
    args:["scripts/check-swarmforge-toolchain.mjs","--require","clj-mutate"],
    requiredCapabilities:[],outputLimitBytes:1024,display:"node toolchain --require clj-mutate"},
  {key:"mutation:bootstrap",stage:"mutation-discovery",executable:"node",
    args:["mutation.mjs","unit:bootstrap"],requiredCapabilities:["clj-mutate:locked"],
    outputLimitBytes:1024,
    nestedCapabilities:[{wrapper:"swarmforge/scripts/clj-mutate",tool:"clj-mutate",
      localRoot:"tmp/tools/clj-mutate"}],display:"node mutation.mjs unit:bootstrap"},
  {key:"unit:bootstrap",stage:"unit",executable:"node",args:["test.mjs"],
    requiredCapabilities:[],outputLimitBytes:1024,display:"node test.mjs"}]});
const valid={plan,conservation:{changed:false},handlerClosure:{closed:true},incidents:[],
  repairProtocols:[],executables:{node:true},availableCapabilities:["clj-mutate:locked"],
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

assert.equal(validateMutationCapabilityPlan(plan).checkpointKey,"checkpoint:mutation-tool");
assert.throws(()=>validateMutationCapabilityPlan({...plan,tasks:[plan.tasks[1],plan.tasks[0],
  plan.tasks[2]]}),/before mutation discovery/u);
assert.throws(()=>validateMutationCapabilityPlan({...plan,tasks:plan.tasks.map((task,index)=>
  index===1?{...task,nestedCapabilities:[]}:task)}),/nested.*capability/u);
let capabilityCalls=0;
assert.equal((await prepareMutationCapability({root:"/repo",provision:true,
  wrapperAvailable:async()=>true,run:async(args)=>{
    capabilityCalls+=1;
    if (capabilityCalls===1) throw new Error("missing");
    return args.at(1)==="--provision"?"provisioned":"required";
  }})).available,true);
assert.equal(capabilityCalls,3);
await assert.rejects(()=>prepareMutationCapability({root:"/repo",provision:false,
  wrapperAvailable:async()=>true,run:async()=>{throw new Error("missing");}}),
  /--provision clj-mutate/u);

console.log("verification bootstrap early-gate contracts passed");
