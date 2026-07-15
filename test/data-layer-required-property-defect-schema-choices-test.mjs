import assert from "node:assert/strict";

import { resolveRequiredPropertySchemaChoices } from "../dist/data-layer-defect-schema-choices.js";
import { applyExpectedResult, createDefectReport, toggleReportIssue } from "../dist/data-layer-defect-report.js";
import { defectCapturedEvent } from "../dist/data-layer-defect-report-ui.js";
import { validateWithSchema } from "../dist/data-layer-schema-verification.js";

const assignedSchema = { id:"schema:pageview", name:"Generic pageview", version:7 };
const evaluation = (overrides = {}) => ({
  propertyPath:"/page_type", status:"not-applicable", message:"optional target is absent",
  expected:"product_detail,product_listing", actual:"missing", rule:"Allowed page types", ruleVersion:3,
  severity:"error", schemaName:"Generic pageview", schemaVersion:7, ruleId:"rule:page-types",
  schemaId:"schema:pageview", operator:"allowed-values", allowedValues:["product_detail", "product_listing"],
  notApplicableReason:"target-absent", ...overrides,
});

const choices = resolveRequiredPropertySchemaChoices({
  issuePointer:"/page_type", evaluations:[evaluation()], assignedSchema,
});
assert.deepEqual(choices.values, ["product_detail", "product_listing"]);
assert.deepEqual(choices.provenance, {
  schema:assignedSchema,
  rules:[{ id:"rule:page-types", name:"Allowed page types", version:3, schemaId:"schema:pageview", schemaName:"Generic pageview", schemaVersion:7 }],
});
assert.equal(choices.conflict, undefined);

assert.deepEqual(resolveRequiredPropertySchemaChoices({
  issuePointer:"/market_id", assignedSchema,
  evaluations:[evaluation({ propertyPath:"/market_id", allowedValues:[1, 2] })],
}).values, [1, 2]);
assert.deepEqual(resolveRequiredPropertySchemaChoices({
  issuePointer:"/logged_in", assignedSchema,
  evaluations:[evaluation({ propertyPath:"/logged_in", allowedValues:[true, false] })],
}).values, [true, false]);

assert.deepEqual(resolveRequiredPropertySchemaChoices({
  issuePointer:"/products/0/name", assignedSchema,
  evaluations:[evaluation({ propertyPath:"/products/*/name", allowedValues:["robot"] })],
}).values, ["robot"]);
assert.deepEqual(resolveRequiredPropertySchemaChoices({
  issuePointer:"/a~1b", assignedSchema,
  evaluations:[evaluation({ propertyPath:"/a~1b", allowedValues:["enabled"] })],
}).values, ["enabled"]);
assert.deepEqual(resolveRequiredPropertySchemaChoices({
  issuePointer:"/tilde~0name", assignedSchema,
  evaluations:[evaluation({ propertyPath:"/tilde~0name", allowedValues:["retained"] })],
}).values, ["retained"]);
assert.deepEqual(resolveRequiredPropertySchemaChoices({
  issuePointer:"/commerce/currency", assignedSchema,
  evaluations:[evaluation({ propertyPath:"/commerce/country", allowedValues:["EUR"] })],
}).values, []);

const intersected = resolveRequiredPropertySchemaChoices({
  issuePointer:"/page_type", assignedSchema,
  evaluations:[
    evaluation(),
    evaluation({ operator:"exact-value", allowedValues:["product_detail"], ruleId:"rule:exact", rule:"Exact page type", ruleVersion:1 }),
  ],
});
assert.deepEqual(intersected.values, ["product_detail"]);
assert.equal(intersected.provenance.rules.length, 2);

const conflict = resolveRequiredPropertySchemaChoices({
  issuePointer:"/page_type", assignedSchema,
  evaluations:[evaluation({ allowedValues:["product"] }), evaluation({ allowedValues:["content"], ruleId:"rule:other", rule:"Other pages" })],
});
assert.deepEqual(conflict.values, []);
assert.match(conflict.conflict, /Allowed page types.*Other pages/);
assert.deepEqual(resolveRequiredPropertySchemaChoices({
  issuePointer:"/page_type", assignedSchema,
  evaluations:[evaluation({ notApplicableReason:"condition-not-satisfied" })],
}).values, []);

const schema = {
  ...assignedSchema, published:true,
  document:{ type:"object", required:["page_type"], properties:{ page_type:{ type:"string" } } },
  assignments:[],
  attachedRules:[{ id:"rule:page-types", name:"Allowed page types", version:3, propertyPath:"/page_type", operator:"allowed-values", allowedValues:["product_detail", "product_listing"] }],
};
const payload = {};
const validation = validateWithSchema({ sourceId:"history", eventName:"pageview", payload, rawInput:[] }, schema, [schema]);
assert.deepEqual(validation.issues.map(({ message }) => message), ["Required value"]);
assert.deepEqual(validation.evaluations.map(({ status, notApplicableReason, allowedValues }) => ({ status, notApplicableReason, allowedValues })), [
  { status:"not-applicable", notApplicableReason:"target-absent", allowedValues:["product_detail", "product_listing"] },
]);
const converted = defectCapturedEvent({
  id:"event:missing", name:"pageview", sourceId:"history", captureTime:"2026-07-15T11:00:00Z", payload,
  validation:validation.state, validationDetails:{ issues:validation.issues, evaluations:validation.evaluations, schema:validation.schema },
});
assert.deepEqual(converted.issues[0].allowedValues, ["product_detail", "product_listing"]);
assert.equal(converted.issues[0].schemaChoiceProvenance.schema.version, 7);

const report = createDefectReport(converted);
const corrected = applyExpectedResult(report, [{ issueId:"page_type", method:"choose an allowed value", response:"product_detail", responseSource:"Generic pageview revision 7", responseProvenance:converted.issues[0].schemaChoiceProvenance }]);
assert.deepEqual(corrected.expected.payload, { page_type:"product_detail" });
assert.equal(corrected.expected.corrections[0].operation, "add");
assert.equal(corrected.expected.corrections[0].responseProvenance.schema.version, 7);
const deselected = toggleReportIssue(report, "page_type");
assert.deepEqual(applyExpectedResult(deselected, [{
  issueId:"page_type", method:"choose an allowed value", response:"product_detail",
}]).expected.payload, {});
const reselected = toggleReportIssue(deselected, "page_type");
assert.deepEqual(applyExpectedResult(reselected, [{
  issueId:"page_type", method:"choose an allowed value", response:"product_detail",
}]).expected.payload, { page_type:"product_detail" });
assert.deepEqual(payload, {});

console.log("required-property defect schema choice tests passed");
