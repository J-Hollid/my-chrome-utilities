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
  childTaskDigest:"567003db88e642b7c529e28f3858ded4d5e9b9d75ee5b05f5ee3c7a09a38c921",
  correctionTask:"aggregate-child-failure-routing",
  correctionPatchId:"0a42569cc45b6ed31ebb17956e6c5b62f3edaaaa",
  syntheticTaskKey:"unit:test/verification-contracts/execution-checkpoint-contract-test.mjs",
  childCommand:Object.freeze(["node", "test/browser-packs/flow-table-documentation-export.mjs"]),
  childInvocationEnvironments:Object.freeze([
    Object.freeze({ SWARMFORGE_ROW_COMPOSITION_VIEWPORT_WIDTH:"1280" }),
    Object.freeze({ SWARMFORGE_ROW_COMPOSITION_VIEWPORT_WIDTH:"360" }),
  ]),
  consumerSourceCommit:"b3ef82623fb7d27f184d8fc9ef1dbf3d35e7e670",
  consumerSourceTree:"20f3bf01941149034fcc629cd163dc93d5329080",
  consumerTask:"legacy-campsite-satisfaction-compatibility",
  consumerPatchId:"6330dc30b882f3fab97603627f095ac07f9e5216",
  consumerPlanDigest:"8bac3c6fb49870790c4f58d717815f362014ee19d5941f72b9ca3b1f030a5015",
  consumerChangedPaths:Object.freeze([
    "acceptance/src/acceptance/steps/swarmforge_autonomy.clj",
    "scripts/campsite-artifacts.mjs",
    "scripts/campsite-git-runtime.mjs",
    "scripts/campsite-store.mjs",
    "scripts/stacked-campsite-control.mjs",
    "test/stacked-campsite-control-test.mjs",
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

function obligationDigest(obligation) {
  return digest({ version:obligation.version, binding:obligation.binding,
    blockedTaskIdentity:obligation.blockedTaskIdentity, execution:obligation.execution,
    syntheticProof:obligation.syntheticProof,
    consumptionConstraint:obligation.consumptionConstraint });
}

function syntheticResultDigest(identity, result) {
  return digest({ identity, status:result.status,
    outputSha256:result.outputSha256 ?? digest(result.output ?? ""),
    stderrSha256:result.stderrSha256 ?? digest(result.stderr ?? "") });
}

function exactIdentity(binding) {
  const { incident, correction } = binding ?? {};
  if (binding?.version !== 1 || incident?.id !== blockedAggregateRouteIdentity.incidentId ||
      incident.sourceReceipt !== blockedAggregateRouteIdentity.sourceReceipt ||
      incident.receiptSha256 !== blockedAggregateRouteIdentity.sourceReceiptSha256 ||
      incident.parentTaskKey !== blockedAggregateRouteIdentity.parentTaskKey ||
      incident.childTaskKey !== blockedAggregateRouteIdentity.childTaskKey ||
      incident.childTaskDigest !== blockedAggregateRouteIdentity.childTaskDigest ||
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

function exactConsumptionConstraint(constraint) {
  if (constraint?.version !== 1 ||
      constraint.sourceCommit !== blockedAggregateRouteIdentity.consumerSourceCommit ||
      constraint.sourceTree !== blockedAggregateRouteIdentity.consumerSourceTree ||
      constraint.task !== blockedAggregateRouteIdentity.consumerTask ||
      constraint.patchId !== blockedAggregateRouteIdentity.consumerPatchId ||
      constraint.planDigest !== blockedAggregateRouteIdentity.consumerPlanDigest ||
      !same(constraint.changedPaths, blockedAggregateRouteIdentity.consumerChangedPaths) ||
      !same(constraint.packIds, ["shell"])) {
    throw new Error("Blocked-aggregate consumption constraint identity mismatch");
  }
  return constraint;
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
    consumptionConstraint:{ version:1,
      sourceCommit:blockedAggregateRouteIdentity.consumerSourceCommit,
      sourceTree:blockedAggregateRouteIdentity.consumerSourceTree,
      task:blockedAggregateRouteIdentity.consumerTask,
      patchId:blockedAggregateRouteIdentity.consumerPatchId,
      planDigest:blockedAggregateRouteIdentity.consumerPlanDigest,
      changedPaths:[...blockedAggregateRouteIdentity.consumerChangedPaths],
      packIds:["shell"],
    },
  };
  obligation.obligationDigest = obligationDigest(obligation);
  return obligation;
}

export function sealBlockedAggregateObligation(obligation, tasks) {
  const synthetic = tasks?.[obligation?.binding?.correction?.syntheticTaskKey];
  if (synthetic?.status !== "passed" || synthetic.provenance !== "fresh" ||
      !same(synthetic.identity?.key, obligation.binding.correction.syntheticTaskKey)) {
    throw new Error("Blocked-aggregate obligation requires its fresh synthetic proof before sealing");
  }
  const sealed = structuredClone(obligation);
  sealed.syntheticProof = {
    taskKey:synthetic.identity.key,
    identity:structuredClone(synthetic.identity),
    status:"passed", provenance:"fresh",
    resultDigest:syntheticResultDigest(synthetic.identity, synthetic),
  };
  sealed.obligationDigest = obligationDigest(sealed);
  return sealed;
}

export function validateBlockedAggregateObligation(obligation, { plan } = {}) {
  exactIdentity(obligation?.binding);
  exactConsumptionConstraint(obligation?.consumptionConstraint);
  if (obligation?.version !== 1 || obligation.status !== "blocked-obligation" ||
      obligation.execution?.launched !== false || obligation.execution?.childLaunched !== false ||
      obligation.blockedTaskIdentity?.key !== obligation.binding.correction.blockedTaskKey ||
      obligation.syntheticProof?.taskKey !== obligation.binding.correction.syntheticTaskKey ||
      obligation.syntheticProof?.identity?.key !== obligation.binding.correction.syntheticTaskKey ||
      obligation.syntheticProof.status !== "passed" ||
      obligation.syntheticProof.provenance !== "fresh" ||
      !sha64.test(obligation.syntheticProof.resultDigest ?? "") ||
      obligation.obligationDigest !== obligationDigest(obligation)) {
    throw new Error("Blocked-aggregate obligation digest or sealed identity is invalid");
  }
  if (plan && (!plan.tasks?.some((task) => same(task, obligation.blockedTaskIdentity)) ||
      !plan.tasks.some((task) => same(task, obligation.syntheticProof.identity)))) {
    throw new Error("Blocked-aggregate obligation is not bound to the canonical plan");
  }
  return obligation;
}

export function validateInheritedBlockedAggregatePreflight(obligation, {
  plan, resumeReceiptPath, candidate, patchId, planDigest, taskIdentities,
} = {}) {
  validateBlockedAggregateObligation(obligation);
  const constraint = obligation.consumptionConstraint;
  if (resumeReceiptPath || plan?.mode !== "exact" || plan.includeProperties !== true) {
    throw new Error("Inherited blocked-aggregate consumption requires a fresh non-resumed exact property plan");
  }
  const aggregate = plan.tasks?.filter(({ key }) =>
    key === obligation.binding.incident.parentTaskKey) ?? [];
  if (aggregate.length !== 1) {
    throw new Error("Inherited blocked-aggregate consumption requires exactly one bound aggregate");
  }
  if (!plan.tasks.some(({ key }) => key === "package:extension") ||
      !same(plan.requestedPackIds, constraint.packIds) ||
      !same(plan.changedPaths, constraint.changedPaths) ||
      !same(plan.changeSet?.paths, constraint.changedPaths) ||
      planDigest !== constraint.planDigest || digest(taskIdentities) !== planDigest ||
      !same(plan.tasks.map(({ key }) => key), taskIdentities?.map(({ key }) => key))) {
    throw new Error("Inherited blocked-aggregate canonical plan or task identity mismatch");
  }
  if (![candidate?.commit, candidate?.tree, candidate?.baseCommit].every((value) =>
    sha40.test(value ?? "")) || !sha64.test(candidate?.changeSetDigest ?? "") ||
      candidate.evidenceTask !== constraint.task || patchId !== constraint.patchId) {
    throw new Error("Inherited blocked-aggregate conserved candidate or patch identity mismatch");
  }
  const admission = { version:1, status:"admitted",
    obligationDigest:obligation.obligationDigest,
    candidate:structuredClone(candidate), patchId,
    plan:{ digest:planDigest, taskIdentities:structuredClone(taskIdentities) } };
  admission.admissionDigest = digest(admission);
  return admission;
}

export function validateInheritedBlockedAggregateAdmission(admission, obligation, {
  candidate, planDigest, taskIdentities, candidatePatchId = admission?.patchId,
} = {}) {
  validateBlockedAggregateObligation(obligation);
  if (admission?.version !== 1 || admission.status !== "admitted" ||
      admission.obligationDigest !== obligation.obligationDigest ||
      admission.patchId !== obligation.consumptionConstraint.patchId ||
      admission.admissionDigest !== digest({ ...admission, admissionDigest:undefined })) {
    throw new Error("Inherited blocked-aggregate admission digest or obligation mismatch");
  }
  if (!same(candidate, admission.candidate) || candidatePatchId !== admission.patchId) {
    throw new Error("Inherited blocked-aggregate candidate identity mismatch");
  }
  if (planDigest !== admission.plan?.digest) {
    throw new Error("Inherited blocked-aggregate plan identity mismatch");
  }
  if (!same(taskIdentities, admission.plan.taskIdentities) || digest(taskIdentities) !== planDigest) {
    throw new Error("Inherited blocked-aggregate task identity mismatch");
  }
  return admission;
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
  const executionPlan = { ...plan, tasks:executionTasks };
  const stageFields = ["preparation", "unit", "property", "browser", "observation", "parser",
    "generator", "checkpoint", "session", "package"];
  for (const stage of stageFields) {
    const taskField = `${stage}Tasks`;
    const commandField = `${stage}Commands`;
    if (!Array.isArray(plan[taskField])) continue;
    executionPlan[taskField] = plan[taskField]
      .filter(({ key }) => key !== obligation.blockedTaskIdentity.key);
    if (Array.isArray(plan[commandField])) {
      executionPlan[commandField] = executionPlan[taskField].map(({ display }) => display);
    }
  }
  if (Array.isArray(plan.commands)) executionPlan.commands = executionTasks.map(({ display }) => display);
  if (Array.isArray(plan.acceptanceCommands)) executionPlan.acceptanceCommands = [
    ...(executionPlan.parserCommands ?? []), ...(executionPlan.generatorCommands ?? []),
    ...(executionPlan.sessionCommands ?? []),
  ];
  return {
    executionPlan,
    blockedResult:{
      identity:structuredClone(obligation.blockedTaskIdentity),
      status:"blocked-obligation", provenance:"obligation", durationMs:0,
      launched:false, childLaunched:false, output:"", stderr:"",
      obligationDigest:obligation.obligationDigest,
    },
  };
}

export function validateBlockedAggregateEvidenceResults({ plan, tasks, obligation }) {
  validateBlockedAggregateObligation(obligation, { plan });
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
      blocked.launched !== false || blocked.childLaunched !== false ||
      blocked.obligationDigest !== obligation.obligationDigest) {
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
      syntheticResultDigest(synthetic.identity, synthetic) !== obligation.syntheticProof.resultDigest ||
      packageResult?.status !== "passed" || packageResult.provenance !== "fresh") {
    throw new Error("Blocked-aggregate evidence requires fresh synthetic and package proof");
  }
  return obligation;
}

export function decideBlockedAggregateConsumption(obligation, evidence) {
  validateBlockedAggregateObligation(obligation);
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

function parseAggregateProtocol(output) {
  let manifest, completion;
  const outcomes = [];
  for (const line of String(output ?? "").split("\n")) {
    let record;
    try { record = JSON.parse(line); }
    catch { continue; }
    if (record.swarmforgeAggregateChildManifest) manifest = record.swarmforgeAggregateChildManifest;
    if (record.swarmforgeAggregateChildOutcome) outcomes.push(record.swarmforgeAggregateChildOutcome);
    if (record.swarmforgeAggregateChildCompletion) completion = record.swarmforgeAggregateChildCompletion;
  }
  return { manifest, outcomes, completion };
}

function validProtocolDigest(value) {
  return value?.digest === digest({ ...value, digest:undefined });
}

function validPassingAggregateProtocol(manifest, outcomes, completion) {
  const invocationMap = new Map();
  for (const declaration of manifest?.declarations ?? []) {
    for (const invocation of declaration.invocations ?? []) {
      if (invocationMap.has(invocation.id)) return false;
      invocationMap.set(invocation.id, { declaration, invocation });
    }
  }
  if (!invocationMap.size || outcomes.length !== invocationMap.size ||
      new Set(outcomes.map(({ invocationId }) => invocationId)).size !== outcomes.length) return false;
  for (const outcome of outcomes) {
    const expected = invocationMap.get(outcome.invocationId);
    if (!expected || outcome.status !== "passed" || !validProtocolDigest(outcome) ||
        !same(outcome.parent, manifest.parent) || outcome.manifestDigest !== manifest.digest ||
        outcome.declarationDigest !== expected.declaration.declarationDigest ||
        !same(outcome.invocationEnvironment, expected.invocation.environment) ||
        !same(outcome.canonicalTask, expected.declaration.canonicalTask) ||
        outcome.canonicalTaskDigest !== expected.declaration.canonicalTaskDigest) return false;
  }
  return completion?.status === "passed" && completion.drained === true &&
    completion.closedToNewLaunches === false && completion.firstFailedInvocationId === null &&
    validProtocolDigest(completion) && same(completion.parent, manifest.parent) &&
    completion.manifestDigest === manifest.digest &&
    Array.isArray(completion.launchedInvocationIds) &&
    new Set(completion.launchedInvocationIds).size === invocationMap.size &&
    completion.launchedInvocationIds.every((id) => invocationMap.has(id)) &&
    same(completion.outcomeDigests, outcomes.map(({ digest:outcomeDigest }) => outcomeDigest));
}

export function consumeBlockedAggregateObligation(obligation, receipt, {
  originCommit, originTree, consumedByCommit = receipt?.candidate?.commit,
  consumedByTree = receipt?.candidate?.tree, candidatePatchId,
} = {}) {
  validateBlockedAggregateObligation(obligation);
  const admissions = receipt?.blockedAggregateConsumptionAdmissions?.filter(({ obligationDigest }) =>
    obligationDigest === obligation.obligationDigest) ?? [];
  if (admissions.length !== 1) {
    throw new Error("Blocked-aggregate consumption requires one exact prelaunch admission");
  }
  const admission = admissions[0];
  const taskIdentities = admission.plan?.taskIdentities?.map(({ key }) => receipt.tasks?.[key]?.identity);
  if (!same(Object.keys(receipt.tasks ?? {}).sort(),
    admission.plan.taskIdentities.map(({ key }) => key).sort())) {
    throw new Error("Inherited blocked-aggregate task identity mismatch");
  }
  validateInheritedBlockedAggregateAdmission(admission, obligation, {
    candidate:receipt.candidate, planDigest:receipt.plan?.taskPlanDigest,
    taskIdentities, candidatePatchId,
  });
  const parent = receipt?.tasks?.[obligation.binding.incident.parentTaskKey];
  const { manifest, outcomes, completion } = parseAggregateProtocol(parent?.output);
  const declaration = manifest?.declarations?.find(({ canonicalTask }) =>
    canonicalTask?.key === obligation.binding.incident.childTaskKey);
  const childOutcomes = outcomes.filter(({ canonicalTask }) =>
    canonicalTask?.key === obligation.binding.incident.childTaskKey);
  const command = declaration && [declaration.executable, ...(declaration.args ?? [])];
  const environments = declaration?.invocations?.map(({ environment }) => environment);
  const expectedEnvironments = obligation.binding.incident.invocationEnvironments.map((environment) => ({
    SWARMFORGE_AGGREGATE_MATRIX_WIDTH:environment.SWARMFORGE_ROW_COMPOSITION_VIEWPORT_WIDTH,
    ...environment,
  }));
  const expectedInvocationIds = declaration?.invocations?.map(({ id }) => id);
  const declarationUnsigned = declaration && { id:declaration.id, executable:declaration.executable,
    args:declaration.args, allowedEnvironment:declaration.allowedEnvironment,
    canonicalTask:declaration.canonicalTask, canonicalTaskDigest:declaration.canonicalTaskDigest };
  if (parent?.status !== "passed" || parent.provenance !== "fresh" ||
      !same(parent.identity, obligation.blockedTaskIdentity) ||
      manifest?.parent?.receiptRunId !== receipt.runId ||
      manifest?.parent?.candidate?.commit !== receipt.candidate?.commit ||
      manifest?.parent?.candidate?.tree !== receipt.candidate?.tree ||
      manifest?.parent?.parentTaskKey !== obligation.binding.incident.parentTaskKey ||
      manifest?.parent?.parentTaskDigest !== digest(parent.identity) ||
      !validProtocolDigest(manifest) ||
      declaration?.declarationDigest !== digest(declarationUnsigned) ||
      declaration?.canonicalTaskDigest !== obligation.binding.incident.childTaskDigest ||
      !same(command, obligation.binding.incident.command) ||
      !same(environments, expectedEnvironments) ||
      childOutcomes.length !== expectedInvocationIds?.length ||
      !same(childOutcomes.map(({ invocationId }) => invocationId).sort(),
        [...(expectedInvocationIds ?? [])].sort()) ||
      !validPassingAggregateProtocol(manifest, outcomes, completion)) {
    throw new Error("Blocked-aggregate obligation lacks one exact fresh governed child and aggregate pass");
  }
  const disposition = decideBlockedAggregateConsumption(obligation, {
    binding:structuredClone(obligation.binding),
    child:{ taskKey:obligation.binding.incident.childTaskKey, disposition:"governed",
      status:"passed", provenance:"fresh" },
    aggregate:{ taskKey:obligation.binding.incident.parentTaskKey,
      status:"passed", provenance:"fresh" },
    synthetic:structuredClone(obligation.syntheticProof),
  });
  if (disposition.status !== "consumed") throw new Error("Blocked-aggregate obligation was retained");
  if (![originCommit, originTree, consumedByCommit, consumedByTree]
    .every((value) => sha40.test(value ?? ""))) {
    throw new Error("Blocked-aggregate consumption requires exact ancestor and descendant Git identities");
  }
  const record = { version:1, status:"consumed", obligationDigest:obligation.obligationDigest,
    originCommit, originTree, consumedByCommit, consumedByTree,
    obligation:structuredClone(obligation),
    admission:structuredClone(admission),
    childResultDigest:digest(childOutcomes),
    aggregateResultDigest:digest({ identity:parent.identity, status:parent.status,
      output:parent.output ?? "", stderr:parent.stderr ?? "" }) };
  record.consumptionDigest = digest(record);
  return record;
}

export function validateBlockedAggregateConsumption(record, obligation) {
  validateBlockedAggregateObligation(obligation);
  validateInheritedBlockedAggregateAdmission(record?.admission, obligation, {
    candidate:record?.admission?.candidate,
    planDigest:record?.admission?.plan?.digest,
    taskIdentities:record?.admission?.plan?.taskIdentities,
    candidatePatchId:record?.admission?.patchId,
  });
  if (record?.version !== 1 || record.status !== "consumed" ||
      record.obligationDigest !== obligation.obligationDigest ||
      ![record.originCommit, record.originTree, record.consumedByCommit, record.consumedByTree]
        .every((value) => sha40.test(value ?? "")) ||
      ![record.childResultDigest, record.aggregateResultDigest].every((value) => sha64.test(value ?? "")) ||
      record.consumptionDigest !== digest({ ...record, consumptionDigest:undefined })) {
    throw new Error("Blocked-aggregate consumption record is invalid");
  }
  return record;
}
