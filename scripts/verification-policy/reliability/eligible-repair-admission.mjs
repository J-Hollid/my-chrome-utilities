import { planVerification, verificationTaskIdentity } from "../../verification-packs.mjs";
import { timeoutIncidentDigest } from "../../verification-reliability-values.mjs";
import {
  taskCheckpointRepairRequired,
  validateTaskCheckpointRepairProof,
} from "../../verification-reliability-repair.mjs";
import {
  resolveIncidentTaskSuccession,
  verificationTaskDigest,
} from "../../verification-task-succession.mjs";
import {
  authenticateAncestorEligibleRepair,
  eligibleRepairCandidateMatches,
  validateAncestorRepairCompatibility,
} from "./eligible-repair-lineage-compatibility.mjs";
import {effectiveEligibleRepair, eligibleRepairStateDigest} from
  "./eligible-repair-checkpoint-correction.mjs";

const digestPattern = /^[a-f0-9]{64}$/u;

export function eligibleRepairCausalKey(incident,repair,validateProof=validateTaskCheckpointRepairProof) {
  if(taskCheckpointRepairRequired(incident)) {
    const proof=validateProof(incident,repair?.taskCheckpointProof);
    // Result proof digests already bind the original failure, receipt, registry
    // and exact failed targets. Existing checkpoint proofs retain their key.
    return proof.kind==="browser-observation-result"?proof.digest:proof.causalKey;
  }
  if(repair?.taskCheckpointProof!==undefined)return undefined;
  return incident?.failure?.causalKey;
}

function validEligibleRepairProof(incident, repair, candidateCompatible, baseCommit, evidenceTask) {
  let causalKey;
  try {causalKey=eligibleRepairCausalKey(incident,repair);}
  catch {return false;}
  return [
    incident?.state === "unresolved", repair?.status === "eligible", candidateCompatible,
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
    digestPattern.test(causalKey ?? ""),
  ].every(Boolean);
}

export async function buildEligibleRepairAdmissions({
  incidents, plan, packs, candidate, baseCommit, evidenceTask, changeSetDigest, planDigest,
  resolveSuccession = resolveIncidentTaskSuccession, root, isAncestor, loadReceipt,
  canonicalIdentities:ancestorCanonicalIdentities, loadRepairCandidateRegistry,
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
    const repair = effectiveEligibleRepair(incident);
    const effectiveIncident = {...incident, repair};
    const exactCandidate = eligibleRepairCandidateMatches(effectiveIncident, candidate);
    let ancestor;
    if (!exactCandidate) {
      ancestor = await authenticateAncestorEligibleRepair({ incident:effectiveIncident,
        plan, packs, candidate,
        root, isAncestor, loadReceipt, resolveSuccession,
        canonicalIdentities:ancestorCanonicalIdentities, loadRepairCandidateRegistry,
        repairStateDigest:eligibleRepairStateDigest(incident) });
    }
    if (!validEligibleRepairProof(incident, repair, exactCandidate || Boolean(ancestor),
      baseCommit, evidenceTask)) {
      throw new Error(`Eligible repair admission ${incident.id} is not bound to the exact candidate and review checkpoint`);
    }
    const regression = selectedByKey.get(repair.regression.key);
    const governedDigest = verificationTaskDigest(incident.failure.task);
    const governed = selectedByDigest.get(governedDigest);
    let selected = ancestor?.selected ?? regression ?? governed;
    let coverageKind = ancestor?.coverageKind ??
      (regression ? "regression" : governed ? "governed-task" : undefined);
    let succession = ancestor?.succession;
    if (!selected) {
      canonicalIdentities ??= planVerification(packs, { terminalFull:true }).tasks
        .map(verificationTaskIdentity);
      try {
        succession = await resolveSuccession({ incident, currentIdentities:canonicalIdentities,
          currentPacks:packs });
        selected = selectedByDigest.get(succession.destinationTaskDigest);
      } catch {
        // The stable coverage error below covers graph-specific diagnostics.
      }
      if (selected) coverageKind = "successor";
    }
    if (!selected || !coverageKind) {
      throw new Error(`Eligible repair admission ${incident.id} has no exact selected task coverage`);
    }
    entries.push({
      incidentId:incident.id, failureDigest:incident.failureDigest,
      causalKey:eligibleRepairCausalKey(incident,repair),
      repairDigest:eligibleRepairStateDigest(incident), governedTaskDigest:governedDigest,
      regressionKey:repair.regression.key, selectedTaskKey:selected.key,
      selectedTaskDigest:verificationTaskDigest(selected), coverageKind,
      ...(succession ? { destinationTaskDigest:succession.destinationTaskDigest,
        conservationDigest:succession.conservationDigest } : {}),
      ...(ancestor ? { ancestorRepairCompatibility:ancestor.compatibility } : {}),
    });
  }
  if (!entries.length) return null;
  return { version:1, evidenceTask, baseCommit,
    candidateCommit:candidate.commit, candidateTree:candidate.tree,
    changeSetDigest, planDigest, entries };
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

export function validateEligibleRepairAdmissionsReceipt(
  receipt, admissions = receipt?.eligibleRepairAdmissions,
) {
  const exactKeys = (value, expected) => value && typeof value === "object" &&
    !Array.isArray(value) && JSON.stringify(Object.keys(value).sort()) ===
      JSON.stringify([...expected].sort());
  const admissionKeys = ["version", "evidenceTask", "baseCommit", "candidateCommit",
    "candidateTree", "changeSetDigest", "planDigest", "entries"];
  if (admissions?.version !== 1 || !Array.isArray(admissions.entries) ||
      !admissions.entries.length || !exactKeys(admissions, admissionKeys) ||
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
  const commonKeys = ["incidentId", "failureDigest", "causalKey", "repairDigest",
    "governedTaskDigest", "regressionKey", "selectedTaskKey", "selectedTaskDigest",
    "coverageKind"];
  const ids = admissions.entries.map(({ incidentId }) => incidentId);
  if (new Set(ids).size !== ids.length ||
      JSON.stringify(ids) !== JSON.stringify([...ids].sort())) {
    throw new Error("Eligible repair admission entries must be sorted and unique");
  }
  for (const entry of admissions.entries) {
    const successor = entry.coverageKind === "successor";
    const ancestor = entry.ancestorRepairCompatibility !== undefined;
    const expected = [...commonKeys,
      ...(successor ? ["destinationTaskDigest", "conservationDigest"] : []),
      ...(ancestor ? ["ancestorRepairCompatibility"] : [])];
    if (!exactKeys(entry, expected) || typeof entry.incidentId !== "string" || !entry.incidentId ||
        ![entry.failureDigest, entry.causalKey, entry.repairDigest, entry.governedTaskDigest,
          entry.selectedTaskDigest].every((value) => digestPattern.test(value ?? "")) ||
        typeof entry.regressionKey !== "string" || !entry.regressionKey ||
        typeof entry.selectedTaskKey !== "string" || !entry.selectedTaskKey ||
        !["regression", "governed-task", "successor"].includes(entry.coverageKind) ||
        entry.coverageKind === "regression" && entry.selectedTaskKey !== entry.regressionKey ||
        entry.coverageKind !== "regression" && entry.selectedTaskKey === entry.regressionKey &&
          !(successor && ancestor) ||
        entry.coverageKind === "governed-task" &&
          entry.selectedTaskDigest !== entry.governedTaskDigest ||
        successor && (entry.destinationTaskDigest !== entry.selectedTaskDigest ||
          entry.selectedTaskDigest === entry.governedTaskDigest ||
          !digestPattern.test(entry.conservationDigest ?? "")) ||
        ancestor && !validateAncestorRepairCompatibility(entry.ancestorRepairCompatibility,
          entry, { commit:admissions.candidateCommit, tree:admissions.candidateTree })) {
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
