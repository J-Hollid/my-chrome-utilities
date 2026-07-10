import assert from "node:assert/strict";

import {
  filterPaletteCommands,
  selectedPaletteIndexForKey,
} from "../dist/command-palette.js";
import { listCommands } from "../dist/commands.js";

const commands = listCommands();

assert.deepEqual(
  filterPaletteCommands(commands, "save data layer").map(({ id }) => id),
  ["data-layer.save-session"],
);
assert.deepEqual(
  filterPaletteCommands(commands, "navigation.show-hotkeys").map(({ id }) => id),
  ["navigation.show-hotkeys"],
);
assert.equal(selectedPaletteIndexForKey("ArrowDown", 0, 3), 1);
assert.equal(selectedPaletteIndexForKey("ArrowUp", 0, 3), 2);
assert.equal(selectedPaletteIndexForKey("Home", 2, 3), 0);
assert.equal(selectedPaletteIndexForKey("End", 0, 3), 2);
assert.equal(selectedPaletteIndexForKey("Enter", 1, 3), undefined);
