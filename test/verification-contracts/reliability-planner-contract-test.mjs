import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rename, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { decideBrowserObservationWorkers } from "../../scripts/shared-artifact-parallel.mjs";
import { verificationPacksAtCommit } from "../../scripts/verification-changes.mjs";
import { intentOwnershipReadiness } from "../../scripts/verification-ownership-readiness-core.mjs";
import { removeVerificationFixtureRoot } from "../support/verification-cleanup.mjs";
import {
  assertReadOnlyArtifactLease,
  captureRequiredRejection,
  unreadableConsumerEvidence,
  verificationPackValidationDiagnostic,
} from "../support/verification-contract-boundary-helpers.mjs";
import { estimatePlanMilliseconds, reportVerificationThroughput, validateVerificationPerformanceCalibrationSnapshot } from "../../scripts/report-verification-throughput.mjs";
import { buildCanonicalTimingLedger } from "../../scripts/verification-timing-ledger.mjs";
import { compatibleTimeoutRepairIncidentIds, applyCheckpointPrerequisitePlan, bindVerificationChangeScope, closeVerificationPlanPrerequisites, createCheckpointIdentityGuard, createVerificationCommandRunner, createVerificationReceiptContext, coordinatorArtifactLeaseRequired, executeTimeoutRepairTaskPlan, enforceTerminalClosureReceipt, focusedAcceptanceOptions, planPackageTask, selectFocusedVerificationTasks, prepareCheckpointExecution, reliabilityAdmissionPartition, resumeVerificationPlan, reviewReadyScopeGuardRequired, runTimeoutRepairFocused, runTimeoutDiagnosticRetry, validateExplicitChangedPaths, validateRegistryCardinalityReviewPreflight, verificationArtifactIdentity, verificationPromotionTasks } from "../../scripts/run-focused-acceptance.mjs";
import { candidatePredatesRunIntentImplementation, closeCanonicalEvidencePlanPrerequisites, firstCanonicalDifference, legacyArchivedCheckpointTaskIdentities, legacyAcceptanceSessionPrerequisiteCompatibility, preflightGitNotePromotion, requireEvidenceReceiptRunIntent, verificationDigest } from "../../scripts/verification-evidence.mjs";
import { planVerification, verificationOwner, verificationTaskIdentity } from "../../scripts/verification-planner/tasks/planner.mjs";
import { executeAcceptancePlan } from "../../scripts/verification-execution/execute.mjs";
import { loadVerificationPacks, validateIsolatedVerificationHandlers, validateVerificationPacks, verificationInventory } from "../../scripts/verification-registry/validation.mjs";
import { classifyHistoricalTimeoutFixture, createTimeoutIncidentStore, createVerificationProgressTracker, deriveTaskCheckpointRepairProof, diagnosticRetryScope, reliabilityFailureFingerprint, resolvedVerificationDeadlines, timeoutIncidentDigest, timeoutRepairCausalCategory, timeoutRepairDiagnosedBoundary, timeoutRepairFocusedExecutionTaskPlan, timeoutRepairPackageTaskIdentity, timeoutRepairPackIds, timeoutRepairFocusedTaskPlan, timeoutResolutionEvidence, validateTimeoutRepairProposal, verificationProgressEmitter } from "../../scripts/verification-reliability-incidents.mjs";
import { canonicalCheckpointBinding } from "../../scripts/verification-reliability-receipts.mjs";
import { confirmedFlakyAdmissionCoversEvidenceCandidate } from "../../scripts/verification-reliability-evidence-policy.mjs";
import { bindRunIntentBootstrapPlan, blockedAggregateEvidenceRoute, blockedAggregatePreparationBaseCommit, blockedAggregatePreparationEvidenceTask, blockedAggregatePreparationPaths, buildConfirmedFlakyAdmissions, buildEligibleRepairAdmissions, bootstrapReviewIncidentProof, eligibleRepairAdmissionCandidates, governedRepairAttemptAssociation, revalidateConfirmedFlakyAdmissions, revalidateEligibleRepairAdmissions, registryPlannerPreparationFocusedPlan, requireVerificationRunIntent, runIntentBootstrapCoverage, validateEligibleRepairAdmissionsReceipt, validateConfirmedFlakyAdmissionsReceipt, validateRunIntentBootstrapBase, validateRunIntentBootstrapReceipt, verificationRegistryPlannerBootstrapEligibility, verificationRunIntent, verificationRunIntents } from "../../scripts/verification-run-intent.mjs";
import { persistBootstrapTerminalObligationSourceReceipt, readBootstrapTerminalObligationSourceReceipt, verifyCommittedReviewTransaction } from "../../scripts/settled-final-verification.mjs";
import { browserTargetSuccessionBoundary, loadTaskSuccessionGraph, resolveIncidentTaskSuccession, resolveTaskSuccessionGraph, taskSuccessionBoundaryDigest, validateUnresolvedIncidentTaskSuccession, verificationTaskDigest } from "../../scripts/verification-task-succession.mjs";
import { defaultRepositoryRuntimeDirectory, defaultStoreDirectory, validateIncident } from "../../scripts/verification-reliability-persistence.mjs";
import { verificationPolicyContracts } from "../../scripts/verification-policy/contracts.mjs";
import {
  createTerminalClosurePolicy,
  exactBootstrapTerminalObligation,
  terminalLineageSource,
  terminalClosurePolicyValid,
} from "../../scripts/verification-policy/reliability/terminal-closure.mjs";
import { createVerificationPackCardinalityAdapter } from
  "../../scripts/verification-pack-cardinality/contract.mjs";
import { terminalProjectionCoverage, terminalProjectionCoverageValid } from "../../scripts/verification-reliability-deferred.mjs";
import { recordEligibleIncidentDeferral, reviewAdmissionTransactionOwnsDeferrals } from "../../scripts/verification-reliability-runtime.mjs";
import { boundedClosureContractRevision, boundedClosureEvidenceTask, causalFailureIdentity, classifyReliabilityFailureDomain, closureDisposition, completeTaskInputClosure, inputEquivalentTaskProof, reliabilityFailureContract, terminalClosureExecution } from "../../scripts/verification-reliability-closure.mjs";
import { createVerificationLaunchAuthorizations, expandVerificationTaskPrerequisites, normalizeBrowserPrerequisiteTasks, preflightExecutionPrerequisites, probeExecutionPrerequisiteEnvironment, verificationPrerequisiteKindRegistry, verificationRunnerModeRegistry } from "../../scripts/verification-execution-prerequisites.mjs";
import { canonicalFlowReloadIdentity, classifyFlowReloadModes, flowReloadCausalKey, observeFlowReloadLifecycle } from "../../scripts/flow-reload-lifecycle.mjs";
import { defaultCheckpointAttemptDirectory } from "../../scripts/verification-checkpoint-attempt.mjs";
import {
  blockedAggregateRouteIdentity,
  createBlockedAggregateAdmissionSnapshot,
  createBlockedAggregateObligation,
  deriveConservedCorrectionDeltaIdentity,
  validateInheritedBlockedAggregateAdmission,
  decideBlockedAggregateConsumption,
  partitionBlockedAggregateExecution,
  sealBlockedAggregateObligation,
  validateBlockedAggregateLineageAdmission,
  validateBlockedAggregateAdmissionSnapshot,
  validateBlockedAggregateSource,
  validateConservedCorrectionDeltaIdentity,
  validateInheritedBlockedAggregatePreflight,
} from "../../scripts/verification-policy/reliability/blocked-aggregate.mjs";
const registryPlannerPreparationOptions = focusedAcceptanceOptions([
  "--pack", "shell", "--pack", "verification_process", "--changed-since", "base",
  "--prepare-evidence", "verification-slice-verification-registry-planner-modularization",
  "--run-intent-bootstrap",
  "--focused-task", "unit:test/modular-utility-architecture-test.mjs",
  "--focused-task", "unit:test/verification-pack-cardinality-contract-test.mjs",
  ...verificationPolicyContracts.flatMap(({testPaths})=>testPaths.flatMap((testPath)=>
    ["--focused-task",`unit:${testPath}`])),
]);
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
const sharedArtifactEvents = [];
let releaseSharedArtifact;
const sharedArtifactPlan = {
  preparationTasks:[{
    key:"build:dist", stage:"build", executable:"npm", args:["run", "build"],
    display:"npm run build",
  }],
  unitTasks:[], propertyTasks:[], browserTasks:[], parserTasks:[], generatorTasks:[],
  checkpointTasks:[], sessionTasks:[], unitCommands:[], parserCommands:[],
  observationTasks:["one", "two"].map((name) => ({
    key:`browser-observation:${name}`, stage:"browser-observation", packId:name,
    executable:"node", args:[name], target:name, display:`node ${name}`,
  })),
};
let activeSharedArtifactTasks = 0;
let maximumSharedArtifactTasks = 0;
const sharedArtifactMetrics = await executeAcceptancePlan(sharedArtifactPlan, {
  observationConcurrency:2,
  acquireArtifactLease:async() => {
    sharedArtifactEvents.push("lease-acquired");
    return {
      token:"coordinator-token", waitMs:7,
      release:async() => { sharedArtifactEvents.push("lease-released"); releaseSharedArtifact?.(); },
    };
  },
  afterPreparation:async() => sharedArtifactEvents.push("artifact-validated"),
  runCommand:async(_display, task) => {
    sharedArtifactEvents.push(`start:${task.key}`);
    if (task.stage === "build") return;
    assertReadOnlyArtifactLease(task);
    activeSharedArtifactTasks += 1;
    maximumSharedArtifactTasks = Math.max(maximumSharedArtifactTasks, activeSharedArtifactTasks);
    await new Promise((resolve) => setTimeout(resolve, 20));
    activeSharedArtifactTasks -= 1;
    sharedArtifactEvents.push(`finish:${task.key}`);
  },
});
const acceptedThreeWorkers = decideBrowserObservationWorkers({
  acceptedTwoWorker:{ mode:"normal", packId:"layered_schema", durationMs:220_000, passed:true },
  candidateThreeWorkerNormal:{ mode:"normal", packId:"layered_schema", durationMs:150_000,
    passed:true, collisions:[] },
  candidateThreeWorkerLoaded:{ mode:"loaded", packId:"layered_schema", durationMs:165_000,
    passed:true, collisions:[] },
});
let outsideWriterWasBlocked = false;
let failedParallelLeaseReleased = false;
const packs = await loadVerificationPacks();
await validateVerificationPacks(packs);
const cardinalityProcessInput = {
  evidenceTask:"registry-derived-verification-packs",
  packs,
  plan:{
    changedPaths:["scripts/verification-pack-cardinality/contract.mjs"],
    tasks:["unit:test/verification-pack-cardinality-contract-test.mjs",
      "unit:test/settled-final-verification-workflow-test.mjs",
      "unit:test/verification-evidence-production-path-test.mjs",
      "unit:test/verification-process-contract-test.mjs",
      "property:test/workspace-tabs-property-test.mjs", "acceptance-session:shell",
      "package:extension"].map((key) => ({ key })),
    includeProperties:true,
  },
  terminalFull:false,
};
assert.throws(() => validateRegistryCardinalityReviewPreflight({
  ...cardinalityProcessInput,
  packs:packs.map((pack) => pack.id === "shell"
    ? { ...pack, globalImpact:[...pack.globalImpact, "scripts/verification-pack-cardinality/"] }
    : pack),
}), /globally impactful/u,
"the process preflight rejects restored cardinality global impact");
assert.throws(() => validateRegistryCardinalityReviewPreflight({
  ...cardinalityProcessInput,
  packs:packs.map((pack) => pack.id === "shell" ? {
    ...pack,
    verificationSlices:pack.verificationSlices.map((slice) =>
      slice.id === "verification_pack_cardinality_contract"
        ? { ...slice, consumers:[{ packId:"shell", sliceId:"eligible_repair_admission" }] }
        : slice),
  } : pack),
}), /exact verification_process task-batching consumer/u,
"the process preflight rejects a cardinality registry consumer");
await assert.rejects(() => validateVerificationPacks(packs.map((pack) =>
  pack.id === "project_management" ? { ...pack, executionPrerequisites:[{
    path:"test/flow-examples-timing-test.mjs", requiredCapabilities:["local-loopback"],
  }] } : pack)), /exact registered test execution prerequisite in pack project_management/u,
"a pack cannot grant authority to a task owned by another pack");
const focusedVerificationProcessPlan = selectFocusedVerificationTasks(planVerification(packs, {
  packIds:["verification_process"],
}), ["unit:test/verification-contracts/execution-prerequisite-contract-test.mjs"]);
assert.deepEqual(focusedVerificationProcessPlan.tasks.map(({ key }) => key),
  ["unit:test/verification-contracts/execution-prerequisite-contract-test.mjs"],
"the focused delivery path launches the exact registered unit leaf without unrelated work");
const shortChromeUnitTasks = planVerification(packs, {
  packIds:["flow_graph", "shell"],
}).unitTasks.filter(({ target }) => [
  "test/flow-examples-timing-test.mjs",
  "test/headless-chrome-lifecycle-test.mjs",
].includes(target));
assert.equal(shortChromeUnitTasks.length, 2,
  "both nested production probes remain registered verification tasks");
for (const task of shortChromeUnitTasks) {
  assert.equal(task.temporaryPathClass, "chrome-short",
    `${task.target} receives its short Chrome route before first launch`);
  assert.deepEqual(task.requiredCapabilities, ["local-loopback"],
    `${task.target} declares Chrome socket authority before first launch`);
  assert.equal(Object.hasOwn(verificationTaskIdentity(task), "temporaryPathClass"), false,
    `${task.target} routing metadata does not change canonical topology identity`);
}
const modularVtd007HandlerSource = await readFile(new URL(
  "../../acceptance/src/acceptance/verification_support/modular_architecture_vtd007_handlers.clj",
  import.meta.url), "utf8");
assert.match(modularVtd007HandlerSource,
  /run-focused-acceptance\.mjs[\s\S]*--focused-task[\s\S]*flow-examples-timing-test\.mjs/u,
  "the nested Flow production probe enters through the registered focused launcher");
assert.match(modularVtd007HandlerSource,
  /run-focused-acceptance\.mjs[\s\S]*--focused-task[\s\S]*headless-chrome-lifecycle-test\.mjs/u,
  "the nested lifecycle production probe enters through the registered focused launcher");
assert.doesNotMatch(modularVtd007HandlerSource,
  /shell\/sh\s+"node"\s+"test\/(?:flow-examples-timing|headless-chrome-lifecycle)-test\.mjs"/u,
  "the acceptance handler cannot bypass focused routing with a raw registered test command");
assert.match(modularVtd007HandlerSource,
  /prepared-task\s+"unit:test\/flow-examples-timing-test\.mjs"/u,
  "the Flow production probe consumes its declared strict-receipt predecessor");
assert.match(modularVtd007HandlerSource,
  /planVerification\(delivered,\{packIds:historicalIds,includeProperties:true,historicalRegistryFallback:true\}\)/u,
  "the delivered registry comparison uses its historical runnable set and explicit compatibility");
assert.match(modularVtd007HandlerSource,
  /planVerification\(base,\{packIds:historicalIds,includeProperties:true,historicalRegistryFallback:true\}\)/u,
  "the base registry comparison uses the delivered historical runnable set and explicit compatibility");
assert.match(modularVtd007HandlerSource,
  /strictCurrentAmbiguityRejected[\s\S]*explicit verification-only production owner/u,
  "the historical adapter does not relax ambiguous current-registry ownership");
assert.doesNotMatch(modularVtd007HandlerSource,
  /planVerification\(current,\{(?:packIds:ids,includeProperties:true|terminalFull:true),historicalRegistryFallback:true\}\)/u,
  "current registry comparisons remain on strict ownership validation");
const modularVtd014HandlerSource = await readFile(new URL(
  "../../acceptance/src/acceptance/verification_support/modular_architecture_vtd014_handlers.clj",
  import.meta.url), "utf8");
assert.match(modularVtd014HandlerSource,
  /scoped-command-approval\|bwrap-shared-loopback[\s\S]*workspace-sandbox\|bwrap-unshared-network/u,
  "acceptance evidence matches the tested mixed-plan capability isolation boundaries");
const modularVtd006HandlerSource = await readFile(new URL(
  "../../acceptance/src/acceptance/verification_support/modular_architecture_vtd006_handlers.clj",
  import.meta.url), "utf8");
assert.match(modularVtd006HandlerSource,
  /defn- inventory-handlers[\s\S]*assoc \(prepared world\)[\s\S]*pack-facts world/u,
  "the VTD-006 inventory boundary loads production evidence before reading pack facts");
const modularEventLibraryHandlerSource = await readFile(new URL(
  "../../acceptance/src/acceptance/verification_support/modular_architecture_event_library_handlers.clj",
  import.meta.url), "utf8");
assert.match(modularEventLibraryHandlerSource, /= \[9 1 8 3 0 1 29\]/u,
  "Event Library acceptance conserves the exact 29-task accepted-base plan");
const focusedPropertyPlan = selectFocusedVerificationTasks(planVerification(packs, {
  packIds:["shell"], includeProperties:true,
}), ["property:test/workspace-tabs-property-test.mjs"]);
assert.deepEqual(focusedPropertyPlan.tasks.map(({ key }) => key),
  ["property:test/workspace-tabs-property-test.mjs"],
"the focused delivery path launches the exact registered property leaf");
const focusedAcceptancePlan = selectFocusedVerificationTasks(planVerification(packs, {
  packIds:["shell"],
}), ["acceptance-session:shell"], planVerification(packs, {
  packIds:timeoutRepairPackIds, includeProperties:true,
}));
assert.equal(focusedAcceptancePlan.tasks[0].key, "build:dist");
assert.equal(focusedAcceptancePlan.tasks.at(-1).key, "acceptance-session:shell");
assert.deepEqual(focusedAcceptancePlan.tasks.at(-1).requiredCapabilities, [],
  "an acceptance session does not inherit authority from separately launched unit tasks");
assert.equal(focusedAcceptancePlan.tasks.at(-1).temporaryPathClass, "workspace",
  "an acceptance session keeps its own workspace route");
const currentAcceptanceIdentity = verificationTaskIdentity(focusedAcceptancePlan.tasks.at(-1));
const legacyAcceptancePrerequisite = {
  key:currentAcceptanceIdentity.key,
  requiredCapabilities:["local-loopback"], route:"scoped-command-approval",
};
const legacyAcceptanceResult = {
  identity:{ ...currentAcceptanceIdentity, requiredCapabilities:["local-loopback"] },
  executionPrerequisites:{
    requiredCapabilities:["local-loopback"], launchRoute:"scoped-command-approval",
  },
};
assert.equal(legacyAcceptanceSessionPrerequisiteCompatibility({
  allowed:true, task:focusedAcceptancePlan.tasks.at(-1), identity:currentAcceptanceIdentity,
  prerequisite:legacyAcceptancePrerequisite, result:legacyAcceptanceResult,
}), true, "archived incident evidence accepts the former inherited acceptance-session route");
assert.equal(legacyAcceptanceSessionPrerequisiteCompatibility({
  allowed:false, task:focusedAcceptancePlan.tasks.at(-1), identity:currentAcceptanceIdentity,
  prerequisite:legacyAcceptancePrerequisite, result:legacyAcceptanceResult,
}), false, "new checkpoints cannot opt into the historical acceptance-session route");
assert.equal(legacyAcceptanceSessionPrerequisiteCompatibility({
  allowed:true, task:focusedAcceptancePlan.tasks.at(-1), identity:currentAcceptanceIdentity,
  prerequisite:legacyAcceptancePrerequisite,
  result:{ ...legacyAcceptanceResult, executionPrerequisites:{
    requiredCapabilities:["local-loopback"], launchRoute:"workspace-sandbox",
  } },
}), false, "archived route compatibility remains bound to its recorded execution result");
assert.ok(focusedAcceptancePlan.parserTasks.length > 0 &&
  focusedAcceptancePlan.parserTasks.length === focusedAcceptancePlan.generatorTasks.length &&
  focusedAcceptancePlan.unitTasks.length > 0 && focusedAcceptancePlan.browserTasks.length > 0 &&
  focusedAcceptancePlan.tasks.some(({ key }) => key === "unit:test/flow-examples-timing-test.mjs"),
"the focused acceptance session retains every owning strict-receipt prerequisite");
const ordinaryShellPlan = closeVerificationPlanPrerequisites(planVerification(packs, {
  packIds:["shell"],
}), planVerification(packs, { packIds:timeoutRepairPackIds }));
assert.ok(ordinaryShellPlan.tasks.some(({ key }) => key === "unit:test/flow-examples-timing-test.mjs"),
  "ordinary pack execution receives the same cross-pack strict-receipt closure");
assert.ok(ordinaryShellPlan.tasks.indexOf(ordinaryShellPlan.tasks.find(({ key }) =>
  key === "unit:test/flow-examples-timing-test.mjs")) <
  ordinaryShellPlan.tasks.indexOf(ordinaryShellPlan.tasks.find(({ key }) =>
    key === "acceptance-session:shell")),
"the ordinary cross-pack predecessor runs before its acceptance consumer");
const evidenceCommandPaletteShellPlan = closeCanonicalEvidencePlanPrerequisites(
  planVerification(packs, {
    packIds:["command-palette", "shell"],
    includeProperties:true,
  }),
  packs,
);
assert.deepEqual(evidenceCommandPaletteShellPlan.requestedPackIds,
  ["command-palette", "shell"],
  "evidence prerequisite closure does not widen the requested pack set");
assert.ok(evidenceCommandPaletteShellPlan.tasks.some(({ key }) =>
  key === "unit:test/flow-examples-timing-test.mjs"),
"evidence validation uses the repository-wide canonical satisfier registry");
const runnerCommandPaletteShellPlan = closeVerificationPlanPrerequisites(
  planVerification(packs, {
    packIds:["command-palette", "shell"],
    includeProperties:true,
  }),
  planVerification(packs, {
    packIds:timeoutRepairPackIds,
    includeProperties:true,
  }),
);
assert.deepEqual(evidenceCommandPaletteShellPlan.tasks.map(({ key }) => key),
  runnerCommandPaletteShellPlan.tasks.map(({ key }) => key),
  "runner and evidence validation close over the same exact task identities");
const prerequisiteTerminalPlan = planVerification(packs, { terminalFull:true });
const closedTerminalPlan = closeVerificationPlanPrerequisites(prerequisiteTerminalPlan,
  planVerification(packs, { packIds:timeoutRepairPackIds,
    includeProperties:prerequisiteTerminalPlan.includeProperties }));
assert.ok(closedTerminalPlan.tasks.some(({ key }) =>
  key === "checkpoint:shell:prepared-dist-freshness"),
"terminal-only requested leaves remain registered while canonical prerequisites are added");
assert.equal(new Set(closedTerminalPlan.tasks.map(({ key }) => key)).size,
  closedTerminalPlan.tasks.length,
  "terminal prerequisite closure records each canonical or requested task exactly once");
const repairCanonicalPlan = planVerification(packs, {
  packIds:timeoutRepairPackIds, includeProperties:true,
});
const repairHotkeysPlan = selectFocusedVerificationTasks(repairCanonicalPlan,
  ["acceptance-session:hotkeys"]);
assert.deepEqual(repairHotkeysPlan.tasks.map(({ key }) => key), [
  "build:dist",
  "unit:test/hotkey-installed-controller-test.mjs",
  "browser:test/browser-packs/hotkeys.mjs",
  "acceptance-parse:features/side-panel-hotkey-editor.feature",
  "acceptance-parse:features/side-panel-hotkey-keymap.feature",
  "acceptance-parse:features/side-panel-hotkey-operator-layout.feature",
  "acceptance-generate:features/side-panel-hotkey-editor.feature",
  "acceptance-generate:features/side-panel-hotkey-keymap.feature",
  "acceptance-generate:features/side-panel-hotkey-operator-layout.feature",
  "acceptance-session:hotkeys",
], "repair-focused acceptance closes over only the owning pack's canonical predecessors");
assert.equal(new Set(repairHotkeysPlan.tasks.map(({ key }) => key)).size,
  repairHotkeysPlan.tasks.length,
  "repair-focused prerequisite closure records each predecessor and leaf once");
const repairCanonicalIdentities = repairCanonicalPlan.tasks.map(verificationTaskIdentity);
const repairIdentity = (key) => repairCanonicalIdentities.find((identity) => identity.key === key);
const repairExecutionPlan = timeoutRepairFocusedExecutionTaskPlan([
  { identity:repairIdentity("acceptance-session:hotkeys"), roles:["diagnosed-boundary"] },
  { identity:repairIdentity("unit:test/hotkey-installed-controller-test.mjs"), roles:["causal-regression"] },
], repairCanonicalIdentities);
assert.deepEqual(repairExecutionPlan.map(({ identity }) => identity.key), [
  "build:dist",
  "unit:test/hotkey-installed-controller-test.mjs",
  "browser:test/browser-packs/hotkeys.mjs",
  ...repairHotkeysPlan.parserTasks.map(({ key }) => key),
  ...repairHotkeysPlan.generatorTasks.map(({ key }) => key),
  "acceptance-session:hotkeys",
], "the repair execution plan preserves canonical stage order around its exact repair work");
const predecessorFailure = Object.assign(new Error("generated prerequisite failed"),
  { reliabilityIncidentId:"prerequisite-incident" });
const predecessorLaunches = [];
await assert.rejects(executeTimeoutRepairTaskPlan(repairExecutionPlan, {
  runner:async(_label, task) => {
    predecessorLaunches.push(task.key);
    if (task.key === "build:dist") throw predecessorFailure;
  },
}), (error) => error === predecessorFailure,
"the failed predecessor remains the owning reliability incident");
assert.deepEqual(predecessorLaunches, ["build:dist"],
  "a failed predecessor prevents the repair leaf and every later task from launching");
assert.deepEqual(timeoutRepairFocusedExecutionTaskPlan([
  { identity:repairIdentity("unit:test/hotkey-installed-controller-test.mjs"), roles:["causal-regression"] },
], repairCanonicalIdentities).map(({ identity }) => identity.key),
["unit:test/hotkey-installed-controller-test.mjs"],
"a workspace-only repair unit receives no artifact prerequisites");
const repairPrerequisiteClosureRegression = ({ incidentId, failureDigest, diagnosedBoundary,
  causalCategory }) => {
  const executionKeys = repairExecutionPlan.map(({ identity }) => identity.key);
  const sessionIndex = executionKeys.indexOf("acceptance-session:hotkeys");
  const prerequisiteKeys = executionKeys.slice(0, sessionIndex).filter((key) =>
    key === "build:dist" || key.startsWith("acceptance-parse:") ||
      key.startsWith("acceptance-generate:"));
  const fixture = {
    id:"repair-focused-prerequisite-closure-v1", causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(diagnosedBoundary),
    input:{ repairTaskKey:"acceptance-session:hotkeys", canonicalExecutionKeys:executionKeys },
    expectedPreRepairFailure:{ prerequisitesPrepared:[], sessionLaunched:true,
      outcome:"legacy-source-probe-failure" },
    expectedRepairResult:{ prerequisitesPrepared:prerequisiteKeys, sessionLaunched:true,
      outcome:"passed" },
  };
  const fixtureDigest = timeoutIncidentDigest(fixture);
  return { version:2, incidentId, failureDigest, fixture,
    preRepairResult:{ status:"failed", fixtureDigest,
      observed:structuredClone(fixture.expectedPreRepairFailure) },
    repairResult:{ status:"passed", fixtureDigest,
      observed:structuredClone(fixture.expectedRepairResult) } };
};
const focusedPackagePlan = selectFocusedVerificationTasks(planVerification(packs, {
  packIds:["shell"],
}), ["package:extension"]);
assert.deepEqual(focusedPackagePlan.tasks.map(({ key }) => key),
  ["build:dist", "package:extension"],
"the focused package path retains only its required build prerequisite");
const focusedEvidenceCanonicalPlan = planVerification(packs, { packIds:["shell"] });
const focusedEvidenceUnitKey = focusedEvidenceCanonicalPlan.tasks
  .find(({ stage }) => stage === "unit").key;
const focusedEvidencePlan = planPackageTask(selectFocusedVerificationTasks(
  focusedEvidenceCanonicalPlan, [focusedEvidenceUnitKey]), focusedEvidenceCanonicalPlan);
assert.deepEqual(focusedEvidencePlan.tasks.map(({ key }) => key),
  ["build:dist", focusedEvidenceUnitKey, "package:extension"],
"adding evidence packaging re-closes the package build prerequisite around focused units");
const registryPlannerCanonicalPlan = planVerification(packs,
  { packIds:registryPlannerPreparationOptions.packIds });
const registryPlannerFocusedPlan = planPackageTask(selectFocusedVerificationTasks(
  registryPlannerCanonicalPlan, registryPlannerPreparationOptions.focusedTaskKeys),
registryPlannerCanonicalPlan);
assert.equal(registryPlannerPreparationFocusedPlan(registryPlannerFocusedPlan,
  "verification-slice-verification-registry-planner-modularization"), true,
"the exact non-property ownership preparation is an admitted canonical evidence plan");
assert.equal(registryPlannerPreparationFocusedPlan({ ...registryPlannerFocusedPlan,
  tasks:registryPlannerFocusedPlan.tasks.slice(1) },
"verification-slice-verification-registry-planner-modularization"), false,
"the ownership preparation exception rejects a plan missing its build prerequisite");
const repositoryCommonStore = await defaultStoreDirectory(process.cwd());
assert.ok(repositoryCommonStore.startsWith(path.join(os.tmpdir(), "swarmforge-repository-runtime")),
  "the repository-common incident store is writable under the real workspace restriction");
assert.equal(repositoryCommonStore.includes(`${path.sep}.git${path.sep}`), false,
  "ordinary reliability failures do not depend on protected Git metadata");
const repositoryCommonAttempts = await defaultCheckpointAttemptDirectory(process.cwd());
assert.equal(path.dirname(repositoryCommonAttempts), path.dirname(repositoryCommonStore),
  "incidents and checkpoint attempts share one writable repository-common runtime identity");
const replacePack = (registry, id, update) => registry.map((candidate) =>
  candidate.id === id ? { ...candidate, ...update(candidate) } : candidate);
import { registryPlannerPreparationTaskKeys } from "../../scripts/verification-policy/reliability/run-intent.mjs";
const identity = (key) => ({ key, stage:"unit", packId:"verification_process",
  executable:"node", args:[key.slice("unit:".length)], target:key.slice("unit:".length),
  environment:null, requiredCapabilities:[] });
const source = identity("unit:test/verification-process-contract-test.mjs");
