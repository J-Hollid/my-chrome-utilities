import { createHash } from "node:crypto";

const sha40 = /^[a-f0-9]{40}$/u;
const sha64 = /^[a-f0-9]{64}$/u;

export const blockedAggregateRouteIdentity = Object.freeze({
  version:1,
  incidentId:"39b11f5e-e0f4-49c0-8709-b9bd6845df29",
  sourceReceipt:"tmp/verification-receipts/1201128-1d321a66-5907-4ad7-8546-5262a4c45ab1.json",
  sourceReceiptSha256:"682cba620616115f181d5ebef93d0070f4ae988a98e314550a6925639e4b49df",
  failureDigest:"39e793128964a1a0a3d616506f8307b86df7e4e77f5e5e8883609858b2212c9f",
  incidentRunId:"38241b21-6c04-4912-9f52-9195b85410aa",
  incidentCandidateCommit:"b3ef82623fb7d27f184d8fc9ef1dbf3d35e7e670",
  incidentCandidateTree:"20f3bf01941149034fcc629cd163dc93d5329080",
  parentTaskKey:"browser-observation:REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER",
  childTaskKey:"browser:test/browser-packs/flow-table-documentation-export.mjs",
  correctionTask:"aggregate-child-failure-routing",
  correctionPatchId:"0a42569cc45b6ed31ebb17956e6c5b62f3edaaaa",
  syntheticTaskKey:"unit:test/verification-contracts/execution-checkpoint-contract-test.mjs",
  childCommand:Object.freeze(["node", "test/browser-packs/flow-table-documentation-export.mjs"]),
  childInvocationEnvironments:Object.freeze([
    Object.freeze({ SWARMFORGE_ROW_COMPOSITION_VIEWPORT_WIDTH:"1280" }),
    Object.freeze({ SWARMFORGE_ROW_COMPOSITION_VIEWPORT_WIDTH:"360" }),
  ]),
  correctionPaths:Object.freeze([
    "scripts/verification-execution/aggregate-child-results.mjs",
    "scripts/verification-execution/runner.mjs",
    "scripts/verification-reliability-progress.mjs",
    "scripts/verification-reliability-repair.mjs",
    "scripts/verification-reliability-store.mjs",
    "test/browser-packs/reorderable-editor-controls.mjs",
    "test/verification-contracts/execution-checkpoint-contract-test.mjs",
    "test/verification-contracts/reliability-run-intent-contract-test.mjs",
  ]),
});

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort()
    .map((key) => [key, canonical(value[key])]));
  return value;
}

function same(left, right) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

function exactIdentity(binding) {
  const { incident, correction } = binding ?? {};
  if (binding?.version !== 1 || incident?.id !== blockedAggregateRouteIdentity.incidentId ||
      incident.sourceReceipt !== blockedAggregateRouteIdentity.sourceReceipt ||
      incident.receiptSha256 !== blockedAggregateRouteIdentity.sourceReceiptSha256 ||
      incident.parentTaskKey !== blockedAggregateRouteIdentity.parentTaskKey ||
      incident.childTaskKey !== blockedAggregateRouteIdentity.childTaskKey ||
      correction?.task !== blockedAggregateRouteIdentity.correctionTask ||
      correction.blockedTaskKey !== blockedAggregateRouteIdentity.parentTaskKey ||
      correction.syntheticTaskKey !== blockedAggregateRouteIdentity.syntheticTaskKey) {
    throw new Error("Blocked-aggregate route identity mismatch");
  }
  if (correction.patchId !== blockedAggregateRouteIdentity.correctionPatchId) {
    throw new Error("Blocked-aggregate routing correction patch identity mismatch");
  }
  if (incident.failureDigest !== blockedAggregateRouteIdentity.failureDigest ||
      incident.runId !== blockedAggregateRouteIdentity.incidentRunId ||
      incident.candidateCommit !== blockedAggregateRouteIdentity.incidentCandidateCommit ||
      incident.candidateTree !== blockedAggregateRouteIdentity.incidentCandidateTree ||
      !same(incident.command, blockedAggregateRouteIdentity.childCommand) ||
      !same(incident.invocationEnvironments,
        blockedAggregateRouteIdentity.childInvocationEnvironments)) {
    throw new Error("Blocked-aggregate child command or invocation identity mismatch");
  }
  if (!sha64.test(incident.failureDigest ?? "") || !sha40.test(incident.candidateCommit ?? "") ||
      !sha40.test(incident.candidateTree ?? "") || typeof incident.runId !== "string" ||
      !incident.runId || !Array.isArray(incident.command) || incident.command.length < 2 ||
      !Array.isArray(incident.invocationEnvironments) || !incident.invocationEnvironments.length ||
      incident.invocationEnvironments.some((environment) => !environment ||
        typeof environment !== "object" || Array.isArray(environment))) {
    throw new Error("Blocked-aggregate incident binding is incomplete");
  }
  if (![correction.candidateCommit, correction.candidateTree, correction.baseCommit,
    correction.preparationQaCommit].every((value) => sha40.test(value ?? "")) ||
      ![correction.changeSetDigest, correction.planDigest].every((value) => sha64.test(value ?? ""))) {
    throw new Error("Blocked-aggregate correction binding is incomplete");
  }
  if (!same(correction.changedPaths, blockedAggregateRouteIdentity.correctionPaths)) {
    throw new Error("Blocked-aggregate route requires the exact verification-infrastructure-only change set");
  }
}

export function createBlockedAggregateObligation({
  binding, plan, candidate, planDigest, changedPaths, preparationQaAncestor, correctionPatchId,
}) {
  exactIdentity(binding);
  if (plan?.mode !== "exact" || plan.includeProperties !== true) {
    throw new Error("Blocked-aggregate route requires an exact canonical property plan");
  }
  const blocked = plan.tasks?.filter(({ key }) =>
    key === blockedAggregateRouteIdentity.parentTaskKey) ?? [];
  const synthetic = plan.tasks?.filter(({ key }) =>
    key === blockedAggregateRouteIdentity.syntheticTaskKey) ?? [];
  if (blocked.length !== 1 || synthetic.length !== 1 ||
      !plan.tasks.some(({ key }) => key === "package:extension")) {
    throw new Error("Blocked-aggregate route requires one parent, its synthetic proof, and package proof");
  }
  const correction = binding.correction;
  if (!preparationQaAncestor || candidate?.evidenceTask !== correction.task ||
      candidate.commit !== correction.candidateCommit || candidate.tree !== correction.candidateTree ||
      candidate.baseCommit !== correction.baseCommit ||
      candidate.changeSetDigest !== correction.changeSetDigest || planDigest !== correction.planDigest ||
      correctionPatchId !== correction.patchId || !same(changedPaths, correction.changedPaths)) {
    throw new Error("Blocked-aggregate candidate, preparation QA, change set, or plan identity mismatch");
  }
  const obligation = {
    version:1,
    status:"blocked-obligation",
    binding:structuredClone(binding),
    blockedTaskIdentity:structuredClone(blocked[0]),
    execution:{ launched:false, childLaunched:false },
  };
  obligation.obligationDigest = digest({
    version:obligation.version, binding:obligation.binding,
    blockedTaskIdentity:obligation.blockedTaskIdentity, execution:obligation.execution,
  });
  return obligation;
}

export function validateBlockedAggregateSource({ binding, incident, receipt, receiptSha256 }) {
  exactIdentity(binding);
  const failure = incident?.failure;
  const receiptFailure = receipt?.tasks?.[binding.incident.parentTaskKey];
  if (incident?.id !== binding.incident.id || incident.state !== "unresolved" ||
      incident.failureDigest !== binding.incident.failureDigest ||
      failure?.sourceReceipt !== binding.incident.sourceReceipt ||
      failure.runnerRunId !== binding.incident.runId ||
      failure.lineage?.commit !== binding.incident.candidateCommit ||
      failure.lineage?.tree !== binding.incident.candidateTree ||
      failure.task?.key !== binding.incident.parentTaskKey ||
      receiptSha256 !== binding.incident.receiptSha256 || receipt?.runId !== binding.incident.runId ||
      receipt?.candidate?.commit !== binding.incident.candidateCommit ||
      receipt?.candidate?.tree !== binding.incident.candidateTree ||
      receiptFailure?.reliabilityIncidentId !== binding.incident.id ||
      receiptFailure?.reliabilityFailureDigest !== binding.incident.failureDigest ||
      receiptFailure?.status !== "failed" || !same(receiptFailure.identity, failure.task)) {
    throw new Error("Blocked-aggregate immutable incident or source receipt identity mismatch");
  }
  return binding;
}

export function partitionBlockedAggregateExecution(plan, obligation) {
  if (obligation?.version !== 1 || obligation.status !== "blocked-obligation" ||
      obligation.execution?.launched !== false || obligation.execution?.childLaunched !== false ||
      obligation.binding?.correction?.blockedTaskKey !== obligation.blockedTaskIdentity?.key ||
      !plan?.tasks?.some((task) => same(task, obligation.blockedTaskIdentity))) {
    throw new Error("Blocked-aggregate obligation does not match the canonical plan");
  }
  const executionTasks = plan.tasks.filter(({ key }) => key !== obligation.blockedTaskIdentity.key);
  if (executionTasks.length !== plan.tasks.length - 1) {
    throw new Error("Blocked-aggregate execution must contain exactly one blocked member");
  }
  return {
    executionPlan:{ ...plan, tasks:executionTasks },
    blockedResult:{
      identity:structuredClone(obligation.blockedTaskIdentity),
      status:"blocked-obligation", provenance:"obligation", durationMs:0,
      launched:false, childLaunched:false, output:"", stderr:"",
      obligationDigest:obligation.obligationDigest,
    },
  };
}

export function validateBlockedAggregateEvidenceResults({ plan, tasks, obligation }) {
  if (plan?.mode !== "exact" || plan.includeProperties !== true) {
    throw new Error("Blocked-aggregate evidence requires an exact canonical property plan");
  }
  const expectedKeys = plan.tasks.map(({ key }) => key).sort();
  if (!same(Object.keys(tasks ?? {}).sort(), expectedKeys)) {
    throw new Error("Blocked-aggregate evidence must retain the exact canonical task set");
  }
  const blockedResults = Object.values(tasks).filter(({ status }) => status === "blocked-obligation");
  const blocked = blockedResults[0];
  if (blockedResults.length !== 1 || blocked.identity?.key !== obligation?.blockedTaskIdentity?.key ||
      blocked.provenance !== "obligation" || blocked.durationMs !== 0 ||
      blocked.launched !== false || blocked.childLaunched !== false) {
    throw new Error("Blocked-aggregate evidence requires one exact no-launch obligation result");
  }
  for (const task of plan.tasks) {
    const result = tasks[task.key];
    if (task.key === blocked.identity.key) continue;
    if (result?.status !== "passed" || result.provenance !== "fresh" || !same(result.identity, task)) {
      throw new Error(`Blocked-aggregate executable result must be fresh and passed: ${task.key}`);
    }
  }
  const synthetic = tasks[obligation.binding.correction.syntheticTaskKey];
  const packageResult = tasks["package:extension"];
  if (synthetic?.status !== "passed" || synthetic.provenance !== "fresh" ||
      packageResult?.status !== "passed" || packageResult.provenance !== "fresh") {
    throw new Error("Blocked-aggregate evidence requires fresh synthetic and package proof");
  }
  return obligation;
}

export function decideBlockedAggregateConsumption(obligation, evidence) {
  if (evidence?.waiver || evidence?.manualResolution || evidence?.focusedExclusion ||
      evidence?.coarseAggregateRetry || evidence?.reusedResult) {
    throw new Error("A waiver, manual resolution, focused exclusion, reuse, or coarse retry cannot consume an obligation");
  }
  if (!same(evidence?.binding, obligation?.binding)) {
    throw new Error("Blocked-aggregate consumption identity mismatch");
  }
  const { child, aggregate, synthetic } = evidence;
  if (child?.taskKey !== obligation.binding.incident.childTaskKey ||
      synthetic?.taskKey !== obligation.binding.correction.syntheticTaskKey ||
      synthetic.status !== "passed" || synthetic.provenance !== "fresh") {
    throw new Error("Blocked-aggregate child or synthetic proof identity mismatch");
  }
  if (child.provenance !== "fresh" || child.disposition !== "governed") {
    throw new Error("Blocked-aggregate consumption requires one fresh governed child disposition");
  }
  if (child.status === "failed" || aggregate?.status === "failed") {
    return { status:"retained", recordNormalFailure:true };
  }
  if (child.status !== "passed" || aggregate?.taskKey !== obligation.binding.incident.parentTaskKey ||
      aggregate.status !== "passed" || aggregate.provenance !== "fresh") {
    throw new Error("Blocked-aggregate consumption requires a fresh passing bound aggregate");
  }
  return { status:"consumed" };
}
