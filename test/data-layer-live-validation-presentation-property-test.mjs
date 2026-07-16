import assert from "node:assert/strict";

import {
  applyArrayValidationRollups,
  buildValidationPropertyTree,
  propertyValidationSummary,
  validationVisual,
} from "../dist/data-layer-live-validation-presentation.js";

function evaluation(status, sample) {
  return {
    propertyPath:"commerce.total",
    status,
    message:`${status} ${sample}`,
    expected:"number",
    actual:String(sample),
    rule:"Total rule",
    ruleVersion:sample,
    severity:status === "warning" ? "warning" : "error",
    schemaName:"Checkout",
    schemaVersion:sample,
  };
}

function flattenNodes(nodes) {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children)]);
}

function findNode(nodes, path) {
  return flattenNodes(nodes).find((node) => node.path === path);
}

const emptySummary = { status:"No rules", symbolName:"neutral", treatment:"neutral", errors:0, warnings:0, passed:0 };
const rollupNode = (technicalPath, name) => ({
  path:technicalPath.slice(1).replaceAll("/", "."), technicalPath, name,
  value:undefined, valueLabel:"", missing:false, evaluations:[], summary:emptySummary,
  aggregate:{ errors:0, warnings:0 }, children:[], specificItems:[],
});

for (let sample = 1; sample <= 200; sample += 1) {
  const warningCount = (sample % 5) + 1;
  const issueVisual = validationVisual(`${sample} issues`);
  assert.deepEqual(
    [issueVisual.symbolName, issueVisual.treatment, issueVisual.summary],
    ["error", "error", `Validation failed, ${sample} error${sample === 1 ? "" : "s"}`],
  );

  const warningVisual = validationVisual(`${warningCount} warnings`);
  assert.deepEqual(
    [warningVisual.symbolName, warningVisual.treatment],
    ["warning", "warning"],
  );

  const evaluations = [
    ...Array.from({ length:sample % 4 }, () => evaluation("error", sample)),
    ...Array.from({ length:warningCount }, () => evaluation("warning", sample)),
    ...Array.from({ length:(sample % 3) + 1 }, () => evaluation("pass", sample)),
  ];
  const summary = propertyValidationSummary(evaluations);
  const reversed = propertyValidationSummary([...evaluations].reverse());
  assert.deepEqual(reversed, summary);
  assert.equal(summary.errors + summary.warnings + summary.passed, evaluations.length);
  assert.equal(summary.treatment, summary.errors ? "error" : "warning");

  const issue = {
    instancePath:"/commerce/order/id",
    message:"Required property",
    expected:"string",
    actual:"missing",
    rule:"Order id v2",
    severity:"error",
    schemaName:"Checkout",
    schemaVersion:sample,
    schemaLocation:"#/properties/commerce/order/id",
  };
  const tree = buildValidationPropertyTree({ commerce:{ total:sample } }, evaluations, [issue]);
  const missing = findNode(tree, "commerce.order.id");
  const commerce = findNode(tree, "commerce");
  assert.equal(missing.missing, true);
  assert.equal(missing.summary.errors, 1);
  assert.ok(commerce.aggregate.errors >= 1);
  assert.equal(findNode(tree, "commerce.total").value, sample);

  const itemCount = 1 + sample % 20;
  const items = Array.from({ length:itemCount }, (_, index) => ({
    ...rollupNode(`/products/${index}`, `Item ${index + 1}`),
    zeroBasedIndex:index,
    children:[rollupNode(`/products/${index}/type`, "type")],
  }));
  const rollupTree = [{
    ...rollupNode("/products", "products"),
    children:[{ ...rollupNode("/products/*", "Every item"), matchedValueCount:itemCount, children:[rollupNode("/products/*/type", "type")] }],
    specificItems:items,
  }];
  const statuses = ["pass", "warning", "error", "not-applicable"];
  const rollupEvaluations = Array.from({ length:itemCount }, (_, index) => ({
    propertyPath:`/products/${index}/type`, templatePath:"/products/*/type",
    status:statuses[(sample + index) % statuses.length], ruleId:`rule-${index % 3}`,
    rule:`Rule ${index % 3}`, ruleVersion:1, severity:"error", message:"generated",
  }));
  const repeatedIndex = sample % itemCount;
  rollupEvaluations.push({ ...rollupEvaluations[repeatedIndex], status:"error", ruleId:"repeated-rule" });
  const treeSnapshot = structuredClone(rollupTree);
  const rolled = applyArrayValidationRollups(rollupTree, rollupEvaluations);
  const rollup = rolled[0].rollup;
  const expectedAffectedIndexes = new Set(rollupEvaluations
    .filter(({ status }) => status === "error" || status === "warning")
    .map(({ propertyPath }) => Number(propertyPath.split("/")[2])));
  assert.equal(rollup.errors + rollup.warnings + rollup.passed + rollup.notApplicable, rollupEvaluations.length,
    "generated rollups must conserve every underlying evaluation exactly once");
  assert.equal(rollup.affectedItemCount, expectedAffectedIndexes.size,
    "repeated generated issues must not duplicate affected-item counts");
  assert.deepEqual(rolled[0].affectedItems.map(({ zeroBasedIndex }) => zeroBasedIndex), [...expectedAffectedIndexes].sort((a, b) => a - b));
  assert.deepEqual(applyArrayValidationRollups(rollupTree, rollupEvaluations), rolled,
    "generated rollups must be deterministic");
  assert.deepEqual(rollupTree, treeSnapshot, "rollup aggregation must not mutate the property tree");
}
