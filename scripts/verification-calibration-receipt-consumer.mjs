import { validateHistoricalCalibration } from "./verification-performance/historical-calibration.mjs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { validateVerificationPerformanceCalibrationSnapshot } from
  "./report-verification-throughput.mjs";
import { buildCanonicalTimingLedger } from "./verification-timing-ledger.mjs";

async function readCalibration(repositoryRoot, read) {
  try {
    return JSON.parse(await read(path.join(repositoryRoot, "verification",
      "performance-calibration.json"), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function readRequiredTimingIndex(repositoryRoot, read) {
  try {
    return JSON.parse(await read(path.join(repositoryRoot, "verification",
      "timing-receipt-index.json"), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("Active performance calibration requires the timing receipt index");
    }
    throw error;
  }
}

export async function loadCalibrationReceiptConsumer({ repositoryRoot }, {
  read = readFile,
  buildTimingLedger = buildCanonicalTimingLedger,
  validateSnapshot = validateVerificationPerformanceCalibrationSnapshot,
} = {}) {
  const calibration = await readCalibration(repositoryRoot, read);
  if (!calibration) return () => null;
  if (Object.hasOwn(calibration, "sourceEvidence")) {
    validateHistoricalCalibration(calibration);
    return () => null;
  }
  const receiptIndex = await readRequiredTimingIndex(repositoryRoot, read);
  const expectedRuntime = Object.fromEntries(["node", "typescript", "platform"]
    .map((key) => [key, calibration.environment?.[key]]));
  const ledger = await buildTimingLedger({ sources:calibration.sourceScope,
    expectedRuntime, minimumIndependentSamples:calibration.minimumIndependentSamples,
    legacyExecutionLoads:receiptIndex.legacyExecutionLoads ?? {} });
  const snapshot = validateSnapshot(calibration, ledger);
  const retired = new Set(snapshot.retiredReceiptDigests);
  const active = new Set((calibration.receiptDigests ?? [])
    .filter((digest) => !retired.has(digest)));
  return ({ contentIdentity }) => {
    const digest = contentIdentity.replace(/^sha256:/u, "");
    if (!active.has(digest)) return null;
    return { kind:"performance-calibration", id:calibration.environmentClassId,
      status:"active", contentIdentity };
  };
}
