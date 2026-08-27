import assert from "node:assert/strict";

import { requireEvidenceReceiptRunIntent, verificationDigest } from
  "../../scripts/verification-evidence/core.mjs";
import { verificationRunIntents } from "../../scripts/verification-policy/reliability/run-intent.mjs";

assert.equal(verificationDigest({ b:2, a:1 }), verificationDigest({ a:1, b:2 }),
  "evidence identity uses canonical object ordering");
assert.equal(requireEvidenceReceiptRunIntent({ runIntent:verificationRunIntents.review },
  verificationRunIntents.review), verificationRunIntents.review,
  "promotion validates the immutable receipt intent");
