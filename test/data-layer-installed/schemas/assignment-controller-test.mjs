import assert from "node:assert/strict";

const { SchemaAssignmentController } = await import(
  "../../../dist/data-layer-installed/schemas/assignment-controller.js"
);

const controller = new SchemaAssignmentController();
controller.editing = { schemaId:"schema:one", assignmentId:"assignment:one" };
controller.conditions = { target:"payload", suggestions:["checkout.email"], group:{ operator:"All", predicates:[] } };
let disposed = 0;
controller.own(() => { disposed += 1; });
controller.dispose();
assert.equal(controller.editing, undefined);
assert.deepEqual(controller.conditions, { target:"payload", suggestions:[] });
assert.equal(disposed, 1, "assignment disposal removes its open review actions");
