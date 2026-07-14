import assert from "node:assert/strict";

import {
  canonicalNestedPath,
  ensureNestedSchemaPath,
  inspectSpecificIndexRuleTarget,
  nestedTargetChoices,
  resolveNestedValues,
  validateNestedRuleTarget,
} from "../dist/data-layer-schema-nested-path.js";

const valueTypes = ["string", "number", "boolean", "object", "array"];
const invalidIndexes = ["", "-1", "+1", "1.5", "1e2", "index", "9007199254740992"];
let seed = 0x3c6ef372;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

for (let sample = 0; sample < 200; sample += 1) {
  const leaf = `leaf_${nextToken()}`;
  const groupCount = (sample % 5) + 1;
  const itemCount = (sample % 4) + 1;
  const targetType = valueTypes[sample % valueTypes.length];
  const groups = Array.from({ length:groupCount }, (_, groupIndex) => ({
    items:Array.from({ length:itemCount }, (_, itemIndex) => ({
      [leaf]:`${groupIndex}:${itemIndex}:${nextToken()}`,
    })),
  }));
  const payload = { groups, stable:`payload-${sample}` };
  const templatePath = `/groups/*/items/*/${leaf}`;
  const matches = resolveNestedValues(payload, templatePath);

  assert.equal(matches.length, groupCount * itemCount, "nested wildcards must resolve every matching value");
  assert.deepEqual(
    matches.map(({ concretePath }) => concretePath),
    groups.flatMap((group, groupIndex) => group.items.map((_, itemIndex) => `/groups/${groupIndex}/items/${itemIndex}/${leaf}`)),
    "wildcard resolution must preserve stable array order and concrete indexes",
  );
  assert.deepEqual(
    matches.map(({ value }) => value),
    groups.flatMap(({ items }) => items.map((item) => item[leaf])),
    "wildcard resolution must conserve matched values",
  );
  assert.ok(matches.every(({ exists, templatePath:resolvedTemplate }) => exists && resolvedTemplate === templatePath));

  const selectedGroup = sample % groupCount;
  const selectedItem = sample % itemCount;
  const concretePath = `/groups/${selectedGroup}/items/${selectedItem}/${leaf}`;
  assert.equal(
    canonicalNestedPath(`groups.${selectedGroup}.items.${selectedItem}.${leaf}`),
    concretePath,
    "dot and slash paths must normalize to the same concrete path",
  );
  assert.deepEqual(nestedTargetChoices(payload, concretePath), [
    {
      label:"This item only",
      path:concretePath,
      matchedValueCount:1,
      itemNumber:selectedItem + 1,
      zeroBasedIndex:selectedItem,
    },
    {
      label:"This property in every item",
      path:`/groups/${selectedGroup}/items/*/${leaf}`,
      matchedValueCount:itemCount,
    },
  ], "a concrete nested item must offer exact-index and local every-item targets");

  const base = {
    type:"object",
    title:`Schema ${sample}`,
    properties:{ stable:{ type:"string", description:`Stable ${sample}` } },
  };
  const snapshot = structuredClone(base);
  const ensured = ensureNestedSchemaPath(base, templatePath, targetType);
  assert.deepEqual(base, snapshot, "ensuring a nested path must not mutate its source schema");
  assert.equal(ensured.document.title, base.title, "ensuring a nested path must conserve schema metadata");
  assert.deepEqual(ensured.document.properties.stable, base.properties.stable, "ensuring a nested path must conserve unrelated siblings");
  assert.deepEqual(ensured.createdNodes, [
    "/groups",
    "/groups/*",
    "/groups/*/items",
    "/groups/*/items/*",
    templatePath,
  ], "new nested nodes must be reported in root-to-leaf order");
  assert.equal(
    ensured.document.properties.groups.items.properties.items.items.properties[leaf].type,
    targetType,
    "the ensured leaf must retain its requested type",
  );

  const inspection = validateNestedRuleTarget(ensured.document, templatePath);
  assert.equal(inspection.result, "accepted", "an ensured path must be valid for rule authoring");
  assert.equal(inspection.canonicalPath, templatePath);
  assert.equal(inspection.targetType, targetType);

  const specificIndex = sample * 7919;
  assert.deepEqual(inspectSpecificIndexRuleTarget(ensured.document, "groups", ` ${specificIndex} `), {
    result:"accepted",
    assistance:`Item ${specificIndex + 1} at zero-based index ${specificIndex}`,
    canonicalPath:`/groups/${specificIndex}`,
    targetType:"object",
  }, "safe non-negative indices must normalize to an exact array-item target");
  assert.deepEqual(inspectSpecificIndexRuleTarget(ensured.document, "/groups", invalidIndexes[sample % invalidIndexes.length]), {
    result:"blocked",
    assistance:"Enter a non-negative array index",
    canonicalPath:`/groups/${invalidIndexes[sample % invalidIndexes.length]}`,
  }, "malformed or unsafe indices must be rejected without changing their entered path");
  assert.deepEqual(inspectSpecificIndexRuleTarget(ensured.document, "/stable", String(specificIndex)), {
    result:"blocked",
    assistance:"stable is not an array",
    canonicalPath:`/stable/${specificIndex}`,
  }, "specific-index targets must identify an array schema path");

  const repeated = ensureNestedSchemaPath(ensured.document, templatePath, targetType);
  assert.deepEqual(repeated.document, ensured.document, "ensuring an existing path must be idempotent");
  assert.deepEqual(repeated.createdNodes, [], "idempotent path ensuring must not report duplicate nodes");
}

console.log("nested schema path properties: 200 generated cases passed");
