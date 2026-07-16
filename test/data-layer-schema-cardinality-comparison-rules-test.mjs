import assert from "node:assert/strict";

import {
  configuredRuleDetails,
  createRuleConfiguration,
  createRuleConfigurationFromAttachedRule,
  ruleConfigurationControls,
  validateRuleConfiguration,
} from "../dist/data-layer-schema-property-rule-picker.js";
import { validateWithSchema } from "../dist/data-layer-schema-verification.js";

const comparisons = [">", ">=", "==", "<", "<="];
for (const [ruleType, propertyType] of [["Text length", "string"], ["Item count", "array"]]) {
  const controls = ruleConfigurationControls(ruleType, propertyType);
  assert.deepEqual(controls.map(({ label }) => label), ["Comparison", "Limit"]);
  assert.deepEqual(controls[0].choices, comparisons);
  assert.deepEqual({ minimum:controls[1].minimum, step:controls[1].step }, { minimum:0, step:1 });

  const empty = createRuleConfiguration(ruleType, propertyType);
  assert.deepEqual(validateRuleConfiguration(empty), { ready:false, assistance:"Choose a comparison" });
  assert.deepEqual(validateRuleConfiguration({ ...empty, comparison:"<=" }), { ready:false, assistance:"Enter a non-negative whole number" });
  for (const limit of ["-1", "1.5"]) {
    assert.deepEqual(validateRuleConfiguration({ ...empty, comparison:"<=", limit }), { ready:false, assistance:"Enter a non-negative whole number" });
  }

  assert.deepEqual(configuredRuleDetails({ ...empty, comparison:"<=", limit:"50" }), {
    operator:ruleType === "Text length" ? "text-length" : "item-count",
    parameters:"50",
    comparison:"<=",
    limit:50,
  });
}

assert.deepEqual(createRuleConfigurationFromAttachedRule("Text length", "string", {
  id:"legacy-text", version:1, operator:"text-length", parameters:"8",
}), { ...createRuleConfiguration("Text length", "string"), comparison:"==", limit:"8" });
assert.deepEqual(createRuleConfigurationFromAttachedRule("Item count", "array", {
  id:"legacy-items", version:1, operator:"item-count", parameters:"1",
}), { ...createRuleConfiguration("Item count", "array"), comparison:">=", limit:"1" });

const event = (titleLength, itemCount) => ({
  sourceId:"history", eventName:"pageview", rawInput:[],
  payload:{ title:"x".repeat(titleLength), items:Array.from({ length:itemCount }, () => ({})) },
});
const schemaFor = (ruleType, comparison) => ({
  id:`schema:${ruleType}:${comparison}`, name:"Cardinality", version:1, assignments:[],
  document:{ type:"object", properties:{ title:{ type:"string" }, items:{ type:"array", items:{ type:"object" } } } },
  attachedRules:[{
    id:"cardinality", version:1,
    propertyPath:ruleType === "Text length" ? "/title" : "/items",
    operator:ruleType === "Text length" ? "text-length" : "item-count",
    comparison, limit:50, parameters:"50",
  }],
});
const expectedPasses = {
  ">":[false, false, true], ">=":[false, true, true], "==":[false, true, false],
  "<":[true, false, false], "<=":[true, true, false],
};
for (const ruleType of ["Text length", "Item count"]) for (const comparison of comparisons) {
  const schema = schemaFor(ruleType, comparison);
  for (const [offset, expectedPass] of expectedPasses[comparison].entries()) {
    const cardinality = 49 + offset;
    const result = validateWithSchema(event(
      ruleType === "Text length" ? cardinality : 1,
      ruleType === "Item count" ? cardinality : 1,
    ), schema, [schema]);
    assert.equal(result.issues.length === 0, expectedPass, `${ruleType} ${comparison} ${cardinality}`);
    if (!expectedPass) {
      assert.equal(result.issues[0].actual, String(cardinality));
      assert.match(result.issues[0].expected, ruleType === "Text length" ? /text length/ : /item count/);
    }
  }
}

console.log("schema cardinality comparison rule tests passed");
