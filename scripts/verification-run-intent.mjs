import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { planVerification, verificationTaskIdentity } from "./verification-packs.mjs";
import {
  resolveIncidentTaskSuccession,
  verificationTaskDigest,
} from "./verification-task-succession.mjs";
import { timeoutIncidentDigest } from "./verification-reliability-values.mjs";
import { validateIncident } from "./verification-reliability-persistence.mjs";

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

export async function governedRepairAttemptAssociation({ root, incident, resolveIncident }) {
  const sourcePath = safeLegacyReceiptPath(root, incident?.failure?.sourceReceipt);
  if (!sourcePath || typeof resolveIncident !== "function") return null;
  let bytes;
  let receipt;
  try {
    bytes = await readFile(sourcePath);
    receipt = JSON.parse(bytes);
  } catch { return null; }
  const governedIncidentId = receipt.plan?.incidentId;
  if (receipt.runIntent !== verificationRunIntents.repair ||
      receipt.plan?.mode !== "timeout-repair-focused" ||
      typeof governedIncidentId !== "string" || governedIncidentId === incident.id ||
      receipt.candidate?.commit !== incident.failure?.lineage?.commit ||
      receipt.candidate?.tree !== incident.failure?.lineage?.tree ||
      receipt.runId !== incident.failure?.runnerRunId ||
      receipt.tasks?.[incident.failure?.task?.key]?.status !== "failed" ||
      receipt.tasks?.[incident.failure?.task?.key]?.reliabilityFailureFingerprint !==
        incident.failure?.fingerprint ||
      verificationTaskDigest(receipt.tasks?.[incident.failure?.task?.key]?.identity) !==
        verificationTaskDigest(incident.failure?.task) ||
      incident.failure?.planDigest !== timeoutIncidentDigest(receipt.plan ?? {})) return null;
  const taskDigest = verificationTaskDigest(incident.failure.task);
  const exactPlanMembership = [receipt.plan.taskPlan, receipt.plan.executionTaskPlan]
    .every((descriptors) => Array.isArray(descriptors) && descriptors.some(({ identity }) =>
      verificationTaskDigest(identity) === taskDigest));
  if (!exactPlanMembership) return null;
  try { await resolveIncident(governedIncidentId); }
  catch { return null; }
  const withoutDigest = {
    version:1, status:"governed-repair-attempt", governedIncidentId,
    sourceReceipt:incident.failure.sourceReceipt,
    receiptSha256:createHash("sha256").update(bytes).digest("hex"),
    runId:receipt.runId,
    candidate:{ commit:receipt.candidate.commit, tree:receipt.candidate.tree },
    taskKey:incident.failure.task.key, taskDigest,
    planDigest:incident.failure.planDigest,
  };
  return withoutDigest;
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
  root, baseCommit, changedPaths, evidenceTask, readCommitFile = commitFile,
}) {
  if(evidenceTask==="verification-ownership-readiness"){
    const[feature,implementation]=await Promise.all([readCommitFile(root,baseCommit,"features/modular-verification-packs.feature"),readCommitFile(root,baseCommit,"scripts/verification-ownership-readiness.mjs")]);
    return ownershipReadinessBootstrapEligibility({baseCommit,feature,implementation,changedPaths,evidenceTask});
  }
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

export function ownershipReadinessBootstrapEligibility({baseCommit,feature,implementation,changedPaths,evidenceTask}){
  const acceptanceHandlers=new Set([
    "acceptance/src/acceptance/verification_support/modular_architecture_vtd014_handlers.clj",
    "acceptance/src/acceptance/verification_support/modular_architecture_vtd015_handlers.clj",
  ]),contracts=[165,166,167,168,169,170,171],contractsPresent=typeof feature==="string"&&contracts.every(number=>feature.includes(`Modular verification packs ${number}`)),implementationAbsent=implementation===null,implementationAdded=changedPaths.includes("scripts/verification-ownership-readiness.mjs"),allowed=changedPaths.every(path=>acceptanceHandlers.has(path)||path.startsWith("scripts/")||path.startsWith("test/")||path.startsWith("verification/")||path.startsWith("swarmforge/")||path.startsWith("src/durable-project/")||path.startsWith("src/project-documentation/")||path.startsWith("dist/durable-project/")||path.startsWith("dist/project-documentation/")||path.startsWith("src/flow-visual-archive-")||path.startsWith("dist/flow-visual-archive-")||path==="src/project-asset-body-contribution.ts"||path.startsWith("dist/project-asset-body-contribution.")||path==="src/data-layer-durable-project-repository.ts"||path==="dist/data-layer-durable-project-repository.js"||path==="dist/data-layer-durable-project-repository.js.map"||path==="src/specification-builder.ts"||path==="dist/specification-builder.js"||path==="dist/specification-builder.js.map"||path==="build-delivered-dependencies.json");
  if(evidenceTask!=="verification-ownership-readiness"||!contractsPresent||!implementationAbsent||!implementationAdded||!allowed)throw new Error("Ownership-readiness bootstrap requires its contract-bearing base, absent implementation, and an approved behavior-preserving candidate");
  return{version:1,kind:"ownership-readiness",baseCommit,contracts,implementationAbsent,implementationAdded};
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
    selectedVerificationSlices:bindingPlan.selectedVerificationSlices,
    selectedVerificationSliceTaskKeys:bindingPlan.selectedVerificationSliceTaskKeys,
    verificationSliceDiagnostics:bindingPlan.verificationSliceDiagnostics,
    quarantinedSliceIds:bindingPlan.quarantinedSliceIds,
  };
}

export function canonicalRunIntentBootstrapPlan(packs, {
  packIds, changeSet, basePacks, historicalRegistryFallback = false,
  quarantinedSliceIds = [],
}) {
  const bindingPlan = planVerification(packs, {
    packIds:[], changedPaths:changeSet.paths, changeSet, includeProperties:true,
    basePacks, historicalRegistryFallback, quarantinedSliceIds,
  });
  const executionPlan = planVerification(packs, { packIds, includeProperties:true });
  return bindRunIntentBootstrapPlan(executionPlan, bindingPlan, packs);
}

function eligibleTerminalDeferred(incident) {
  return incident?.state === "unresolved" && incident?.repair?.status === "eligible" &&
    incident?.terminalVerificationDeferred?.status === "terminal-verification-deferred";
}

export function eligibleRepairAdmissionCandidates(incidents) {
  return incidents.filter((incident) => {
    try { validateIncident(incident); }
    catch { return true; }
    return !eligibleTerminalDeferred(incident);
  });
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

function deferredPromotionRegressionKey(incident, admission) {
  if (admission.kind !== "terminal-deferred" ||
      incident.failure?.failureClass !== "execution-contract-failure" ||
      incident.failure?.task?.stage !== "promotion") return undefined;
  const key = incident.repair?.regression?.key;
  return typeof key === "string" && key ? key : undefined;
}

const digestPattern = /^[a-f0-9]{64}$/u;

function validEligibleRepairProof(incident, candidate, baseCommit, evidenceTask) {
  const repair = incident?.repair;
  return [
    incident?.state === "unresolved",
    repair?.status === "eligible",
    repair?.candidate?.commit === candidate?.commit,
    repair?.candidate?.tree === candidate?.tree,
    repair?.checkpoint?.baseCommit === baseCommit,
    repair?.checkpoint?.evidenceTask === evidenceTask,
    typeof repair?.causalCategory === "string" && Boolean(repair.causalCategory),
    typeof repair?.causalExplanation === "string" && Boolean(repair.causalExplanation),
    repair?.regression?.status === "passed",
    repair?.regression?.commit === candidate?.commit,
    digestPattern.test(repair?.regression?.receiptSha256 ?? ""),
    repair?.focusedReceipt?.status === "passed",
    repair?.focusedReceipt?.commit === candidate?.commit,
    repair?.focusedReceipt?.provenance === "fresh",
    digestPattern.test(repair?.focusedReceipt?.receiptSha256 ?? ""),
    repair?.causalProtocol?.version === 2,
    repair?.causalProtocol?.incidentId === incident?.id,
    repair?.causalProtocol?.failureDigest === incident?.failureDigest,
    repair?.causalProtocol?.preRepairResult?.status === "failed",
    repair?.causalProtocol?.repairResult?.status === "passed",
    digestPattern.test(incident?.failureDigest ?? ""),
    digestPattern.test(incident?.failure?.causalKey ?? ""),
  ].every(Boolean);
}

export async function buildEligibleRepairAdmissions({
  incidents, plan, packs, candidate, baseCommit, evidenceTask, changeSetDigest, planDigest,
  resolveSuccession = resolveIncidentTaskSuccession,
}) {
  if (![changeSetDigest, planDigest].every((value) => digestPattern.test(value ?? ""))) {
    throw new Error("Eligible repair admission requires bound change-set and plan digests");
  }
  const selectedIdentities = plan.tasks.map(verificationTaskIdentity);
  const selectedByKey = new Map(selectedIdentities.map((identity) => [identity.key, identity]));
  const selectedByDigest = new Map(selectedIdentities.map((identity) =>
    [verificationTaskDigest(identity), identity]));
  const canonicalIdentities = planVerification(packs, { terminalFull:true }).tasks
    .map(verificationTaskIdentity);
  const entries = [];
  for (const incident of [...incidents].sort((left, right) => left.id.localeCompare(right.id))) {
    if (!validEligibleRepairProof(incident, candidate, baseCommit, evidenceTask)) {
      throw new Error(`Eligible repair admission ${incident.id} is not bound to the exact candidate and review checkpoint`);
    }
    const regression = selectedByKey.get(incident.repair.regression.key);
    const governedDigest = verificationTaskDigest(incident.failure.task);
    const governed = selectedByDigest.get(governedDigest);
    let selected = regression ?? governed;
    let coverageKind = regression ? "regression" : governed ? "governed-task" : undefined;
    let succession;
    if (!selected) {
      try {
        succession = await resolveSuccession({ incident, currentIdentities:canonicalIdentities,
          currentPacks:packs });
        selected = selectedByDigest.get(succession.destinationTaskDigest);
      } catch {
        // Normalize graph-specific diagnostics into the fail-closed admission boundary below.
      }
      if (selected) coverageKind = "successor";
    }
    if (!selected || !coverageKind) {
      throw new Error(`Eligible repair admission ${incident.id} has no exact selected task coverage`);
    }
    entries.push({
      incidentId:incident.id,
      failureDigest:incident.failureDigest,
      causalKey:incident.failure.causalKey,
      repairDigest:timeoutIncidentDigest(incident.repair),
      regressionKey:incident.repair.regression.key,
      selectedTaskKey:selected.key,
      selectedTaskDigest:verificationTaskDigest(selected),
      coverageKind,
      ...(succession ? { destinationTaskDigest:succession.destinationTaskDigest,
        conservationDigest:succession.conservationDigest } : {}),
    });
  }
  if (!entries.length) return null;
  return {
    version:1, evidenceTask, baseCommit,
    candidateCommit:candidate.commit, candidateTree:candidate.tree,
    changeSetDigest, planDigest, entries,
  };
}

export async function revalidateEligibleRepairAdmissions({
  admissions, phase, ...admissionInputs
}) {
  const current = await buildEligibleRepairAdmissions(admissionInputs);
  if (timeoutIncidentDigest(current) !== timeoutIncidentDigest(admissions)) {
    throw new Error(`Eligible repair admission changed ${phase}`);
  }
  return current;
}

export function validateEligibleRepairAdmissionsReceipt(receipt, admissions = receipt?.eligibleRepairAdmissions) {
  if (admissions?.version !== 1 || !Array.isArray(admissions.entries) || !admissions.entries.length ||
      admissions.candidateCommit !== receipt?.candidate?.commit && receipt?.candidate !== undefined ||
      admissions.candidateTree !== receipt?.candidate?.tree && receipt?.candidate !== undefined ||
      receipt?.candidate !== undefined &&
        (admissions.evidenceTask !== receipt.candidate.evidenceTask ||
         admissions.baseCommit !== receipt.candidate.baseCommit ||
         admissions.changeSetDigest !== receipt.candidate.changeSetDigest ||
         admissions.changeSetDigest !== receipt.plan?.changeSetDigest ||
         admissions.planDigest !== receipt.plan?.taskPlanDigest)) {
    throw new Error("Eligible repair admission receipt binding is missing or malformed");
  }
  for (const entry of admissions.entries) {
    const result = receipt.tasks?.[entry.selectedTaskKey];
    if (result?.status !== "passed" || result.provenance !== "fresh" ||
        verificationTaskDigest(result.identity) !== entry.selectedTaskDigest) {
      throw new Error(`Eligible repair admission requires a fresh pass for ${entry.selectedTaskKey}`);
    }
  }
  const packageResult = Object.values(receipt.tasks ?? {})
    .find(({ identity }) => identity?.stage === "package");
  if (packageResult?.status !== "passed" || packageResult.provenance !== "fresh") {
    throw new Error("Eligible repair admission requires fresh package proof");
  }
  return admissions;
}

export async function runIntentBootstrapCoverage({
  incidents, plan, packs, candidate, root, evidenceTask,
  resolveSuccession = resolveIncidentTaskSuccession,
  reviewIncidentProof = bootstrapReviewIncidentProof,
}) {
  const admissions = new Map();
  for (const incident of incidents) {
    if (exactCandidateEligibleRepair(incident, candidate)) {
      const proof = await reviewIncidentProof({ root, incident, evidenceTask });
      if (proof) {
        admissions.set(incident.id, { kind:"exact-candidate-causal-repair", ...proof });
        continue;
      }
    }
    if (eligibleTerminalDeferred(incident)) {
      admissions.set(incident.id, { kind:"terminal-deferred" });
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
  const selectedByKey = new Map([...selected.values()].map((identity) => [identity.key, identity]));
  const canonical = planVerification(packs, { terminalFull:true }).tasks
    .map(verificationTaskIdentity);
  const coverage = [];
  for (const incident of incidents) {
    const admission = admissions.get(incident.id);
    const failureDigest = verificationTaskDigest(incident.failure.task);
    const promotionRegressionKey = deferredPromotionRegressionKey(incident, admission);
    let selectedIdentity = admission.kind === "exact-candidate-causal-repair"
      ? selectedByKey.get(incident.repair.regression.key)
      : promotionRegressionKey
        ? selectedByKey.get(promotionRegressionKey)
        : selected.get(failureDigest);
    let succession;
    if(!selectedIdentity&&admission.kind==="terminal-deferred"&&evidenceTask==="verification-ownership-readiness"){
      coverage.push({incidentId:incident.id,admission,failureTaskKey:incident.failure.task.key,selectedTaskKey:null,selectedTaskDigest:null,terminalObligation:true});
      continue;
    }
    if (!selectedIdentity && admission.kind === "terminal-deferred") {
      succession = await resolveSuccession({ incident, currentIdentities:canonical,
        currentPacks:packs });
      selectedIdentity = selected.get(succession.destinationTaskDigest);
    }
    if (!selectedIdentity) {
      throw new Error(`Run-intent bootstrap exact plan does not select incident ${incident.id} governed task, causal regression, or successor`);
    }
    coverage.push({
      incidentId:incident.id,
      admission,
      failureTaskKey:incident.failure.task.key,
      selectedTaskKey:selectedIdentity.key,
      selectedTaskDigest:verificationTaskDigest(selectedIdentity),
      ...(admission.kind === "exact-candidate-causal-repair" || promotionRegressionKey
        ? { repairRegressionKey:incident.repair.regression.key } : {}),
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
    if(row.terminalObligation===true&&row.selectedTaskKey===null&&row.selectedTaskDigest===null)continue;
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
