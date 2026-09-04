import assert from "node:assert/strict";

const { SchemaGuidedValidationController } = await import(
  "../../../dist/data-layer-installed/schemas/guided-validation-controller.js"
);

const values = new Map();
const controller = new SchemaGuidedValidationController({
  getItem:(key) => values.get(key) ?? null,
  setItem:(key, value) => values.set(key, value),
});
controller.select({ sourceId:"gtm", name:"checkout" }, "schema:one");
assert.equal(Object.keys(controller.selections).length, 1);
controller.propertyReturn = { kind:"capture", eventId:"event:one", propertyPath:"/email", generation:3 };
let disposed = 0;
controller.ownDialog(() => { disposed += 1; });
controller.ownLiveProperty(() => { disposed += 1; });
controller.ownAllowedValue(() => { disposed += 1; });
assert.equal(controller.dialogListenerCount(), 1);
controller.dispose();
assert.equal(disposed, 3);
assert.equal(controller.propertyReturn, undefined);
