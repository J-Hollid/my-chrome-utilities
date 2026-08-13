import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

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
  if (options.timeoutRepairFocused || options.timeoutRepairIncident || options.timeoutDiagnosticRetry) {
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

function safeLegacyReceiptPath(root, sourceReceipt) {
  if (typeof sourceReceipt !== "string" ||
      !/^tmp\/verification-receipts\/[A-Za-z0-9._-]+\.json$/u.test(sourceReceipt)) return null;
  const absolute = path.resolve(root, sourceReceipt);
  const relative = path.relative(path.resolve(root), absolute).split(path.sep).join("/");
  return relative === sourceReceipt ? absolute : null;
}

function readinessClaim(receipt) {
  const claims = [receipt.readiness, receipt.verified, receipt.evidence?.readiness,
    receipt.candidate?.readiness, receipt.candidate?.verified];
  return claims.some((value) => ["review-ready", "qa-ready", "final-ready", "qa-candidate"]
    .includes(value));
}

export async function classifyLegacyIncidentRunIntent({ root, incident }) {
  if (incident?.terminalVerificationDeferred) {
    return { applicable:false, blocking:true, reason:"terminal-verification-deferred" };
  }
  const sourcePath = safeLegacyReceiptPath(root, incident?.failure?.sourceReceipt);
  if (!sourcePath) return { applicable:true, blocking:true, reason:"missing-source-receipt" };
  let bytes;
  let receipt;
  try {
    bytes = await readFile(sourcePath);
    receipt = JSON.parse(bytes);
  } catch {
    return { applicable:true, blocking:true, reason:"unreadable-source-receipt" };
  }
  if (receipt.runIntent !== undefined) {
    return { applicable:false, blocking:receipt.runIntent !== verificationRunIntents.development,
      reason:"explicit-run-intent" };
  }
  const ordinaryMode = ["exact", "focused", "focused-task"].includes(receipt.plan?.mode);
  const noEvidenceAuthority = receipt.candidate?.evidenceTask === null &&
    receipt.pendingEvidence === undefined && receipt.evidence === undefined;
  const noRepairAuthority = receipt.timeoutRepairCheckpoint === undefined &&
    receipt.diagnostic === undefined && receipt.plan?.incidentId === undefined;
  const noTerminalAuthority = receipt.plan?.terminalClosure === undefined &&
    receipt.plan?.mode !== "terminal";
  const noReadinessClaim = !readinessClaim(receipt);
  const receiptShape = receipt.version === 2 && typeof receipt.runId === "string" &&
    typeof receipt.startedAt === "string" && receipt.tasks && !Array.isArray(receipt.tasks) &&
    typeof receipt.candidate?.commit === "string" && typeof receipt.candidate?.tree === "string";
  const proven = [ordinaryMode, noEvidenceAuthority, noRepairAuthority, noTerminalAuthority,
    noReadinessClaim, receiptShape].every(Boolean);
  return {
    applicable:true,
    blocking:!proven,
    reason:proven ? "receipt-proven-development-diagnostic" : "ambiguous-legacy-authority",
    sourceReceipt:incident.failure.sourceReceipt,
    receiptSha256:createHash("sha256").update(bytes).digest("hex"),
    proof:{ ordinaryMode, noEvidenceAuthority, noRepairAuthority, noTerminalAuthority,
      noReadinessClaim, receiptShape, interrupted:receipt.completedAt === undefined },
  };
}
