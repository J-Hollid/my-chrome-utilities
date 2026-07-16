import assert from "node:assert/strict";

import { exportJsonSchemaResource } from "../../dist/data-layer-json-schema-export.js";

const example = JSON.parse(process.argv[2] ?? "{}");

const properties = {
  page_name:{ type:"string" },
  page_type:{ type:"string" },
  currency:{ type:"string" },
  transaction_id:{ type:"string" },
  product_id:{ type:"string" },
  revenue:{ type:"number" },
  debug:{ type:"boolean" },
  title:{ type:"string" },
  items:{ type:"array", items:{ type:"string" } },
  coupon:{ type:"string" },
};

function schemaWithRule(rule) {
  return {
    id:"schema-product-detail",
    name:"Product detail",
    version:4,
    published:true,
    assignments:[],
    document:{ type:"object", properties },
    attachedRules:rule ? [rule] : [],
  };
}

function exported(rule) {
  const schema = schemaWithRule(rule);
  return exportJsonSchemaResource(schema, [schema]).document;
}

function targetAtPath(document, path) {
  return path.split("/").filter(Boolean).reduce((target, segment) => target?.properties?.[segment], document);
}

const standardAssertions = {
  "type string":{ type:"string" },
  "parent required contains page_name":{ required:"page_name" },
  "const product_detail":{ const:"product_detail" },
  "enum EUR and USD":{ enum:["EUR", "USD"] },
  "pattern ^[A-Z]+-[0-9]+$":{ pattern:"^[A-Z]+-[0-9]+$" },
  "pattern ^[0-9]+$":{ pattern:"^[0-9]+$" },
  "minLength 1":{ minLength:1 },
  "minimum 0 and maximum 1000":{ minimum:0, maximum:1000 },
  "parent not required debug":{ forbidden:"debug" },
  "minLength 51":{ minLength:51 },
  "minLength 50":{ minLength:50 },
  "minLength 50 and maxLength 50":{ minLength:50, maxLength:50 },
  "maxLength 49":{ maxLength:49 },
  "maxLength 50":{ maxLength:50 },
  "minItems 51":{ minItems:51 },
  "minItems 50":{ minItems:50 },
  "minItems 50 and maxItems 50":{ minItems:50, maxItems:50 },
  "maxItems 49":{ maxItems:49 },
  "maxItems 50":{ maxItems:50 },
};

function assertionAt(document, path, expectedText) {
  const expected = standardAssertions[expectedText];
  assert.ok(expected, `Unknown standard assertion: ${expectedText}`);
  if (expected.required) return { required:document.required?.includes(expected.required) };
  if (expected.forbidden) return { forbidden:document.not?.anyOf?.some(({ required }) => required?.includes(expected.forbidden)) };
  const target = targetAtPath(document, path);
  return Object.fromEntries(Object.keys(expected).map((key) => [key, target?.[key]]));
}

function expectedAssertion(expectedText) {
  const expected = standardAssertions[expectedText];
  if (expected?.required) return { required:true };
  if (expected?.forbidden) return { forbidden:true };
  return expected;
}

function verifyExtensionRule() {
  const cases = {
    "type string":{ path:"/page_name" },
    "Required":{ path:"/page_name", operator:"required" },
    "Exact value product_detail":{ path:"/page_type", operator:"exact-value", parameters:"product_detail" },
    "Allowed values EUR and USD":{ path:"/currency", operator:"allowed-values", allowedValues:["EUR", "USD"] },
    "Regular expression ^[A-Z]+-[0-9]+$":{ path:"/transaction_id", operator:"regular-expression", parameters:"^[A-Z]+-[0-9]+$" },
    "Digits only":{ path:"/product_id", operator:"digits-only" },
    "Non-empty string":{ path:"/page_name", operator:"non-empty-string" },
    "Numeric range minimum 0 maximum 1000":{ path:"/revenue", operator:"numeric-range", parameters:"0,1000" },
    "Forbidden property":{ path:"/debug", operator:"forbidden-property" },
  };
  const selected = cases[example.extension_rule];
  assert.ok(selected, `Unknown extension rule: ${example.extension_rule}`);
  assert.equal(example.property_path, selected.path);
  const rule = selected.operator ? { id:"rule", version:1, propertyPath:selected.path, ...selected } : undefined;
  const document = exported(rule);
  assert.deepEqual(assertionAt(document, selected.path, example.standard_assertion), expectedAssertion(example.standard_assertion));
}

function verifyCardinality() {
  const operators = { "Text length":{ operator:"text-length", path:"/title" }, "Item count":{ operator:"item-count", path:"/items" } };
  const selected = operators[example.rule_type];
  assert.ok(selected, `Unknown cardinality rule: ${example.rule_type}`);
  assert.ok([">", ">=", "==", "<", "<="].includes(example.comparison), `Unknown comparison: ${example.comparison}`);
  const document = exported({ id:"rule", version:1, propertyPath:selected.path, operator:selected.operator, comparison:example.comparison, limit:50, parameters:"50" });
  assert.deepEqual(assertionAt(document, selected.path, example.standard_assertion), expectedAssertion(example.standard_assertion));
}

const triggerCases = {
  "/page_type Equals product_detail":{ propertyPath:"/page_type", operator:"Equals", comparison:{ type:"string", value:"product_detail" } },
  "/page_type Does not equal internal":{ propertyPath:"/page_type", operator:"Does not equal", comparison:{ type:"string", value:"internal" } },
  "/page_type Is one of product, cart":{ propertyPath:"/page_type", operator:"Is one of", comparisons:[{ type:"string", value:"product" }, { type:"string", value:"cart" }] },
  "/page_type Matches pattern ^product_":{ propertyPath:"/page_type", operator:"Matches pattern", comparison:{ type:"string", value:"^product_" } },
  "/revenue Is greater than 0":{ propertyPath:"/revenue", operator:"Is greater than", comparison:{ type:"number", value:0 } },
  "/revenue Is at least 0":{ propertyPath:"/revenue", operator:"Is at least", comparison:{ type:"number", value:0 } },
  "/coupon Exists":{ propertyPath:"/coupon", operator:"Exists" },
  "/coupon Does not exist":{ propertyPath:"/coupon", operator:"Does not exist" },
};

const triggerBehaviors = {
  "property const product_detail":{ path:"/page_type", assertion:{ const:"product_detail" } },
  "property not const internal":{ path:"/page_type", assertion:{ not:{ const:"internal" } } },
  "property enum product and cart":{ path:"/page_type", assertion:{ enum:["product", "cart"] } },
  "property pattern ^product_":{ path:"/page_type", assertion:{ pattern:"^product_" } },
  "property exclusiveMinimum 0":{ path:"/revenue", assertion:{ exclusiveMinimum:0 } },
  "property minimum 0":{ path:"/revenue", assertion:{ minimum:0 } },
  "parent required contains coupon":{ assertion:{ required:["coupon"] } },
  "parent not required coupon":{ assertion:{ not:{ anyOf:[{ required:["coupon"] }] } } },
};

function verifyTrigger() {
  const predicate = triggerCases[example.trigger];
  const expected = triggerBehaviors[example.trigger_behavior];
  assert.ok(predicate, `Unknown trigger: ${example.trigger}`);
  assert.ok(expected, `Unknown trigger behavior: ${example.trigger_behavior}`);
  const document = exported({ id:"conditional", version:1, propertyPath:"/currency", operator:"required", conditionGroup:{ operator:"All", predicates:[predicate] } });
  const condition = document.allOf?.[0]?.if;
  const actual = expected.path ? targetAtPath(condition, expected.path) : condition;
  assert.deepEqual(actual, expected.assertion);
  assert.deepEqual(document.allOf?.[0]?.then?.required, ["currency"]);
}

if (example.extension_rule) verifyExtensionRule();
else if (example.rule_type) verifyCardinality();
else if (example.trigger) verifyTrigger();
else throw new Error("No JSON Schema export example fields were provided.");
