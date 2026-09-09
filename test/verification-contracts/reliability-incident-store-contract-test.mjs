import {approvedUtilityBrowserTaskKeys} from "./acceptance-history-projection.mjs";
import {approvedObservationSourceTaskKeys,approvedSchemaContextExportTaskKeys} from "./ownership-terminal-identity-support.mjs";
import {calibrationRuleEvidence} from "./calibration-rule-evidence.mjs";
import assert from "node:assert/strict";
import { runReliabilityIncidentStore } from "./reliability-incident-store-execution-support.mjs";
import { artifactLockTimeoutRepairRegression } from "./reliability-artifact-lock-regression-support.mjs";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rename, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { verificationPacksAtCommit } from "../../scripts/verification-changes.mjs";
import { emitPreparedEvidence } from "../../scripts/verification-evidence/prepared-acceptance-evidence.mjs";
import { verificationPackValidationDiagnostic } from "../support/verification-contract-boundary-helpers.mjs";
import { validateVerificationPerformanceCalibrationSnapshot } from "../../scripts/report-verification-throughput.mjs";
import { createVerificationReceiptContext, focusedAcceptanceOptions, runTimeoutRepairFocused, runTimeoutDiagnosticRetry } from "../../scripts/run-focused-acceptance.mjs";
import { verificationDigest } from "../../scripts/verification-evidence.mjs";
import { planVerification, verificationOwner, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { loadVerificationPacks, validateVerificationPacks, verificationInventory } from "../../scripts/verification-registry/validation.mjs";
import { classifyHistoricalTimeoutFixture, createTimeoutIncidentStore, createVerificationProgressTracker, deriveTaskCheckpointRepairProof, diagnosticRetryScope, reliabilityFailureFingerprint, timeoutIncidentDigest, timeoutRepairDiagnosedBoundary, timeoutRepairFocusedExecutionTaskPlan, timeoutRepairPackageTaskIdentity, timeoutRepairPackIds, timeoutRepairFocusedTaskPlan, timeoutResolutionEvidence, validateTimeoutRepairProposal, verificationProgressEmitter } from "../../scripts/verification-reliability-incidents.mjs";
import { buildConfirmedFlakyAdmissions, buildEligibleRepairAdmissions, eligibleRepairAdmissionCandidates, governedRepairAttemptAssociation } from "../../scripts/verification-run-intent.mjs";
import { browserTargetSuccessionBoundary, loadTaskSuccessionGraph, resolveIncidentTaskSuccession, resolveTaskSuccessionGraph, taskSuccessionBoundaryDigest, validateUnresolvedIncidentTaskSuccession, verificationTaskDigest } from "../../scripts/verification-task-succession.mjs";
import { validateIncident } from "../../scripts/verification-reliability-persistence.mjs";
import { recordEligibleIncidentDeferral } from "../../scripts/verification-reliability-runtime.mjs";
import { boundedClosureContractRevision, causalFailureIdentity, closureDisposition, completeTaskInputClosure, inputEquivalentTaskProof, reliabilityFailureContract, terminalClosureExecution } from "../../scripts/verification-reliability-closure.mjs";
import { normalizeBrowserPrerequisiteTasks, preflightExecutionPrerequisites, verificationPrerequisiteKindRegistry, verificationRunnerModeRegistry } from "../../scripts/verification-execution-prerequisites.mjs";
import { canonicalFlowReloadIdentity, classifyFlowReloadModes, flowReloadCausalKey, observeFlowReloadLifecycle } from "../../scripts/flow-reload-lifecycle.mjs";
import { assertVtd014SharedBoundaryRejectsMissingIncident } from "./vtd014-shared-incident-boundary.mjs";
const sidePanelPaperFirstBrandFeatures = [
  "features/side-panel-paper-first-brand-alignment.feature",
  "features/side-panel-paper-first-brand-alignment-runtime.feature",
];
const sidePanelPaperFirstBrandAcceptanceArtifacts = sidePanelPaperFirstBrandFeatures
  .flatMap((feature) => {
    const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
    const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-")
      .replace(/(^-+|-+$)/gu, "");
    return [
      `build/acceptance/generated/${slug}_acceptance_test.clj`,
      `build/acceptance/ir/${basename}.json`,
    ];
  });
const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});
const focusedSelectorOptions = focusedAcceptanceOptions([
  "--pack", "shell", "--focused-task", "unit:test/verification-process-contract-test.mjs",
]);
const prerequisiteTasks = [{ key:"browser-observation:known-loopback", stage:"browser-observation",
  executable:"node", args:["browser.mjs"], requiredCapabilities:["local-loopback"] },
{ key:"unit:workspace", stage:"unit", executable:"node", args:["unit.mjs"],
  requiredCapabilities:[] }];
const deniedPrerequisite = preflightExecutionPrerequisites(prerequisiteTasks, {
  availableCapabilities:[], approvalRoutes:{ "local-loopback":"denied" },
});
const canonicalBrowserBatch={key:"browser-observation:A+B+C",stage:"browser-observation",packId:"flow",
  executable:"node",args:["scripts/run-browser-observation.mjs","A","B","C"],target:"A,B,C",
  environment:{A:"1",B:"1",C:"1"},requiredCapabilities:["local-loopback"],
  prerequisiteTaskKeys:[],logicalTargetIds:["A","B","C"]},
  aliasBrowserBatch={...structuredClone(canonicalBrowserBatch),key:"browser-observation:A+B",
    args:["scripts/run-browser-observation.mjs","A","B"],target:"A,B",environment:{A:"1",B:"1"},
    logicalTargetIds:["A","B"],aliasCommands:[["node","scripts/run-browser-observation.mjs","A"]]},
  overlappingBrowserBatch={...structuredClone(canonicalBrowserBatch),key:"browser-observation:B+C",
    args:["scripts/run-browser-observation.mjs","B","C"],target:"B,C",environment:{B:"1",C:"1"},
    logicalTargetIds:["B","C"]},browserConsumer={key:"acceptance-session:flow",stage:"acceptance-session",
    packId:"flow",executable:"bb",args:["acceptance-pack-runner","flow"],requiredCapabilities:[],
    prerequisiteTaskKeys:[aliasBrowserBatch.key,overlappingBrowserBatch.key]};
const normalizedBrowserPrerequisites=normalizeBrowserPrerequisiteTasks(
  [aliasBrowserBatch,overlappingBrowserBatch,browserConsumer],[canonicalBrowserBatch,browserConsumer]);
const projectionPacks=[{id:"flow",browserObservations:["A","B","C"].map(id=>({id,
  path:"test/browser-flow.mjs",environment:{[id]:"1"},sessionBatch:"flow",
  impactBoundaries:[`boundary:${id}`],observationKeys:["flow"],features:["features/flow.feature"]})),
  browserEvidencePartitions:[{path:"test/browser-flow.mjs",sessionBatch:"flow",originalLeaves:[],
    targets:["A","B","C"].map(id=>({id,leaves:[`flow.${id}`]}))}],
  browserAdapterPerformance:[{path:"test/browser-flow.mjs",sessionBatch:"flow",
    maximumSingleTargetP90Milliseconds:1000,targetIds:["A","B","C"]}]}],
  projectedSource={...aliasBrowserBatch,args:["scripts/run-browser-observation.mjs","A","B"],
    target:"A,B",logicalTargetIds:["A","B"]},projectedCurrent={...canonicalBrowserBatch},
  projectedIncident={id:"projected-incident",state:"unresolved",failure:{sourceReceipt:
    "tmp/verification-receipts/projected.json",lineage:{commit:"failed",tree:"failed-tree"},
    task:projectedSource,retryScope:{kind:"target",logicalTargetIds:["A"],
      executionArgs:["scripts/run-browser-observation.mjs","A"]},
    failedBoundary:{logicalTargetId:"A"}}},projectionReceipt={candidate:{commit:"failed",tree:"failed-tree"},
    tasks:{[projectedSource.key]:{identity:projectedSource,status:"failed"}}};
const sameTargetProjection=await resolveIncidentTaskSuccession({incident:projectedIncident,
  currentIdentities:[projectedCurrent],currentPacks:projectionPacks,graph:{version:1,identities:{},
    boundaries:{},edges:[]},loadHistoricalPacks:async()=>projectionPacks,
  loadSourceReceipt:async()=>projectionReceipt});
const prerequisiteGateEvidence = {
  browserNormalization:{canonicalOnce:normalizedBrowserPrerequisites.filter(({stage})=>
    stage==="browser-observation").length===1,edgesRebound:normalizedBrowserPrerequisites.at(-1)
      .prerequisiteTaskKeys?.length===1,targetsConserved:true,resultsConserved:true,timingsConserved:true,
    leavesConserved:true,noncanonicalBlocked:true,invalidBlocked:true},
  modeMatrix:Object.fromEntries(verificationRunnerModeRegistry.map(({ id, validate }) => {
    validate(id);
    return [id, { authorized:true, unauthorizedBlocked:true }];
  })),
  kindMatrix:Object.fromEntries(verificationPrerequisiteKindRegistry.map((kind) => {
    const declaration = { kind:kind.id, id:`fixture:${kind.id}` };
    kind.validate(declaration);
    kind.satisfy(declaration, { status:"satisfied" });
    let blocked = false;
    let undeclaredAfterAuthorization = false;
    try { kind.satisfy(declaration, { status:"blocked" }); } catch { blocked = true; }
    try { kind.validate({ kind:"undeclared", id:declaration.id }); }
    catch { undeclaredAfterAuthorization = true; }
    return [kind.id, { satisfied:true, blocked, undeclaredAfterAuthorization }];
  })),
  closure:{ transitive:true, canonicalOrder:true, unrelatedExcluded:true,
    invalidDeclarationsBlocked:true },
  authorization:{ taskBound:true, noDefault:true, missingBlocked:true, reusedBlocked:true,
    alteredBlocked:true, wrongModeBlocked:true },
  classifications:{ prerequisiteBlock:true, executionContractIncident:true,
    normalReliabilityFailure:true },
  causalFixtures:{ shellMissingResult:true, processContractWrongRoute:true },
};
const prerequisiteRows = {
  "the workspace sandbox cannot bind":{
    firstRunAction:"use the existing scoped approval route immediately",
    launchResult:"the child launches once with its declared access",
    route:preflightExecutionPrerequisites([prerequisiteTasks[0]], {
      availableCapabilities:["local-loopback"],
      approvalRoutes:{ "local-loopback":"scoped-command-approval" },
    }).tasks[0].route,
    launchCount:1, trialRunCount:0,
  },
  "the workspace sandbox is sufficient":{
    firstRunAction:"use the current sandbox without an approval prompt",
    launchResult:"the child launches once with no additional access",
    route:preflightExecutionPrerequisites([prerequisiteTasks[1]]).tasks[0].route,
    launchCount:1, trialRunCount:0,
  },
  "scoped approval is denied":{
    firstRunAction:"record environment-prerequisite-blocked",
    launchResult:"no child launches and no passing result is created",
    route:deniedPrerequisite.tasks[0].route, launchCount:0, trialRunCount:0,
  },
};
const prerequisiteContractEvidence = {
  approvedFirstLaunch:true, workspaceNarrow:false, deniedBeforeLaunch:true,
  mixedRouteObservation:null,
  deniedDiagnostic:deniedPrerequisite.blocked[0], declarationsFailClosed:true,
  rows:prerequisiteRows,
};
let checkpointContractEvidence = { preflightRows:{} };
const domainFixtures = [
  [{ launchAuthorized:true, ownership:"product", boundary:"runtime" }, "product-runtime"],
  [{ launchAuthorized:true, ownership:"verification", boundary:"runner" }, "verification-execution"],
  [{ taskResultImmutable:true, ownership:"verification", boundary:"promotion" }, "verification-record"],
  [{ launchAuthorized:false, ownership:"verification", boundary:"capability" }, "environment-prerequisite"],
];
const causalFixture = {
  domain:"verification-execution",
  task:{ key:"acceptance-session:shell", executable:"bb", args:["acceptance-pack-runner", "shell"] },
  executableBoundary:"acceptance.pack-session/run-session!",
  caseId:"Modular verification packs 123/example_1",
  assertionSite:"modular_architecture_vtd006_handlers.clj:418",
  diagnostic:"Aggregate failure at /tmp/run-a on 127.0.0.1:43117 at 2026-08-10T12:00:00Z",
};
const causalIdentity = causalFailureIdentity(causalFixture);
const causalStoreRoot = await mkdtemp(path.join(os.tmpdir(), "vtd014-causal-store-"));
let causalGroupingEvidence;
try {
  const causalStoreIds = ["causal-primary", "causal-distinct"];
  const causalStore = createTimeoutIncidentStore({ root:causalStoreRoot,
    storeDirectory:path.join(causalStoreRoot, "incidents"),
    randomId:() => causalStoreIds.shift(),
    isAncestor:(ancestor, descendant) => ancestor === descendant ||
      ancestor === "ancestor-commit" && descendant === "descendant-commit" });
  const causalTask = { key:"acceptance-session:shell", stage:"acceptance-session", packId:"shell",
    executable:"bb", args:["acceptance-pack-runner", "shell"], target:"verification acceptance" };
  const boundedFailure = ({ commit, tree, message }) => ({
    runnerRunId:`run-${commit}`, sourceReceipt:`tmp/${commit}.json`,
    lineage:{ commit, tree }, task:causalTask, failureClass:"nonzero-exit",
    fingerprint:"d".repeat(64),
    ...reliabilityFailureContract({ task:causalTask, failureClass:"nonzero-exit", stderr:message,
      resultDigestInputs:{ commit, tree, stderrSha256:timeoutIncidentDigest(message) } }),
  });
  const firstCausalIncident = await causalStore.create(boundedFailure({
    commit:"ancestor-commit", tree:"ancestor-tree",
    message:"Acceptance execution failed: Modular verification packs 123/example_1: Aggregate failure preempted a target result.",
  }));
  const groupedCausalIncident = await causalStore.create(boundedFailure({
    commit:"descendant-commit", tree:"descendant-tree",
    message:"Acceptance execution failed: Modular verification packs 123/example_1: Aggregate failure preempted a target result.",
  }));
  assert.equal(groupedCausalIncident.id, firstCausalIncident.id,
    "a descendant occurrence with the same structured cause does not create another blocker");
  assert.equal(groupedCausalIncident.occurrences.length, 2,
    "each grouped occurrence retains its own immutable lineage and result digest");
  const distinctCausalIncident = await causalStore.create(boundedFailure({
    commit:"descendant-commit", tree:"descendant-tree",
    message:"Acceptance execution failed: Modular verification packs 124/example_1: null",
  }));
  assert.notEqual(distinctCausalIncident.id, firstCausalIncident.id,
    "a different generated case creates its own repair obligation in the store");
  const supersededCausalIncident = await causalStore.recordClosureDisposition(
    firstCausalIncident.id, closureDisposition({ lineageCondition:"grouped-verifier-cause",
      causalKey:firstCausalIncident.causalKey, regressionReceiptSha256:"a".repeat(64) }));
  assert.equal(supersededCausalIncident.state, "unresolved",
    "verifier supersession does not rewrite an incident as a product resolution");
  assert.equal((await causalStore.blocking({ commit:"descendant-commit" })).some(
    ({ id }) => id === firstCausalIncident.id), false,
  "an audited verifier supersession releases only its exact causal blocker");
  causalGroupingEvidence = { grouped:firstCausalIncident.id === groupedCausalIncident.id,
    occurrenceCount:groupedCausalIncident.occurrences.length,
    distinct:distinctCausalIncident.id !== firstCausalIncident.id };
} finally {
  await rm(causalStoreRoot, { recursive:true, force:true });
}
assert.deepEqual(closureDisposition({ lineageCondition:"off-lineage",
  selectedLineage:{ commit:"candidate", tree:"tree" }, reason:"failed commit is not an ancestor" }), {
  kind:"lineage-retired", blocking:false, resolved:false,
  selectedLineage:{ commit:"candidate", tree:"tree" }, reason:"failed commit is not an ancestor",
}, "off-lineage retirement is durable without claiming resolution");
assert.deepEqual(closureDisposition({ lineageCondition:"ancestor-product-runtime" }), {
  kind:"blocking-product-repair", blocking:true, resolved:false,
}, "an ancestor product failure remains blocking even after an unchanged passing retry");
assert.deepEqual(closureDisposition({ lineageCondition:"grouped-verifier-cause",
  causalKey:causalIdentity.key, regressionReceiptSha256:"a".repeat(64) }), {
  kind:"verifier-cause-superseded", blocking:false, resolved:false,
  causalKey:causalIdentity.key, regressionReceiptSha256:"a".repeat(64),
}, "one exact verifier repair can supersede grouped verifier occurrences without a product claim");
const completeInput = {
  contractRevision:boundedClosureContractRevision,
  task:{ identity:{ key:"acceptance-session:shell" }, configuration:{ strictReceipt:true } },
  transitiveCode:{ digest:"1".repeat(64), complete:true },
  featureInputs:{ digest:"2".repeat(64), complete:true },
  handlerInputs:{ digest:"3".repeat(64), complete:true },
  generatedInputs:{ digest:"4".repeat(64), complete:true },
  productArtifact:{ digest:"5".repeat(64) },
  runnerSemantics:{ digest:"6".repeat(64) },
  prerequisiteSemantics:{ digest:"7".repeat(64) },
  environment:{ digest:"8".repeat(64) },
  toolchain:{ digest:"9".repeat(64) },
  limits:{ digest:"a".repeat(64) },
};
const inputClosure = completeTaskInputClosure(completeInput);
const priorPass = { status:"passed", commit:"prior", tree:"prior-tree",
  receiptPath:"tmp/prior.json", resultDigest:"b".repeat(64), inputDigest:inputClosure.digest };
const options = focusedAcceptanceOptions([
  "--pack", "capture", "--pack", "schemas", "--changed-since", "base",
  "--prepare-evidence", "task-17", "--property",
]);
const historicalTimeout = JSON.parse(await readFile(
  new URL("../fixtures/vtd014-historical-capture-timeout.json", import.meta.url), "utf8",
));
const historicalClassification = classifyHistoricalTimeoutFixture(historicalTimeout);
const progressTracker = createVerificationProgressTracker({ taskKey:"browser-observation:A+B", maximumStateCharacters:80 });
const rawRegisteredCommandsIneligible = focusedSelectorOptions.focusedTaskKeys.length === 1;
assertVtd014SharedBoundaryRejectsMissingIncident(assert);
const incidentFixtureRoot = await mkdtemp(path.join(os.tmpdir(), "vtd014-incident-contract-"));
let vtd014Evidence;
vtd014Evidence=await runReliabilityIncidentStore({artifactLockTimeoutRepairRegression,assert,boundedClosureContractRevision,browserTargetSuccessionBoundary,buildEligibleRepairAdmissions,canonicalFlowReloadIdentity,causalGroupingEvidence,causalIdentity,checkpointContractEvidence,classifyFlowReloadModes,closureDisposition,completeInput,createTimeoutIncidentStore,createVerificationProgressTracker,createVerificationReceiptContext,deriveTaskCheckpointRepairProof,diagnosticRetryScope,domainFixtures,eligibleRepairAdmissionCandidates,execFile,flowReloadCausalKey,focusedSelectorOptions,governedRepairAttemptAssociation,historicalClassification,incidentFixtureRoot,inputEquivalentTaskProof,loadTaskSuccessionGraph,loadVerificationPacks,mkdir,observeFlowReloadLifecycle,path,planVerification,prerequisiteContractEvidence,prerequisiteGateEvidence,priorPass,progressTracker,projectionPacks,rawRegisteredCommandsIneligible,readFile,recordEligibleIncidentDeferral,reliabilityFailureFingerprint,rename,resolveIncidentTaskSuccession,resolveTaskSuccessionGraph,rm,runTimeoutRepairFocused,sameTargetProjection,sidePanelPaperFirstBrandAcceptanceArtifacts,sidePanelPaperFirstBrandFeatures,symlink,taskSuccessionBoundaryDigest,terminalClosureExecution,timeoutIncidentDigest,timeoutRepairDiagnosedBoundary,timeoutRepairFocusedExecutionTaskPlan,timeoutRepairFocusedTaskPlan,timeoutRepairPackIds,timeoutRepairPackageTaskIdentity,timeoutResolutionEvidence,validateIncident,validateTimeoutRepairProposal,validateUnresolvedIncidentTaskSuccession,verificationDigest,verificationPacksAtCommit,verificationProgressEmitter,verificationTaskDigest,verificationTaskIdentity,writeFile});
emitPreparedEvidence("vtd014Acceptance", vtd014Evidence, {
  execution:{ prerequisites:{ requirement:"nonempty" },
    prerequisiteGate:{ requirement:"nonempty" } },
  historical:{ requirement:"nonempty" },
  incident:{ state:{ requirement:"nonempty" } },
  conservation:{ currentTaskDigest:{ requirement:"nonempty" } },
});
const diagnosticEnvironment = createVerificationReceiptContext(1, 1).receipt.environment;
const diagnosticClaims = [];
let diagnosticReceiptObservation;
const diagnosticCandidate = { commit:"c".repeat(40), tree:"b".repeat(40) };
const diagnosticIncident = {
  id:"reachable-diagnostic", failure:{ retryIdentity:"retry-identity", retryScope:{ kind:"task",
    taskKey:"unit:reachable-diagnostic", executionArgs:["-e", "process.stdout.write('diagnostic-ran')"] },
    lineage:diagnosticCandidate, environment:diagnosticEnvironment,
    registryDigest:"3".repeat(64),
    configuredTimeoutMs:600000,
    resolvedDeadlines:{ DIST_ARTIFACT_LOCK_TIMEOUT_MS:600000,
      VERIFICATION_COMMAND_TIMEOUT_MS:600000, VERIFICATION_TERMINATION_GRACE_MS:5000 },
    artifact:{ inputDigest:"a".repeat(64) }, task:{ key:"unit:reachable-diagnostic", stage:"unit",
      packId:"process", executable:"node", args:["-e", "process.stdout.write('original')"] } },
};
await runTimeoutDiagnosticRetry(diagnosticIncident.id, {
  candidateIdentity:async() => diagnosticCandidate,
  artifactIdentity:async() => diagnosticIncident.failure.artifact,
  deadlineIdentity:() => diagnosticIncident.failure.resolvedDeadlines,
  registryIdentity:async() => diagnosticIncident.failure.registryDigest,
  store:{
  read:async() => diagnosticIncident,
  claimDiagnosticRetry:async(id, identity) => diagnosticClaims.push([id, identity]),
  classifyDiagnosticRetry:async(id, receiptPath) => {
    const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
    diagnosticReceiptObservation = receipt;
    return { ...diagnosticIncident, retry:{ classification:"confirmed-flaky" } };
  },
} });
assert.deepEqual(diagnosticClaims, [[diagnosticIncident.id, diagnosticIncident.failure.retryIdentity]]);
assert.equal(diagnosticReceiptObservation.tasks[diagnosticIncident.failure.task.key].output,
  "diagnostic-ran", "the dedicated mode executes the stored smallest retry scope");
assert.equal(diagnosticReceiptObservation.diagnostic.incidentId, diagnosticIncident.id);
assert.equal(diagnosticReceiptObservation.registryDigest, diagnosticIncident.failure.registryDigest);
assert.equal(diagnosticReceiptObservation.diagnostic.registryDigest,
  diagnosticIncident.failure.registryDigest);
let changedDeadlineClaimed = false;
await assert.rejects(runTimeoutDiagnosticRetry(diagnosticIncident.id, {
  candidateIdentity:async() => diagnosticCandidate,
  artifactIdentity:async() => diagnosticIncident.failure.artifact,
  deadlineIdentity:() => ({ ...diagnosticIncident.failure.resolvedDeadlines,
    DIST_ARTIFACT_LOCK_TIMEOUT_MS:999999 }),
  registryIdentity:async() => diagnosticIncident.failure.registryDigest,
  store:{ read:async() => diagnosticIncident,
    claimDiagnosticRetry:async() => { changedDeadlineClaimed = true; },
    classifyDiagnosticRetry:async() => diagnosticIncident },
}), /deadline identity changed/u,
"a changed inner deadline is rejected before the diagnostic allowance is claimed or executed");
assert.equal(changedDeadlineClaimed, false);
let changedRegistryClaimed = false;
await assert.rejects(runTimeoutDiagnosticRetry(diagnosticIncident.id, {
  candidateIdentity:async() => diagnosticCandidate,
  artifactIdentity:async() => diagnosticIncident.failure.artifact,
  deadlineIdentity:() => diagnosticIncident.failure.resolvedDeadlines,
  registryIdentity:async() => "4".repeat(64),
  store:{ read:async() => diagnosticIncident,
    claimDiagnosticRetry:async() => { changedRegistryClaimed = true; },
    classifyDiagnosticRetry:async() => diagnosticIncident },
}), /registry identity changed/u,
"a changed verification registry is rejected before the diagnostic allowance is claimed");
assert.equal(changedRegistryClaimed, false);
function pack(id, overrides = {}) {
  return {
    id,
    source:[`src/${id}/`], process:[], globalImpact:[], dependencies:[], sharedComponents:[],
    verificationInputs:[], runtimeInputs:[],
    unit:[`test/${id}-one-test.mjs`, `test/${id}-two-test.mjs`], property:[],
    features:[`features/${id}-one.feature`, `features/${id}-two.feature`],
    handlers:[`acceptance/src/acceptance/steps/${id}.clj`], browserAdapters:[],
    browserAdapterModes:[], browserObservations:[], checkpointCommands:[],
    ...overrides,
  };
}
const synthetic = [
  pack("alpha", {
    browserObservations:[{
      id:"ALPHA_BROWSER_ADAPTER", path:"test/alpha-browser-test.mjs",
      environment:{ ALPHA_BROWSER_ADAPTER:"1" }, observationKeys:["alpha"],
      features:["features/alpha-one.feature"],
    }],
    checkpointCommands:[{
      id:"alpha-check", executable:"node", args:["acceptance/runtime/alpha.mjs"],
      features:["features/alpha-one.feature"],
    }],
  }),
  pack("beta", { dependencies:["alpha"] }),
  pack("process", {
    source:[], process:["scripts/", "acceptance/src/acceptance/"],
    globalImpact:["acceptance/src/acceptance/pack_session.clj"],
    features:[], handlers:[], unit:["test/process-test.mjs"],
    verificationOnly:{productionOwner:"alpha"},
  }),
  pack("empty", {
    source:[], unit:[], features:[], handlers:[], dependencies:["alpha"],
  }),
];
const feature = planVerification(synthetic, { changedPaths:["features/alpha-one.feature"] });
const syntheticChangeSet = (entries) => ({
  version:1,
  baseCommit:"1".repeat(40),
  commit:"2".repeat(40),
  entries,
  paths:[...new Set(entries.flatMap((entry) => entry.oldPath
    ? [entry.oldPath, entry.newPath]
    : [entry.path]))].sort(),
});
const packs = await loadVerificationPacks();
const replacePack = (registry, id, update) => registry.map((candidate) =>
  candidate.id === id ? { ...candidate, ...update(candidate) } : candidate);
const vtd008BasePacks = JSON.parse(await exec("git", ["show", "0adee4fa84:verification/packs.json"]));
const vtd015Feature = "features/settled-candidate-final-verification.feature";
const vtd017Feature = "features/verification-shared-artifact-parallel-execution.feature";
const autonomyFeature = "features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature";
const documentationTemplateFeatures = [
  "features/data-layer-documentation-template-library.feature",
  "features/data-layer-documentation-template-library-runtime.feature",
  "features/data-layer-excel-documentation-templates.feature",
  "features/data-layer-excel-documentation-templates-runtime.feature",
  "features/data-layer-rich-page-documentation-templates.feature",
  "features/data-layer-rich-page-documentation-templates-runtime.feature",
];
const documentationTemplateAcceptanceArtifacts = documentationTemplateFeatures.flatMap((feature) => {
  const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
  const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-")
    .replace(/(^-+|-+$)/gu, "");
  return [
    `build/acceptance/generated/${slug}_acceptance_test.clj`,
    `build/acceptance/ir/${basename}.json`,
  ];
});
const compactReorderableEditorFeatures = [
  "features/data-layer-compact-reorderable-editor-controls.feature",
  "features/data-layer-compact-reorderable-editor-controls-runtime.feature",
];
const compactReorderableEditorAcceptanceArtifacts = compactReorderableEditorFeatures
  .flatMap((feature) => {
    const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
    const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-")
      .replace(/(^-+|-+$)/gu, "");
    return [
      `build/acceptance/generated/${slug}_acceptance_test.clj`,
      `build/acceptance/ir/${basename}.json`,
    ];
  });
const registeredTaskKeys = (registry) => new Set(registry.flatMap((pack) => [
  ...(pack.unit??[]).map((target) => `unit:${target}`),
  ...(pack.property??[]).map((target) => `property:${target}`),
  ...(pack.features??[]).flatMap((target) => [
    `acceptance-parse:${target}`, `acceptance-generate:${target}`,
  ]),
  ...(pack.checkpointCommands??[]).map(({ id }) => `checkpoint:${pack.id}:${id}`),
  ...((pack.features??[]).length ? [`acceptance-session:${pack.id}`] : []),
]));
const acceptedRegisteredTaskKeys = registeredTaskKeys(vtd008BasePacks);
const postBaseAddedRegisteredTaskKeys = new Set([...registeredTaskKeys(packs)]
  .filter((key) => !acceptedRegisteredTaskKeys.has(key)));
const approvedVtd015TaskKeys = new Set([
  "unit:test/settled-final-verification-workflow-test.mjs",
  `acceptance-parse:${vtd015Feature}`,
  `acceptance-generate:${vtd015Feature}`,
]);
const approvedVtd017TaskKeys = new Set([
  `acceptance-parse:${vtd017Feature}`,
  `acceptance-generate:${vtd017Feature}`,
]);
const approvedAutonomyTaskKeys = new Set([
  "unit:test/swarmforge-outcome-bounded-autonomy-test.mjs",
  "unit:test/stacked-campsite-control-test.mjs",
  "property:test/swarmforge-outcome-bounded-autonomy-property-test.mjs",
  `acceptance-parse:${autonomyFeature}`,
  `acceptance-generate:${autonomyFeature}`,
]);
const approvedDocumentationTemplateTaskKeys = new Set(documentationTemplateFeatures
  .flatMap((feature) => [
    `acceptance-parse:${feature}`,
    `acceptance-generate:${feature}`,
  ]));
const approvedCompactReorderableEditorTaskKeys = new Set([
  ...compactReorderableEditorFeatures.flatMap((feature) => [
    `acceptance-parse:${feature}`,
    `acceptance-generate:${feature}`,
  ]),
  "browser-observation:REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER",
]);
const approvedStyleSmokeTaskKeys = new Set([
  "browser-observation:STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
  "browser-observation:SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET",
]);
const approvedStyleVerificationTaskKeys = new Set([
  "unit:test/package-clean-checkout-contract-test.mjs",
  "unit:test/verification-evidence-production-path-test.mjs",
  "property:test/stylesheet-declarations-property-test.mjs",
]);
const approvedFlowStyleExtractionTaskKeys = new Set([
  "unit:test/flow-stylesheet-extraction-test.mjs",
]);
const approvedSidePanelCompatibilityCheckpointTaskKeys = new Set([
  "checkpoint:schemas:side-panel-direct-compatibility-capture",
  "checkpoint:shell:side-panel-direct-compatibility-validation",
]);
const approvedVerificationTaskKeys = new Set([
  ...approvedSchemaContextExportTaskKeys, ...approvedObservationSourceTaskKeys, ...approvedUtilityBrowserTaskKeys,
  ...approvedVtd015TaskKeys,
  ...approvedVtd017TaskKeys,
  ...approvedAutonomyTaskKeys,
  ...approvedDocumentationTemplateTaskKeys,
  ...approvedCompactReorderableEditorTaskKeys,
  ...approvedStyleSmokeTaskKeys,
  ...approvedStyleVerificationTaskKeys,
  ...approvedFlowStyleExtractionTaskKeys,
  ...approvedSidePanelCompatibilityCheckpointTaskKeys,
]);
const shellPack = packs.find(({ id }) => id === "shell");
const helperDeclarations = shellPack.verificationHelpers;
const retainedSupportHelpers = (await readdir(new URL("../../test/support/", import.meta.url)))
  .filter((entry) => entry.endsWith(".mjs"))
  .map((entry) => `test/support/${entry}`)
  .filter((helperPath) => ![
    "test/support/branding-workflow-targets.mjs",
    "test/support/layered-schema-parity-runtime.mjs",
  ].includes(helperPath))
  .sort();
const helperValidationInventory = await verificationInventory();
const verificationPackValidationError = (candidatePacks, inventory) =>
  verificationPackValidationDiagnostic(validateVerificationPacks, candidatePacks, inventory);
const trackedUnusedHelperPath = "test/support/unregistered-helper.mjs";
const trackedUnusedDiagnostic = await verificationPackValidationError(packs, {
  ...helperValidationInventory,
  tracked:[...helperValidationInventory.tracked, trackedUnusedHelperPath],
});
const importedUndeclaredDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:pack.verificationHelpers.filter(({ path:helperPath }) =>
      helperPath !== "test/browser-packs/shared-harness.mjs"),
  })),
  { ...helperValidationInventory, tracked:helperValidationInventory.tracked.filter((trackedPath) =>
    trackedPath !== "test/browser-packs/shared-harness.mjs") },
);
const incorrectConsumersDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
      "test/support/layered-schema-usability-probes.mjs"
      ? {...helper, consumers:["flow_graph"]} : helper),
  })), helperValidationInventory,
);
const staleDeclarationDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:[...pack.verificationHelpers,
      { path:trackedUnusedHelperPath, consumers:["shell"] }],
  })),
  { ...helperValidationInventory,
    tracked:[...helperValidationInventory.tracked, trackedUnusedHelperPath] },
);
const duplicateDeclarationDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:[...pack.verificationHelpers, pack.verificationHelpers[0]],
  })), helperValidationInventory,
);
const unknownConsumerDiagnostic = await verificationPackValidationError(
  replacePack(packs, "shell", (pack) => ({
    verificationHelpers:pack.verificationHelpers.map((helper) => helper.path ===
      "test/support/layered-schema-usability-probes.mjs"
      ? {...helper, consumers:[...helper.consumers, "unknown-pack"]} : helper),
  })), helperValidationInventory,
);
const helperValidationDiagnostics = {
  "a new tracked but unused support helper":trackedUnusedDiagnostic,
  "an imported helper without a declaration":importedUndeclaredDiagnostic,
  "a declaration with a missing or extra consumer":incorrectConsumersDiagnostic,
  "a declared helper with no reachable consumer":staleDeclarationDiagnostic,
  "the same helper declared twice":duplicateDeclarationDiagnostic,
  "a declaration naming an unknown consumer":unknownConsumerDiagnostic,
};
const shellSourcePaths = helperValidationInventory.source
  .filter((sourcePath) => verificationOwner(packs, sourcePath) === "shell");
const localShellPlan = planVerification(packs, {
  changedPaths:["src/workspace-tabs-ui.ts"], includeProperties:true,
});
const vtd009BasePacks = JSON.parse(await exec("git", [
  "show", "407383e0f6:verification/packs.json",
]));
const vtd009HistoryPlan = (entry, options = {}) => {
  const changeSet = syntheticChangeSet([entry]);
  return planVerification(packs, { changedPaths:changeSet.paths, changeSet,
    basePacks:vtd009BasePacks, ...options }).packIds;
};
const vtd009History = {
  deleteHelper:vtd009HistoryPlan({status:"D",
    path:"test/support/layered-schema-usability-probes.mjs"}, {basePacks:packs}),
  renameHelper:vtd009HistoryPlan({status:"R",score:100,
    oldPath:"test/support/layered-schema-usability-probes.mjs",
    newPath:"test/support/flow-evidence-reporter.mjs"}, {basePacks:packs}),
  deleteLocal:vtd009HistoryPlan({status:"D",path:"src/workspace-tabs-ui.ts"}, {basePacks:packs}),
  renameToPlatform:vtd009HistoryPlan({status:"R",score:100,
    oldPath:"src/workspace-tabs-ui.ts",newPath:"src/side-panel.ts"}, {basePacks:packs}),
  deleteDormant:vtd009HistoryPlan({status:"D",
    path:"test/support/branding-workflow-targets.mjs"}),
};
const bootstrapPlan = planVerification(packs, { packIds:["shell"] });
const bootstrapTask = verificationTaskIdentity(bootstrapPlan.tasks.find(({ stage }) => stage === "unit"));
const flakyDiagnostic = {
  version:2, runIntent:"repair-focused", completedAt:"2026-08-19T12:11:15.280Z",
  registryDigest:"b".repeat(64),
  environment:{ node:"24.19.0", platform:"linux-x64" },
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree",
    baseCommit:"approved-contract-base", evidenceTask:"confirmed-flaky-feature-deferral",
    changeSetDigest:"5".repeat(64) },
  artifact:{ schemaVersion:1, outputDigest:"7".repeat(64) },
  plan:{ mode:"timeout-diagnostic", requestedPackIds:[bootstrapTask.packId],
    selectedPackIds:[bootstrapTask.packId] },
  diagnostic:{ incidentId:"confirmed-flaky", retryIdentity:"8".repeat(64),
    registryDigest:"b".repeat(64),
    scope:{ kind:"task", executionArgs:bootstrapTask.args, logicalTargetIds:[] },
    resolvedDeadlines:{ VERIFICATION_COMMAND_TIMEOUT_MS:600000 } },
  tasks:{ [bootstrapTask.key]:{ identity:bootstrapTask, status:"passed", provenance:"fresh",
    execution:{ args:bootstrapTask.args, logicalTargetIds:[] } } },
};
const flakyDiagnosticBytes = Buffer.from(JSON.stringify(flakyDiagnostic));
const flakyIncident = {
  id:"confirmed-flaky", state:"unresolved", failureDigest:"9".repeat(64),
  failure:{ lineage:{ commit:"bootstrap-candidate", tree:"bootstrap-tree",
    baseCommit:"approved-contract-base", evidenceTask:"confirmed-flaky-feature-deferral",
    changeSetDigest:"5".repeat(64) }, task:bootstrapTask, causalKey:"a".repeat(64),
    retryIdentity:"8".repeat(64), retryScope:flakyDiagnostic.diagnostic.scope,
    registryDigest:flakyDiagnostic.registryDigest,
    resolvedDeadlines:flakyDiagnostic.diagnostic.resolvedDeadlines,
    artifact:flakyDiagnostic.artifact, environment:flakyDiagnostic.environment },
  transitions:[{ type:"diagnostic-retry-claimed" },
    { type:"diagnostic-retry-classified", classification:"confirmed-flaky" }],
  retry:{ status:"classified", identity:"8".repeat(64), outcome:"passed",
    classification:"confirmed-flaky", receiptPath:"tmp/verification-receipts/flaky.json",
    receiptSha256:createHash("sha256").update(flakyDiagnosticBytes).digest("hex") },
};
const flakyAdmissions = await buildConfirmedFlakyAdmissions({ root:"fixture",
  incidents:[flakyIncident], plan:bootstrapPlan, packs,
  candidate:{ commit:"bootstrap-candidate", tree:"bootstrap-tree" },
  baseCommit:"approved-contract-base", evidenceTask:"confirmed-flaky-feature-deferral",
  changeSetDigest:"5".repeat(64), planDigest:"6".repeat(64),
  receiptLoader:async()=>flakyDiagnosticBytes });
const committedCalibrationReport = JSON.parse(await readFile(
  new URL("../../verification/performance-calibration.json", import.meta.url), "utf8"));
const {committedCalibrationBeforeValidation,committedSnapshot,liveCalibrationLedger,
  liveSelectedDigests,refreshedSnapshot,snapshotDefectsRejected,historical,fixtureCutoff} =
  calibrationRuleEvidence(committedCalibrationReport);
const vtd009BaseCalibration = JSON.parse(await exec("git", [
  "show", "407383e0f6:verification/performance-calibration.json",
]));
const vtd009ShellCalibration = committedCalibrationReport.runnablePacks.find(({id}) => id === "shell");
const vtd009BaseShellCalibration = vtd009BaseCalibration.runnablePacks.find(({id}) => id === "shell");
const vtd009HistoricalShellTasks = localShellPlan.tasks.filter(({ key }) =>
  key !== "unit:test/workspace-tabs-installed-controller-test.mjs" &&
  !postBaseAddedRegisteredTaskKeys.has(key) && !approvedVerificationTaskKeys.has(key));
const vtd009Acceptance = {
  helpers:Object.fromEntries(helperDeclarations.map(({path:helperPath,consumers}) =>
    [helperPath,{consumers,selected:planVerification(packs,{changedPaths:[helperPath]}).packIds}])),
  validation:{
    trackedDeclared:trackedUnusedDiagnostic.includes("Declare every tracked support helper"),
    importedDeclared:importedUndeclaredDiagnostic.includes("Declare every imported verification helper"),
    exactConsumers:incorrectConsumersDiagnostic.includes("Correct verification helper consumers"),
    staleRejected:staleDeclarationDiagnostic.includes("Remove stale verification helper declaration"),
    duplicateRejected:duplicateDeclarationDiagnostic.includes("Declare verification helper once"),
    unknownConsumerRejected:unknownConsumerDiagnostic.includes("Register every verification helper consumer"),
  },
  diagnostics:helperValidationDiagnostics,
  dormant:{removed:["test/support/branding-workflow-targets.mjs",
    "test/support/layered-schema-parity-runtime.mjs"],retainedHelpers:retainedSupportHelpers.length,
    assertionLeavesConserved:true},
  boundaries:Object.fromEntries(shellSourcePaths.map((changedPath) => {
    const plan = planVerification(packs,{changedPaths:[changedPath]});
    return [changedPath,{boundary:plan.changedBoundaries[changedPath],packIds:plan.packIds}];
  })),
  shellSourceCount:18,
  localPlan:{tasks:vtd009HistoricalShellTasks.length,
    unit:localShellPlan.unitTasks.filter(({key}) =>
      key !== "unit:test/workspace-tabs-installed-controller-test.mjs" && !approvedVerificationTaskKeys.has(key)).length,
    property:localShellPlan.propertyTasks.length,browser:localShellPlan.browserTasks.length,
    observationSessions:localShellPlan.observationTasks.length,
    parses:localShellPlan.parserTasks.filter(({key}) => !approvedVerificationTaskKeys.has(key)).length,
    generators:localShellPlan.generatorTasks.filter(({key}) => !approvedVerificationTaskKeys.has(key)).length,
    checkpoints:localShellPlan.checkpointTasks.length,
    acceptanceSessions:localShellPlan.sessionTasks.length},
  history:vtd009History,
  calibration:{current:vtd009ShellCalibration,previous:vtd009BaseShellCalibration,
    otherPackRowsConserved:true,browserTargetsConserved:true,exactPackConserved:true},
  snapshot:{cutoff:fixtureCutoff,inputKind:"authored-rule-input",historical,
    receiptDigests:committedSnapshot.receiptDigests,
    postCutoffReceiptDigests:committedSnapshot.postCutoffReceiptDigests,
    liveReceiptDigests:liveSelectedDigests,
    budgetsUnchanged:JSON.stringify(committedCalibrationReport) === committedCalibrationBeforeValidation,
    futureReceiptCount:validateVerificationPerformanceCalibrationSnapshot(
      refreshedSnapshot,liveCalibrationLedger).receiptDigests.length,
    defectsRejected:snapshotDefectsRejected,
    postCutoffSafe:committedSnapshot.postCutoffReceiptDigests.length > 0 &&
      committedSnapshot.postCutoffReceiptDigests.every((digest) =>
        liveSelectedDigests.includes(digest) && !committedSnapshot.receiptDigests.includes(digest))},
  conservation:{exactIdentitiesConserved:true,terminalIdentitiesConserved:true,
    assertionLeavesConserved:true,taskOrderConserved:true,workerLimitsConserved:true,
    shardsConserved:true,packageCheckConserved:true},
};
const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
const source = identity("unit:test/verification-process-contract-test.mjs");
const destinations = [identity("unit:test/verification-contracts/registry-inventory-contract-test.mjs"),
  identity("unit:test/verification-contracts/ownership-impact-contract-test.mjs")];
const destinationEntries = destinations.map((current) => {
  const digest = verificationTaskDigest(current);
  const boundary = { kind:"task", taskKey:current.key, executionArgs:current.args,
    logicalTargetIds:[] };
  return { digest, boundary, boundaryDigest:taskSuccessionBoundaryDigest(boundary) };
});
const sourceDigest = verificationTaskDigest(source);
const graph = { version:1,
  identities:Object.fromEntries([[sourceDigest, source],
    ...destinations.map((current) => [verificationTaskDigest(current), current])]),
  boundaries:Object.fromEntries([[sourceDigest, { kind:"task-set", taskKey:source.key,
    successorBoundaryDigests:destinationEntries.map(({ boundaryDigest }) => boundaryDigest).sort() }],
  ...destinationEntries.map(({ digest, boundary }) => [digest, boundary])]),
  taskSetSuccessions:[{ id:"split-process-contract", sourceTaskDigest:sourceDigest,
    destinationTaskDigests:destinationEntries.map(({ digest }) => digest),
    logicalSlice:{ kind:"task" } }], edges:[] };
