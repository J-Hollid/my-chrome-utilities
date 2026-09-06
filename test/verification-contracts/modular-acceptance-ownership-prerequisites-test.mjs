import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFile} from "node:fs/promises";
import {planVerification} from "../../scripts/verification-packs.mjs";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";

const feature="features/modular-verification-packs.feature";
const required=["ownership-event-library","ownership-capture","ownership-schemas","ownership-priority"]
  .map(name=>`unit:test/verification-contracts/${name}-contract-test.mjs`);
const prior=JSON.parse(execFileSync("git",["show","98ffec891d:verification/packs.json"],
  {encoding:"utf8",timeout:10000,maxBuffer:4*1024*1024}));
const remaining=["administration-acceptance-dependencies", "execution-binding-contract", "execution-coordinator-contract"]
  .map(name=>`unit:test/verification-contracts/${name}-test.mjs`);
const secondPrior=JSON.parse(execFileSync("git",["show","ce32e5e3a1:verification/packs.json"],
  {encoding:"utf8",timeout:10000,maxBuffer:4*1024*1024}));
const current=JSON.parse(await readFile("verification/packs.json","utf8"));
function missingPrerequisites(registry,source=feature,expected=required){
  const plan=planVerification(registry,{changedPaths:[source],includeProperties:true});
  assert.deepEqual(plan.packIds,["verification_process"]);
  const selected=new Set(plan.tasks.map(({key})=>key));
  assert.ok(selected.has("acceptance-session:verification_process"));
  return expected.filter(key=>!selected.has(key));
}
const before=missingPrerequisites(prior);
assert.deepEqual(before,required,"the failed candidate omitted all four ownership producers");
assert.deepEqual(missingPrerequisites(current),[],"modular acceptance selects every missing producer");
assert.deepEqual(missingPrerequisites(current,
  "acceptance/src/acceptance/verification_support/modular_architecture_vtd009_handlers.clj"),[],
"handler changes retain the same prerequisite closure");
assert.deepEqual(missingPrerequisites(secondPrior,feature,remaining),remaining);
assert.deepEqual(missingPrerequisites(current,feature,remaining),[]);
const removed=structuredClone(current);
removed.find(({id})=>id==="verification_process").verificationSlices
  .find(({id})=>id==="legacy_acceptance_compatibility").prerequisites=[];
assert.deepEqual(missingPrerequisites(removed),required,"loss of the dependency declaration is rejected");

const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):undefined;
if(context?.causalCategory==="other:legacy acceptance remaining prerequisites"){
  const fixture={id:"modular-acceptance-remaining-prerequisites-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    expectedPreRepairFailure:{missing:remaining},expectedRepairResult:{missing:[]}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,
      observed:{missing:missingPrerequisites(secondPrior,feature,remaining)}},
    repairResult:{status:"passed",fixtureDigest,
      observed:{missing:missingPrerequisites(current,feature,remaining)}}}}));
}
if(context?.causalCategory==="other:legacy acceptance ownership prerequisites"){
  const fixture={id:"modular-acceptance-ownership-prerequisites-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    expectedPreRepairFailure:{missing:required},expectedRepairResult:{missing:[]}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{missing:before}},
    repairResult:{status:"passed",fixtureDigest,observed:{missing:missingPrerequisites(current)}}}}));
}
console.log("Modular acceptance ownership prerequisites passed");
