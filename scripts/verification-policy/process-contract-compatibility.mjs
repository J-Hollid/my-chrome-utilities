import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { verificationProcessCompatibilitySuccessors } from "./contracts.mjs";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));

export function runVerificationProcessCompatibility({
  successors = verificationProcessCompatibilitySuccessors,
  spawn = spawnSync,
  writeStdout = (value) => process.stdout.write(value),
  writeStderr = (value) => process.stderr.write(value),
} = {}) {
  const results = [];
  for (const successor of successors) {
    const result = spawn(process.execPath, [successor], {
      cwd:repositoryRoot,
      env:process.env,
      encoding:"utf8",
      stdio:["inherit", "pipe", "pipe"],
    });
    if (result.stdout) writeStdout(result.stdout);
    if (result.stderr) writeStderr(result.stderr);
    results.push({ path:successor, status:result.status, signal:result.signal ?? null });
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
