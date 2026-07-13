import assert from "node:assert/strict";

import {
  applyExpectedResult,
  createDefectReport,
  filterTimelineEvents,
  generatePathnameSkeleton,
  supportingTimeline,
  toggleReportIssue,
} from "../dist/data-layer-defect-report.js";

let state = 0x5eed1234;
function random() {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 0x100000000;
}

function integer(maximum) {
  return Math.floor(random() * maximum);
}

for (let iteration = 0; iteration < 200; iteration += 1) {
  const issueCount = 1 + integer(12);
  const payload = { nested: {} };
  const issues = Array.from({ length: issueCount }, (_, index) => {
    const key = `field~${index}/value`;
    payload.nested[key] = index;
    return {
      id: `issue-${index}`,
      severity: index % 3 === 0 ? "warning" : "error",
      pointer: `/nested/field~0${index}~1value`,
      constraint: "integer",
      actual: index,
      rule: `rule-${index}`,
      ruleVersion: 1,
    };
  });
  const event = {
    id: `event-${iteration}`,
    name: "purchase",
    source: "dataLayer",
    pageUrl: "https://example.test/checkout",
    pathname: "/checkout",
    captureTime: String(iteration),
    payload,
    schema: { name: "Checkout", version: 1 },
    issues,
  };
  const report = createDefectReport(event);
  const issueId = `issue-${integer(issueCount)}`;

  assert.deepEqual(toggleReportIssue(toggleReportIssue(report, issueId), issueId), report);
  assert.deepEqual(event.payload, payload);

  const replacement = `replacement-${iteration}`;
  const corrected = applyExpectedResult(report, [{
    issueId,
    method: "enter a valid response",
    response: replacement,
  }]);
  const issueIndex = Number(issueId.slice("issue-".length));
  assert.equal(corrected.expected.payload.nested[`field~${issueIndex}/value`], replacement);
  assert.deepEqual(event.payload, payload);

  const visitCount = 2 + integer(15);
  const visits = Array.from({ length: visitCount }, (_, index) => ({
    id: `visit-${index}`,
    pathname: `/path-${index % 4}`,
    eventIds: [`event-${index}`],
  }));
  const start = integer(visitCount - 1);
  const end = start + integer(visitCount - start);
  assert.deepEqual(
    generatePathnameSkeleton(visits, visits[start].id, visits[end].id).map(({ visitId }) => visitId),
    visits.slice(start, end + 1).map(({ id }) => id),
  );

  const timeline = Array.from({ length: visitCount }, (_, index) => ({
    id: `timeline-${index}`,
    captureTime: String(visitCount - index).padStart(3, "0"),
    name: index % 2 === 0 ? "purchase" : "pageview",
    source: index % 3 === 0 ? "dataLayer" : "tag",
    pathname: visits[index].pathname,
    validation: index % 2 === 0 ? "Invalid" : "Valid",
    payload: { index },
    summary: `summary-${index}`,
  }));
  const filtered = filterTimelineEvents(timeline, { name: "PUR", validation: "Invalid" });
  assert.deepEqual(filtered, timeline.filter(({ name, validation }) =>
    name.toLowerCase().includes("pur") && validation === "Invalid"));

  const chosen = timeline.filter((_, index) => index % 3 === 0);
  const supporting = supportingTimeline(timeline, chosen.map(({ id }) => ({ eventId: id, includeSummary: true })));
  assert.deepEqual(supporting.map(({ captureTime }) => captureTime),
    chosen.map(({ captureTime }) => captureTime).sort());
  assert.equal(supporting.every((entry) => "summary" in entry && !("payload" in entry)), true);
}

process.stdout.write("defect report properties: 200 generated cases passed\n");
