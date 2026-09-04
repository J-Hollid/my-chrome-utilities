import assert from "node:assert/strict";

const { SchemaValidationController } = await import(
  "../../../dist/data-layer-installed/schemas/validation-controller.js"
);

const values = new Map();
const controller = new SchemaValidationController({
  getItem:(key) => values.get(key) ?? null,
  setItem:(key, value) => values.set(key, value),
});
controller.addRecord({ eventId:"event:one", eventName:"checkout", state:"Valid", checkedAt:"now", issueCodes:[] });
controller.setManualOverride("event:one", "schema:one");
assert.equal(controller.records.length, 1);
assert.equal(controller.manualOverrides["event:one"], "schema:one");
assert.equal(values.size, 2, "record and manual override bytes have separate keys");
let disposed = 0;
controller.ownRow(() => { disposed += 1; });
controller.ownDialog(() => { disposed += 1; });
controller.dispose();
assert.equal(disposed, 2);
