import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  assertCompleteRunnablePackSelection,
  classifyPackDefinition,
  createVerificationPackCardinalityAdapter,
  dispatchRepresentativeRunnablePacks,
  runnablePackIdsFromRegistry,
  runnablePackRegistryIdentity,
} from "../scripts/verification-pack-cardinality/contract.mjs";
import { planVerification, verificationTaskIdentity } from "../scripts/verification-packs.mjs";
import { terminalClosureExecution } from "../scripts/verification-reliability-closure.mjs";
import { canonicalRepairTaskIdentities } from "../scripts/verification-reliability-receipts.mjs";
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

const productionOwner = runnablePack("production-owner");
const verificationOnlyBehavior = {
  id:"observed-behavior",
  source:[],
  dependencies:[],
  unit:["test/observed-behavior-test.mjs"],
  verificationOnly:{ productionOwner:"production-owner" },
};
assert.deepEqual(classifyPackDefinition(compatibilityIdentity, [compatibilityIdentity]), {
  classification:"non-runnable compatibility metadata",
  terminalTreatment:"excluded from the runnable set",
});
assert.deepEqual(classifyPackDefinition(verificationOnlyBehavior,
  [productionOwner, verificationOnlyBehavior]), {
  classification:"valid verification-only behavior pack",
  terminalTreatment:"included with every registered task",
});
assert.deepEqual(classifyPackDefinition({
  id:"ambiguous", source:[], unit:["test/ambiguous-test.mjs"],
}, [productionOwner]), {
  classification:"invalid ambiguous pack",
  terminalTreatment:"block before planning",
});
assert.throws(() => runnablePackIdsFromRegistry([
  productionOwner,
  { id:"ambiguous", source:[], unit:["test/ambiguous-test.mjs"] },
]), /verification-only production owner/u,
"a source-less runnable pack fails closed without an explicit production owner");
assert.deepEqual(runnablePackIdsFromRegistry([
  { id:"legacy", source:[], unit:["test/legacy-test.mjs"] },
], { allowLegacySourceLess:true }), ["legacy"],
"an explicit historical compatibility route can reconstruct a pre-contract registry");

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

async function dispatchedPackIds(registry) {
  const calls = [];
  const result = await dispatchRepresentativeRunnablePacks(registry, async ({ packId, task }) => {
    calls.push({ packId, key:task.key });
    return { status:"passed", packId, key:task.key };
  });
  assert.ok(result.every(({ status }) => status === "passed"),
    "every representative synthetic dispatch completes successfully");
  return calls.map(({ packId }) => packId).sort();
}

const twoPackCardinality = createVerificationPackCardinalityAdapter(twoPackRegistry);
assert.deepEqual(twoPackCardinality.runnablePackIds, twoPackIds,
  "the injected adapter exposes the exact derived runnable identities");
assert.deepEqual(await dispatchedPackIds(twoPackRegistry), twoPackIds,
  "the current synthetic registry dispatches one representative task per runnable pack");
assert.deepEqual(new Set(canonicalRepairTaskIdentities(twoPackRegistry, {
  planVerification, verificationTaskIdentity,
}).map(({ packId }) => packId).filter(Boolean)), new Set(twoPackIds),
"the reliability adapter receives the exact synthetic runnable identities");

const expandedPackIds = planVerification([
  ...twoPackRegistry,
  runnablePack("gamma"),
], { terminalFull:true }).selectedPackIds;
assert.deepEqual(expandedPackIds, ["alpha", "beta", "gamma"],
  "a newly added runnable pack automatically joins terminal scope");
assert.deepEqual(await dispatchedPackIds([
  ...twoPackRegistry,
  runnablePack("gamma"),
]), expandedPackIds,
"an added runnable pack is actually dispatched without changing a numerical constant");
assert.deepEqual(await dispatchedPackIds([
  runnablePack("alpha"), runnablePack("beta"), compatibilityIdentity,
]), ["alpha", "beta"],
"an empty compatibility identity is excluded from executable dispatch");
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
const shellPack = currentRegistry.find(({ id }) => id === "shell");
const cardinalitySlice = shellPack.verificationSlices.find(
  ({ id }) => id === "verification_pack_cardinality_contract");
assert.ok(cardinalitySlice, "the Shell pack owns the cardinality contract through its named slice");
assert.deepEqual(cardinalitySlice.consumers, [],
  "semantic runnable-pack consumers do not become registry consumer edges");
assert.deepEqual(cardinalitySlice.tasks, [
  "unit:test/verification-pack-cardinality-contract-test.mjs",
  "unit:test/settled-final-verification-workflow-test.mjs",
  "unit:test/verification-evidence-production-path-test.mjs",
  "unit:test/verification-process-contract-test.mjs",
], "the slice declares only the exact named cardinality evidence tasks");
assert.equal(shellPack.globalImpact.includes("scripts/verification-pack-cardinality/"), false,
  "the bounded cardinality prefix is not also registered as globally impactful");
assert.deepEqual(await dispatchedPackIds(currentRegistry),
  [...planVerification(currentRegistry, { terminalFull:true }).selectedPackIds].sort(),
  "the current exact registry dispatches one synthetic representative per runnable identity");
assert.deepEqual(timeoutRepairPackIds,
  [...planVerification(currentRegistry, { terminalFull:true }).selectedPackIds].sort(),
  "reliability closure derives its pack set from the current registry");

console.log("verification pack cardinality contract tests passed");
