import assert from "node:assert/strict";
import { createSchema, validateWithSchema } from "../dist/data-layer-schema-verification.js";
import { typedComparisonValue } from "../dist/data-layer-conditional-validation-rules.js";

const event = (payload) => ({ sourceId:"history", eventName:"pageview", payload, rawInput:[] });
const schemaWith = (rules, name = "Presence semantics") => ({
  ...createSchema(name, 2, { type:"object", properties:{
    test:{ type:"string" }, profile:{ type:"object", properties:{ status:{ type:"string" } } },
    products:{ type:"array", items:{ type:"object", properties:{ sku:{ type:"string" } } } },
    oOrder:{ type:"object", properties:{ aProducts:{ type:"array", items:{ type:"object" } } } },
    page_type:{ type:"string" },
  } }),
  attachedRules:rules,
});
const rule = (id, operator, parameters, propertyPath="/test", extra={}) => ({ id, name:id, version:1, propertyPath, operator, ...(parameters !== undefined ? { parameters } : {}), ...extra });

for (const [operator, parameters] of [
  ["exact-value", "test"], ["value-type", "string"], ["non-empty-string", undefined],
  ["text-length", "4"], ["digits-only", undefined], ["allowed-values", "test"],
  ["regular-expression", "^test$"], ["numeric-range", "1,10"], ["item-count", "1"],
]) {
  const result = validateWithSchema(event({}), schemaWith([rule(`optional-${operator}`, operator, parameters)]), []);
  assert.equal(result.state, "Valid", `${operator} made an omitted optional property invalid`);
  assert.deepEqual(result.issues, [], `${operator} created an issue for absence`);
  assert.equal(result.evaluations[0].status, "not-applicable", `${operator} did not record absence as not applicable`);
  assert.notEqual(result.evaluations[0].actual, "null");
}

const requiredAndAllowed = schemaWith([
  rule("Required", "required"),
  rule("Allowed values", "allowed-values", "test"),
]);
const missing = validateWithSchema(event({}), requiredAndAllowed, []);
assert.deepEqual(missing.evaluations.map(({ rule, status }) => [rule, status]), [["Required", "error"], ["Allowed values", "not-applicable"]]);
assert.equal(missing.issues.length, 1);
assert.match(missing.issues[0].rule, /^Required/);
const accepted = validateWithSchema(event({ test:"test" }), requiredAndAllowed, []);
assert.deepEqual(accepted.evaluations.map(({ status }) => status), ["pass", "pass"]);
const rejected = validateWithSchema(event({ test:"another value" }), requiredAndAllowed, []);
assert.deepEqual(rejected.evaluations.map(({ status }) => status), ["pass", "error"]);

const explicitNull = validateWithSchema(event({ test:null }), schemaWith([rule("Allowed values", "allowed-values", "test")]), []);
assert.equal(explicitNull.evaluations[0].status, "error");
assert.equal(explicitNull.evaluations[0].actual, "null");
assert.notEqual(explicitNull.evaluations[0].actual, "missing");

const explicitUndefined = validateWithSchema(event({ test:undefined }), schemaWith([
  rule("Allowed values", "allowed-values", "test"),
  rule("Required", "required"),
]), []);
assert.deepEqual(explicitUndefined.evaluations.map(({ status }) => status), ["error", "pass"]);
assert.deepEqual(explicitUndefined.evaluations.map(({ actual }) => actual), ["undefined", "undefined"]);
assert.equal(explicitUndefined.issues.some(({ rule }) => rule?.startsWith("Allowed values")), false);
assert.equal(explicitUndefined.issues.find(({ message }) => message === "Type mismatch")?.actual, "undefined");

const nestedRules = [
  rule("Nested value", "allowed-values", "active", "/profile/status"),
  rule("Nested required", "required", undefined, "/profile/status"),
  rule("Wildcard value", "allowed-values", "SKU-1", "/products/*/sku"),
  rule("Wildcard required", "required", undefined, "/products/*/sku"),
  rule("Index value", "value-type", "object", "/products/2"),
  rule("Index required", "required", undefined, "/products/2"),
];
const nested = validateWithSchema(event({ products:[{ sku:"SKU-1" }, {}] }), schemaWith(nestedRules), []);
assert.equal(nested.issues.length, 3);
assert.equal(nested.issues.every(({ rule }) => rule.startsWith("Nested required") || rule.startsWith("Wildcard required") || rule.startsWith("Index required")), true);
assert.equal(nested.evaluations.filter(({ status }) => status === "not-applicable").length, 3);
assert.equal(nested.evaluations.filter(({ rule, status }) => rule === "Wildcard value" && status === "pass").length, 1);

const condition = { operator:"All", predicates:[{ propertyPath:"/page_type", operator:"Equals", comparison:typedComparisonValue("product_detail"), detectedType:"string" }] };
for (const [operator, path, payload, status, issues] of [
  ["allowed-values", "/test", { page_type:"category" }, "not-applicable", 0],
  ["allowed-values", "/test", { page_type:"product_detail" }, "not-applicable", 0],
  ["item-count", "/oOrder/aProducts", { page_type:"product_detail", oOrder:{} }, "not-applicable", 0],
  ["item-count", "/oOrder/aProducts", { page_type:"product_detail", oOrder:{ aProducts:[] } }, "error", 1],
  ["required", "/oOrder/aProducts/0", { page_type:"product_detail", oOrder:{ aProducts:[] } }, "error", 1],
]) {
  const result = validateWithSchema(event(payload), schemaWith([rule("Conditional", operator, operator === "allowed-values" ? "test" : operator === "item-count" ? "1" : undefined, path, { conditionGroup:condition })]), []);
  assert.equal(result.evaluations[0].status, status);
  assert.equal(result.issues.length, issues);
}

const legacy = schemaWith([{ id:"legacy", name:"Legacy", version:1, operator:"allowed-values", parameters:"test:test" }]);
assert.equal(validateWithSchema(event({}), legacy, []).evaluations[0].status, "not-applicable");

const parent = schemaWith([rule("Inherited optional", "allowed-values", "test")], "Parent");
const child = { ...schemaWith([], "Child"), parentSchemaId:parent.id };
const inherited = validateWithSchema(event({}), child, [parent, child]);
assert.equal(inherited.evaluations[0].status, "not-applicable");
assert.equal(inherited.issues.length, 0);

console.log("data-layer validation presence semantics tests passed");
