import assert from "node:assert/strict";

import {
  activeQuerySummary,
  applyQueryCondition,
  clearEventFeedQuery,
  eventFeedQueryFields,
  eventFeedQueryOperators,
  eventFeedQuerySuggestions,
  filterEventsByQuery,
  observedPayloadPaths,
  queryConditionComplete,
  queryConditionSummary,
  removeQueryCondition,
} from "../dist/data-layer-event-feed-query.js";

const evaluation = (status, severity = "error", propertyPath = "page_type") => ({
  propertyPath, status, message: "Page type", expected: "known", actual: "other",
  rule: "Page type allowed values", ruleVersion: 1, severity, schemaName: "Purchase event", schemaVersion: 2,
});
const events = [
  {
    id: "purchase", name: "purchase", sourceId: "adobe", sourceName: "Adobe beacons", sourceKind: "Adobe",
    captureTime: "2026-07-13T10:00:00Z", pageUrl: "https://shop.test/checkout", payload: { currency: "EUR", commerce: { total: 12 } }, validation: "1 warnings",
    validationDetails: { schema: { id: "purchase", name: "Purchase event", version: 2 }, evaluations: [evaluation("warning", "warning")], issues: [] },
  },
  {
    id: "checkout", name: "checkout", sourceId: "history", sourceName: "Event history", sourceKind: "Data layer",
    captureTime: "2026-07-13T10:00:01Z", pageUrl: "https://shop.test/products", payload: { currency: "GBP" }, validation: "Valid",
    validationDetails: { schema: { id: "checkout", name: "Checkout event", version: 1 }, evaluations: [evaluation("pass", "error", "currency")], issues: [] },
  },
];

const fields = eventFeedQueryFields();
assert.deepEqual(fields.slice(0, 4), ["Event name", "Source", "Adapter kind", "Pathname"]);
assert.deepEqual(fields, ["Event name", "Source", "Adapter kind", "Pathname", "Payload property", "Validation state", "Schema", "Validation rule", "Rule severity", "Affected property"]);
assert.equal(fields.some((field) => field.startsWith("Payload · ")), false);
assert.deepEqual(observedPayloadPaths(events), ["commerce.total", "currency"]);
assert.deepEqual(eventFeedQueryOperators("Event name"), ["is", "is not", "contains", "does not contain"]);
assert.deepEqual(eventFeedQueryOperators("Validation rule"), ["failed", "warned", "passed", "was evaluated", "was not evaluated"]);
assert.deepEqual(eventFeedQuerySuggestions(events, "Event name"), ["checkout", "purchase"]);
assert.deepEqual(eventFeedQuerySuggestions(events, "Payload · currency"), ["EUR", "GBP"]);
assert.deepEqual(eventFeedQuerySuggestions(events, "Validation state"), ["1 warnings", "Issues", "Valid", "Warnings"]);
assert.deepEqual(eventFeedQuerySuggestions(events, "Validation rule"), ["Page type allowed values"]);
assert.equal(queryConditionComplete({ id:"invalid", field:"Event name", operator:"failed", values:["purchase"] }), false);
assert.equal(queryConditionComplete({ id:"blank-payload-path", field:"Payload · ", operator:"is", values:["anything"] }), false);
assert.equal(queryConditionComplete({ id:"valid", field:"Validation rule", operator:"failed", values:["Page type allowed values"] }), true);

const cases = [
  ["Event name", "is", "purchase"], ["Source", "is", "Adobe beacons"], ["Adapter kind", "is", "Adobe"],
  ["Pathname", "is", "/checkout"], ["Payload · currency", "is", "EUR"], ["Validation state", "is", "Issues"],
  ["Schema", "is", "Purchase event"], ["Validation rule", "warned", "Page type allowed values"],
  ["Rule severity", "is", "warning"], ["Affected property", "is", "page_type"],
];
for (const [field, operator, value] of cases) {
  const query = applyQueryCondition({ conditions: [] }, { id: field, field, operator, values: [value] });
  assert.deepEqual(filterEventsByQuery(events, query).map(({ id }) => id), ["purchase"], `${field} ${operator} ${value}`);
}

let query = applyQueryCondition({ conditions: [] }, { id: "names", field: "Event name", operator: "is", values: ["purchase", "checkout"] });
assert.deepEqual(filterEventsByQuery(events, query).map(({ id }) => id), ["purchase", "checkout"]);
query = applyQueryCondition(query, { id: "validation", field: "Validation state", operator: "is", values: ["Issues"] });
assert.deepEqual(filterEventsByQuery(events, query).map(({ id }) => id), ["purchase"]);
assert.equal(activeQuerySummary(query), "Match all conditions · Match any selected value");
assert.equal(queryConditionSummary(query.conditions[0]), "Event name is purchase or checkout");
assert.equal(queryConditionSummary({ id: "rule", field: "Validation rule", operator: "failed", values: ["Page type allowed values"] }), "Validation rule Page type allowed values failed");
assert.deepEqual(removeQueryCondition(query, "validation").conditions.map(({ id }) => id), ["names"]);
assert.deepEqual(clearEventFeedQuery(query), { conditions: [] });

const notEvaluated = applyQueryCondition({ conditions: [] }, { id: "absent", field: "Validation rule", operator: "was not evaluated", values: ["Missing rule"] });
assert.deepEqual(filterEventsByQuery(events, notEvaluated).map(({ id }) => id), ["purchase", "checkout"]);
const excludedNames = applyQueryCondition({ conditions: [] }, { id:"excluded", field:"Event name", operator:"is not", values:["purchase", "checkout"] });
assert.deepEqual(filterEventsByQuery(events, excludedNames), []);
const excludedFragments = applyQueryCondition({ conditions: [] }, { id:"fragments", field:"Event name", operator:"does not contain", values:["pur", "check"] });
assert.deepEqual(filterEventsByQuery(events, excludedFragments), []);
const missingSchemaIsNotPurchase = applyQueryCondition({ conditions: [] }, { id:"missing-schema", field:"Schema", operator:"is not", values:["Purchase event"] });
assert.deepEqual(filterEventsByQuery(events, missingSchemaIsNotPurchase).map(({ id }) => id), ["checkout"]);
const noSelectedRuleEvaluated = applyQueryCondition({ conditions: [] }, { id:"rules-absent", field:"Validation rule", operator:"was not evaluated", values:["Page type allowed values", "Missing rule"] });
assert.deepEqual(filterEventsByQuery(events, noSelectedRuleEvaluated), []);
