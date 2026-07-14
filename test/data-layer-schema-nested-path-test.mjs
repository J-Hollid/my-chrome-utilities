import assert from "node:assert/strict";

import {
  canonicalPathForTargetIntent,
  ensureNestedSchemaPath,
  inspectSpecificIndexRuleTarget,
  nestedTargetChoices,
  validateNestedRuleTarget,
} from "../dist/data-layer-schema-nested-path.js";
import { validateWithSchema } from "../dist/data-layer-schema-verification.js";

const payload = {
  fruits:["apple", "banana", "pear"],
  products:[{ id:1, name:"product 1" }, { id:2, name:"product 2" }],
  order:{ id:"12345678" },
};
const document = {
  type:"object",
  properties:{
    fruits:{ type:"array", items:{ type:"string" } },
    products:{ type:"array", items:{ type:"object", properties:{ id:{ type:"number" }, name:{ type:"string" } } } },
    order:{ type:"object", properties:{ id:{ type:"string" } } },
  },
};

assert.deepEqual(nestedTargetChoices(payload, "/order/id"), [{ label:"Nested property", path:"/order/id", matchedValueCount:1 }]);
assert.equal(canonicalPathForTargetIntent("nested order id"), "/order/id");
assert.equal(canonicalPathForTargetIntent("fruits item at zero-based index 1"), "/fruits/1");
assert.equal(canonicalPathForTargetIntent("id in every products item"), "/products/*/id");
assert.deepEqual(nestedTargetChoices(payload, "/products/1/id"), [
  { label:"This item only", path:"/products/1/id", matchedValueCount:1, itemNumber:2, zeroBasedIndex:1 },
  { label:"This property in every item", path:"/products/*/id", matchedValueCount:2 },
]);

for (const [path, result, assistance, type] of [
  ["/order/id", "accepted", "Targets nested property order id", "string"],
  ["/products/*/id", "accepted", "Targets id in every products item", "number"],
  ["/fruits/1", "accepted", "Targets item 2 at zero-based index 1", "string"],
  ["/order/*", "blocked", "order is not an array", undefined],
  ["/fruits/name", "blocked", "fruits items cannot contain property name", undefined],
  ["/fruits/-1", "blocked", "Enter a non-negative array index", undefined],
]) {
  const inspected = validateNestedRuleTarget(document, path);
  assert.equal(inspected.result, result, path);
  assert.equal(inspected.assistance, assistance, path);
  assert.equal(inspected.targetType, type, path);
}

assert.deepEqual(inspectSpecificIndexRuleTarget(document, "/fruits", "1"), {
  result:"accepted",
  assistance:"Item 2 at zero-based index 1",
  canonicalPath:"/fruits/1",
  targetType:"string",
});
assert.deepEqual(inspectSpecificIndexRuleTarget(document, "/fruits", "-1"), {
  result:"blocked",
  assistance:"Enter a non-negative array index",
  canonicalPath:"/fruits/-1",
});
assert.deepEqual(inspectSpecificIndexRuleTarget(document, "/order", "1"), {
  result:"blocked",
  assistance:"order is not an array",
  canonicalPath:"/order/1",
});

const ensured = ensureNestedSchemaPath({ type:"object" }, "/products/*/id", "number");
assert.deepEqual(ensured.createdNodes, ["/products", "/products/*", "/products/*/id"]);
assert.deepEqual(ensured.document.properties.products, {
  type:"array",
  items:{ type:"object", properties:{ id:{ type:"number" } } },
});

function validate(rules, value = payload) {
  const schema = { id:"product", name:"Product detail", version:3, document, assignments:[], attachedRules:rules };
  return validateWithSchema({ sourceId:"event", eventName:"product_view", payload:value, rawInput:[] }, schema, [schema]);
}

assert.equal(validate([{ id:"banana", version:1, propertyPath:"/fruits/1", operator:"exact-value", parameters:"banana" }]).state, "Valid");
for (const fruits of [["apple", "orange", "pear"], ["apple"]]) {
  const result = validate([{ id:"banana", version:1, propertyPath:"/fruits/1", operator:"exact-value", parameters:"banana" }], { ...payload, fruits });
  assert.equal(result.state, "1 issues");
  assert.equal(result.issues[0].instancePath, "/fruits/1");
  assert.equal(result.issues[0].templatePath, "/fruits/1");
}

const missingProduct = { ...payload, products:[payload.products[0], { name:"" }] };
const productRules = [
  { id:"id", version:1, propertyPath:"/products/*/id", operator:"value-type", parameters:"number" },
  { id:"name", version:1, propertyPath:"/products/*/name", operator:"non-empty-string" },
];
const productsResult = validate(productRules, missingProduct);
assert.deepEqual(productsResult.issues.map(({ instancePath, templatePath }) => [instancePath, templatePath]), [
  ["/products/1/id", "/products/*/id"],
  ["/products/1/name", "/products/*/name"],
]);
assert.equal(validate(productRules, { ...payload, products:[] }).issues.length, 0);

for (const [id, state, expected] of [["12345678", "Valid", undefined], ["1234567", "1 issues", "text length 8"], ["1234567a", "1 issues", "digits only"]]) {
  const result = validate([
    { id:"length", version:1, propertyPath:"/order/id", operator:"text-length", parameters:"8" },
    { id:"digits", version:1, propertyPath:"/order/id", operator:"digits-only" },
  ], { ...payload, order:{ id } });
  assert.equal(result.state, state);
  assert.equal(result.issues[0]?.expected, expected);
}

const repeated = { orders:[{ items:[{ sku:"A" }, { sku:"" }] }, { items:[{ sku:"B" }] }] };
const repeatedDocument = { type:"object", properties:{ orders:{ type:"array", items:{ type:"object", properties:{ items:{ type:"array", items:{ type:"object", properties:{ sku:{ type:"string" } } } } } } } } };
const repeatedSchema = { id:"orders", name:"Orders", version:1, document:repeatedDocument, assignments:[], attachedRules:[{ id:"sku", version:1, propertyPath:"/orders/*/items/*/sku", operator:"non-empty-string" }] };
const repeatedResult = validateWithSchema({ sourceId:"event", eventName:"orders", payload:repeated, rawInput:[] }, repeatedSchema, [repeatedSchema]);
assert.deepEqual(repeatedResult.issues.map(({ instancePath }) => instancePath), ["/orders/0/items/1/sku"]);
