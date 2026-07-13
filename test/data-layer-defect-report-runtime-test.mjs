import assert from "node:assert/strict";
import {
  applyExpectedResult,
  copyDefectReportForJira,
  createDefectReport,
  filterTimelineEvents,
  generatePathnameSkeleton,
  generateReportDetails,
  renderJiraReport,
  supportingTimeline,
  toggleReportIssue,
} from "../dist/data-layer-defect-report.js";

const original = { commerce: { currency: "GBP", total: -1, debug: true } };
const captured = {
  id: "purchase-1", name: "purchase", source: "dataLayer", pageUrl: "https://shop.test/checkout", pathname: "/checkout", captureTime: "04",
  payload: original, schema: { name: "Checkout", version: 4 },
  issues: [
    { id: "currency", severity: "error", pointer: "/commerce/currency", constraint: "one of EUR or USD", actual: "GBP", rule: "currency", ruleVersion: 2 },
    { id: "order_id", severity: "error", pointer: "/commerce/order_id", constraint: "required string", actual: undefined, rule: "order", ruleVersion: 1 },
    { id: "coupon", severity: "warning", pointer: "/commerce/coupon", constraint: "known coupon", actual: "OLD", rule: "coupon", ruleVersion: 1 },
    { id: "debug", severity: "error", pointer: "/commerce/debug", constraint: "forbidden property", actual: true, rule: "debug", ruleVersion: 1 },
    { id: "total", severity: "error", pointer: "/commerce/total", constraint: "number greater than or equal to 0", actual: -1, rule: "minimum", ruleVersion: 1 },
    { id: "passing", severity: "pass", pointer: "/event", constraint: "object", actual: original, rule: "object", ruleVersion: 1 },
  ],
};
let report = createDefectReport(captured);
const initial = Object.fromEntries(report.issues.map(({ id, selected }) => [id, selected]));
const toggled = toggleReportIssue(toggleReportIssue(report, "coupon"), "currency");

const cases = [
  ["currency", "choose an allowed value", "EUR", "currency is EUR", "replace"],
  ["currency", "enter a valid response", "USD", "currency is USD", "replace"],
  ["order_id", "enter a valid response", "A-123", "order_id is A-123", "add"],
  ["debug", "apply the rule", undefined, "debug is absent", "remove"],
  ["total", "keep the rule generic", undefined, "total satisfies its validation rule", "none"],
].map(([issueId, method, response, outcome, operation]) => {
  const result = applyExpectedResult(report, [{ issueId, method, ...(response !== undefined ? { response } : {}) }]);
  assert.equal(result.expected.explanations[0], outcome);
  assert.equal(result.expected.corrections[0].operation, operation);
  return { issueId, method, response: response ?? "none", outcome, operation };
});

report = applyExpectedResult(report, [
  { issueId: "currency", method: "choose an allowed value", response: "EUR" },
  { issueId: "debug", method: "apply the rule" },
]);
const steps = generatePathnameSkeleton([
  { id: "products-1", pathname: "/products", eventIds: ["pageview", "promotion"] },
  { id: "checkout-1", pathname: "/checkout", eventIds: ["checkout"] },
  { id: "products-2", pathname: "/products", eventIds: ["recommendation"] },
  { id: "checkout-2", pathname: "/checkout", eventIds: ["purchase"] },
], "products-1", "checkout-2");
steps[0].text = "Open the selected product";
const timelineEvents = [
  { id: "pageview", captureTime: "01", name: "pageview", source: "dataLayer", pathname: "/products", validation: "Valid", summary: "Products opened", payload: { page: "products" } },
  { id: "promotion", captureTime: "02", name: "promotion", source: "tag", pathname: "/products", validation: "Not checked" },
  { id: "checkout", captureTime: "03", name: "checkout", source: "dataLayer", pathname: "/checkout", validation: "Valid" },
  { id: "purchase", captureTime: "04", name: "purchase", source: "dataLayer", pathname: "/checkout", validation: "Invalid", payload: original, validationDetails: ["currency invalid"] },
];
const selectedTimeline = supportingTimeline(timelineEvents, [
  { eventId: "pageview", includeSummary: true },
  { eventId: "purchase", includeValidation: true },
]);
const detailed = generateReportDetails({ ...report, reproductionSteps: steps, timeline: selectedTimeline });
const preview = renderJiraReport(detailed);
const richWrites = [];
const richCopy = await copyDefectReportForJira(detailed, { writeRich: async (html, text) => richWrites.push({ html, text }), writeText: async () => assert.fail("unexpected fallback") });
const plainWrites = [];
const plainCopy = await copyDefectReportForJira(detailed, { writeText: async (text) => plainWrites.push(text) });
const failedCopy = await copyDefectReportForJira(detailed, { writeRich: async () => { throw new Error("denied"); }, writeText: async () => { throw new Error("denied"); } });

assert.deepEqual(original, { commerce: { currency: "GBP", total: -1, debug: true } });
assert.equal(richWrites.length, 1);
assert.equal(plainWrites.length, 1);

process.stdout.write(`${JSON.stringify({
  defectReport: {
    associatedEvent: report.event.id,
    initial,
    offeredIssues: report.issues.map(({ id }) => id),
    toggled: Object.fromEntries(toggled.issues.map(({ id, selected }) => [id, selected])),
    actual: report.actual,
    expected: report.expected,
    original,
    cases,
    steps,
    timelineInitialSelection: [],
    filteredTimelineCount: filterTimelineEvents(timelineEvents, { name: "purchase", source: "dataLayer", pathname: "/checkout", validation: "Invalid" }).length,
    selectedTimeline,
    details: detailed,
    preview,
    copies: { richCopy, plainCopy, failedCopy, richWrites: richWrites.length, plainWrites: plainWrites.length },
  },
})}\n`);
