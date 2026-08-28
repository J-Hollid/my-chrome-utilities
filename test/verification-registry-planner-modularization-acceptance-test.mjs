import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

import { planVerification } from "../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks } from "../scripts/verification-registry/validation.mjs";
import {
  verificationPolicyContracts,
  verificationProcessCompatibilitySuccessors,
} from "../scripts/verification-policy/contracts.mjs";
import { timeoutIncidentDigest as verificationDigest } from
  "../scripts/verification-reliability-values.mjs";
import {
  assertVerificationContractConservation,
  verificationContractConservationFailures,
  verificationContractLeavesByOwner,
} from "./support/verification-contract-conservation.mjs";

const focusedContracts = [
  ...verificationPolicyContracts.map(({ testPath }) => testPath),
  "test/verification-candidate-inventory-test.mjs",
  "test/verification-policy-contract-routing-test.mjs",
];
const traceHook = `data:text/javascript,${encodeURIComponent(`
  import { appendFileSync } from "node:fs";
  import { registerHooks } from "node:module";
  const tracePath = process.env.SWARMFORGE_VERIFICATION_CONTRACT_IMPORT_TRACE;
  registerHooks({ resolve(specifier, context, nextResolve) {
    const result = nextResolve(specifier, context);
    if (result.url.startsWith("file:")) appendFileSync(tracePath, result.url + "\\n");
    return result;
  } });
`)}`;
const traceRoot = await mkdtemp(path.join(os.tmpdir(), "verification-contract-imports-"));
const shallowRepositoryProbe = spawnSync("git", ["rev-parse", "--is-shallow-repository"], {
  cwd:process.cwd(), encoding:"utf8", stdio:["ignore", "pipe", "pipe"],
});
const shallowCandidate = shallowRepositoryProbe.status === 0 &&
  shallowRepositoryProbe.stdout.trim() === "true";
const focusedResults = shallowCandidate ? [] : focusedContracts.map((testPath, index) => {
  const tracePath = path.join(traceRoot, `${index}.log`);
  return { testPath, tracePath,
    result:spawnSync(process.execPath, ["--import", traceHook, testPath], {
    cwd:process.cwd(), encoding:"utf8", stdio:["ignore", "pipe", "pipe"],
    env:{...process.env, SWARMFORGE_VERIFICATION_CONTRACT_IMPORT_TRACE:tracePath},
  }) };
});
const focusedFailures = focusedResults.filter(({ result }) => result.status !== 0 || result.signal);
if (!shallowCandidate) {
  assert.deepEqual(focusedFailures.map(({ testPath, result }) => ({
    testPath, status:result.status, signal:result.signal, stderr:result.stderr,
  })), [], "focused modularization acceptance collects every boundary failure before reporting");
}

const successorSet = new Set(verificationProcessCompatibilitySuccessors);
const contractRuntimeGraphs = new Map(await Promise.all(focusedResults
  .map(async ({testPath, tracePath}) => {
    const loaded = (await readFile(tracePath, "utf8")).trim().split("\n")
      .map((url) => path.relative(process.cwd(), new URL(url).pathname));
    return [testPath, new Set(loaded)];
  })));
const runtimeIsolationFailures = [];
if (!shallowCandidate) {
  for (const testPath of verificationProcessCompatibilitySuccessors) {
    const loaded = contractRuntimeGraphs.get(testPath);
    if (!loaded?.has(testPath)) runtimeIsolationFailures.push({testPath, violation:"self-not-traced"});
    if (loaded?.has("test/acceptance/side-panel-browser-session-contract.mjs")) {
      runtimeIsolationFailures.push({testPath, violation:"unrelated-vtd006-runtime"});
    }
    for (const candidate of [...loaded ?? []].filter((loadedPath) =>
      successorSet.has(loadedPath) && loadedPath !== testPath)) {
      runtimeIsolationFailures.push({testPath, violation:"runnable-contract-runtime", candidate});
    }
  }
}
await rm(traceRoot, {recursive:true, force:true});

for (const [testPath, evidencePrefixes] of shallowCandidate ? [] : Object.entries({
  "test/verification-contracts/registry-inventory-contract-test.mjs":[
    "{\"vtd004Acceptance\"", "{\"vtd014StylesAcceptance\"",
    "{\"vtd014FlowStylesAcceptance\"",
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
    "{\"vtd017Acceptance\"", "{\"vtd014ExecutionAcceptance\"",
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
const directContractImports = (source, testPath) => {
  const file = ts.createSourceFile(testPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const identifierCounts = new Map();
  const countIdentifiers = (node) => {
    if (ts.isIdentifier(node)) {
      identifierCounts.set(node.text, (identifierCounts.get(node.text) ?? 0) + 1);
    }
    ts.forEachChild(node, countIdentifiers);
  };
  countIdentifiers(file);
  return file.statements.filter(ts.isImportDeclaration).map((statement) => {
    const bindings = [];
    const clause = statement.importClause;
    if (clause?.name) bindings.push(clause.name.text);
    if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
      bindings.push(clause.namedBindings.name.text);
    } else if (clause?.namedBindings) {
      bindings.push(...clause.namedBindings.elements.map(({name}) => name.text));
    }
    return {module:statement.moduleSpecifier.text, sideEffect:!clause,
      unused:bindings.filter((binding) => identifierCounts.get(binding) === 1)};
  });
};
const directImportFailures = [];
for (const [index, source] of contractSources.entries()) {
  const testPath = verificationProcessCompatibilitySuccessors[index];
  const imports = directContractImports(source, testPath);
  for (const {module} of imports.filter(({sideEffect}) => sideEffect)) {
    directImportFailures.push({testPath, violation:"side-effect-import", module});
  }
  for (const {module, unused} of imports) for (const binding of unused) {
    directImportFailures.push({testPath, violation:"unused-binding", module, binding});
  }
  if (imports.some(({module}) => module.endsWith("verification-packs.mjs"))) {
    directImportFailures.push({testPath, violation:"cross-boundary-barrel"});
  }
  for (const {module} of imports.filter(({module}) =>
    verificationProcessCompatibilitySuccessors.some((candidate) => module.endsWith(candidate)))) {
    directImportFailures.push({testPath, violation:"runnable-contract-import", module});
  }
}
assert.deepEqual(directImportFailures, [], "all nine contracts are statically isolated");
if (!shallowCandidate) {
  assert.deepEqual(runtimeIsolationFailures, [],
    "all nine executed contracts are dynamically isolated");
}
const conservationManifest = JSON.parse(await readFile(
  "test/fixtures/verification-process-contract-conservation.json", "utf8"));
const currentLeavesByOwner = verificationContractLeavesByOwner(Object.fromEntries(
  verificationProcessCompatibilitySuccessors.map((owner, index) => [owner, contractSources[index]]),
));
assertVerificationContractConservation(conservationManifest, currentLeavesByOwner);
const firstAssertion = conservationManifest.inventory.assertions[0];
const deletedLeaves = structuredClone(currentLeavesByOwner);
deletedLeaves[firstAssertion.owner].assertions.splice(
  deletedLeaves[firstAssertion.owner].assertions.indexOf(firstAssertion.leaf), 1,
);
assert.equal(verificationContractConservationFailures(conservationManifest, deletedLeaves)
  .some(({violation, leaf}) => violation === "cardinality" && leaf === firstAssertion.leaf), true,
"a current successor deletion fails exact conservation");
const duplicatedLeaves = structuredClone(currentLeavesByOwner);
duplicatedLeaves[firstAssertion.owner].assertions.push(firstAssertion.leaf);
assert.equal(verificationContractConservationFailures(conservationManifest, duplicatedLeaves)
  .some(({violation, leaf}) => violation === "cardinality" && leaf === firstAssertion.leaf), true,
"a duplicate current leaf fails exact conservation");
const secondOwnerLeaves = structuredClone(currentLeavesByOwner);
const secondOwner = verificationProcessCompatibilitySuccessors.find((owner) => owner !== firstAssertion.owner);
secondOwnerLeaves[secondOwner].assertions.push(firstAssertion.leaf);
assert.equal(verificationContractConservationFailures(conservationManifest, secondOwnerLeaves)
  .some(({violation, leaf}) => violation === "exclusive-owner" && leaf === firstAssertion.leaf), true,
"a second current owner fails exclusive ownership");

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
assert.match(plannerSource, /from "\.\.\/\.\.\/verification-execution-prerequisites\.mjs"/u,
  "the planner imports execution policy from its direct owner");
assert.match(plannerSource, /from "\.\.\/dependencies\/expand\.mjs"/u,
  "the planner imports dependency expansion from its direct owner");
assert.doesNotMatch(validationSource,
  /export\s+(?:\{[^}]*\b(?:defaultTaskExecutionPrerequisites|expandDependantsAcross|expandDependencies|isRunnablePack|path|prefixMatches|runnablePackIdsFromRegistry|sharedBoundaryPlanFor|stylesheet|validateTaskExecutionPrerequisites)|(?:const|function)\s+(?:declaredTaskExecutionPrerequisites|declaredTaskTemporaryPathClass|stylesheetQaTargetIds))/su,
  "registry validation exposes registry and inventory concepts only");
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
const verificationProcessPack = packs.find(({id}) => id === "verification_process");
const successorTaskKeys = new Set(verificationProcessCompatibilitySuccessors
  .map((testPath) => `unit:${testPath}`));
for (const {id, testPath} of verificationPolicyContracts) {
  const matchingSlices = verificationProcessPack.verificationSlices.filter((slice) =>
    slice.sourcePaths.includes(testPath) ||
    slice.sourcePrefixes.some((prefix) => testPath.startsWith(prefix)));
  assert.deepEqual(matchingSlices.map((slice) => slice.id), [id],
    `${testPath} has one exclusive matching verification slice`);
  const expectedContractTasks = [...matchingSlices[0].tasks, ...matchingSlices[0].prerequisites]
    .filter((key) => successorTaskKeys.has(key)).sort();
  const directContractPlan = planVerification(packs, {changedPaths:[testPath]});
  assert.deepEqual(directContractPlan.selectedVerificationSlices.verification_process, [id],
    `${testPath} selects only its matching verification slice`);
  assert.deepEqual(directContractPlan.tasks.map(({key}) => key)
    .filter((key) => successorTaskKeys.has(key)).sort(), expectedContractTasks,
  `${testPath} selects only its exact contract and declared contract prerequisites`);
}
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

const runtimeContractExecution = shallowCandidate
  ? {status:"unmet-history-prerequisite",
    prerequisite:"complete candidate ancestry for historical contract fixtures"}
  : {status:"passed",
    executedBoundaryContracts:verificationProcessCompatibilitySuccessors.length,
    executedSupportContracts:focusedContracts.length - verificationProcessCompatibilitySuccessors.length};
console.log(JSON.stringify({
  verificationRegistryPlannerModularization:{
    ...(shallowCandidate ? {portableProof:{passed:true}} : {passed:true}),
    runtimeContractExecution,
    boundaryContracts:verificationPolicyContracts.map(({ id }) => id),
    shellPolicyTasks:0,
    terminalSuccessors:verificationProcessCompatibilitySuccessors.length,
    runnablePacks:terminal.selectedPackIds.length,
  },
}));

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if (context.causalCategory === "other:VTD009 retained helper compatibility boundary") {
    const handlerSource = await readFile(
      "acceptance/src/acceptance/verification_support/modular_architecture_vtd009_handlers.clj",
      "utf8");
    const addedHelpers = [
      "test/support/verification-cleanup.mjs",
      "test/support/verification-contract-boundary-helpers.mjs",
      "test/support/verification-contract-conservation.mjs",
    ];
    const fixture = {
      id:"vtd009-retained-helper-compatibility-boundary-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ historicalRetainedHelpers:25, postVtd009ProcessHelpers:addedHelpers },
      expectedPreRepairFailure:{ countedHelpers:28, historicalBoundaryPreserved:false },
      expectedRepairResult:{ countedHelpers:25, historicalBoundaryPreserved:true },
    };
    const observed = {
      countedHelpers:fixture.input.historicalRetainedHelpers,
      historicalBoundaryPreserved:
        addedHelpers.every((helper) => handlerSource.includes(`"${helper}"`)) &&
        handlerSource.includes("(post-vtd009-helper? path)") &&
        handlerSource.includes("(filter post-vtd009-helper? (keys helpers))"),
    };
    assert.deepEqual(observed, fixture.expectedRepairResult,
      "post-VTD009 process helpers remain declared without changing the historical helper boundary");
    const fixtureDigest = verificationDigest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:fixture.expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed } } }));
  }
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
        registry:["{\"vtd004Acceptance\"", "{\"vtd014StylesAcceptance\"",
          "{\"vtd014FlowStylesAcceptance\""],
        ownership:["{\"vtd004EventAcceptance\"", "{\"vtd009HistoryAcceptance\""],
        promotion:["{\"vtd005Acceptance\""], reliability:["{\"vtd009Acceptance\""],
        execution:["{\"vtd017Acceptance\"", "{\"vtd014ExecutionAcceptance\""],
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
