import assert from "node:assert/strict";
import { createSchemaLibraryFakeDocument } from "../../support/schema-library-fake-dom.mjs";

const { SchemaCanonicalEditorController } = await import(
  "../../../dist/data-layer-installed/schemas/canonical-editor-controller.js"
);
const { SchemaCanonicalInstalledView } = await import(
  "../../../dist/data-layer-installed/schemas/canonical-installed-view.js"
);
const { createCanonicalPublicOperations } = await import(
  "../../../dist/data-layer-installed/schemas/canonical-public-operations.js"
);
const { applyCanonicalCommand } = await import(
  "../../../dist/data-layer-canonical-schema.js"
);
const { storedPromotionRules } = await import(
  "../../../dist/data-layer-installed/schemas/schema-model.js"
);
const { openCanonicalRuleEditor } = await import(
  "../../../dist/data-layer-installed/schemas/canonical-rule-editor-view.js"
);

const controller = new SchemaCanonicalEditorController({
  blocked:()=>false,generation:()=>1,isCurrent:()=>true,setBusy(){},renderContext(){},renderEditor(){},createId:()=>"id:one",
});
const pendingBase = { revision:1, rootId:"root", contributorId:"schema:one", contributorName:"One", nodes:{
  "property:one":{ id:"property:one", name:"One", type:"string", parentId:"root", order:0, presence:{mode:"optional"}, documentation:{example:{method:"blank"}}, rules:[], allowedValues:[] },
} };
const adapter={key:"saved:schema:one",load:()=>pendingBase,dispatch:()=>({status:"conflict",document:pendingBase,propertyId:"property:one",message:"Review"})};
controller.openEditor(adapter);
controller.beginCommand({ kind:"select", baseRevision:1, propertyId:"property:one" });
controller.showPendingComparison();
controller.setPresenceDraft({ propertyId:"property:one", baseRevision:1, mode:"required" });
const persistenceSchemaId = "schema:one";
const uiController = createCanonicalPublicOperations({
  controller,
  schema:(id) => id === persistenceSchemaId ? { id, name:"One", version:1, document:{type:"object"}, assignments:[] } : undefined,
  openSaved:() => controller.openEditor(adapter),
  open:(next) => controller.openEditor(next),
  close:() => controller.closeEditor(),
  show(){},
  projection:() => ({ id:"schema:one", name:"One", version:1, document:{type:"object"}, assignments:[] }),
  facet:() => "Canonical facets",
  render(){},
});

// retired-schema-assertion: canonical-edit-history-settlement-overlay-001
assert.equal(uiController.openSavedCanonical(persistenceSchemaId), true);

// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-001
assert.equal(uiController.openSavedCanonical(persistenceSchemaId),true);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-009
assert.match(uiController.canonicalFacet("property:one"), /Canonical facets/);

const {document:tableDocument,element:tableElement}=createSchemaLibraryFakeDocument();
const tableController=new SchemaCanonicalEditorController({blocked:()=>false,generation:()=>1,isCurrent:()=>true,
  setBusy(){},renderContext(){},renderEditor(){},createId:()=>"id"});
const tableEditor=tableElement(),tableDetail=tableElement(),tableContext=tableElement();
const tableView=new SchemaCanonicalInstalledView({controller:tableController,elements:{context:tableContext,editor:tableEditor,
  detail:tableDetail,detailEmpty:tableElement(),save:tableElement(),list:tableElement(),document:tableDocument},
  activeSchemaId:()=>undefined,setActiveSchemaId(){},draft:()=>undefined,setDraft(){},schemas:()=>[],replaceSchemas(){},
  editorDraft:(schema)=>schema,propertyAt:()=>undefined,selectedPath:()=>"",setSelectedPath(){},renderDraft(){},renderAll(){},
  persistLibrary(){},proposeName:(schema)=>schema,createId:()=>"id",conceptSuggestions:()=>[],createTableEditor:()=>({render(){}}),
  closeRoute(){},generation:()=>1,isCurrent:()=>true,rulePicker:null,setRulePicker(){},closeRulePicker(){}});
tableView.open({key:"draft:table",label:"Table",load:()=>pendingBase,
  dispatch:()=>({status:"applied",document:pendingBase})});
const ownedCanonicalTableHost=tableEditor.children.find(({id})=>id==="compact-canonical-table-editor");

assert.ok(ownedCanonicalTableHost,"Schemas creates the compact canonical table host on demand with the legacy ID");

let durableDocument=structuredClone(pendingBase),releaseSettlement,settlementMode="defer",busyState="false",projectionName="One";
const settlementController=new SchemaCanonicalEditorController({blocked:()=>false,generation:()=>1,isCurrent:()=>true,
  setBusy:(busy)=>{busyState=String(busy);},renderContext(){},renderEditor(){},createId:()=>"id"});
const settlementAdapter={key:"saved:schema:one",label:"Saved One",load:()=>durableDocument,
  dispatch:(command)=>{const result=applyCanonicalCommand(durableDocument,command);durableDocument=result.document;return result;},
  settle:()=>settlementMode==="reject"?Promise.reject(new Error("rejected")):settlementMode==="defer"
    ?new Promise((resolve)=>{releaseSettlement=resolve;}):Promise.resolve(),
  persistProjection:(projection)=>{projectionName=projection.name;return true;},projection:()=>({id:"schema:one",name:projectionName,version:1,document:{type:"object"},assignments:[]})};
settlementController.openEditor(settlementAdapter);
const canonicalBefore=settlementController.editorDocument();

// retired-schema-assertion: canonical-edit-history-settlement-overlay-010
assert.equal(settlementController.commandScope({kind:"rename",baseRevision:canonicalBefore.revision,
  propertyId:"property:one",name:"Renamed canonical property"},canonicalBefore),canonicalBefore.nodes["property:one"].name);
const dispatchCanonicalSettlement=settlementController.dispatchCommand({kind:"rename",baseRevision:canonicalBefore.revision,
  propertyId:"property:one",name:"Renamed canonical property"});

// retired-schema-assertion: canonical-edit-history-settlement-overlay-006
assert.equal(settlementController.settlementPending,true,"a saved-schema policy edit remains busy until its durable acknowledgement");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-007
assert.equal(busyState,"true","the installed editor exposes the pending settlement synchronously instead of relying on its duration");
releaseSettlement();

// retired-schema-assertion: canonical-edit-history-settlement-overlay-011
assert.equal(await dispatchCanonicalSettlement,true,"canonical commands settle through the Schema durable port");
const canonicalAfter=settlementController.editorDocument();
const historyIdentity=settlementController.beginPendingHistory("project:one","saved:schema:one","Rename canonical property",[]);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-012
assert.equal(settlementController.pendingHistoryFor("project:one","Rename canonical property").operationId,historyIdentity.operationId);
settlementController.completePendingHistory(historyIdentity);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-013
assert.equal(Boolean(settlementController.historyState.pending),false,"durably acknowledged history becomes available atomically");
settlementMode="reject";

// retired-schema-assertion: canonical-edit-history-settlement-overlay-014
assert.equal(await settlementController.dispatchCommand({kind:"rename",baseRevision:canonicalAfter.revision,
  propertyId:"property:one",name:"Rejected canonical property"}),false);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-015
assert.equal(Boolean(settlementController.pendingCommand),true,"a rejected durable settlement preserves the exact command for recovery");
settlementMode="resolve";
settlementController.retryCommand();
await Promise.resolve();await Promise.resolve();

// retired-schema-assertion: canonical-edit-history-settlement-overlay-016
assert.equal(Boolean(settlementController.pendingCommand),false,"Retry rebases only the preserved command onto current canonical state");
const projectedCanonical={id:"schema:one",name:"Canonical metadata name",version:1,document:{type:"object"},assignments:[]};

// retired-schema-assertion: canonical-edit-history-settlement-overlay-017
assert.equal(await settlementController.persistCurrentProjection(projectedCanonical,"schema name"),true);
const canonicalProjectionSettlementReady=!settlementController.settlementPending;

// retired-schema-assertion: canonical-edit-history-settlement-overlay-018
assert.equal(canonicalProjectionSettlementReady,true,
  "settling a canonical projection refreshes publication readiness in the installed schema editor");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-019
assert.equal(settlementController.projectEditor(settlementAdapter.projection).name,"Canonical metadata name",
  "projection metadata uses the same serialized settlement queue");
let canonicalProjectionInput;
const fallbackProjection={...projectedCanonical,name:"Fallback canonical metadata"};
settlementController.openEditor({...settlementAdapter,projection:undefined});
assert.equal(settlementController.projectEditor((canonical) => {
  canonicalProjectionInput=canonical;
  return fallbackProjection;
}).name,"Fallback canonical metadata");
assert.equal(canonicalProjectionInput.revision,canonicalAfter.revision,
  "canonical projection receives a read-only document value");
assert.equal("dispatch" in canonicalProjectionInput,false,
  "canonical projection cannot receive the mutable editor adapter");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-020
assert.equal(await settlementController.resumeCurrentProjectionPersistence(),true,
  "an already-settled canonical projection resumes idempotently");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-036
assert.equal(uiController.openSavedCanonical(persistenceSchemaId),true);

const acknowledgement = controller.beginSettlement(persistenceSchemaId);
const durableAcknowledgementReleasedPolicyPresentation = controller.clearSettlement(persistenceSchemaId, acknowledgement);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-008
assert.equal(durableAcknowledgementReleasedPolicyPresentation, true,
  "the matching saved acknowledgement releases policy presentation before the broader queue drains");
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
assert.throws(
  () => { controller.pendingCommand = { kind:"select", baseRevision:1, propertyId:"property:one" }; },
  /getter|read only|setting/u,
  "external code cannot write canonical command state",
);
assert.equal(controller.editorState, undefined,
  "disposed canonical state does not expose its mutable editor adapter");

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

assert.ok(!behaviorController.semanticUnresolved());
behaviorController.openEditor({
  key:"saved:schema:one",
  load:()=>pendingBase,
  dispatch:()=>({status:"conflict",document:pendingBase,propertyId:"property:one",message:"Review"}),
});
behaviorController.beginCommand({kind:"select",baseRevision:1,propertyId:"property:one"});

assert.ok(behaviorController.semanticUnresolved());
behaviorController.rejectDurableChange();

assert.equal(behaviorController.pendingCommand,undefined);

assert.equal(behaviorController.pendingBase,undefined);

let migrationCancelled=0;
behaviorController.openEditor({key:"migration:one",label:"Migration",load:()=>pendingBase,
  dispatch:()=>({status:"applied",document:pendingBase}),migration:{summary:"Review",conflicts:[],resolve(){},
    cancel(){migrationCancelled+=1;},confirm:()=>Promise.resolve()}});
behaviorController.cancelMigration();

assert.equal(migrationCancelled,1);

assert.match(behaviorController.commandFeedback,/rejected/u);

const settlementOne=behaviorController.beginSettlement("schema:one");

assert.equal(settlementOne,1);

assert.ok(behaviorController.settlementPending);

assert.equal(behaviorController.settlementSchemaId,"schema:one");

assert.equal(behaviorController.settlementClaims.get(settlementOne),"schema:one");
const settlementTwo=behaviorController.beginSettlement("schema:two");

assert.equal(settlementTwo,2);

assert.equal(behaviorController.clearSettlement("schema:one",settlementOne),false);

assert.ok(behaviorController.settlementPending);

assert.equal(behaviorController.settlementSchemaId,"schema:two");

assert.equal(behaviorController.clearSettlement("wrong",settlementTwo),false);

assert.ok(behaviorController.clearSettlement("schema:two", settlementTwo));

assert.equal(behaviorController.settlementPending,false);

assert.equal(behaviorController.settlementSchemaId,undefined);

const history=behaviorController.beginPendingHistory("project:one","saved:schema:one","Rename",[]);

assert.match(history.operationId,/schema-history/u);

assert.equal(history.projectId,"project:one");

assert.equal(history.editorKey,"saved:schema:one");

assert.deepEqual(behaviorController.pendingHistoryFor("project:one","Rename"),history);

assert.equal(behaviorController.pendingHistoryFor("project:two","Rename"),undefined);

assert.equal(behaviorController.pendingHistoryFor("project:one","Other"),undefined);

assert.ok(behaviorController.semanticUnresolved());
behaviorController.completePendingHistory(history);

assert.equal(behaviorController.historyState.pending,undefined);

assert.equal(behaviorController.pendingHistoryLabel,undefined);
assert.ok(!behaviorController.semanticUnresolved());

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
let actionDocument=structuredClone(pendingBase);
const actionController=new SchemaCanonicalEditorController({
  blocked:()=>false,generation:()=>1,isCurrent:()=>true,setBusy(){},renderContext(){},renderEditor(){},createId:()=>"id",
});
actionController.openEditor({key:"draft:one",label:"Draft",load:()=>actionDocument,dispatch:(command)=>{
  const result=applyCanonicalCommand(actionDocument,command);
  actionDocument=result.document;
  return result;
}});
assert.equal(await actionController.propertyAction("property:one","documentation","Checkout property"),true);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-042
assert.equal(actionController.editorDocument().nodes["property:one"].documentation.description,"Checkout property");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-043
assert.equal(await actionController.propertyAction("property:one","presence","required"),true);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-044
assert.equal(actionController.editorDocument().nodes["property:one"].presence.mode,"required");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-045
assert.equal(await actionController.propertyAction("property:one","custom-example","sample"),true);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-046
assert.deepEqual(actionController.editorDocument().nodes["property:one"].documentation.example,
  {method:"custom",value:"sample"});

// retired-schema-assertion: canonical-edit-history-settlement-overlay-047
assert.equal(await actionController.propertyAction("property:one","expected","expected"),true);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-048
assert.equal(await actionController.propertyAction("property:one","reset-expected"),true);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-049
assert.equal(actionController.editorDocument().nodes["property:one"].expectedValue,undefined);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-050
assert.deepEqual(storedPromotionRules([{id:"rule:history",name:"Current",kind:"Required",version:2,enabled:true,
  revisionHistory:[{id:"rule:history",name:"Previous",kind:"Required",version:1,enabled:false}]}])[0].revisionHistory,
  [{name:"Previous",kind:"Required",version:1,enabled:false}],"promotion persistence normalizes historical rule snapshots");
assert.ok(controller, "the direct canonical editor owner is constructed");
assert.deepEqual(controller.constructor.name.split("Controller"), ["SchemaCanonicalEditor", ""],
  "the direct canonical owner retains its controller identity");

{
const { document, element } = createSchemaLibraryFakeDocument();
globalThis.document = document;
const editor = element(), detail = element(), context = element(), save = element(), list = element();
let canonicalTableMounts = 0, canonicalTableOptions, renderedContextCount = 0;
let undoCount = 0, redoCount = 0, contextActionCount = 0;
let current = {revision:0,rootId:"root",contributorId:"schema:one",contributorName:"One",view:"tree",rootIds:["property:one"],nodes:{
  "property:one":{id:"property:one",name:"Title",type:"string",order:0,presence:{mode:"optional"},
    documentation:{example:{method:"blank"}},rules:[],allowedValues:[],provenance:[]},
}};
let view;
const controller = new SchemaCanonicalEditorController({blocked:()=>false,generation:()=>1,isCurrent:()=>true,setBusy(){},
  renderContext:()=>view.renderContext(),renderEditor:()=>view.render(),createId:()=>"id"});
const ports = {controller,elements:{context,editor,detail,detailEmpty:element(),save,list,document},activeSchemaId:()=>undefined,
  setActiveSchemaId(){},draft:()=>undefined,setDraft(){},schemas:()=>[],replaceSchemas(){},editorDraft:(schema)=>schema,
  propertyAt:()=>true,selectedPath:()=>"title",setSelectedPath(){},renderDraft(){},renderAll(){},persistLibrary(){},
  proposeName:(schema)=>schema,createId:()=>"id",conceptSuggestions:()=>["Checkout concept"],
  createTableEditor:(options)=>{canonicalTableMounts+=1;canonicalTableOptions=options;return{render(){}};},
  closeRoute(){},generation:()=>1,isCurrent:()=>true,rulePicker:null,setRulePicker(){},closeRulePicker(){}};
view = new SchemaCanonicalInstalledView(ports);
const adapter = {key:"test:canonical-context",label:"Context contract",load:()=>current,
  dispatch:(command)=>{const result=applyCanonicalCommand(current,command);current=result.document;return result;},
  onUndo:()=>{undoCount+=1;return "No page-scoped canonical command is available to Undo.";},
  onRedo:()=>{redoCount+=1;},actions:[{label:"Inspect",run:()=>{contextActionCount+=1;}}],
  renderContext:(host)=>{renderedContextCount+=1;host.dataset.customContext="rendered";}};
view.open(adapter);
const ownedCanonicalTableHost=editor.children.find(({id})=>id==="compact-canonical-table-editor");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-002
assert.ok(ownedCanonicalTableHost,"Schemas creates the compact canonical table host on demand with the legacy ID");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-003
assert.equal(canonicalTableMounts,1);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-004
assert.equal(canonicalTableOptions.host,ownedCanonicalTableHost);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-005
assert.deepEqual(canonicalTableOptions.conceptSuggestions(),["Checkout concept"]);

const findText=(root,text)=>root.find((child)=>child.textContent===text);
let controls=context.children;
findText(context,"Undo").click();
findText(context,"Redo").click();
findText(context,"Inspect").click();
findText(context,"Table").click();
await Promise.resolve();

// retired-schema-assertion: canonical-edit-history-settlement-overlay-022
assert.deepEqual([undoCount,redoCount,contextActionCount,current.view],[1,1,1,"table"],
  "compact context actions and view controls execute through the adapter contract");
const emptyHistoryFeedbackPresented=context.children.some(({textContent})=>
  textContent==="No page-scoped canonical command is available to Undo.");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-023
assert.equal(emptyHistoryFeedbackPresented,true,
  "the installed compact context presents an empty durable-history outcome instead of discarding it");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-024
assert.equal(context.children.some((child)=>child["aria-label"]==="Compact canonical command result"),true,
  "the installed compact context exposes command feedback through its accessible result boundary");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-025
assert.ok(renderedContextCount>0);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-026
assert.equal(context.dataset.customContext,"rendered");

let migrationResolution,migrationCancelled=0,migrationConfirmed=0;
const migrationAdapter={key:"test:canonical-migration",label:"Migration contract",load:()=>current,
  dispatch:()=>({status:"applied",document:current}),migration:{summary:"One legacy facet needs review",
    conflicts:[{id:"conflict:1",label:"Resolve title type",choices:[{id:"string",label:"String"},{id:"number",label:"Number"}]}],
    resolve:(conflict,choice)=>{migrationResolution=[conflict,choice];},cancel:()=>{migrationCancelled+=1;migrationAdapter.migration=undefined;},
    confirm:async()=>{migrationConfirmed+=1;migrationAdapter.migration=undefined;}}};
view.open(migrationAdapter);
let migrationReview=context.children.find((child)=>child["aria-label"]==="Canonical schema migration review");
const migrationResolutionControl=migrationReview.children[0];
migrationResolutionControl.value="number";
migrationResolutionControl.dispatch("change");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-027
assert.deepEqual(migrationResolution,["conflict:1","number"],"migration conflict resolution remains controller-owned");
migrationReview.children.at(-2).click();

// retired-schema-assertion: canonical-edit-history-settlement-overlay-028
assert.equal(migrationCancelled,1);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-029
assert.equal(migrationResolutionControl.listenerCount(),0);
migrationAdapter.migration={summary:"Migration ready",conflicts:[],resolve(){},cancel(){},
  confirm:async()=>{migrationConfirmed+=1;migrationAdapter.migration=undefined;}};
view.open(migrationAdapter);
migrationReview=context.children.find((child)=>child["aria-label"]==="Canonical schema migration review");
const migrationConfirm=migrationReview.children.at(-1);
migrationConfirm.click();
await Promise.resolve();

// retired-schema-assertion: canonical-edit-history-settlement-overlay-030
assert.equal(migrationConfirmed,1);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-031
assert.equal(migrationConfirm.listenerCount(),0,"migration confirmation rerender disposes its controls");

const conflictAdapter={key:"test:canonical-conflict",label:"Conflict",load:()=>current,
  dispatch:(command)=>({status:"conflict",document:current,propertyId:command.propertyId,message:"newer draft"})};
view.open(conflictAdapter);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-032
assert.equal(await controller.dispatchCommand({kind:"rename",baseRevision:current.revision,propertyId:"property:one",name:"Conflicting rename"}),false);
controls=context.children;
const compareControl=findText(context,"Compare latest property");
compareControl.click();

// retired-schema-assertion: canonical-edit-history-settlement-overlay-033
assert.equal(compareControl.listenerCount(),0,"compact context rerender disposes replaced review controls");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-034
assert.equal(controller.reviewVisible,true,"Compare exposes the pending command base against the latest revision");
findText(context,"Reject local edit").click();

// retired-schema-assertion: canonical-edit-history-settlement-overlay-035
assert.equal(Boolean(controller.pendingCommand),false,"Reject clears the preserved compact canonical command");

view.open(adapter);
view.openPropertyActions("property:one");
const compactDocumentationControl=findText(context,"Save documentation");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-039
assert.ok(compactDocumentationControl?.listenerCount()>0,"compact property actions are live disposable controls");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-040
assert.equal(await controller.propertyAction("property:one","documentation","Checkout property"),true);

// retired-schema-assertion: canonical-edit-history-settlement-overlay-041
assert.equal(compactDocumentationControl.listenerCount(),0,"canonical property rerender disposes the replaced action controls");

const rulePicker=element();
const rulePorts={...ports,rulePicker,setRulePicker(){},closeRulePicker(){}};

// retired-schema-assertion: canonical-edit-history-settlement-overlay-037
assert.equal(openCanonicalRuleEditor(rulePorts,"property:one"),true,
  "the saved canonical property resolves into its staged rule editor");

// retired-schema-assertion: canonical-edit-history-settlement-overlay-038
assert.ok(findText(rulePicker,"Add rule"),
  "the canonical rule editor starts with the staged rule-adder used by the installed schema workspace");

view.dispose();

// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-002
assert.equal(editor.querySelector("#compact-canonical-table-editor"),undefined,
  "Schemas removes its on-demand canonical table host during disposal");

let staleGeneration=1,releaseStaleSettlement;
const staleContext=element();
const staleController=new SchemaCanonicalEditorController({blocked:()=>false,generation:()=>staleGeneration,
  isCurrent:(generation)=>generation===staleGeneration,setBusy(){},renderContext(){},
  renderEditor(){staleContext.hidden=false;},createId:()=>"id:stale"});
let staleDocument=structuredClone(current);
staleController.openEditor({key:"saved:schema:stale",load:()=>staleDocument,
  dispatch:(command)=>{const result=applyCanonicalCommand(staleDocument,command);staleDocument=result.document;return result;},
  settle:()=>new Promise((resolve)=>{releaseStaleSettlement=resolve;})});
const staleCanonicalSettlement=staleController.dispatchCommand({kind:"rename",baseRevision:staleDocument.revision,
  propertyId:"property:one",name:"Settles after disposal"});
staleController.disposeState();
staleContext.hidden=true;
staleGeneration+=1;
releaseStaleSettlement();
await staleCanonicalSettlement;

// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-003
assert.equal(staleContext.hidden,true,"a settlement completing after disposal cannot reopen stale canonical UI");
}
