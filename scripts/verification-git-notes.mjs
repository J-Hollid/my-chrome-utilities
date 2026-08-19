import path from "node:path";

import { acquireDistArtifactLock } from "./dist-artifact-lock.mjs";
import { git } from "./verification-reliability-values.mjs";

export async function acquireVerificationNotesLock(repositoryRoot) {
  const commonDirectory = await git(repositoryRoot, "rev-parse", "--git-common-dir");
  const lockDirectory = path.join(
    path.isAbsolute(commonDirectory) ? commonDirectory : path.resolve(repositoryRoot, commonDirectory),
    "swarmforge-verification-notes.lock",
  );
  return acquireDistArtifactLock(lockDirectory, { timeoutMs:120_000, reportAfterMs:5_000 });
}

// Repository lock order is artifact, verification notes, review transaction, incident.
export async function withVerificationNotesLock(repositoryRoot, operation) {
  const release = await acquireVerificationNotesLock(repositoryRoot);
  try { return await operation(); }
  finally { await release(); }
}
