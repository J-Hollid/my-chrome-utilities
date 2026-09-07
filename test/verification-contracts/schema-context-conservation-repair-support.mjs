import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {timeoutIncidentDigest as digest} from "../../scripts/verification-reliability-values.mjs";
import {verificationContractSourceState} from "../../scripts/verification-registry/contract-conservation.mjs";
import {compactGitBlobIdentity} from "../../scripts/verification-registry/compact-conservation-identity.mjs";

export function emitContextConservationRepair({sourcesByOwner,observe,expected}){
  if(!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION)return;
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const owner="test/verification-contracts/historical-planning-contract-test.mjs";
  const failedCommit="83102122f6922d3b273faaf56f9ebb1cd009af78";
  const original=execFileSync("git",["show",`${failedCommit}:${owner}`],{encoding:"utf8"});
  const stateFor=sources=>({...verificationContractSourceState(sources),
    sourceObjects:Object.fromEntries(Object.entries(sources)
      .map(([path,source])=>[path,compactGitBlobIdentity(source)]))});
  let before;
  try{observe(stateFor({...sourcesByOwner,[owner]:original}));before={accepted:true};}
  catch(error){assert.match(error.message,expected);before={accepted:false,error:error.message};}
  assert.equal(before.accepted,false,"The failed source reproduces the conservation mismatch");
  observe(stateFor(sourcesByOwner));
  const after={accepted:true};
  const fixture={id:"schema-context-historical-conservation-v1",
    causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{failedCommit,owner,sourceDigest:digest(original)},
    expectedPreRepairFailure:before,expectedRepairResult:after};
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest:digest(fixture),observed:before},
    repairResult:{status:"passed",fixtureDigest:digest(fixture),observed:after}}}));
}
