import assert from "node:assert/strict";

import {
  assignmentConditionSuggestions,
  assignmentDataConditionSummary,
  duplicateSchemaAssignment,
  evaluateAssignmentDataConditions,
  validateAssignmentDataConditions,
} from "../dist/data-layer-schema-assignment-data-conditions.js";
import {
  createSchema,
  resolveSchemaAssignment,
  validateEvent,
} from "../dist/data-layer-schema-verification.js";

const text = (value) => ({ type:"string", value });
const number = (value) => ({ type:"number", value });
const predicate = (propertyPath, operator, options = {}) => ({
  propertyPath, operator, detectedType:options.detectedType ?? "string",
  ...(options.comparison ? { comparison:options.comparison } : {}),
  ...(options.comparisons ? { comparisons:options.comparisons } : {}),
});
const any = (...predicates) => ({ operator:"Any", predicates });
const all = (...predicates) => ({ operator:"All", predicates });

assert.deepEqual(validateAssignmentDataConditions(undefined), { ready:true, assistance:"Assignment is unrestricted by event data" });
assert.deepEqual(validateAssignmentDataConditions({ operator:"Any", predicates:[] }), { ready:false, assistance:"Add at least one condition" });
assert.equal(validateAssignmentDataConditions(any(predicate("", "Exists"))).assistance, "Choose a condition property");
assert.equal(validateAssignmentDataConditions(any(predicate("not/a/pointer", "Exists"))).assistance, "Correct the condition property path");
assert.equal(validateAssignmentDataConditions(any(predicate("/name", "Is at least", { detectedType:"string", comparison:number(1) }))).assistance, "Choose an operator compatible with string");
assert.equal(validateAssignmentDataConditions(any(predicate("/name", "Equals"))).assistance, "Enter a comparison value");
assert.equal(validateAssignmentDataConditions(any(predicate("/name", "Matches pattern", { comparison:text("[") }))).assistance, "Correct the regular expression");

const captured = {
  errorType:"legacy",
  context:{ siteArea:"checkout" },
  products:[{ type:"current" }, { type:"legacy" }],
  "a/b":"slash",
  "tilde~name":"tilde",
  count:12,
  nullable:null,
};
const snapshot = structuredClone(captured);
const evaluated = evaluateAssignmentDataConditions(captured, all(
  predicate("/errorType", "Exists"),
  predicate("/context/siteArea", "Equals", { comparison:text("checkout") }),
  predicate("/products/*/type", "Equals", { comparison:text("legacy") }),
  predicate("/a~1b", "Equals", { comparison:text("slash") }),
  predicate("/tilde~0name", "Equals", { comparison:text("tilde") }),
  predicate("/count", "Is at least", { detectedType:"number", comparison:number(10) }),
));
assert.equal(evaluated.matched, true);
assert.deepEqual(evaluated.predicates[2].observed.map(({ concretePath, value }) => [concretePath, value]), [["/products/0/type", "current"], ["/products/1/type", "legacy"]]);
assert.deepEqual(captured, snapshot, "assignment evaluation must not mutate captured data");
assert.equal(evaluateAssignmentDataConditions({ products:[] }, any(predicate("/products/*/type", "Does not exist"))).matched, true);
assert.equal(evaluateAssignmentDataConditions({ value:"1" }, any(predicate("/value", "Equals", { detectedType:"number", comparison:number(1) }))).matched, false);
assert.equal(evaluateAssignmentDataConditions({ nullable:null }, any(predicate("/nullable", "Does not exist"))).matched, false);
assert.equal(evaluateAssignmentDataConditions({ name:"legacy-page" }, any(predicate("/name", "Matches pattern", { comparison:text("^legacy-") }))).matched, true);
assert.equal(evaluateAssignmentDataConditions({}, all(predicate("/missing", "Exists"), predicate("/other", "Does not exist"))).matched, false);

const suggestions = assignmentConditionSuggestions(captured);
assert.ok(suggestions.some(({ propertyPath, detectedType, observedValue }) => propertyPath === "/context/siteArea" && detectedType === "string" && observedValue === "checkout"));
assert.ok(suggestions.some(({ propertyPath }) => propertyPath === "/products/*/type"));

const legacyAssignment = {
  id:"legacy", name:"Legacy assignment", sourceId:"event-history", eventName:"generic_event", target:"payload", priority:20,
  conditionTarget:"payload", dataConditionGroup:any(predicate("/errorType", "Exists"), predicate("/siteArea", "Exists")),
};
const currentAssignment = {
  id:"current", name:"Current assignment", sourceId:"event-history", eventName:"generic_event", target:"payload", priority:10,
  conditionTarget:"payload", dataConditionGroup:any(predicate("/error_type", "Exists"), predicate("/site_section", "Exists")),
};
const schema = (name, assignment) => ({ ...createSchema(name, 1, { type:"object" }), assignments:[assignment] });
const legacy = schema("Legacy generic event", legacyAssignment);
const current = schema("Current generic event", currentAssignment);
const event = (payload, rawInput = payload) => ({ sourceId:"event-history", eventName:"generic_event", payload, rawInput });

let resolution = resolveSchemaAssignment(event({ errorType:"business" }), "https://shop.example/page", [legacy, current]);
assert.equal(resolution.schema.name, "Legacy generic event");
assert.equal(resolution.assignment.id, "legacy");
assert.equal(resolution.evidence.selectedAssignmentId, "legacy");
assert.equal(resolution.evidence.candidates.find(({ assignmentId }) => assignmentId === "legacy").dataCondition.matched, true);
assert.equal(validateEvent(event({ errorType:"business" }), [legacy, current], "https://shop.example/page").assignmentEvidence.selectedAssignmentId, "legacy");

const gated = schema("Gated", { ...legacyAssignment, domainCondition:"shop.example", pathnameCondition:"/checkout" });
resolution = resolveSchemaAssignment(event({ errorType:"business" }), "https://shop.example/products", [gated]);
assert.deepEqual(
  (({ enabled, sourceMatch, eventNameMatch, domainMatch, pathnameMatch, urlMatch, matched }) => ({ enabled, sourceMatch, eventNameMatch, domainMatch, pathnameMatch, urlMatch, matched }))(resolution.evidence.candidates[0]),
  { enabled:true, sourceMatch:true, eventNameMatch:true, domainMatch:true, pathnameMatch:false, urlMatch:false, matched:false },
);

resolution = resolveSchemaAssignment(event({ errorType:"legacy", error_type:"current" }), "https://shop.example/page", [legacy, current]);
assert.equal(resolution.schema.name, "Legacy generic event", "the unique highest numeric priority must win");
assert.match(resolution.evidence.summary, /both match.*priority 20 wins/i);
const tiedCurrent = schema("Current generic event", { ...currentAssignment, priority:20 });
resolution = resolveSchemaAssignment(event({ errorType:"legacy", error_type:"current" }), "https://shop.example/page", [legacy, tiedCurrent]);
assert.match(resolution.error, /Legacy assignment.*Current assignment/);
assert.match(resolution.evidence.summary, /equal highest priority/i);

const payloadAssignment = { ...legacyAssignment, id:"payload", conditionTarget:"payload", dataConditionGroup:any(predicate("/variant", "Equals", { comparison:text("legacy") })) };
const rawAssignment = { ...legacyAssignment, id:"raw", name:"Raw assignment", priority:30, conditionTarget:"raw input", dataConditionGroup:any(predicate("/variant", "Equals", { comparison:text("legacy") })) };
resolution = resolveSchemaAssignment(event({ variant:"current" }, { variant:"legacy" }), "https://shop.example/page", [schema("Payload", payloadAssignment), schema("Raw", rawAssignment)]);
assert.equal(resolution.assignment.id, "raw");

const unrestricted = { id:"fallback", name:"Fallback", sourceId:"event-history", eventName:"generic_event", target:"payload", priority:1 };
resolution = resolveSchemaAssignment(event({ unrelated:true }), "https://shop.example/page", [legacy, schema("Fallback schema", unrestricted)]);
assert.equal(resolution.assignment.id, "fallback");
assert.equal(assignmentDataConditionSummary(legacyAssignment), "Payload · Any · errorType exists or siteArea exists");
assert.equal(assignmentDataConditionSummary(unrestricted), "No data conditions");

const duplicate = duplicateSchemaAssignment(legacyAssignment, "legacy:copy", "Legacy assignment copy");
duplicate.dataConditionGroup.predicates[0].propertyPath = "/changed";
assert.equal(legacyAssignment.dataConditionGroup.predicates[0].propertyPath, "/errorType");

console.log("data-layer schema assignment data conditions tests passed");
