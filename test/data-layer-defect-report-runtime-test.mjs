import assert from "node:assert/strict";
import {
  applyExpectedResult,
  copyDefectReportForJira,
  createDefectReport,
  expectedResultAssistance,
  expectedResponseLine,
  filterTimelineEvents,
  generatePathnameSkeleton,
  generateReportDetails,
  renderJiraReport,
  supportingTimeline,
  toggleReportIssue,
  validateAssistedResponse,
} from "../dist/data-layer-defect-report.js";
import { defectCapturedEvent } from "../dist/data-layer-defect-report-ui.js";
import { validateEvent } from "../dist/data-layer-schema-verification.js";

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
  ["currency", "choose an allowed value", "EUR", "Checkout schema", "currency is EUR", "replace"],
  ["order_id", "enter a valid response", "A-123", "Custom value or response", "order_id is A-123", "add"],
  ["debug", "apply the rule", "remove", "validation rule", "debug is absent", "remove"],
].map(([issueId, method, response, responseSource, outcome, operation]) => {
  const result = applyExpectedResult(report, [{ issueId, method, ...(method !== "apply the rule" ? { response } : {}), responseSource }]);
  assert.equal(result.expected.explanations[0], outcome);
  assert.equal(result.expected.corrections[0].operation, operation);
  assert.equal(result.expected.corrections[0].responseSource, responseSource);
  const constraint = captured.issues.find(({ id }) => id === issueId)?.constraint;
  return {
    issueId,
    constraint,
    method,
    response: response ?? "none",
    responseSource,
    outcome,
    operation,
    jsonOperation: operation === "none" ? "none" : `${operation} ${issueId}`,
  };
});

const assistance = expectedResultAssistance(report.issues.find(({ id }) => id === "currency"));
const generic = applyExpectedResult(report, [{ issueId: "currency", method: "keep the rule generic" }]);
const customValidation = validateAssistedResponse(report.issues.find(({ id }) => id === "currency"), "CAD");
const customOverride = applyExpectedResult(report, [{ issueId: "currency", method: "enter a valid response", response: "CAD", responseSource: "Custom value or response", operatorProvided: true }]);

const pageTypeOriginal = { page_type: "unknown" };
const pageTypeReport = createDefectReport({
  ...captured,
  payload: pageTypeOriginal,
  issues: [{
    id: "page_type",
    severity: "error",
    pointer: "/page_type",
    constraint: "one of homepage, product listing, product detail, or checkout",
    actual: "unknown",
    rule: "page-type",
    ruleVersion: 1,
  }],
});
const inlineCases = [
  ["Use generic constraint", { issueId: "page_type", method: "keep the rule generic", responseSource: "schema constraint" }],
  ["schema value product detail", { issueId: "page_type", method: "choose an allowed value", response: "product detail", responseSource: "schema-provided value" }],
  ["custom value category landing", { issueId: "page_type", method: "enter a valid response", response: "category landing", responseSource: "operator custom override", operatorProvided: true }],
].map(([selection, choice]) => {
  const selected = applyExpectedResult(pageTypeReport, [choice]);
  const preview = renderJiraReport(generateReportDetails(selected));
  return {
    selection,
    responseSource: selected.expected.corrections[0].responseSource,
    inlineResponse: expectedResponseLine(selected.expected.corrections[0]),
    correctionCount: selected.expected.corrections.length,
    expectedPayload: selected.expected.payload,
    expectedJson: preview.expectedJson,
    preview,
  };
});
const commentCases = [true, false].map((selected) => {
  const result = applyExpectedResult(pageTypeReport, [{
    issueId: "page_type",
    method: "choose an allowed value",
    response: "homepage",
    responseSource: "schema-provided value",
    includeAllowedValuesComment: selected,
  }]);
  const preview = renderJiraReport(generateReportDetails(result));
  return {
    checkboxState: selected ? "selected" : "cleared",
    inlineResponse: expectedResponseLine(result.expected.corrections[0]),
    response: result.expected.corrections[0].response,
    expectedJson: preview.expectedJson,
    preview,
  };
});
const inlineRichWrites = [];
for (const item of [inlineCases[0], commentCases[0]]) {
  const copy = await copyDefectReportForJira(
    generateReportDetails(applyExpectedResult(pageTypeReport, [{
      issueId: "page_type",
      method: item === inlineCases[0] ? "keep the rule generic" : "choose an allowed value",
      ...(item === inlineCases[0]
        ? { responseSource: "schema constraint" }
        : { response: "homepage", responseSource: "schema-provided value", includeAllowedValuesComment: true }),
    }])),
    { writeRich: async (html, text) => { inlineRichWrites.push({ html, text }); } },
  );
  assert.equal(copy.status, "success");
}
const pageTypeAssistance = expectedResultAssistance(pageTypeReport.issues[0]);
const pageTypeCustomValidation = validateAssistedResponse(pageTypeReport.issues[0], "category landing");

const productOriginal = { page_type: "product test" };
const productSchema = {
  id: "schema:product:1",
  name: "Product",
  version: 1,
  document: { type: "object" },
  assignments: [{ sourceId: "dataLayer", eventName: "product", target: "payload" }],
  attachedRules: [{
    id: "rule:page-type",
    name: "Known page types",
    version: 1,
    operator: "allowed-values",
    parameters: "page_type:product,content",
  }],
};
const productValidation = validateEvent({
  sourceId: "dataLayer",
  eventName: "product",
  payload: productOriginal,
  rawInput: [],
}, [productSchema]);
const productCaptured = defectCapturedEvent({
  id: "product-1",
  name: "product",
  sourceId: "dataLayer",
  captureTime: "05",
  pageUrl: "https://shop.test/product",
  payload: productOriginal,
  validation: productValidation.state,
  validationDetails: {
    issues: productValidation.issues,
    evaluations: productValidation.evaluations ?? [],
    schema: productValidation.schema,
  },
});
const productReport = createDefectReport(productCaptured);
const productAssistance = expectedResultAssistance(productReport.issues[0]);
const productGeneric = applyExpectedResult(productReport, [{
  issueId: "page_type",
  method: "keep the rule generic",
  responseSource: "schema constraint",
}]);
const productCommented = applyExpectedResult(productReport, [{
  issueId: "page_type",
  method: "choose an allowed value",
  response: "product",
  responseSource: "schema-provided value",
  includeAllowedValuesComment: true,
}]);
const productGenericPreview = renderJiraReport(generateReportDetails(productGeneric));
const productCommentedPreview = renderJiraReport(generateReportDetails(productCommented));
assert.deepEqual(productOriginal, { page_type: "product test" });

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

const channel = (hex) => { const value = Number.parseInt(hex, 16) / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; };
const luminance = (hex) => 0.2126 * channel(hex.slice(1, 3)) + 0.7152 * channel(hex.slice(3, 5)) + 0.0722 * channel(hex.slice(5, 7));
const contrast = (left, right) => { const values = [luminance(left), luminance(right)].sort((a, b) => b - a); return (values[0] + 0.05) / (values[1] + 0.05); };

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
    assistance,
    generic: { explanation: generic.expected.explanations[0], payload: generic.expected.payload, corrections: generic.expected.corrections },
    custom: { validation: customValidation, explanation: customOverride.expected.explanations[0], correction: customOverride.expected.corrections[0] },
    pageType: {
      original: pageTypeOriginal,
      assistance: pageTypeAssistance,
      customValidation: pageTypeCustomValidation,
      inlineCases,
      commentCases,
      inlineRichWrites,
    },
    productAllowedValues: {
      displayedExpected: productValidation.issues[0].expected,
      ruleValues: productCaptured.issues[0].allowedValues,
      schemaValues: productAssistance.schemaValues,
      genericInline: expectedResponseLine(productGeneric.expected.corrections[0]),
      commentedInline: expectedResponseLine(productCommented.expected.corrections[0]),
      expectedJson: productCommentedPreview.expectedJson,
      genericPreview: productGenericPreview,
      original: productOriginal,
    },
    steps,
    timelineInitialSelection: [],
    filteredTimelineCount: filterTimelineEvents(timelineEvents, { name: "purchase", source: "dataLayer", pathname: "/checkout", validation: "Invalid" }).length,
    selectedTimeline,
    details: detailed,
    preview,
    copies: { richCopy, plainCopy, failedCopy, richWrites: richWrites.length, plainWrites: plainWrites.length },
    contrast: Math.min(contrast("#1f1f1f", "#ffd7d7"), contrast("#1f1f1f", "#d9f7d9")),
  },
})}\n`);
