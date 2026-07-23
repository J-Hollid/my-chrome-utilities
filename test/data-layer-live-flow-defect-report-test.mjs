import assert from "node:assert/strict";
import { createDefectReport } from "../dist/data-layer-defect-report.js";
import { defectCapturedEvent } from "../dist/data-layer-defect-report-browser.js";
import {
  generateReportDetails,
  renderJiraReport,
} from "../dist/data-layer-defect-report-export.js";
import { createManualFlowDefectEvent } from "../dist/data-layer-live-flow-defect-report.js";

const event = {
  id: "live-102",
  name: "pageview",
  sourceId: "history",
  sourceName: "Event history",
  captureTime: "2026-07-23T10:00:02.000Z",
  pageUrl: "https://shop.test/payment",
  payload: { funnel_stage: "review" },
};
const baseEntry = {
  projectId: "project-retail",
  flowId: "flow:checkout",
  flowName: "Checkout journey",
  stepId: "frame:payment",
  stepKind: "Page",
  stepName: "Payment",
  eventId: event.id,
  captureTime: event.captureTime,
  selectionMode: "Manual Flow test",
  effectiveSchemaRevision: 17,
  effectiveSchemaRevisionIdentity: "flow-schema:00000011",
  issues: [{
    path: "/funnel_stage",
    code: "EXPECTED_VALUE",
    severity: "error",
    expected: "payment",
    actual: "review",
    provenance: "Payment",
  }],
  provenance: [
    { contributorId: "profile:sitewide", contributorName: "Sitewide", scope: "Shared Profile" },
    { contributorId: "frame:payment", contributorName: "Payment", scope: "Flow Page-instance" },
  ],
  target: { id: "frame:payment", name: "Payment" },
  status: "Invalid",
};

function reportFor(entry) {
  const presented = createManualFlowDefectEvent(entry, {
    ...event,
    manualFlowValidations:[structuredClone(entry)],
  });
  assert.equal(presented.id, event.id, "Flow validation decorates the observed event rather than creating a parallel result");
  assert.equal(presented.manualFlowContext.eventStepLink.eventId, event.id);
  assert.equal("manualFlowValidations" in presented, false, "the ordinary event model does not retain a parallel Manual Flow result collection");
  return generateReportDetails(createDefectReport(defectCapturedEvent(presented)));
}

const relationshipEntry = {
  ...baseEntry,
  relationshipId: "relationship:cart-payment",
  matchedPath: [
    {
      stepId: "frame:cart",
      stepName: "Cart",
      eventId: "live-101",
      captureTime: "2026-07-23T10:00:01.000Z",
    },
    {
      stepId: "frame:payment",
      stepName: "Payment",
      relationshipId: "relationship:cart-payment",
      eventId: "live-102",
      captureTime: event.captureTime,
    },
  ],
};
const relationshipReport = reportFor(relationshipEntry);
assert.deepEqual(relationshipReport.event.flowContext.eventStepLink, {
  eventId: "live-102",
  stepId: "frame:payment",
});
assert.deepEqual(relationshipReport.event.flowContext.linkEvidence, {
  kind: "path",
  label: "path Cart to Payment",
  relationshipIds: ["relationship:cart-payment"],
});
assert.deepEqual(relationshipReport.event.flowContext.effectiveTarget, {
  id: "frame:payment",
  name: "Payment",
});
assert.equal(relationshipReport.event.flowContext.effectiveSchemaRevision, 17);
assert.deepEqual(
  relationshipReport.event.flowContext.provenance.map(({ contributorId, scope }) => ({ contributorId, scope })),
  [
    { contributorId: "profile:sitewide", scope: "Shared Profile" },
    { contributorId: "frame:payment", scope: "Flow Page-instance" },
  ],
);
assert.deepEqual(
  relationshipReport.evidence.flow,
  relationshipReport.event.flowContext,
  "generated report evidence carries the immutable Flow snapshot",
);
assert.deepEqual(
  relationshipReport.evidence.validation.map(({ actual, constraint, rule }) => ({ actual, constraint, rule })),
  [{ actual: '"review"', constraint: '"payment"', rule: "EXPECTED_VALUE" }],
);
assert.equal(
  relationshipReport.summary,
  "pageview does not satisfy Payment in Checkout journey",
);
assert.match(relationshipReport.description, /linked Payment Flow-step expectation/);
assert.doesNotMatch(
  `${relationshipReport.summary} ${relationshipReport.description}`,
  /\b(?:Flow definition is defective|Flow failed|Flow executed)\b/i,
);

const rendered = renderJiraReport(relationshipReport);
assert.match(rendered.text, /Flow test evidence/);
assert.match(rendered.text, /path Cart to Payment/);
assert.match(rendered.text, /relationship:cart-payment/);
assert.match(rendered.text, /flow-schema:00000011/);
assert.doesNotMatch(rendered.text, /generic constraint|manually selected Flow step/i);

relationshipEntry.target.name = "Mutated target";
relationshipEntry.provenance[1].contributorName = "Mutated contributor";
relationshipEntry.matchedPath[1].stepName = "Mutated step";
assert.equal(relationshipReport.event.flowContext.effectiveTarget.name, "Payment");
assert.equal(relationshipReport.event.flowContext.provenance[1].contributorName, "Payment");
assert.equal(relationshipReport.event.flowContext.path[1].stepName, "Payment");

const initialReport = reportFor({
  ...baseEntry,
  matchedPath: [{
    stepId: "frame:payment",
    stepName: "Payment",
    eventId: "live-102",
    captureTime: event.captureTime,
  }],
});
assert.deepEqual(initialReport.event.flowContext.linkEvidence, {
  kind: "start",
  label: "Started at Payment",
  pageFrameId: "frame:payment",
});
assert.match(renderJiraReport(initialReport).text, /Started at Payment/);

console.log("data-layer Live Flow defect report tests passed");
