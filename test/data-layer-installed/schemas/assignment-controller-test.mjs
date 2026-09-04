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
controller.editing = { schemaId:"schema:one", assignmentId:"assignment:one" };
controller.conditions = { target:"payload", suggestions:["checkout.email"], group:{ operator:"All", predicates:[] } };
let disposed = 0;
controller.own(() => { disposed += 1; });
controller.dispose();

assert.equal(controller.editing, undefined);

assert.deepEqual(controller.conditions, { target:"payload", suggestions:[] });

assert.equal(disposed, 1, "assignment disposal removes its open review actions");

const emptyPayloadState = controller.conditionState("payload");

assert.equal(emptyPayloadState.target, "payload");

assert.deepEqual(emptyPayloadState.suggestions, []);

assert.equal(emptyPayloadState.group, undefined);
assert.equal(emptyPayloadState.suggestions.length, 0);
const suppliedGroup = { operator:"Any", predicates:[{propertyPath:"/checkout/email",operator:"Exists",detectedType:"string"}] };
const rawState = controller.conditionState("raw input", suppliedGroup);

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

assert.equal(schemas[0].assignments[0].eventName,"checkout");

assert.equal(schemas[0].assignments[0].versionPolicy,"follow latest");

assert.equal(behaviorController.editing.schemaId,"schema:one");
assert.equal(behaviorController.editing.assignmentId,"assignment:one");
assert.equal(behaviorController.conditions.target,"payload");

assert.equal(behaviorController.conditions.suggestions[0].propertyPath,"/checkout");
assert.equal(behaviorController.conditions.suggestions[1].propertyPath,"/checkout/email");
assert.equal(behaviorController.conditions.suggestions[0].detectedType,"object");

assert.equal(behaviorController.conditions.suggestions[1].detectedType,"string");
behaviorController.mutate("schema:one","assignment:one",(assignment)=>({...assignment,enabled:false}));

assert.equal(schemas[0].assignments[0].enabled,false);
assert.equal(persisted,1);
behaviorController.mutate("schema:one","assignment:one",(assignment)=>({...assignment,enabled:true}));
behaviorController.render();

assert.match(assignmentList.children[0].children[0].textContent,/gtm\/checkout/);
assignmentList.children[0].children[2].click();

assert.equal(schemas[0].assignments.length,2);

assert.match(assignmentConflicts.textContent,/Assignment conflict/);
assignmentList.children[1].children[3].click();

assert.equal(assignmentConflicts.textContent,"");
behaviorController.dispose();

assert.equal(behaviorController.editing,undefined);
assert.equal(behaviorController.conditions.target,"payload");
assert.deepEqual(behaviorController.conditions.suggestions,[]);
assert.match(behaviorController.constructor.name, /SchemaAssignmentController/,
  "the direct assignment owner has the assignment-controller identity");
