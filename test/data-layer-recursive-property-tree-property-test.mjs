import assert from "node:assert/strict";

import {
  buildRecursivePropertyTree,
  inspectValidationTarget,
  normalizeTargetExpression,
  parseTargetExpression,
  resolveTargetValues,
  searchRecursivePropertyTree,
} from "../dist/data-layer-recursive-property-tree.js";

let seed = 0x510e527f;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

function flatten(nodes) {
  return nodes.flatMap((node) => [node, ...flatten(node.children), ...flatten(node.specificItems)]);
}

for (let sample = 0; sample < 200; sample += 1) {
  const root = `root_${nextToken()}`;
  const array = `items_${nextToken()}`;
  const leaf = `leaf_${nextToken()}`;
  const itemCount = (sample % 5) + 2;
  const missingLast = sample % 2 === 0;
  const presentCount = itemCount - (missingLast ? 1 : 0);
  const values = Array.from({ length:itemCount }, (_, index) => ({
    ...(missingLast && index === itemCount - 1 ? {} : { [leaf]:`value-${sample}-${index}` }),
    mixed:index % 2 === 0 ? index : String(index),
    nested:[[index, index + 1]],
    "1":`numeric-${index}`,
    "*":`star-${index}`,
  }));
  const payload = {
    [root]:{
      [array]:values,
      "a/b":{ "~name":`escaped-${sample}` },
    },
    stable:`stable-${sample}`,
  };
  const snapshot = structuredClone(payload);
  const tree = buildRecursivePropertyTree(payload);
  const nodes = flatten(tree);
  const byPath = new Map(nodes.map((node) => [node.path, node]));
  const arrayPath = `/${root}/${array}`;
  const everyPath = `${arrayPath}/*`;
  const leafPath = `${everyPath}/${leaf}`;

  assert.deepEqual(payload, snapshot, "recursive tree construction must not mutate the captured payload");
  assert.equal(new Set(nodes.map(({ expression }) => expression)).size, nodes.length, "typed expressions must uniquely identify every generated node");
  assert.equal(byPath.get(arrayPath).summary, `Array · ${itemCount} items`, "array summaries must conserve observed item counts");
  assert.equal(byPath.get(everyPath).matchedValueCount, itemCount, "Every item must aggregate the complete array");
  assert.equal(byPath.get(arrayPath).specificItems.length, itemCount, "specific items must preserve concrete array cardinality");
  assert.deepEqual(byPath.get(arrayPath).specificItems.map(({ zeroBasedIndex }) => zeroBasedIndex), Array.from({ length:itemCount }, (_, index) => index));
  assert.equal(byPath.get(leafPath).matchedValueCount, presentCount, "missing object properties must not invent values");
  assert.equal(
    byPath.get(leafPath).summary,
    presentCount < itemCount ? `String · present in ${presentCount} of ${itemCount} items` : `String · ${itemCount} observed values`,
    "leaf summaries must distinguish partial presence from repeated observations",
  );

  const inspection = inspectValidationTarget(payload, leafPath);
  assert.equal(inspection.result, "accepted", "a generated wildcard leaf must be accepted");
  assert.equal(inspection.expression, `$[${JSON.stringify(root)}][${JSON.stringify(array)}][*][${JSON.stringify(leaf)}]`);
  assert.equal(inspection.matchedValueCount, presentCount);
  assert.deepEqual(inspection.detectedTypes, ["String"]);
  assert.equal(inspection.requiresExpectedType, false);
  assert.deepEqual(resolveTargetValues(payload, leafPath), values.flatMap((value) => leaf in value ? [value[leaf]] : []), "wildcard resolution must preserve source order");
  assert.equal(normalizeTargetExpression(leafPath, payload), inspection.expression, "slash and typed wildcard paths must normalize identically");
  assert.deepEqual(parseTargetExpression(inspection.expression).map(({ kind, value }) => [kind, value]), [
    ["property", root], ["property", array], ["every", null], ["property", leaf],
  ], "normalized expressions must round-trip to their typed segments");

  const selectedIndex = sample % itemCount;
  const numericPropertyPath = `${arrayPath}/${selectedIndex}/1`;
  const numericExpression = `$[${JSON.stringify(root)}][${JSON.stringify(array)}][${selectedIndex}]["1"]`;
  assert.equal(normalizeTargetExpression(numericPropertyPath, payload), numericExpression, "numeric object properties must remain distinct from array indexes");
  assert.deepEqual(resolveTargetValues(payload, numericExpression), [`numeric-${selectedIndex}`]);
  const literalStar = `$[${JSON.stringify(root)}][${JSON.stringify(array)}][${selectedIndex}]["*"]`;
  assert.notEqual(normalizeTargetExpression(literalStar, payload), normalizeTargetExpression(`${arrayPath}/*`, payload), "literal-star properties and wildcard segments must retain distinct identities");
  assert.deepEqual(resolveTargetValues(payload, literalStar), [`star-${selectedIndex}`]);

  assert.equal(normalizeTargetExpression(`/${root}/a~1b/~0name`, payload), `$[${JSON.stringify(root)}]["a/b"]["~name"]`, "JSON-pointer escaping must round-trip special property names");
  const mixed = inspectValidationTarget(payload, `${everyPath}/mixed`);
  assert.equal(mixed.result, "accepted");
  assert.equal(mixed.requiresExpectedType, true, "mixed observed types must require an explicit expected type");
  assert.deepEqual(new Set(mixed.detectedTypes), new Set(["Number", "String"]));

  const search = searchRecursivePropertyTree(tree, leaf, new Set([`/${root}`]));
  assert.deepEqual(search.matches, [leafPath], "search must retain the matching leaf in its hierarchy");
  assert.deepEqual(search.expanded, [`/${root}`, arrayPath, everyPath], "search must open each generated ancestor in root-to-leaf order");
  assert.deepEqual(search.restoreExpanded, [`/${root}`], "search must preserve the prior expansion snapshot");

  assert.deepEqual(inspectValidationTarget(payload, `${arrayPath}/-1`), { result:"blocked", assistance:"Enter a non-negative array index" });
  assert.deepEqual(inspectValidationTarget(payload, `${arrayPath}/1.5`), { result:"blocked", assistance:"Enter a non-negative whole-number array index" });
  const unobserved = inspectValidationTarget(payload, `${everyPath}/missing_${nextToken()}`);
  assert.equal(unobserved.result, "unobserved");
  assert.equal(unobserved.requiresExpectedType, true);
  assert.equal(unobserved.matchedValueCount, 0);
}

console.log("recursive property tree properties: 200 generated cases passed");
