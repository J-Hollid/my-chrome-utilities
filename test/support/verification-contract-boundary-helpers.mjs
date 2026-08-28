import assert from "node:assert/strict";

export async function captureRequiredRejection(action) {
  let rejected;
  try {
    await action();
  } catch (error) {
    rejected = error;
  }
  assert.ok(rejected instanceof Error, "an isolated verification mutation is rejected");
  return rejected.message;
}

export function unreadableConsumerEvidence() {
  throw new Error("parsed consumer evidence is unreadable");
}

export async function verificationPackValidationDiagnostic(
  validateVerificationPacks,
  candidatePacks,
  inventory,
) {
  try {
    await validateVerificationPacks(candidatePacks, { inventory });
  } catch (error) {
    return error.message;
  }
  throw new Error("verification-pack validation unexpectedly accepted invalid input");
}

export function assertReadOnlyArtifactLease(task) {
  assert.deepEqual(task.artifactLease, {token:"coordinator-token", access:"read"},
    "a read-only browser child receives the coordinator lease");
}
