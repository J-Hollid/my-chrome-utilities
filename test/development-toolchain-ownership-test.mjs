import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {loadVerificationPacks, planVerification} from "../scripts/verification-packs.mjs";
import {loadGranularityDispositions} from "../scripts/verification-granularity-dispositions.mjs";
import {intentOwnershipReadiness} from "../scripts/verification-ownership-readiness-core.mjs";
import {timeoutIncidentDigest} from "../scripts/verification-reliability-values.mjs";

execFileSync("bb", ["-e", `
  (require '[acceptance.pack-runtime :as packs]
           '[acceptance.steps.serena-toolchain-preparation :as serena])
  (let [text "the optional development-tool boundary is separate from core runtime authority"
        world {:acceptance/feature-name "Serena toolchain ownership preparation"}
        selected (first (filter #(and (re-matches (:pattern %) text)
                                      (or (nil? (:applies? %)) ((:applies? %) world)))
                                (packs/handlers-for-feature (first serena/feature-files))))]
    (assert (some #{selected} serena/handlers)
            "The registered Serena handler must execute before general handlers"))
`], {encoding:"utf8"});

const packs = await loadVerificationPacks();
const shell = packs.find(({id}) => id === "shell");
const slice = shell.verificationSlices.find(({id}) => id === "development_toolchain");
assert.ok(slice, "the optional boundary requires a declared slice");
const stylePrerequisite = "unit:test/verification-contracts/registry-style-boundary-contract-test.mjs";
const repairPaths = ["features/serena-toolchain-ownership-preparation.feature",
  "features/calibration-receipt-independence.feature"];
const missingStyle = registry => ({missingStyle:!planVerification(registry,
  {changedPaths:repairPaths,includeProperties:true}).tasks.some(({key}) => key === stylePrerequisite)});
const failedRegistry = JSON.parse(execFileSync("git", ["show",
  "aa51def7f5691168a1f5137c45160b773e69da1e:verification/packs.json"], {encoding:"utf8"}));
const beforeRepair = missingStyle(failedRegistry);
const afterRepair = missingStyle(packs);
assert.deepEqual(beforeRepair, {missingStyle:true});
assert.deepEqual(afterRepair, {missingStyle:false},
  "the preparation must supply stylesheet evidence before settled acceptance");
if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const fixture = {id:"serena-settled-acceptance-prerequisite-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    input:{paths:repairPaths,requiredTask:stylePrerequisite,failedCandidate:"aa51def7f5"},
    expectedPreRepairFailure:{missingStyle:true},expectedRepairResult:{missingStyle:false}};
  const fixtureDigest = timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:beforeRepair},
    repairResult:{status:"passed",fixtureDigest,observed:afterRepair}}}));
}
assert.deepEqual(slice.consumers, [{packId:"shell", sliceId:"swarmforge-handoff-control"}]);
const paths = ["swarmforge/toolchain/dispatch.mjs", "swarmforge/toolchain/optional-tools.lock.json"];
for (const source of paths) {
  const plan = planVerification(packs, {changedPaths:[source], includeProperties:true});
  assert.deepEqual(new Set(plan.packIds), new Set(["shell", "verification_process"]));
  assert.ok(plan.selectedVerificationSlices.shell.includes(slice.id));
  assert.ok(plan.selectedVerificationSlices.shell.includes("swarmforge-handoff-control"));
  const tasks = new Set(plan.tasks.map(({key}) => key));
  for (const key of slice.tasks) assert.ok(tasks.has(key), `${source} must select ${key}`);
  assert.ok(tasks.has("unit:test/swarmforge-process-contract-test.mjs"));
  assert.ok(tasks.has("unit:test/development-toolchain-runtime-test.mjs"));
  assert.ok(plan.propertyTasks.length > 0, "consumer properties must remain selected");
}
const original = "f338e511090712038e2f789a927a1514293e8000";
const corePaths = ["scripts/check-swarmforge-toolchain.mjs", "swarmforge/toolchain.lock.json"];
for (const source of corePaths) {
  assert.ok(shell.globalImpact.includes(source));
  const atBase = execFileSync("git", ["show", `${original}:${source}`]);
  assert.deepEqual(await readFile(source), atBase, `${source} must remain byte-identical`);
  assert.deepEqual(planVerification(packs, {changedPaths:[source]}).packIds,
    planVerification(packs, {terminalFull:true}).packIds);
  const readiness = await intentOwnershipReadiness({packs, intent:{version:1, baseCommit:original,
    task:"serena-development-pilot", approvedPackIds:["shell", "verification_process"],
    likelyPaths:[source], proposedPrefixes:[]}});
  assert.equal(readiness.classification, "genuinely-global");
}
const dispositions = (await loadGranularityDispositions()).dispositions
  .filter(({task}) => task === "serena-development-pilot");
assert.deepEqual(new Set(dispositions.map(({path}) => path)), new Set(corePaths));
assert.ok(dispositions.every(({decision, replacementPaths}) => decision === "integrated-seam" &&
  replacementPaths.length > 0 && replacementPaths.every((p) => p.startsWith("swarmforge/toolchain/"))));

// A newly added slice cannot remove checks from the historical parent range.
const base = structuredClone(packs);
base.find(({id}) => id === "shell").verificationSlices = shell.verificationSlices
  .filter(({id}) => id !== slice.id);
const integrationPath = "swarmforge/constitution/articles/project.prompt";
const changeSet = {version:1, baseCommit:"1".repeat(40), commit:"2".repeat(40),
  entries:[{status:"M",path:integrationPath},{status:"A",path:paths[0]}], paths:[integrationPath,paths[0]]};
const historical = planVerification(base, {changedPaths:[integrationPath], includeProperties:true});
const union = planVerification(packs, {changedPaths:changeSet.paths, changeSet, basePacks:base, includeProperties:true});
const keys = new Set(union.tasks.map(({key}) => key));
for (const {key} of historical.tasks) assert.ok(keys.has(key), `historical check retained: ${key}`);
const quarantine = planVerification(packs, {changedPaths:paths.slice(0,1), includeProperties:true,
  quarantinedSliceIds:["development_toolchain"]});
const parent = planVerification(base, {changedPaths:paths.slice(0,1), includeProperties:true});
assert.ok(quarantine.tasks.length >= parent.tasks.length);
console.log(JSON.stringify({developmentToolchainOwnership:{optionalPaths:paths,
  corePaths, preservedCore:true, exactConsumers:true, historicalUnion:true, quarantine:true,
  dispositions:dispositions.length}}));
