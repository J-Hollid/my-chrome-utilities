import assert from "node:assert/strict";
const { createDurableProjectsInstalledController } = await import("../../dist/data-layer-installed/durable-projects/index.js");
let starts = 0, stops = 0;
const controller = createDurableProjectsInstalledController({ startRepository:async()=>{starts += 1; return ()=>{stops += 1;};},
  reviewMigration:async()=>{}, retryFailedSave:async()=>{}, rejectFailedSave:async()=>{} });
await controller.mount(); await controller.mount(); assert.equal(starts, 1);
controller.dispose(); controller.dispose(); assert.equal(stops, 1);
assert.equal(controller.state().phase, "idle");
let release;
const late = createDurableProjectsInstalledController({ startRepository:()=>new Promise((resolve)=>{ release=resolve; }),
  reviewMigration:async()=>{}, retryFailedSave:async()=>{}, rejectFailedSave:async()=>{} });
const mounting = late.mount(); late.dispose(); release(()=>{stops += 1;}); await mounting;
assert.equal(stops, 2, "a repository resolving after disposal is stopped immediately");
assert.equal(late.state().phase, "idle");
