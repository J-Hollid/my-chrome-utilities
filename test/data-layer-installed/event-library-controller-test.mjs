import assert from "node:assert/strict";
const { createEventLibraryInstalledController } = await import("../../dist/data-layer-installed/event-library/index.js");
const controller = createEventLibraryInstalledController({
  loadTemplates:() => [{id:"template:1",name:"Page view"}], persistTemplates:async()=>{},
  reviewTransfer:async()=>{}, pushSelectedTemplate:async()=>{},
});
controller.mount(); controller.select("template:1"); controller.beginDraft("template:1");
assert.deepEqual(controller.state(), {selectedId:"template:1",draftId:"template:1",templateCount:1});
controller.dispose(); controller.mount();
assert.equal(controller.state().draftId, "template:1");
