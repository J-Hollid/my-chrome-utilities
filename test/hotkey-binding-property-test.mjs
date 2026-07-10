import assert from "node:assert/strict";

import { changeHotkeyBinding } from "../dist/hotkey-keymap.js";

let seed = 0x243f6a88;

function nextInteger(limit) {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed % limit;
}

function sequence(sample, offset) {
  return `C-${String.fromCharCode(97 + ((sample + offset) % 26))}`;
}

for (let sample = 0; sample < 200; sample += 1) {
  const target = `command.target-${nextInteger(1000)}`;
  const existing = `command.existing-${nextInteger(1000)}`;
  const priorSequence = sequence(sample, 0);
  const existingSequence = sequence(sample, 1);
  const replacement = sequence(sample, 2);
  const keymap = {
    schemaVersion: 1,
    bindings: {
      [target]: priorSequence,
      [existing]: existingSequence,
    },
  };

  const changed = changeHotkeyBinding(keymap, target, `  ${replacement}  `);
  assert.equal(changed.sequence, replacement);
  assert.equal(changed.keymap?.bindings[target], replacement);
  assert.equal(keymap.bindings[target], priorSequence);

  const cleared = changeHotkeyBinding(keymap, target, "   ");
  assert.equal(cleared.sequence, "");
  assert.equal(cleared.keymap?.bindings[target], "");
  assert.equal(keymap.bindings[target], priorSequence);

  const conflict = changeHotkeyBinding(keymap, target, existingSequence);
  assert.equal(conflict.keymap, undefined);
  assert.equal(conflict.sequence, existingSequence);
  assert.equal(conflict.conflictingCommandId, existing);
  assert.equal(keymap.bindings[target], priorSequence);
}
