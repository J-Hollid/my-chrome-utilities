import assert from "node:assert/strict";
const { createSchemasInstalledController } = await import("../../dist/data-layer-installed/schemas/index.js");
const schema = { id:"schema:page", name:"Page", version:1, document:{ type:"object", properties:{ title:{ type:"string" } } },
  assignments:[], published:true };
const values = new Map([["my-chrome-utilities.schema-library.v1", JSON.stringify([schema])]]);
let changed = 0, guided;
const controller = createSchemasInstalledController({
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  changed:() => { changed += 1; }, runGuidedValidation:async (id) => { guided = id; },
});
controller.mount(); controller.open("schema:page"); controller.beginDraft();
controller.updateDraft({ document:{ type:"object", required:["title"], properties:{ title:{ type:"string" } } } }, "Require title");
assert.equal(controller.state().draftDirty, true);
const evaluation = controller.validate({ sourceId:"history", eventName:"page_view", payload:{}, rawInput:{} });
assert.equal(evaluation.state, "Not checked", "unassigned events retain the exact validation contract");
const published = controller.publish();
assert.equal(published.version, 2, "Schemas exclusively owns draft publication");
assert.equal(published.document.required[0], "title");
await controller.runGuidedValidation(); assert.equal(guided, "schema:page");
assert.ok(changed >= 3);
controller.dispose(); controller.mount();
assert.equal(controller.state().activeSchemaId, "schema:page");
assert.equal(controller.state().draftDirty, false);
