// Compatibility surface for the original timeout-specific VTD-014 module name.
// The implementation is partitioned by progress, persistence, receipts, repair,
// and store responsibilities behind the failure-neutral adapter.
import { pathToFileURL } from "node:url";

import {
  createTimeoutIncidentStore,
  runReliabilityIncidentCli as runCli,
} from "./verification-reliability-runtime.mjs";

export * from "./verification-reliability-progress.mjs";
export * from "./verification-reliability-repair.mjs";
export * from "./verification-reliability-receipts.mjs";
export * from "./verification-reliability-store.mjs";
export {
  reliabilityFailureFingerprint, timeoutIncidentDigest, timeoutRepairPackIds,
} from "./verification-reliability-values.mjs";

export const runReliabilityIncidentCli = runCli;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runReliabilityIncidentCli(process.argv.slice(2))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
