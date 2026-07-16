import assert from "node:assert/strict";

import { applyArrayValidationRollups } from "../../dist/data-layer-live-validation-presentation.js";

const example = JSON.parse(process.argv[2] ?? "{}");
const emptySummary = { status:"No rules", symbolName:"neutral", treatment:"neutral", errors:0, warnings:0, passed:0 };

function leaf(path, name, zeroBasedIndex) {
  return {
    path:path.slice(1).replaceAll("/", "."),
    technicalPath:path,
    name,
    valueLabel:"",
    missing:false,
    evaluations:[],
    summary:emptySummary,
    aggregate:{ errors:0, warnings:0 },
    children:[],
    specificItems:[],
    ...(zeroBasedIndex === undefined ? {} : { zeroBasedIndex }),
  };
}

function evaluation(index, property, status) {
  return {
    propertyPath:`/products/${index}/${property}`,
    templatePath:`/products/*/${property}`,
    status,
    message:`${property} rule`,
    expected:"valid",
    actual:"invalid",
    rule:`${property} rule`,
    ruleId:`rule:${property}`,
    ruleVersion:1,
    severity:status === "warning" ? "warning" : "error",
    schemaName:"Products",
    schemaVersion:1,
  };
}

const distributions = {
  "type errors in items 3 and 8":[evaluation(2, "type", "error"), evaluation(7, "type", "error")],
  "id and type errors in item 8":[evaluation(7, "id", "error"), evaluation(7, "type", "error")],
  "type error in item 8 and name warning in item 4":[evaluation(7, "type", "error"), evaluation(3, "name", "warning")],
  "type error and name warning both in item 8":[evaluation(7, "type", "error"), evaluation(7, "name", "warning")],
};

const evaluations = distributions[example.issue_distribution];
assert.ok(evaluations, `Unknown issue distribution: ${example.issue_distribution}`);

const items = Array.from({ length:10 }, (_, index) => ({
  ...leaf(`/products/${index}`, `Item ${index + 1}`, index),
  children:["id", "type", "name"].map((property) => leaf(`/products/${index}/${property}`, property)),
}));
const tree = [{
  ...leaf("/products", "products"),
  children:[{
    ...leaf("/products/*", "Every item"),
    matchedValueCount:10,
    children:["id", "type", "name"].map((property) => leaf(`/products/*/${property}`, property)),
  }],
  specificItems:items,
}];

const products = applyArrayValidationRollups(tree, evaluations)[0];
const expected = {
  errors:Number(example.error_count),
  warnings:Number(example.warning_count),
  affectedItemCount:Number(example.affected_item_count),
};
assert.deepEqual({
  errors:products.rollup.errors,
  warnings:products.rollup.warnings,
  affectedItemCount:products.rollup.affectedItemCount,
}, expected);
assert.equal(products.rollup.errors + products.rollup.warnings, evaluations.length);
assert.equal(products.affectedItems.length, expected.affectedItemCount);
