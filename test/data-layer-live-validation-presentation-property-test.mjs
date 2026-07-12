import assert from "node:assert/strict";

import {
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
}
