import assert from "node:assert/strict";
import {
  applicablePropertyTypesForRule,
  reusableRuleMetadata,
  reusableRulesForProperty,
} from "../dist/data-layer-schema-property-rule-picker.js";

const propertyTypes = ["string", "number", "boolean", "object", "array"];
const required = {
  id:"reusable-required-7",
  name:"Product-detail requirement",
  kind:"Required · string",
  operator:"required",
  applicableType:"string",
  version:3,
  enabled:true,
  severity:"error",
  message:"Product detail requires this property",
  conditionGroup:{
    operator:"All",
    predicates:[{ propertyPath:"/page_type", operator:"Equals", comparison:{ type:"string", value:"product_detail" }, detectedType:"string" }],
  },
  attachments:["schema-page", "schema-purchase"],
  revisionHistory:[{ name:"Product-detail requirement", kind:"Required · string", operator:"required", applicableType:"string", version:2 }],
};

assert.deepEqual(applicablePropertyTypesForRule(required), propertyTypes);
for (const propertyType of propertyTypes) {
  assert.deepEqual(
    reusableRulesForProperty([required], propertyType, "", new Set()).map(({ id }) => id),
    ["reusable-required-7"],
  );
  assert.match(reusableRuleMetadata(required, propertyType), /type any/);
}

const serialized = JSON.stringify(required);
reusableRulesForProperty([required], "array", "product_detail", new Set());
assert.equal(JSON.stringify(required), serialized, "legacy Required rules must not be rewritten or revised");

const incompatible = [
  { id:"allowed", name:"Approved page types", kind:"Allowed values", operator:"allowed-values", applicableType:"string", enabled:true },
  { id:"range", name:"Revenue range", kind:"Numeric range", operator:"numeric-range", applicableType:"number", enabled:true },
  { id:"count", name:"Product count", kind:"Item count", operator:"item-count", applicableType:"array", enabled:true },
];
assert.deepEqual(reusableRulesForProperty(incompatible, "number", "", new Set()).map(({ id }) => id), ["range"]);
assert.deepEqual(reusableRulesForProperty(incompatible, "string", "", new Set()).map(({ id }) => id), ["allowed"]);
assert.deepEqual(reusableRulesForProperty(incompatible, "object", "", new Set()).map(({ id }) => id), []);

console.log("data-layer Required rule type-independence tests passed");
