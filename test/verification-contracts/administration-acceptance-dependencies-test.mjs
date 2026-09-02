import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { planVerification } from "../../scripts/verification-planner/tasks/planner.mjs";
import { validatePreparedEvidence } from
  "../../scripts/verification-evidence/prepared-acceptance-evidence.mjs";
import { loadVerificationPacks } from "../../scripts/verification-registry/validation.mjs";
import { verificationPackTaskKeys } from "../../scripts/verification-packs.mjs";
import { emitVtd014ExecutionPreparedEvidence } from
  "./vtd014-execution-prepared-evidence.mjs";

const packs = await loadVerificationPacks();
const runnable = packs.filter((pack) => verificationPackTaskKeys(pack).size > 0);
const added = { id:"synthetic-runnable", source:[], verificationOnly:true,
  unit:["test/synthetic-runnable-test.mjs"] };
const empty = { id:"synthetic-empty", source:[], verificationOnly:true };
assert.equal([...packs, added].filter((pack) => verificationPackTaskKeys(pack).size > 0).length,
  runnable.length + 1, "a new runnable identity expands terminal cardinality by one");
assert.equal([...packs, empty].filter((pack) => verificationPackTaskKeys(pack).size > 0).length,
  runnable.length, "an empty compatibility identity does not expand terminal cardinality");

const capture = packs.find(({ id }) => id === "capture");
const permissionSlice = capture.verificationSlices.find(
  ({ id }) => id === "capture_live_target_permission_recovery");
assert.ok(permissionSlice, "Capture keeps the bounded live-target permission slice");
assert.deepEqual(permissionSlice.consumers,
  [{ packId:"shell", sliceId:"live_target_permission_recovery_consumer" }],
  "the bounded permission slice retains its exact Shell consumer");

const [legacyHandlers, repairFixtures] = await Promise.all([
  readFile(new URL(
    "../../acceptance/src/acceptance/steps/verification_process_legacy.clj", import.meta.url),
  "utf8"),
  readFile(new URL(
    "../../acceptance/src/acceptance/verification_support/administration_acceptance_repair.clj",
    import.meta.url), "utf8"),
]);
assert.ok(legacyHandlers.indexOf("administration-preflight/handlers") <
          legacyHandlers.indexOf("modular-architecture/handlers"),
"feature-scoped administration preflight handlers run before the generic modular fallback");
assert.match(repairFixtures, /other:contract-conservation-fixture-identity/u,
"the administration acceptance session owns the conservation repair protocol");

const preparedSessionPlan = planVerification(packs, {
  packIds:["verification_process"], includeProperties:true,
});
const selectedPreparedTasks = new Set(preparedSessionPlan.tasks.map(({key}) => key));
const preparedEvidenceBindings = [
  ["acceptance/src/acceptance/verification_support/modular_architecture_throughput_evidence.clj",
    "unit:test/verification-contracts/reliability-calibration-contract-test.mjs",
    "{\"vtd004Acceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_throughput_evidence.clj",
    "unit:test/verification-contracts/ownership-event-library-contract-test.mjs",
    "{\"vtd004EventAcceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_throughput_evidence.clj",
    "unit:test/verification-contracts/ownership-capture-contract-test.mjs",
    "{\"vtd004CaptureAcceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_throughput_evidence.clj",
    "unit:test/verification-contracts/ownership-schemas-contract-test.mjs",
    "{\"vtd004SchemasAcceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_throughput_evidence.clj",
    "unit:test/verification-contracts/evidence-promotion-conservation-contract-test.mjs",
    "{\"vtd005Acceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_throughput_evidence.clj",
    "unit:test/verification-contracts/ownership-priority-contract-test.mjs",
    "{\"vtd009HistoryAcceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_throughput_evidence.clj",
    "unit:test/verification-contracts/reliability-calibration-contract-test.mjs",
    "{\"vtd009Acceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_vtd014_handlers.clj",
    "unit:test/verification-contracts/reliability-incident-store-contract-test.mjs",
    "{\"vtd014Acceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_vtd014_handlers.clj",
    "unit:test/verification-contracts/execution-runner-integration-contract-test.mjs",
    "{\"vtd014ExecutionAcceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_vtd014_handlers.clj",
    "unit:test/verification-contracts/registry-style-boundary-contract-test.mjs",
    "{\"vtd014FlowStylesAcceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_vtd014_handlers.clj",
    "unit:test/verification-contracts/registry-style-boundary-contract-test.mjs",
    "{\"vtd014StylesAcceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_vtd015_handlers.clj",
    "unit:test/verification-contracts/reliability-prerequisite-contract-test.mjs",
    "{\"verificationOwnershipReadinessAcceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_vtd015_handlers.clj",
    "unit:test/verification-contracts/reliability-regression-routing-contract-test.mjs",
    "{\"verificationConfirmedFlakyFeatureDeferralAcceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_task_checkpoint_repair_handlers.clj",
    "unit:test/verification-contracts/execution-binding-contract-test.mjs",
    "{\"verificationTaskCheckpointIncidentRepairAcceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_task_checkpoint_repair_handlers.clj",
    "unit:test/verification-contracts/reliability-regression-routing-contract-test.mjs",
    "{\"verificationTaskCheckpointRepairAcceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_vtd017_handlers.clj",
    "unit:test/verification-contracts/execution-binding-contract-test.mjs",
    "{\"vtd017Acceptance\""],
  ["acceptance/src/acceptance/verification_support/modular_architecture_vtd017_handlers.clj",
    "unit:test/verification-contracts/execution-coordinator-contract-test.mjs",
    "{\"vtd017LockLifecycleAcceptance\""],
];
const preparedSources = new Map();
for (const [consumerPath, taskKey, prefix] of preparedEvidenceBindings) {
  const consumer = preparedSources.get(consumerPath) ?? await readFile(consumerPath, "utf8");
  preparedSources.set(consumerPath, consumer);
  assert.ok(selectedPreparedTasks.has(taskKey), `${taskKey} is selected for prepared evidence`);
  const exactBinding = consumer.includes(`:prepared-task "${taskKey}"`);
  const composedBinding = consumer.includes(':prepared-task (str "unit:" task)') &&
    consumer.includes(`"${taskKey.slice("unit:".length)}"`);
  assert.ok(exactBinding || composedBinding, `${consumerPath} binds ${taskKey}`);
  const clojurePrefix = prefix.replaceAll('"', '\\"');
  const exactPrefix = consumer.includes(`:prefix "${clojurePrefix}`);
  const composedPrefix = consumer.includes(":prefix prefix") &&
    consumer.includes(`"${clojurePrefix}`);
  assert.ok(exactPrefix || composedPrefix, `${consumerPath} reads ${prefix}`);
}
const [eventProducer, captureProducer, schemasProducer, coordinatorProducer,
  priorityProducer, incidentProducer, executionProducer, executionEvidenceHelper] =
  await Promise.all([
  readFile("test/verification-contracts/ownership-event-library-contract-test.mjs", "utf8"),
  readFile("test/verification-contracts/ownership-capture-contract-test.mjs", "utf8"),
  readFile("test/verification-contracts/ownership-schemas-contract-test.mjs", "utf8"),
  readFile("test/verification-contracts/execution-coordinator-contract-test.mjs", "utf8"),
  readFile("test/verification-contracts/ownership-priority-contract-test.mjs", "utf8"),
  readFile("test/verification-contracts/reliability-incident-store-contract-test.mjs", "utf8"),
  readFile("test/verification-contracts/execution-runner-integration-contract-test.mjs", "utf8"),
  readFile("test/verification-contracts/vtd014-execution-prepared-evidence.mjs", "utf8"),
]);
for (const [source, prefix] of [
  [eventProducer, "vtd004EventAcceptance"],
  [captureProducer, "vtd004CaptureAcceptance"],
  [schemasProducer, "vtd004SchemasAcceptance"],
]) {
  assert.ok(source.includes(`emitPreparedEvidence("${prefix}"`),
    `${prefix} is emitted by its selected owner`);
  assert.match(source, /handlers:\{ requirement:"nonempty" \}/u,
    `${prefix} rejects empty handler evidence`);
}
assert.ok(coordinatorProducer.includes('emitPreparedEvidence("vtd017LockLifecycleAcceptance"'),
  "the coordinator emits its lock-lifecycle evidence");
assert.match(coordinatorProducer,
  /outsideWriterBlocked:\{ requirement:"true" \}.*leaseReleased:\{ requirement:"true" \}/su,
  "lock-lifecycle evidence rejects false writer-block and lease-release results");
assert.match(priorityProducer,
  /unavailable:vtd009HistoryPlan[\s\S]*historicalRegistryFallback:true[\s\S]*assert\.deepEqual\(vtd009History\.unavailable, currentRunnablePackIds/u,
  "the priority owner emits complete fail-closed unavailable-history evidence");
assert.match(incidentProducer,
  /emitPreparedEvidence\("vtd014Acceptance", vtd014Evidence, \{[\s\S]*execution:[\s\S]*historical:[\s\S]*incident:[\s\S]*conservation:/u,
  "the incident-store owner emits a validated VTD-014 aggregate");
assert.ok(executionProducer.includes("emitVtd014ExecutionPreparedEvidence({"),
  "the runner integration owner emits VTD-014 execution evidence through its helper");
assert.match(executionEvidenceHelper,
  /workspaceNarrow:\{ requirement:"true" \}[\s\S]*mixedRouteObservation:\{[\s\S]*scoped:\{ requirement:"nonempty" \}[\s\S]*workspace:\{ requirement:"nonempty" \}/u,
  "VTD-014 execution evidence rejects missing runtime route observations");
assert.throws(() => emitVtd014ExecutionPreparedEvidence({
  prerequisites:{ workspaceNarrow:false, mixedRouteObservation:{ scoped:"scoped", workspace:"workspace" } },
  runIntent:{ review:"review-evidence" },
}), /must be true at prerequisites\.workspaceNarrow/u,
"VTD-014 execution evidence rejects a non-narrow runtime route");
assert.throws(() => emitVtd014ExecutionPreparedEvidence({
  prerequisites:{ workspaceNarrow:true, mixedRouteObservation:null },
  runIntent:{ review:"review-evidence" },
}), /must be nonempty at prerequisites\.mixedRouteObservation\.scoped/u,
"VTD-014 execution evidence rejects missing mixed-route observations");
assert.throws(() => validatePreparedEvidence({handlers:[]},
  {handlers:{requirement:"nonempty"}}), /must be nonempty/u,
"prepared ownership evidence rejects an empty handler list");
assert.throws(() => validatePreparedEvidence({protection:{outsideWriterBlocked:false}},
  {protection:{outsideWriterBlocked:{requirement:"true"}}}), /must be true/u,
"prepared lock evidence rejects a false writer-block result");

console.log(JSON.stringify({ verificationAdministrationAcceptanceDependencies:{
  cardinality:{ currentRunnable:true, addedRunnable:true, emptyCompatibilityExcluded:true },
  liveTarget:{ captureOwnedSlice:true, exactShellConsumer:true, noAllPack:true },
  preparedEvidence:{ bindingCount:preparedEvidenceBindings.length, selected:true,
    completeFields:true, emptyHandlersRejected:true, falseLockLifecycleRejected:true },
} }));
console.log("verification administration acceptance dependencies passed");
