import assert from "node:assert/strict";

const { SchemaCanonicalEditorController } = await import(
  "../../../dist/data-layer-installed/schemas/canonical-editor-controller.js"
);

const controller = new SchemaCanonicalEditorController();
controller.pendingCommand = { kind:"select", baseRevision:1, propertyId:"property:one" };
controller.pendingBase = { revision:1, rootId:"root", contributorId:"schema:one", contributorName:"One", nodes:{} };
controller.reviewVisible = true;
controller.commandFeedback = "Review";
controller.revisionSnapshots.set(1, controller.pendingBase);
controller.reopenSelection = "saved:schema:one";
controller.presenceDraft = { propertyId:"property:one", baseRevision:1, mode:"required" };
let disposed = 0;
controller.contextDisposers.push(() => { disposed += 1; });

controller.disposeState();
assert.equal(disposed, 1);
assert.equal(controller.pendingCommand, undefined);
assert.equal(controller.pendingBase, undefined);
assert.equal(controller.reviewVisible, false);
assert.equal(controller.revisionSnapshots.size, 0);
assert.equal(controller.historyState.pending, undefined);
assert.equal(controller.reopenSelection, undefined);
