import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { retiredSchemaControllerAssertionInventory as inventory } from "./retired-controller-assertion-inventory.mjs";

assert.equal(inventory.length, 16, "each retired behavior family has one inventory record");
assert.equal(inventory.every(({owner}) => owner.endsWith("-test.mjs")), true,
  "each retired behavior family maps to an executable direct owner");
assert.equal(inventory.reduce((sum, { count }) => sum + count, 0), 345,
  "the inventory counts every retired executable assertion call");
assert.equal(new Set(inventory.map(({ lines }) => lines)).size, inventory.length,
  "retired source ranges do not have duplicate owners");

const ownerSources = new Map();
for (const { owner } of inventory) {
  if (!ownerSources.has(owner)) ownerSources.set(owner, await readFile(owner, "utf8"));
}
const occurrences = new Map();
for (const [owner, source] of ownerSources) {
  const handlerPattern = /"([a-z0-9-]+)": \(\.\.\.args\) => assert\.([A-Za-z]+)\(\.\.\.args\),/gu;
  const compositionPattern = /\/\/ retired-schema-assertion: ([a-z0-9-]+)\s+assert\.([A-Za-z]+)\(/gu;
  for (const pattern of [handlerPattern, compositionPattern]) {
    for (const match of source.matchAll(pattern)) {
      const [, id, method] = match;
      const matches = occurrences.get(id) ?? [];
      matches.push({ owner, method });
      occurrences.set(id, matches);
    }
  }
}

for (const { owner, group, checks } of inventory) {
  assert.ok(checks.length > 0, `${group} has a non-empty retired assertion set`);
  for (const { id, method } of checks) {
    assert.deepEqual(occurrences.get(id), [{ owner, method }],
      `${id} occurs once, with its original assertion method, in its direct executable owner`);
  }
}
const declaredIds = inventory.flatMap(({ checks }) => checks.map(({ id }) => id));
assert.equal(new Set(declaredIds).size, declaredIds.length, "retired assertion IDs are unique");
assert.equal(occurrences.size, declaredIds.length, "owners contain no undeclared retired assertion IDs");
for (const [owner, source] of ownerSources) {
  if (owner.endsWith("schemas-composition-test.mjs")) continue;
  assert.match(source, /await runRetiredSchemaControllerScenario\(retiredSchemaAssertions\);/u,
    `${owner} executes its registered retired assertions`);
}
