import assert from "node:assert/strict";

import {
  reorderControlModel,
  reorderItems,
  reorderPlacementIndex,
} from "../dist/reorderable-editor/model.js";

const items = [
  { id:"alpha", label:"Alpha", checked:false, value:"first" },
  { id:"bravo", label:"Bravo", checked:true, value:"edited" },
  { id:"charlie", label:"Charlie", checked:false, value:"third" },
  { id:"delta", label:"Delta", checked:false, value:"fourth" },
];

const filtered = reorderControlModel({
  itemId:"bravo",
  itemLabel:"Bravo",
  completeOrder:items,
  filterActive:true,
});

assert.equal(filtered.accessibleName, "Reorder Bravo, position 2 of 4");
assert.equal(filtered.canDrag, false, "filtering makes relative dragging ambiguous");
assert.deepEqual(filtered.actions.map(({ label, disabled }) => [label, disabled]), [
  ["Move to first", false],
  ["Move one position earlier", false],
  ["Move one position later", false],
  ["Move to last", false],
  ["Move…", false],
]);
assert.deepEqual(filtered.destinations.map(({ itemId, label }) => [itemId, label]), [
  ["alpha", "Alpha"],
  ["charlie", "Charlie"],
  ["delta", "Delta"],
], "Move… derives destinations from the complete unfiltered order");

const boundary = reorderControlModel({
  itemId:"alpha",
  itemLabel:"Alpha",
  completeOrder:items,
});
assert.deepEqual(boundary.actions.map(({ disabled }) => disabled),
  [true, true, false, false, false],
  "boundary actions stay present but disabled");

const segment = reorderControlModel({
  itemId:"bravo",
  itemLabel:"Step 3",
  completeOrder:items,
  legalDestinationIds:["alpha", "bravo"],
  scopeLabel:"/products",
});
assert.equal(segment.actions.find(({ id }) => id === "later").disabled, true);
assert.equal(segment.guidance, "Reordering stays within /products.");
assert.deepEqual(segment.destinations.map(({ itemId }) => itemId), ["alpha"]);

const moved = reorderItems(items, "bravo", 3);
assert.deepEqual(moved.map(({ id }) => id), ["alpha", "charlie", "delta", "bravo"]);
assert.equal(moved[3], items[1], "reordering preserves the stable item object and edited state");
assert.deepEqual(items.map(({ id }) => id), ["alpha", "bravo", "charlie", "delta"],
  "reordering does not mutate the prior order");

assert.equal(reorderPlacementIndex(items, "bravo", "delta", "after"), 3);
assert.equal(reorderPlacementIndex(items, "bravo", "alpha", "before"), 0);
assert.equal(reorderPlacementIndex(items, "bravo", "bravo", "after"), 1,
  "an invalid self destination is a no-op");

console.log("reorderable editor model tests passed");
