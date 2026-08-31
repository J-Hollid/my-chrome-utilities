import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  cleanupOwnedTemporaryPaths,
  temporaryCapacityPreflight,
  verificationTemporaryPaths,
} from "../../scripts/verification-execution/temporary-storage-lifecycle.mjs";
import { createSharedEvidenceRetention } from
  "../../scripts/verification-reliability-evidence-retention.mjs";

for (let index=0; index<300; index+=1) {
  const required=index * 7_919, reserve=index * 97, available=index * 12_331;
  const result=temporaryCapacityPreflight({ requiredBytes:required,
    availableBytes:available, reserveBytes:reserve });
  assert.equal(result.permitted, Math.max(0, available-reserve)>=required);
  const left=verificationTemporaryPaths({ repositoryRoot:"/project", runId:`same-prefix-${index}` });
  const right=verificationTemporaryPaths({ repositoryRoot:"/project", runId:`same-prefix-${index+300}` });
  assert.notEqual(left.chromeDirectory, right.chromeDirectory);
}

for (let index=0; index<100; index+=1) {
  const removed=[];
  const records=Array.from({length:7}, (_value,item) => ({ runId:`run-${index}`,
    owner:`owner-${item}`, path:`/owned/${index}/${item}`, ownershipVerified:true,
    ownerLive:false, activeLease:false, durableDispositionComplete:true }));
  const result=await cleanupOwnedTemporaryPaths(records, { remove:async(target) => {
    if (target.endsWith("/3")) throw new Error("independent failure");
    removed.push(target);
  } });
  assert.equal(result.failures.length, 1);
  assert.equal(removed.length, 6);
}

const root=await mkdtemp(path.join(os.tmpdir(), "lifecycle-properties-"));
try {
  const retention=createSharedEvidenceRetention({ statePath:path.join(root, "shared.json") });
  for (let count=1; count<=80; count+=1) {
    const content=`sha256:content-${count}`;
    for (let consumer=0; consumer<count; consumer+=1) {
      await retention.retain(content, `incident-${consumer}`);
    }
    for (let consumer=0; consumer<count; consumer+=1) {
      const released=await retention.release(content, `incident-${consumer}`);
      assert.equal(released.removable, consumer===count-1);
    }
  }
} finally {
  await rm(root, {recursive:true, force:true});
}
