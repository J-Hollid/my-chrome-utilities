import assert from "node:assert/strict";
const { createSchemasInstalledController } = await import("../../dist/data-layer-installed/schemas/index.js");
let validations = 0;
const controller = createSchemasInstalledController({
  loadSchemas:() => [{id:"schema:1",name:"Page"}], persistDraft:async()=>{},
  validateCurrentSchema:async()=>{ validations += 1; }, runGuidedValidation:async()=>{},
});
controller.mount(); controller.open("schema:1"); controller.markDraftDirty();
await controller.validate();
assert.equal(validations, 1);
assert.deepEqual(controller.state(), {activeSchemaId:"schema:1",draftDirty:true,schemaCount:1});
controller.dispose(); controller.mount();
assert.equal(controller.state().activeSchemaId, "schema:1");
