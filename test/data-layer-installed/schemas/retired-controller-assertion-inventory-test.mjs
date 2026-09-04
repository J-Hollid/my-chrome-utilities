import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { retiredSchemaControllerAssertionInventory as inventory } from "./retired-controller-assertion-inventory.mjs";

assert.equal(inventory.length, 16, "each retired behavior family has one inventory record");
assert.equal(inventory.every(({owner}) => owner.endsWith("-test.mjs")), true,
  "each retired behavior family maps to an executable direct owner");
assert.equal(inventory.reduce((sum, { count }) => sum + count, 0), 325,
  "the complete retired assertion-call inventory is accounted for");
assert.equal(new Set(inventory.map(({ lines }) => lines)).size, inventory.length,
  "retired source ranges do not have duplicate owners");
for (const { owner, count, group } of inventory) {
  assert.ok(count > 0, `${group} has a non-empty retired assertion set`);
  await access(owner);
}
