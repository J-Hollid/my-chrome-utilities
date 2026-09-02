import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";

import {
  validateIncident,
} from "./verification-reliability-persistence.mjs";
import {
  exactObject, git, normalized, repositoryRoot, timeoutIncidentDigest,
} from "./verification-reliability-values.mjs";
import { expandVerificationTaskPrerequisites } from "./verification-execution-prerequisites.mjs";
import {
  resolveIncidentTaskSuccession, successionDestinationIdentities, successionExecutions,
  verificationTaskDigest,
} from "./verification-task-succession.mjs";
import { verificationPolicyContractForPath, verificationPolicyContracts } from
  "./verification-policy/contracts.mjs";

const causalCategories = new Set([
  "viewport/visibility/hit testing", "readiness or settling", "readiness",
  "cleanup/resource lifecycle", "target isolation", "artifact/process locking",
  "duplicated or unbounded workload", "sandbox capability declaration/first-run routing",
]);

export function timeoutRepairCausalCategory(value) {
  if (typeof value !== "string" ||
      (!causalCategories.has(value) && !/^other:[^\s].{0,119}$/u.test(value))) {
    throw new Error("Reliability repair causal category must be a specified category or explicitly testable other:<cause>");
  }
  return value;
}

function validateCausalExplanation(value) {
  if (typeof value !== "string" || value !== value.trim() || value.length < 1 || value.length > 500 ||
      /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error("Reliability repair requires a bounded one-line causal explanation");
  }
  return value;
}

function taskCheckpointShape(incident) {
  const { failure } = incident;
  const boundary = failure?.failedBoundary;
  const task = failure?.task;
  return failure?.failureClass === "execution-contract-failure" &&
    JSON.stringify(Object.keys(boundary ?? {}).sort()) ===
      JSON.stringify(["kind", "operation", "stage", "trackedChanges"]) &&
    boundary.kind === "checkpoint-identity" && boundary.operation === "task" &&
    boundary.stage === task?.stage && task.stage !== "promotion" &&
    typeof task.key === "string" && Boolean(task.key) &&
    typeof task.packId === "string" && Boolean(task.packId) &&
    typeof task.executable === "string" && Boolean(task.executable) &&
    Array.isArray(task.args) && Array.isArray(task.requiredCapabilities) &&
    Array.isArray(boundary.trackedChanges) && boundary.trackedChanges.length > 0;
}

export function taskCheckpointRepairRequired(incident) {
  return taskCheckpointShape(incident);
}

async function defaultSourceReceiptLoader(incident) {
  const relative = incident.failure.sourceReceipt;
  if (!/^tmp\/verification-receipts\/[A-Za-z0-9._-]+\.json$/u.test(relative ?? "")) {
    throw new Error("Task-checkpoint repair requires immutable receipt proof");
  }
  const absolute = path.resolve(repositoryRoot, relative);
  const [details, canonical, bytes] = await Promise.all([
    lstat(absolute), realpath(absolute), readFile(absolute),
  ]);
  if (!details.isFile() || details.isSymbolicLink() || canonical !== absolute) {
    throw new Error("Task-checkpoint repair requires immutable receipt proof");
  }
  let receipt;
  try { receipt = JSON.parse(bytes); }
  catch { throw new Error("Task-checkpoint repair requires immutable receipt proof"); }
  return { path:relative, bytes, receipt };
}

async function defaultHistoricalPlanLoader(incident, receipt) {
  const [{ verificationPacksAtCommit }, planner, tasksPlanner] = await Promise.all([
    import("./verification-changes.mjs"), import("./verification-packs.mjs"),
    import("./verification-planner/tasks/planner.mjs"),
  ]);
  const commit = incident.failure.lineage.commit;
  const [tree, packs] = await Promise.all([
    git(repositoryRoot, "rev-parse", `${commit}^{tree}`),
    verificationPacksAtCommit(commit, { repositoryRoot }),
  ]);
  const plan = planner.planVerification(packs, {
    packIds:receipt.plan?.selectedPackIds,
    includeProperties:true,
  });
  const tasks = plan.tasks.map(tasksPlanner.verificationTaskIdentity);
  return { commit, tree, registryDigest:timeoutIncidentDigest(packs),
    taskPlanDigest:receipt.plan?.taskPlanDigest, tasks };
}

function validatedTaskCheckpointRepairProof(incident, proof) {
  if (!taskCheckpointShape(incident) || !proof || proof.version !== 1 ||
      proof.incidentId !== incident.id || proof.failureDigest !== incident.failureDigest ||
      proof.taskDigest !== verificationTaskDigest(incident.failure.task) ||
      proof.failedBoundaryDigest !== timeoutIncidentDigest(incident.failure.failedBoundary) ||
      proof.boundary?.kind !== "task" || proof.boundary.taskKey !== incident.failure.task.key ||
      JSON.stringify(proof.boundary.executionArgs) !== JSON.stringify(incident.failure.task.args) ||
      !/^[a-f0-9]{64}$/u.test(proof.sourceReceipt?.sha256 ?? "") ||
      proof.sourceReceipt.path !== incident.failure.sourceReceipt ||
      proof.sourceReceipt.runId !== incident.failure.runnerRunId ||
      ![proof.registryDigest, proof.planDigest, proof.causalKey, proof.digest]
        .every((value) => /^[a-f0-9]{64}$/u.test(value ?? ""))) {
    throw new Error(`Reliability incident ${incident.id} has no trusted task-checkpoint repair proof`);
  }
  const causalKey = timeoutIncidentDigest({ version:1, kind:"task-checkpoint-repair",
    incidentId:incident.id, failureDigest:incident.failureDigest,
    sourceReceipt:proof.sourceReceipt, registryDigest:proof.registryDigest,
    planDigest:proof.planDigest, taskDigest:proof.taskDigest,
    failedBoundaryDigest:proof.failedBoundaryDigest });
  const unsigned = { ...proof }; delete unsigned.digest;
  if (proof.causalKey !== causalKey || proof.digest !== timeoutIncidentDigest(unsigned) ||
      incident.failure.registryDigest !== undefined &&
        incident.failure.registryDigest !== proof.registryDigest ||
      incident.failure.causalKey !== undefined && incident.failure.causalKey !== causalKey ||
      incident.causalKey !== undefined && incident.causalKey !== causalKey) {
    throw new Error(`Reliability incident ${incident.id} has mismatched task-checkpoint repair proof`);
  }
  return structuredClone(proof);
}

export function validateTaskCheckpointRepairProof(incident, proof) {
  return validatedTaskCheckpointRepairProof(incident, proof);
}

export async function deriveTaskCheckpointRepairProof(incident, {
  sourceReceiptLoader = defaultSourceReceiptLoader,
  historicalPlanLoader = defaultHistoricalPlanLoader,
} = {}) {
  validateIncident(incident);
  if (!taskCheckpointShape(incident)) {
    throw new Error(`Reliability incident ${incident.id} has no trusted task-checkpoint repair shape`);
  }
  const document = await sourceReceiptLoader(incident);
  let parsed;
  try { parsed = JSON.parse(document.bytes); }
  catch { throw new Error("Task-checkpoint repair requires immutable receipt proof"); }
  if (JSON.stringify(normalized(parsed)) !== JSON.stringify(normalized(document.receipt))) {
    throw new Error("Task-checkpoint repair requires immutable receipt proof");
  }
  const receipt = document.receipt;
  const historical = await historicalPlanLoader(incident, receipt);
  const task = incident.failure.task;
  const canonical = historical.tasks?.filter(({ key }) => key === task.key) ?? [];
  if (historical.commit !== incident.failure.lineage.commit ||
      historical.tree !== incident.failure.lineage.tree || canonical.length !== 1 ||
      verificationTaskDigest(canonical[0]) !== verificationTaskDigest(task)) {
    throw new Error("Task-checkpoint repair requires canonical task proof");
  }
  const prerequisite = receipt.plan?.executionPrerequisites?.filter(({ key }) => key === task.key) ?? [];
  const receiptCandidate = receipt.candidate;
  const prelaunch = receipt.tasks?.[task.key] === undefined;
  const exactReceipt = receipt.version === 2 && receipt.runId === incident.failure.runnerRunId &&
    receiptCandidate?.commit === incident.failure.lineage.commit &&
    receiptCandidate?.tree === incident.failure.lineage.tree && receipt.plan?.mode === "exact" &&
    Array.isArray(receipt.plan.requestedPackIds) && receipt.plan.requestedPackIds.length > 0 &&
    JSON.stringify(receipt.plan.requestedPackIds) === JSON.stringify(receipt.plan.selectedPackIds) &&
    timeoutIncidentDigest(receipt.plan) === incident.failure.planDigest &&
    receipt.registryDigest === historical.registryDigest &&
    /^[a-f0-9]{64}$/u.test(historical.taskPlanDigest ?? "") &&
    receipt.plan.taskPlanDigest === historical.taskPlanDigest && prerequisite.length === 1 &&
    JSON.stringify(prerequisite[0].requiredCapabilities) ===
      JSON.stringify(task.requiredCapabilities) && typeof prerequisite[0].route === "string" &&
    Boolean(receipt.checkpointAttempt?.id) && prelaunch;
  if (!exactReceipt) {
    throw new Error(prelaunch
      ? "Task-checkpoint repair requires immutable receipt proof"
      : "Task-checkpoint repair requires prelaunch checkpoint proof");
  }
  const sourceReceipt = { path:document.path,
    sha256:timeoutIncidentDigest(document.bytes), runId:receipt.runId };
  const taskDigest = verificationTaskDigest(task);
  const failedBoundaryDigest = timeoutIncidentDigest(incident.failure.failedBoundary);
  const causalKey = timeoutIncidentDigest({ version:1, kind:"task-checkpoint-repair",
    incidentId:incident.id, failureDigest:incident.failureDigest, sourceReceipt,
    registryDigest:historical.registryDigest, planDigest:historical.taskPlanDigest,
    taskDigest, failedBoundaryDigest });
  const proof = { version:1, incidentId:incident.id, failureDigest:incident.failureDigest,
    sourceReceipt, registryDigest:historical.registryDigest,
    planDigest:historical.taskPlanDigest, taskDigest, failedBoundaryDigest,
    boundary:{ kind:"task", taskKey:task.key, executionArgs:[...task.args] }, causalKey };
  return validatedTaskCheckpointRepairProof(incident,
    { ...proof, digest:timeoutIncidentDigest(proof) });
}

export function timeoutRepairDiagnosedBoundary(incident, { taskCheckpointProof } = {}) {
  validateIncident(incident);
  if (incident.failure.retryScope) return structuredClone(incident.failure.retryScope);
  if (taskCheckpointProof) {
    return validatedTaskCheckpointRepairProof(incident, taskCheckpointProof).boundary;
  }
  const { failure } = incident;
  if (failure.failureClass === "execution-contract-failure" &&
      failure.task?.stage === "promotion" && failure.failedBoundary?.kind === "checkpoint-identity" &&
      typeof failure.failedBoundary.operation === "string" && failure.failedBoundary.operation) {
    return { kind:"promotion-operation", operation:failure.failedBoundary.operation };
  }
  if (failure.failureClass === "environment-contract-failure" &&
      failure.task?.stage !== "browser-observation" &&
      typeof failure.task?.key === "string" && failure.task.key &&
      Array.isArray(failure.task.args)) {
    return { kind:"task", taskKey:failure.task.key, executionArgs:[...failure.task.args] };
  }
  const logicalTargetId = failure.failedBoundary?.logicalTargetId;
  if (failure.failureClass !== "explicit-logical-failure" ||
      failure.task?.stage !== "browser-observation" ||
      failure.failedBoundary?.boundary !== undefined ||
      typeof logicalTargetId !== "string" || !logicalTargetId ||
      !failure.task.logicalTargetIds?.includes(logicalTargetId)) {
    throw new Error(`Reliability incident ${incident.id} has no trusted repair boundary`);
  }
  return { kind:"target", logicalTargetIds:[logicalTargetId],
    executionArgs:["scripts/run-browser-observation.mjs", logicalTargetId] };
}

export function timeoutRepairCandidate(incident) {
  if (!incident.repair?.candidate) return undefined;
  let candidate = structuredClone(incident.repair.candidate);
  for (const mapping of incident.lineageTransitions ?? []) {
    if (mapping.kind === "rebase" && mapping.fromCommit === candidate.commit) {
      candidate = { commit:mapping.toCommit, tree:mapping.toTree };
    }
  }
  return candidate;
}

export function terminalConfirmedFlakyIncident(incident) {
  return incident.repair === undefined &&
    incident.retry?.status === "classified" &&
    incident.retry.identity === incident.failure?.retryIdentity &&
    incident.retry.outcome === "passed" &&
    incident.retry.classification === "confirmed-flaky" &&
    incident.closureAudit?.kind === "blocking-product-repair" &&
    incident.closureAudit.blocking === true && incident.closureAudit.resolved === false;
}

export function terminalCheckpointCandidate(incident) {
  let candidate = timeoutRepairCandidate(incident) ??
    (["confirmed-flaky", "bootstrap-terminal-obligation"]
      .includes(incident.terminalVerificationDeferred?.basis)
      ? structuredClone(incident.terminalVerificationDeferred.candidate)
      : terminalConfirmedFlakyIncident(incident)
        ? structuredClone(incident.failure.lineage) : undefined);
  if (!candidate) return undefined;
  for (const mapping of incident.lineageTransitions ?? []) {
    if (mapping.kind === "rebase" && mapping.fromCommit === candidate.commit) {
      candidate = { commit:mapping.toCommit, tree:mapping.toTree };
    }
  }
  return candidate;
}

export function timeoutRepairFocusedTaskKeys(incident, changedPaths, regressionKey, taskSuccession) {
  validateIncident(incident);
  const internalExecutionContract = incident.failure.failureClass === "execution-contract-failure" &&
    incident.failure.task.stage === "promotion";
  const successionKeys = successionDestinationIdentities(taskSuccession).map(({ key }) => key);
  const regressionKeys = regressionKey === "unit:test/verification-process-contract-test.mjs"
    ? verificationPolicyContracts.flatMap(({testPaths})=>
      testPaths.map((testPath)=>`unit:${testPath}`))
    : [regressionKey];
  const keys = new Set([...(internalExecutionContract ? regressionKeys
    : successionKeys.length ? successionKeys : [incident.failure.task.key]), ...regressionKeys]);
  if (changedPaths.some((changedPath) => changedPath.startsWith("scripts/") ||
      changedPath.startsWith("test/support/") ||
      changedPath.startsWith("acceptance/src/acceptance/verification_support/"))) {
    const affected = changedPaths.map(verificationPolicyContractForPath).filter(Boolean);
    const contracts = affected.length ? affected : verificationPolicyContracts;
    for (const { testPaths } of contracts) {
      for (const testPath of testPaths) keys.add(`unit:${testPath}`);
    }
  }
  if (changedPaths.some((changedPath) => changedPath.startsWith("swarmforge/") ||
      ["scripts/verification-evidence.mjs", "scripts/verification-reliability-incidents.mjs",
        "scripts/verification-timeout-incidents.mjs", "scripts/run-focused-acceptance.mjs"]
        .includes(changedPath))) {
    keys.add("unit:test/swarmforge-process-contract-test.mjs");
  }
  return [...keys].sort();
}

export function timeoutRepairFocusedTaskPlan(incident, changedPaths, regressionKey, canonicalIdentities,
  taskSuccession = undefined, taskCheckpointProof = undefined) {
  validateIncident(incident);
  const diagnosedBoundary = timeoutRepairDiagnosedBoundary(incident, { taskCheckpointProof });
  if (!Array.isArray(canonicalIdentities)) throw new Error("Canonical repair task identities are required");
  const canonical = new Map(canonicalIdentities.map((identity) => [identity.key, normalized(identity)]));
  const incidentTaskDigest = verificationTaskDigest(incident.failure.task);
  const successionDestinations = successionDestinationIdentities(taskSuccession);
  const successionDestinationKeys = new Set(successionDestinations.map(({ key }) => key));
  const successionExecutionByKey = new Map(successionExecutions(taskSuccession)
    .map((execution) => [execution.identity.key, execution]));
  const internalExecutionContract = incident.failure.failureClass === "execution-contract-failure" &&
    incident.failure.task.stage === "promotion";
  if (taskSuccession && (taskSuccession.sourceTaskDigest !== incidentTaskDigest ||
      !successionDestinations.length || successionDestinations.length !== successionExecutionByKey.size ||
      !taskSuccession.chain?.length || !taskSuccession.conservationDigest ||
      successionDestinations.some((identity) =>
        JSON.stringify(normalized(successionExecutionByKey.get(identity.key)?.identity)) !==
          JSON.stringify(normalized(identity))))) {
    throw new Error("Reliability repair task succession does not bind the immutable incident task");
  }
  const expectedKeys = timeoutRepairFocusedTaskKeys(incident, changedPaths, regressionKey, taskSuccession);
  const roles = new Map();
  const addRole = (key, role) => {
    if (!roles.has(key)) roles.set(key, new Set());
    roles.get(key).add(role);
  };
  for (const key of internalExecutionContract
    ? timeoutRepairFocusedTaskKeys(incident, [], regressionKey, taskSuccession)
    : successionDestinationKeys.size ? successionDestinationKeys : [incident.failure.task.key]) {
    addRole(key, "diagnosed-boundary");
  }
  const regressionKeys = regressionKey === "unit:test/verification-process-contract-test.mjs"
    ? verificationPolicyContracts.flatMap(({testPaths})=>
      testPaths.map((testPath)=>`unit:${testPath}`))
    : [regressionKey];
  for (const key of regressionKeys) addRole(key, "causal-regression");
  for (const key of expectedKeys) {
    if (key.startsWith("unit:test/") && ["unit:test/verification-process-contract-test.mjs",
      "unit:test/swarmforge-process-contract-test.mjs"].includes(key)) addRole(key, "affected-process-contract");
  }
  const taskPlan = expectedKeys.map((key) => {
    const identity = canonical.get(key);
    const priorIdentity = key === incident.failure.task.key && !taskSuccession
      ? normalized(incident.failure.task) : undefined;
    const executionIdentity = (value) => value && Object.fromEntries(Object.entries(value)
      .filter(([field]) => field !== "requiredCapabilities"));
    if (!identity || (priorIdentity && JSON.stringify(executionIdentity(priorIdentity)) !==
        JSON.stringify(executionIdentity(identity)))) {
      throw new Error(`Reliability repair task ${key} is not a canonical current task identity`);
    }
    const descriptor = { identity, roles:[...(roles.get(key) ?? new Set())].sort() };
    if (!internalExecutionContract && (successionDestinationKeys.has(key) ||
        !taskSuccession && key === incident.failure.task.key)) {
      const successionExecution = successionExecutionByKey.get(key);
      descriptor.executionArgs = [...(successionExecution?.args ?? diagnosedBoundary.executionArgs)];
      descriptor.executionLogicalTargetIds = [...(successionExecution?.logicalTargetIds ??
        diagnosedBoundary.logicalTargetIds ?? [])];
      if (taskSuccession) descriptor.taskSuccession = {
        version:taskSuccession.version,
        sourceTaskDigest:taskSuccession.sourceTaskDigest,
        destinationTaskDigests:successionDestinations.map(verificationTaskDigest),
        selectedDestinationTaskDigest:verificationTaskDigest(identity),
        chain:structuredClone(taskSuccession.chain),
        logicalSlice:structuredClone(taskSuccession.logicalSlice),
        conservationDigest:taskSuccession.conservationDigest,
      };
    }
    return descriptor;
  });
  return taskPlan.sort((left, right) => left.identity.key.localeCompare(right.identity.key));
}

export function timeoutRepairFocusedExecutionTaskPlan(taskPlan, canonicalIdentities) {
  if (!Array.isArray(taskPlan) || !Array.isArray(canonicalIdentities)) {
    throw new Error("Reliability repair execution requires canonical task plans");
  }
  const descriptors = new Map(taskPlan.map((descriptor) => [descriptor.identity?.key, descriptor]));
  if (descriptors.size !== taskPlan.length || descriptors.has(undefined)) {
    throw new Error("Reliability repair execution requires unique repair task identities");
  }
  const canonical = new Map(canonicalIdentities.map((identity) => [identity.key, identity]));
  const selected = new Set(descriptors.keys());
  const selectedIdentities = [...selected].map((key) => canonical.get(key));
  if (selectedIdentities.some((identity) => !identity)) {
    throw new Error("Reliability repair execution task is not a canonical current identity");
  }
  const closedIdentities = expandVerificationTaskPrerequisites(
    selectedIdentities, canonicalIdentities, { mode:"repair-focused" });
  for (const { key } of closedIdentities) selected.add(key);
  const executionTaskPlan = closedIdentities
    .map((identity) => descriptors.get(identity.key) ?? {
      identity:structuredClone(identity), roles:["prerequisite"],
    });
  if (executionTaskPlan.length !== selected.size) {
    throw new Error("Reliability repair prerequisites are not canonical current task identities");
  }
  return executionTaskPlan;
}

function regressionProtocol(document, regressionKey, incidentId) {
  const output = document.receipt.tasks[regressionKey]?.output ?? "";
  const records = output.split(/\r?\n/u).filter(Boolean).flatMap((line) => {
    try {
      const parsed = JSON.parse(line).swarmforgeTimeoutRepairRegression;
      return parsed?.incidentId === incidentId ? [parsed] : [];
    } catch { return []; }
  });
  if (records.length !== 1) throw new Error("Reliability repair requires one causal regression protocol record");
  return records[0];
}

function validateRegressionEvidence(incident, proposal, protocol) {
  const diagnosedBoundary = timeoutRepairDiagnosedBoundary(incident,
    { taskCheckpointProof:proposal.taskCheckpointProof });
  const invalidEvidence = () => new Error("Reliability repair causal regression must contain bounded cause-specific fixture evidence with an observed pre-repair failure and repaired result");
  if (!protocol?.fixture || typeof protocol.fixture !== "object" || Array.isArray(protocol.fixture) ||
      !protocol.preRepairResult || typeof protocol.preRepairResult !== "object" ||
      Array.isArray(protocol.preRepairResult) || !protocol.repairResult ||
      typeof protocol.repairResult !== "object" || Array.isArray(protocol.repairResult)) {
    throw invalidEvidence();
  }
  const fixture = exactObject(protocol.fixture, "Reliability repair causal fixture");
  const preRepairResult = exactObject(protocol.preRepairResult, "Reliability repair pre-repair result");
  const repairResult = exactObject(protocol.repairResult, "Reliability repair result");
  let encodedFixture;
  try { encodedFixture = JSON.stringify(fixture); }
  catch { throw new Error("Reliability repair causal fixture must be serializable"); }
  const fixtureDigest = timeoutIncidentDigest(fixture);
  if (protocol.version !== 2 || protocol.incidentId !== incident.id ||
      protocol.failureDigest !== incident.failureDigest ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(fixture.id ?? "") ||
      fixture.causalCategory !== proposal.causalCategory || encodedFixture.length > 16_384 ||
      fixture.diagnosedBoundaryDigest !== timeoutIncidentDigest(diagnosedBoundary) ||
      !fixture.expectedPreRepairFailure || !fixture.expectedRepairResult ||
      JSON.stringify(normalized(fixture.expectedPreRepairFailure)) ===
        JSON.stringify(normalized(fixture.expectedRepairResult)) ||
      preRepairResult.status !== "failed" || repairResult.status !== "passed" ||
      preRepairResult.fixtureDigest !== fixtureDigest || repairResult.fixtureDigest !== fixtureDigest ||
      JSON.stringify(normalized(preRepairResult.observed)) !==
        JSON.stringify(normalized(fixture.expectedPreRepairFailure)) ||
      JSON.stringify(normalized(repairResult.observed)) !==
        JSON.stringify(normalized(fixture.expectedRepairResult))) {
    throw invalidEvidence();
  }
  return protocol;
}

export async function validateRepairReceiptSemantics(incident, proposal, regressionDocument,
  focusedDocument, canonicalRepairTaskIdentities) {
  timeoutRepairCausalCategory(proposal.causalCategory);
  validateCausalExplanation(proposal.causalExplanation);
  const taskCheckpointProof = taskCheckpointShape(incident)
    ? validatedTaskCheckpointRepairProof(incident, proposal.taskCheckpointProof)
    : undefined;
  if (!taskCheckpointShape(incident) && proposal.taskCheckpointProof !== undefined) {
    throw new Error(`Reliability incident ${incident.id} does not permit task-checkpoint repair proof`);
  }
  const protocol = validateRegressionEvidence(incident, proposal,
    regressionProtocol(regressionDocument, proposal.regression.key, incident.id));
  const canonicalIdentities = await canonicalRepairTaskIdentities({ incident, proposal });
  const hasIncidentIdentity = canonicalIdentities.some((identity) =>
    verificationTaskDigest(identity) === verificationTaskDigest(incident.failure.task));
  let taskSuccession;
  const internalExecutionContract = incident.failure.failureClass === "execution-contract-failure" &&
    incident.failure.task.stage === "promotion";
  if (!hasIncidentIdentity && !internalExecutionContract) {
    const { loadVerificationPacks } = await import("./verification-packs.mjs");
    taskSuccession = await resolveIncidentTaskSuccession({ incident, currentIdentities:canonicalIdentities,
      currentPacks:await loadVerificationPacks() });
  }
  const expectedTaskPlan = timeoutRepairFocusedTaskPlan(incident, proposal.changedPaths,
    proposal.regression.key, canonicalIdentities, taskSuccession, taskCheckpointProof);
  const expectedExecutionTaskPlan = timeoutRepairFocusedExecutionTaskPlan(
    expectedTaskPlan, canonicalIdentities);
  const expectedFocusedKeys = expectedExecutionTaskPlan.map(({ identity }) => identity.key);
  if (focusedDocument.receipt.plan?.mode !== "timeout-repair-focused" ||
      focusedDocument.receipt.plan?.incidentId !== incident.id ||
      focusedDocument.receipt.plan?.causalCategory !== proposal.causalCategory ||
      focusedDocument.receipt.plan?.causalExplanation !== proposal.causalExplanation ||
      JSON.stringify(normalized(focusedDocument.receipt.plan.taskCheckpointProof)) !==
        JSON.stringify(normalized(taskCheckpointProof)) ||
      regressionDocument.sha256 !== focusedDocument.sha256 ||
      JSON.stringify(normalized(focusedDocument.receipt.plan.taskSuccession)) !==
        JSON.stringify(normalized(taskSuccession)) ||
      JSON.stringify(normalized(focusedDocument.receipt.plan.taskPlan)) !==
        JSON.stringify(normalized(expectedTaskPlan)) ||
      JSON.stringify(normalized(focusedDocument.receipt.plan.executionTaskPlan)) !==
        JSON.stringify(normalized(expectedExecutionTaskPlan)) ||
      JSON.stringify(Object.keys(focusedDocument.receipt.tasks).sort()) !==
        JSON.stringify([...expectedFocusedKeys].sort()) ||
      expectedExecutionTaskPlan.some(({ identity }) => JSON.stringify(normalized(
        focusedDocument.receipt.tasks[identity.key]?.identity)) !== JSON.stringify(normalized(identity))) ||
      expectedTaskPlan.some(({ identity, executionArgs, executionLogicalTargetIds }) => executionArgs &&
        JSON.stringify(normalized(focusedDocument.receipt.tasks[identity.key]?.execution)) !==
          JSON.stringify(normalized({ args:executionArgs,
            logicalTargetIds:executionLogicalTargetIds ?? [] })))) {
    throw new Error("Reliability repair focused repair plan contains unrelated or missing tasks");
  }
  return { ...proposal, diagnosedBoundary:timeoutRepairDiagnosedBoundary(incident,
    { taskCheckpointProof }),
    causalProtocol:protocol, focusedTaskPlan:expectedTaskPlan };
}

export async function validateTimeoutRepairProposal(incident, proposal, { isAncestor } = {}) {
  validateIncident(incident);
  exactObject(proposal, "Reliability repair proposal");
  if (taskCheckpointShape(incident)) {
    validatedTaskCheckpointRepairProof(incident, proposal.taskCheckpointProof);
  } else if (proposal.taskCheckpointProof !== undefined) {
    throw new Error(`Reliability incident ${incident.id} does not permit task-checkpoint repair proof`);
  }
  const failed = incident.failure.lineage;
  if (!proposal.candidate?.commit || !proposal.candidate?.tree ||
      proposal.candidate.commit === failed.commit || proposal.candidate.tree === failed.tree ||
      !(await (isAncestor ?? (async (ancestor, descendant) => {
        try { await git(repositoryRoot, "merge-base", "--is-ancestor", ancestor, descendant); return true; }
        catch { return false; }
      }))(failed.commit, proposal.candidate.commit))) {
    throw new Error("Reliability repair must use a descendant changed candidate and tree");
  }
  const changedPaths = proposal.changedPaths ?? [];
  const limitDeclaration = /(?:performance-calibration|timing-baseline|budget|timeout|worker)/iu;
  if (!changedPaths.length || changedPaths.every((changedPath) => limitDeclaration.test(changedPath))) {
    throw new Error("Reliability repair is rejected as a limit-only or unrelated change");
  }
  timeoutRepairCausalCategory(proposal.causalCategory);
  const capabilityRoutingCategory = "sandbox capability declaration/first-run routing";
  if ((incident.failure.failureClass === "environment-contract-failure") !==
      (proposal.causalCategory === capabilityRoutingCategory)) {
    throw new Error("Environment-contract failures and capability-routing repairs cannot relabel another incident class");
  }
  validateCausalExplanation(proposal.causalExplanation);
  if (typeof proposal.checkpoint?.baseCommit !== "string" || !proposal.checkpoint.baseCommit ||
      typeof proposal.checkpoint?.evidenceTask !== "string" || !proposal.checkpoint.evidenceTask) {
    throw new Error("Reliability repair requires the approved checkpoint base and evidence task");
  }
  if (proposal.regression?.status !== "passed" || proposal.regression?.commit !== proposal.candidate.commit ||
      typeof proposal.regression?.key !== "string") {
    throw new Error("Reliability repair requires a deterministic regression on the repair commit");
  }
  if (proposal.focusedReceipt?.status !== "passed" ||
      proposal.focusedReceipt?.commit !== proposal.candidate.commit ||
      proposal.focusedReceipt?.provenance !== "fresh") {
    throw new Error("Reliability repair requires fresh focused verification from the repair tree");
  }
  return { ...structuredClone(proposal), status:"eligible", validatedAt:new Date().toISOString() };
}

export function timeoutResolutionEvidence(incident) {
  validateIncident(incident);
  if (incident.state !== "resolved") throw new Error(`Reliability incident ${incident.id} is unresolved`);
  const repairCandidate = timeoutRepairCandidate(incident);
  return {
    incidentId:incident.id,
    failureDigest:incident.failureDigest,
    diagnosticClassification:incident.retry?.classification,
    repairCommit:repairCandidate.commit,
    repairTree:repairCandidate.tree,
    causalCategory:incident.repair.causalCategory,
    causalExplanation:incident.repair.causalExplanation,
    diagnosedBoundary:incident.repair.diagnosedBoundary,
    regression:incident.repair.regression,
    focusedReceipt:incident.repair.focusedReceipt,
    checkpointReceiptSha256:incident.resolution.checkpoint.receiptSha256,
    packageReceiptSha256:incident.resolution.package.receiptSha256,
    packageDigest:incident.resolution.package.digest,
    resolutionDigest:incident.resolution.digest,
  };
}
