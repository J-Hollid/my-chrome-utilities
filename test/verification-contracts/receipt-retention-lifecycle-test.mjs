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

const shared = createSharedEvidenceRetention();
shared.retain("sha256:shared", "incident-a");
shared.retain("sha256:shared", "incident-b");
assert.deepEqual(shared.consumers("sha256:shared"), ["incident-a", "incident-b"]);
assert.deepEqual(shared.release("sha256:shared", "incident-a"), {
  removable:false, consumers:["incident-b"],
});
assert.deepEqual(shared.release("sha256:shared", "incident-b"), {
  removable:true, consumers:[],
});

const events = [];
const decision = receiptRetentionDecision({ receiptIdentity:identity, identityMatches:true,
  integrationComplete:true });
const first = await applyReceiptDisposition({ path:"durable/receipt.json", identity, decision,
  recordCompactFact:async(fact) => events.push(["record", fact]),
  remove:async(target) => events.push(["remove", target]) });
const second = await applyReceiptDisposition({ path:"durable/receipt.json", identity, decision,
  priorResult:first, recordCompactFact:async() => assert.fail("must be idempotent"),
  remove:async() => assert.fail("must be idempotent") });
assert.deepEqual(second, first);
assert.equal(events[0][0], "record");
assert.deepEqual(events[1], ["remove", "durable/receipt.json"]);

const repository = await mkdtemp(path.join(os.tmpdir(), "receipt-disposition-"));
try {
  const durableDirectory = path.join(repository, "durable");
  await mkdir(durableDirectory);
  const receiptPath = path.join(durableDirectory, "focused.json");
  await writeFile(receiptPath, "exact receipt");
  const manifestPath = path.join(repository, "disposition.json");
  await writeFile(manifestPath, JSON.stringify({ version:1, integrationComplete:true,
    receipts:[{ path:"durable/focused.json", receiptIdentity:identity,
      identityMatches:true }] }));
  const firstDisposition = await runIntegrationReceiptDispositionManifest("disposition.json",
    { repositoryRoot:repository });
  assert.equal(firstDisposition.results[0].status, "removed");
  await assert.rejects(access(receiptPath));
  const state = JSON.parse(await readFile(path.join(repository, ".swarmforge",
    "verification-receipt-dispositions.json"), "utf8"));
  assert.equal(Object.keys(state.results).length, 1);
  const repeated = await runIntegrationReceiptDispositionManifest("disposition.json",
    { repositoryRoot:repository, remove:async() => assert.fail("must not remove twice") });
  assert.deepEqual(repeated, firstDisposition);
} finally {
  await rm(repository, { recursive:true, force:true });
}
