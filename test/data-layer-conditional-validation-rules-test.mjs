import assert from "node:assert/strict";

import {
  comparisonValueFromInput,
  conditionGroupApplies,
  conditionGroupAppliesToConsequence,
  conditionalRuleSummary,
  evaluateConditionalRule,
  evaluateConditionPredicate,
  operatorsForConditionType,
  typedComparisonValue,
  validateConditionalRule,
} from "../dist/data-layer-conditional-validation-rules.js";
import { validateWithSchema } from "../dist/data-layer-schema-verification.js";

assert.deepEqual(comparisonValueFromInput(" 42 ", "number"), typedComparisonValue(42));
assert.deepEqual(comparisonValueFromInput("false", "boolean"), typedComparisonValue(false));
assert.deepEqual(comparisonValueFromInput("null", "null"), typedComparisonValue(null));
assert.deepEqual(comparisonValueFromInput(" product detail ", "string"), typedComparisonValue(" product detail "));
for (const [input, type] of [["", "number"], ["not-a-number", "number"], ["yes", "boolean"], ["nil", "null"], ["value", "array"]]) {
  assert.equal(comparisonValueFromInput(input, type), undefined);
}

const consequence = { propertyPath:"/oOrder/aProducts", operator:"item-count", parameters:"1" };
const productDetail = {
  propertyPath:"/page_type",
  operator:"Equals",
  comparison:typedComparisonValue("product_detail"),
  detectedType:"string",
};
const currencyEuro = {
  propertyPath:"/currency",
  operator:"Equals",
  comparison:typedComparisonValue("EUR"),
  detectedType:"string",
};
const conditional = { conditionGroup:{ operator:"All", predicates:[productDetail] }, consequence };

assert.equal(
  conditionalRuleSummary(conditional),
  "When page_type equals product_detail, oOrder.aProducts must contain at least 1 item",
);
assert.deepEqual(conditional, {
  conditionGroup:{ operator:"All", predicates:[productDetail] },
  consequence,
});
assert.equal(JSON.stringify(conditional).includes("function"), false);

const predicateCases = [
  [{ value:null, exists:true }, { propertyPath:"/trigger", operator:"Exists" }, true],
  [{ value:undefined, exists:false }, { propertyPath:"/trigger", operator:"Does not exist" }, true],
  [{ value:"product_detail", exists:true }, { ...productDetail, propertyPath:"/trigger" }, true],
  [{ value:1, exists:true }, { propertyPath:"/trigger", operator:"Equals", comparison:typedComparisonValue("1") }, false],
  [{ value:undefined, exists:false }, { propertyPath:"/trigger", operator:"Does not equal", comparison:typedComparisonValue("internal") }, false],
  [{ value:"checkout", exists:true }, { propertyPath:"/trigger", operator:"Is one of", comparisons:[typedComparisonValue("page"), typedComparisonValue("checkout")] }, true],
  [{ value:"product_detail", exists:true }, { propertyPath:"/trigger", operator:"Matches pattern", comparison:typedComparisonValue("^product_") }, true],
  [{ value:6, exists:true }, { propertyPath:"/trigger", operator:"Is greater than", comparison:typedComparisonValue(5) }, true],
  [{ value:5, exists:true }, { propertyPath:"/trigger", operator:"Is at least", comparison:typedComparisonValue(5) }, true],
  [{ value:4, exists:true }, { propertyPath:"/trigger", operator:"Is less than", comparison:typedComparisonValue(5) }, true],
  [{ value:5, exists:true }, { propertyPath:"/trigger", operator:"Is at most", comparison:typedComparisonValue(5) }, true],
  [{ value:"5", exists:true }, { propertyPath:"/trigger", operator:"Is greater than", comparison:typedComparisonValue(4) }, false],
];
for (const [observed, predicate, expected] of predicateCases) {
  assert.equal(evaluateConditionPredicate(observed, predicate), expected);
}

assert.deepEqual(operatorsForConditionType("string"), ["Exists", "Does not exist", "Equals", "Does not equal", "Is one of", "Matches pattern"]);
assert.deepEqual(operatorsForConditionType("number"), ["Exists", "Does not exist", "Equals", "Does not equal", "Is one of", "Is greater than", "Is at least", "Is less than", "Is at most"]);

for (const [operator, results, expected] of [
  ["All", [true, true], true],
  ["All", [true, false], false],
  ["Any", [true, false], true],
  ["Any", [false, false], false],
]) {
  const group = { operator, predicates:[productDetail, currencyEuro] };
  let index = 0;
  assert.equal(conditionGroupApplies(group, () => results[index++]), expected);
}

const invalidCases = [
  [{ conditionGroup:{ operator:"All", predicates:[] }, consequence }, "Add at least one condition"],
  [{ conditionGroup:{ operator:"All", predicates:[{ ...productDetail, propertyPath:"" }] }, consequence }, "Choose a condition property"],
  [{ conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/page_type", operator:"Equals", detectedType:"string" }] }, consequence }, "Enter a comparison value"],
  [{ conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/page_type", operator:"Matches pattern", comparison:typedComparisonValue("["), detectedType:"string" }] }, consequence }, "Correct the regular expression"],
  [{ conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/page_type", operator:"Is greater than", comparison:typedComparisonValue(5), detectedType:"string" }] }, consequence }, "Choose an operator compatible with string"],
  [{ conditionGroup:{ operator:"All", predicates:[productDetail] }, consequence:{ ...consequence, parameters:"1.5" } }, "Correct the consequence rule"],
];
for (const [rule, assistance] of invalidCases) assert.deepEqual(validateConditionalRule(rule), { ready:false, assistance });
assert.deepEqual(validateConditionalRule(conditional), { ready:true, assistance:"Ready to create conditional rule" });

for (const [groupOperator, payload, expected] of [
  ["All", { page_type:"product_detail", currency:"EUR" }, { result:"Passed", invocationCount:1 }],
  ["All", { page_type:"product_detail", currency:"USD" }, { result:"Not applicable", invocationCount:0 }],
  ["Any", { page_type:"product_detail", currency:"USD" }, { result:"Passed", invocationCount:1 }],
  ["Any", { page_type:"category", currency:"USD" }, { result:"Not applicable", invocationCount:0 }],
]) {
  assert.deepEqual(evaluateConditionalRule(payload, { conditionGroup:{ operator:groupOperator, predicates:[productDetail, currencyEuro] }, consequence }, () => true), expected);
}

const correlatedRule = {
  id:"local:product-duration",
  name:"Duration when monthly price exists",
  version:1,
  propertyPath:"/products/*/duration",
  operator:"required",
  conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/products/*/price_monthly", operator:"Exists", detectedType:"number" }] },
};
const correlatedSchema = {
  id:"schema:products",
  name:"Products",
  version:1,
  document:{ type:"object", properties:{ products:{ type:"array", items:{ type:"object", properties:{ price_monthly:{ type:"number" }, duration:{ type:"number" } } } } } },
  assignments:[],
  attachedRules:[correlatedRule],
};
for (const [product, state, issueCount] of [
  [{ price_monthly:29, duration:12 }, "pass", 0],
  [{ price_monthly:null }, "error", 1],
  [{}, "not-applicable", 0],
  [{ duration:12 }, "not-applicable", 0],
]) {
  const result = validateWithSchema({ sourceId:"history", eventName:"product_view", payload:{ products:[product] }, rawInput:[] }, correlatedSchema, []);
  assert.equal(result.evaluations[0].status, state);
  const durationIssues = result.issues.filter(({ instancePath }) => instancePath === "/products/0/duration");
  assert.equal(durationIssues.length, issueCount);
  if (issueCount) {
    assert.equal(durationIssues[0].templatePath, "/products/*/duration");
    assert.match(durationIssues[0].conditionSummary, /price_monthly exists/);
  }
}

const mixed = validateWithSchema({
  sourceId:"history",
  eventName:"product_view",
  payload:{ products:[{ price_monthly:29 }, {}, { duration:12 }, { price_monthly:49, duration:12 }] },
  rawInput:[],
}, correlatedSchema, []);
assert.deepEqual(mixed.evaluations.map(({ propertyPath, status }) => [propertyPath, status]), [
  ["/products/0/duration", "error"],
  ["/products/1/duration", "not-applicable"],
  ["/products/2/duration", "not-applicable"],
  ["/products/3/duration", "pass"],
]);
assert.deepEqual(mixed.issues.map(({ instancePath }) => instancePath), ["/products/0/duration"]);

assert.equal(conditionGroupAppliesToConsequence(
  { products:[{ "a/b":true, "tilde~name":true }] },
  {
    operator:"All",
    predicates:[
      { propertyPath:"/products/*/a~1b", operator:"Exists" },
      { propertyPath:"/products/*/tilde~0name", operator:"Exists" },
    ],
  },
  "/products/*/duration",
  "/products/0/duration",
), true, "correlated paths must preserve escaped JSON Pointer property segments");
