import assert from "node:assert/strict";

import {
  applicablePropertyTypesForRule,
  builtInRulesForProperty,
  canonicalRulePropertyPath,
  configuredRuleDetails,
  createRuleConfiguration,
  ruleConfigurationControls,
  validateRuleConfiguration,
  reusableRulesForProperty,
  reusableRuleMetadata,
  ruleTypeAvailability,
} from "../dist/data-layer-schema-property-rule-picker.js";

assert.equal(canonicalRulePropertyPath("page_type"), "/page_type");
assert.equal(canonicalRulePropertyPath(" /product . sku/ "), "/product/sku");
assert.equal(canonicalRulePropertyPath('$["a/b"]["~name"][*][0]'), "/a~1b/~0name/*/0");

assert.deepEqual(applicablePropertyTypesForRule({ id:"explicit", name:"Explicit", kind:"Numeric range · number", applicableType:"string" }), ["string"]);

assert.equal(ruleTypeAvailability("string", "Required"), "available");
assert.equal(ruleTypeAvailability("string", "Regular expression"), "available");
assert.equal(ruleTypeAvailability("number", "Numeric range"), "available");
assert.equal(ruleTypeAvailability("array", "Item count"), "available");
assert.equal(ruleTypeAvailability("number", "Regular expression"), "unavailable");
assert.equal(ruleTypeAvailability("object", "Allowed values"), "unavailable");

assert.deepEqual(builtInRulesForProperty("string").map(({ name }) => name), ["Required", "Exact value", "Allowed values", "Regular expression", "Text length", "Digits only"]);

const reusable = [
  { id:"approved", name:"Approved pages", kind:"Allowed values", operator:"allowed values", parameters:"homepage, checkout", description:"Public pages", applicableType:"string", version:2 },
  { id:"numbers", name:"Revenue range", kind:"Numeric range", operator:"numeric range", parameters:"0–100", description:"Revenue", applicableType:"number", version:3 },
  { id:"disabled", name:"Old pages", kind:"Allowed values", applicableType:"string", version:1, enabled:false },
];
const canonicalReusable={id:"canonical",name:"Canonical pages",kind:"Allowed values",operator:"allowed-values",allowedValues:["homepage","checkout"],applicableType:"string",version:4};
assert.deepEqual(reusableRulesForProperty([canonicalReusable],"string","checkout",new Set()).map(({id})=>id),["canonical"]);
assert.equal(reusableRuleMetadata(canonicalReusable,"string"),"allowed-values · Allowed values: homepage, checkout · type string · version 4");

for (const query of ["Approved pages", "allowed values", "checkout", "public pages", "string", "version 2"]) {
  assert.deepEqual(reusableRulesForProperty(reusable, "string", query, new Set()).map(({ id }) => id), ["approved"]);
}
assert.deepEqual(reusableRulesForProperty(reusable, "string", "", new Set(["approved"])), [{ ...reusable[0], alreadyAttached:true }]);

const legacyReusable = [
  { id:"legacy-values", name:"Legacy values", kind:"Allowed values", operator:"allowed values" },
  { id:"unknown", name:"Custom legacy rule", kind:"custom" },
];
assert.deepEqual(reusableRulesForProperty(legacyReusable, "string", "", new Set()).map(({ id }) => id), ["legacy-values"]);
assert.deepEqual(reusableRulesForProperty(legacyReusable, "object", "", new Set()), []);

const expectedControls = {
  "Required":[],
  "Exact value":["Exact value"],
  "Allowed values":["Allowed values"],
  "Regular expression":["Pattern"],
  "Text length":["Comparison", "Limit"],
  "Digits only":[],
  "Numeric range":["Minimum", "Maximum"],
  "Item count":["Comparison", "Limit"],
  "Allow undeclared properties":[],
};
for (const [ruleType, labels] of Object.entries(expectedControls)) {
  const propertyType = ruleType === "Numeric range" ? "number" : ruleType === "Item count" ? "array" : ruleType === "Allow undeclared properties" ? "object" : "string";
  assert.deepEqual(ruleConfigurationControls(ruleType, propertyType).map(({ label }) => label), labels);
}
assert.equal(ruleConfigurationControls("Exact value", "number")[0].inputType, "number");
assert.equal(ruleConfigurationControls("Exact value", "boolean")[0].inputType, "select");
assert.equal(ruleConfigurationControls("Allowed values", "number")[0].inputType, "number");
assert.equal(ruleConfigurationControls("Allowed values", "boolean")[0].inputType, "select");
assert.equal(ruleConfigurationControls("Text length", "string")[1].minimum, 0);
assert.equal(ruleConfigurationControls("Item count", "array")[1].step, 1);

const configuration = createRuleConfiguration("Allowed values", "string");
assert.deepEqual(configuration, {
  ruleType:"Allowed values",
  propertyType:"string",
  exactValue:"",
  allowedValues:[""],
  pattern:"",
  exactLength:"",
  minimum:"",
  maximum:"",
  minimumItemCount:"",
  comparison:"",
  limit:"",
  severity:"error",
  message:"",
  enabled:true,
  saveReusable:false,
  reusableName:"",
  description:"",
  applyOnlyWhen:false,
  conditionGroupOperator:"All",
  conditions:[],
});

const validationCases = [
  [{ ...createRuleConfiguration("Exact value", "string") }, "Enter an exact value"],
  [{ ...createRuleConfiguration("Allowed values", "string") }, "Add at least one allowed value"],
  [{ ...createRuleConfiguration("Regular expression", "string"), pattern:"[" }, "Correct the regular expression"],
  [{ ...createRuleConfiguration("Text length", "string"), exactLength:"-1" }, "Enter a non-negative whole number"],
  [{ ...createRuleConfiguration("Numeric range", "number") }, "Enter at least one boundary"],
  [{ ...createRuleConfiguration("Numeric range", "number"), minimum:"10", maximum:"5" }, "Make minimum less than maximum"],
  [{ ...createRuleConfiguration("Item count", "array"), minimumItemCount:"1.5" }, "Enter a non-negative whole number"],
  [{ ...createRuleConfiguration("Allowed values", "string"), allowedValues:["ABC-1"], saveReusable:true }, "Enter a rule name"],
];
for (const [draft, assistance] of validationCases) assert.deepEqual(validateRuleConfiguration(draft), { ready:false, assistance });

const readyAllowed = { ...configuration, allowedValues:["ABC-1", "XYZ-2"], severity:"warning", message:"Use an approved SKU" };
assert.deepEqual(validateRuleConfiguration(readyAllowed), { ready:true, assistance:"Ready to create rule" });
assert.deepEqual(configuredRuleDetails(readyAllowed), { operator:"allowed-values", allowedValues:["ABC-1","XYZ-2"] });
assert.deepEqual(configuredRuleDetails({ ...createRuleConfiguration("Numeric range", "number"), minimum:"10" }), { operator:"numeric-range", parameters:"10," });
