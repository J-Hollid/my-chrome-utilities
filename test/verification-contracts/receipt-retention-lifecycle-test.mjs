import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  applyReceiptDisposition,
  createSharedEvidenceRetention,
  receiptRetentionDecision,
} from "../../scripts/verification-reliability-evidence-retention.mjs";
import { runIntegrationReceiptDispositionManifest } from
  "../../scripts/verification-integration-receipt-disposition.mjs";
import { archiveNames } from "../../scripts/verification-reliability-persistence.mjs";
import { runPostIntegrationRuntimeDisposition } from
  "../../scripts/verification-reliability-post-integration.mjs";

const identity = { candidateCommit:"a".repeat(40), baseCommit:"b".repeat(40),
  tree:"c".repeat(40), task:"focused-task", planDigest:"d".repeat(64),
  runIntent:"review-evidence" };

assert.deepEqual(receiptRetentionDecision({ receiptIdentity:identity, identityMatches:true,
  currentConsumer:{ kind:"qa-integration", id:"qa-fast-forward" } }), {
  action:"retain", consumer:{ kind:"qa-integration", id:"qa-fast-forward" },
  reason:"authorized consumer is active",
});
assert.equal(receiptRetentionDecision({ receiptIdentity:identity, identityMatches:true,
  activeObligation:{ incidentId:"incident-1", status:"unresolved" } }).action, "retain");
assert.deepEqual(receiptRetentionDecision({ receiptIdentity:identity, identityMatches:true,
  integrationComplete:true }), {
  action:"remove", consumer:null, reason:"evidence was consumed and has no active obligation",
});
assert.equal(receiptRetentionDecision({ receiptIdentity:identity, identityMatches:false }).action,
  "remove");

const sharedRoot = await mkdtemp(path.join(os.tmpdir(), "shared-evidence-retention-"));
const sharedStatePath = path.join(sharedRoot, "shared.json");
const shared = createSharedEvidenceRetention({ statePath:sharedStatePath });
await shared.retain("sha256:shared", "incident-a");
await shared.retain("sha256:shared", "incident-b");
const restartedShared = createSharedEvidenceRetention({ statePath:sharedStatePath });
assert.deepEqual(await restartedShared.consumers("sha256:shared"),
  ["incident-a", "incident-b"]);
assert.deepEqual(await restartedShared.release("sha256:shared", "incident-a"), {
  removable:false, consumers:["incident-b"],
});
assert.deepEqual(await restartedShared.release("sha256:shared", "incident-b"), {
  removable:true, consumers:[],
});
await rm(sharedRoot, { recursive:true, force:true });

const events = [], recorded = [];
const decision = receiptRetentionDecision({ receiptIdentity:identity, identityMatches:true,
  integrationComplete:true });
await assert.rejects(applyReceiptDisposition({ path:"durable/receipt.json", identity, decision,
  recordCompactFact:async(fact) => recorded.push(structuredClone(fact)),
  remove:async(target) => { events.push(["remove", target]); throw new Error("interrupted"); } }),
  /interrupted/u);
assert.equal(recorded.at(-1).status, "removal-pending");
const retried = await applyReceiptDisposition({ path:"durable/receipt.json", identity, decision,
  priorResult:recorded.at(-1), recordCompactFact:async(fact) => recorded.push(structuredClone(fact)),
  remove:async(target) => events.push(["remove", target]) });
assert.equal(retried.status, "removed");
assert.equal(recorded.at(-1).status, "removed");
assert.equal(events.length, 2, "interrupted removal is retried");

const repository = await mkdtemp(path.join(os.tmpdir(), "receipt-disposition-"));
try {
  const durableDirectory = path.join(repository, "durable");
  await mkdir(durableDirectory);
  const receiptPath = path.join(durableDirectory, "focused.json");
  await writeFile(receiptPath, JSON.stringify({ version:1, runIntent:identity.runIntent,
    candidate:{ commit:identity.candidateCommit, baseCommit:identity.baseCommit,
      tree:identity.tree, evidenceTask:identity.task },
    plan:{ taskPlanDigest:identity.planDigest }, tasks:{}, completedAt:"2026-08-31T00:00:00Z" }));
  const manifestPath = path.join(repository, "disposition.json");
  await writeFile(manifestPath, JSON.stringify({ version:1, integrationComplete:true,
    receipts:[{ path:"durable/focused.json", receiptIdentity:identity,
      identityMatches:false, currentConsumer:{ kind:"qa-integration", id:"forged" } }] }));
  const firstDisposition = await runIntegrationReceiptDispositionManifest("disposition.json",
    { repositoryRoot:repository, loadActiveObligations:async()=>[] });
  assert.equal(firstDisposition.results[0].status, "removed");
  await assert.rejects(access(receiptPath));
  const state = JSON.parse(await readFile(path.join(repository, ".swarmforge",
    "verification-receipt-dispositions.json"), "utf8"));
  assert.equal(Object.keys(state.results).length, 1);
  const repeated = await runIntegrationReceiptDispositionManifest("disposition.json",
    { repositoryRoot:repository, loadActiveObligations:async()=>[],
      remove:async() => assert.fail("must not remove twice") });
  assert.deepEqual(repeated, firstDisposition);

  const interruptedPath = path.join(durableDirectory, "interrupted.json");
  await writeFile(interruptedPath, JSON.stringify({ version:1, runIntent:identity.runIntent,
    candidate:{ commit:identity.candidateCommit, baseCommit:identity.baseCommit,
      tree:identity.tree, evidenceTask:identity.task },
    plan:{ taskPlanDigest:identity.planDigest }, tasks:{}, completedAt:"2026-08-31T00:00:00Z" }));
  await writeFile(manifestPath, JSON.stringify({ version:1, integrationComplete:true,
    receipts:[{ path:"durable/interrupted.json", receiptIdentity:identity }] }));
  await assert.rejects(runIntegrationReceiptDispositionManifest("disposition.json", {
    repositoryRoot:repository, loadActiveObligations:async()=>[],
    remove:async(target) => {
      await rm(target, { force:true });
      throw new Error("interrupted after removal");
    },
  }), /interrupted after removal/u);
  await assert.rejects(access(interruptedPath));
  const recoveredRemoval = await runIntegrationReceiptDispositionManifest("disposition.json", {
    repositoryRoot:repository, loadActiveObligations:async()=>[],
    remove:async() => assert.fail("missing receipt must not be removed twice"),
  });
  assert.equal(recoveredRemoval.results[0].status, "removed");

  const retainedPath = path.join(durableDirectory, "incident.json");
  await writeFile(retainedPath, JSON.stringify({ version:1, runIntent:identity.runIntent,
    candidate:{ commit:identity.candidateCommit, baseCommit:identity.baseCommit,
      tree:identity.tree, evidenceTask:identity.task },
    plan:{ taskPlanDigest:identity.planDigest }, tasks:{}, completedAt:"2026-08-31T00:00:00Z" }));
  await writeFile(manifestPath, JSON.stringify({ version:1, integrationComplete:true,
    receipts:[{ path:"durable/incident.json", receiptIdentity:identity }] }));
  const retained = await runIntegrationReceiptDispositionManifest("disposition.json", {
    repositoryRoot:repository,
    loadActiveObligations:async({ contentIdentity }) => [{ incidentId:"incident-real",
      status:"unresolved", contentIdentity }],
  });
  assert.equal(retained.results[0].status, "retained");
  await access(retainedPath);

  const calibrationPath = path.join(durableDirectory, "calibration.json");
  await writeFile(calibrationPath, JSON.stringify({ version:1, runIntent:identity.runIntent,
    candidate:{ commit:identity.candidateCommit, baseCommit:identity.baseCommit,
      tree:identity.tree, evidenceTask:identity.task },
    plan:{ taskPlanDigest:identity.planDigest }, tasks:{},
    completedAt:"2026-08-31T00:00:00Z" }));
  await writeFile(manifestPath, JSON.stringify({ version:1, integrationComplete:true,
    receipts:[{ path:"durable/calibration.json", receiptIdentity:identity }] }));
  const calibrationRetained = await runIntegrationReceiptDispositionManifest("disposition.json", {
    repositoryRoot:repository, loadActiveObligations:async()=>[],
    loadCalibrationConsumer:async({ contentIdentity }) => ({ kind:"performance-calibration",
      id:"active-snapshot", status:"active", contentIdentity }),
  });
  assert.equal(calibrationRetained.results[0].status, "retained",
    "an active calibration consumer retains its raw sample");
  assert.equal(calibrationRetained.results[0].reason,
    "active authorized consumer requires the evidence",
  "calibration retention does not report an incident obligation");
  const calibrationRemoved = await runIntegrationReceiptDispositionManifest("disposition.json", {
    repositoryRoot:repository, loadActiveObligations:async()=>[],
    loadCalibrationConsumer:async()=>null,
  });
  assert.equal(calibrationRemoved.results[0].status, "removed",
    "a validated durable compact calibration identity releases the raw sample");
  await assert.rejects(access(calibrationPath));
} finally {
  await rm(repository, { recursive:true, force:true });
}

const runtimeRepository = await mkdtemp(path.join(os.tmpdir(), "post-integration-runtime-"));
try {
  const masterCommit = "1".repeat(40), masterTree = "2".repeat(40);
  const qaCommit = "3".repeat(40), baseCommit = "4".repeat(40);
  const finalAttemptId = "5".repeat(64), finalAttemptDigest = "6".repeat(64);
  const removableIncidentId = "resolved-removable";
  const retainedIncidentId = "resolved-shared";
  const compactResolution = (incidentId, seed) => ({ incidentId,
    failureDigest:seed.repeat(64), checkpointReceiptSha256:(seed === "7" ? "8" : "9").repeat(64),
    packageReceiptSha256:(seed === "7" ? "a" : "b").repeat(64),
    packageDigest:(seed === "7" ? "c" : "d").repeat(64), resolutionDigest:seed.repeat(64) });
  const removableCompact = compactResolution(removableIncidentId, "7");
  const retainedCompact = compactResolution(retainedIncidentId, "e");
  const finalRecord = { version:2, status:"passed", task:"terminal-cleanup", commit:masterCommit,
    tree:masterTree, baseCommit, packIds:["verification_process"],
    plan:{ mode:"exact", includeProperties:true, packIds:["verification_process"],
      selectedPackIds:["verification_process"], tasks:[{ key:"property:cleanup" }] },
    identities:{ artifact:{ schemaVersion:1, buildIdentity:"f".repeat(64),
      inputDigest:"0".repeat(64), outputDigest:"1".repeat(64) } },
    receipt:{ tasks:[{ status:"passed" }] },
    checkpointAttempt:{ id:finalAttemptId, identityDigest:finalAttemptDigest },
    reliabilityResolutions:[removableCompact, retainedCompact] };
  const finalNote = { version:2, records:[finalRecord] };
  const noteBefore = structuredClone(finalNote);
  const checkpointDirectory = path.join(runtimeRepository, "checkpoint-attempts");
  const incidentDirectory = path.join(runtimeRepository, "reliability-incidents");
  await mkdir(checkpointDirectory);
  await mkdir(incidentDirectory);
  const finalAttemptPath = path.join(checkpointDirectory, `${finalAttemptId}.json`);
  const integratedAttemptId = "b".repeat(64);
  const integratedAttemptPath = path.join(checkpointDirectory, `${integratedAttemptId}.json`);
  const obligatedAttemptId = "d".repeat(64);
  const obligatedAttemptPath = path.join(checkpointDirectory, `${obligatedAttemptId}.json`);
  const interruptedAttemptId = "f".repeat(64);
  const interruptedAttemptPath = path.join(checkpointDirectory, `${interruptedAttemptId}.json`);
  const qaAttemptPath = path.join(checkpointDirectory, `${"a".repeat(64)}.json`);
  await writeFile(finalAttemptPath, "final attempt");
  await writeFile(integratedAttemptPath, "integrated attempt");
  await writeFile(obligatedAttemptPath, "obligated attempt");
  await writeFile(interruptedAttemptPath, "interrupted attempt");
  await writeFile(qaAttemptPath, "qa attempt");
  const resolutionIncident = (compact) => ({ id:compact.incidentId, state:"resolved",
    failureDigest:compact.failureDigest, resolution:{ digest:compact.resolutionDigest,
      checkpoint:{ receiptSha256:compact.checkpointReceiptSha256 },
      package:{ receiptSha256:compact.packageReceiptSha256, digest:compact.packageDigest },
      archive:archiveNames(compact.incidentId) } });
  for (const compact of [removableCompact, retainedCompact]) {
    for (const name of Object.values(archiveNames(compact.incidentId))) {
      await writeFile(path.join(incidentDirectory, name), `${compact.incidentId}:${name}`);
    }
  }
  const unresolved = { id:"unresolved-consumer", state:"unresolved",
    sourceReceiptSha256:retainedCompact.checkpointReceiptSha256 };
  const result = await runPostIntegrationRuntimeDisposition({
    repositoryRoot:runtimeRepository, expectedMasterCommit:masterCommit,
    loadFinalContext:async() => ({ masterCommit, masterTree, qaCommit,
      canonicalPackIds:["verification_process"], note:finalNote }),
    listCheckpointAttempts:async() => [
      { id:finalAttemptId, state:"promoted", identityDigest:finalAttemptDigest,
        identity:{ candidate:{ commit:masterCommit } } },
      { id:integratedAttemptId, state:"tasks-complete", identityDigest:"c".repeat(64),
        identity:{ candidate:{ commit:"8".repeat(40) } } },
      { id:obligatedAttemptId, state:"tasks-complete",
        identityDigest:retainedCompact.checkpointReceiptSha256,
        identity:{ candidate:{ commit:"8".repeat(40) } } },
      { id:interruptedAttemptId, state:"interrupted", identityDigest:"0".repeat(64),
        identity:{ candidate:{ commit:"8".repeat(40) } } },
      { id:"a".repeat(64), state:"tasks-complete", identityDigest:"b".repeat(64),
        identity:{ candidate:{ commit:qaCommit } } },
    ],
    listIncidents:async() => [resolutionIncident(removableCompact),
      resolutionIncident(retainedCompact), unresolved],
    checkpointDirectory, incidentDirectory,
    isIntegratedCommit:async(candidate) => candidate === masterCommit || candidate === "8".repeat(40),
  });
  assert.equal(result.removed.filter(({ kind }) => kind === "checkpoint-attempt").length, 3,
    "completed and interrupted terminal attempts in the integrated lineage are removed");
  assert.equal(result.removed.filter(({ kind }) => kind === "incident-archive").length, 3,
    "resolved archive data with no unresolved consumer is removed");
  assert.equal(result.retained.filter(({ kind, reason }) => kind === "incident-archive" &&
    reason === "active incident obligation").length, 3,
  "shared archive data remains while an unresolved incident refers to it");
  await assert.rejects(access(finalAttemptPath));
  await assert.rejects(access(integratedAttemptPath));
  await assert.rejects(access(interruptedAttemptPath));
  await access(obligatedAttemptPath);
  assert.equal(result.retained.some(({ identity, reason }) =>
    identity === obligatedAttemptId && reason === "active incident obligation"), true,
  "an active obligation retains its terminal integrated checkpoint attempt");
  await access(qaAttemptPath);
  for (const name of Object.values(archiveNames(removableIncidentId))) {
    await assert.rejects(access(path.join(incidentDirectory, name)));
  }
  for (const name of Object.values(archiveNames(retainedIncidentId))) {
    await access(path.join(incidentDirectory, name));
  }
  assert.deepEqual(finalNote, noteBefore,
    "post-integration cleanup does not change the final Git note compact identities");

  const integratedQaAttemptId = "1".repeat(64);
  const integratedQaAttemptPath = path.join(checkpointDirectory, `${integratedQaAttemptId}.json`);
  await writeFile(integratedQaAttemptPath, "integrated QA attempt");
  const integratedQaResult = await runPostIntegrationRuntimeDisposition({
    repositoryRoot:runtimeRepository, expectedMasterCommit:masterCommit,
    loadFinalContext:async() => ({ masterCommit, masterTree, qaCommit:masterCommit,
      canonicalPackIds:["verification_process"], note:finalNote }),
    listCheckpointAttempts:async() => [{ id:integratedQaAttemptId, state:"tasks-complete",
      identityDigest:"2".repeat(64), identity:{ candidate:{ commit:masterCommit } } }],
    listIncidents:async() => [resolutionIncident(removableCompact),
      resolutionIncident(retainedCompact)], checkpointDirectory, incidentDirectory,
    isIntegratedCommit:async() => true,
  });
  assert.equal(integratedQaResult.removed.some(({ identity:removedIdentity }) =>
    removedIdentity === integratedQaAttemptId), true,
  "an extra terminal QA attempt is removed after QA equals master");
  await assert.rejects(access(integratedQaAttemptPath));
  await assert.rejects(runPostIntegrationRuntimeDisposition({
    repositoryRoot:runtimeRepository, expectedMasterCommit:"9".repeat(40),
    loadFinalContext:async() => ({ masterCommit, masterTree, qaCommit,
      canonicalPackIds:["verification_process"], note:finalNote }),
    listCheckpointAttempts:async() => [], listIncidents:async() => [],
    checkpointDirectory, incidentDirectory,
  }), /exact master commit/u, "cleanup rejects a final note for a different master commit");
} finally {
  await rm(runtimeRepository, { recursive:true, force:true });
}
