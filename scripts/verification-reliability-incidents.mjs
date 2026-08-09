// VTD-014 originally shipped under a timeout-specific module name. Keep that
// implementation as the compatibility boundary while exposing the approved,
// failure-neutral API to the runner, evidence recorder, and handoff gate.
import { pathToFileURL } from "node:url";

import { runReliabilityIncidentCli } from "./verification-timeout-incidents.mjs";

export * from "./verification-timeout-incidents.mjs";
export {
  assertNoBlockingTimeoutIncidents as assertNoBlockingReliabilityIncidents,
  createTimeoutIncidentStore as createReliabilityIncidentStore,
  diagnosticRetryScope,
  reliabilityFailureFingerprint,
  timeoutIncidentDigest as reliabilityIncidentDigest,
  timeoutRepairCausalCategory as reliabilityRepairCausalCategory,
  timeoutRepairFocusedTaskPlan as reliabilityRepairFocusedTaskPlan,
  timeoutRepairPackageTaskIdentity as reliabilityRepairPackageTaskIdentity,
  timeoutRepairPackIds as reliabilityRepairPackIds,
  timeoutResolutionEvidence as reliabilityResolutionEvidence,
  validateTimeoutRepairProposal as validateReliabilityRepairProposal,
  verificationProgressEmitter,
  createVerificationProgressTracker,
  classifyHistoricalTimeoutFixture,
} from "./verification-timeout-incidents.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runReliabilityIncidentCli(process.argv.slice(2))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
