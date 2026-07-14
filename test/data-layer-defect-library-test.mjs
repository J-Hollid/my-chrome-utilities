import assert from "node:assert/strict";
import {
  addDefect,
  attachSavedSessionToDefect,
  canonicalAffectedPath,
  completeDefectReportAction,
  confirmDefectDeletion,
  createDefectLibrary,
  createMissingEventDefect,
  createValidationDefect,
  defectLifecycleAction,
  editDefect,
  eventContainsDefectIssue,
  issueTriage,
  matchingDefects,
  requestDefectDeletion,
  restoreDefectLibrary,
  searchDefects,
  serializeDefectLibrary,
  triageEvent,
  updateDefectStatus,
} from "../dist/data-layer-defect-library.js";
import { createSavedSessionLibrary } from "../dist/data-layer-saved-sessions.js";

const identity = {
  sourceId:"event-history",
  eventName:"purchase",
  schemaId:"schema:checkout",
  validationTarget:"payload",
  concretePath:"/commerce/currency",
  templatePath:"/commerce/currency",
  ruleId:"rule:known-currencies",
  ruleRevision:2,
};
const issue = (overrides={}) => ({
  ...identity,
  actual:"GBP",
  expected:"EUR,USD",
  pageUrl:"https://shop.example/checkout",
  captureTime:"2026-07-14T14:00:00Z",
  sourceName:"Event history",
  schemaName:"Checkout",
  ruleName:"Known currencies",
  ...overrides,
});
const report = { summary:"purchase has invalid currency", description:"Original details", expectedExplanation:"Use a known currency", evidence:{ immutable:true } };
const now = "2026-07-14T14:01:00Z";

assert.equal(canonicalAffectedPath("/products/3/sku", "/products/*/sku"), "/products/*/sku");
assert.equal(canonicalAffectedPath("/commerce/currency"), "/commerce/currency");

const originalReport = structuredClone(report);
const defect = createValidationDefect({ id:"defect:currency", now, report, issues:[issue()], notes:"" });
assert.equal(eventContainsDefectIssue({
  id:"purchase:1", name:"purchase", sourceId:"event-history", payload:{}, rawInput:[],
  validationDetails:{
    schema:{ id:"schema:checkout", name:"Checkout", version:2 },
    assignment:{ sourceId:"event-history", eventName:"purchase", target:"payload" },
    evaluations:[],
    issues:[{ instancePath:"/commerce/currency", templatePath:"/commerce/currency", message:"Known currency", expected:"EUR,USD", actual:"GBP", schemaName:"Checkout", schemaVersion:2, schemaLocation:"#/commerce/currency", rule:"Known currencies v2" }],
  },
}, defect), true);
assert.deepEqual(report, originalReport, "creating a defect mutated the completed report");
assert.deepEqual(defect, {
  id:"defect:currency", type:"Validation issue", status:"Reported", createdAt:now, updatedAt:now,
  report, notes:"", issues:[{
    match:{ sourceId:"event-history", eventName:"purchase", schemaId:"schema:checkout", validationTarget:"payload", canonicalPath:"/commerce/currency", ruleId:"rule:known-currencies", ruleRevision:2 },
    evidence:issue(),
  }],
});

let library = addDefect(createDefectLibrary(), defect).library;
for (const [difference, expected] of [
  [{ actual:"CAD" }, "Reported"],
  [{ pageUrl:"https://shop.example/other" }, "Reported"],
  [{ sourceName:"History" }, "Reported"],
  [{ sourceId:"other" }, "New"],
  [{ eventName:"refund" }, "New"],
  [{ schemaId:"schema:other" }, "New"],
  [{ validationTarget:"raw input" }, "New"],
  [{ concretePath:"/order_id", templatePath:"/order_id" }, "New"],
  [{ ruleId:"rule:other" }, "New"],
  [{ ruleRevision:3 }, "Review required"],
]) assert.equal(issueTriage(issue(difference), library).state, expected);

const wildcardDefect = createValidationDefect({ id:"defect:sku", now, report, issues:[issue({ concretePath:"/products/0/sku", templatePath:"/products/*/sku", ruleId:"rule:sku" })] });
library = addDefect(library, wildcardDefect).library;
assert.deepEqual(matchingDefects(issue({ concretePath:"/products/3/sku", templatePath:"/products/*/sku", ruleId:"rule:sku" }), library).map(({ id }) => id), ["defect:sku"]);

const orderIssue = issue({ concretePath:"/order_id", templatePath:"/order_id", ruleId:"rule:required-order" });
assert.deepEqual([0,1,2].map((reportedCount) => {
  const defects = [defect, createValidationDefect({ id:"defect:order", now, report, issues:[orderIssue] })].slice(0, reportedCount);
  return triageEvent([issue(), orderIssue], { defects });
}), [
  { state:"2 new issues", newCount:2, reportedCount:0, reviewRequiredCount:0, issues:["New","New"] },
  { state:"1 new and 1 reported", newCount:1, reportedCount:1, reviewRequiredCount:0, issues:["Reported","New"] },
  { state:"all 2 issues reported", newCount:0, reportedCount:2, reviewRequiredCount:0, issues:["Reported","Reported"] },
]);

const duplicate = addDefect(library, createValidationDefect({ id:"defect:duplicate", now, report, issues:[issue()] }));
assert.equal(duplicate.added, false);
assert.deepEqual(duplicate.existing.map(({ id }) => id), ["defect:currency"]);
assert.equal(addDefect(library, duplicate.defect, true).added, true);

library = editDefect(library, defect.id, { report:{ ...report, description:"Edited details" }, notes:"Jira https://jira.example/browse/DL-42" }, "2026-07-14T14:02:00Z");
assert.equal(library.defects[0].report.description, "Edited details");
assert.match(library.defects[0].notes, /DL-42/);
library = restoreDefectLibrary(serializeDefectLibrary(library));
assert.equal(library.defects[0].report.description, "Edited details");
assert.equal(defectLifecycleAction(library.defects[0]), "Resolve");
library = updateDefectStatus(library, defect.id, "Resolved", "2026-07-14T14:03:00Z");
assert.equal(issueTriage(issue(), library).state, "Possible regression treated New");
assert.equal(defectLifecycleAction(library.defects[0]), "Reopen");
library = updateDefectStatus(library, defect.id, "Archived", "2026-07-14T14:04:00Z");
assert.equal(issueTriage(issue(), library).state, "New");
assert.equal(defectLifecycleAction(library.defects[0]), "none");

const completed = { id:"session:one", pageScope:"https://shop.example/checkout", startedAt:now, endedAt:now, events:[{ id:"purchase:1", sourceId:"event-history", sourceName:"Event history", name:"purchase", payload:{ currency:"GBP" }, rawInput:[], validationDetails:{ schema:{ id:"schema:checkout", name:"Checkout", version:2 }, assignment:{ sourceId:"event-history", eventName:"purchase", target:"payload" }, issues:[{ instancePath:"/commerce/currency", templatePath:"/commerce/currency", message:"Known currency", expected:"EUR,USD", actual:"GBP", schemaName:"Checkout", schemaVersion:2, schemaLocation:"#/commerce/currency", rule:"Known currencies v2" }], evaluations:[] } }] };
const linked = attachSavedSessionToDefect(library, createSavedSessionLibrary(), defect.id, completed, "DL-42 evidence", "2026-07-14T14:05:00Z");
assert.equal(linked.savedSessions.sessions.length, 1);
assert.equal(linked.library.defects.find(({ id }) => id === defect.id).savedSession.id, "saved:session:one");
assert.equal(linked.library.defects.find(({ id }) => id === defect.id).savedSession.containsMatchingIssue, true);
assert.equal(Object.isFrozen(linked.savedSessions.sessions[0]), true);
assert.throws(() => { linked.savedSessions.sessions[0].events[0].name = "changed"; }, TypeError);

const missing = createMissingEventDefect({ id:"defect:missing", now, report:{ type:"Missing event", expected:"purchase" }, notes:"checkout missing" });
const mixed = addDefect(linked.library, missing).library;
assert.equal(matchingDefects(issue(), mixed).some(({ id }) => id === missing.id), false);
assert.deepEqual(searchDefects(mixed, { query:"DL-42", status:"Archived", type:"Validation issue", eventName:"purchase", schema:"Checkout", path:"currency" }).map(({ id }) => id), [defect.id]);
const deletion = requestDefectDeletion(mixed, defect.id);
assert.equal(deletion.deletionConfirmationId, defect.id);
assert.equal(confirmDefectDeletion(deletion).defects.some(({ id }) => id === defect.id), false);

const writes = [];
const copyResult = await completeDefectReportAction(createDefectLibrary(), defect, "Save as reported defect and copy", { writeText:async (text) => writes.push(text) }, () => "Jira representation");
assert.equal(copyResult.library.defects.length, 1);
assert.deepEqual(writes, ["Jira representation"]);

for (const corrupted of [
  { ...defect, issues:[{ evidence:issue() }] },
  { ...defect, issues:[{ match:defect.issues[0].match, evidence:{ ...issue(), ruleRevision:"2" } }] },
  { ...defect, savedSession:{ id:"saved:one", containsMatchingIssue:"yes" } },
]) {
  assert.deepEqual(restoreDefectLibrary(JSON.stringify({ defects:[corrupted] })), createDefectLibrary());
}

console.log("data-layer defect library tests passed");
