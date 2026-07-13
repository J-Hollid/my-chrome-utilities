import assert from "node:assert/strict";

import {
  applyExpectedResult,
  copyDefectReportForJira,
  createDefectReport,
  filterTimelineEvents,
  generatePathnameSkeleton,
  generateReportDetails,
  editReportDetails,
  renderJiraReport,
  supportingTimeline,
  toggleReportIssue,
} from "../dist/data-layer-defect-report.js";
import { defectReportContext } from "../dist/data-layer-defect-report-ui.js";

const capturedPayload = {
  commerce: { currency: "GBP", total: -1, debug: true },
};
const event = {
  id: "event-purchase",
  name: "purchase",
  source: "event.history",
  pageUrl: "https://shop.example.test/checkout",
  pathname: "/checkout",
  captureTime: "2026-07-13T00:00:04Z",
  payload: capturedPayload,
  schema: { name: "Checkout", version: 4 },
  issues: [
    { id: "currency", severity: "error", pointer: "/commerce/currency", constraint: "one of EUR or USD", actual: "GBP", rule: "allowed-currency", ruleVersion: 2 },
    { id: "order_id", severity: "error", pointer: "/commerce/order_id", constraint: "required string", actual: undefined, rule: "required-order", ruleVersion: 1 },
    { id: "coupon", severity: "warning", pointer: "/commerce/coupon", constraint: "known coupon", actual: "OLD", rule: "coupon", ruleVersion: 3 },
    { id: "passing", severity: "pass", pointer: "/commerce/total", constraint: "number", actual: -1, rule: "number", ruleVersion: 1 },
  ],
};

const report = createDefectReport(event);
assert.equal(report.event.id, "event-purchase");
assert.deepEqual(report.issues.map(({ id, selected }) => [id, selected]), [
  ["currency", true], ["order_id", true], ["coupon", false],
]);
assert.notEqual(report.actual.payload, capturedPayload);
assert.deepEqual(report.actual.payload, capturedPayload);
assert.deepEqual(report.actual.differences[0], {
  pointer: "/commerce/currency", marker: "−", treatment: "red", value: "GBP",
});
const warningSelected = toggleReportIssue(report, "coupon");
assert.equal(warningSelected.issues.find(({ id }) => id === "coupon").selected, true);
assert.equal(warningSelected.actual.differences.some(({ pointer }) => pointer === "/commerce/coupon"), true);
assert.equal(toggleReportIssue(warningSelected, "currency").actual.differences.some(({ pointer }) => pointer === "/commerce/currency"), false);

const corrected = applyExpectedResult(report, [
  { issueId: "currency", method: "choose an allowed value", response: "EUR" },
  { issueId: "order_id", method: "enter a valid response", response: "A-123" },
  { issueId: "coupon", method: "keep the rule generic" },
]);
assert.deepEqual(corrected.expected.payload, {
  commerce: { currency: "EUR", total: -1, debug: true, order_id: "A-123" },
});
assert.deepEqual(corrected.expected.corrections.map(({ operation, pointer, marker }) => [operation, pointer, marker]), [
  ["replace", "/commerce/currency", "+"],
  ["add", "/commerce/order_id", "+"],
  ["none", "/commerce/coupon", undefined],
]);
assert.equal(corrected.expected.explanations.at(-1), "coupon satisfies its validation rule");
assert.deepEqual(capturedPayload, { commerce: { currency: "GBP", total: -1, debug: true } });
assert.throws(
  () => applyExpectedResult(report, [{ issueId: "currency", method: "enter a valid response" }]),
  /response/i,
);

const removed = applyExpectedResult(createDefectReport({
  ...event,
  issues: [{ id: "debug", severity: "error", pointer: "/commerce/debug", constraint: "forbidden property", actual: true, rule: "forbidden", ruleVersion: 1 }],
}), [{ issueId: "debug", method: "apply the rule" }]);
assert.deepEqual(removed.expected.payload, { commerce: { currency: "GBP", total: -1 } });
assert.equal(removed.expected.explanations[0], "debug is absent");

const visits = [
  { id: "visit-1", pathname: "/products", eventIds: ["pageview", "promotion"] },
  { id: "visit-2", pathname: "/checkout", eventIds: ["checkout"] },
  { id: "visit-3", pathname: "/products", eventIds: ["recommendation"] },
  { id: "visit-4", pathname: "/checkout", eventIds: ["purchase"] },
];
assert.deepEqual(
  generatePathnameSkeleton(visits, "visit-1", "visit-4").map(({ visitId, pathname }) => [visitId, pathname]),
  [["visit-1", "/products"], ["visit-2", "/checkout"], ["visit-3", "/products"], ["visit-4", "/checkout"]],
);

const timeline = [
  { id: "pageview", captureTime: "01", name: "pageview", source: "dataLayer", pathname: "/products", validation: "Valid", payload: { page: "products" }, summary: "Products opened" },
  { id: "promotion", captureTime: "02", name: "promotion", source: "dataLayer", pathname: "/products", validation: "Not checked", payload: { id: 1 } },
  { id: "purchase", captureTime: "04", name: "purchase", source: "dataLayer", pathname: "/checkout", validation: "Invalid", payload: capturedPayload, validationDetails: ["currency invalid"] },
];
assert.deepEqual(filterTimelineEvents(timeline, { name: "purchase", pathname: "/checkout", validation: "Invalid" }).map(({ id }) => id), ["purchase"]);
assert.deepEqual(supportingTimeline(timeline, [
  { eventId: "purchase", includeValidation: true },
  { eventId: "pageview", includeSummary: true },
]), [
  { captureTime: "01", name: "pageview", source: "dataLayer", pathname: "/products", summary: "Products opened" },
  { captureTime: "04", name: "purchase", source: "dataLayer", pathname: "/checkout", validationDetails: ["currency invalid"] },
]);

const detailed = generateReportDetails({
  ...corrected,
  reproductionSteps: [{ visitId: "visit-1", pathname: "/products", text: "Open a product" }],
  timeline: supportingTimeline(timeline, [{ eventId: "purchase", includeValidation: true }]),
});
assert.match(detailed.summary, /purchase/);
assert.match(detailed.description, /currency/);
assert.equal(detailed.evidence.schema, "Checkout version 4");
assert.equal(detailed.evidence.capture.pageUrl, event.pageUrl);
const edited = editReportDetails(detailed, {
  summary: "Checkout purchase has invalid currency",
  description: "Reproduced from the live session.",
  expectedExplanation: "Use EUR.",
});
assert.equal(edited.summary, "Checkout purchase has invalid currency");
assert.equal(edited.description, "Reproduced from the live session.");
assert.equal(edited.expectedExplanation, "Use EUR.");
assert.deepEqual(edited.evidence, detailed.evidence);

const browserContext = defectReportContext([
  { id: "pageview", name: "pageview", sourceId: "dataLayer", captureTime: "01", pageUrl: "https://shop.test/products", payload: {}, validation: "Valid" },
  { id: "promotion", name: "promotion", sourceId: "dataLayer", captureTime: "02", pageUrl: "https://shop.test/products", payload: {}, validation: "Not checked" },
  { id: "checkout", name: "checkout", sourceId: "dataLayer", captureTime: "03", pageUrl: "https://shop.test/checkout", payload: {}, validation: "Valid" },
  { id: "purchase", name: "purchase", sourceId: "dataLayer", captureTime: "04", pageUrl: "https://shop.test/checkout", payload: {}, validation: "1 error", validationDetails: { issues: [{ message: "invalid" }], evaluations: [] } },
  { id: "return", name: "pageview", sourceId: "dataLayer", captureTime: "05", pageUrl: "https://shop.test/products", payload: {}, validation: "Valid" },
], "purchase");
assert.deepEqual(browserContext.visits.map(({ pathname, eventIds }) => [pathname, eventIds]), [
  ["/products", ["pageview", "promotion"]],
  ["/checkout", ["checkout", "purchase"]],
  ["/products", ["return"]],
]);
assert.equal(browserContext.defectVisitId, "visit-2");
assert.deepEqual(browserContext.timeline.map(({ id, pathname }) => [id, pathname]), [
  ["pageview", "/products"], ["promotion", "/products"], ["checkout", "/checkout"], ["purchase", "/checkout"], ["return", "/products"],
]);

const rendered = renderJiraReport(detailed);
for (const heading of ["Summary", "Description", "Steps to reproduce", "Actual result", "Expected result", "Differences", "Validation evidence", "Supporting timeline"]) {
  assert.match(rendered.text, new RegExp(heading));
  assert.match(rendered.html, new RegExp(heading));
}
assert.match(rendered.text, /− \/commerce\/currency/);
assert.match(rendered.text, /\+ \/commerce\/currency/);
assert.match(rendered.html, /background-color:#ffd7d7/);
assert.match(rendered.html, /background-color:#d9f7d9/);
assert.match(rendered.html, /background-color:#ffd7d7[^>]+data-json-pointer="\/commerce\/currency"/);
assert.match(rendered.html, /background-color:#d9f7d9[^>]+data-json-pointer="\/commerce\/currency"/);
assert.doesNotMatch(JSON.parse(rendered.actualJson).commerce.currency, /^[+−-]/);

const duplicateKeyReport = generateReportDetails({
  ...report,
  event: { ...report.event, payload: { shipping: { code: "BAD" }, billing: { code: "OK" } } },
  actual: {
    payload: { shipping: { code: "BAD" }, billing: { code: "OK" } },
    differences: [{ pointer: "/shipping/code", marker: "−", treatment: "red", value: "BAD" }],
  },
});
const duplicateKeyHtml = renderJiraReport(duplicateKeyReport).html;
assert.match(duplicateKeyHtml, /data-json-pointer="\/shipping\/code"[^>]*>[^<]*&quot;code&quot;: &quot;BAD&quot;/);
assert.doesNotMatch(duplicateKeyHtml, /data-json-pointer="\/billing\/code"/);

const richWrites = [];
assert.deepEqual(await copyDefectReportForJira(detailed, {
  writeRich: async (html, text) => richWrites.push({ html, text }),
  writeText: async () => { throw new Error("plain fallback should not run"); },
}), { status: "success", feedback: "Report copied for Jira Cloud with color highlighting." });
assert.equal(richWrites.length, 1);

const plainWrites = [];
assert.deepEqual(await copyDefectReportForJira(detailed, {
  writeText: async (text) => plainWrites.push(text),
}), { status: "warning", feedback: "Report copied as plain text; Jira Cloud color highlighting was not copied." });
assert.equal(plainWrites.length, 1);

assert.deepEqual(await copyDefectReportForJira(detailed, {
  writeRich: async () => { throw new Error("denied"); },
  writeText: async () => { throw new Error("denied"); },
}), { status: "failure", feedback: "Copy failed. The current report is unchanged." });
