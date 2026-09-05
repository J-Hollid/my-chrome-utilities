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

export function retiredCalibrationRuleFixture() {
  const input = calibrationRuleFixture();
  const retired = input.ledger.receipts[0];
  input.calibration.retiredReceipts = [{digest:retired.digest,
    environmentClassId:retired.environmentClassId,completedAt:retired.receipt.completedAt}];
  input.ledger.receipts = input.ledger.receipts.slice(1);
  input.ledger.receiptLossDispositions = [{version:1,digest:digest("lost-after"),
    environmentClassId:input.calibration.environmentClassId,completedAt:"2001-01-04T00:00:00Z"}];
  // A second later raw sample keeps the ordinary live population larger than the snapshot.
  const later = structuredClone(input.ledger.receipts.find(e => e.receipt.completedAt === "2001-01-03T00:00:00Z"));
  later.digest = digest("second-after"); input.ledger.receipts.push(later);
  return {calibration:input.calibration,ledger:input.ledger};
}

export function authoredCalibrationTimingInputs(aggregate,baseline) {
  const replacements = new Map(aggregate.receiptDigests.map((value,index) =>
    [value,digest(`timing-class-${index}`)]));
  replacements.set(aggregate.environmentClassId,digest("timing-environment"));
  const remap = value => JSON.parse(JSON.stringify(value),(_,item) => replacements.get(item) ?? item);
  return {aggregate:remap(aggregate),baseline:remap(baseline)};
}
