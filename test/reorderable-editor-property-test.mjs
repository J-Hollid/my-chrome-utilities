import assert from "node:assert/strict";

import {
  reorderControlModel,
  reorderItems,
  reorderPlacementIndex,
} from "../dist/reorderable-editor/model.js";
import { StableIdentitySequence } from "../dist/reorderable-editor/stable-identities.js";

let seed = 0x6d2b79f5;
const random = (limit) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed % limit;
};

for (let sample = 0; sample < 400; sample += 1) {
  const length = 2 + random(18);
  const items = Array.from({ length }, (_, index) => ({
    id:`item:${sample}:${index}`,
    value:index % 3,
    selected:index % 2 === 0,
  }));
  const from = random(length);
  const to = random(length);
  const moved = reorderItems(items, items[from].id, to);

  assert.deepEqual(new Set(moved.map(({ id }) => id)), new Set(items.map(({ id }) => id)),
    "movement is identity-conserving");
  assert.ok(moved.every((item) => items.includes(item)), "movement preserves values and selections by reference");
  assert.deepEqual(reorderItems(moved, items[from].id, from), items,
    "the inverse index restores the exact prior sequence");
  assert.deepEqual(reorderItems(items, "missing", to), items, "unknown identities are boundary no-ops");
  assert.deepEqual(reorderItems(items, items[from].id, from), items, "same-index moves are no-ops");

  const destination = random(length);
  const placement = random(2) === 0 ? "before" : "after";
  const placementIndex = reorderPlacementIndex(items, items[from].id, items[destination].id, placement);
  assert.ok(placementIndex >= 0 && placementIndex < length, "placement remains inside the legal list");

  const legalDestinationIds = items
    .filter(() => random(2) === 0)
    .map(({ id }) => id);
  const control = reorderControlModel({
    itemId:items[from].id,
    itemLabel:items[from].id,
    completeOrder:items,
    legalDestinationIds,
  });
  const hasLegalDestination = legalDestinationIds.some((id) => id !== items[from].id);
  assert.equal(control.actionable, hasLegalDestination,
    "a control is actionable exactly when its ordering scope has another legal item");
  assert.equal(control.actionable, control.actions.some(({ disabled }) => !disabled),
    "actionability agrees with the movement menu");

  let identityNumber = 0;
  const identities = new StableIdentitySequence("generated", () => `identity:${sample}:${++identityNumber}`);
  identities.reconcile(length);
  const stable = identities.values()[from];
  identities.move(from, to);
  assert.equal(identities.values()[to], stable, "stable identity follows the moved item");
}

const singleton = reorderControlModel({
  itemId:"only",
  itemLabel:"Only",
  completeOrder:[{ id:"only" }],
});
assert.equal(singleton.actionable, false,
  "a singleton default ordering scope has no legal movement outcome");

console.log("reorderable editor properties: 400 generated cases passed");
