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
assert.equal(disposed, 1);
assert.equal(controller.pendingCommand, undefined);
assert.equal(controller.pendingBase, undefined);
assert.equal(controller.reviewVisible, false);
assert.equal(controller.revisionSnapshots.size, 0);
assert.equal(controller.historyState.pending, undefined);
assert.equal(controller.reopenSelection, undefined);

const calls=[];
const behaviorController=new SchemaCanonicalEditorController({
  blocked:()=>false,generation:()=>7,isCurrent:(value)=>value===7,
  setBusy:(value)=>calls.push(["busy",value]),renderContext:()=>calls.push("context"),
  renderEditor:()=>calls.push("editor"),createId:()=>"id:one",mounted:()=>true,
});
assert.equal(behaviorController.createCanonicalId("property"),"schema:property:1");
assert.equal(behaviorController.createCanonicalId("rule"),"schema:rule:2");
behaviorController.rememberScroll("saved:one",44);
assert.equal(behaviorController.scrollByKey.get("saved:one"),44);
assert.equal(behaviorController.savedSchemaId({key:"saved:schema:one"}),"schema:one");
assert.equal(behaviorController.savedSchemaId({key:"project:one"}),undefined);
assert.equal(behaviorController.savedSchemaId(undefined),undefined);
assert.equal(behaviorController.semanticUnresolved(),false);
behaviorController.pendingCommand={kind:"select",baseRevision:1,propertyId:"property:one"};
assert.equal(behaviorController.semanticUnresolved(),true);
behaviorController.pendingBase={revision:1,rootId:"root",contributorId:"schema:one",contributorName:"One",nodes:{}};
behaviorController.rejectDurableChange();
assert.equal(behaviorController.pendingCommand,undefined);
assert.equal(behaviorController.pendingBase,undefined);
assert.equal(behaviorController.projectionRequest,undefined);
assert.match(behaviorController.commandFeedback,/rejected/u);

const settlementOne=behaviorController.beginSettlement("schema:one");
assert.equal(settlementOne,1);
assert.equal(behaviorController.settlementPending,true);
assert.equal(behaviorController.settlementSchemaId,"schema:one");
assert.equal(behaviorController.settlementClaims.get(settlementOne),"schema:one");
const settlementTwo=behaviorController.beginSettlement("schema:two");
assert.equal(settlementTwo,2);
assert.equal(behaviorController.clearSettlement("schema:one",settlementOne),false);
assert.equal(behaviorController.settlementPending,true);
assert.equal(behaviorController.settlementSchemaId,"schema:two");
assert.equal(behaviorController.clearSettlement("wrong",settlementTwo),false);
assert.equal(behaviorController.clearSettlement("schema:two",settlementTwo),true);
assert.equal(behaviorController.settlementPending,false);
assert.equal(behaviorController.settlementSchemaId,undefined);

const history=behaviorController.beginPendingHistory("project:one","saved:schema:one","Rename",[]);
assert.match(history.operationId,/schema-history/u);
assert.equal(history.projectId,"project:one");
assert.equal(history.editorKey,"saved:schema:one");
assert.deepEqual(behaviorController.pendingHistoryFor("project:one","Rename"),history);
assert.equal(behaviorController.pendingHistoryFor("project:two","Rename"),undefined);
assert.equal(behaviorController.pendingHistoryFor("project:one","Other"),undefined);
assert.equal(behaviorController.semanticUnresolved(),true);
behaviorController.completePendingHistory(history);
assert.equal(behaviorController.historyState.pending,undefined);
assert.equal(behaviorController.pendingHistoryLabel,undefined);
assert.equal(behaviorController.semanticUnresolved(),false);

const rejectedHistory=behaviorController.beginPendingHistory("project:one","saved:schema:one","Move",[]);
assert.equal(behaviorController.pendingHistoryLabel,"Move");
behaviorController.rejectPendingHistory(rejectedHistory);
assert.equal(behaviorController.historyState.pending,undefined);
assert.equal(behaviorController.pendingHistoryLabel,undefined);
const saved={revision:3,rootId:"root",contributorId:"schema:one",contributorName:"One",nodes:{}};
behaviorController.setSavedDocument(saved);
saved.revision=9;
assert.equal(behaviorController.savedDocument.revision,3);
behaviorController.recordRevision(saved);
saved.revision=10;
assert.equal(behaviorController.revisionSnapshots.get(9).revision,9);
behaviorController.setCommandFeedback("Ready");
assert.equal(behaviorController.commandFeedback,"Ready");
