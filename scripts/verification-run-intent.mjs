import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { planVerification, verificationTaskIdentity } from "./verification-packs.mjs";
import {
  resolveIncidentTaskSuccession,
  verificationTaskDigest,
} from "./verification-task-succession.mjs";

export const verificationRunIntents = Object.freeze({
  development:"development-diagnostic",
  review:"review-evidence",
  repair:"repair-focused",
  terminal:"terminal",
});

const intentValues = new Set(Object.values(verificationRunIntents));

export function verificationRunIntent(options = {}) {
  if (options.terminalFull || options.boundedClosureEvidenceTask !== undefined &&
      options.prepareEvidence === options.boundedClosureEvidenceTask) {
    return verificationRunIntents.terminal;
  }
  if (options.timeoutRepairFocused || options.timeoutDiagnosticRetry) {
    return verificationRunIntents.repair;
  }
  if (options.prepareEvidence) return verificationRunIntents.review;
  return verificationRunIntents.development;
}

export function requireVerificationRunIntent(receipt, expected) {
  if (!intentValues.has(receipt?.runIntent)) {
    throw new Error("Verification receipt is missing a valid immutable run intent");
  }
  if (expected !== undefined && receipt.runIntent !== expected) {
    throw new Error(`Verification receipt run intent ${receipt.runIntent} cannot support ${expected}`);
  }
  return receipt.runIntent;
}

function safeLegacyReceiptPath(root, sourceReceipt) {
  if (typeof sourceReceipt !== "string" ||
      !/^tmp\/verification-receipts\/[A-Za-z0-9._-]+\.json$/u.test(sourceReceipt)) return null;
  const absolute = path.resolve(root, sourceReceipt);
  const relative = path.relative(path.resolve(root), absolute).split(path.sep).join("/");
  return relative === sourceReceipt ? absolute : null;
}

function readinessClaim(receipt) {
  const claims = [receipt.readiness, receipt.verified, receipt.evidence?.readiness,
    receipt.candidate?.readiness, receipt.candidate?.verified];
  return claims.some((value) => ["review-ready", "qa-ready", "final-ready", "qa-candidate"]
    .includes(value));
}

export async function classifyLegacyIncidentRunIntent({ root, incident }) {
  if (incident?.terminalVerificationDeferred) {
    return { applicable:false, blocking:true, reason:"terminal-verification-deferred" };
  }
  const sourcePath = safeLegacyReceiptPath(root, incident?.failure?.sourceReceipt);
  if (!sourcePath) return { applicable:true, blocking:true, reason:"missing-source-receipt" };
  let bytes;
  let receipt;
  try {
    bytes = await readFile(sourcePath);
    receipt = JSON.parse(bytes);
  } catch {
    return { applicable:true, blocking:true, reason:"unreadable-source-receipt" };
  }
  if (receipt.runIntent !== undefined) {
    return { applicable:false, blocking:receipt.runIntent !== verificationRunIntents.development,
      reason:"explicit-run-intent" };
  }
  const ordinaryMode = ["exact", "focused", "focused-task"].includes(receipt.plan?.mode);
  const noEvidenceAuthority = receipt.candidate?.evidenceTask === null &&
    receipt.pendingEvidence === undefined && receipt.evidence === undefined;
  const noRepairAuthority = receipt.timeoutRepairCheckpoint === undefined &&
    receipt.diagnostic === undefined && receipt.plan?.incidentId === undefined;
  const noTerminalAuthority = receipt.plan?.terminalClosure === undefined &&
    receipt.plan?.mode !== "terminal";
  const noReadinessClaim = !readinessClaim(receipt);
  const receiptShape = receipt.version === 2 && typeof receipt.runId === "string" &&
    typeof receipt.startedAt === "string" && receipt.tasks && !Array.isArray(receipt.tasks) &&
    typeof receipt.candidate?.commit === "string" && typeof receipt.candidate?.tree === "string";
  const proven = [ordinaryMode, noEvidenceAuthority, noRepairAuthority, noTerminalAuthority,
    noReadinessClaim, receiptShape].every(Boolean);
  return {
    applicable:true,
    blocking:!proven,
    reason:proven ? "receipt-proven-development-diagnostic" : "ambiguous-legacy-authority",
    sourceReceipt:incident.failure.sourceReceipt,
    receiptSha256:createHash("sha256").update(bytes).digest("hex"),
    proof:{ ordinaryMode, noEvidenceAuthority, noRepairAuthority, noTerminalAuthority,
      noReadinessClaim, receiptShape, interrupted:receipt.completedAt === undefined },
  };
}

function gitValue(root, ...args) {
  return new Promise((resolve, reject) => execFile("git", args, {
    cwd:root, maxBuffer:16 * 1024 * 1024,
  }, (error, stdout, stderr) => error
    ? reject(new Error(stderr.trim() || error.message)) : resolve(stdout)));
}

async function commitFile(root, commit, file) {
  try { return await gitValue(root, "show", `${commit}:${file}`); }
  catch { return null; }
}

export async function validateRunIntentBootstrapBase({
  root, baseCommit, changedPaths, readCommitFile = commitFile,
}) {
  const [feature, implementation] = await Promise.all([
    readCommitFile(root, baseCommit, "features/modular-verification-packs.feature"),
    readCommitFile(root, baseCommit, "scripts/verification-run-intent.mjs"),
  ]);
  const contractsPresent = typeof feature === "string" &&
    feature.includes("Modular verification packs 159") &&
    feature.includes("Modular verification packs 160");
  const implementationAbsent = implementation === null;
  const implementationAdded = changedPaths.includes("scripts/verification-run-intent.mjs");
  if (!contractsPresent || !implementationAbsent || !implementationAdded) {
    throw new Error("Run-intent bootstrap requires a contract-bearing base without implementation and a candidate that adds it");
  }
  return { version:1, baseCommit, contracts:[159, 160], implementationAbsent, implementationAdded };
}

export function bindRunIntentBootstrapPlan(executionPlan, bindingPlan, packs) {
  const authorized = new Set(executionPlan.requestedPackIds);
  const terminalObservations = planVerification(packs, { terminalFull:true }).observationTasks
    .filter(({ packId }) => authorized.has(packId));
  const observationTasks = [...new Map([
    ...executionPlan.observationTasks, ...terminalObservations,
  ].map((task) => [task.key, task])).values()];
  const tasks = executionPlan.tasks.flatMap((task) => task.stage === "browser-observation" ? [] : [task]);
  const insertion = tasks.findIndex(({ stage }) => stage === "acceptance-parse");
  tasks.splice(insertion < 0 ? tasks.length : insertion, 0, ...observationTasks);
  return {
    ...executionPlan,
    observationTasks,
    tasks,
    changedPaths:bindingPlan.changedPaths,
    changeSet:bindingPlan.changeSet,
    baseCommit:bindingPlan.baseCommit,
    changedOwners:bindingPlan.changedOwners,
    changedBoundaries:bindingPlan.changedBoundaries,
    styleSmokeTargets:bindingPlan.styleSmokeTargets,
    terminalFullObligations:bindingPlan.terminalFullObligations,
    changedStyleTargets:bindingPlan.changedStyleTargets,
    adapterAuthorizationPackIds:bindingPlan.adapterAuthorizationPackIds,
    conservativeHistoricalFallbackReason:bindingPlan.conservativeHistoricalFallbackReason,
  };
}

export function canonicalRunIntentBootstrapPlan(packs, {
  packIds, changeSet, basePacks, historicalRegistryFallback = false,
}) {
  const bindingPlan = planVerification(packs, {
    packIds:[], changedPaths:changeSet.paths, changeSet, includeProperties:true,
    basePacks, historicalRegistryFallback,
  });
  const executionPlan = planVerification(packs, { packIds, includeProperties:true });
  return bindRunIntentBootstrapPlan(executionPlan, bindingPlan, packs);
}

function eligibleTerminalDeferred(incident) {
  return incident?.state === "unresolved" && incident?.repair?.status === "eligible" &&
    incident?.terminalVerificationDeferred?.status === "terminal-verification-deferred";
}

export async function bootstrapReviewIncidentProof({ root, incident, evidenceTask }) {
  const sourcePath = safeLegacyReceiptPath(root, incident?.failure?.sourceReceipt);
  if (!sourcePath) return null;
  try {
    const bytes = await readFile(sourcePath);
    const receipt = JSON.parse(bytes);
    if (receipt.runIntent !== verificationRunIntents.review ||
        receipt.candidate?.evidenceTask !== evidenceTask ||
        receipt.runIntentBootstrap?.version !== 1 ||
        receipt.runIntentBootstrap.candidateCommit !== incident.failure.lineage.commit ||
        receipt.runIntentBootstrap.candidateTree !== incident.failure.lineage.tree) return null;
    return { sourceReceipt:incident.failure.sourceReceipt,
      sourceReceiptSha256:createHash("sha256").update(bytes).digest("hex") };
  } catch { return null; }
}

function exactCandidateEligibleRepair(incident, candidate) {
  const repair = incident?.repair;
  return incident?.state === "unresolved" && repair?.status === "eligible" &&
    repair.candidate?.commit === candidate?.commit && repair.candidate?.tree === candidate?.tree &&
    repair.regression?.status === "passed" && repair.regression.commit === candidate.commit &&
    repair.focusedReceipt?.status === "passed" && repair.focusedReceipt.commit === candidate.commit &&
    repair.causalProtocol?.repairResult?.status === "passed";
}

export async function runIntentBootstrapCoverage({
  incidents, plan, packs, candidate, root, evidenceTask,
  resolveSuccession = resolveIncidentTaskSuccession,
  reviewIncidentProof = bootstrapReviewIncidentProof,
}) {
  const admissions = new Map();
  for (const incident of incidents) {
    if (eligibleTerminalDeferred(incident)) {
      admissions.set(incident.id, { kind:"terminal-deferred" });
      continue;
    }
    if (exactCandidateEligibleRepair(incident, candidate)) {
      const proof = await reviewIncidentProof({ root, incident, evidenceTask });
      if (proof) admissions.set(incident.id, { kind:"exact-candidate-causal-repair", ...proof });
    }
  }
  const ineligible = incidents.filter((incident) => !admissions.has(incident.id));
  if (ineligible.length) {
    throw new Error(`Run-intent bootstrap cannot admit ineligible incident(s): ${
      ineligible.map(({ id }) => id).sort().join(", ")}`);
  }
  const selected = new Map(plan.tasks.map((task) => {
    const identity = verificationTaskIdentity(task);
    return [verificationTaskDigest(identity), identity];
  }));
  const canonical = planVerification(packs, { terminalFull:true }).tasks
    .map(verificationTaskIdentity);
  const coverage = [];
  for (const incident of incidents) {
    const failureDigest = verificationTaskDigest(incident.failure.task);
    let selectedIdentity = selected.get(failureDigest);
    let succession;
    if (!selectedIdentity) {
      succession = await resolveSuccession({ incident, currentIdentities:canonical,
        currentPacks:packs });
      selectedIdentity = selected.get(succession.destinationTaskDigest);
    }
    if (!selectedIdentity) {
      throw new Error(`Run-intent bootstrap exact plan does not select deferred incident ${incident.id} failure task or successor`);
    }
    coverage.push({
      incidentId:incident.id,
      admission:admissions.get(incident.id),
      failureTaskKey:incident.failure.task.key,
      selectedTaskKey:selectedIdentity.key,
      selectedTaskDigest:verificationTaskDigest(selectedIdentity),
      ...(succession ? { successionDigest:succession.conservationDigest } : {}),
    });
  }
  return coverage.sort((left, right) => left.incidentId.localeCompare(right.incidentId));
}

export function validateRunIntentBootstrapReceipt(receipt, bootstrap) {
  if (bootstrap?.version !== 1 || !Array.isArray(bootstrap.coverage)) {
    throw new Error("Run-intent bootstrap receipt binding is missing or malformed");
  }
  for (const row of bootstrap.coverage) {
    const result = receipt.tasks?.[row.selectedTaskKey];
    if (result?.status !== "passed" || result.provenance !== "fresh" ||
        verificationTaskDigest(result.identity) !== row.selectedTaskDigest) {
      throw new Error(`Run-intent bootstrap requires a fresh pass for ${row.selectedTaskKey}`);
    }
  }
  const packageResult = Object.values(receipt.tasks ?? {})
    .find(({ identity }) => identity?.stage === "package");
  if (packageResult?.status !== "passed" || packageResult.provenance !== "fresh") {
    throw new Error("Run-intent bootstrap requires fresh package proof");
  }
  return bootstrap;
}
