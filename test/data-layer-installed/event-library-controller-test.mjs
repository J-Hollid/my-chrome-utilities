import assert from "node:assert/strict";
const { createEventLibraryInstalledController } = await import("../../dist/data-layer-installed/event-library/index.js");
const template = { id:"template:1", name:"Page view", eventName:"page_view", sourceId:"history",
  sourceName:"History", destination:"event.history", tags:[], validation:"Not checked", payload:{ page:"/" },
  version:1, provenance:"captured" };
const values = new Map([["my-chrome-utilities.event-template-library.v1", JSON.stringify([template])]]);
let changed = 0, pushed;
const controller = createEventLibraryInstalledController({
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value) },
  defaultPushPath:() => "event.history", push:async (value) => { pushed = value.id; },
  changed:() => { changed += 1; }, createId:() => "template:2",
});
controller.mount(); controller.select("template:1"); controller.beginDraft("template:1");
assert.equal(controller.state().editor.template.id, "template:1");
controller.saveRevision();
assert.equal(controller.templates()[0].version, 2, "Event Library owns revision mutation and persistence");
await controller.pushSelected(); assert.equal(pushed, "template:1");
controller.reviewImport(JSON.stringify({ format:"my-chrome-utilities.event-library", version:1,
  templates:[{ ...template, id:"template:imported", name:"Imported" }] }));
controller.commitImport("append");
assert.equal(controller.templates().length, 2, "Event Library owns reviewed import settlement");
controller.requestDelete("template:imported"); controller.confirmDelete();
assert.deepEqual(controller.templates().map(({ id }) => id), ["template:1"]);
assert.equal(changed, 3);
controller.dispose(); controller.dispose(); controller.mount();
assert.equal(controller.state().editor, undefined, "dispose clears transient editor ownership");
assert.equal(controller.templates()[0].version, 2, "durable template ownership survives remount");
