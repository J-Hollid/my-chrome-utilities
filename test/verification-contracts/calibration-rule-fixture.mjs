import { createHash } from "node:crypto";

// Authored rule examples, never recovered measurements or archived receipts.
const digest = label => createHash("sha256").update(`calibration-rule-test:${label}`).digest("hex");
export function calibrationRuleFixture() {
  const environmentClassId = digest("environment");
  const receiptCutoff = "2001-01-02T00:00:00Z";
  const entry = (label, completedAt, extra = {}) => ({digest:digest(label),
    environmentClassId, rejectionReason:null,
    receipt:{completedAt, environment:{fixture:true}, plan:{packIds:[]}, tasks:{}}, ...extra});
  const before = Array.from({length:7}, (_,i) => entry(`before-${i}`, "2001-01-01T00:00:00Z"));
  const after = entry("after", "2001-01-03T00:00:00Z");
  const rejected = entry("rejected", "2001-01-01T00:00:00Z", {rejectionReason:"incomplete-task-result"});
  const cross = entry("cross-environment", "2001-01-01T00:00:00Z",
    {environmentClassId:digest("other-environment")});
  const calibration = {environmentClassId,receiptCutoff,
    receiptDigests:before.map(({digest}) => digest).sort(), retiredReceipts:[]};
  const ledger = {receipts:[...before,after,rejected,cross],rejectedByReason:{"incomplete-task-result":1}};
  const refreshed = {...calibration,receiptCutoff:after.receipt.completedAt,
    receiptDigests:[...calibration.receiptDigests,after.digest].sort()};
  const declaring = sample => ({...calibration,receiptDigests:[...calibration.receiptDigests,sample]});
  return {calibration,ledger,refreshed,conditions:{
    valid:calibration,
    omitted:{...refreshed,receiptDigests:calibration.receiptDigests},
    duplicate:declaring(before[0].digest), missing:declaring(digest("missing")),
    rejected:declaring(rejected.digest), crossClass:declaring(cross.digest),
    postCutoff:declaring(after.digest), retirementMismatch:{...calibration,
      retiredReceipts:[{digest:before[0].digest,environmentClassId,completedAt:receiptCutoff}]},
  }};
}
