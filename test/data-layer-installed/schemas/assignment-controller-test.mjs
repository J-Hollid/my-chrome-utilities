import assert from "node:assert/strict";
import { createSchemaLibraryFakeDocument } from "../../support/schema-library-fake-dom.mjs";

const { installSchemaAssignmentElements, SchemaAssignmentController } = await import(
  "../../../dist/data-layer-installed/schemas/assignment-controller.js"
);

const selectors = [];
const installed = installSchemaAssignmentElements({
  querySelector(selector) { selectors.push(selector); return null; },
});

assert.ok(selectors.includes("#schema-assignment-editor"));

assert.equal(installed.editor, null, "assignment element ownership keeps absent optional controls absent");

const controller = new SchemaAssignmentController({
  elements:{ editor:null, source:null, event:null, priority:null, save:null, target:null, domain:null,
    pathname:null, versionPolicy:null, enabled:null, list:null, conflicts:null, schema:null, conditions:null, result:null },
  schemas:() => [], replaceSchemas() {}, persistAndRender() {}, capturedValue:() => undefined, renderConditions() {},
});
controller.edit("schema:one",{id:"assignment:one",sourceId:"gtm",eventName:"checkout",target:"payload"});
assert.equal(controller.setEditingState,undefined,"generic assignment state replacement is not public");
assert.equal(controller.replaceConditionState,undefined,"generic condition state replacement is not public");
let disposed = 0;
controller.own(() => { disposed += 1; });
controller.dispose();

assert.equal(controller.editingState(), undefined);
assert.equal(controller.editing,undefined,"assignment editing state is not public mutable state");

assert.deepEqual(controller.conditionEditorState(), { target:"payload", suggestions:[] });
assert.equal(controller.conditions,undefined,"assignment condition state is not public mutable state");

assert.equal(disposed, 1, "assignment disposal removes its open review actions");

const emptyPayloadState = controller.conditionState("payload");

assert.equal(emptyPayloadState.target, "payload");

assert.deepEqual(emptyPayloadState.suggestions, []);

assert.equal(emptyPayloadState.group, undefined);
assert.equal(emptyPayloadState.suggestions.length, 0);
const suppliedGroup = { operator:"Any", predicates:[{propertyPath:"/checkout/email",operator:"Exists",detectedType:"string"}] };
const rawState = controller.conditionState("raw input", suppliedGroup);

// retired-schema-assertion: source-drafts-revision-publication-close-009
assert.equal(rawState.target, "raw input");

assert.equal(rawState.group.operator, "Any");
assert.equal(rawState.group.predicates.length, 1);

assert.equal(rawState.group.predicates[0].propertyPath, "/checkout/email");
assert.equal(rawState.group.predicates[0].operator, "Exists");

const { element } = createSchemaLibraryFakeDocument();
const assignmentList = element();
const assignmentConflicts = element();
let schemas=[{id:"schema:one",name:"One",version:1,document:{type:"object"},assignments:[
  {id:"assignment:one",name:"Checkout",sourceId:"gtm",eventName:"checkout",target:"payload",
    priority:1,versionPolicy:"follow latest",enabled:true},
]}];
let persisted=0;
let behaviorController;
behaviorController = new SchemaAssignmentController({
  elements:{ editor:null, source:null, event:null, priority:null, save:null, target:null, domain:null,
    pathname:null, versionPolicy:null, enabled:null, list:assignmentList, conflicts:assignmentConflicts,
    schema:null, conditions:null, result:null },
  schemas:() => structuredClone(schemas),
  replaceSchemas(next) { schemas=structuredClone(next); },
  persistAndRender() { persisted += 1; behaviorController.render(); },
  capturedValue:(target) => target === "payload" ? {checkout:{email:"a@b.test"}} : {raw:true},
  renderConditions() {},
});
behaviorController.edit("schema:one",schemas[0].assignments[0]);

// retired-schema-assertion: assignment-conflicts-001
assert.equal(schemas[0].assignments[0].eventName,"checkout");

// retired-schema-assertion: assignment-conflicts-002
assert.equal(schemas[0].assignments[0].versionPolicy,"follow latest");

assert.equal(behaviorController.editingState().schemaId,"schema:one");
assert.equal(behaviorController.editingState().assignmentId,"assignment:one");
const conditionProjection=behaviorController.conditionEditorState();
assert.equal(conditionProjection.target,"payload");

assert.equal(conditionProjection.suggestions[0].propertyPath,"/checkout");
assert.equal(conditionProjection.suggestions[1].propertyPath,"/checkout/email");
assert.equal(conditionProjection.suggestions[0].detectedType,"object");

// retired-schema-assertion: guided-selection-continuation-promotion-005
assert.equal(conditionProjection.suggestions[1].detectedType,"string");
conditionProjection.suggestions.length=0;
assert.equal(behaviorController.conditionEditorState().suggestions.length,2,
  "callers cannot mutate assignment conditions through the projection");
behaviorController.mutate("schema:one","assignment:one",(assignment)=>({...assignment,enabled:false}));

assert.equal(schemas[0].assignments[0].enabled,false);
assert.equal(persisted,1);
behaviorController.mutate("schema:one","assignment:one",(assignment)=>({...assignment,enabled:true}));
behaviorController.render();

// retired-schema-assertion: assignment-conflicts-003
assert.match(assignmentList.children[0].children[0].textContent,/gtm\/checkout/);
assignmentList.children[0].children[2].click();

// retired-schema-assertion: assignment-conflicts-004
assert.equal(schemas[0].assignments.length,2);

// retired-schema-assertion: assignment-conflicts-005
assert.match(assignmentConflicts.textContent,/Assignment conflict/);
assignmentList.children[1].children[3].click();

// retired-schema-assertion: assignment-conflicts-006
assert.equal(assignmentConflicts.textContent,"");
behaviorController.dispose();

assert.equal(behaviorController.editingState(),undefined);
assert.equal(behaviorController.conditionEditorState().target,"payload");
assert.deepEqual(behaviorController.conditionEditorState().suggestions,[]);
assert.match(behaviorController.constructor.name, /SchemaAssignmentController/,
  "the direct assignment owner has the assignment-controller identity");
