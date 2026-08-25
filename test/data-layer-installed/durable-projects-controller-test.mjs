import assert from "node:assert/strict";
const { createDurableProjectsInstalledController } = await import("../../dist/data-layer-installed/durable-projects/index.js");
let starts = 0, stops = 0;
const controller = createDurableProjectsInstalledController({ startRepository:async()=>{starts += 1; return ()=>{stops += 1;};},
  reviewMigration:async()=>{}, retryFailedSave:async()=>{}, rejectFailedSave:async()=>{} });
await controller.mount(); await controller.mount(); assert.equal(starts, 1);
controller.dispose(); controller.dispose(); assert.equal(stops, 1);
assert.equal(controller.state().phase, "idle");
