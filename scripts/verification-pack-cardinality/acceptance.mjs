import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import {
  createVerificationPackCardinalityAdapter,
  dispatchRepresentativeRunnablePacks,
} from "./contract.mjs";
import {
  registryCardinalityEvidenceTaskKeys,
  registryCardinalityFocusedTaskKeys,
  validateRegistryCardinalityFocusedEvidence,
} from "./focused-evidence.mjs";
import { intentOwnershipReadiness } from "../verification-ownership-readiness-core.mjs";
import { loadVerificationPacks, planVerification } from "../verification-packs.mjs";
import { timeoutRepairPackIds } from "../verification-reliability-values.mjs";

function syntheticPack(id) {
  return { id, source:[`src/${id}/`], dependencies:[], unit:[`test/${id}-test.mjs`] };
}

async function dispatchedIds(packs) {
  const ids = [];
  await dispatchRepresentativeRunnablePacks(packs, async ({ packId, task }) => {
    assert.ok(task.key, `Synthetic pack ${packId} has no executable representative`);
    ids.push(packId);
    return { status:"passed" };
  });
  return ids.sort();
}

function cardinalityEvidenceInput(changedPaths, packs) {
  return {
    task:"registry-derived-verification-packs",
    candidateRegistry:packs,
    changedPaths,
    taskKeys:[...registryCardinalityEvidenceTaskKeys,
      "property:test/workspace-tabs-property-test.mjs", "acceptance-session:shell",
      "package:extension"],
    syntheticProofs:{ current:true, addedRunnable:true, emptyCompatibility:true },
    includeProperties:true,
    includePackage:true,
    terminalFull:false,
  };
}

async function verifyScenario192(packs) {
  const result = await intentOwnershipReadiness({
    intent:{
      version:1,
      baseCommit:"a".repeat(40),
      task:"registry-derived-verification-packs",
      approvedPackIds:["shell"],
      likelyPaths:["scripts/verification-pack-cardinality/contract.mjs"],
      proposedPrefixes:[],
    },
    packs,
  });
  assert.equal(result.planOnly, true);
  assert.equal(result.classification, "bounded-ready");
  assert.deepEqual(result.plannedPackIds, ["shell", "verification_process"]);
  assert.deepEqual(result.terminalFullObligations, []);
}

async function verifyScenario193(packs) {
  const shell = packs.find(({ id }) => id === "shell");
  const slice = shell.verificationSlices.find(
    ({ id }) => id === "verification_pack_cardinality_contract");
  assert.ok(slice);
  assert.deepEqual(slice.consumers,
    [{packId:"verification_process", sliceId:"task_batching"}]);
  assert.equal(shell.globalImpact.includes("scripts/verification-pack-cardinality/"), false);
  const helper = await readFile(new URL("../verification-reliability-values.mjs", import.meta.url), "utf8");
  assert.equal(helper.includes("verification-pack-cardinality"), false);
  const receipts = await readFile(new URL("../verification-reliability-receipts.mjs", import.meta.url), "utf8");
  assert.equal(receipts.includes("verification-pack-cardinality"), false);
}

async function verifyScenario194(packs) {
  const currentIds = createVerificationPackCardinalityAdapter(packs).runnablePackIds;
  assert.deepEqual(await dispatchedIds(packs), currentIds);
  const basic = [syntheticPack("alpha"), syntheticPack("beta"), {
    id:"empty-compatibility", source:[], dependencies:[],
  }];
  assert.deepEqual(await dispatchedIds(basic), ["alpha", "beta"]);
  assert.deepEqual(await dispatchedIds([...basic, syntheticPack("gamma")]),
    ["alpha", "beta", "gamma"]);
}

function verifyScenario195(packs) {
  const input = cardinalityEvidenceInput([
    "scripts/verification-pack-cardinality/contract.mjs",
    "test/verification-pack-cardinality-contract-test.mjs",
  ], packs);
  assert.equal(validateRegistryCardinalityFocusedEvidence(input).mode,
    "registry-cardinality-focused");
  assert.throws(() => validateRegistryCardinalityFocusedEvidence({
    ...input, task:"generic-tooling-candidate",
  }), /exact task identity/u);
  assert.throws(() => validateRegistryCardinalityFocusedEvidence({
    ...input, taskKeys:input.taskKeys.filter((key) => key !== "acceptance-session:shell"),
  }), /Shell acceptance session/u);
  assert.throws(() => validateRegistryCardinalityFocusedEvidence({
    ...input,
    changedPaths:[...input.changedPaths, "scripts/verification-reliability-values.mjs"],
  }), /prohibited reliability helpers/u);
  assert.throws(() => validateRegistryCardinalityFocusedEvidence({
    ...input,
    changedPaths:[...input.changedPaths, "scripts/verification-reliability-receipts.mjs"],
  }), /prohibited reliability helpers/u);
  assert.throws(() => validateRegistryCardinalityFocusedEvidence({
    ...input, changedPaths:[...input.changedPaths, "src/product.ts"],
  }), /outside the approved path set/u);
  assert.throws(() => validateRegistryCardinalityFocusedEvidence({
    ...input,
    candidateRegistry:packs.map((pack) => pack.id === "shell"
      ? { ...pack, globalImpact:[...(pack.globalImpact ?? []),
        "scripts/verification-pack-cardinality/"] }
      : pack),
  }), /globally impactful/u);
  assert.throws(() => validateRegistryCardinalityFocusedEvidence({
    ...input,
    candidateRegistry:packs.map((pack) => pack.id === "shell" ? {
      ...pack,
      verificationSlices:pack.verificationSlices.map((slice) =>
        slice.id === "verification_pack_cardinality_contract"
          ? { ...slice, consumers:[{ packId:"shell", sliceId:"eligible_repair_admission" }] }
          : slice),
    } : pack),
  }), /exact verification_process task-batching consumer/u);
}

function verifyScenario196(packs) {
  const shellPlan = planVerification(packs, { packIds:["shell"], includeProperties:true });
  const keys = registryCardinalityFocusedTaskKeys(shellPlan);
  assert.ok(registryCardinalityEvidenceTaskKeys.every((key) => keys.includes(key)));
  assert.ok(keys.some((key) => key.startsWith("property:")));
  assert.ok(keys.includes("acceptance-session:shell"));
  assert.ok(keys.includes("package:extension"));
  assert.ok(keys.length < shellPlan.tasks.length);
}

function verifyScenario197(packs) {
  const current = createVerificationPackCardinalityAdapter(packs).runnablePackIds;
  assert.deepEqual(current, [...timeoutRepairPackIds].sort());
  const added = createVerificationPackCardinalityAdapter([...packs, syntheticPack("future-pack")])
    .runnablePackIds;
  assert.ok(added.includes("future-pack"));
  assert.equal(added.length, current.length + 1);
}

async function verifyScenario198(packs) {
  await verifyScenario193(packs);
  verifyScenario195(packs);
}

export async function verifyRegistryCardinalityAcceptance(scenario) {
  const packs = await loadVerificationPacks();
  if (scenario === "all") {
    await verifyScenario192(packs);
    await verifyScenario193(packs);
    await verifyScenario194(packs);
    verifyScenario195(packs);
    verifyScenario196(packs);
    verifyScenario197(packs);
    await verifyScenario198(packs);
  } else if (scenario === "192") await verifyScenario192(packs);
  else if (scenario === "193") await verifyScenario193(packs);
  else if (scenario === "194") await verifyScenario194(packs);
  else if (scenario === "195") verifyScenario195(packs);
  else if (scenario === "196") verifyScenario196(packs);
  else if (scenario === "197") verifyScenario197(packs);
  else if (scenario === "198") await verifyScenario198(packs);
  else throw new Error(`Unknown registry-cardinality acceptance scenario: ${scenario}`);
  return { scenario, status:"passed" };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifyRegistryCardinalityAcceptance(process.argv[2] ?? "all")
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
