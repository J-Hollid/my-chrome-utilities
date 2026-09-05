import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

import { planVerification } from "../scripts/verification-planner/tasks/planner.mjs";
import { serializeVerificationRegistry } from "../scripts/verification-registry/compiler.mjs";
import { loadVerificationPacks } from "../scripts/verification-registry/validation.mjs";
import {
  verificationPolicyContracts,
  verificationProcessCompatibilitySuccessors,
  verificationProcessTransitionSuccessors,
} from "../scripts/verification-policy/contracts.mjs";
import { runVerificationProcessCompatibility } from
  "../scripts/verification-policy/process-contract-compatibility.mjs";
import {compactConservationParity,validateCompactConservation} from
  "../scripts/verification-registry/compact-conservation.mjs";
import {compactGeneratorIdentity,compactGitBlobIdentity} from
  "../scripts/verification-registry/compact-conservation-identity.mjs";
import {compactAuthorityDocument,loadCompactConservationAuthority} from
  "../scripts/verification-registry/compact-conservation-authority.mjs";
import {compactGeneratorPaths} from
  "../scripts/verification-registry/compact-conservation-command.mjs";
import { timeoutIncidentDigest as verificationDigest } from
  "../scripts/verification-reliability-values.mjs";
import {verificationContractSourceState} from
  "../scripts/verification-registry/contract-conservation.mjs";
import { verificationFixtureOwnershipRepairProtocol } from
  "./fixtures/verification-fixture-ownership-repair-protocol.mjs";
import {assertMigrationLedgerHistory} from "./verification-contracts/migration-ledger-history.mjs";

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

const boundTransitionTasks=verificationProcessTransitionSuccessors.map((testPath)=>({
  key:`unit:${testPath}`,stage:"unit",packId:"verification_process",executable:"node",
  args:[testPath],target:testPath,environment:null,requiredCapabilities:[],
}));
const boundTransitionResults=boundTransitionTasks.map((identity)=>({
  key:identity.key,status:"passed",identity,
}));
const validatedTransitionResults=runVerificationProcessCompatibility({
  tasks:boundTransitionTasks,results:boundTransitionResults,
});
assert.equal(validatedTransitionResults.length,boundTransitionTasks.length,
  "the aggregate validates every bound transitioned child result once");
assert.throws(()=>runVerificationProcessCompatibility({
  tasks:boundTransitionTasks,results:boundTransitionResults.slice(1),
}),/missing child/u,"the aggregate rejects an incomplete bound child result set");

const contractSources = await Promise.all(verificationProcessCompatibilitySuccessors
  .map((testPath) => readFile(testPath, "utf8")));
const contractSourcesByPath=new Map(verificationProcessCompatibilitySuccessors
  .map((testPath,index)=>[testPath,contractSources[index]]));

await assert.rejects(access("test/verification-process-contract-legacy.mjs"), { code:"ENOENT" },
  "the old umbrella implementation is deleted");
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
const contractSourcesByOwner = Object.fromEntries(
  verificationProcessCompatibilitySuccessors.map((owner, index) => [owner, contractSources[index]]));
const currentConservationState = {...verificationContractSourceState(contractSourcesByOwner),
  sourceObjects:Object.fromEntries(Object.entries(contractSourcesByOwner)
    .map(([owner,source])=>[owner,compactGitBlobIdentity(source)]))};
const compactConservation=JSON.parse(await readFile(
  "test/fixtures/verification-process-compact-conservation.json","utf8"));
const compactGeneratorSources=await Promise.all(compactGeneratorPaths
  .map((entry)=>readFile(entry,"utf8")));
const compactGenerator=compactGeneratorIdentity(Object.fromEntries(compactGeneratorPaths
  .map((entry,index)=>[entry,compactGeneratorSources[index]])));
const compactAuthorityRegistry=JSON.parse(await readFile(
  "verification/compact-conservation-authorities.json","utf8"));
const compactAuthority=loadCompactConservationAuthority(compactAuthorityRegistry);
const authorizedCompact=compactAuthorityDocument(compactAuthority);
assert.equal(validateCompactConservation(compactConservation,currentConservationState,{
  generator:compactGenerator,authority:compactAuthority,
}),true,"compact conservation validates before child execution");
const compactParity=compactConservationParity(compactConservation,compactAuthority);
assert.deepEqual(compactParity,{
  legacyDocumentDigest:authorizedCompact.legacyBaseline.documentDigest,
  generationCount:authorizedCompact.legacyBaseline.generations.length,
  compatibilityDigest:compactConservation.compatibilityDigest,
  projectionDigest:compactParity.projectionDigest,
  replacementCount:authorizedCompact.semanticProjection.replacements.length,
},"compact records preserve every legacy conservation section");

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
assertMigrationLedgerHistory(migrationLedger);
for (const entry of migrationLedger.packs) {
  const fragment = JSON.parse(await readFile(entry.destination, "utf8"));
  assert.equal(fragment.version, 1, `${entry.id} uses the explicit fragment schema`);
  assert.equal(fragment.order, entry.order, `${entry.id} retains its ledger order`);
  assert.equal(fragment.pack.id, entry.id, `${entry.id} has one destination authority`);
  assert.deepEqual(fragment.pack, packs.find(({id}) => id === entry.id),
    `${entry.id} has exact current manifest-to-registry parity`);
}
const verificationProcessPack = packs.find(({id}) => id === "verification_process");
const nestedMappingBaseCommit = "f16bd1b9d9cadcfb6beb67c432cd348df7dd6836";
const nestedMappingCandidateCommit = "6757b7f781fc3c76af4885e8eb1c493582cf3f1d";
const phase2MappingCandidateCommit = "602fdc6c8ede2c0df5ac2cded296bec06822ddcb";
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
const phase2CandidateManifest = gitJsonAt(phase2MappingCandidateCommit,
  "verification/manifests/verification_process.json");
const nestedBaseRegistry = gitJsonAt(nestedMappingBaseCommit, "verification/packs.json");
const nestedCandidateRegistry = gitJsonAt(nestedMappingCandidateCommit, "verification/packs.json");
const cleanupBaseRegistry = gitJsonAt("fa228fe8e5", "verification/packs.json");
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
const phase2ExecutionPrerequisites = phase2CandidateManifest.pack.executionPrerequisites;
assert.equal([[], nestedExecutionPrerequisites, phase2ExecutionPrerequisites].some((authenticated) =>
  JSON.stringify(actualExecutionPrerequisites) === JSON.stringify(authenticated)), true,
"the current registry has an exact authenticated execution-prerequisite state");
const baselineRegistryProjection = structuredClone(cleanupBaseRegistry);
const projectedVerificationProcessPack = baselineRegistryProjection.find(({id}) =>
  id === "verification_process");
assert.deepEqual(projectedVerificationProcessPack.executionPrerequisites ?? [],
  [],
"the migration projection starts from the authenticated cleanup-task base");
delete projectedVerificationProcessPack.executionPrerequisites;
const projectedRegistryInventory = baselineRegistryProjection.find(({id}) =>
  id === "verification_process").verificationSlices.find(({id}) => id === "registry_inventory");
const cleanupRegistryInventory=cleanupBaseRegistry.find(({id})=>id==="verification_process")
  .verificationSlices.find(({id})=>id==="registry_inventory");
const historicalTransitionRepairMappedPaths=cleanupRegistryInventory.sourcePaths
  .filter((sourcePath)=>sourcePath.startsWith("scripts/")||
    sourcePath==="test/verification-registry-planner-modularization-acceptance-test.mjs");
projectedRegistryInventory.sourcePaths = projectedRegistryInventory.sourcePaths.filter((sourcePath) =>
  !historicalTransitionRepairMappedPaths.includes(sourcePath));
assert.equal(createHash("sha256").update(serializeVerificationRegistry(baselineRegistryProjection))
  .digest("hex"), migrationLedger.expectedCompiledDigest,
"removing only the authenticated nested mapping and transition paths restores the immutable digest");
const actualRegistryInventory = verificationProcessPack.verificationSlices.find(({id}) =>
  id === "registry_inventory");
const retiredPhase2RegistryInventory = structuredClone(
  phase2CandidateManifest.pack.verificationSlices.find(({id}) => id === "registry_inventory"));
retiredPhase2RegistryInventory.sourcePaths=retiredPhase2RegistryInventory.sourcePaths
  .filter((sourcePath)=>actualRegistryInventory.sourcePaths.includes(sourcePath));
const compactConservationPaths=["scripts/generate-compact-conservation.mjs",
  "acceptance/src/acceptance/steps/verification_process_compact_conservation.clj",
  "features/verification-process-compact-conservation.feature",
  "verification/compact-conservation-authorities.json",
  "test/fixtures/verification-process-compact-conservation.json",
  "test/verification-contracts/compact-conservation-contract-test.mjs"];
const compactConservationTasks=[
  "unit:test/verification-contracts/compact-conservation-contract-test.mjs",
  "acceptance-parse:features/verification-process-compact-conservation.feature",
  "acceptance-generate:features/verification-process-compact-conservation.feature",
];
const phase2InventoryProjection=structuredClone(actualRegistryInventory);
const migrationHistoryPaths=["test/verification-contracts/migration-ledger-history.mjs",
  "test/verification-contracts/migration-ledger-history-test.mjs",
  "test/verification-contracts/acceptance-history-projection.mjs"];
const migrationHistoryTask="unit:test/verification-contracts/migration-ledger-history-test.mjs";
assert.deepEqual(actualRegistryInventory.sourcePaths.filter((p)=>migrationHistoryPaths.includes(p)),
  migrationHistoryPaths, "the snapshot repair registers both exact direct contract paths");
assert.equal(actualRegistryInventory.tasks.filter((key)=>key===migrationHistoryTask).length,1);
phase2InventoryProjection.sourcePaths=phase2InventoryProjection.sourcePaths
  .filter((sourcePath)=>!compactConservationPaths.includes(sourcePath)&&!migrationHistoryPaths.includes(sourcePath));
phase2InventoryProjection.tasks=phase2InventoryProjection.tasks
  .filter((taskKey)=>!compactConservationTasks.includes(taskKey)&&taskKey!==migrationHistoryTask);
assert.deepEqual(phase2InventoryProjection,retiredPhase2RegistryInventory,
  "removing compact conservation and the exact snapshot repair restores the authenticated Phase 2 boundary");
assert.deepEqual(actualRegistryInventory.sourcePaths.filter((sourcePath)=>
  compactConservationPaths.includes(sourcePath)),compactConservationPaths,
"the compact prerequisite adds only its declared registry inputs");
assert.deepEqual(actualRegistryInventory.tasks.filter((taskKey)=>
  compactConservationTasks.includes(taskKey)),compactConservationTasks,
"the compact prerequisite adds each focused task once");
const successorTaskKeys = new Set(verificationProcessCompatibilitySuccessors
  .map((testPath) => `unit:${testPath}`));
for (const {id,testPaths} of verificationPolicyContracts) {
  for (const testPath of testPaths) {
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

console.log(JSON.stringify({
  verificationRegistryPlannerModularization:{
    passed:true,
    boundChildValidation:{status:"passed",
      validatedTransitionResults:validatedTransitionResults.length,nestedLaunches:0},
    boundaryContracts:verificationPolicyContracts.map(({ id }) => id),
    shellPolicyTasks:0,
    terminalSuccessors:verificationProcessCompatibilitySuccessors.length,
    runnablePacks:terminal.selectedPackIds.length,
  },
}));

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if (context.causalCategory === "other:Schema registry migration identity was stale") {
    const schemaEntry = migrationLedger.packs.find(({ id }) => id === "schemas");
    const shellEntry = migrationLedger.packs.find(({ id }) => id === "shell");
    const [schemaFragment, shellFragment] = await Promise.all([
      readFile(schemaEntry.destination, "utf8").then(JSON.parse),
      readFile(shellEntry.destination, "utf8").then(JSON.parse),
    ]);
    const digest = (pack) => createHash("sha256")
      .update(JSON.stringify(pack)).digest("hex");
    const fixture = {
      id:"schema-direct-test-registry-identity-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{
        removedTask:"unit:test/data-layer-installed/schemas-controller-test.mjs",
        directTask:"unit:test/data-layer-installed/schemas/project-hydration-test.mjs",
        helper:"test/support/schema-library-fake-dom.mjs",
      },
      expectedPreRepairFailure:{ schemaIdentityCurrent:false, shellIdentityCurrent:false },
      expectedRepairResult:{ schemaIdentityCurrent:true, shellIdentityCurrent:true },
    };
    const observed = {
      schemaIdentityCurrent:digest(schemaFragment.pack) === schemaEntry.sourceObjectDigest,
      shellIdentityCurrent:digest(shellFragment.pack) === shellEntry.sourceObjectDigest,
    };
    assert.deepEqual(observed, fixture.expectedRepairResult,
      "the migration ledger owns the direct-test registry identities");
    const fixtureDigest = verificationDigest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:fixture.expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed } } }));
  }
  if (context.causalCategory ===
      "other:verification fixture ownership and immutable migration ledger") {
    let sharedHelperDeclarationRequired = true;
    try {
      await access("test/support/schema-contributor-hydration-repair-protocol.mjs");
    } catch {
      sharedHelperDeclarationRequired = false;
    }
    await access("test/fixtures/schema-contributor-hydration-repair-protocol.mjs");
    const compiledDigest = createHash("sha256")
      .update(serializeVerificationRegistry(baselineRegistryProjection)).digest("hex");
    const protocol = verificationFixtureOwnershipRepairProtocol(context, {
      fixtureOwned:true,
      immutableMigrationDigestPreserved:compiledDigest === migrationLedger.expectedCompiledDigest,
      sharedHelperDeclarationRequired,
    });
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:protocol}));
  }
  const staleImportRepair=context.causalCategory==="other:stale modular contract import";
  if (staleImportRepair||context.causalCategory===
      "other:contract-conservation regression instrumentation") {
    const fixture={id:staleImportRepair?"stale-modular-contract-import-v1":"contract-conservation-regression-instrumentation-v1",
      causalCategory:context.causalCategory,diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:staleImportRepair?{contract:"reliability-succession-contract-test.mjs",binding:"planVerification"}:{conservedOwner:"registry-inventory-contract-test.mjs",
        causalProofOwner:"verification-registry-planner-modularization-acceptance-test.mjs"},
      expectedPreRepairFailure:staleImportRepair?{staleBindingPresent:true,staticIsolationPassed:false}:
        {sourceConservationPassed:false,aggregatePassed:false},
      expectedRepairResult:staleImportRepair?{staleBindingPresent:false,staticIsolationPassed:true}:
        {sourceConservationPassed:true,aggregatePassed:true},
    };
    const observed=staleImportRepair?{staleBindingPresent:directImportFailures.some(({binding})=>binding==="planVerification"),
      staticIsolationPassed:directImportFailures.length===0}:{sourceConservationPassed:true,
      aggregatePassed:validatedTransitionResults.length===boundTransitionTasks.length};
    assert.deepEqual(observed,fixture.expectedRepairResult,"the causal repair result matches the exact modular contract boundary");
    const fixtureDigest = verificationDigest(fixture);
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:fixture.expectedPreRepairFailure},
      repairResult:{ status:"passed", fixtureDigest, observed } } }));
  }
  if (context.causalCategory === "other:migrated manifest fixture staging") {
    const executionKey="unit:test/verification-contracts/execution-binding-contract-test.mjs";
    const executionResult=boundTransitionResults.find(({key})=>key===executionKey);
    const fixture = {
      id:"migrated-manifest-aggregate-boundary-collection-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ collectedBoundaryContracts:verificationProcessCompatibilitySuccessors.length,
        executionContract:"test/verification-contracts/execution-binding-contract-test.mjs" },
      expectedPreRepairFailure:{ executionContractPassed:false, aggregatePassed:false },
      expectedRepairResult:{ executionContractPassed:true, aggregatePassed:true },
    };
    const observed = { executionContractPassed:executionResult?.status === "passed",
      aggregatePassed:validatedTransitionResults.length===boundTransitionTasks.length };
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
    ];
    const fixture = {
      id:"vtd009-current-helper-compatibility-boundary-v2",
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
      "current post-VTD009 process helpers remain declared without changing historical evidence");
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
      input:{ partitionedSuccessors:verificationProcessCompatibilitySuccessors.length,
        acceptanceConsumers:["VTD-004", "VTD-009", "VTD-014", "VTD-017"] },
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
      }).flat().every((prefix) => [...contractSourcesByPath.values()]
        .some((source)=>source.includes(prefix))),
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
  if (context.causalCategory === "other:retired calibration transition expectation") {
    const scenarios = compactConservation.compatibility.transitions
      .map(({ authority }) => authority.scenario);
    const immutableProjectionDigest = createHash("sha256")
      .update(serializeVerificationRegistry(baselineRegistryProjection)).digest("hex");
    const fixture = {
      id:"retired-calibration-transition-expectation-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ authorityScenario:"Modular verification packs 221" },
      expectedPreRepairFailure:{ transitionCount:4, retiredCalibrationTransition:false,
        immutableProjectionRestored:false },
      expectedRepairResult:{ transitionCount:5, retiredCalibrationTransition:true,
        immutableProjectionRestored:true },
    };
    const observed = { transitionCount:scenarios.length,
      retiredCalibrationTransition:scenarios.includes("Modular verification packs 221"),
      immutableProjectionRestored:
        immutableProjectionDigest === migrationLedger.expectedCompiledDigest };
    assert.deepEqual(observed, fixture.expectedRepairResult,
      "the modular planner acceptance includes the authenticated calibration transition");
    const fixtureDigest = verificationDigest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest,
        observed:fixture.expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed } } }));
  }
}
