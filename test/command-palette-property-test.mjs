import assert from "node:assert/strict";

import {
  filterPaletteCommands,
  selectedPaletteIndexForKey,
} from "../dist/command-palette.js";
import { listCommands } from "../dist/commands.js";

const commands = listCommands();
const searchableFields = ["id", "title", "description", "category"];

for (let sample = 0; sample < 200; sample += 1) {
  const command = commands[sample % commands.length];
  const field = searchableFields[sample % searchableFields.length];
  const value = command[field];
  const start = sample % value.length;
  const end = Math.max(start + 1, (sample * 7) % (value.length + 1));
  const query = `  ${value.slice(start, end).toUpperCase()}  `;
  const normalized = query.trim().toLowerCase();
  const filtered = filterPaletteCommands(commands, query);

  assert.ok(filtered.includes(command));
  assert.ok(filtered.every((candidate) =>
    `${candidate.id} ${candidate.title} ${candidate.description} ${candidate.category}`
      .toLowerCase()
      .includes(normalized)));
}

assert.strictEqual(filterPaletteCommands(commands, "   "), commands);

for (let count = 1; count <= 200; count += 1) {
  for (let selectedIndex = 0; selectedIndex < count; selectedIndex += 1) {
    const next = selectedPaletteIndexForKey("ArrowDown", selectedIndex, count);
    const previous = selectedPaletteIndexForKey("ArrowUp", selectedIndex, count);

    assert.ok(next >= 0 && next < count);
    assert.ok(previous >= 0 && previous < count);
    assert.equal(selectedPaletteIndexForKey("ArrowUp", next, count), selectedIndex);
    assert.equal(selectedPaletteIndexForKey("ArrowDown", previous, count), selectedIndex);
    assert.equal(selectedPaletteIndexForKey("Home", selectedIndex, count), 0);
    assert.equal(selectedPaletteIndexForKey("End", selectedIndex, count), count - 1);
  }
}

assert.equal(selectedPaletteIndexForKey("ArrowDown", 0, 0), undefined);
assert.equal(selectedPaletteIndexForKey("not-a-navigation-key", 0, 3), undefined);
