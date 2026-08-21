import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  assertCompleteRunnablePackSelection,
  runnablePackRegistryIdentity,
} from "../scripts/verification-pack-cardinality/contract.mjs";
import { planVerification } from "../scripts/verification-packs.mjs";
import { terminalClosureExecution } from "../scripts/verification-reliability-closure.mjs";
import { timeoutRepairPackIds } from "../scripts/verification-reliability-values.mjs";
import { validateCanonicalMasterEvidenceRecord } from "../scripts/verification-evidence.mjs";

function runnablePack(id) {
  return {
    id,
    source:[`src/${id}/`],
    dependencies:[],
    unit:[`test/${id}-test.mjs`],
  };
}

const compatibilityIdentity = {
  id:"legacy-empty",
  source:[],
  dependencies:[],
};

const twoPackRegistry = [runnablePack("alpha"), runnablePack("beta"), compatibilityIdentity];
const twoPackIds = planVerification(twoPackRegistry, { terminalFull:true }).selectedPackIds;
assert.deepEqual(twoPackIds, ["alpha", "beta"],
  "an empty compatibility identity is excluded from terminal cardinality");
assert.deepEqual(assertCompleteRunnablePackSelection({
  registryPackIds:twoPackIds,
  selectedPackIds:["beta", "alpha"],
}), ["alpha", "beta"], "terminal selection follows the exact runnable registry");
assert.deepEqual(terminalClosureExecution({ attempt:"initial", runnablePackCount:twoPackIds.length }), {
  taskPolicy:"fresh-all", runnablePackCount:2, packagePolicy:"fresh",
}, "terminal closure accepts a complete non-twenty synthetic registry");

const expandedPackIds = planVerification([
  ...twoPackRegistry,
  runnablePack("gamma"),
], { terminalFull:true }).selectedPackIds;
assert.deepEqual(expandedPackIds, ["alpha", "beta", "gamma"],
  "a newly added runnable pack automatically joins terminal scope");
assert.notEqual(runnablePackRegistryIdentity(twoPackIds), runnablePackRegistryIdentity(expandedPackIds),
  "receipts can bind the exact runnable registry identity, not only a count");
assert.throws(() => assertCompleteRunnablePackSelection({
  registryPackIds:expandedPackIds,
  selectedPackIds:twoPackIds,
}), /complete runnable pack set/u,
"terminal selection cannot omit a newly runnable pack");

function canonicalEvidence(packIds) {
  const commit = "a".repeat(40);
  const tree = "b".repeat(40);
  const baseCommit = "c".repeat(40);
  return {
    version:2,
    status:"passed",
    commit,
    tree,
    baseCommit,
    packIds,
    plan:{
      mode:"exact",
      includeProperties:true,
      packIds,
      selectedPackIds:packIds,
      tasks:[{ key:"property:test/synthetic-property-test.mjs" }],
    },
    identities:{ artifact:{
      schemaVersion:1,
      buildIdentity:"d".repeat(64),
      inputDigest:"e".repeat(64),
      outputDigest:"f".repeat(64),
    } },
    receipt:{ tasks:[{ key:"property:test/synthetic-property-test.mjs", status:"passed" }] },
  };
}

const twoPackEvidence = canonicalEvidence(twoPackIds);
assert.equal(validateCanonicalMasterEvidenceRecord(twoPackEvidence, {
  canonicalPackIds:twoPackIds,
}), twoPackEvidence,
"canonical evidence accepts the complete two-pack registry");
const expandedPackEvidence = canonicalEvidence(expandedPackIds);
assert.equal(validateCanonicalMasterEvidenceRecord(expandedPackEvidence, {
  canonicalPackIds:expandedPackIds,
}), expandedPackEvidence,
"canonical evidence accepts the complete expanded registry");
assert.throws(() => validateCanonicalMasterEvidenceRecord(canonicalEvidence(twoPackIds), {
  canonicalPackIds:expandedPackIds,
}), /all-runnable-pack proof/u,
"evidence from the former registry cannot satisfy an expanded registry");

const currentRegistry = JSON.parse(await readFile(
  new URL("../verification/packs.json", import.meta.url), "utf8"));
assert.deepEqual(timeoutRepairPackIds,
  [...planVerification(currentRegistry, { terminalFull:true }).selectedPackIds].sort(),
  "reliability closure derives its pack set from the current registry");

console.log("verification pack cardinality contract tests passed");
