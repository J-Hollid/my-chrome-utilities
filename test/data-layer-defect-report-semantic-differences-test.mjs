import assert from "node:assert/strict";

import {
  actualDifferenceDescription,
  applyExpectedResult,
  createDefectReport,
  expectedDifferenceDescription,
  generateReportDetails,
  renderJiraReport,
  toggleReportIssue,
} from "../dist/data-layer-defect-report.js";

const event = {
  id:"semantic-differences",
  name:"error",
  source:"dataLayer",
  pageUrl:"https://shop.example.test/error",
  pathname:"/error",
  captureTime:"2026-07-15T07:00:00Z",
  payload:{ action:"checkout", code:500, page_type:"unknown", transaction_id:42, reference:"wrong" },
  schema:{ name:"Error event", version:3 },
  issues:[
    { id:"action-undeclared", severity:"error", pointer:"/action", violation:"Undeclared property", constraint:"forbidden property", actual:"checkout", rule:"declared properties", ruleVersion:3 },
    { id:"code-undeclared", severity:"error", pointer:"/code", violation:"Undeclared property", constraint:"forbidden property", actual:500, rule:"declared properties", ruleVersion:3 },
    { id:"error-action-required", severity:"error", pointer:"/error_action", violation:"Required value", constraint:"required string", actual:undefined, rule:"required properties", ruleVersion:3 },
    { id:"error-code-required", severity:"error", pointer:"/error_code", violation:"Required value", constraint:"required number", actual:undefined, rule:"required properties", ruleVersion:3 },
    { id:"page-type-value", severity:"error", pointer:"/page_type", violation:"Value is not allowed", constraint:"one of error or checkout", actual:"unknown", rule:"allowed values", ruleVersion:1 },
    { id:"transaction-type", severity:"error", pointer:"/transaction_id", violation:"Type mismatch", constraint:"string", actual:42, rule:"type", ruleVersion:1 },
    { id:"reference-exact", severity:"error", pointer:"/reference", violation:"Value is not exact", constraint:"must equal exact", actual:"wrong", rule:"exact", ruleVersion:1 },
    { id:"partner-contract", severity:"error", pointer:"/reference", violation:"Value violates partner contract", constraint:"partner-specific", actual:"wrong", rule:"partner", ruleVersion:1 },
  ],
};

assert.deepEqual([
  ["Undeclared property", "present"],
  ["Required value", "missing"],
  ["Value is not allowed", "present"],
  ["Type mismatch", "present"],
  ["Value is not exact", "present"],
  ["Value violates partner contract", "present"],
  [undefined, "present"],
].map(([violation, actualPresence]) => actualDifferenceDescription({ violation, actualPresence })), [
  "undeclared property is present in the actual payload",
  "required property is missing from the actual payload",
  "actual value is not allowed",
  "actual value has the wrong type",
  "actual value does not equal the required value",
  "validation failed: Value violates partner contract",
  "validation failed",
]);

assert.deepEqual(["remove", "add", "replace", "none"].map((operation) =>
  expectedDifferenceDescription({ operation })), [
  "was removed from the expected payload",
  "was added to the expected payload",
  "was replaced in the expected payload",
  undefined,
]);

const report = createDefectReport(event);
assert.deepEqual(report.actual.differences.slice(0, 4).map(({ issueId, pointer, violation, actualPresence }) =>
  ({ issueId, pointer, violation, actualPresence })), [
  { issueId:"action-undeclared", pointer:"/action", violation:"Undeclared property", actualPresence:"present" },
  { issueId:"code-undeclared", pointer:"/code", violation:"Undeclared property", actualPresence:"present" },
  { issueId:"error-action-required", pointer:"/error_action", violation:"Required value", actualPresence:"missing" },
  { issueId:"error-code-required", pointer:"/error_code", violation:"Required value", actualPresence:"missing" },
]);

const choices = [
  { issueId:"error-action-required", method:"enter a valid response", response:"checkout" },
  { issueId:"error-code-required", method:"enter a valid response", response:500 },
  { issueId:"page-type-value", method:"choose an allowed value", response:"error" },
];
const corrected = applyExpectedResult(report, choices);
assert.deepEqual(corrected.expected.corrections.map(({ issueId, pointer, operation }) =>
  ({ issueId, pointer, operation })), [
  { issueId:"action-undeclared", pointer:"/action", operation:"remove" },
  { issueId:"code-undeclared", pointer:"/code", operation:"remove" },
  { issueId:"error-action-required", pointer:"/error_action", operation:"add" },
  { issueId:"error-code-required", pointer:"/error_code", operation:"add" },
  { issueId:"page-type-value", pointer:"/page_type", operation:"replace" },
]);

const rendered = renderJiraReport(generateReportDetails(corrected));
for (const expected of [
  "Actual · action-undeclared · − /action · undeclared property is present in the actual payload",
  "Actual · error-action-required · − /error_action · required property is missing from the actual payload",
  "Actual · page-type-value · − /page_type · actual value is not allowed",
  "Actual · transaction-type · − /transaction_id · actual value has the wrong type",
  "Actual · reference-exact · − /reference · actual value does not equal the required value",
  "Actual · partner-contract · − /reference · validation failed: Value violates partner contract",
  "Expected · action-undeclared · remove · + /action · was removed from the expected payload",
  "Expected · error-action-required · add · + /error_action · was added to the expected payload",
  "Expected · page-type-value · replace · + /page_type · was replaced in the expected payload",
]) {
  assert.match(rendered.text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(rendered.html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.doesNotMatch(rendered.text, /invalid actual value|corrected expected value/);

const pageTypeDeselected = toggleReportIssue(corrected, "page-type-value");
const refreshed = applyExpectedResult(pageTypeDeselected, choices);
assert.equal(refreshed.actual.differences.some(({ issueId }) => issueId === "page-type-value"), false);
assert.equal(refreshed.expected.corrections.some(({ issueId }) => issueId === "page-type-value"), false);

for (const pointer of ["/commerce/currency", "/products/0/name", "/a~1b", "/tilde~0name"]) {
  const legacy = generateReportDetails({
    ...report,
    actual:{ payload:report.actual.payload, differences:[{ issueId:`legacy-${pointer}`, pointer, marker:"−", treatment:"red", value:"legacy", actualPresence:"present" }] },
    expected:{ payload:report.expected.payload, corrections:[{ issueId:`legacy-${pointer}`, pointer, operation:"replace", marker:"+" }], explanations:[] },
  });
  const legacyRendered = renderJiraReport(legacy);
  const legacyDifferences = legacyRendered.text.match(/Differences\n([\s\S]*?)\n\nValidation evidence/)?.[1] ?? "";
  assert.match(legacyRendered.text, new RegExp(pointer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(legacyDifferences, /validation failed/);
  assert.doesNotMatch(legacyDifferences, /missing|undeclared|invalid actual value/);
}

assert.deepEqual(event.payload, { action:"checkout", code:500, page_type:"unknown", transaction_id:42, reference:"wrong" });
console.log("data-layer defect report semantic difference tests passed");
