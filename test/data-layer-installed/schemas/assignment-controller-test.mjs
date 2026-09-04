import assert from "node:assert/strict";

const { installSchemaAssignmentElements, SchemaAssignmentController } = await import(
  "../../../dist/data-layer-installed/schemas/assignment-controller.js"
);

const selectors = [];
const installed = installSchemaAssignmentElements({
  querySelector(selector) { selectors.push(selector); return null; },
});
assert.equal(selectors.includes("#schema-assignment-editor"), true);
assert.equal(installed.editor, null, "assignment element ownership keeps absent optional controls absent");

const controller = new SchemaAssignmentController({
  elements:{ editor:null, source:null, event:null, priority:null, save:null, target:null, domain:null,
    pathname:null, versionPolicy:null, enabled:null, list:null, conflicts:null, schema:null, conditions:null, result:null },
  schemas:() => [], replaceSchemas() {}, persistAndRender() {}, capturedValue:() => undefined, renderConditions() {},
});
controller.editing = { schemaId:"schema:one", assignmentId:"assignment:one" };
controller.conditions = { target:"payload", suggestions:["checkout.email"], group:{ operator:"All", predicates:[] } };
let disposed = 0;
controller.own(() => { disposed += 1; });
controller.dispose();
assert.equal(controller.editing, undefined);
assert.deepEqual(controller.conditions, { target:"payload", suggestions:[] });
assert.equal(disposed, 1, "assignment disposal removes its open review actions");
