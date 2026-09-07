import {lstat,readFile,realpath} from "node:fs/promises";
import path from "node:path";
import {validateIncident} from "./verification-reliability-persistence.mjs";
import {git,normalized,repositoryRoot,timeoutIncidentDigest} from "./verification-reliability-values.mjs";
import {verificationTaskDigest} from "./verification-task-succession.mjs";
export function taskCheckpointShape(incident) {
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

