import assert from "node:assert/strict";
import {
  acceptMissingEventReplacements,
  changeMissingEventInterval,
  changeMissingEventScope,
  confirmMissingEventExpectation,
  createMissingEventDraft,
  createMissingEventReport,
  editMissingEventExpectation,
  generateMissingEventRepresentations,
  overrideMissingEventWarning,
  selectMissingEventAssignment,
  selectMissingEventSchema,
  verifyMissingEventAbsence,
} from "../dist/data-layer-missing-event-defect-report.js";

const checkoutAssignment = {
  id:"assignment:checkout-purchase",
  name:"Checkout purchase",
  sourceId:"event-history",
  eventName:"purchase",
  target:"payload",
  domainCondition:"shop.example",
  pathnameCondition:"/checkout",
  enabled:true,
};
const schema = {
  id:"schema-checkout-purchase",
  name:"Checkout purchase",
  version:4,
  document:{ type:"object", properties:{ transaction_id:{ type:"string" } } },
  assignments:[checkoutAssignment],
  attachedRules:[{ id:"rule:transaction", name:"Transaction required", version:2, propertyPath:"/transaction_id", operator:"required" }],
  documentation:{ description:"Purchase expected after checkout confirmation" },
};
const checkoutVisit = {
  id:"visit:checkout:2",
  pageUrl:"https://shop.example/checkout",
  pathname:"/checkout",
  startedAt:"2026-07-14T12:00:00Z",
  endedAt:"2026-07-14T12:01:00Z",
  events:[
    { id:"pageview", name:"pageview", sourceId:"event-history", sourceName:"Event history", pageUrl:"https://shop.example/checkout", captureTime:"2026-07-14T12:00:01Z", validation:"Valid", payload:{ page_type:"checkout" } },
  ],
};

let draft = createMissingEventDraft("Live session actions", [checkoutVisit], [schema]);
draft = selectMissingEventSchema(draft, schema.id);
assert.deepEqual(draft.expectation.assignmentChoices, [checkoutAssignment]);
assert.equal(draft.expectation.assignment?.id, checkoutAssignment.id);
assert.deepEqual(
  [draft.expectation.sourceId, draft.expectation.eventName, draft.expectation.target, draft.expectation.pageUrl],
  ["event-history", "purchase", "payload", "https://shop.example/checkout"],
);
assert.equal(draft.expectation.confirmed, false);
assert.match(draft.assistance, /assignment controls validation.*does not prove/i);

draft = editMissingEventExpectation(draft, { explanation:"Checkout completion must emit purchase" });
draft = confirmMissingEventExpectation(draft);
draft = verifyMissingEventAbsence(draft);
assert.equal(draft.verification.matchingCount, 0);
assert.equal(draft.verification.warningVisible, false);
const report = createMissingEventReport(draft, ["pageview"]);
assert.equal(report.type, "Missing event");
assert.equal(report.capturedEventId, undefined);
assert.equal(report.actual, "No matching purchase event was captured");
assert.match(report.expected, /at least one purchase event.*Checkout purchase revision 4/i);
assert.equal(report.schema.name, "Checkout purchase");
assert.equal(report.schema.version, 4);
assert.equal(report.assignment.id, checkoutAssignment.id);
assert.equal(report.capture, undefined);
assert.equal(report.payload, undefined);
assert.deepEqual(report.validationIssues, []);
assert.equal(report.timeline.length, 1);
assert.equal(report.timeline[0].id, "pageview");
assert.equal(report.reproductionSteps[0], "Visit /checkout");
assert.match(report.reproductionSteps.at(-1), /Expect at least one matching purchase event/);

const rendered = generateMissingEventRepresentations(report);
for (const representation of [rendered.previewText, rendered.jiraText, rendered.previewHtml]) {
  assert.match(representation, /Missing event/);
  assert.match(representation, /No matching purchase event was captured/);
  assert.match(representation, /Checkout purchase revision 4/);
  assert.doesNotMatch(representation, /Actual JSON|validation differences|transaction_id.*:/i);
}
assert.doesNotMatch(rendered.jiraText, /override/i);

const matchingEvent = {
  id:"purchase-1",
  name:"purchase",
  sourceId:"event-history",
  sourceName:"Event history",
  pageUrl:"https://shop.example/checkout",
  captureTime:"2026-07-14T12:00:30Z",
  validation:"Valid",
  payload:{ transaction_id:"order-42" },
};
const visitWithMatch = { ...checkoutVisit, id:"visit:checkout:1", events:[...checkoutVisit.events, matchingEvent] };
let warningDraft = selectMissingEventSchema(createMissingEventDraft("schema row actions", [visitWithMatch, checkoutVisit], [schema]), schema.id);
warningDraft = verifyMissingEventAbsence(confirmMissingEventExpectation(warningDraft));
assert.equal(warningDraft.verification.matchingCount, 1);
assert.equal(warningDraft.verification.warningVisible, true);
assert.deepEqual(warningDraft.verification.matches.map(({ id, captureTime, sourceId, pageUrl, validation }) => ({ id, captureTime, sourceId, pageUrl, validation })), [{
  id:"purchase-1",
  captureTime:"2026-07-14T12:00:30Z",
  sourceId:"event-history",
  pageUrl:"https://shop.example/checkout",
  validation:"Valid",
}]);
assert.throws(() => createMissingEventReport(warningDraft), /Create missing-event report anyway/);
warningDraft = overrideMissingEventWarning(warningDraft, "The checkout integration is known to emit a duplicate fixture event");
const overrideReport = createMissingEventReport(warningDraft);
assert.equal(overrideReport.override?.matchingCount, 1);
assert.equal(overrideReport.matchingEventEvidence[0].id, "purchase-1");
assert.deepEqual(overrideReport.matchingEventEvidence[0].payload, matchingEvent.payload);
assert.match(generateMissingEventRepresentations(overrideReport).jiraText, /explicit override/i);

let changed = changeMissingEventScope(warningDraft, checkoutVisit.id);
changed = verifyMissingEventAbsence(changed);
assert.equal(changed.verification.matchingCount, 0);
assert.equal(changed.verification.warningVisible, false);
assert.equal(changed.override, undefined);
changed = changeMissingEventScope(changed, visitWithMatch.id);
changed = verifyMissingEventAbsence(changed);
assert.equal(changed.verification.warningVisible, true);
assert.equal(changed.override, undefined);

const secondAssignment = { ...checkoutAssignment, id:"assignment:checkout-purchase-secondary", name:"Secondary checkout" };
const multiple = selectMissingEventSchema(
  createMissingEventDraft("Live session actions", [checkoutVisit], [{ ...schema, assignments:[checkoutAssignment, secondAssignment] }]),
  schema.id,
);
assert.equal(multiple.expectation.assignment, undefined);
assert.equal(multiple.expectation.assignmentChoices.length, 2);
assert.match(multiple.assistance, /choose an assignment/i);
assert.equal(selectMissingEventAssignment(multiple, secondAssignment.id).expectation.assignment.id, secondAssignment.id);

const unassigned = selectMissingEventSchema(
  createMissingEventDraft("Live session actions", [checkoutVisit], [{ ...schema, assignments:[] }]),
  schema.id,
);
assert.equal(unassigned.expectation.assignment, undefined);
assert.equal(unassigned.expectation.warningAcknowledged, false);
assert.match(unassigned.assistance, /acknowledge/i);
assert.throws(() => confirmMissingEventExpectation(unassigned), /acknowledge/i);

const disabledAssignment = { ...checkoutAssignment, id:"assignment:disabled", enabled:false };
const disabledOnly = selectMissingEventSchema(
  createMissingEventDraft("Live session actions", [checkoutVisit], [{ ...schema, assignments:[disabledAssignment] }]),
  schema.id,
);
assert.equal(disabledOnly.expectation.assignment, undefined);
assert.deepEqual(disabledOnly.expectation.disabledAssignmentContext, [disabledAssignment]);
assert.match(disabledOnly.assistance, /disabled.*non-authoritative/i);

const wrongPageMatch = {
  ...matchingEvent,
  id:"purchase-wrong-page",
  pageUrl:"https://shop.example/checkout/confirmation",
};
let exactPageDraft = selectMissingEventSchema(
  createMissingEventDraft("Live session actions", [{ ...checkoutVisit, events:[wrongPageMatch] }], [schema]),
  schema.id,
);
exactPageDraft = verifyMissingEventAbsence(confirmMissingEventExpectation(exactPageDraft));
assert.equal(exactPageDraft.verification.matchingCount, 0);

const edited = editMissingEventExpectation(draft, { eventName:"custom_purchase", sourceId:"custom-source" });
const replacement = selectMissingEventSchema(edited, schema.id);
assert.equal(replacement.expectation.eventName, "custom_purchase");
assert.equal(replacement.expectation.sourceId, "custom-source");
assert.deepEqual(replacement.replacementReview.map(({ field }) => field).sort(), ["eventName", "sourceId"]);
const acceptedReplacement = acceptMissingEventReplacements(replacement);
assert.equal(acceptedReplacement.expectation.eventName, "purchase");
assert.equal(acceptedReplacement.expectation.sourceId, "event-history");
assert.deepEqual(acceptedReplacement.replacementReview, []);
assert.deepEqual(acceptedReplacement.expectation.editedFields, ["explanation"]);

let intervalDraft = verifyMissingEventAbsence(confirmMissingEventExpectation(selectMissingEventSchema(
  createMissingEventDraft("Live session actions", [visitWithMatch], [schema]),
  schema.id,
)));
assert.equal(intervalDraft.verification.matchingCount, 1);
intervalDraft = changeMissingEventInterval(intervalDraft, "2026-07-14T12:00:40Z", "2026-07-14T12:01:00Z");
assert.equal(intervalDraft.override, undefined);
intervalDraft = verifyMissingEventAbsence(intervalDraft);
assert.equal(intervalDraft.verification.matchingCount, 0);
intervalDraft = changeMissingEventInterval(intervalDraft, "2026-07-14T12:00:00Z", "2026-07-14T12:01:00Z");
intervalDraft = verifyMissingEventAbsence(intervalDraft);
assert.equal(intervalDraft.verification.matchingCount, 1);
assert.throws(() => changeMissingEventInterval(intervalDraft, "invalid", "2026-07-14T12:01:00Z"), /valid observation interval/i);

const savedEvents = [...checkoutVisit.events];
const savedDraft = createMissingEventDraft("saved session", [{ ...checkoutVisit, immutable:true, events:savedEvents }], [schema]);
savedEvents.push(matchingEvent);
const savedVerified = verifyMissingEventAbsence(confirmMissingEventExpectation(selectMissingEventSchema(savedDraft, schema.id)));
assert.equal(savedVerified.verification.matchingCount, 0);
assert.equal(savedVerified.scope.immutable, true);

console.log("data-layer missing event defect report tests passed");
