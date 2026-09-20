import {timeoutIncidentDigest} from "../../verification-reliability-values.mjs";

function sameValues(left, right) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

export function invalidFeatureResolutionMatches(incident, {checkpointCommit, packIds}) {
  const resolution = incident?.resolution ??
    incident?.invalidResolutionCorrection?.priorResolution;
  return resolution?.checkpoint?.commit === checkpointCommit &&
    sameValues(resolution.checkpoint.packIds ?? [], packIds);
}

export function recoverInvalidFeatureResolution(incident, {
  checkpointCommit, packIds, correctedAt,
}) {
  if (!invalidFeatureResolutionMatches(incident, {checkpointCommit, packIds}) ||
      incident.state !== "resolved" || !incident.resolution ||
      !Number.isFinite(Date.parse(correctedAt))) {
    throw new Error(`Reliability incident ${incident?.id ?? "unknown"} does not exactly match the invalid feature resolution`);
  }
  const unsigned = {
    version:1, status:"invalid-feature-resolution-corrected",
    reason:"feature-mode-checkpoint-cannot-settle-terminal-obligations",
    incidentId:incident.id, failureDigest:incident.failureDigest,
    checkpointCommit, packIds:[...packIds].sort(),
    priorRepairCheckpoint:structuredClone(incident.repairCheckpoint),
    priorResolution:structuredClone(incident.resolution), correctedAt,
  };
  const correction = {...unsigned, digest:timeoutIncidentDigest(unsigned)};
  const {resolution:ignored, ...withoutResolution} = incident;
  void ignored;
  return {
    ...withoutResolution, state:"unresolved", invalidResolutionCorrection:correction,
    transitions:[...incident.transitions, {
      type:"invalid-feature-resolution-corrected", at:correctedAt,
      correctionDigest:correction.digest, priorResolutionDigest:incident.resolution.digest,
    }],
  };
}

export function validateInvalidFeatureResolutionCorrection(incident) {
  const correction = incident?.invalidResolutionCorrection;
  if (correction === undefined) return undefined;
  const unsigned = {...correction};
  delete unsigned.digest;
  if (correction.version !== 1 ||
      correction.status !== "invalid-feature-resolution-corrected" ||
      correction.reason !== "feature-mode-checkpoint-cannot-settle-terminal-obligations" ||
      correction.incidentId !== incident.id || correction.failureDigest !== incident.failureDigest ||
      correction.priorResolution?.checkpoint?.commit !== correction.checkpointCommit ||
      !sameValues(correction.priorResolution?.checkpoint?.packIds ?? [], correction.packIds ?? []) ||
      correction.priorRepairCheckpoint?.status !== "claimed" ||
      !Number.isFinite(Date.parse(correction.correctedAt)) ||
      correction.digest !== timeoutIncidentDigest(unsigned)) {
    throw new Error(`Reliability incident ${incident.id} invalid feature resolution correction is malformed`);
  }
  return correction;
}

export function invalidFeatureResolutionNeedsFreshDeferral(incident) {
  const correction = validateInvalidFeatureResolutionCorrection(incident);
  if (!correction) return false;
  const deferred = incident.terminalVerificationDeferred;
  const admission = deferred?.eligibleRepairAdmissions?.entries?.find(
    ({incidentId}) => incidentId === incident.id);
  return deferred?.invalidFeatureResolutionCorrectionDigest !== correction.digest ||
    admission?.failureDigest !== incident.failureDigest;
}

export function invalidFeatureResolutionNeedsCandidateDeferral(incident,{
  candidateCommit,evidenceTask,
}={}){
  if(invalidFeatureResolutionNeedsFreshDeferral(incident))return true;
  if(!incident.invalidResolutionCorrection)return false;
  const deferred=incident.terminalVerificationDeferred;
  return typeof candidateCommit==="string"&&typeof evidenceTask==="string"&&
    deferred?.candidate?.commit!==candidateCommit&&deferred?.reviewReady?.task===evidenceTask;
}
