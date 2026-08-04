import assert from "node:assert/strict";

import {
  listCommands,
  runCommandById,
} from "../dist/commands.js";

const records = listCommands().map(({ id }) => {
  const observed = [];
  runCommandById(id, {
    record(entry) {
      observed.push(entry);
    },
    showWorkspace() {},
    showDataLayerView() {},
  });
  assert.equal(observed.length, 1, `${id} did not emit exactly one visible record`);
  assert.equal(observed[0].commandId, id, `${id} emitted a record for another command`);
  assert.ok(observed[0].message.trim(), `${id} emitted an empty visible message`);
  return observed[0];
});

const demoRecord = records.find(({ commandId }) => commandId === "demo.say-hello");
assert.ok(demoRecord, "The demo command was not exercised");
assert.match(demoRecord.message, /demo\.say-hello/);
assert.throws(
  () => runCommandById("missing.command", { record() {} }),
  /Unknown command: missing\.command/,
);

console.log(JSON.stringify({ commandRegistry: { records } }));
