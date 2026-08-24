import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
import { canonicalRepairTaskIdentities } from
  "../scripts/verification-pack-cardinality/reliability-adapter.mjs";
import { timeoutRepairPackIds } from "../scripts/verification-reliability-values.mjs";
import { validateCanonicalMasterEvidenceRecord } from "../scripts/verification-evidence.mjs";
import {
  registryCardinalityFocusedTaskKeys,
  validateRegistryCardinalityFocusedEvidence,
} from "../scripts/verification-pack-cardinality/focused-evidence.mjs";

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

const canonicalAcceptanceIdentity={
  key:"acceptance-session:alpha",stage:"acceptance-session",packId:"alpha",executable:"bb",
  args:["acceptance-pack-runner","alpha","generated/a.clj","ir/a.json","generated/b.clj","ir/b.json"],
  target:"features/a.feature,features/b.feature",environment:null,requiredCapabilities:[],
};
const failedAcceptanceShard={...canonicalAcceptanceIdentity,
  args:["acceptance-pack-runner","alpha","generated/b.clj","ir/b.json"],
  target:"features/b.feature",
};
const shardIncident={failure:{task:failedAcceptanceShard,retryScope:{kind:"task",
  taskKey:failedAcceptanceShard.key,executionArgs:[...failedAcceptanceShard.args]}}};
assert.deepEqual(canonicalRepairTaskIdentities(twoPackRegistry, {
  planVerification:()=>({tasks:[canonicalAcceptanceIdentity]}),verificationTaskIdentity:value=>value,
  incident:shardIncident,
}),[failedAcceptanceShard],
"a receipt-bound acceptance shard remains the governed repair identity");
assert.deepEqual(canonicalRepairTaskIdentities(twoPackRegistry, {
  planVerification:()=>({tasks:[canonicalAcceptanceIdentity]}),verificationTaskIdentity:value=>value,
  incident:{failure:{task:{...failedAcceptanceShard,args:["acceptance-pack-runner","alpha","other.clj","other.json"]},
    retryScope:shardIncident.failure.retryScope}},
}),[canonicalAcceptanceIdentity],
"an unregistered or retry-mismatched acceptance shard cannot replace the canonical identity");
if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION),
    normalize=value=>Array.isArray(value)?value.map(normalize):value&&typeof value==="object"
      ?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right))
        .map(([key,nested])=>[key,normalize(nested)])):value,
    digest=value=>createHash("sha256").update(JSON.stringify(normalize(value))).digest("hex");
  let expectedPreRepairFailure,expectedRepairResult,repairResult,fixture;
  if(context.causalCategory==="other:layered owner evidence cardinality"){
    const registry=JSON.parse(await readFile(new URL("../verification/packs.json",import.meta.url),"utf8")),
      plan=planVerification(registry,{packIds:["layered_schema"],includeProperties:true}),
      helperPaths=registry.find(({id})=>id==="shell").verificationHelpers.map(({path})=>path),
      retainedHelpers=helperPaths.filter(path=>
        path==="test/support/browser-observation-control.mjs"||
        !path.startsWith("test/support/side-panel-")).length-1,
      trackedSupportHelpers=helperPaths.filter(path=>path.startsWith("test/support/")&&
        path!=="test/support/browser-observation-control.mjs"&&
        !path.startsWith("test/support/side-panel-")).length;
    expectedPreRepairFailure={unitTasks:20,totalTasks:53,retainedHelpers:22,trackedSupportHelpers:21};
    expectedRepairResult={unitTasks:21,totalTasks:54,retainedHelpers:23,trackedSupportHelpers:22};
    repairResult={unitTasks:plan.unitTasks.length,totalTasks:plan.tasks.length,
      retainedHelpers,trackedSupportHelpers};
    fixture={id:"layered-owner-evidence-cardinality-v1",causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{registeredProbeTest:"test/layered-schema-policy-probe-contract-test.mjs"},
      expectedPreRepairFailure,expectedRepairResult};
  }else{
    expectedPreRepairFailure={receiptBoundShardSelected:false,retryScopeConserved:false};
    expectedRepairResult={receiptBoundShardSelected:true,retryScopeConserved:true};
    const selected=canonicalRepairTaskIdentities(twoPackRegistry,{
      planVerification:()=>({tasks:[canonicalAcceptanceIdentity]}),verificationTaskIdentity:value=>value,
      incident:shardIncident,
    })[0];
    repairResult={receiptBoundShardSelected:selected.target===failedAcceptanceShard.target,
      retryScopeConserved:JSON.stringify(selected.args)===JSON.stringify(shardIncident.failure.retryScope.executionArgs)};
    fixture={id:"acceptance-session-receipt-shard-identity-v1",causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{canonicalTarget:canonicalAcceptanceIdentity.target,failedTarget:failedAcceptanceShard.target},
      expectedPreRepairFailure,expectedRepairResult};
  }
  const fixtureDigest=digest(fixture);
  assert.deepEqual(repairResult,expectedRepairResult);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}}}));
}

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
  "unit:scripts/verification-pack-cardinality/acceptance.mjs",
  "unit:test/verification-pack-cardinality-contract-test.mjs",
  "unit:test/settled-final-verification-workflow-test.mjs",
  "unit:test/verification-evidence-production-path-test.mjs",
  "unit:test/verification-process-contract-test.mjs",
], "the slice declares only the exact named cardinality evidence tasks");
const focusedCardinalityKeys = registryCardinalityFocusedTaskKeys(
  planVerification(currentRegistry, { packIds:["shell"], includeProperties:true }));
assert.ok(focusedCardinalityKeys.includes("acceptance-session:shell"),
  "the specification-bound focused plan includes its registered Gherkin acceptance session");
const focusedEvidenceInput = {
  task:"registry-derived-verification-packs",
  candidateRegistry:currentRegistry,
  changedPaths:["scripts/verification-pack-cardinality/contract.mjs"],
  taskKeys:focusedCardinalityKeys,
  syntheticProofs:{ current:true, addedRunnable:true, emptyCompatibility:true },
  includeProperties:true,
  includePackage:true,
  terminalFull:false,
};
assert.equal(validateRegistryCardinalityFocusedEvidence(focusedEvidenceInput).mode,
  "registry-cardinality-focused",
"the exact candidate registry satisfies slice-only ownership preflight");
assert.throws(() => validateRegistryCardinalityFocusedEvidence({
  ...focusedEvidenceInput,
  taskKeys:focusedEvidenceInput.taskKeys.filter((key) => key !== "acceptance-session:shell"),
}), /Shell acceptance session/u,
"focused evidence cannot omit registered Gherkin acceptance");
assert.throws(() => validateRegistryCardinalityFocusedEvidence({
  ...focusedEvidenceInput,
  candidateRegistry:currentRegistry.map((pack) => pack.id === "shell"
    ? { ...pack, globalImpact:[...pack.globalImpact, "scripts/verification-pack-cardinality/"] }
    : pack),
}), /globally impactful/u,
"restoring cardinality global impact fails before focused evidence");
assert.throws(() => validateRegistryCardinalityFocusedEvidence({
  ...focusedEvidenceInput,
  candidateRegistry:currentRegistry.map((pack) => pack.id === "shell" ? {
    ...pack,
    verificationSlices:pack.verificationSlices.map((slice) =>
      slice.id === "verification_pack_cardinality_contract"
        ? { ...slice, consumers:[{ packId:"shell", sliceId:"eligible_repair_admission" }] }
        : slice),
  } : pack),
}), /empty registry consumer set/u,
"a cardinality registry consumer fails before focused evidence");
assert.equal(shellPack.globalImpact.includes("scripts/verification-pack-cardinality/"), false,
  "the bounded cardinality prefix is not also registered as globally impactful");
assert.deepEqual(await dispatchedPackIds(currentRegistry),
  [...planVerification(currentRegistry, { terminalFull:true }).selectedPackIds].sort(),
  "the current exact registry dispatches one synthetic representative per runnable identity");
assert.deepEqual(timeoutRepairPackIds,
  [...planVerification(currentRegistry, { terminalFull:true }).selectedPackIds].sort(),
  "reliability closure derives its pack set from the current registry");

console.log("verification pack cardinality contract tests passed");
