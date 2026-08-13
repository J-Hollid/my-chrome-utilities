import {
  validateIncident,
} from "./verification-reliability-persistence.mjs";
import {
  exactObject, git, normalized, repositoryRoot, timeoutIncidentDigest,
} from "./verification-reliability-values.mjs";
import { expandVerificationTaskPrerequisites } from "./verification-execution-prerequisites.mjs";
import {
  resolveIncidentTaskSuccession, verificationTaskDigest,
} from "./verification-task-succession.mjs";

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

export function timeoutRepairDiagnosedBoundary(incident) {
  validateIncident(incident);
  if (incident.failure.retryScope) return structuredClone(incident.failure.retryScope);
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

export function timeoutRepairFocusedTaskKeys(incident, changedPaths, regressionKey, taskSuccession) {
  validateIncident(incident);
  const internalExecutionContract = incident.failure.failureClass === "execution-contract-failure" &&
    incident.failure.task.stage === "promotion";
  const keys = new Set([internalExecutionContract ? regressionKey
    : taskSuccession?.destinationIdentity?.key ?? incident.failure.task.key, regressionKey]);
  if (changedPaths.some((changedPath) => changedPath.startsWith("scripts/") ||
      changedPath.startsWith("test/support/") ||
      changedPath.startsWith("acceptance/src/acceptance/verification_support/"))) {
    keys.add("unit:test/verification-process-contract-test.mjs");
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
  taskSuccession = undefined) {
  validateIncident(incident);
  const diagnosedBoundary = timeoutRepairDiagnosedBoundary(incident);
  if (!Array.isArray(canonicalIdentities)) throw new Error("Canonical repair task identities are required");
  const canonical = new Map(canonicalIdentities.map((identity) => [identity.key, normalized(identity)]));
  const incidentTaskDigest = verificationTaskDigest(incident.failure.task);
  const successionDestinationKey = taskSuccession?.destinationIdentity?.key;
  const internalExecutionContract = incident.failure.failureClass === "execution-contract-failure" &&
    incident.failure.task.stage === "promotion";
  if (taskSuccession && (taskSuccession.sourceTaskDigest !== incidentTaskDigest ||
      taskSuccession.destinationTaskDigest !== verificationTaskDigest(taskSuccession.destinationIdentity) ||
      !taskSuccession.chain?.length || !taskSuccession.conservationDigest ||
      !taskSuccession.execution?.identity ||
      JSON.stringify(normalized(taskSuccession.execution.identity)) !==
        JSON.stringify(normalized(taskSuccession.destinationIdentity)))) {
    throw new Error("Reliability repair task succession does not bind the immutable incident task");
  }
  const expectedKeys = timeoutRepairFocusedTaskKeys(incident, changedPaths, regressionKey, taskSuccession);
  const roles = new Map();
  const addRole = (key, role) => {
    if (!roles.has(key)) roles.set(key, new Set());
    roles.get(key).add(role);
  };
  addRole(internalExecutionContract ? regressionKey
    : successionDestinationKey ?? incident.failure.task.key, "diagnosed-boundary");
  addRole(regressionKey, "causal-regression");
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
    if (!internalExecutionContract && key === (successionDestinationKey ?? incident.failure.task.key)) {
      descriptor.executionArgs = [...(taskSuccession?.execution.args ?? diagnosedBoundary.executionArgs)];
      descriptor.executionLogicalTargetIds = [...(taskSuccession?.execution.logicalTargetIds ??
        diagnosedBoundary.logicalTargetIds ?? [])];
      if (taskSuccession) descriptor.taskSuccession = {
        version:taskSuccession.version,
        sourceTaskDigest:taskSuccession.sourceTaskDigest,
        destinationTaskDigest:taskSuccession.destinationTaskDigest,
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
  const diagnosedBoundary = timeoutRepairDiagnosedBoundary(incident);
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
    proposal.regression.key, canonicalIdentities, taskSuccession);
  const expectedExecutionTaskPlan = timeoutRepairFocusedExecutionTaskPlan(
    expectedTaskPlan, canonicalIdentities);
  const expectedFocusedKeys = expectedExecutionTaskPlan.map(({ identity }) => identity.key);
  if (focusedDocument.receipt.plan?.mode !== "timeout-repair-focused" ||
      focusedDocument.receipt.plan?.incidentId !== incident.id ||
      focusedDocument.receipt.plan?.causalCategory !== proposal.causalCategory ||
      focusedDocument.receipt.plan?.causalExplanation !== proposal.causalExplanation ||
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
  return { ...proposal, diagnosedBoundary:timeoutRepairDiagnosedBoundary(incident),
    causalProtocol:protocol, focusedTaskPlan:expectedTaskPlan };
}

export async function validateTimeoutRepairProposal(incident, proposal, { isAncestor } = {}) {
  validateIncident(incident);
  exactObject(proposal, "Reliability repair proposal");
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
