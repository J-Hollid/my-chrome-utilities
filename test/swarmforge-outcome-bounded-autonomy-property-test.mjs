import assert from "node:assert/strict";
import { authorityDigest, boundedExecutionScope, classifyOutcome } from
  "../swarmforge/scripts/unblocker-control.mjs";
import { aggregateCampsiteAssessment, campsiteGenerationId, contributionDigest,
  dispositionIdentity } from
  "../scripts/stacked-campsite-control.mjs";

let state=0x5eed1234;
function random(){state=(state*1664525+1013904223)>>>0;return state/0x1_0000_0000;}
for(let sample=0;sample<300;sample+=1){
  const count=Math.floor(random()*80),catalogueSize=1+Math.floor(random()*40);
  const authorized=Array.from({length:count},(_,index)=>`task-${index}`);
  const duplicatePrefix=authorized.slice(0,Math.floor(random()*(count+1)));
  const scope=boundedExecutionScope({catalogueSize,authorizedTasks:[...authorized,...duplicatePrefix],
    prerequisiteTasks:duplicatePrefix});
  assert.equal(scope.taskCount,count);
  assert.equal(scope.materiallyBroad,count>=50);
  assert.equal(scope.catalogueSize,catalogueSize);

  const safe={reversible:true,preservesBehavior:true,externalRiskIncrease:false,
    needsUserOnlyAuthority:false,materiallyExpandsScope:false,weakensEvidence:false};
  const keys=Object.keys(safe),changed=keys[Math.floor(random()*keys.length)];
  safe[changed]=!safe[changed];
  assert.equal(classifyOutcome(safe).decision,"escalate");

  const paths=Array.from({length:1+Math.floor(random()*10)},(_,index)=>`src/path-${index%4}.ts`);
  const shuffled=paths.slice().sort(()=>random()-.5);
  assert.deepEqual(aggregateCampsiteAssessment({task:"task",candidate:"a".repeat(40),
    causalPaths:paths}).causalPaths,aggregateCampsiteAssessment({task:"task",candidate:"a".repeat(40),
    causalPaths:shuffled}).causalPaths);

  const offset=1+Math.floor(random()*100),blob=Math.floor(random()*0xffff).toString(16).padStart(4,"0");
  const contribution=`diff --git a/src/value.ts b/src/value.ts\nindex ${blob}..ffff 100644\n`+
    `--- a/src/value.ts\n+++ b/src/value.ts\n@@ -${offset},0 +${offset+1} @@ context\n+product`;
  const rebased=contribution.replace(`index ${blob}..ffff`,`index 0000..${blob}`)
    .replace(`-${offset},0 +${offset+1}`,`-${offset+17},0 +${offset+18}`)
    .replace("@@ context","@@ changed prerequisite context");
  assert.equal(contributionDigest(contribution),contributionDigest(rebased));

  const generation={task:"task",candidate:"a".repeat(40),boundaryGeneration:"shell-v1",causalPaths:paths};
  assert.equal(campsiteGenerationId(generation),campsiteGenerationId({...generation,causalPaths:shuffled}));
  assert.notEqual(campsiteGenerationId(generation),
    campsiteGenerationId({...generation,boundaryGeneration:"shell-v2"}));
}

const unordered={z:1,a:{z:2,a:3},list:[{z:4,a:5}]};
const reordered={list:[{a:5,z:4}],a:{a:3,z:2},z:1};
assert.equal(authorityDigest(unordered),authorityDigest(reordered));
assert.notEqual(dispositionIdentity({task:"t",path:"p",boundary:"b",generation:"g1"}),
  dispositionIdentity({task:"t",path:"p",boundary:"b",generation:"g2"}));
console.log("SwarmForge outcome-bounded autonomy properties passed.");
