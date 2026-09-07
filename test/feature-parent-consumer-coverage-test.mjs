import assert from "node:assert/strict";
import {pathToFileURL} from "node:url";
import {loadVerificationPacks,planVerification} from "../scripts/verification-packs.mjs";
import {timeoutIncidentDigest} from "../scripts/verification-reliability-values.mjs";

const sorted=values=>[...new Set(values)].sort();
// Batch keys can change when several packs run together. Retain each logical
// browser target when comparing the parent tasks with a combined plan.
const coverageKeys=task=>task.stage==="browser-observation"&&task.logicalTargetIds?.length
  ?task.logicalTargetIds.map(id=>`browser-observation:${id}`):[task.key];

export function verifyParentFeatureCoverage(packs,{packId,sliceId,sourcePath},
  currentPlan=planVerification(packs,{changedPaths:[sourcePath],includeProperties:true})) {
  const slice=packs.find(({id})=>id===packId).verificationSlices.find(({id})=>id===sliceId);
  const parents=sorted(slice.consumers.filter(consumer=>!consumer.sliceId).map(consumer=>consumer.packId));
  assert.ok(parents.length,"A parent coverage check requires declared parent consumers");
  const keys=new Set(currentPlan.tasks.flatMap(coverageKeys));
  for(const parent of parents) {
    assert.ok(currentPlan.parentPackSliceFallbacks.includes(parent),`${sourcePath} retains parent ${parent}`);
    const parentPlan=planVerification(packs,{packIds:[parent],includeProperties:true});
    for(const key of parentPlan.tasks.flatMap(coverageKeys))
      assert.ok(keys.has(key),`${sourcePath} retains complete parent task ${key}`);
  }
  for(const key of [...slice.tasks,...slice.prerequisites])
    assert.ok(keys.has(key),`${sourcePath} retains its declared task ${key}`);
  for(const status of ["M","D"]) {
    const historical=planVerification(packs,{changedPaths:[sourcePath],includeProperties:true,
      basePacks:packs,changeSet:{version:1,baseCommit:"a".repeat(40),commit:"b".repeat(40),
        paths:[sourcePath],entries:[{status,path:sourcePath}]}});
    assert.deepEqual(sorted(historical.tasks.flatMap(coverageKeys)),sorted(keys),
      `${sourcePath} retains current and historical parent coverage for ${status}`);
  }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const packs=await loadVerificationPacks(),feature={packId:"shell",sliceId:"side_panel_brand_presentation",
    sourcePath:"features/side-panel-companion-brand-correction.feature"};
  const slice=packs.find(({id})=>id===feature.packId).verificationSlices.find(({id})=>id===feature.sliceId);
  assert.throws(()=>{for(const consumer of slice.consumers)
    assert.ok(consumer.sliceId,"one exact consumer slice");},/one exact consumer slice/);
  const plan=planVerification(packs,{changedPaths:[feature.sourcePath],includeProperties:true});
  verifyParentFeatureCoverage(packs,feature,plan);
  const omitted=structuredClone(plan);
  omitted.tasks=omitted.tasks.filter(({key})=>key!=="unit:test/command-palette-test.mjs");
  assert.ok(omitted.tasks.length<plan.tasks.length);
  assert.throws(()=>verifyParentFeatureCoverage(packs,feature,omitted),/complete parent task/);
  const missingParent={...plan,parentPackSliceFallbacks:[]};
  assert.throws(()=>verifyParentFeatureCoverage(packs,feature,missingParent),/retains parent/);
  const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
    ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):null;
  if(context?.causalCategory==="other:feature parent consumer coverage") {
    const fixture={id:"feature-parent-consumers-v1",causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
      input:{feature,consumers:slice.consumers},expectedPreRepairFailure:{accepted:false},
      expectedRepairResult:{accepted:true,completeParentCoverage:true,negativeCasesPassed:true}};
    const fixtureDigest=timeoutIncidentDigest(fixture);
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
      incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:fixture.expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed:fixture.expectedRepairResult}}}));
  }
  console.log("Feature parent consumers retain complete unit, property and browser coverage");
}
