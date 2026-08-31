import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { incidentEnvelope, transition } from
  "../../scripts/verification-reliability-persistence.mjs";
import { createTimeoutIncidentStore } from
  "../../scripts/verification-reliability-store.mjs";

const root = await mkdtemp(path.join(os.tmpdir(), "reliability-retirement-contract-"));
const directory = path.join(root, "incidents");
let id = 0;
const store = createTimeoutIncidentStore({
  root,
  storeDirectory:directory,
  legacyStoreDirectories:[],
  randomId:() => `retirement-contract-${++id}`,
  isAncestor:() => false,
  resolveCandidate:async(commit) => ({ commit, tree:"selected-tree" }),
});
const failure = (commit) => ({
  lineage:{ commit, tree:`${commit}-tree` },
  task:{ key:"unit:retirement-contract", stage:"unit", executable:"node", args:[] },
  failureClass:"nonzero-exit",
  fingerprint:"a".repeat(64),
});
const retirement = {
  kind:"lineage-retired",
  blocking:false,
  resolved:false,
  selectedLineage:{ commit:"selected-commit", tree:"selected-tree" },
  reason:"Failed commit is outside the selected delivery ancestry.",
};

try {
  const legacy = await store.create(failure("retired-commit"));
  const auditedAt = new Date(Date.parse(legacy.createdAt) + 1).toISOString();
  const legacyAudited = transition({ ...legacy, closureAudit:retirement },
    "closure-audited", auditedAt, { kind:retirement.kind, blocking:false });
  await writeFile(path.join(directory, `${legacy.id}.json`),
    `${JSON.stringify(incidentEnvelope(legacyAudited), null, 2)}\n`);

  const blocker = await store.create(failure("blocking-commit"));
  await store.recordClosureDisposition(blocker.id,
    { kind:"blocking-product-repair", blocking:true, resolved:false });

  await assert.rejects(store.retireAuditedLineages({ expectedCount:2 }),
    /Expected 2 audited lineage retirement\(s\), found 1/u,
    "the batch refuses to change records when its exact expected count differs");
  assert.equal((await store.read(legacy.id)).state, "unresolved",
    "a rejected count check changes no audited incident");

  const [retired] = await store.retireAuditedLineages({ expectedCount:1 });
  assert.equal(retired.state, "retired",
    "the audited off-lineage record receives the terminal retired state");
  assert.equal(retired.resolution, undefined,
    "retirement does not create package-backed product resolution evidence");
  assert.equal(retired.transitions.at(-1).type, "lineage-retirement-applied",
    "the correction keeps an exact terminal transition");
  assert.equal((await store.read(blocker.id)).state, "unresolved",
    "the correction does not change a blocking incident");

  const newlyAudited = await store.create(failure("new-retired-commit"));
  const immediatelyRetired = await store.recordClosureDisposition(newlyAudited.id, retirement);
  assert.equal(immediatelyRetired.state, "retired",
    "new lineage-retired audits enter the correct state without later migration");
} finally {
  await rm(root, { recursive:true, force:true });
}

console.log("reliability retirement contract tests passed");
