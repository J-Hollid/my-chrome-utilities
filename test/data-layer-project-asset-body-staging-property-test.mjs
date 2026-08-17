import assert from "node:assert/strict";

import {createProjectAssetBodyStaging} from "../dist/durable-project/project-asset-body-staging.js";

let seed=0x51a9e2d7;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
for(let sample=0;sample<64;sample+=1){
  const staging=createProjectAssetBodyStaging(),projectId=`project-${sample}`,otherId=`other-${sample}`,expected=new Map();
  for(let step=0;step<24;step+=1){const digest=`body-${random()%7}`,identity={projectId,namespace:"fixture",digest},value=`${sample}:${step}:${random()}`;staging.stage(identity,new Blob([value]));expected.set(digest,value);if(random()%3===0){const attachment=staging.attach(projectId);if(random()%2===0){attachment.commit();expected.clear();}}if(random()%5===0){staging.discard(identity);expected.delete(digest);}}
  const attached=staging.attach(projectId),actual=new Map(await Promise.all(attached.bodies.map(async item=>[item.identity.digest,await item.body.text()])));
  assert.deepEqual(actual,expected,"staging conserves each latest project-scoped generation exactly once");
  assert.deepEqual(staging.attach(otherId).bodies,[],"randomized staging never crosses project identity");
  attached.commit();assert.deepEqual(staging.attach(projectId).bodies,[],"committing the selected generation clears the exact remainder");
}

console.log("project asset-body staging property test passed");
