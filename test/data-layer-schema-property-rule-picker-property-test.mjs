import assert from "node:assert/strict";

import {
  applicablePropertyTypesForRule,
  builtInRulesForProperty,
  canonicalRulePropertyPath,
  configuredRuleDetails,
  createRuleConfiguration,
  reusableRuleMetadata,
  reusableRulesForProperty,
  ruleConfigurationControls,
  ruleTypeAvailability,
  validateRuleConfiguration,
} from "../dist/data-layer-schema-property-rule-picker.js";

const compatibility = {
  Required:["string", "number", "array", "object", "boolean"],
  "Exact value":["string", "number", "boolean"],
  "Allowed values":["string", "number", "boolean"],
  "Regular expression":["string"],
  "Text length":["string"],
  "Digits only":["string"],
  "Numeric range":["number"],
  "Item count":["array"],
  "Allow undeclared properties":["object"],
};
const propertyTypes = ["string", "number", "array", "object", "boolean"];
const ruleTypes = Object.keys(compatibility);

for (const propertyType of propertyTypes) {
  const expectedRuleTypes = ruleTypes.filter((ruleType) => compatibility[ruleType].includes(propertyType));
  assert.deepEqual(
    builtInRulesForProperty(propertyType).map(({ name }) => name),
    expectedRuleTypes,
    "built-in choices must match the declared compatibility matrix",
  );
  for (const ruleType of ruleTypes) {
    const expected = compatibility[ruleType].includes(propertyType) ? "available" : "unavailable";
    assert.equal(ruleTypeAvailability(propertyType, ruleType), expected, "availability must match built-in filtering");
  }
}

let seed = 0x3c6ef372;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

for (let sample = 0; sample < 200; sample += 1) {
  const propertyType = propertyTypes[sample % propertyTypes.length];
  const incompatibleType = propertyTypes[(sample + 1) % propertyTypes.length];
  const token = nextToken();
  assert.equal(
    canonicalRulePropertyPath(` /root_${token} . child_${sample}/ `),
    `/root_${token}/child_${sample}`,
    "rule paths must use one canonical slash representation",
  );
  const compatible = {
    id:`compatible-${token}`,
    name:`Rule ${token}`,
    kind:`Custom ${incompatibleType}`,
    operator:`operator-${token}`,
    parameters:`parameter-${token}`,
    description:`description-${token}`,
    applicableType:propertyType,
    version:sample + 1,
  };
  const incompatible = { ...compatible, id:`incompatible-${token}`, applicableType:incompatibleType };
  const disabled = { ...compatible, id:`disabled-${token}`, enabled:false };
  const rules = [compatible, incompatible, disabled];
  const snapshot = structuredClone(rules);

  const blankResults = reusableRulesForProperty(rules, propertyType, "  ", new Set([compatible.id]));
  assert.deepEqual(blankResults, [{ ...compatible, alreadyAttached:true }], "blank search must retain compatible enabled rules in order");
  assert.deepEqual(rules, snapshot, "rule filtering must not mutate the Rule Library input");

  for (const query of [
    compatible.name,
    compatible.kind,
    compatible.operator,
    compatible.parameters,
    compatible.description,
    propertyType,
    `version ${compatible.version}`,
  ]) {
    assert.deepEqual(
      reusableRulesForProperty(rules, propertyType, `  ${query.toUpperCase()}  `, new Set()).map(({ id }) => id),
      [compatible.id],
      "search must match every readable metadata field without case or edge-whitespace sensitivity",
    );
  }

  assert.equal(
    reusableRulesForProperty(rules, propertyType, "", new Set()).at(0).alreadyAttached,
    false,
    "attachment state must come only from the supplied attached identities",
  );
  assert.deepEqual(
    reusableRulesForProperty(rules, propertyType, `missing-${nextToken()}`, new Set()),
    [],
    "a missing query must not leak incompatible or disabled rules",
  );
}

const defaultVersionRule = { id:"default-version", name:"Default version", kind:"Required" };
assert.deepEqual(
  reusableRulesForProperty([defaultVersionRule], "boolean", "version 1", new Set()).map(({ id }) => id),
  [defaultVersionRule.id],
  "rules without an explicit version must remain searchable as version 1",
);

const requiredPropertyTypes = ["string", "number", "boolean", "object", "array"];
for (let sample = 0; sample < 200; sample += 1) {
  const token = nextToken();
  const required = {
    id:`required-${token}`,
    name:`Required ${token}`,
    kind:sample % 2 === 0 ? `Legacy Required ${token}` : `Presence ${token}`,
    ...(sample % 2 === 0 ? {} : { operator:"required" }),
    applicableType:propertyTypes[sample % propertyTypes.length],
    version:sample % 9 + 1,
    enabled:true,
  };
  const snapshot = structuredClone(required);

  assert.deepEqual(applicablePropertyTypesForRule(required), requiredPropertyTypes,
    "Required compatibility must override a legacy stored applicable type");
  for (const propertyType of requiredPropertyTypes) {
    assert.deepEqual(
      reusableRulesForProperty([required], propertyType, token, new Set()).map(({ id }) => id),
      [required.id],
      "Required rules must remain reusable for every property type",
    );
    assert.match(reusableRuleMetadata(required, propertyType), /type any/,
      "Required metadata must disclose type-independent compatibility");
  }
  assert.deepEqual(required, snapshot,
    "compatibility checks must not rewrite legacy Required rule records");
}

const validConfiguration = (ruleType, sample, token) => {
  const propertyType = ruleType === "Numeric range"
    ? "number"
    : ruleType === "Item count"
      ? "array"
      : ruleType === "Allow undeclared properties"
        ? "object"
      : ruleType === "Exact value" || ruleType === "Allowed values"
        ? ["string", "number", "boolean"][sample % 3]
        : "string";
  const configuration = createRuleConfiguration(ruleType, propertyType);
  if (ruleType === "Exact value") configuration.exactValue = ` value-${token} `;
  if (ruleType === "Allowed values") configuration.allowedValues = propertyType === "number"
    ? [` ${sample} `, "", ` ${sample + 1} `]
    : propertyType === "boolean"
      ? [" true ", "", " false "]
      : [` value-${token} `, "", `other-${sample}`];
  if (ruleType === "Regular expression") configuration.pattern = `^value-${token}[0-9]*$`;
  if (ruleType === "Text length" || ruleType === "Item count") {
    configuration.comparison = sample % 2 ? ">=" : "<=";
    configuration.limit = ` ${sample} `;
  }
  if (ruleType === "Numeric range") {
    configuration.minimum = ` ${sample - 100} `;
    configuration.maximum = ` ${sample + 1} `;
  }
  return configuration;
};

const expectedDetails = (configuration) => {
  const { ruleType } = configuration;
  if (ruleType === "Required") return { operator:"required" };
  if (ruleType === "Exact value") return { operator:"exact-value", parameters:configuration.exactValue };
  if (ruleType === "Allowed values") return {
    operator:"allowed-values",
    allowedValues:configuration.allowedValues.map((value) => value.trim()).filter(Boolean).map((value) => configuration.propertyType === "number" ? Number(value) : configuration.propertyType === "boolean" ? value === "true" : value),
  };
  if (ruleType === "Regular expression") return { operator:"regular-expression", parameters:configuration.pattern };
  if (ruleType === "Text length" || ruleType === "Item count") return {
    operator:ruleType === "Text length" ? "text-length" : "item-count",
    parameters:configuration.limit,
    comparison:configuration.comparison,
    limit:Number(configuration.limit),
  };
  if (ruleType === "Digits only") return { operator:"digits-only" };
  if (ruleType === "Numeric range") return { operator:"numeric-range", parameters:`${configuration.minimum.trim()},${configuration.maximum.trim()}` };
  return { operator:"allow-undeclared-properties" };
};

const invalidConfiguration = (ruleType, sample) => {
  const configuration = validConfiguration(ruleType, sample, "invalid");
  if (ruleType === "Exact value") configuration.exactValue = "   ";
  if (ruleType === "Allowed values") configuration.allowedValues = ["", "   "];
  if (ruleType === "Regular expression") configuration.pattern = "[";
  if (ruleType === "Text length" || ruleType === "Item count") configuration.limit = sample % 2 ? "-1" : "1.5";
  if (ruleType === "Numeric range") {
    configuration.minimum = sample % 3 === 0 ? "" : sample % 3 === 1 ? "not-a-number" : "10";
    configuration.maximum = sample % 3 === 0 ? "" : sample % 3 === 1 ? "20" : "5";
  }
  return configuration;
};

for (let sample = 0; sample < 200; sample += 1) {
  const ruleType = ruleTypes[sample % ruleTypes.length];
  const token = nextToken();
  const configuration = validConfiguration(ruleType, sample, token);
  const snapshot = structuredClone(configuration);

  assert.deepEqual(validateRuleConfiguration(configuration), { ready:true, assistance:"Ready to create rule" }, "generated valid configurations must remain creatable");
  assert.deepEqual(configuredRuleDetails(configuration), expectedDetails(configuration), "configured details must conserve the generated rule parameters");
  assert.deepEqual(configuration, snapshot, "validation and formatting must not mutate configuration state");

  const controls = ruleConfigurationControls(ruleType, configuration.propertyType);
  assert.equal(new Set(controls.map(({ key }) => key)).size, controls.length, "configuration controls must have unique state keys");
  assert.ok(controls.every(({ minimum, step }) => minimum === undefined || minimum >= 0 && step === 1), "bounded whole-number controls must expose non-negative unit steps");
  if (ruleType === "Exact value" || ruleType === "Allowed values") {
    assert.equal(controls[0].inputType, configuration.propertyType === "number" ? "number" : configuration.propertyType === "boolean" ? "select" : "text");
  }

  const reusable = { ...structuredClone(configuration), saveReusable:true, reusableName:"" };
  assert.deepEqual(validateRuleConfiguration(reusable), { ready:false, assistance:"Enter a rule name" }, "reusable creation must require a non-blank name after local configuration is valid");
  reusable.reusableName = ` Rule ${token} `;
  assert.equal(validateRuleConfiguration(reusable).ready, true, "a generated reusable name must unblock an otherwise valid configuration");

  if (ruleType !== "Required" && ruleType !== "Digits only" && ruleType !== "Allow undeclared properties") {
    assert.equal(validateRuleConfiguration(invalidConfiguration(ruleType, sample)).ready, false, "generated malformed parameters must remain blocked");
  }

  const independent = createRuleConfiguration(ruleType, configuration.propertyType);
  configuration.allowedValues.push(`mutated-${token}`);
  assert.deepEqual(independent.allowedValues, [""], "new configurations must not share repeatable-value state");
}

console.log("schema property rule configuration properties: 200 generated cases passed");
