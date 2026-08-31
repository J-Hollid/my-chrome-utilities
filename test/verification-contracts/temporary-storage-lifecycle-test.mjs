import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  cleanupOwnedTemporaryPaths,
  plannedTemporaryRequirement,
  processOwnerIsLive,
  recoverOwnedTemporaryPath,
  recoverVerificationTemporaryStorage,
  temporaryCapacityPreflight,
  verificationTemporaryPaths,
} from "../../scripts/verification-execution/temporary-storage-lifecycle.mjs";
import {
  cleanupActiveVerificationTemporaryStorage,
  preflightVerificationTemporaryCapacity,
  prepareVerificationTemporaryPath,
  trackVerificationTemporaryContext,
} from "../../scripts/verification-execution/temporary-storage-runtime.mjs";

const root = await mkdtemp(path.join(os.tmpdir(), "verification-temporary-lifecycle-"));
try {
  assert.equal(await processOwnerIsLive({ pid:4021, processStartIdentity:"boot-a:991" }, {
    currentStartIdentity:async() => "boot-a:991",
  }), true, "a matching process id and start identity keeps the owner live");
  assert.equal(await processOwnerIsLive({ pid:4021, processStartIdentity:"boot-a:991" }, {
    currentStartIdentity:async() => "boot-a:1442",
  }), false, "a reused process id with a different start identity is a dead owner");
  assert.equal(await processOwnerIsLive({ pid:4021, processStartIdentity:"boot-a:991" }, {
    currentStartIdentity:async() => {
      const error = new Error("absent process");
      error.code = "ENOENT";
      throw error;
    },
  }), false, "an absent process is a dead owner");

  const paths = verificationTemporaryPaths({ repositoryRoot:root, runId:"run-123456789" });
  assert.equal(paths.runDirectory, path.join(root, "tmp", "verification-runs", "run-123456789"));
  assert.match(paths.chromeDirectory,
    /^\/tmp\/sf-chrome\/[a-f0-9]{24}\/[a-f0-9]{24}$/u);
  const collidingPrefix = verificationTemporaryPaths({ repositoryRoot:root,
    runId:"run-1234-different" });
  assert.notEqual(paths.chromeDirectory, collidingPrefix.chromeDirectory,
    "complete run identities produce separate Chrome paths");

  assert.deepEqual(plannedTemporaryRequirement({ tasks:[
    { key:"unit:a", stage:"unit", temporaryPathClass:"workspace" },
    { key:"browser:b", stage:"browser", temporaryPathClass:"chrome-short" },
    { key:"acceptance-session:c", stage:"acceptance-session" },
  ], concurrency:2, observationConcurrency:2, receiptOutputLimitBytes:1_000 }), {
    workspaceBytes:67_109_864, chromeBytes:134_217_728,
    requiredBytes:201_327_592,
  });

  assert.deepEqual(plannedTemporaryRequirement({ tasks:[
    { key:"unit:a", stage:"unit", temporaryPathClass:"workspace",
      temporaryRequirementBytes:100 },
    { key:"unit:b", stage:"unit", temporaryPathClass:"workspace",
      temporaryRequirementBytes:100 },
    { key:"unit:c", stage:"unit", temporaryPathClass:"workspace",
      temporaryRequirementBytes:80 },
    { key:"observation:a", stage:"browser-observation", temporaryPathClass:"chrome-short",
      temporaryRequirementBytes:90 },
    { key:"observation:b", stage:"browser-observation", temporaryPathClass:"chrome-short",
      temporaryRequirementBytes:70 },
  ], concurrency:2, observationConcurrency:2, receiptOutputLimitBytes:0 }), {
    workspaceBytes:200, chromeBytes:160, requiredBytes:360,
  }, "capacity includes every task that can run in each bounded pool");

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

  const foreignRepository = path.join(root, "foreign-repository");
  const sharedTemporaryRoot = path.join(root, "shared-temporary");
  const foreignPaths = verificationTemporaryPaths({ repositoryRoot:foreignRepository,
    runId:"foreign-run", temporaryRoot:sharedTemporaryRoot });
  const foreignReceipt = path.join(foreignRepository, "tmp", "verification-receipts",
    "foreign.json");
  await mkdir(path.dirname(foreignReceipt), { recursive:true });
  await mkdir(foreignPaths.chromeDirectory, { recursive:true });
  await writeFile(foreignReceipt, JSON.stringify({ runId:"foreign-run",
    completedAt:"2026-08-31T00:00:00.000Z", tasks:{} }));
  await writeFile(path.join(foreignPaths.chromeDirectory,
    ".swarmforge-temporary-owner.json"), JSON.stringify({
    version:1, runId:"foreign-run", owner:"chrome", path:foreignPaths.chromeDirectory,
    pid:987654321, receiptPath:foreignReceipt,
  }));
  assert.deepEqual(await recoverVerificationTemporaryStorage({
    repositoryRoot:recoveryRepository, temporaryRoot:sharedTemporaryRoot,
    ownerAlive:async() => false,
  }), [], "a repository does not scan another repository's Chrome namespace");
  await access(foreignPaths.chromeDirectory);

  const forgedLocalPaths = verificationTemporaryPaths({ repositoryRoot:recoveryRepository,
    runId:"forged-local-run", temporaryRoot:sharedTemporaryRoot });
  await mkdir(forgedLocalPaths.chromeDirectory, { recursive:true });
  await writeFile(path.join(forgedLocalPaths.chromeDirectory,
    ".swarmforge-temporary-owner.json"), JSON.stringify({
    version:2, repositoryIdentity:forgedLocalPaths.repositoryIdentity,
    runId:"foreign-run", owner:"chrome", path:forgedLocalPaths.chromeDirectory,
    pid:987654321, receiptPath:foreignReceipt,
  }));
  assert.deepEqual(await recoverVerificationTemporaryStorage({
    repositoryRoot:recoveryRepository, temporaryRoot:sharedTemporaryRoot,
    ownerAlive:async() => false,
  }), [{ status:"retained", path:forgedLocalPaths.chromeDirectory,
    reason:"ownership not verified" }],
  "a foreign durable receipt cannot authorize removal from the local Chrome namespace");
  await access(forgedLocalPaths.chromeDirectory);

  const recoveryFailure = path.join(recoveryRepository, "tmp", "verification-runs", "a-fails");
  const recoveryAfterFailure = path.join(recoveryRepository, "tmp", "verification-runs", "z-removes");
  const leasedRecovery = path.join(recoveryRepository, "tmp", "verification-runs", "leased");
  for (const [directory, activeLease] of [[recoveryFailure, false],
    [recoveryAfterFailure, false], [leasedRecovery, true]]) {
    await mkdir(directory);
    await writeFile(path.join(directory, ".swarmforge-temporary-owner.json"), JSON.stringify({
      version:1, runId:path.basename(directory), owner:"verification-run", path:directory,
      pid:987654321, receiptPath:recoveryReceipt, activeLease,
    }));
  }
  const independentRecovery = await recoverVerificationTemporaryStorage({
    repositoryRoot:recoveryRepository, temporaryRoot:path.join(root, "system-temporary"),
    ownerAlive:async() => false,
    receiptComplete:async() => true,
    leaseActive:async(marker) => marker.activeLease,
    remove:async(target) => {
      if (target === recoveryFailure) throw new Error("locked recovery path");
      await rm(target, { recursive:true, force:true });
    },
  });
  assert.deepEqual(independentRecovery, [
    { status:"failed", path:recoveryFailure, reason:"locked recovery path" },
    { status:"retained", path:leasedRecovery, reason:"active lease" },
    { status:"removed", path:recoveryAfterFailure },
  ]);
  await access(recoveryFailure);
  await access(leasedRecovery);
  await assert.rejects(access(recoveryAfterFailure));

  const runtimePaths = verificationTemporaryPaths({ repositoryRoot:root, runId:"runtime-run",
    temporaryRoot:path.join(root, "system-temporary") });
  const runtimeContext = { receiptPath:path.join(root, "runtime-receipt.json"),
    receipt:{ runId:"runtime-run", completedAt:"2026-08-31T00:00:00.000Z", tasks:{} },
    temporaryPaths:runtimePaths };
  await preflightVerificationTemporaryCapacity(runtimeContext, { tasks:[
    { key:"unit:temporary-lifecycle", stage:"unit", temporaryPathClass:"workspace" },
    { key:"browser:temporary-lifecycle", stage:"browser", temporaryPathClass:"chrome-short" },
  ], concurrency:1, receiptOutputLimitBytes:1_000,
  statFileSystem:async()=>({bavail:10_000_000,bsize:1_024}) });
  trackVerificationTemporaryContext(runtimeContext);
  await prepareVerificationTemporaryPath(runtimeContext, runtimePaths.systemDirectory,
    "unit:temporary-lifecycle");
  const runtimeOwner = JSON.parse(await readFile(path.join(runtimePaths.runDirectory,
    ".swarmforge-temporary-owner.json"), "utf8"));
  assert.equal(runtimeOwner.version, 3,
    "new temporary ownership records use the process-start identity schema");
  assert.match(runtimeOwner.processStartIdentity, /^[^:]+:\d+$/u,
    "new temporary ownership records bind the process id to its stable start identity");
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
  await preflightVerificationTemporaryCapacity(blockedContext, { tasks:[
    { key:"verification-preflight", stage:"unit", temporaryPathClass:"workspace" },
  ], concurrency:1, receiptOutputLimitBytes:1_000,
  statFileSystem:async()=>({bavail:10_000_000,bsize:1_024}) });
  trackVerificationTemporaryContext(blockedContext);
  await prepareVerificationTemporaryPath(blockedContext, blockedPaths.systemDirectory,
    "verification-preflight");
  await cleanupActiveVerificationTemporaryStorage();
  await assert.rejects(access(blockedPaths.runDirectory));
} finally {
  await rm(root, { recursive:true, force:true });
}
