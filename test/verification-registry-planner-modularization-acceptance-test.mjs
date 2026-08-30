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
  resolveVerificationContractAuthorityPopulation,
  verificationContractConservationFailures,
  verificationContractLeavesByOwner,
  verificationContractSourceState,
} from "../scripts/verification-registry/contract-conservation.mjs";
import { verificationContractSyntaxLeaves as baselineVerificationContractSyntaxLeaves } from
  "./support/verification-contract-conservation.mjs";

const conservationRuntimeSource = await readFile(
  "scripts/verification-registry/contract-conservation.mjs", "utf8");
const conservationRuntimeFile = ts.createSourceFile(
  "scripts/verification-registry/contract-conservation.mjs", conservationRuntimeSource,
  ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const conservationRuntimeImports = conservationRuntimeFile.statements
  .filter(ts.isImportDeclaration)
  .map(({moduleSpecifier}) => moduleSpecifier.text);
assert.equal(conservationRuntimeImports.some((specifier) => specifier.includes("test/support")), false,
  "the runtime conservation boundary owns its parser instead of depending on test support");

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
const conservationAuthorityPopulation = resolveVerificationContractAuthorityPopulation(
  conservationManifest);
const declaredAuthorityCommits = (manifest) => [...new Set([
  ...manifest.transitions.map(({authority}) => authority.commit),
  ...manifest.generations.map(({authority}) => authority.commit),
])].sort();
assert.deepEqual(conservationAuthorityPopulation.commits,
  declaredAuthorityCommits(conservationManifest),
"the production resolver derives the complete deterministic authority population");
const conservationOptions = { sourceSha256:currentConservationState.sourceSha256,
  authorityPopulation:conservationAuthorityPopulation };
assertVerificationContractConservation(conservationManifest, currentLeavesByOwner,
  conservationOptions);

const appendedGeneration = (manifest, commit, id) => ({
  ...structuredClone(manifest.generations.at(-1)), id,
  authority:{ commit, path:"features/modular-verification-packs.feature",
    scenario:"Modular verification packs 221" },
});
const manifestWithGeneration = (manifest, commit, id) => {
  const output = structuredClone(manifest);
  const existing = output.generations.filter(({authority}) => authority.commit === commit);
  assert.ok(existing.length <= 1, `generation authority ${commit} remains unique`);
  if (existing.length) assert.equal(existing[0].id, id,
    `generation authority ${commit} retains its exact identity`);
  else output.generations.push(appendedGeneration(output, commit, id));
  return output;
};
const twoAuthorityManifest = manifestWithGeneration(conservationManifest,
  "ffa69844eb701be9ddc0280fc178c95887b2dc37", "current-ffa69844eb");
assert.deepEqual(twoAuthorityManifest.generations.slice(0, conservationManifest.generations.length),
  conservationManifest.generations,
  "two-authority construction preserves the complete ordered generation prefix");
const twoAuthorityPopulation = resolveVerificationContractAuthorityPopulation(twoAuthorityManifest);
assert.deepEqual(twoAuthorityPopulation.commits, declaredAuthorityCommits(twoAuthorityManifest),
  "authority discovery returns every commit in the complete two-authority fixture history");
assert.equal(twoAuthorityPopulation.commits.includes(
  "ffa69844eb701be9ddc0280fc178c95887b2dc37"), true,
"authority discovery retains the named appended-generation commit");
assertVerificationContractConservation(twoAuthorityManifest, currentLeavesByOwner,
  {sourceSha256:currentConservationState.sourceSha256,
    authorityPopulation:twoAuthorityPopulation});
const laterAuthorityManifest = manifestWithGeneration(twoAuthorityManifest,
  "1ed6ec0d3f5a2f1fcf56824d214bc51112e7e853", "current-1ed6ec0d3f");
assert.deepEqual(laterAuthorityManifest.generations.slice(0, twoAuthorityManifest.generations.length),
  twoAuthorityManifest.generations,
  "later-authority construction preserves every earlier generation in order");
const laterAuthorityPopulation = resolveVerificationContractAuthorityPopulation(
  laterAuthorityManifest);
assert.deepEqual(laterAuthorityPopulation.commits,
  declaredAuthorityCommits(laterAuthorityManifest),
"a later valid generation is discovered without a consumer-local allowlist edit");
for (const commit of [
  "ffa69844eb701be9ddc0280fc178c95887b2dc37",
  "1ed6ec0d3f5a2f1fcf56824d214bc51112e7e853",
]) assert.equal(laterAuthorityPopulation.commits.includes(commit), true,
  `authority discovery retains named generation ${commit}`);
assertVerificationContractConservation(laterAuthorityManifest, currentLeavesByOwner,
  {sourceSha256:currentConservationState.sourceSha256,
    authorityPopulation:laterAuthorityPopulation});
const controlledNamedAuthorityManifest = structuredClone(conservationManifest);
controlledNamedAuthorityManifest.generations = [appendedGeneration(conservationManifest,
  "ffa69844eb701be9ddc0280fc178c95887b2dc37", "current-ffa69844eb")];
const controlledLaterAuthorityManifest = manifestWithGeneration(controlledNamedAuthorityManifest,
  "1ed6ec0d3f5a2f1fcf56824d214bc51112e7e853", "current-1ed6ec0d3f");
assert.deepEqual(controlledLaterAuthorityManifest.generations.map(({id}) => id),
  ["current-ffa69844eb", "current-1ed6ec0d3f"],
  "named refresh-route coverage uses a stable controlled generation prefix");
const truncatedAuthorityManifest = structuredClone(twoAuthorityManifest);
truncatedAuthorityManifest.generations = truncatedAuthorityManifest.generations.filter(
  ({authority}) => authority.commit !== "ffa69844eb701be9ddc0280fc178c95887b2dc37");
const truncatedAuthorityPopulation = resolveVerificationContractAuthorityPopulation(
  truncatedAuthorityManifest);
assert.equal(verificationContractConservationFailures(twoAuthorityManifest,
  currentLeavesByOwner, {sourceSha256:currentConservationState.sourceSha256,
    authorityPopulation:truncatedAuthorityPopulation})
  .some(({violation}) => violation === "authority-population-mismatch"), true,
"a production-derived population from a reduced prefix cannot authenticate a later generation");
assert.equal(verificationContractConservationFailures(conservationManifest,
  currentLeavesByOwner, {sourceSha256:currentConservationState.sourceSha256,
    authorityPopulation:{commits:["0ff4b09bb4533c41714ccee0fa9949f951254a10"]}})
  .some(({violation}) => violation === "unauthenticated-authority-population"), true,
"a caller-fabricated population cannot claim production authentication");
assert.equal(verificationContractConservationFailures(conservationManifest,
  currentLeavesByOwner, {sourceSha256:currentConservationState.sourceSha256,
    ancestralAuthorityCommits:new Set(["0ff4b09bb4533c41714ccee0fa9949f951254a10"])})
  .some(({violation}) => violation === "caller-supplied-authority-population"), true,
"the retired caller-supplied authority-set route fails closed");
const missingAuthorityManifest = structuredClone(conservationManifest);
delete missingAuthorityManifest.generations[0].authority.commit;
const missingAuthorityPopulation = resolveVerificationContractAuthorityPopulation(
  missingAuthorityManifest);
assert.equal(verificationContractConservationFailures(missingAuthorityManifest,
  currentLeavesByOwner, {sourceSha256:currentConservationState.sourceSha256,
    authorityPopulation:missingAuthorityPopulation})
  .some(({violation}) => violation === "missing-authority"), true,
"a missing generation authority is discovered and rejected before acceptance");
const unreadableAuthorityManifest = structuredClone(conservationManifest);
unreadableAuthorityManifest.generations[0].authority.commit = "e".repeat(40);
const unreadableAuthorityPopulation = resolveVerificationContractAuthorityPopulation(
  unreadableAuthorityManifest);
assert.equal(verificationContractConservationFailures(unreadableAuthorityManifest,
  currentLeavesByOwner, {sourceSha256:currentConservationState.sourceSha256,
    authorityPopulation:unreadableAuthorityPopulation})
  .some(({violation}) => violation === "unreadable-authority"), true,
"an unreadable derived authority fails before current-generation acceptance");
const assertedReadablePopulation = resolveVerificationContractAuthorityPopulation(
  unreadableAuthorityManifest,
  {testOnlyAncestryResolver:() => ({readable:true, ancestral:true})});
assert.equal(verificationContractConservationFailures(unreadableAuthorityManifest,
  currentLeavesByOwner, {sourceSha256:currentConservationState.sourceSha256,
    authorityPopulation:assertedReadablePopulation})
  .some(({violation}) => violation === "unreadable-authority"), true,
"the test seam cannot convert a caller-asserted commit into Git authority");

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
assert.ok(conservationManifest.generations.length >= 1,
  "the ledger retains at least one append-only generation");
const generationIds = conservationManifest.generations.map(({id}) => id);
assert.equal(new Set(generationIds).size, generationIds.length,
  "append-only generation identities remain unique in declared order");
const currentGeneration = conservationManifest.generations.at(-1);
assert.deepEqual(currentGeneration, canonicalVerificationContractGeneration(
  currentConservationState, currentGeneration.authority, currentGeneration.id),
"the current generation is canonical over all nine exact owner sources");

const conservationFailureKinds = (manifest, state = currentConservationState,
  authorityPopulation = conservationAuthorityPopulation) => new Set(
  verificationContractConservationFailures(manifest, state.leavesByOwner, {
    sourceSha256:state.sourceSha256, authorityPopulation,
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
  currentConservationState, resolveVerificationContractAuthorityPopulation(
    candidateAuthoredAuthorityManifest)).has("exact-authority-commit"), true,
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
staleDigestManifest.generations.at(-1).ownerSources[0].sha256 = "0".repeat(64);
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
noncanonicalManifest.generations.at(-1).inventory.assertions.reverse();
assert.equal(conservationFailureKinds(noncanonicalManifest).has("current-generation-inventory"), true,
  "noncanonical current-generation order fails closed");
const nonAncestralPopulation = resolveVerificationContractAuthorityPopulation(
  conservationManifest, { testOnlyAncestryResolver:() => ({readable:true, ancestral:false}) });
assert.equal(conservationFailureKinds(conservationManifest, currentConservationState,
  nonAncestralPopulation).has("non-ancestral-authority"), true,
"a derived non-ancestral generation authority fails closed");

const priorGenerationManifest = structuredClone(conservationManifest);
priorGenerationManifest.generations = priorGenerationManifest.generations.slice(0, -1);
const currentRefreshAuthority = currentGeneration.authority;
const bootstrapAuthorityPopulation = resolveVerificationContractAuthorityPopulation(
  priorGenerationManifest, {refreshAuthority:currentRefreshAuthority.commit});
const refreshedManifest = refreshVerificationContractConservationManifest(priorGenerationManifest,
  currentConservationState, { authority:currentRefreshAuthority,
    id:currentGeneration.id,
    authorityPopulation:bootstrapAuthorityPopulation });
assert.deepEqual(refreshedManifest, conservationManifest,
  "explicit refresh preserves the complete prefix and reproduces the final generation");
const currentRefreshAuthorityPopulation = resolveVerificationContractAuthorityPopulation(
  conservationManifest, {refreshAuthority:currentRefreshAuthority.commit});
const weakenedState = structuredClone(currentConservationState);
weakenedState.leavesByOwner[conservationManifest.owners[0]].assertions.shift();
assert.throws(() => refreshVerificationContractConservationManifest(conservationManifest,
  weakenedState, { authority:currentRefreshAuthority,
    id:"forbidden-weakening", authorityPopulation:currentRefreshAuthorityPopulation }),
/unmapped prior occurrence/u, "refresh refuses assertion retirement or weakening");
const fabricatedWeakeningManifest = structuredClone(conservationManifest);
const fabricatedSource = fabricatedWeakeningManifest.generations.at(-1).inventory.assertions[0];
const unrelatedSuccessor = fabricatedWeakeningManifest.generations.at(-1).inventory.assertions.find(
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
    authority:currentRefreshAuthority,
    id:"forbidden-fabricated-weakening",
    authorityPopulation:currentRefreshAuthorityPopulation,
  }), /exact-authority-(?:scenario|example-row)|authenticated successor authority/u,
"refresh cannot disguise a removed assertion as an unrelated existing successor");
assert.throws(() => refreshVerificationContractConservationManifest(conservationManifest,
  reassignedState, { authority:currentRefreshAuthority,
    id:"forbidden-reassignment", authorityPopulation:currentRefreshAuthorityPopulation }),
/unmapped prior occurrence/u, "refresh refuses an owner reassignment without an exact transition");
assert.throws(() => refreshVerificationContractConservationManifest(conservationManifest,
  ambiguousTransitionDestinationState, { authority:currentRefreshAuthority,
    id:"forbidden-ambiguous-successor",
    authorityPopulation:currentRefreshAuthorityPopulation }),
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
  await writeFile(refreshManifestPath, `${JSON.stringify(priorGenerationManifest, null, 2)}\n`);
  const refreshResult = spawnSync(process.execPath,
    ["scripts/refresh-verification-contract-conservation.mjs", "refresh", "--manifest",
      refreshManifestPath, "--authority", currentRefreshAuthority.commit],
    { cwd:process.cwd(), encoding:"utf8" });
  assert.equal(refreshResult.status, 0, refreshResult.stderr);
  assert.equal(await readFile(refreshManifestPath, "utf8"),
    `${JSON.stringify(conservationManifest, null, 2)}\n`,
    "the explicit refresh entry point writes only the deterministic manifest delta");
  const refreshedBytes = await readFile(refreshManifestPath, "utf8");
  const controlledNamedAuthorityBytes=
    `${JSON.stringify(controlledNamedAuthorityManifest, null, 2)}\n`;
  await writeFile(refreshManifestPath, controlledNamedAuthorityBytes);
  const twoAuthorityCheckResult = spawnSync(process.execPath,
    ["scripts/refresh-verification-contract-conservation.mjs", "check", "--manifest",
      refreshManifestPath], { cwd:process.cwd(), encoding:"utf8" });
  assert.equal(twoAuthorityCheckResult.status, 0, twoAuthorityCheckResult.stderr);
  assert.equal(await readFile(refreshManifestPath, "utf8"), controlledNamedAuthorityBytes,
    "read-only CLI derives the controlled named authorities without writing");
  const laterAuthorityRefreshResult = spawnSync(process.execPath,
    ["scripts/refresh-verification-contract-conservation.mjs", "refresh", "--manifest",
      refreshManifestPath, "--authority", "1ed6ec0d3f5a2f1fcf56824d214bc51112e7e853"],
    { cwd:process.cwd(), encoding:"utf8" });
  assert.equal(laterAuthorityRefreshResult.status, 0, laterAuthorityRefreshResult.stderr);
  assert.equal(await readFile(refreshManifestPath, "utf8"),
    `${JSON.stringify(controlledLaterAuthorityManifest, null, 2)}\n`,
    "explicit refresh derives existing authorities and its later requested authority");
  await writeFile(refreshManifestPath, refreshedBytes);
  const forbiddenResult = spawnSync(process.execPath,
    ["scripts/refresh-verification-contract-conservation.mjs", "refresh", "--manifest",
      refreshManifestPath, "--authority", currentRefreshAuthority.commit,
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
      refreshManifestPath, "--authority", currentRefreshAuthority.commit],
    { cwd:process.cwd(), encoding:"utf8" });
  assert.notEqual(fakePathRefreshResult.status, 0,
    "refresh authenticates the exact historical authority path");
  assert.equal(await readFile(refreshManifestPath, "utf8"), fakePathBytes,
    "failed transition authentication writes nothing");
  const changedBaselineBytes=`${JSON.stringify(changedBaselineProvenanceManifest, null, 2)}\n`;
  await writeFile(refreshManifestPath, changedBaselineBytes);
  const changedBaselineRefreshResult = spawnSync(process.execPath,
    ["scripts/refresh-verification-contract-conservation.mjs", "refresh", "--manifest",
      refreshManifestPath, "--authority", currentRefreshAuthority.commit],
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
assert.equal(verificationContractConservationFailures(conservationManifest, deletedLeaves,
  conservationOptions)
  .some(({violation, leaf}) => violation === "cardinality" && leaf === firstAssertion.leaf), true,
"a current successor deletion fails exact conservation");
const duplicatedLeaves = structuredClone(currentLeavesByOwner);
duplicatedLeaves[firstAssertion.owner].assertions.push(firstAssertion.leaf);
assert.equal(verificationContractConservationFailures(conservationManifest, duplicatedLeaves,
  conservationOptions)
  .some(({violation, leaf}) => violation === "cardinality" && leaf === firstAssertion.leaf), true,
"a duplicate current leaf fails exact conservation");
const secondOwnerLeaves = structuredClone(currentLeavesByOwner);
const secondOwner = verificationProcessCompatibilitySuccessors.find((owner) => owner !== firstAssertion.owner);
secondOwnerLeaves[secondOwner].assertions.push(firstAssertion.leaf);
assert.equal(verificationContractConservationFailures(conservationManifest, secondOwnerLeaves,
  conservationOptions)
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
const nestedMappingBaseCommit = "f16bd1b9d9cadcfb6beb67c432cd348df7dd6836";
const nestedMappingCandidateCommit = "6757b7f781fc3c76af4885e8eb1c493582cf3f1d";
const nestedExecutionPrerequisites = [{
  path:"test/verification-contracts/execution-checkpoint-contract-test.mjs",
  requiredCapabilities:["local-loopback"],
}];
const gitJsonAt = (commit, filePath) => {
  const result = spawnSync("git", ["show", `${commit}:${filePath}`], {
    cwd:process.cwd(), encoding:"utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
};
const nestedBaseManifest = gitJsonAt(nestedMappingBaseCommit,
  "verification/manifests/verification_process.json");
const nestedCandidateManifest = gitJsonAt(nestedMappingCandidateCommit,
  "verification/manifests/verification_process.json");
const nestedBaseRegistry = gitJsonAt(nestedMappingBaseCommit, "verification/packs.json");
const nestedCandidateRegistry = gitJsonAt(nestedMappingCandidateCommit, "verification/packs.json");
const nestedCandidateRegistryPack = nestedCandidateRegistry.find(({id}) =>
  id === "verification_process");
assert.deepEqual(nestedBaseManifest.pack.executionPrerequisites, undefined,
  "the immutable nested source base has no undeclared capability mapping");
assert.deepEqual(nestedCandidateManifest.pack.executionPrerequisites,
  nestedExecutionPrerequisites,
"the source manifest adds exactly one local-loopback execution prerequisite");
assert.deepEqual(nestedCandidateRegistryPack.executionPrerequisites,
  nestedCandidateManifest.pack.executionPrerequisites,
"the generated registry contains the exact source-manifest prerequisite delta");
const nestedManifestReverseProjection = structuredClone(nestedCandidateManifest);
delete nestedManifestReverseProjection.pack.executionPrerequisites;
assert.deepEqual(nestedManifestReverseProjection, nestedBaseManifest,
  "removing the authenticated prerequisite byte-semantics restores the source manifest base");
const nestedRegistryReverseProjection = structuredClone(nestedCandidateRegistry);
delete nestedRegistryReverseProjection.find(({id}) => id === "verification_process")
  .executionPrerequisites;
assert.deepEqual(nestedRegistryReverseProjection, nestedBaseRegistry,
  "removing the authenticated prerequisite byte-semantics restores the generated registry base");
const actualExecutionPrerequisites = verificationProcessPack.executionPrerequisites ?? [];
assert.equal([[], nestedExecutionPrerequisites].some((authenticated) =>
  JSON.stringify(actualExecutionPrerequisites) === JSON.stringify(authenticated)), true,
"the current registry is exactly the authenticated pre-mapping or one-mapping state");
const baselineRegistryProjection = structuredClone(packs);
const projectedVerificationProcessPack = baselineRegistryProjection.find(({id}) =>
  id === "verification_process");
assert.deepEqual(projectedVerificationProcessPack.executionPrerequisites ?? [],
  actualExecutionPrerequisites,
"the migration projection starts from the current authenticated registry state");
delete projectedVerificationProcessPack.executionPrerequisites;
const projectedRegistryInventory = baselineRegistryProjection.find(({id}) =>
  id === "verification_process").verificationSlices.find(({id}) => id === "registry_inventory");
projectedRegistryInventory.sourcePaths = projectedRegistryInventory.sourcePaths.filter((sourcePath) =>
  !transitionRepairMappedPaths.includes(sourcePath));
assert.equal(createHash("sha256").update(serializeVerificationRegistry(baselineRegistryProjection))
  .digest("hex"), migrationLedger.expectedCompiledDigest,
"removing only the authenticated nested mapping and transition paths restores the immutable digest");
const actualRegistryInventory = verificationProcessPack.verificationSlices.find(({id}) =>
  id === "registry_inventory");
const nestedCandidateRegistryInventory = nestedCandidateRegistryPack.verificationSlices.find(
  ({id}) => id === "registry_inventory");
assert.deepEqual(actualRegistryInventory, nestedCandidateRegistryInventory,
  "the nested mapping leaves the exact registry-inventory assertions unchanged");
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
  if (context.causalCategory === "other:contract-conservation regression instrumentation") {
    const fixture = {
      id:"contract-conservation-regression-instrumentation-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ conservedOwner:"test/verification-contracts/registry-inventory-contract-test.mjs",
        causalProofOwner:"test/verification-registry-planner-modularization-acceptance-test.mjs" },
      expectedPreRepairFailure:{ sourceConservationPassed:false, aggregatePassed:false },
      expectedRepairResult:{ sourceConservationPassed:true, aggregatePassed:true },
    };
    const observed = { sourceConservationPassed:true, aggregatePassed:focusedFailures.length === 0 };
    assert.deepEqual(observed, fixture.expectedRepairResult,
      "causal proof stays outside the immutable conserved contract sources");
    const fixtureDigest = verificationDigest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:fixture.expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed } } }));
  }
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
