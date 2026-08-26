export const verificationRunIntents = Object.freeze({
  development:"development-diagnostic",
  review:"review-evidence",
  repair:"repair-focused",
  terminal:"terminal",
});

const intentValues = new Set(Object.values(verificationRunIntents));

export function verificationRunIntent(options = {}) {
  if (options.terminalFull || options.boundedClosureEvidenceTask !== undefined &&
      options.prepareEvidence === options.boundedClosureEvidenceTask) {
    return verificationRunIntents.terminal;
  }
  if (options.timeoutRepairFocused || options.timeoutDiagnosticRetry) {
    return verificationRunIntents.repair;
  }
  if (options.prepareEvidence) return verificationRunIntents.review;
  return verificationRunIntents.development;
}

export function requireVerificationRunIntent(receipt, expected) {
  if (!intentValues.has(receipt?.runIntent)) {
    throw new Error("Verification receipt is missing a valid immutable run intent");
  }
  if (expected !== undefined && receipt.runIntent !== expected) {
    throw new Error(`Verification receipt run intent ${receipt.runIntent} cannot support ${expected}`);
  }
  return receipt.runIntent;
}
