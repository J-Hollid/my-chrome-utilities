import {parseBrowserObservationBatchOutput,emitValidatedBrowserObservationResults} from "./results.mjs";

export function completeBrowserObservationOutput(stdout, observations, durationMs) {
  const timed = new Set();
  const resulted = new Set();
  for (const line of stdout.split(/\r?\n/u)) {
    try {
      const record = JSON.parse(line);
      const timingId = record.swarmforgeBrowserTargetTiming?.id;
      const resultId = record.swarmforgeBrowserTargetResult?.id;
      if (typeof timingId === "string") timed.add(timingId);
      if (typeof resultId === "string") resulted.add(resultId);
    } catch { /* ordinary browser diagnostics are not timing records */ }
  }
  const missing = observations.filter(({ id }) => !timed.has(id));
  if (missing.length) {
    throw new Error(
      `Browser observation target(s) ${missing.map(({ id }) => id).join(", ")} must emit their own timing; ` +
      `aggregate process duration ${durationMs}ms is not target evidence`,
    );
  }
  if (observations.length > 1) {
    const missingResults = observations.filter(({ id }) => !resulted.has(id));
    if (missingResults.length) {
      throw new Error(`Browser observation target(s) ${missingResults.map(({ id }) => id).join(", ")} must emit their own pass or failure result`);
    }
  }
  return stdout;
}

export function validateBrowserObservationProcessOutput(stdout,observations,durationMs,emit=console.log) {
  const parsed=parseBrowserObservationBatchOutput(stdout,observations);
  emitValidatedBrowserObservationResults(stdout,observations,parsed,emit);
  completeBrowserObservationOutput(stdout,observations,durationMs);
  return parsed;
}
