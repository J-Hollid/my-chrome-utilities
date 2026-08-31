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
} finally {
  await rm(repository, { recursive:true, force:true });
}
