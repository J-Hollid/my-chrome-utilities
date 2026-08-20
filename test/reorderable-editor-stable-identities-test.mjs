import assert from "node:assert/strict";

import { StableIdentitySequence } from "../dist/reorderable-editor/stable-identities.js";

let sequence = 0;
const identities = new StableIdentitySequence("duplicate", () => `stable:${++sequence}`);
identities.reconcile(3);
const original = identities.values();
assert.equal(new Set(original).size, 3, "equal values receive distinct identities");

identities.move(1, 2);
assert.deepEqual(identities.values(), [original[0], original[2], original[1]],
  "the moved item keeps its identity instead of adopting its new position");

identities.remove(0);
identities.append();
assert.deepEqual(identities.values().slice(0, 2), [original[2], original[1]],
  "remove and add preserve every surviving identity");
assert.notEqual(identities.values()[2], original[0], "a new item receives a fresh identity");

console.log("reorderable editor stable identity tests passed");
