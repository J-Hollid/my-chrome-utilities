import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  cleanupOwnedTemporaryPaths,
  recoverOwnedTemporaryPath,
  recoverVerificationTemporaryStorage,
  temporaryCapacityPreflight,
  verificationTemporaryPaths,
} from "../../scripts/verification-execution/temporary-storage-lifecycle.mjs";
import {
  cleanupActiveVerificationTemporaryStorage,
  prepareVerificationTemporaryPath,
  trackVerificationTemporaryContext,
} from "../../scripts/verification-execution/temporary-storage-runtime.mjs";

const root = await mkdtemp(path.join(os.tmpdir(), "verification-temporary-lifecycle-"));
try {
  const paths = verificationTemporaryPaths({ repositoryRoot:root, runId:"run-123456789" });
  assert.equal(paths.runDirectory, path.join(root, "tmp", "verification-runs", "run-123456789"));
  assert.equal(paths.chromeDirectory, path.join("/tmp", "sf-chrome", "run-1234"));

  assert.deepEqual(temporaryCapacityPreflight({ requiredBytes:2_000, availableBytes:4_000,
    reserveBytes:1_000 }), { permitted:true, requiredBytes:2_000, availableBytes:3_000,
    reserveBytes:1_000 });
  assert.deepEqual(temporaryCapacityPreflight({ requiredBytes:2_000, availableBytes:2_500,
    reserveBytes:1_000 }), { permitted:false, requiredBytes:2_000, availableBytes:1_500,
    reserveBytes:1_000 });

  const removable = path.join(root, "owned-removable");
  const failing = path.join(root, "owned-failing");
  const live = path.join(root, "owned-live");
  await Promise.all([removable, failing, live].map(async(directory) => {
    await mkdir(directory);
    await writeFile(path.join(directory, "payload"), "owned");
  }));
  const records = [
    { runId:"run-a", owner:"task-a", path:removable, ownershipVerified:true,
      ownerLive:false, durableDispositionComplete:true },
    { runId:"run-a", owner:"task-b", path:failing, ownershipVerified:true,
      ownerLive:false, durableDispositionComplete:true },
    { runId:"run-a", owner:"task-c", path:live, ownershipVerified:true,
      ownerLive:true, durableDispositionComplete:true },
  ];
  const cleanup = await cleanupOwnedTemporaryPaths(records, {
    remove:async(target) => {
      if (target === failing) throw new Error("busy path");
      await rm(target, { recursive:true, force:true });
    },
  });
  assert.deepEqual(cleanup.removed, [removable]);
  assert.deepEqual(cleanup.retained, [{ runId:"run-a", owner:"task-c", path:live,
    reason:"live owner" }]);
  assert.deepEqual(cleanup.failures, [{ runId:"run-a", owner:"task-b", path:failing,
    reason:"busy path" }]);
  await assert.rejects(access(removable));
  await access(failing);
  await access(live);

  const recovered = path.join(root, "owned-recovered");
  await mkdir(recovered);
  assert.deepEqual(await recoverOwnedTemporaryPath({
    record:{ runId:"run-b", owner:"dead-owner", path:recovered, ownershipVerified:true,
      ownerLive:false, durableDispositionComplete:false },
    recoverDisposition:async() => true,
  }), { status:"removed", path:recovered });
  await assert.rejects(access(recovered));

  const unsafe = path.join(root, "unowned");
  await mkdir(unsafe);
  assert.deepEqual(await recoverOwnedTemporaryPath({
    record:{ runId:"run-c", owner:"unknown", path:unsafe, ownershipVerified:false,
      ownerLive:false, durableDispositionComplete:true },
  }), { status:"retained", path:unsafe, reason:"ownership not verified" });
  await access(unsafe);

  const recoveryRepository = path.join(root, "recovery-repository");
  const recoveryRun = path.join(recoveryRepository, "tmp", "verification-runs", "dead-run");
  const recoveryReceipt = path.join(recoveryRepository, "receipt.json");
  await mkdir(recoveryRun, { recursive:true });
  await writeFile(recoveryReceipt, JSON.stringify({ runId:"dead-run",
    completedAt:"2026-08-31T00:00:00.000Z", tasks:{} }));
  await writeFile(path.join(recoveryRun, ".swarmforge-temporary-owner.json"), JSON.stringify({
    version:1, runId:"dead-run", owner:"verification-run", path:recoveryRun, pid:987654321,
    receiptPath:recoveryReceipt,
  }));
  const unownedSibling = path.join(recoveryRepository, "tmp", "verification-runs", "unowned");
  await mkdir(unownedSibling);
  const recovery = await recoverVerificationTemporaryStorage({
    repositoryRoot:recoveryRepository, temporaryRoot:path.join(root, "system-temporary"),
    ownerAlive:async() => false,
  });
  assert.deepEqual(recovery, [{ status:"removed", path:recoveryRun }]);
  await assert.rejects(access(recoveryRun));
  await access(unownedSibling);

  const runtimePaths = verificationTemporaryPaths({ repositoryRoot:root, runId:"runtime-run",
    temporaryRoot:path.join(root, "system-temporary") });
  const runtimeContext = { receiptPath:path.join(root, "runtime-receipt.json"),
    receipt:{ runId:"runtime-run", completedAt:"2026-08-31T00:00:00.000Z", tasks:{} },
    temporaryPaths:runtimePaths };
  trackVerificationTemporaryContext(runtimeContext);
  await prepareVerificationTemporaryPath(runtimeContext, runtimePaths.systemDirectory,
    "unit:temporary-lifecycle");
  await prepareVerificationTemporaryPath(runtimeContext, runtimePaths.chromeDirectory,
    "browser:temporary-lifecycle");
  await cleanupActiveVerificationTemporaryStorage();
  await assert.rejects(access(runtimePaths.runDirectory));
  await assert.rejects(access(runtimePaths.chromeDirectory));

  const blockedPaths = verificationTemporaryPaths({ repositoryRoot:root, runId:"blocked-run",
    temporaryRoot:path.join(root, "system-temporary") });
  const blockedContext = { receiptPath:path.join(root, "blocked-receipt.json"),
    receipt:{ runId:"blocked-run", tasks:{}, environmentPrerequisiteBlocked:[{
      taskKey:"verification-receipt", prerequisite:"bounded-output-capacity" }] },
    temporaryPaths:blockedPaths };
  trackVerificationTemporaryContext(blockedContext);
  await prepareVerificationTemporaryPath(blockedContext, blockedPaths.systemDirectory,
    "verification-preflight");
  await cleanupActiveVerificationTemporaryStorage();
  await assert.rejects(access(blockedPaths.runDirectory));
} finally {
  await rm(root, { recursive:true, force:true });
}
