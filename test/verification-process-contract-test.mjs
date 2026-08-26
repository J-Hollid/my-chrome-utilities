import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { verificationProcessCompatibilitySuccessors } from
  "../scripts/verification-policy/contracts.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));

export function runVerificationProcessCompatibility({
  successors = verificationProcessCompatibilitySuccessors,
  spawn = spawnSync,
} = {}) {
  const results = [];
  for (const successor of successors) {
    const result = spawn(process.execPath, [successor], {
      cwd:repositoryRoot,
      env:process.env,
      stdio:"inherit",
    });
    results.push({ path:successor, status:result.status, signal:result.signal ?? null });
    if (result.error) throw result.error;
  }
  const failures = results.filter(({ status, signal }) => status !== 0 || signal);
  if (failures.length) {
    const error = new Error(`Verification process successors failed: ${failures
      .map(({ path:successor, status, signal }) =>
        `${successor} (${signal ? `signal ${signal}` : `status ${status}`})`).join(", ")}`);
    error.results = results;
    throw error;
  }
  return results;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runVerificationProcessCompatibility();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
