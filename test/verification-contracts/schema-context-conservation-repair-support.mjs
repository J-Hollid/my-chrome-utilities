import assert from "node:assert/strict";
import {emitLocalFeatureSelectionRepair} from "../utility-tab-expansion/installed-root-ownership.mjs";
import {execFileSync} from "node:child_process";
import {readdir} from "node:fs/promises";
import vm from "node:vm";
import {timeoutIncidentDigest as digest} from "../../scripts/verification-reliability-values.mjs";
import {verificationContractSourceState} from "../../scripts/verification-registry/contract-conservation.mjs";
import {compactGitBlobIdentity} from "../../scripts/verification-registry/compact-conservation-identity.mjs";

export function emitContextConservationRepair({sourcesByOwner,observe,expected}){
  if(!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION)return;
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if(context.causalCategory==="other:utility conservation record refresh"){
    const failedCommit="b94e98a228d1c2636593eec219e91cb44dc7bd9c";
    const path="test/fixtures/verification-process-compact-conservation.json";
    const previous=JSON.parse(execFileSync("git",["show",`${failedCommit}:${path}`],{encoding:"utf8"}));
    const state={...verificationContractSourceState(sourcesByOwner),
      sourceObjects:Object.fromEntries(Object.entries(sourcesByOwner)
        .map(([owner,source])=>[owner,compactGitBlobIdentity(source)]))};
    let before;
    try{observe(state,previous);before={accepted:true};}
    catch(error){assert.match(error.message,/Compact conservation record identity mismatch/u);
      before={accepted:false,error:error.message};}
    assert.equal(before.accepted,false);
    observe(state);
    const after={accepted:true};
    const fixture={id:"utility-conservation-record-refresh-v1",causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{failedCommit,path,priorRecordDigest:digest(previous)},
      expectedPreRepairFailure:before,expectedRepairResult:after};
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
      incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest:digest(fixture),observed:before},
      repairResult:{status:"passed",fixtureDigest:digest(fixture),observed:after}}}));
    return;
  }
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

export async function emitContextHelperInventoryRepair({helperDeclarations,retainedSupportHelpers}){
  if(!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION)return;
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if(context.causalCategory==="other:utility local feature selection"){
    await emitLocalFeatureSelectionRepair(context);
    return;
  }
  const owner="test/verification-contracts/ownership-shell-contract-test.mjs";
  const source=execFileSync("git",["show",`bada4a1d:${owner}`],{encoding:"utf8"});
  const start=source.indexOf("const retainedSupportHelpers =");
  const end=source.indexOf("assert.deepEqual(helperDeclarations",start);
  assert.ok(start>=0&&end>start);
  const program=source.slice(start,end).replaceAll("import.meta.url",
    JSON.stringify(new URL("./ownership-shell-contract-test.mjs",import.meta.url).href));
  const old=await vm.runInNewContext(`(async()=>{${program};return retainedSupportHelpers;})()`,{readdir,URL});
  const declared=helperDeclarations.map(({path})=>path).filter(path=>path.startsWith("test/support/")).sort();
  const missing=declared.filter(path=>!old.includes(path));
  assert.deepEqual(missing,["browser-probes","compatibility","fixture","interactions"]
    .map(name=>`test/support/schema-context-export/${name}.mjs`));
  assert.deepEqual(retainedSupportHelpers,declared);
  const before={accepted:false,missing},after={accepted:true,missing:[]};
  const fixture={id:"schema-context-nested-helper-inventory-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{owner,sourceDigest:digest(source)},
    expectedPreRepairFailure:before,expectedRepairResult:after};
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest:digest(fixture),observed:before},
    repairResult:{status:"passed",fixtureDigest:digest(fixture),observed:after}}}));
}
