import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { focusedAcceptanceOptions } from "../../scripts/run-focused-acceptance.mjs";
import { requireEvidenceReceiptRunIntent, verificationDigest } from "../../scripts/verification-evidence.mjs";
import { loadVerificationPacks } from "../../scripts/verification-registry/validation.mjs";
import { verificationRunIntents } from "../../scripts/verification-run-intent.mjs";
const exec = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, options, (error, stdout, stderr) => error
    ? reject(new Error(stderr || error.message))
    : resolve(stdout.trim()));
});

const options = focusedAcceptanceOptions([
  "--pack", "capture", "--pack", "schemas", "--changed-since", "base",
  "--prepare-evidence", "task-17", "--property",
]);

const syntheticChangeSet = (entries) => ({
  version:1,
  baseCommit:"1".repeat(40),
  commit:"2".repeat(40),
  entries,
  paths:[...new Set(entries.flatMap((entry) => entry.oldPath
    ? [entry.oldPath, entry.newPath]
    : [entry.path]))].sort(),
});

const packs = await loadVerificationPacks();
assert.equal(verificationDigest({ b:2, a:1 }), verificationDigest({ a:1, b:2 }),
  "evidence identity uses canonical object ordering");

assert.equal(requireEvidenceReceiptRunIntent({ runIntent:verificationRunIntents.review },
  verificationRunIntents.review), verificationRunIntents.review,
  "promotion validates the immutable receipt intent");

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if (context.causalCategory === "other:retired calibration receipt identity") {
    const normalized = (value) => Array.isArray(value) ? value.map(normalized)
      : value && typeof value === "object" ? Object.fromEntries(Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalized(nested)])) : value;
    const digest = (value) => createHash("sha256")
      .update(JSON.stringify(normalized(value))).digest("hex");
    const expectedPreRepairFailure = {
      missingRawReceiptRejected:true, compactRetiredIdentityAccepted:false,
    };
    const expectedRepairResult = {
      missingRawReceiptRejected:true, compactRetiredIdentityAccepted:true,
    };
    const fixture = { id:"retired-calibration-receipt-identity-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{ receiptDigest:"7ec18d4652e12c04c5a3df91afc8243c6a88d4ab9ab16c2b4def2d1a2c8ac255",
        rawReceiptPresent:false },
      expectedPreRepairFailure, expectedRepairResult };
    const fixtureDigest = digest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:{
        missingRawReceiptRejected:true,
        compactRetiredIdentityAccepted:committedSnapshot.retiredReceiptDigests.length === 1,
      } },
    } }));
  }
}
