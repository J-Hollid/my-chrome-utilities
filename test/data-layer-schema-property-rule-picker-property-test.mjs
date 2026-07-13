import assert from "node:assert/strict";

import {
  builtInRulesForProperty,
  reusableRulesForProperty,
  ruleTypeAvailability,
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
