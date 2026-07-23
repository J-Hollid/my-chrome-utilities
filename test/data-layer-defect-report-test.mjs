import assert from "node:assert/strict";

import {
  applyExpectedResult,
  copyDefectReportForJira,
  createDefectReport,
  expectedResultAssistance,
  filterTimelineEvents,
  generatePathnameSkeleton,
  generateReportDetails,
  editReportDetails,
  renderJiraReport,
  supportingTimeline,
  timelineEventChoices,
  toggleReportIssue,
  updateReportComponents,
  removeTimelineSelection,
  saveTimelineSelection,
  validateAssistedResponse,
} from "../dist/data-layer-defect-report.js";
import { defectCapturedEvent, defectReportContext } from "../dist/data-layer-defect-report-ui.js";

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
assert.deepEqual(report.components, { differences:true, validationRules:false, captureMetadata:false });
assert.equal(report.event.id, "event-purchase");
assert.deepEqual(report.issues.map(({ id, selected }) => [id, selected]), [
  ["currency", true], ["order_id", true], ["coupon", false],
]);
assert.notEqual(report.actual.payload, capturedPayload);
assert.deepEqual(report.actual.payload, capturedPayload);
assert.deepEqual(report.actual.differences[0], {
  issueId: "currency",
  pointer: "/commerce/currency", marker: "−", treatment: "red", value: "GBP",
  actualPresence: "present",
});
const warningSelected = toggleReportIssue(report, "coupon");
assert.equal(warningSelected.issues.find(({ id }) => id === "coupon").selected, true);
assert.equal(warningSelected.actual.differences.some(({ pointer }) => pointer === "/commerce/coupon"), true);
assert.equal(toggleReportIssue(warningSelected, "currency").actual.differences.some(({ pointer }) => pointer === "/commerce/currency"), false);

assert.deepEqual(expectedResultAssistance(report.issues[0]), {
  genericConstraint: "/commerce/currency must be one of EUR or USD",
  schemaValues: ["EUR", "USD"],
  customAvailable: true,
});
assert.equal(expectedResultAssistance(report.issues[0]).schemaValues.includes("GBP"), false);
assert.deepEqual(validateAssistedResponse(report.issues[0], "EUR"), { valid: true });
assert.deepEqual(validateAssistedResponse(report.issues[0], "CAD"), {
  valid: false,
  warning: "CAD does not satisfy the current schema constraint.",
});

const corrected = applyExpectedResult(report, [
  { issueId: "currency", method: "choose an allowed value", response: "EUR", responseSource: "Checkout schema" },
  { issueId: "order_id", method: "enter a valid response", response: "A-123", responseSource: "Custom value or response" },
  { issueId: "coupon", method: "keep the rule generic" },
]);
assert.deepEqual(corrected.expected.payload, {
  commerce: { currency: "EUR", total: -1, debug: true, order_id: "A-123" },
});
assert.deepEqual(corrected.expected.corrections.map(({ operation, pointer, marker }) => [operation, pointer, marker]), [
  ["replace", "/commerce/currency", "+"],
  ["add", "/commerce/order_id", "+"],
]);
assert.equal(corrected.expected.explanations.at(-1), "order_id is A-123");
assert.equal(corrected.expected.corrections[0].responseSource, "Checkout schema");
assert.equal(corrected.expected.corrections[1].responseSource, "Custom value or response");
assert.deepEqual(capturedPayload, { commerce: { currency: "GBP", total: -1, debug: true } });
assert.throws(
  () => applyExpectedResult(report, [{ issueId: "currency", method: "enter a valid response" }]),
  /response/i,
);
assert.throws(
  () => applyExpectedResult(report, [{ issueId: "currency", method: "enter a valid response", response:undefined }]),
  /response/i,
);

const genericCurrency = applyExpectedResult(report, [{ issueId: "currency", method: "keep the rule generic" }]);
assert.equal(genericCurrency.expected.explanations[0], "/commerce/currency must be one of EUR or USD");
assert.equal(genericCurrency.expected.corrections[0].operation, "none");
assert.deepEqual(genericCurrency.expected.payload, capturedPayload);

const customOverride = applyExpectedResult(report, [{
  issueId: "currency",
  method: "enter a valid response",
  response: "CAD",
  responseSource: "Custom value or response",
  operatorProvided: true,
}]);
assert.equal(customOverride.expected.corrections[0].operatorProvided, true);
assert.match(customOverride.expected.explanations[0], /operator-provided/);

const pageTypeEvent = {
  ...event,
  payload: { page_type: "unknown" },
  issues: [{
    id: "page_type",
    severity: "error",
    pointer: "/page_type",
    constraint: "one of homepage, product listing, product detail, or checkout",
    actual: "unknown",
    rule: "allowed-page-type",
    ruleVersion: 1,
  }],
};
const pageTypeReport = createDefectReport(pageTypeEvent);
const genericPageType = applyExpectedResult(pageTypeReport, [{
  issueId: "page_type",
  method: "keep the rule generic",
  responseSource: "schema constraint",
}]);
const genericPageTypePreview = renderJiraReport(generateReportDetails(genericPageType));
assert.match(genericPageTypePreview.text, /page_type: homepage OR product listing OR product detail OR checkout/);
assert.doesNotMatch(genericPageTypePreview.text, /page_type response source: schema constraint/);
assert.match(genericPageTypePreview.html, /background-color:#d9f7d9[^>]+data-json-pointer="\/page_type"/);
assert.equal(JSON.parse(genericPageTypePreview.expectedJson).page_type, "unknown");
assert.deepEqual(pageTypeEvent.payload, { page_type: "unknown" });

const rawAllowedValuesEvent = defectCapturedEvent({
  id: "event-product",
  name: "product",
  sourceId: "history",
  captureTime: "2026-07-13T00:00:05Z",
  pageUrl: "https://shop.example.test/product",
  payload: { page_type: "product test" },
  validationDetails: {
    schema: { id: "schema:product:1", name: "Product", version: 1 },
    evaluations: [],
    issues: [{
      instancePath: "/page_type",
      message: "Value is not allowed",
      expected: "product,content",
      actual: "product test",
      schemaName: "Product",
      schemaVersion: 1,
      schemaLocation: "#/attachedRules/rule:page-type",
      rule: "Known page types v1",
      severity: "error",
      allowedValues: ["product", "content"],
    }],
  },
});
assert.deepEqual(rawAllowedValuesEvent.issues[0].allowedValues, ["product", "content"]);
const rawAllowedValuesReport = createDefectReport(rawAllowedValuesEvent);
assert.deepEqual(expectedResultAssistance(rawAllowedValuesReport.issues[0]).schemaValues, ["product", "content"]);
const genericRawAllowedValues = applyExpectedResult(rawAllowedValuesReport, [{
  issueId: "page_type",
  method: "keep the rule generic",
  responseSource: "schema constraint",
}]);
assert.match(renderJiraReport(generateReportDetails(genericRawAllowedValues)).text, /page_type: product OR content/);
const commentedRawAllowedValues = applyExpectedResult(rawAllowedValuesReport, [{
  issueId: "page_type",
  method: "choose an allowed value",
  response: "product",
  responseSource: "schema-provided value",
  includeAllowedValuesComment: true,
}]);
const commentedRawAllowedValuesPreview = renderJiraReport(generateReportDetails(commentedRawAllowedValues));
assert.match(commentedRawAllowedValuesPreview.text, /page_type: "product", \/\/ must be of type product or content/);
assert.deepEqual(JSON.parse(commentedRawAllowedValuesPreview.expectedJson), { page_type: "product" });

const commentedPageType = applyExpectedResult(pageTypeReport, [{
  issueId: "page_type",
  method: "choose an allowed value",
  response: "homepage",
  responseSource: "schema-provided value",
  includeAllowedValuesComment: true,
}]);
const commentedPageTypePreview = renderJiraReport(generateReportDetails(commentedPageType));
const commentedPageTypeLine = 'page_type: "homepage", // must be of type homepage, product listing, product detail, or checkout';
assert.match(commentedPageTypePreview.text, new RegExp(commentedPageTypeLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(commentedPageTypePreview.html, /page_type: &quot;homepage&quot;, \/\/ must be of type homepage, product listing, product detail, or checkout/);
assert.equal(JSON.parse(commentedPageTypePreview.expectedJson).page_type, "homepage");
assert.doesNotMatch(commentedPageTypePreview.expectedJson, /must be of type/);
assert.equal(commentedPageType.expected.corrections[0].responseSource, "schema-provided value");
assert.deepEqual(pageTypeEvent.payload, { page_type: "unknown" });

const clearedCommentPageType = applyExpectedResult(pageTypeReport, [{
  issueId: "page_type",
  method: "choose an allowed value",
  response: "homepage",
  responseSource: "schema-provided value",
  includeAllowedValuesComment: false,
}]);
const clearedCommentPreview = renderJiraReport(generateReportDetails(clearedCommentPageType));
assert.match(clearedCommentPreview.text, /page_type: "homepage"/);
assert.doesNotMatch(clearedCommentPreview.text, /must be of type/);
assert.equal(JSON.parse(clearedCommentPreview.expectedJson).page_type, "homepage");

const customPageType = applyExpectedResult(pageTypeReport, [{
  issueId: "page_type",
  method: "enter a valid response",
  response: "category landing",
  responseSource: "operator custom override",
  operatorProvided: true,
}]);
const customPageTypePreview = renderJiraReport(generateReportDetails(customPageType));
assert.match(customPageTypePreview.text, /page_type: category landing/);
assert.doesNotMatch(customPageTypePreview.text, /page_type response source: operator custom override/);
assert.deepEqual(pageTypeEvent.payload, { page_type: "unknown" });

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
const choicePage = timelineEventChoices(timeline, { source: "data" }, ["purchase"], 2);
assert.deepEqual(choicePage.choices.map(({ event, alreadyAdded }) => [event.id, alreadyAdded]), [
  ["purchase", true],
  ["promotion", false],
]);
assert.equal(choicePage.hasOlder, true);
assert.deepEqual(
  saveTimelineSelection(
    [{ eventId: "purchase", includeValidation: true }],
    { eventId: "purchase", includePayload: true },
  ),
  [{ eventId: "purchase", includePayload: true }],
);
assert.deepEqual(
  saveTimelineSelection(
    [{ eventId: "purchase", includeValidation: true }],
    { eventId: "pageview", includeSummary: true },
  ),
  [{ eventId: "purchase", includeValidation: true }, { eventId: "pageview", includeSummary: true }],
);
assert.deepEqual(removeTimelineSelection([
  { eventId: "purchase", includeValidation: true },
  { eventId: "pageview", includeSummary: true },
], "purchase"), [{ eventId: "pageview", includeSummary: true }]);

const detailed = generateReportDetails({
  ...corrected,
  reproductionSteps: [{ kind: "pathname", visitId: "visit-1", pathname: "/products", text: "Open a product" }],
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
for (const heading of ["Summary", "Description", "Steps to reproduce", "Actual result", "Expected result", "Differences", "Supporting timeline"]) {
  assert.match(rendered.text, new RegExp(heading));
  assert.match(rendered.html, new RegExp(heading));
}
assert.doesNotMatch(rendered.text, /Validation evidence|Validation rules covered|Capture metadata/);
const structuredBeforeComponents = JSON.stringify({ actual:detailed.actual, expected:detailed.expected, evidence:detailed.evidence, event:detailed.event });
const rulesOnly = renderJiraReport(generateReportDetails(updateReportComponents(detailed, { validationRules:true })));
assert.match(rulesOnly.text, /Validation evidence[\s\S]*Validation rules covered/);
assert.doesNotMatch(rulesOnly.text, /Capture metadata/);
assert.equal((rulesOnly.text.match(/allowed-currency/g) ?? []).length, 1);
const captureOnly = renderJiraReport(generateReportDetails(updateReportComponents(detailed, { captureMetadata:true, validationRules:false })));
assert.match(captureOnly.text, /Validation evidence[\s\S]*Capture metadata/);
assert.doesNotMatch(captureOnly.text, /Validation rules covered/);
const noDifferences = renderJiraReport(generateReportDetails(updateReportComponents(detailed, { differences:false })));
assert.doesNotMatch(noDifferences.text, /Differences/);
assert.match(noDifferences.html, /background-color:#ffd7d7/);
assert.match(noDifferences.html, /background-color:#d9f7d9/);
assert.equal(JSON.stringify({ actual:detailed.actual, expected:detailed.expected, evidence:detailed.evidence, event:detailed.event }), structuredBeforeComponents);
const { components: _components, ...legacyDetailed } = detailed;
const legacyRendered = renderJiraReport(legacyDetailed);
assert.match(legacyRendered.text, /Differences[\s\S]*Validation rules covered[\s\S]*Capture metadata/);
assert.match(rendered.text, /− \/commerce\/currency/);
assert.match(rendered.text, /\+ \/commerce\/currency/);
assert.doesNotMatch(rendered.text, /currency response source: Checkout schema/);
assert.doesNotMatch(rendered.text, /order_id response source: Custom value or response/);
assert.match(rendered.html, /background-color:#ffd7d7/);
assert.match(rendered.html, /background-color:#d9f7d9/);
assert.match(rendered.html, /background-color:#ffd7d7;color:#1f1f1f/);
assert.match(rendered.html, /background-color:#d9f7d9;color:#1f1f1f/);
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
