import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { canonicalGitCommit, verificationPacksAtCommit } from "./verification-changes.mjs";
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

export const registryPlannerPreparationEvidenceTask =
  "verification-slice-verification-registry-planner-modularization";
export const registryPlannerPreparationTaskKeys = Object.freeze([
  "unit:test/modular-utility-architecture-test.mjs",
  "unit:test/verification-pack-cardinality-contract-test.mjs",
  "unit:test/verification-process-contract-test.mjs",
]);

export function registryPlannerPreparationFocusedPlan(plan, evidenceTask) {
  if (evidenceTask !== registryPlannerPreparationEvidenceTask ||
      plan?.mode !== "focused-task" || plan.includeProperties !== false) return false;
  const expected = ["build:dist", ...registryPlannerPreparationTaskKeys, "package:extension"];
  return JSON.stringify(plan.tasks.map(({ key }) => key)) === JSON.stringify(expected);
}

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
  root, baseCommit, changedPaths, evidenceTask, candidatePacks,
  readCommitFile = commitFile,
}) {
  if (evidenceTask === "verification-slice-verification-registry-planner-modularization") {
    const [feature, registry] = await Promise.all([
      readCommitFile(root, baseCommit, "features/verification-registry-planner-modularization.feature"),
      readCommitFile(root, baseCommit, "verification/packs.json"),
    ]);
    return verificationRegistryPlannerBootstrapEligibility({
      baseCommit, feature, registry, candidatePacks, changedPaths, evidenceTask,
    });
  }
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

export function verificationRegistryPlannerBootstrapEligibility({
  baseCommit, feature, registry, candidatePacks, changedPaths, evidenceTask,
}) {
  const task = "verification-slice-verification-registry-planner-modularization";
  const featurePath = "features/verification-registry-planner-modularization.feature";
  const expectedPaths = [
    "scripts/run-focused-acceptance.mjs",
    "scripts/settled-final-verification.mjs",
    "scripts/verification-evidence.mjs",
    "scripts/verification-reliability-persistence.mjs",
    "scripts/verification-reliability-repair.mjs",
    "scripts/verification-reliability-store.mjs",
    "scripts/verification-run-intent.mjs",
    "test/verification-pack-cardinality-contract-test.mjs",
    "test/verification-process-contract-test.mjs",
    "verification/packs.json",
  ];
  let basePacks;
  try { basePacks = JSON.parse(registry); }
  catch { throw new Error("Registry-planner ownership bootstrap requires the exact historical registry"); }
  const contractsPresent = typeof feature === "string" && [18, 19, 20].every((number) =>
    feature.includes(`Verification registry and planner modularization 0${number}`));
  const baseOwners = basePacks.filter((pack) =>
    [...(pack.features ?? []), ...(pack.plannedFeatures ?? [])].includes(featurePath));
  const candidateOwners = (candidatePacks ?? []).filter((pack) =>
    [...(pack.features ?? []), ...(pack.plannedFeatures ?? [])].includes(featurePath));
  const [candidateOwner] = candidateOwners;
  const expectedOwner = {
    id:"verification_process", source:[], dependencies:[], unit:[], property:[], features:[],
    plannedFeatures:[featurePath], handlers:[], browserAdapters:[], browserAdapterModes:[],
    browserObservations:[], checkpointCommands:[],
  };
  const exactPaths = JSON.stringify([...changedPaths].sort()) === JSON.stringify(expectedPaths);
  const exactOwner = candidateOwners.length === 1 &&
    JSON.stringify(candidateOwner) === JSON.stringify(expectedOwner);
  const terminalBefore = planVerification(basePacks, { terminalFull:true });
  const terminalAfter = planVerification(candidatePacks ?? [], { terminalFull:true });
  const terminalConserved = JSON.stringify(terminalBefore.selectedPackIds) ===
      JSON.stringify(terminalAfter.selectedPackIds) &&
    JSON.stringify(terminalBefore.tasks.map(verificationTaskIdentity)) ===
      JSON.stringify(terminalAfter.tasks.map(verificationTaskIdentity));
  if (evidenceTask !== task || !contractsPresent || baseOwners.length || !exactPaths ||
      !exactOwner || !terminalConserved) {
    throw new Error("Registry-planner ownership bootstrap requires its exact unowned base, empty planned owner, conserved terminal plan, and bounded preparation paths");
  }
  return { version:1, kind:"verification-registry-planner-ownership", baseCommit,
    contracts:[18, 19, 20], featurePath, exactPaths, terminalConserved };
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
  return incident?.state === "unresolved" &&
    (incident?.repair?.status === "eligible" || confirmedFlakyClassification(incident)) &&
    incident?.terminalVerificationDeferred?.status === "terminal-verification-deferred";
}

export function eligibleRepairAdmissionCandidates(incidents) {
  return incidents.filter((incident) => {
    try { validateIncident(incident); }
    catch { return true; }
    return !eligibleTerminalDeferred(incident);
  });
}

function confirmedFlakyClassification(incident) {
  const claimed = incident?.transitions?.filter(({ type }) => type === "diagnostic-retry-claimed") ?? [];
  const classified = incident?.transitions?.filter(({ type }) => type === "diagnostic-retry-classified") ?? [];
  return incident?.state === "unresolved" && incident?.repair === undefined &&
    incident?.retry?.status === "classified" &&
    incident.retry.outcome === "passed" && incident.retry.classification === "confirmed-flaky" &&
    incident.retry.identity === incident?.failure?.retryIdentity &&
    (incident?.failure?.registryDigest === undefined ||
      digestPattern.test(incident.failure.registryDigest)) &&
    digestPattern.test(incident.retry.receiptSha256 ?? "") && claimed.length === 1 &&
    classified.length === 1 && classified[0].classification === "confirmed-flaky";
}

function confirmedFlakyRetry(incident) {
  return incident?.terminalVerificationDeferred === undefined &&
    confirmedFlakyClassification(incident);
}

async function historicalRegistryProof(root, incident) {
  const commit = await canonicalGitCommit(incident.failure.lineage.commit, { repositoryRoot:root });
  const [tree, packs] = await Promise.all([
    gitValue(root, "rev-parse", `${commit}^{tree}`).then((value) => value.trim()),
    verificationPacksAtCommit(commit, { repositoryRoot:root }),
  ]);
  return { commit, tree, packs };
}

async function exactDiagnosticRegistry(root, incident, receipt, registryProofLoader) {
  const values = [incident.failure?.registryDigest, receipt.registryDigest,
    receipt.diagnostic?.registryDigest];
  if (values.every((value) => digestPattern.test(value ?? ""))) {
    if (!values.every((value) => value === values[0])) {
      throw new Error(`Confirmed flaky admission ${incident.id} diagnostic receipt is not exact`);
    }
    return values[0];
  }
  if (values.some((value) => value !== undefined)) {
    throw new Error(`Confirmed flaky admission ${incident.id} diagnostic receipt is not exact`);
  }
  let proof;
  try {
    proof = await (registryProofLoader ?? historicalRegistryProof)(root, incident);
    if (proof?.commit !== incident.failure.lineage.commit ||
        proof?.tree !== incident.failure.lineage.tree || !Array.isArray(proof?.packs)) {
      throw new Error("identity mismatch");
    }
    planVerification(proof.packs, { terminalFull:true });
  } catch {
    throw new Error(`Confirmed flaky admission ${incident.id} has no exact registry proof`);
  }
  const registryDigest = timeoutIncidentDigest(proof.packs);
  if (!digestPattern.test(registryDigest)) {
    throw new Error(`Confirmed flaky admission ${incident.id} has no exact registry proof`);
  }
  return registryDigest;
}

export function confirmedFlakyAdmissionCandidates(incidents) {
  return incidents.filter((incident) => {
    try { validateIncident(incident); }
    catch { return false; }
    return confirmedFlakyRetry(incident);
  });
}

function exactValue(left, right) {
  return timeoutIncidentDigest(left) === timeoutIncidentDigest(right);
}

function incidentLineageMatchesCandidate(incident, candidate, baseCommit) {
  if (incident.failure?.lineage?.commit === candidate?.commit &&
      incident.failure?.lineage?.tree === candidate?.tree) {
    return incident.failure.lineage.baseCommit === baseCommit;
  }
  const latest = incident.lineageTransitions?.at(-1);
  return latest?.kind === "rebase" && latest.toCommit === candidate?.commit &&
    latest.toTree === candidate?.tree;
}

async function diagnosticRetryReceipt(root, incident, loader, registryProofLoader) {
  const relative = incident.retry?.receiptPath;
  const absolute = safeLegacyReceiptPath(root, relative);
  if (!absolute) throw new Error(`Confirmed flaky admission ${incident.id} has no canonical diagnostic receipt`);
  const bytes = loader ? await loader(absolute, incident) : await readFile(absolute);
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (createHash("sha256").update(buffer).digest("hex") !== incident.retry.receiptSha256) {
    throw new Error(`Confirmed flaky admission ${incident.id} diagnostic receipt digest changed`);
  }
  let receipt;
  try { receipt = JSON.parse(buffer); }
  catch { throw new Error(`Confirmed flaky admission ${incident.id} diagnostic receipt is malformed`); }
  const registryDigest = await exactDiagnosticRegistry(root, incident, receipt, registryProofLoader);
  const results = Object.values(receipt.tasks ?? {});
  const result = results.length === 1 ? results[0] : undefined;
  const exactDiagnostic = receipt.runIntent === verificationRunIntents.repair &&
    receipt.plan?.mode === "timeout-diagnostic" && receipt.diagnostic?.incidentId === incident.id &&
    exactValue(receipt.plan?.requestedPackIds, [incident.failure.task.packId]) &&
    exactValue(receipt.plan?.selectedPackIds, [incident.failure.task.packId]) &&
    receipt.diagnostic?.retryIdentity === incident.failure.retryIdentity &&
    exactValue(receipt.diagnostic?.scope, incident.failure.retryScope) &&
    exactValue(receipt.diagnostic?.resolvedDeadlines, incident.failure.resolvedDeadlines) &&
    receipt.candidate?.commit === incident.failure.lineage.commit &&
    receipt.candidate?.tree === incident.failure.lineage.tree &&
    receipt.candidate?.baseCommit === incident.failure.lineage.baseCommit &&
    receipt.candidate?.evidenceTask === incident.failure.lineage.evidenceTask &&
    receipt.candidate?.changeSetDigest === incident.failure.lineage.changeSetDigest &&
    exactValue(receipt.artifact, incident.failure.artifact) &&
    exactValue(receipt.environment, incident.failure.environment) &&
    result?.status === "passed" && result.provenance === "fresh" &&
    verificationTaskDigest(result.identity) === verificationTaskDigest(incident.failure.task) &&
    exactValue(result.execution?.args, incident.failure.retryScope?.executionArgs) &&
    exactValue(result.execution?.logicalTargetIds ?? [],
      incident.failure.retryScope?.logicalTargetIds ?? []) &&
    typeof receipt.completedAt === "string" && Number.isFinite(Date.parse(receipt.completedAt));
  if (!exactDiagnostic) {
    throw new Error(`Confirmed flaky admission ${incident.id} diagnostic receipt is not exact`);
  }
  return { receipt, registryDigest };
}

export async function buildConfirmedFlakyAdmissions({
  root, incidents, plan, packs, candidate, baseCommit, evidenceTask, changeSetDigest, planDigest,
  receiptLoader, registryProofLoader, resolveSuccession = resolveIncidentTaskSuccession,
}) {
  if (![changeSetDigest, planDigest].every((value) => digestPattern.test(value ?? ""))) {
    throw new Error("Confirmed flaky admission requires bound change-set and plan digests");
  }
  const selectedIdentities = plan.tasks.map(verificationTaskIdentity);
  const selectedByDigest = new Map(selectedIdentities.map((identity) =>
    [verificationTaskDigest(identity), identity]));
  let canonicalIdentities;
  const entries = [];
  for (const incident of [...incidents].sort((left, right) => left.id.localeCompare(right.id))) {
    if (!confirmedFlakyRetry(incident) ||
        !incidentLineageMatchesCandidate(incident, candidate, baseCommit) ||
        incident.failure?.lineage?.evidenceTask !== evidenceTask) {
      throw new Error(`Confirmed flaky admission ${incident.id} is not bound to the exact conserved candidate`);
    }
    const { registryDigest } = await diagnosticRetryReceipt(
      root, incident, receiptLoader, registryProofLoader);
    const governedTaskDigest = verificationTaskDigest(incident.failure.task);
    let selected = selectedByDigest.get(governedTaskDigest);
    let coverageKind = selected ? "governed-task" : undefined;
    let succession;
    if (!selected) {
      canonicalIdentities ??= planVerification(packs, { terminalFull:true }).tasks
        .map(verificationTaskIdentity);
      try {
        succession = await resolveSuccession({ incident, currentIdentities:canonicalIdentities,
          currentPacks:packs });
        selected = selectedByDigest.get(succession.destinationTaskDigest);
      } catch {
        // Normalize graph diagnostics at the admission boundary.
      }
      if (selected) coverageKind = "successor";
    }
    if (!selected) throw new Error(`Confirmed flaky admission ${incident.id} has no exact selected task coverage`);
    entries.push({
      incidentId:incident.id, failureDigest:incident.failureDigest,
      causalKey:incident.failure.causalKey, registryDigest,
      retryIdentity:incident.retry.identity,
      retryReceiptSha256:incident.retry.receiptSha256,
      classificationDigest:timeoutIncidentDigest(incident.retry), governedTaskDigest,
      selectedTaskKey:selected.key, selectedTaskDigest:verificationTaskDigest(selected), coverageKind,
      ...(succession ? { destinationTaskDigest:succession.destinationTaskDigest,
        conservationDigest:succession.conservationDigest } : {}),
    });
  }
  if (!entries.length) return null;
  return { version:1, evidenceTask, baseCommit, candidateCommit:candidate.commit,
    candidateTree:candidate.tree, changeSetDigest, planDigest, entries };
}

export async function revalidateConfirmedFlakyAdmissions({ admissions, phase, ...inputs }) {
  const current = await buildConfirmedFlakyAdmissions(inputs);
  if (timeoutIncidentDigest(current) !== timeoutIncidentDigest(admissions)) {
    throw new Error(`Confirmed flaky admission changed ${phase}`);
  }
  return current;
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

export function eligibleRepairCandidateMatches(incident, candidate) {
  let current = incident?.repair?.candidate;
  if (!current) return false;
  for (const transition of incident.lineageTransitions ?? []) {
    if (transition.kind === "rebase" && transition.fromCommit === current.commit) {
      current = { commit:transition.toCommit, tree:transition.toTree };
    }
  }
  return current.commit === candidate?.commit && current.tree === candidate?.tree;
}

function validEligibleRepairProof(incident, candidate, baseCommit, evidenceTask) {
  const repair = incident?.repair;
  return [
    incident?.state === "unresolved",
    repair?.status === "eligible",
    eligibleRepairCandidateMatches(incident, candidate),
    repair?.checkpoint?.baseCommit === baseCommit,
    repair?.checkpoint?.evidenceTask === evidenceTask,
    typeof repair?.causalCategory === "string" && Boolean(repair.causalCategory),
    typeof repair?.causalExplanation === "string" && Boolean(repair.causalExplanation),
    repair?.regression?.status === "passed",
    repair?.regression?.commit === repair?.candidate?.commit,
    digestPattern.test(repair?.regression?.receiptSha256 ?? ""),
    repair?.focusedReceipt?.status === "passed",
    repair?.focusedReceipt?.commit === repair?.candidate?.commit,
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
  let canonicalIdentities;
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
      canonicalIdentities ??= planVerification(packs, { terminalFull:true }).tasks
        .map(verificationTaskIdentity);
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
      governedTaskDigest:governedDigest,
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
  const exactKeys = (value, expected) => value && typeof value === "object" && !Array.isArray(value) &&
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());
  const admissionKeys = ["version", "evidenceTask", "baseCommit", "candidateCommit",
    "candidateTree", "changeSetDigest", "planDigest", "entries"];
  if (admissions?.version !== 1 || !Array.isArray(admissions.entries) || !admissions.entries.length ||
      !exactKeys(admissions, admissionKeys) ||
      ![admissions.evidenceTask, admissions.baseCommit, admissions.candidateCommit,
        admissions.candidateTree].every((value) => typeof value === "string" && Boolean(value)) ||
      ![admissions.changeSetDigest, admissions.planDigest]
        .every((value) => digestPattern.test(value ?? "")) ||
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
  const commonEntryKeys = ["incidentId", "failureDigest", "causalKey", "repairDigest", "governedTaskDigest",
    "regressionKey", "selectedTaskKey", "selectedTaskDigest", "coverageKind"];
  const incidentIds = admissions.entries.map(({ incidentId }) => incidentId);
  if (new Set(incidentIds).size !== incidentIds.length ||
      JSON.stringify(incidentIds) !== JSON.stringify([...incidentIds].sort())) {
    throw new Error("Eligible repair admission entries must be sorted and unique");
  }
  for (const entry of admissions.entries) {
    const successor = entry.coverageKind === "successor";
    const expectedKeys = successor
      ? [...commonEntryKeys, "destinationTaskDigest", "conservationDigest"] : commonEntryKeys;
    if (!exactKeys(entry, expectedKeys) || typeof entry.incidentId !== "string" || !entry.incidentId ||
        ![entry.failureDigest, entry.causalKey, entry.repairDigest, entry.governedTaskDigest,
          entry.selectedTaskDigest]
          .every((value) => digestPattern.test(value ?? "")) ||
        typeof entry.regressionKey !== "string" || !entry.regressionKey ||
        typeof entry.selectedTaskKey !== "string" || !entry.selectedTaskKey ||
        !["regression", "governed-task", "successor"].includes(entry.coverageKind) ||
        entry.coverageKind === "regression" && entry.selectedTaskKey !== entry.regressionKey ||
        entry.coverageKind !== "regression" && entry.selectedTaskKey === entry.regressionKey ||
        entry.coverageKind === "governed-task" &&
          entry.selectedTaskDigest !== entry.governedTaskDigest ||
        successor && (entry.destinationTaskDigest !== entry.selectedTaskDigest ||
          entry.selectedTaskDigest === entry.governedTaskDigest ||
          !digestPattern.test(entry.conservationDigest ?? ""))) {
      throw new Error(`Eligible repair admission ${entry.incidentId ?? "entry"} is malformed or causally conflicting`);
    }
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

export function validateConfirmedFlakyAdmissionsReceipt(
  receipt, admissions = receipt?.confirmedFlakyAdmissions,
) {
  const exactKeys = (value, expected) => value && typeof value === "object" && !Array.isArray(value) &&
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());
  const admissionKeys = ["version", "evidenceTask", "baseCommit", "candidateCommit",
    "candidateTree", "changeSetDigest", "planDigest", "entries"];
  if (admissions?.version !== 1 || !Array.isArray(admissions.entries) || !admissions.entries.length ||
      !exactKeys(admissions, admissionKeys) ||
      ![admissions.evidenceTask, admissions.baseCommit, admissions.candidateCommit,
        admissions.candidateTree].every((value) => typeof value === "string" && Boolean(value)) ||
      ![admissions.changeSetDigest, admissions.planDigest]
        .every((value) => digestPattern.test(value ?? "")) ||
      receipt?.candidate !== undefined &&
        (admissions.candidateCommit !== receipt.candidate.commit ||
         admissions.candidateTree !== receipt.candidate.tree ||
         admissions.evidenceTask !== receipt.candidate.evidenceTask ||
         admissions.baseCommit !== receipt.candidate.baseCommit ||
         admissions.changeSetDigest !== receipt.candidate.changeSetDigest ||
         admissions.changeSetDigest !== receipt.plan?.changeSetDigest ||
         admissions.planDigest !== receipt.plan?.taskPlanDigest)) {
    throw new Error("Confirmed flaky admission receipt binding is missing or malformed");
  }
  const commonKeys = ["incidentId", "failureDigest", "causalKey", "registryDigest", "retryIdentity",
    "retryReceiptSha256", "classificationDigest", "governedTaskDigest", "selectedTaskKey",
    "selectedTaskDigest", "coverageKind"];
  const ids = admissions.entries.map(({ incidentId }) => incidentId);
  if (new Set(ids).size !== ids.length || JSON.stringify(ids) !== JSON.stringify([...ids].sort())) {
    throw new Error("Confirmed flaky admission entries must be sorted and unique");
  }
  for (const entry of admissions.entries) {
    const successor = entry.coverageKind === "successor";
    const expected = successor ? [...commonKeys, "destinationTaskDigest", "conservationDigest"] : commonKeys;
    if (!exactKeys(entry, expected) || typeof entry.incidentId !== "string" || !entry.incidentId ||
        ![entry.failureDigest, entry.causalKey, entry.registryDigest, entry.retryIdentity, entry.retryReceiptSha256,
          entry.classificationDigest, entry.governedTaskDigest, entry.selectedTaskDigest]
          .every((value) => digestPattern.test(value ?? "")) ||
        typeof entry.selectedTaskKey !== "string" || !entry.selectedTaskKey ||
        !["governed-task", "successor"].includes(entry.coverageKind) ||
        entry.coverageKind === "governed-task" && entry.selectedTaskDigest !== entry.governedTaskDigest ||
        successor && (entry.destinationTaskDigest !== entry.selectedTaskDigest ||
          entry.selectedTaskDigest === entry.governedTaskDigest ||
          !digestPattern.test(entry.conservationDigest ?? ""))) {
      throw new Error(`Confirmed flaky admission ${entry.incidentId ?? "entry"} is malformed or causally conflicting`);
    }
    const result = receipt.tasks?.[entry.selectedTaskKey];
    if (result?.status !== "passed" || result.provenance !== "fresh" ||
        verificationTaskDigest(result.identity) !== entry.selectedTaskDigest) {
      throw new Error(`Confirmed flaky admission requires a fresh pass for ${entry.selectedTaskKey}`);
    }
  }
  const packageResult = Object.values(receipt.tasks ?? {})
    .find(({ identity }) => identity?.stage === "package");
  if (packageResult?.status !== "passed" || packageResult.provenance !== "fresh") {
    throw new Error("Confirmed flaky admission requires fresh package proof");
  }
  return admissions;
}

export async function runIntentBootstrapCoverage({
  incidents, plan, packs, candidate, root, evidenceTask,
  resolveSuccession = resolveIncidentTaskSuccession,
  reviewIncidentProof = bootstrapReviewIncidentProof,
}) {
  const selected = new Map(plan.tasks.map((task) => {
    const identity = verificationTaskIdentity(task);
    return [verificationTaskDigest(identity), identity];
  }));
  const selectedByKey = new Map([...selected.values()].map((identity) => [identity.key, identity]));
  const registryPlannerPreparation =
    evidenceTask === "verification-slice-verification-registry-planner-modularization";
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
      continue;
    }
    const unselectedBootstrapFailure = registryPlannerPreparation &&
      incident?.state === "unresolved" && incident?.repair === undefined &&
      incident?.retry === undefined && incident?.terminalVerificationDeferred === undefined &&
      incident?.failure?.lineage?.evidenceTask === evidenceTask &&
      !selectedByKey.has(incident?.failure?.task?.key);
    if (unselectedBootstrapFailure) {
      admissions.set(incident.id, { kind:"bootstrap-terminal-obligation",
        failureDigest:incident.failureDigest });
    }
  }
  const ineligible = incidents.filter((incident) => !admissions.has(incident.id));
  if (ineligible.length) {
    throw new Error(`Run-intent bootstrap cannot admit ineligible incident(s): ${
      ineligible.map(({ id }) => id).sort().join(", ")}`);
  }
  const canonical = planVerification(packs, { terminalFull:true }).tasks
    .map(verificationTaskIdentity);
  const coverage = [];
  for (const incident of incidents) {
    const admission = admissions.get(incident.id);
    const failureDigest = verificationTaskDigest(incident.failure.task);
    if (admission.kind === "bootstrap-terminal-obligation") {
      coverage.push({ incidentId:incident.id, failureDigest:incident.failureDigest, admission,
        failureTaskKey:incident.failure.task.key, failureTaskDigest:failureDigest,
        selectedTaskKey:null, selectedTaskDigest:null, terminalObligation:true });
      continue;
    }
    const promotionRegressionKey = deferredPromotionRegressionKey(incident, admission);
    let selectedIdentity = admission.kind === "exact-candidate-causal-repair"
      ? selectedByKey.get(incident.repair.regression.key)
      : promotionRegressionKey
        ? selectedByKey.get(promotionRegressionKey)
        : selected.get(failureDigest);
    let succession;
    if (!selectedIdentity && admission.kind === "terminal-deferred" &&
        ["verification-ownership-readiness",
          "verification-slice-verification-registry-planner-modularization"].includes(evidenceTask)) {
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
    if(row.terminalObligation===true&&row.selectedTaskKey===null&&row.selectedTaskDigest===null){
      if (row.admission?.kind === "bootstrap-terminal-obligation" &&
          (!digestPattern.test(row.admission.failureDigest ?? "") ||
           row.failureDigest !== row.admission.failureDigest ||
           !digestPattern.test(row.failureTaskDigest ?? ""))) {
        throw new Error(`Run-intent bootstrap terminal obligation ${row.incidentId} is malformed`);
      }
      continue;
    }
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
