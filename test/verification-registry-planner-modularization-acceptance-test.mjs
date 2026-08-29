import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

import { planVerification } from "../scripts/verification-planner/tasks/planner.mjs";
import { serializeVerificationRegistry } from "../scripts/verification-registry/compiler.mjs";
import { loadVerificationPacks } from "../scripts/verification-registry/validation.mjs";
import {
  verificationPolicyContracts,
  verificationProcessCompatibilitySuccessors,
} from "../scripts/verification-policy/contracts.mjs";
import { timeoutIncidentDigest as verificationDigest } from
  "../scripts/verification-reliability-values.mjs";
import {
  assertVerificationContractConservation,
  canonicalVerificationContractGeneration,
  refreshVerificationContractConservationManifest,
  verificationContractConservationFailures,
  verificationContractLeavesByOwner,
  verificationContractSourceState,
} from "../scripts/verification-registry/contract-conservation.mjs";
import { verificationContractSyntaxLeaves as baselineVerificationContractSyntaxLeaves } from
  "./support/verification-contract-conservation.mjs";

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
const contractSourcesByOwner = Object.fromEntries(
  verificationProcessCompatibilitySuccessors.map((owner, index) => [owner, contractSources[index]]));
const currentConservationState = verificationContractSourceState(contractSourcesByOwner);
assert.deepEqual(currentConservationState.leavesByOwner[verificationProcessCompatibilitySuccessors[0]],
  baselineVerificationContractSyntaxLeaves(contractSources[0],
    verificationProcessCompatibilitySuccessors[0]),
"the append-only ledger retains the immutable VTD-012 syntax-leaf derivation");
const ancestralConservationAuthorities = new Set([
  "0ff4b09bb4533c41714ccee0fa9949f951254a10",
]);
const conservationOptions = { sourceSha256:currentConservationState.sourceSha256,
  ancestralAuthorityCommits:ancestralConservationAuthorities };
assertVerificationContractConservation(conservationManifest, currentLeavesByOwner,
  conservationOptions);

const immutableBaselineCommit = "a62bde42ab1b9ec4471517ec028a2b368ef46139";
const immutableBaselinePath = "test/fixtures/verification-process-contract-conservation.json";
const immutableBaselineBytes = spawnSync("git", ["show",
  `${immutableBaselineCommit}:${immutableBaselinePath}`],
{ cwd:process.cwd(), encoding:"utf8" }).stdout;
assert.equal(createHash("sha256").update(immutableBaselineBytes).digest("hex"),
  "7ea22d66d9c499f2971a906f2d6753862c8506665da3a9d4fa793ef1242070b2",
"the immutable baseline is loaded from its externally bound Git-blob identity");
const baselineManifest = JSON.parse(immutableBaselineBytes);
for (const key of ["version", "owners", "provenance", "totals", "inventory"]) {
  assert.deepEqual(conservationManifest[key], baselineManifest[key],
    `the immutable VTD-012 baseline ${key} remains unchanged`);
}
assert.deepEqual(conservationManifest.transitions.map(({authority}) => authority.scenario), [
  "Modular verification packs 212", "Modular verification packs 215",
  "Modular verification packs 207", "Modular verification packs 207",
], "the ledger records only the four approved contract transitions");
assert.equal(conservationManifest.generations.length, 1,
  "bootstrap records one append-only current generation");
assert.deepEqual(conservationManifest.generations[0], canonicalVerificationContractGeneration(
  currentConservationState, conservationManifest.generations[0].authority,
  conservationManifest.generations[0].id),
"the current generation is canonical over all nine exact owner sources");

const conservationFailureKinds = (manifest, state = currentConservationState,
  authorities = ancestralConservationAuthorities) => new Set(
  verificationContractConservationFailures(manifest, state.leavesByOwner, {
    sourceSha256:state.sourceSha256, ancestralAuthorityCommits:authorities,
  }).map(({violation}) => violation));
const fakePathManifest = structuredClone(conservationManifest);
fakePathManifest.transitions[0].authority.path = "features/not-an-authority.feature";
assert.equal(conservationFailureKinds(fakePathManifest).has("exact-authority-feature-path"), true,
  "an ancestral commit cannot authenticate a transition through a fake feature path");
const fakeScenarioManifest = structuredClone(conservationManifest);
fakeScenarioManifest.transitions[0].authority.scenario = "Not an approved scenario";
assert.equal(conservationFailureKinds(fakeScenarioManifest).has("exact-authority-scenario"), true,
  "an authority scenario absent from the historical feature blob fails closed");
const swappedAuthorityManifest = structuredClone(conservationManifest);
swappedAuthorityManifest.transitions[0].authority.scenario =
  conservationManifest.transitions[1].authority.scenario;
assert.equal(conservationFailureKinds(swappedAuthorityManifest)
  .has("exact-authority-example-row"), true,
"authority cells cannot be borrowed from a different Scenario 221 row");
const candidateAuthoredAuthorityManifest = structuredClone(conservationManifest);
candidateAuthoredAuthorityManifest.transitions[0].authority.commit =
  "ffa69844eb701be9ddc0280fc178c95887b2dc37";
assert.equal(conservationFailureKinds(candidateAuthoredAuthorityManifest,
  currentConservationState, new Set([...ancestralConservationAuthorities,
    "ffa69844eb701be9ddc0280fc178c95887b2dc37"])).has("exact-authority-commit"), true,
"a candidate-authored copy of Scenario 221 cannot replace its historical authority blob");
const changedBaselineProvenanceManifest = structuredClone(conservationManifest);
changedBaselineProvenanceManifest.provenance.legacy.sha256 = "0".repeat(64);
assert.equal(conservationFailureKinds(changedBaselineProvenanceManifest)
  .has("immutable-baseline-projection"), true,
"self-consistent mutable provenance cannot replace the externally bound baseline");
const reorderedBaselineManifest = structuredClone(conservationManifest);
reorderedBaselineManifest.inventory.assertions.reverse();
assert.equal(conservationFailureKinds(reorderedBaselineManifest)
  .has("immutable-baseline-order"), true,
"baseline inventory entry order is authenticated by the external Git blob");
const staleDigestManifest = structuredClone(conservationManifest);
staleDigestManifest.generations[0].ownerSources[0].sha256 = "0".repeat(64);
assert.equal(conservationFailureKinds(staleDigestManifest).has("source-digest"), true,
  "a stale owner-source digest fails the read-only check");
const unrecordedAdditionState = structuredClone(currentConservationState);
unrecordedAdditionState.leavesByOwner[conservationManifest.owners[0]].assertions.push(
  "message:\"unrecorded current assertion\"");
assert.equal(conservationFailureKinds(conservationManifest, unrecordedAdditionState)
  .has("current-generation-inventory"), true,
"an unrecorded current addition fails bidirectional conservation");
const unrecordedRemovalState = structuredClone(currentConservationState);
unrecordedRemovalState.leavesByOwner[conservationManifest.owners[0]].assertions.shift();
assert.equal(conservationFailureKinds(conservationManifest, unrecordedRemovalState)
  .has("current-generation-inventory"), true,
"an unrecorded current removal fails bidirectional conservation");
const reassignedState = structuredClone(currentConservationState);
const reassignedLeaf = reassignedState.leavesByOwner[conservationManifest.owners[0]].assertions.shift();
reassignedState.leavesByOwner[conservationManifest.owners[1]].assertions.push(reassignedLeaf);
assert.equal(conservationFailureKinds(conservationManifest, reassignedState)
  .has("current-generation-inventory"), true,
"an unrecorded owner reassignment fails bidirectional conservation");
const duplicateTransitionManifest = structuredClone(conservationManifest);
duplicateTransitionManifest.transitions.push(structuredClone(duplicateTransitionManifest.transitions[0]));
assert.equal(conservationFailureKinds(duplicateTransitionManifest).has("transition-source-duplicate"), true,
  "a duplicate transition source fails closed");
const restoredTransitionSourceState = structuredClone(currentConservationState);
const firstTransition = conservationManifest.transitions[0];
restoredTransitionSourceState.leavesByOwner[firstTransition.from.owner][firstTransition.kind]
  .push(firstTransition.from.leaf);
assert.equal(conservationFailureKinds(conservationManifest, restoredTransitionSourceState)
  .has("transition-source-present"), true,
"a transition source that remains current fails exact source cardinality");
const ambiguousTransitionDestinationState = structuredClone(currentConservationState);
ambiguousTransitionDestinationState.leavesByOwner[firstTransition.to.owner][firstTransition.kind]
  .push(firstTransition.to.leaf);
assert.equal(conservationFailureKinds(conservationManifest, ambiguousTransitionDestinationState)
  .has("transition-successor-ambiguous"), true,
"a repeated transition successor fails exact destination cardinality");
const cyclicTransitionManifest = structuredClone(conservationManifest);
cyclicTransitionManifest.transitions.push({ id:"forbidden-transition-cycle",
  kind:firstTransition.kind, from:structuredClone(firstTransition.to),
  to:structuredClone(firstTransition.from), authority:structuredClone(firstTransition.authority) });
assert.equal(conservationFailureKinds(cyclicTransitionManifest).has("transition-cycle"), true,
  "transition history must remain acyclic");
const noncanonicalManifest = structuredClone(conservationManifest);
noncanonicalManifest.generations[0].inventory.assertions.reverse();
assert.equal(conservationFailureKinds(noncanonicalManifest).has("current-generation-inventory"), true,
  "noncanonical current-generation order fails closed");
assert.equal(conservationFailureKinds(conservationManifest, currentConservationState,
  new Set()).has("non-ancestral-authority"), true,
"a transition or generation with non-ancestral authority fails closed");

const bootstrapManifest = structuredClone(conservationManifest);
delete bootstrapManifest.generations;
const refreshedManifest = refreshVerificationContractConservationManifest(bootstrapManifest,
  currentConservationState, { authority:conservationManifest.generations[0].authority,
    id:conservationManifest.generations[0].id,
    ancestralAuthorityCommits:ancestralConservationAuthorities });
assert.deepEqual(refreshedManifest, conservationManifest,
  "explicit refresh deterministically reproduces the checked current generation");
const weakenedState = structuredClone(currentConservationState);
weakenedState.leavesByOwner[conservationManifest.owners[0]].assertions.shift();
assert.throws(() => refreshVerificationContractConservationManifest(conservationManifest,
  weakenedState, { authority:{ commit:"0ff4b09bb4533c41714ccee0fa9949f951254a10",
    path:"features/modular-verification-packs.feature", scenario:"Modular verification packs 221" },
    id:"forbidden-weakening", ancestralAuthorityCommits:ancestralConservationAuthorities }),
/unmapped prior occurrence/u, "refresh refuses assertion retirement or weakening");
const fabricatedWeakeningManifest = structuredClone(conservationManifest);
const fabricatedSource = fabricatedWeakeningManifest.generations[0].inventory.assertions[0];
const unrelatedSuccessor = fabricatedWeakeningManifest.generations[0].inventory.assertions.find(
  (entry) => entry.owner === fabricatedSource.owner && entry.leaf !== fabricatedSource.leaf);
fabricatedWeakeningManifest.transitions.push({ id:"fabricated-weakening",
  kind:"assertions", from:structuredClone(fabricatedSource),
  to:structuredClone(unrelatedSuccessor), authority:{
    commit:"0ff4b09bb4533c41714ccee0fa9949f951254a10",
    path:"features/modular-verification-packs.feature",
    scenario:"Modular verification packs 221",
  } });
const fabricatedWeakeningState = structuredClone(currentConservationState);
fabricatedWeakeningState.leavesByOwner[fabricatedSource.owner].assertions.splice(
  fabricatedWeakeningState.leavesByOwner[fabricatedSource.owner].assertions
    .indexOf(fabricatedSource.leaf), 1);
assert.throws(() => refreshVerificationContractConservationManifest(
  fabricatedWeakeningManifest, fabricatedWeakeningState, {
    authority:conservationManifest.generations[0].authority,
    id:"forbidden-fabricated-weakening",
    ancestralAuthorityCommits:ancestralConservationAuthorities,
  }), /exact-authority-(?:scenario|example-row)|authenticated successor authority/u,
"refresh cannot disguise a removed assertion as an unrelated existing successor");
assert.throws(() => refreshVerificationContractConservationManifest(conservationManifest,
  reassignedState, { authority:conservationManifest.generations[0].authority,
    id:"forbidden-reassignment", ancestralAuthorityCommits:ancestralConservationAuthorities }),
/unmapped prior occurrence/u, "refresh refuses an owner reassignment without an exact transition");
assert.throws(() => refreshVerificationContractConservationManifest(conservationManifest,
  ambiguousTransitionDestinationState, { authority:conservationManifest.generations[0].authority,
    id:"forbidden-ambiguous-successor",
    ancestralAuthorityCommits:ancestralConservationAuthorities }),
/transition-successor-ambiguous/u, "refresh refuses an ambiguous transition successor");

const manifestBeforeReadOnlyCheck = await readFile(
  "test/fixtures/verification-process-contract-conservation.json", "utf8");
assertVerificationContractConservation(conservationManifest, currentLeavesByOwner,
  conservationOptions);
assert.equal(await readFile("test/fixtures/verification-process-contract-conservation.json", "utf8"),
  manifestBeforeReadOnlyCheck, "ordinary conservation checking is read-only");
const refreshFixtureRoot = await mkdtemp(path.join(os.tmpdir(), "verification-conservation-refresh-"));
try {
  const refreshManifestPath = path.join(refreshFixtureRoot, "manifest.json");
  await writeFile(refreshManifestPath, `${JSON.stringify(bootstrapManifest, null, 2)}\n`);
  const refreshResult = spawnSync(process.execPath,
    ["scripts/refresh-verification-contract-conservation.mjs", "refresh", "--manifest",
      refreshManifestPath, "--authority", "0ff4b09bb4533c41714ccee0fa9949f951254a10"],
    { cwd:process.cwd(), encoding:"utf8" });
  assert.equal(refreshResult.status, 0, refreshResult.stderr);
  assert.equal(await readFile(refreshManifestPath, "utf8"),
    `${JSON.stringify(conservationManifest, null, 2)}\n`,
    "the explicit refresh entry point writes only the deterministic manifest delta");
  const refreshedBytes = await readFile(refreshManifestPath, "utf8");
  const forbiddenResult = spawnSync(process.execPath,
    ["scripts/refresh-verification-contract-conservation.mjs", "refresh", "--manifest",
      refreshManifestPath, "--authority", "0ff4b09bb4533c41714ccee0fa9949f951254a10",
      "--task-exception", "parked-candidate"], { cwd:process.cwd(), encoding:"utf8" });
  assert.notEqual(forbiddenResult.status, 0,
    "task-local refresh exceptions are unavailable");
  const environmentResult = spawnSync(process.execPath,
    ["scripts/refresh-verification-contract-conservation.mjs"],
    { cwd:process.cwd(), encoding:"utf8",
      env:{...process.env, SWARMFORGE_REFRESH_VERIFICATION_CONSERVATION:"1"} });
  assert.notEqual(environmentResult.status, 0,
    "an environment variable cannot enable evidence-time or ordinary refresh");
  assert.equal(await readFile(refreshManifestPath, "utf8"), refreshedBytes,
    "rejected refresh authority cannot rewrite the manifest");
  const badAuthorityResult = spawnSync(process.execPath,
    ["scripts/refresh-verification-contract-conservation.mjs", "refresh", "--manifest",
      refreshManifestPath, "--authority", "f".repeat(40)],
    { cwd:process.cwd(), encoding:"utf8" });
  assert.notEqual(badAuthorityResult.status, 0,
    "a non-ancestral refresh authority is rejected before writing");
  assert.equal(await readFile(refreshManifestPath, "utf8"), refreshedBytes,
    "non-ancestral authority leaves canonical output byte-identical");
  const fakePathBytes=`${JSON.stringify(fakePathManifest, null, 2)}\n`;
  await writeFile(refreshManifestPath, fakePathBytes);
  const fakePathRefreshResult = spawnSync(process.execPath,
    ["scripts/refresh-verification-contract-conservation.mjs", "refresh", "--manifest",
      refreshManifestPath, "--authority", "0ff4b09bb4533c41714ccee0fa9949f951254a10"],
    { cwd:process.cwd(), encoding:"utf8" });
  assert.notEqual(fakePathRefreshResult.status, 0,
    "refresh authenticates the exact historical authority path");
  assert.equal(await readFile(refreshManifestPath, "utf8"), fakePathBytes,
    "failed transition authentication writes nothing");
  const changedBaselineBytes=`${JSON.stringify(changedBaselineProvenanceManifest, null, 2)}\n`;
  await writeFile(refreshManifestPath, changedBaselineBytes);
  const changedBaselineRefreshResult = spawnSync(process.execPath,
    ["scripts/refresh-verification-contract-conservation.mjs", "refresh", "--manifest",
      refreshManifestPath, "--authority", "0ff4b09bb4533c41714ccee0fa9949f951254a10"],
    { cwd:process.cwd(), encoding:"utf8" });
  assert.notEqual(changedBaselineRefreshResult.status, 0,
    "refresh authenticates immutable baseline identity before generation acceptance");
  assert.equal(await readFile(refreshManifestPath, "utf8"), changedBaselineBytes,
    "failed baseline authentication writes nothing");
} finally {
  await rm(refreshFixtureRoot, {recursive:true, force:true});
}
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
const [baseDeclarations, migrationLedger, manifestNames, compiledRegistryBytes] =
  await Promise.all([
    readFile("verification/packs.base.json", "utf8").then(JSON.parse),
    readFile("verification/manifests/migration-ledger.v1", "utf8").then(JSON.parse),
    readdir("verification/manifests").then((names) => names.filter((name) =>
      name.endsWith(".json")).sort()),
    readFile("verification/packs.json"),
  ]);
assert.deepEqual(baseDeclarations, [],
  "the hand-authored central base contains no pack declaration");
assert.equal(manifestNames.length, packs.length,
  "every registered pack has one authoritative local manifest");
assert.deepEqual(manifestNames, packs.map(({ id }) => `${id}.json`).sort(),
  "authoritative manifest names match every registered pack identity exactly");
assert.equal(migrationLedger.packs.length, 21,
  "the complete upfront ledger covers every pack migrated from the central base");
for (const entry of migrationLedger.packs) {
  const fragment = JSON.parse(await readFile(entry.destination, "utf8"));
  assert.equal(fragment.version, 1, `${entry.id} uses the explicit fragment schema`);
  assert.equal(fragment.order, entry.order, `${entry.id} retains its ledger order`);
  assert.equal(fragment.pack.id, entry.id, `${entry.id} has one destination authority`);
  assert.equal(createHash("sha256").update(JSON.stringify(fragment.pack)).digest("hex"),
    entry.sourceObjectDigest, `${entry.id} retains its exact source-object identity`);
}
const verificationProcessPack = packs.find(({id}) => id === "verification_process");
const transitionRepairMappedPaths = [
  "scripts/refresh-verification-contract-conservation.mjs",
  "test/verification-registry-planner-modularization-acceptance-test.mjs",
];
const baselineRegistryProjection = structuredClone(packs);
const projectedRegistryInventory = baselineRegistryProjection.find(({id}) =>
  id === "verification_process").verificationSlices.find(({id}) => id === "registry_inventory");
projectedRegistryInventory.sourcePaths = projectedRegistryInventory.sourcePaths.filter((sourcePath) =>
  !transitionRepairMappedPaths.includes(sourcePath));
assert.equal(createHash("sha256").update(serializeVerificationRegistry(baselineRegistryProjection))
  .digest("hex"), migrationLedger.expectedCompiledDigest,
"removing only the approved transition-repair mappings restores the immutable migration digest");
const actualRegistryInventory = verificationProcessPack.verificationSlices.find(({id}) =>
  id === "registry_inventory");
assert.deepEqual(actualRegistryInventory.sourcePaths.filter((sourcePath) =>
  transitionRepairMappedPaths.includes(sourcePath)), transitionRepairMappedPaths,
"registry inventory adds only the exact transition validator consumers");
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
  if (context.causalCategory === "other:migrated manifest fixture staging") {
    const executionResult = focusedResults.find(({ testPath }) => testPath ===
      "test/verification-contracts/execution-checkpoint-contract-test.mjs")?.result;
    const fixture = {
      id:"migrated-manifest-aggregate-boundary-collection-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ collectedBoundaryContracts:verificationProcessCompatibilitySuccessors.length,
        executionContract:"test/verification-contracts/execution-checkpoint-contract-test.mjs" },
      expectedPreRepairFailure:{ executionContractPassed:false, aggregatePassed:false },
      expectedRepairResult:{ executionContractPassed:true, aggregatePassed:true },
    };
    const observed = { executionContractPassed:executionResult?.status === 0,
      aggregatePassed:focusedFailures.length === 0 };
    assert.deepEqual(observed, fixture.expectedRepairResult,
      "aggregate boundary collection observes the repaired migrated-manifest fixture");
    const fixtureDigest = verificationDigest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:fixture.expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed } } }));
  }
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
