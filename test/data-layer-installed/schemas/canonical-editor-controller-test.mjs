import assert from "node:assert/strict";

const { SchemaCanonicalEditorController } = await import(
  "../../../dist/data-layer-installed/schemas/canonical-editor-controller.js"
);
const { SchemaCanonicalInstalledView } = await import(
  "../../../dist/data-layer-installed/schemas/canonical-installed-view.js"
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
const view = new SchemaCanonicalInstalledView({});
view.ownContext(() => { disposed += 1; });

controller.disposeState();
view.dispose();

// retired-schema-assertion: canonical-edit-history-settlement-overlay-001
assert.equal(disposed, 1);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-049
assert.equal(controller.pendingCommand, undefined);

// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-006
assert.equal(controller.pendingBase, undefined);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-032
assert.equal(controller.reviewVisible, false);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-006
assert.equal(controller.revisionSnapshots.size, 0);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-015
assert.equal(controller.historyState.pending, undefined);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-008
assert.equal(controller.reopenSelection, undefined);

const calls=[];
const behaviorController=new SchemaCanonicalEditorController({
  blocked:()=>false,generation:()=>7,isCurrent:(value)=>value===7,
  setBusy:(value)=>calls.push(["busy",value]),renderContext:()=>calls.push("context"),
  renderEditor:()=>calls.push("editor"),createId:()=>"id:one",mounted:()=>true,
});

// retired-schema-assertion: canonical-edit-history-settlement-overlay-042
assert.equal(behaviorController.createCanonicalId("property"),"schema:property:1");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-017
assert.equal(behaviorController.createCanonicalId("rule"),"schema:rule:2");
behaviorController.rememberScroll("saved:one",44);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-024
assert.equal(behaviorController.scrollByKey.get("saved:one"),44);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-019
assert.equal(behaviorController.savedSchemaId({key:"saved:schema:one"}),"schema:one");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-012
assert.equal(behaviorController.savedSchemaId({key:"project:one"}),undefined);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-020
assert.equal(behaviorController.savedSchemaId(undefined),undefined);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-006
assert.ok(!behaviorController.semanticUnresolved());
behaviorController.pendingCommand={kind:"select",baseRevision:1,propertyId:"property:one"};

// retired-schema-assertion: rule-revision-attachment-sync-deletion-001
assert.ok(behaviorController.semanticUnresolved());
behaviorController.pendingBase={revision:1,rootId:"root",contributorId:"schema:one",contributorName:"One",nodes:{}};
behaviorController.rejectDurableChange();

// retired-schema-assertion: canonical-edit-history-settlement-overlay-023
assert.equal(behaviorController.pendingCommand,undefined);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-018
assert.equal(behaviorController.pendingBase,undefined);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-028
assert.equal(behaviorController.projectionRequest,undefined);

// retired-schema-assertion: guided-selection-continuation-promotion-044
assert.match(behaviorController.commandFeedback,/rejected/u);

const settlementOne=behaviorController.beginSettlement("schema:one");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-029
assert.equal(settlementOne,1);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-002
assert.ok(behaviorController.settlementPending);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-030
assert.equal(behaviorController.settlementSchemaId,"schema:one");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-007
assert.equal(behaviorController.settlementClaims.get(settlementOne),"schema:one");
const settlementTwo=behaviorController.beginSettlement("schema:two");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-031
assert.equal(settlementTwo,2);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-014
assert.equal(behaviorController.clearSettlement("schema:one",settlementOne),false);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-025
assert.ok(behaviorController.settlementPending);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-033
assert.equal(behaviorController.settlementSchemaId,"schema:two");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-013
assert.equal(behaviorController.clearSettlement("wrong",settlementTwo),false);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-038
assert.ok(behaviorController.clearSettlement("schema:two", settlementTwo));

// retired-schema-assertion: canonical-edit-history-settlement-overlay-035
assert.equal(behaviorController.settlementPending,false);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-034
assert.equal(behaviorController.settlementSchemaId,undefined);

const history=behaviorController.beginPendingHistory("project:one","saved:schema:one","Rename",[]);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-009
assert.match(history.operationId,/schema-history/u);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-036
assert.equal(history.projectId,"project:one");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-037
assert.equal(history.editorKey,"saved:schema:one");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-027
assert.deepEqual(behaviorController.pendingHistoryFor("project:one","Rename"),history);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-010
assert.equal(behaviorController.pendingHistoryFor("project:two","Rename"),undefined);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-041
assert.equal(behaviorController.pendingHistoryFor("project:one","Other"),undefined);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-039
assert.ok(behaviorController.semanticUnresolved());
behaviorController.completePendingHistory(history);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-016
assert.equal(behaviorController.historyState.pending,undefined);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-040
assert.equal(behaviorController.pendingHistoryLabel,undefined);
assert.ok(!behaviorController.semanticUnresolved());

const rejectedHistory=behaviorController.beginPendingHistory("project:one","saved:schema:one","Move",[]);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-043
assert.equal(behaviorController.pendingHistoryLabel,"Move");
behaviorController.rejectPendingHistory(rejectedHistory);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-045
assert.equal(behaviorController.historyState.pending,undefined);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-047
assert.equal(behaviorController.pendingHistoryLabel,undefined);
const saved={revision:3,rootId:"root",contributorId:"schema:one",contributorName:"One",nodes:{}};
behaviorController.setSavedDocument(saved);
saved.revision=9;

// retired-schema-assertion: canonical-edit-history-settlement-overlay-011
assert.equal(behaviorController.savedDocument.revision,3);
behaviorController.recordRevision(saved);
saved.revision=10;

// retired-schema-assertion: canonical-edit-history-settlement-overlay-026
assert.equal(behaviorController.revisionSnapshots.get(9).revision,9);
behaviorController.setCommandFeedback("Ready");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-048
assert.equal(behaviorController.commandFeedback,"Ready");
assert.ok(controller, "the direct canonical editor owner is constructed");
assert.deepEqual(controller.constructor.name.split("Controller"), ["SchemaCanonicalEditor", ""],
  "the direct canonical owner retains its controller identity");
