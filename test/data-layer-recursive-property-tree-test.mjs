import assert from "node:assert/strict";

import {
  buildRecursivePropertyTree,
  inspectValidationTarget,
  normalizeTargetExpression,
  parseTargetExpression,
  searchRecursivePropertyTree,
} from "../dist/data-layer-recursive-property-tree.js";

const products = Array.from({ length:6 }, (_, index) => ({
  ...(index ? { sku:`SKU-${index}` } : {}),
  name:`Product ${index + 1}`,
  price:index < 4 ? index + 1 : String(index + 1),
  pricing:{ amount:index + 0.5 },
  details:[{ code:`A-${index}` }, { code:`B-${index}` }],
  "1":`numeric property ${index}`,
  "*":`star property ${index}`,
  "a/b":`slash property ${index}`,
}));
const payload = {
  oOrder:{ orderId:"ORDER-1", aProducts:products, "a/b":{ "~name":"escaped" } },
  orders:[{ items:[{ sku:"nested" }] }],
  tags:["one", "two", "three"],
  matrices:[[1, 2], [3]],
  discounts:[],
};

const tree = buildRecursivePropertyTree(payload);
const byPath = new Map(tree.flatMap(function flatten(node) { return [[node.path, node], ...node.children.flatMap(flatten), ...node.specificItems.flatMap(flatten)]; }));
assert.equal(byPath.get("/oOrder/aProducts").summary, "Array · 6 items");
assert.equal(byPath.get("/oOrder/aProducts/*").label, "Every item");
assert.equal(byPath.get("/oOrder/aProducts/*/sku").summary, "String · present in 5 of 6 items");
assert.equal(byPath.get("/oOrder/aProducts/*/price").summary, "Mixed types · Number 4 · String 2");
assert.equal(byPath.get("/oOrder/aProducts/*/pricing/amount").matchedValueCount, 6);
assert.equal(byPath.get("/orders/*/items/*/sku").examples[0], "nested");
assert.equal(byPath.get("/tags/*").summary, "String · 3 observed values");
assert.equal(byPath.get("/matrices/*/*").matchedValueCount, 3);
assert.equal(byPath.get("/discounts").assistance, "No item structure was observed");
assert.equal(byPath.get("/oOrder/aProducts/1").label, "Item 2");
assert.equal(byPath.get("/oOrder/aProducts/1").zeroBasedIndex, 1);

assert.deepEqual(searchRecursivePropertyTree(tree, "pricing amount", new Set(["/oOrder"])), {
  matches:["/oOrder/aProducts/*/pricing/amount"],
  expanded:["/oOrder", "/oOrder/aProducts", "/oOrder/aProducts/*", "/oOrder/aProducts/*/pricing"],
  restoreExpanded:["/oOrder"],
});

const parsed = parseTargetExpression('$["oOrder"]["aProducts"][*]["details"][1]');
assert.deepEqual(parsed.map(({ kind, value }) => [kind, value]), [["property","oOrder"],["property","aProducts"],["every",null],["property","details"],["index",1]]);
assert.equal(normalizeTargetExpression('/oOrder/aProducts/0/1', payload), '$["oOrder"]["aProducts"][0]["1"]');
assert.equal(normalizeTargetExpression('/oOrder/a~1b/~0name', payload), '$["oOrder"]["a/b"]["~name"]');
assert.notEqual(normalizeTargetExpression('$["oOrder"]["aProducts"][0]["*"]', payload), normalizeTargetExpression('/oOrder/aProducts/*', payload));

assert.deepEqual(inspectValidationTarget(payload, '/oOrder/aProducts/*/sku'), {
  result:"accepted", expression:'$["oOrder"]["aProducts"][*]["sku"]', readablePath:"/oOrder/aProducts/*/sku",
  matchedValueCount:5, detectedTypes:["String"], examples:["SKU-1", "SKU-2", "SKU-3"], assistance:"5 values match this target", missingNodes:[], requiresExpectedType:false,
});
assert.equal(inspectValidationTarget(payload, '/oOrder/aProducts/*/details/1/code').matchedValueCount, 6);
assert.deepEqual(inspectValidationTarget(payload, '/oOrder/aProducts/-1'), { result:"blocked", assistance:"Enter a non-negative array index" });
assert.deepEqual(inspectValidationTarget(payload, '/oOrder/aProducts/1.5'), { result:"blocked", assistance:"Enter a non-negative whole-number array index" });
assert.deepEqual(inspectValidationTarget(payload, '$["oOrder"]["aProducts"][-1]'), { result:"blocked", assistance:"Enter a non-negative array index" });
assert.deepEqual(inspectValidationTarget(payload, '$["oOrder"]["aProducts"][1.5]'), { result:"blocked", assistance:"Enter a non-negative whole-number array index" });
assert.deepEqual(inspectValidationTarget(payload, '/oOrder/orderId/*'), { result:"blocked", assistance:"orderId is not an array" });
assert.deepEqual(inspectValidationTarget(payload, '/oOrder/aProducts/sku'), { result:"blocked", assistance:"Choose Every item or a specific aProducts index" });
const unobserved = inspectValidationTarget(payload, '$["oOrder"]["aProducts"][*]["details"][1]["missing"]');
assert.equal(unobserved.result, "unobserved"); assert.equal(unobserved.requiresExpectedType, true); assert.ok(unobserved.missingNodes.includes("property missing"));
