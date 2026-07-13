import assert from "node:assert/strict";

import {
  builtInRulesForProperty,
  reusableRulesForProperty,
  ruleTypeAvailability,
} from "../dist/data-layer-schema-property-rule-picker.js";

assert.equal(ruleTypeAvailability("string", "Required"), "available");
assert.equal(ruleTypeAvailability("string", "Regular expression"), "available");
assert.equal(ruleTypeAvailability("number", "Numeric range"), "available");
assert.equal(ruleTypeAvailability("array", "Item count"), "available");
assert.equal(ruleTypeAvailability("number", "Regular expression"), "unavailable");
assert.equal(ruleTypeAvailability("object", "Allowed values"), "unavailable");

assert.deepEqual(builtInRulesForProperty("string").map(({ name }) => name), ["Required", "Allowed values", "Regular expression"]);

const reusable = [
  { id:"approved", name:"Approved pages", kind:"Allowed values", operator:"allowed values", parameters:"homepage, checkout", description:"Public pages", applicableType:"string", version:2 },
  { id:"numbers", name:"Revenue range", kind:"Numeric range", operator:"numeric range", parameters:"0–100", description:"Revenue", applicableType:"number", version:3 },
  { id:"disabled", name:"Old pages", kind:"Allowed values", applicableType:"string", version:1, enabled:false },
];

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
