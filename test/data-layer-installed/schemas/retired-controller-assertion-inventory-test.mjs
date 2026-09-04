import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { retiredSchemaControllerAssertionInventory as inventory } from "./retired-controller-assertion-inventory.mjs";

assert.equal(inventory.length, 16, "each retired behavior family has one inventory record");
assert.equal(inventory.every(({owner}) => owner.endsWith("-test.mjs")), true,
  "each retired behavior family maps to an executable direct owner");
assert.equal(inventory.reduce((sum, { count }) => sum + count, 0), 347,
  "the inventory counts every retired executable assertion call");
assert.equal(new Set(inventory.map(({ lines }) => lines)).size, inventory.length,
  "retired source ranges do not have duplicate owners");

const ownerSources = new Map();
for (const { owner } of inventory) {
  if (!ownerSources.has(owner)) ownerSources.set(owner, await readFile(owner, "utf8"));
}
const occurrences = new Map();
for (const [owner, source] of ownerSources) {
  for (const marker of source.matchAll(/\/\/ retired-schema-assertion: ([a-z0-9-]+)/gu)) {
    const directCall = source.slice(marker.index + marker[0].length).match(
      /^(?:\s*\/\/ retired-schema-assertion: [a-z0-9-]+)*\s*assert\.([A-Za-z]+)\(/u,
    );
    assert.ok(directCall, `${marker[1]} is followed by a direct executable assertion`);
    const id = marker[1];
    const matches = occurrences.get(id) ?? [];
    matches.push({ owner, method:directCall[1] });
    occurrences.set(id, matches);
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
  assert.equal(source.includes("runRetiredSchemaControllerScenario"), false,
    `${owner} does not proxy retired checks through an aggregate installed scenario`);
}
const supportSource = await readFile("test/support/schema-library-fake-dom.mjs", "utf8");
assert.equal(supportSource.includes("createSchemasInstalledController"), false,
  "shared fake DOM support does not mount the aggregate installed controller");
