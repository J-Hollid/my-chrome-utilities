import assert from "node:assert/strict";

import { typedComparisonValue } from "../dist/data-layer-conditional-validation-rules.js";
import { propertyValidationSummary } from "../dist/data-layer-live-validation-presentation.js";
import { createSchema, validateWithSchema } from "../dist/data-layer-schema-verification.js";

let seed = 0x70726573;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

function event(payload) {
  return { sourceId:"history", eventName:"pageview", payload, rawInput:[] };
}

function attachedRule(id, operator, parameters, propertyPath, extra = {}) {
  return {
    id,
    name:id,
    version:1,
    propertyPath,
    operator,
    ...(parameters === undefined ? {} : { parameters }),
    ...extra,
  };
}

const optionalOperators = [
  ["exact-value", "expected"],
  ["value-type", "string"],
  ["non-empty-string", undefined],
  ["text-length", "4"],
  ["digits-only", undefined],
  ["allowed-values", "expected,accepted"],
  ["regular-expression", "^expected$"],
  ["numeric-range", "1,10"],
  ["item-count", "1"],
];
const explicitValues = [null, undefined, false, 0, "", [], {}];

for (let sample = 0; sample < 200; sample += 1) {
  const property = `optional_${nextToken()}`;
  const path = `/${property}`;
  const rules = optionalOperators.map(([operator, parameters]) =>
    attachedRule(`${operator}-${sample}`, operator, parameters, path));
  const schema = {
    ...createSchema(`Presence ${sample} ${nextToken()}`, sample + 1, { type:"object" }),
    attachedRules:rules,
  };
  const schemaSnapshot = structuredClone(schema);
  const absent = validateWithSchema(event({}), schema, []);

  assert.equal(absent.state, "Valid");
  assert.deepEqual(absent.issues, []);
  assert.deepEqual(absent.evaluations.map(({ status }) => status), rules.map(() => "not-applicable"));
  assert.ok(absent.evaluations.every(({ actual }) => actual === "missing"));
  assert.deepEqual(schema, schemaSnapshot, "absence evaluation must not mutate rule definitions");

  const explicitValue = explicitValues[sample % explicitValues.length];
  const present = validateWithSchema(event({ [property]:explicitValue }), {
    ...schema,
    attachedRules:[
      attachedRule(`required-${sample}`, "required", undefined, path),
      attachedRule(`allowed-${sample}`, "allowed-values", `never-${nextToken()}`, path),
    ],
  }, []);
  assert.equal(present.evaluations[0].status, "pass", "Required must use property presence, not truthiness");
  assert.equal(present.evaluations[1].status, "error");
  assert.notEqual(present.evaluations[1].actual, "missing");
  assert.equal(typeof present.evaluations[1].actual, "string");
  assert.equal(present.issues.length, 1);

  const allowed = `allowed-${nextToken()}`;
  const requiredAndAllowed = {
    ...schema,
    attachedRules:[
      attachedRule(`Required ${sample}`, "required", undefined, path),
      attachedRule(`Allowed ${sample}`, "allowed-values", allowed, path),
    ],
  };
  for (const [payload, statuses, issueRule] of [
    [{}, ["error", "not-applicable"], "Required"],
    [{ [property]:allowed }, ["pass", "pass"], undefined],
    [{ [property]:`rejected-${nextToken()}` }, ["pass", "error"], "Allowed"],
  ]) {
    const result = validateWithSchema(event(payload), requiredAndAllowed, []);
    assert.deepEqual(result.evaluations.map(({ status }) => status), statuses);
    assert.equal(result.issues.length, issueRule ? 1 : 0);
    if (issueRule) assert.ok(result.issues[0].rule.startsWith(issueRule));
  }

  const productCount = sample % 5 + 1;
  const products = Array.from({ length:productCount }, (_, index) =>
    index % 2 === 0 ? { sku:allowed } : {});
  const wildcardPath = "/products/*/sku";
  const indexPath = `/products/${productCount}`;
  const nestedSchema = {
    ...createSchema(`Nested presence ${sample} ${nextToken()}`, 1, { type:"object" }),
    attachedRules:[
      attachedRule(`Wildcard value ${sample}`, "allowed-values", allowed, wildcardPath),
      attachedRule(`Wildcard required ${sample}`, "required", undefined, wildcardPath),
      attachedRule(`Index value ${sample}`, "value-type", "object", indexPath),
      attachedRule(`Index required ${sample}`, "required", undefined, indexPath),
      attachedRule(`Nested value ${sample}`, "allowed-values", allowed, "/profile/status"),
      attachedRule(`Nested required ${sample}`, "required", undefined, "/profile/status"),
    ],
  };
  const nested = validateWithSchema(event({ products }), nestedSchema, []);
  const wildcardValue = nested.evaluations.filter(({ rule }) => rule === `Wildcard value ${sample}`);
  const wildcardRequired = nested.evaluations.filter(({ rule }) => rule === `Wildcard required ${sample}`);
  assert.deepEqual(wildcardValue.map(({ status }) => status), products.map((_, index) => index % 2 === 0 ? "pass" : "not-applicable"));
  assert.deepEqual(wildcardRequired.map(({ status }) => status), products.map((_, index) => index % 2 === 0 ? "pass" : "error"));
  assert.equal(nested.evaluations.find(({ rule }) => rule === `Index value ${sample}`).status, "not-applicable");
  assert.equal(nested.evaluations.find(({ rule }) => rule === `Index required ${sample}`).status, "error");
  assert.equal(nested.evaluations.find(({ rule }) => rule === `Nested value ${sample}`).status, "not-applicable");
  assert.equal(nested.evaluations.find(({ rule }) => rule === `Nested required ${sample}`).status, "error");
  assert.equal(nested.issues.length, Math.floor(productCount / 2) + 2);

  const condition = {
    operator:"All",
    predicates:[{
      propertyPath:"/page_type",
      operator:"Equals",
      comparison:typedComparisonValue("product_detail"),
      detectedType:"string",
    }],
  };
  for (const [payload, operator, status, issueCount] of [
    [{ page_type:"category" }, "allowed-values", "not-applicable", 0],
    [{ page_type:"product_detail" }, "allowed-values", "not-applicable", 0],
    [{ page_type:"product_detail" }, "required", "error", 1],
  ]) {
    const conditionalSchema = {
      ...schema,
      attachedRules:[attachedRule(`Conditional ${sample}`, operator, operator === "required" ? undefined : allowed, path, { conditionGroup:condition })],
    };
    const result = validateWithSchema(event(payload), conditionalSchema, []);
    assert.equal(result.evaluations[0].status, status);
    assert.equal(result.issues.length, issueCount);
  }

  const legacy = {
    ...schema,
    attachedRules:[{ id:`Legacy ${sample}`, name:`Legacy ${sample}`, version:1, operator:"allowed-values", parameters:`${property}:${allowed}` }],
  };
  assert.equal(validateWithSchema(event({}), legacy, []).evaluations[0].status, "not-applicable");
  const parent = { ...schema, id:`parent-${sample}`, attachedRules:[attachedRule(`Inherited ${sample}`, "allowed-values", allowed, path)] };
  const child = { ...createSchema(`Child ${sample} ${nextToken()}`, 1, { type:"object" }), parentSchemaId:parent.id };
  const inherited = validateWithSchema(event({}), child, [parent, child]);
  assert.equal(inherited.evaluations[0].status, "not-applicable");
  assert.deepEqual(inherited.issues, []);

  const summary = propertyValidationSummary(absent.evaluations);
  assert.equal(summary.status, `${rules.length} rules not applicable`);
  assert.equal(summary.symbolName, "neutral");
  assert.equal(summary.treatment, "neutral");
  assert.deepEqual([summary.errors, summary.warnings, summary.passed], [0, 0, 0]);
}

console.log("validation presence semantics properties: 200 generated cases passed");
