import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {planVerification,verificationTaskIdentity} from "../../scripts/verification-packs.mjs";
import {verificationPolicyContracts} from "../../scripts/verification-policy/contracts.mjs";
import {verifyParentFeatureCoverage} from "../feature-parent-consumer-coverage-test.mjs";

export function verifyFeatureSliceCoverage(packs,expectedSliceClosure) {
const featureCasesFor=(registry)=>registry.flatMap((pack)=>(pack.verificationSlices??[]).flatMap((slice)=>
  (slice.sourcePaths??[]).filter((sourcePath)=>sourcePath.endsWith(".feature"))
    .map((sourcePath)=>({packId:pack.id,sliceId:slice.id,sourcePath}))));
const exactFeatureCases=featureCasesFor(packs);
const approvedFeatureCases=featureCasesFor(JSON.parse(execFileSync("git",["show",
  "a231ac2088bbc1453648503bfebb7437d6b86a3c:verification/packs.json"],{encoding:"utf8"})));
assert.ok(approvedFeatureCases.every((prior)=>exactFeatureCases.some((current)=>
  JSON.stringify(current)===JSON.stringify(prior))),
  "the preparation covers every feature path with exact slice ownership");
const selectedSliceIdentities=(plan)=>Object.entries(plan.selectedVerificationSlices)
  .flatMap(([packId,sliceIds])=>sliceIds.map((sliceId)=>`${packId}:${sliceId}`)).sort();
const exactTaskKeysFor=(closure)=>[...closure].flatMap((identity)=>{
  const [packId,sliceId]=identity.split(":");
  const slice=packs.find(({id})=>id===packId).verificationSlices
    .find(({id})=>id===sliceId);
  return [...slice.tasks,...slice.prerequisites].flatMap((key)=>{
    const contract=verificationPolicyContracts.find(({testPath})=>key===`unit:${testPath}`);
    return contract?contract.testPaths.map((testPath)=>`unit:${testPath}`):[key];
  });
});
const featureChangeSet=(sourcePath,status="M")=>({version:1,baseCommit:"a".repeat(40),
  commit:"b".repeat(40),paths:[sourcePath],entries:[{status,path:sourcePath}]});
for(const {packId,sliceId,sourcePath} of exactFeatureCases){
  const slice=packs.find(({id})=>id===packId).verificationSlices.find(({id})=>id===sliceId);
  if(slice.consumers.some(consumer=>!consumer.sliceId)) {
    verifyParentFeatureCoverage(packs,{packId,sliceId,sourcePath});
    continue;
  }
  const closure=expectedSliceClosure(packId,sliceId);
  const expectedSlices=[...closure].sort();
  const expectedTaskKeys=new Set(exactTaskKeysFor(closure));
  const currentPlan=planVerification(packs,{changedPaths:[sourcePath],includeProperties:true});
  const allowedTaskKeys=new Set(["build:dist",...expectedTaskKeys]);
  if(expectedTaskKeys.has("acceptance-parse:features/settled-candidate-final-verification.feature"))
    allowedTaskKeys.add("unit:test/settled-final-verification-workflow-test.mjs");
  let prerequisiteAdded=true;
  while(prerequisiteAdded){
    prerequisiteAdded=false;
    for(const task of currentPlan.tasks){
      if(!allowedTaskKeys.has(task.key))continue;
      for(const prerequisite of task.prerequisiteTaskKeys??[]){
        if(allowedTaskKeys.has(prerequisite))continue;
        allowedTaskKeys.add(prerequisite);
        prerequisiteAdded=true;
      }
    }
  }
  assert.deepEqual(selectedSliceIdentities(currentPlan),expectedSlices,
    `${sourcePath} selects its exact prerequisite and consumer closure`);
  assert.deepEqual(currentPlan.parentPackSliceFallbacks,[],
    `${sourcePath} does not use a parent fallback with a valid current mapping`);
  assert.ok(currentPlan.tasks.every(({key})=>allowedTaskKeys.has(key)),
    `${sourcePath} selects only tasks and prerequisites declared by its slice closure`);
  assert.ok(currentPlan.propertyTasks.every(({key})=>allowedTaskKeys.has(key)),
    `${sourcePath} does not inherit parent property tasks`);

  const historicalPlan=planVerification(packs,{changedPaths:[sourcePath],
    changeSet:featureChangeSet(sourcePath),basePacks:packs,includeProperties:true});
  assert.deepEqual(historicalPlan.tasks.map(verificationTaskIdentity),
    currentPlan.tasks.map(verificationTaskIdentity),
    `${sourcePath} conserves current and base task identities`);
  const deletedPlan=planVerification(packs,{changedPaths:[sourcePath],
    changeSet:featureChangeSet(sourcePath,"D"),basePacks:packs,includeProperties:true});
  assert.deepEqual(deletedPlan.tasks.map(verificationTaskIdentity),
    currentPlan.tasks.map(verificationTaskIdentity),
    `${sourcePath} keeps exact historical deletion behavior`);

  const baseWithoutMapping=structuredClone(packs);
  const baseSlice=baseWithoutMapping.find(({id})=>id===packId).verificationSlices
    .find(({id})=>id===sliceId);
  baseSlice.sourcePaths=baseSlice.sourcePaths.filter((value)=>value!==sourcePath);
  const missingMappingPlan=planVerification(packs,{changedPaths:[sourcePath],
    changeSet:featureChangeSet(sourcePath),basePacks:baseWithoutMapping,includeProperties:true});
  assert.ok(missingMappingPlan.parentPackSliceFallbacks.includes(packId),
    `${sourcePath} keeps its historical parent when the base has no exact mapping`);
  assert.ok(missingMappingPlan.tasks.some(({key})=>!allowedTaskKeys.has(key)),
    `${sourcePath} uses conservative broader evidence without an exact mapping`);
}

}
