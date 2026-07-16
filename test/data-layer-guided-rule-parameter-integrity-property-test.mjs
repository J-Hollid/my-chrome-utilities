import assert from "node:assert/strict";

import { guidedAttachedRule } from "../dist/data-layer-guided-rule-parameter-integrity.js";
import {
  createSchema,
  createSchemaLibraryExport,
  restoreSchemaLibrary,
  serializeSchemaLibrary,
  validateWithSchema,
} from "../dist/data-layer-schema-verification.js";

let seed = 0x5eed1234;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

function event(payload) {
  return { sourceId:"history", eventName:"pageview", payload, rawInput:[] };
}

for (let sample = 0; sample < 200; sample += 1) {
  const property = `status_${nextToken()}`;
  const path = `/${property}`;
  const values = [`not-${nextToken()}`, `yes-${nextToken()}`];
  const publishedRule = {
    path,
    expectedType:"string",
    requirement:"Must be one of these values",
    values,
    reusableRuleId:`rule:${nextToken()}`,
  };
  const publishedSnapshot = structuredClone(publishedRule);
  const attachment = guidedAttachedRule(publishedRule, `Known status ${sample}`);

  assert.deepEqual(publishedRule, publishedSnapshot, "publishing must not mutate the guided rule");
  assert.equal(attachment.id, publishedRule.reusableRuleId);
  assert.equal(attachment.propertyPath, path);
  assert.equal(attachment.operator, "allowed-values");
  assert.deepEqual(attachment.allowedValues, values);
  assert.equal(attachment.parameters, undefined);
  assert.equal(guidedAttachedRule({ ...publishedRule, path:property }, "Canonical").propertyPath, path);
  assert.equal(guidedAttachedRule({ ...publishedRule, requirement:"Must be present", values:[] }, "Required").parameters, undefined);
  assert.equal(guidedAttachedRule({ ...publishedRule, requirement:"Must match a pattern", values:[`^${values[0]}$`, "ignored"] }, "Pattern").parameters, `^${values[0]}$`);

  const schema = {
    ...createSchema(`Status ${sample} ${nextToken()}`, sample + 1, {
      type:"object",
      properties:{ [property]:{ type:"string" } },
    }),
    attachedRules:[{
      ...(({ allowedValues, ...legacyAttachment }) => legacyAttachment)(attachment),
      version:sample + 2,
      parameters:`${path}:${values.join(",")}`,
      severity:sample % 2 ? "warning" : "error",
      message:`Use a known status ${sample}`,
    }],
  };
  const schemaSnapshot = structuredClone(schema);
  const restored = restoreSchemaLibrary(serializeSchemaLibrary([schema]))[0];
  const restoredRule = restored.attachedRules[0];

  assert.deepEqual(schema, schemaSnapshot, "canonical storage must not mutate source schemas");
  assert.equal(restoredRule.propertyPath, path);
  assert.deepEqual(restoredRule.allowedValues, values);
  assert.equal(restoredRule.parameters, undefined);
  for (const field of ["id", "name", "version", "severity", "message", "enabled"]) {
    assert.equal(restoredRule[field], schema.attachedRules[0][field], `${field} metadata must survive migration`);
  }
  assert.deepEqual(
    restoreSchemaLibrary(serializeSchemaLibrary([restored])),
    [restored],
    "canonical storage must be idempotent",
  );
  assert.deepEqual(
    createSchemaLibraryExport([schema], []).schemas[0].attachedRules,
    restored.attachedRules,
    "exports must use the same canonical attachment representation",
  );

  for (const value of values) {
    assert.equal(validateWithSchema(event({ [property]:value }), restored, []).state, "Valid");
  }
  assert.notEqual(validateWithSchema(event({ [property]:`other-${nextToken()}` }), restored, []).state, "Valid");

  const prefixedValue = sample % 2 ? `urn:${nextToken()}` : `/other_${nextToken()}:${nextToken()}`;
  const prefixSchema = {
    ...schema,
    attachedRules:[{ ...schema.attachedRules[0], allowedValues:[prefixedValue, values[1]], parameters:undefined }],
  };
  const prefixRestored = restoreSchemaLibrary(serializeSchemaLibrary([prefixSchema]))[0];
  assert.deepEqual(prefixRestored.attachedRules[0].allowedValues, [prefixedValue, values[1]]);
  assert.equal(prefixRestored.attachedRules[0].parameters, undefined);
  assert.equal(validateWithSchema(event({ [property]:prefixedValue }), prefixRestored, []).state, "Valid");

  const inferred = restoreSchemaLibrary(JSON.stringify([{
    ...schema,
    attachedRules:[{ ...schema.attachedRules[0], propertyPath:undefined, parameters:`${property}:${values.join(",")}` }],
  }]))[0];
  assert.equal(inferred.attachedRules[0].propertyPath, path);
  assert.deepEqual(inferred.attachedRules[0].allowedValues, values);
  assert.equal(inferred.attachedRules[0].parameters, undefined);

  const missingPath = `missing_${nextToken()}`;
  const uninferred = restoreSchemaLibrary(JSON.stringify([{
    ...schema,
    attachedRules:[{ ...schema.attachedRules[0], propertyPath:undefined, parameters:`${missingPath}:${values.join(",")}` }],
  }]))[0].attachedRules[0];
  assert.equal(uninferred.propertyPath, `/${missingPath}`);
  assert.deepEqual(uninferred.allowedValues, values);
  assert.equal(uninferred.parameters, undefined);

  const wildcardPath = `/products/*/${property}`;
  const wildcardSchema = {
    ...createSchema(`Products ${sample} ${nextToken()}`, 1, {
      type:"object",
      properties:{ products:{ type:"array", items:{ type:"object", properties:{ [property]:{ type:"string" } } } } },
    }),
    attachedRules:[{ ...attachment, propertyPath:wildcardPath }],
  };
  const wildcardResult = validateWithSchema(event({ products:[
    { [property]:values[0] },
    { [property]:values[1] },
    { [property]:`other-${nextToken()}` },
  ] }), wildcardSchema, []);
  assert.deepEqual(wildcardResult.evaluations.map(({ propertyPath, status }) => [propertyPath, status]), [
    [`/products/0/${property}`, "pass"],
    [`/products/1/${property}`, "pass"],
    [`/products/2/${property}`, "error"],
  ]);
  assert.equal(wildcardResult.issues[0].templatePath, wildcardPath);
}

console.log("data-layer guided rule parameter integrity property tests passed");
