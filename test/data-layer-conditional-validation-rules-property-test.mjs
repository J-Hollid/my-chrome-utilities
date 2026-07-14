import assert from "node:assert/strict";

import {
  conditionGroupApplies,
  conditionGroupAppliesToValue,
  conditionValueAtPath,
  conditionalRuleSummary,
  evaluateConditionalRule,
  evaluateConditionPredicate,
  operatorsForConditionType,
  typedComparisonValue,
  validateConditionalRule,
} from "../dist/data-layer-conditional-validation-rules.js";

let seed = 0x4f1bbcdc;

function nextInteger(limit) {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed % limit;
}

function pointerSegment(value) {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

const existenceOperators = ["Exists", "Does not exist"];

for (let sample = 0; sample < 200; sample += 1) {
  const token = `value-${sample}-${nextInteger(1_000_000).toString(36)}`;
  const number = nextInteger(2_001) - 1_000;
  const greater = number + 1 + nextInteger(20);
  const flag = nextInteger(2) === 0;

  for (const value of [token, number, flag, null]) {
    const comparison = typedComparisonValue(value);
    assert.deepEqual(comparison, {
      type:value === null ? "null" : typeof value,
      value,
    });
    assert.equal(
      evaluateConditionPredicate(
        { value, exists:true },
        { operator:"Equals", comparison },
      ),
      true,
    );
    assert.equal(
      evaluateConditionPredicate(
        { value, exists:true },
        { operator:"Does not equal", comparison },
      ),
      false,
    );
  }

  const differentlyTyped = typedComparisonValue(String(number));
  assert.equal(
    evaluateConditionPredicate(
      { value:number, exists:true },
      { operator:"Equals", comparison:differentlyTyped },
    ),
    false,
  );
  for (const operator of ["Equals", "Does not equal", "Is one of"]) {
    assert.equal(
      evaluateConditionPredicate(
        { value:undefined, exists:false },
        { operator, comparison:typedComparisonValue(token), comparisons:[typedComparisonValue(token)] },
      ),
      false,
    );
  }

  assert.equal(
    evaluateConditionPredicate(
      { value:token, exists:true },
      { operator:"Is one of", comparisons:[typedComparisonValue("other"), typedComparisonValue(token)] },
    ),
    true,
  );
  assert.equal(
    evaluateConditionPredicate(
      { value:token, exists:true },
      { operator:"Matches pattern", comparison:typedComparisonValue(`^value-${sample}-`) },
    ),
    true,
  );
  assert.equal(
    evaluateConditionPredicate(
      { value:token, exists:true },
      { operator:"Matches pattern", comparison:typedComparisonValue("[") },
    ),
    false,
  );

  for (const [operator, observed, configured, expected] of [
    ["Is greater than", greater, number, true],
    ["Is at least", number, number, true],
    ["Is less than", number, greater, true],
    ["Is at most", number, number, true],
  ]) {
    assert.equal(
      evaluateConditionPredicate(
        { value:observed, exists:true },
        { operator, comparison:typedComparisonValue(configured) },
      ),
      expected,
    );
  }

  const slashKey = `product/${token}`;
  const tildeKey = `price~${sample}`;
  const payload = {
    [slashKey]:{ [tildeKey]:number },
    page_type:token,
    count:number,
  };
  const pointer = `/${pointerSegment(slashKey)}/${pointerSegment(tildeKey)}`;
  assert.deepEqual(conditionValueAtPath(payload, pointer), { value:number, exists:true });
  assert.deepEqual(conditionValueAtPath(payload, `${pointer}/missing`), { value:undefined, exists:false });

  const outcomes = [flag, nextInteger(2) === 0, nextInteger(2) === 0];
  const predicates = outcomes.map((_, index) => ({ propertyPath:`/value-${index}`, operator:"Exists" }));
  for (const operator of ["All", "Any"]) {
    let index = 0;
    assert.equal(
      conditionGroupApplies(
        { operator, predicates },
        () => outcomes[index++],
      ),
      operator === "All" ? outcomes.every(Boolean) : outcomes.some(Boolean),
    );
  }

  const conditionGroup = {
    operator:"All",
    predicates:[
      { propertyPath:"/page_type", operator:"Equals", comparison:typedComparisonValue(token), detectedType:"string" },
      { propertyPath:"/count", operator:"Is at least", comparison:typedComparisonValue(number), detectedType:"number" },
    ],
  };
  const consequence = { propertyPath:"/items", operator:"item-count", parameters:String(nextInteger(5)) };
  const definition = { conditionGroup, consequence };
  const snapshot = structuredClone(definition);
  assert.equal(conditionGroupAppliesToValue(payload, conditionGroup), true);

  let invocations = 0;
  assert.deepEqual(
    evaluateConditionalRule(payload, definition, () => {
      invocations += 1;
      return flag;
    }),
    { result:flag ? "Passed" : "Failed", invocationCount:1 },
  );
  assert.equal(invocations, 1);

  invocations = 0;
  const inapplicable = {
    ...definition,
    conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/missing", operator:"Exists" }] },
  };
  assert.deepEqual(
    evaluateConditionalRule(payload, inapplicable, () => {
      invocations += 1;
      return true;
    }),
    { result:"Not applicable", invocationCount:0 },
  );
  assert.equal(invocations, 0);

  assert.deepEqual(validateConditionalRule(definition), {
    ready:true,
    assistance:"Ready to create conditional rule",
  });
  assert.match(conditionalRuleSummary(definition), new RegExp(token));
  assert.deepEqual(definition, snapshot);

  assert.deepEqual(operatorsForConditionType("array"), existenceOperators);
  assert.equal(operatorsForConditionType("string").includes("Matches pattern"), true);
  assert.equal(operatorsForConditionType("string").includes("Is greater than"), false);
  assert.equal(operatorsForConditionType("number").includes("Is greater than"), true);
}
