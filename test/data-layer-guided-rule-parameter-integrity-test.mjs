import assert from "node:assert/strict";
import { guidedAttachedRule } from "../dist/data-layer-guided-rule-parameter-integrity.js";
import {
  createSchema,
  createSchemaLibraryExport,
  restoreSchemaLibrary,
  serializeSchemaLibrary,
  validateWithSchema,
} from "../dist/data-layer-schema-verification.js";

const guidedRule = {
  path:"/login_status",
  expectedType:"string",
  requirement:"Must be one of these values",
  values:["not logged in", "logged in"],
  reusableRuleId:"rule:known-login-status",
};
const attachment = guidedAttachedRule(guidedRule, "Known login status");
assert.deepEqual(attachment, {
  id:"rule:known-login-status",
  name:"Known login status",
  version:1,
  propertyPath:"/login_status",
  operator:"allowed-values",
  parameters:"not logged in,logged in",
  severity:"error",
  enabled:true,
});
assert.equal(guidedAttachedRule({ ...guidedRule, requirement:"Must be present", values:[] }).parameters, undefined);
assert.equal(guidedAttachedRule({ ...guidedRule, requirement:"Must match a pattern", values:["^not logged in$"] }).parameters, "^not logged in$");
assert.equal(guidedAttachedRule({ ...guidedRule, path:" login_status " }, "Known login status").propertyPath, "/login_status");

const legacy = {
  ...createSchema("Login status", 1, { type:"object", properties:{ login_status:{ type:"string" } } }),
  attachedRules:[{
    id:"rule:login-status",
    name:"Known login status",
    version:4,
    propertyPath:"/login_status",
    operator:"allowed-values",
    parameters:"/login_status:not logged in,logged in",
    severity:"warning",
    message:"Choose a known status",
  }],
};
const passing = validateWithSchema({ sourceId:"history", eventName:"pageview", payload:{ login_status:"not logged in" }, rawInput:[] }, legacy, []);
assert.equal(passing.state, "Valid");
assert.deepEqual(passing.evaluations, [{
  propertyPath:"/login_status",
  status:"pass",
  message:"Choose a known status",
  expected:"not logged in,logged in",
  actual:"not logged in",
  rule:"Known login status",
  ruleVersion:4,
  severity:"warning",
  schemaName:"Login status",
  schemaVersion:1,
}]);

const restored = restoreSchemaLibrary(serializeSchemaLibrary([legacy]))[0];
assert.equal(restored.attachedRules[0].propertyPath, "/login_status");
assert.equal(restored.attachedRules[0].parameters, "not logged in,logged in");
assert.equal(restored.attachedRules[0].id, legacy.attachedRules[0].id);
assert.equal(restored.attachedRules[0].version, legacy.attachedRules[0].version);
assert.equal(restored.attachedRules[0].severity, legacy.attachedRules[0].severity);
assert.equal(restored.attachedRules[0].message, legacy.attachedRules[0].message);
assert.equal(createSchemaLibraryExport([legacy], []).schemas[0].attachedRules[0].parameters, "not logged in,logged in");

for (const [parameters, actual] of [
  ["urn:status:not-logged-in,logged in", "urn:status:not-logged-in"],
  ["/other_status:not-logged-in,logged in", "/other_status:not-logged-in"],
]) {
  const result = validateWithSchema(
    { sourceId:"history", eventName:"pageview", payload:{ login_status:actual }, rawInput:[] },
    { ...legacy, attachedRules:[{ ...legacy.attachedRules[0], parameters }] },
    [],
  );
  assert.equal(result.state, "Valid", `must preserve allowed value ${actual}`);
}

const inferred = restoreSchemaLibrary(JSON.stringify([{ ...legacy, attachedRules:[{
  ...legacy.attachedRules[0],
  propertyPath:undefined,
  parameters:"login_status:not logged in,logged in",
}] }]))[0];
assert.equal(inferred.attachedRules[0].propertyPath, "/login_status");
assert.equal(inferred.attachedRules[0].parameters, "not logged in,logged in");

const wildcard = {
  ...createSchema("Product statuses", 1, { type:"object", properties:{ products:{ type:"array", items:{ type:"object", properties:{ login_status:{ type:"string" } } } } } }),
  attachedRules:[{
    ...attachment,
    id:"rule:product-login-status",
    propertyPath:"/products/*/login_status",
  }],
};
const wildcardResult = validateWithSchema({
  sourceId:"history",
  eventName:"pageview",
  payload:{ products:[
    { login_status:"not logged in" },
    { login_status:"logged in" },
    { login_status:"logged out" },
  ] },
  rawInput:[],
}, wildcard, []);
assert.deepEqual(wildcardResult.evaluations.map(({ propertyPath, status }) => [propertyPath, status]), [
  ["/products/0/login_status", "pass"],
  ["/products/1/login_status", "pass"],
  ["/products/2/login_status", "error"],
]);
assert.equal(wildcardResult.issues[0].instancePath, "/products/2/login_status");
assert.equal(wildcardResult.issues[0].templatePath, "/products/*/login_status");

console.log("data-layer guided rule parameter integrity tests passed");
