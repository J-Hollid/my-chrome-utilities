import assert from "node:assert/strict";

const { SchemaPropertyController } = await import(
  "../../../dist/data-layer-installed/schemas/property-controller.js"
);

const controller = new SchemaPropertyController();
let reviewClosed = 0;
let dialogReset = 0;
controller.selectedPath = "/checkout/email";
controller.expandedRulePaths.add("/checkout/email");
controller.pendingRemoval = { path:"/checkout/email" };
controller.pendingCopy = { sourceSchemaId:"schema:one" };
controller.pendingCopyReview = { close:() => { reviewClosed += 1; } };
controller.pendingCopyPosition = { schemaId:"schema:one", settlementSchemaId:"schema:two", path:"/checkout/email", editorScroll:12, treeScroll:24 };
controller.interactionReturn = { schemaId:"schema:one", path:"/checkout/email", triggerLabel:"Copy", editorScroll:1, treeScroll:2, detailScroll:3 };

controller.dispose(() => { dialogReset += 1; });
assert.equal(reviewClosed, 1);
assert.equal(dialogReset, 1);
assert.equal(controller.pendingRemoval, undefined);
assert.equal(controller.pendingCopy, undefined);
assert.equal(controller.pendingCopyPosition, undefined);
assert.equal(controller.interactionReturn, undefined);
assert.equal(controller.expandedRulePaths.size, 0);
assert.equal(controller.selectedPath, "/checkout/email", "dispose preserves the current property selection");
