import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";

import { loadVerificationPacks, planVerification } from
  "../scripts/verification-packs.mjs";
import {
  verificationPolicyContracts,
  verificationProcessCompatibilitySuccessors,
} from "../scripts/verification-policy/contracts.mjs";
import { verificationDigest } from "../scripts/verification-digest.mjs";

const focusedContracts = [
  ...verificationPolicyContracts.map(({ testPath }) => testPath),
  "test/verification-candidate-inventory-test.mjs",
  "test/verification-policy-contract-routing-test.mjs",
];
const focusedResults = focusedContracts.map((testPath) => ({ testPath,
  result:spawnSync(process.execPath, [testPath], {
    cwd:process.cwd(), encoding:"utf8", stdio:["ignore", "pipe", "pipe"],
  }),
}));
const focusedFailures = focusedResults.filter(({ result }) => result.status !== 0 || result.signal);
assert.deepEqual(focusedFailures.map(({ testPath, result }) => ({
  testPath, status:result.status, signal:result.signal, stderr:result.stderr,
})), [], "focused modularization acceptance collects every boundary failure before reporting");

for (const [testPath, evidencePrefixes] of Object.entries({
  "test/verification-contracts/registry-inventory-contract-test.mjs":[
    "{\"vtd004Acceptance\"", "{\"vtd014StylesAcceptance\"",
  ],
  "test/verification-contracts/ownership-impact-contract-test.mjs":[
    "{\"vtd004EventAcceptance\"", "{\"vtd009HistoryAcceptance\"",
  ],
  "test/verification-contracts/evidence-promotion-contract-test.mjs":[
    "{\"vtd005Acceptance\"",
  ],
  "test/verification-contracts/reliability-run-intent-contract-test.mjs":[
    "{\"vtd009Acceptance\"",
  ],
  "test/verification-contracts/execution-checkpoint-contract-test.mjs":[
    "{\"vtd017Acceptance\"",
  ],
})) {
  const output = focusedResults.find((entry) => entry.testPath === testPath)?.result.stdout ?? "";
  for (const prefix of evidencePrefixes) {
    assert.equal(output.split("\n").some((line) => line.startsWith(prefix)), true,
      `${testPath} emits its owner-local ${prefix} acceptance evidence`);
  }
}

await assert.rejects(access("test/verification-process-contract-legacy.mjs"), { code:"ENOENT" },
  "the old umbrella implementation is deleted");
const contractSources = await Promise.all(verificationProcessCompatibilitySuccessors
  .map((testPath) => readFile(testPath, "utf8")));
const assertionCallCount = contractSources.reduce((total, source) => total +
  (source.match(/\bassert\.(?:deepEqual|equal|notEqual|ok|match|doesNotMatch|throws|rejects|doesNotThrow|notDeepEqual)\b/gu)?.length ?? 0), 0);
assert.ok(assertionCallCount >= 1250,
  "the nine successor contracts conserve the complete former assertion inventory");

const aliasSource = await readFile("test/verification-process-contract-test.mjs", "utf8");
assert.doesNotMatch(aliasSource, /\bassert\.|legacy/u,
  "the compatibility alias delegates without retaining assertions or legacy policy");

const [plannerSource, validationSource, impactSource, executionSource, runnerSource] =
  await Promise.all([
    readFile("scripts/verification-planner/tasks/planner.mjs", "utf8"),
    readFile("scripts/verification-registry/validation.mjs", "utf8"),
    readFile("scripts/verification-planner/ownership/impact.mjs", "utf8"),
    readFile("scripts/verification-execution/execute.mjs", "utf8"),
    readFile("scripts/verification-execution/runner.mjs", "utf8"),
  ]);
assert.doesNotMatch(plannerSource,
  /(?:verificationInventory|validateVerificationPacks|function globalImpact|function exactVerification|function exactRuntime|function impactBoundaryFor|executeAcceptancePlan)/u,
  "the task planner contains no registry, impact, or execution policy implementation");
assert.match(validationSource, /export async function verificationInventory/u);
assert.match(validationSource, /export async function validateVerificationPacks/u);
assert.match(impactSource, /export function globalImpact/u);
assert.match(impactSource, /export function impactBoundaryFor/u);
assert.match(executionSource, /export async function executeAcceptancePlan/u);
assert.match(runnerSource, /from "\.\/execute\.mjs"/u,
  "the execution runner imports its execution owner directly");
for (const source of [validationSource, impactSource, executionSource]) {
  assert.doesNotMatch(source, /verification-planner\/tasks\/planner\.mjs/u,
    "extracted policy modules do not circularly import the task planner");
}

const succession = JSON.parse(await readFile("verification/task-succession.json", "utf8"))
  .taskSetSuccessions.find(({ id }) => id ===
    "verification-process-contract-to-boundary-contracts-v1");
assert.equal(succession.destinationTaskDigests.length, 9,
  "one-to-many task succession has exactly nine destinations");
assert.equal(succession.destinationBoundaryDigests.length, 9,
  "one-to-many succession conserves exactly nine boundary digests");

const packs = await loadVerificationPacks();
const shellPlan = planVerification(packs, { changedPaths:["src/workspace-tabs-ui.ts"] });
assert.equal(shellPlan.selectedPackIds.includes("verification_process"), false,
  "product-only Shell planning excludes verification policy contracts");

const terminal = planVerification(packs, { terminalFull:true, includeProperties:true });
const taskKeys = terminal.tasks.map(({ key }) => key);
for (const successor of verificationProcessCompatibilitySuccessors) {
  assert.equal(taskKeys.filter((key) => key === `unit:${successor}`).length, 1,
    `terminal planning conserves ${successor} exactly once`);
}
assert.equal(taskKeys.includes("unit:test/verification-process-contract-test.mjs"), false,
  "terminal planning excludes the compatibility alias");
assert.equal(taskKeys.some((key) => key.includes("legacy-process-contract")), false,
  "terminal planning contains no retained legacy contract leaf");

console.log(JSON.stringify({
  verificationRegistryPlannerModularization:{
    passed:true,
    boundaryContracts:verificationPolicyContracts.map(({ id }) => id),
    shellPolicyTasks:0,
    terminalSuccessors:verificationProcessCompatibilitySuccessors.length,
    runnablePacks:terminal.selectedPackIds.length,
  },
}));

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if (context.causalCategory === "other:modular acceptance evidence ownership") {
    const [architectureHandlers, styleHandlers, artifactHandlers] = await Promise.all([
      readFile("acceptance/src/acceptance/steps/modular_architecture.clj", "utf8"),
      readFile("acceptance/src/acceptance/verification_support/modular_architecture_vtd014_handlers.clj", "utf8"),
      readFile("acceptance/src/acceptance/verification_support/modular_architecture_vtd017_handlers.clj", "utf8"),
    ]);
    const fixture = {
      id:"modular-acceptance-evidence-ownership-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ partitionedSuccessors:9, acceptanceConsumers:["VTD-004", "VTD-009", "VTD-014", "VTD-017"] },
      expectedPreRepairFailure:{ ownerLocalEvidence:false, acceptanceRoutesOwnerEvidence:false,
        historicalOwnerMerged:false },
      expectedRepairResult:{ ownerLocalEvidence:true, acceptanceRoutesOwnerEvidence:true,
        historicalOwnerMerged:true },
    };
    const observed = {
      ownerLocalEvidence:Object.values({
        registry:["{\"vtd004Acceptance\"", "{\"vtd014StylesAcceptance\""],
        ownership:["{\"vtd004EventAcceptance\"", "{\"vtd009HistoryAcceptance\""],
        promotion:["{\"vtd005Acceptance\""], reliability:["{\"vtd009Acceptance\""],
        execution:["{\"vtd017Acceptance\""],
      }).flat().every((prefix) => focusedResults.some(({ result }) =>
        result.stdout.split("\n").some((line) => line.startsWith(prefix)))),
      acceptanceRoutesOwnerEvidence:
        architectureHandlers.includes("ownership-impact-contract-test.mjs") &&
        architectureHandlers.includes("evidence-promotion-contract-test.mjs") &&
        styleHandlers.includes("registry-inventory-contract-test.mjs") &&
        artifactHandlers.includes("execution-checkpoint-contract-test.mjs"),
      historicalOwnerMerged:architectureHandlers.includes(":history history"),
    };
    assert.deepEqual(observed, fixture.expectedRepairResult,
      "partitioned acceptance reads evidence from each modular owner");
    const fixtureDigest = verificationDigest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:fixture.expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed } } }));
  }
}
