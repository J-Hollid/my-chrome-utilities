import assert from "node:assert/strict";

import {
  applyExpectedResult,
  copyDefectReportForJira,
  createDefectReport,
  editReportDetails,
  generateReportDetails,
  renderJiraReport,
} from "../dist/data-layer-defect-report.js";
import { generateMissingEventRepresentations } from "../dist/data-layer-missing-event-defect-report.js";

const event = {
  id:"provenance-presentation",
  name:"error",
  source:"dataLayer",
  pageUrl:"https://shop.example.test/error",
  pathname:"/error",
  captureTime:"2026-07-15T07:16:00Z",
  payload:{ action:"checkout", page_type:"unknown" },
  schema:{ name:"Assigned error schema", version:7 },
  issues:[
    { id:"action", severity:"error", pointer:"/action", violation:"Undeclared property", constraint:"forbidden property", actual:"checkout", rule:"Declared properties", ruleVersion:7 },
    { id:"error_action", severity:"error", pointer:"/error_action", violation:"Required value", constraint:"required exact value error", actual:undefined, rule:"Exact value for error_action", ruleVersion:1 },
    { id:"error_message", severity:"error", pointer:"/error_message", violation:"Required value", constraint:"required string", actual:undefined, rule:"Required error message", ruleVersion:2 },
    { id:"page_type", severity:"error", pointer:"/page_type", violation:"Value is not allowed", constraint:"one of error or checkout", actual:"unknown", rule:"Allowed page types", ruleVersion:3 },
  ],
};

const responseProvenance = {
  schema:{ id:"error-schema", name:"Assigned error schema", version:7 },
  rules:[{ id:"exact-error-action", name:"Exact value for error_action", version:1, propertyPath:"/error_action" }],
};
const corrected = applyExpectedResult(createDefectReport(event), [
  { issueId:"error_action", method:"enter a valid response", response:"error", responseSource:"assigned schema", responseProvenance },
  { issueId:"error_message", method:"enter a valid response", response:"Checkout failed", responseSource:"operator custom override", operatorProvided:true },
  { issueId:"page_type", method:"choose an allowed value", response:"error", responseSource:"schema constraint" },
]);
const operatorExplanation = "error_action response source: confirm with the implementation team";
const report = editReportDetails(generateReportDetails(corrected), { expectedExplanation:operatorExplanation });
const correctionSnapshot = structuredClone(report.expected.corrections);
const expectedPayloadSnapshot = structuredClone(report.expected.payload);
const forbiddenGeneratedLines = [
  "action response source: schema declared-property policy",
  "error_action response source: assigned schema",
  "error_message response source: operator custom override",
  "page_type response source: schema constraint",
  "error_action value-rule provenance: Exact value for error_action v1",
];

function assertSuppressed(representation) {
  assert.match(representation, new RegExp(operatorExplanation));
  for (const generatedLine of forbiddenGeneratedLines) assert.equal(representation.includes(generatedLine), false, generatedLine);
  assert.match(representation, /error_action(?:(?:&quot;)?): error/);
  assert.match(representation, /Expected · action · remove/);
  assert.match(representation, /Expected · error_action · add/);
}

const rendered = renderJiraReport(report);
assertSuppressed(rendered.text);
assertSuppressed(rendered.html);

const richWrites = [];
await copyDefectReportForJira(report, { writeRich:async (html, text) => richWrites.push({ html, text }) });
assertSuppressed(richWrites[0].html);
assertSuppressed(richWrites[0].text);
const plainWrites = [];
await copyDefectReportForJira(report, { writeText:async (text) => plainWrites.push(text) });
assertSuppressed(plainWrites[0]);

assert.deepEqual(report.expected.corrections, correctionSnapshot);
assert.deepEqual(report.expected.payload, expectedPayloadSnapshot);
assert.equal(report.expected.corrections[1].responseProvenance.schema.version, 7);

const legacyReport = structuredClone(report);
assertSuppressed(renderJiraReport(legacyReport).text);
assert.deepEqual(legacyReport, report);

const missingEventReport = {
  type:"Missing event",
  actual:"No matching error event was captured.",
  absenceEvidence:"No matching error event was captured.",
  expected:"error is fired",
  expectedPayload:{ error_action:"error", error_message:"Checkout failed" },
  expectedResponseSources:{ "/error_action":"schema-provided value", "/error_message":"operator custom response" },
  expectedResponseProvenance:{ "/error_action":responseProvenance.rules[0] },
  summary:"Missing event: error",
  description:"error was expected but not captured.",
  expectedExplanation:"error is fired",
  expectedResultAdditionalText:operatorExplanation,
  schema:{ id:"error-schema", name:"Assigned error schema", version:7, rules:[], documentation:[] },
  expectation:{ sourceId:"dataLayer", eventName:"error", target:"payload", pageUrl:event.pageUrl, explanation:"" },
  scope:{ id:"visit-1", pageUrl:event.pageUrl, pathname:"/error", startedAt:event.captureTime, endedAt:event.captureTime },
  validationIssues:[],
  matchingEventEvidence:[],
  reproductionSteps:["Visit /error", "Expect at least one matching error event"],
  reproductionStartVisitId:"visit-1",
  reproductionEndpointVisitId:"visit-1",
  timeline:[],
};
const missingRepresentations = generateMissingEventRepresentations(missingEventReport);
for (const representation of [missingRepresentations.previewText, missingRepresentations.previewHtml, missingRepresentations.jiraText]) {
  assert.match(representation, new RegExp(operatorExplanation));
  assert.doesNotMatch(representation, /schema-provided value|operator custom response|Exact value for error_action/);
}
assert.deepEqual(missingEventReport.expectedResponseSources, { "/error_action":"schema-provided value", "/error_message":"operator custom response" });
assert.equal(missingEventReport.expectedResponseProvenance["/error_action"].version, 1);

console.log("data-layer defect report provenance presentation tests passed");
