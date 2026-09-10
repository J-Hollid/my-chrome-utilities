import {normalized, timeoutIncidentDigest} from
  "../../verification-reliability-values.mjs";
import {effectiveFailureCheckpoint,validateCheckpointLineageRecovery} from './checkpoint-lineage-recovery.mjs';

const shaPattern = /^[a-f0-9]{64}$/u;

function same(left, right) {
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right));
}

function approvedCheckpoint(incident) {
  return effectiveFailureCheckpoint(incident);
}

export function validateInitialRepairCheckpoint(incident, checkpoint) {
  if (!same(checkpoint, approvedCheckpoint(incident))) {
    throw new Error("Reliability repair checkpoint must match the approved failure lineage");
  }
  return checkpoint;
}

function correctionError() {
  return new Error("Eligible repair checkpoint correction is not exact");
}

function conservedRepairIdentity(current, proposed) {
  return same(current.candidate, proposed.candidate) &&
    same(current.changedPaths, proposed.changedPaths) &&
    current.causalCategory === proposed.causalCategory &&
    current.causalExplanation === proposed.causalExplanation &&
    same(current.taskCheckpointProof, proposed.taskCheckpointProof) &&
    current.regression?.key === proposed.regression?.key &&
    current.regression?.status === proposed.regression?.status &&
    current.regression?.commit === proposed.regression?.commit &&
    current.focusedReceipt?.status === proposed.focusedReceipt?.status &&
    current.focusedReceipt?.commit === proposed.focusedReceipt?.commit &&
    current.focusedReceipt?.provenance === proposed.focusedReceipt?.provenance &&
    same(current.diagnosedBoundary, proposed.diagnosedBoundary) &&
    same(current.causalProtocol, proposed.causalProtocol) &&
    same(current.focusedTaskPlan, proposed.focusedTaskPlan);
}

function freshCorrectedEvidence(current, proposed) {
  const regression = proposed.regression;
  const focusedReceipt = proposed.focusedReceipt;
  return [regression?.receiptPath, focusedReceipt?.receiptPath].every((value) =>
    typeof value === "string" && Boolean(value)) &&
    [regression?.receiptSha256, focusedReceipt?.receiptSha256].every((value) =>
      shaPattern.test(value ?? "")) &&
    regression.receiptSha256 !== current.regression?.receiptSha256 &&
    focusedReceipt.receiptSha256 !== current.focusedReceipt?.receiptSha256;
}

export function createEligibleRepairCheckpointCorrection(incident, proposedRepair, {
  correctedAt = new Date().toISOString(),
} = {}) {
  if (incident?.repairCheckpointCorrection !== undefined) {
    throw new Error("Eligible repair permits only one correction");
  }
  const current = incident?.repair;
  const approved = approvedCheckpoint(incident);
  if (incident?.state !== "unresolved" || current?.status !== "eligible" ||
      same(current.checkpoint, approved) ||
      current.checkpoint?.evidenceTask !== approved.evidenceTask ||
      !same(proposedRepair?.checkpoint, approved) ||
      !conservedRepairIdentity(current, proposedRepair) ||
      !freshCorrectedEvidence(current, proposedRepair) ||
      !Number.isFinite(Date.parse(correctedAt))) {
    throw correctionError();
  }
  const unsigned = {
    version:1,
    status:"corrected",
    incidentId:incident.id,
    failureDigest:incident.failureDigest,
    candidate:structuredClone(current.candidate),
    priorCheckpoint:structuredClone(current.checkpoint),
    effectiveCheckpoint:structuredClone(approved),
    causalProtocolDigest:timeoutIncidentDigest(current.causalProtocol),
    regressionKey:current.regression.key,
    correctedEvidence:{
      regression:structuredClone(proposedRepair.regression),
      focusedReceipt:structuredClone(proposedRepair.focusedReceipt),
    },
    correctedAt,
  };
  return {...unsigned, digest:timeoutIncidentDigest(unsigned)};
}

export function validateEligibleRepairCheckpointCorrection(incident) {
  const correction = incident?.repairCheckpointCorrection;
  if (correction === undefined) return undefined;
  const repair = incident?.repair;
  const keys = ["version", "status", "incidentId", "failureDigest", "candidate",
    "priorCheckpoint", "effectiveCheckpoint", "causalProtocolDigest", "regressionKey",
    "correctedEvidence", "correctedAt", "digest"];
  const evidence = correction.correctedEvidence;
  const unsigned = {...correction};
  delete unsigned.digest;
  if (correction.version !== 1 || correction.status !== "corrected" ||
      JSON.stringify(Object.keys(correction).sort()) !== JSON.stringify(keys.sort()) ||
      correction.incidentId !== incident.id ||
      correction.failureDigest !== incident.failureDigest ||
      !same(correction.candidate, repair?.candidate) ||
      !same(correction.priorCheckpoint, repair?.checkpoint) ||
      !same(correction.effectiveCheckpoint, approvedCheckpoint(incident)) ||
      correction.causalProtocolDigest !== timeoutIncidentDigest(repair?.causalProtocol) ||
      correction.regressionKey !== repair?.regression?.key ||
      !Number.isFinite(Date.parse(correction.correctedAt)) ||
      correction.digest !== timeoutIncidentDigest(unsigned) ||
      !conservedRepairIdentity(repair, {...repair,
        checkpoint:correction.effectiveCheckpoint,
        regression:evidence?.regression,
        focusedReceipt:evidence?.focusedReceipt}) ||
      !freshCorrectedEvidence(repair, evidence ?? {})) {
    throw correctionError();
  }
  return correction;
}

export function effectiveEligibleRepair(incident) {
  validateCheckpointLineageRecovery(incident);
  const correction = validateEligibleRepairCheckpointCorrection(incident);
  if (!correction) return incident?.repair;
  return {...structuredClone(incident.repair),
    checkpoint:structuredClone(correction.effectiveCheckpoint),
    regression:structuredClone(correction.correctedEvidence.regression),
    focusedReceipt:structuredClone(correction.correctedEvidence.focusedReceipt)};
}

export function eligibleRepairStateDigest(incident) {
  if(incident.checkpointLineageRecovery) {
    validateCheckpointLineageRecovery(incident);
    validateEligibleRepairCheckpointCorrection(incident);
    return timeoutIncidentDigest({repair:incident.repair,
      checkpointLineageRecovery:incident.checkpointLineageRecovery,
      repairCheckpointCorrection:incident.repairCheckpointCorrection});
  }
  if (!incident?.repairCheckpointCorrection) return timeoutIncidentDigest(incident?.repair);
  validateEligibleRepairCheckpointCorrection(incident);
  return timeoutIncidentDigest({repair:incident.repair,
    repairCheckpointCorrection:incident.repairCheckpointCorrection});
}
