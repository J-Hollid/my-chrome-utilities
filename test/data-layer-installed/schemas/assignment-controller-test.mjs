import assert from "node:assert/strict";
import { runRetiredSchemaControllerScenario } from "./fixtures/retired-controller-scenario.mjs";

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

let schemas=[{id:"schema:one",name:"One",version:1,document:{type:"object"},assignments:[
  {id:"assignment:one",name:"Checkout",sourceId:"gtm",eventName:"checkout",target:"payload",priority:1,enabled:true},
]}];
let persisted=0;
const behaviorController = new SchemaAssignmentController({
  elements:{ editor:null, source:null, event:null, priority:null, save:null, target:null, domain:null,
    pathname:null, versionPolicy:null, enabled:null, list:null, conflicts:null, schema:null, conditions:null, result:null },
  schemas:() => structuredClone(schemas),
  replaceSchemas(next) { schemas=structuredClone(next); },
  persistAndRender() { persisted += 1; },
  capturedValue:(target) => target === "payload" ? {checkout:{email:"a@b.test"}} : {raw:true},
  renderConditions() {},
});
behaviorController.edit("schema:one",schemas[0].assignments[0]);
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
behaviorController.mutate("schema:one","assignment:one",()=>undefined);
assert.equal(schemas[0].assignments.length,0);
assert.equal(persisted,2);
behaviorController.mutate("missing","assignment:one",(assignment)=>assignment);
assert.equal(schemas.length,1);
assert.equal(persisted,3);
behaviorController.dispose();
assert.equal(behaviorController.editing,undefined);
assert.equal(behaviorController.conditions.target,"payload");
assert.deepEqual(behaviorController.conditions.suggestions,[]);
// RETIRED_SCHEMA_ASSERTIONS_START:assignment-conflicts
const retiredSchemaAssertions = {
  "assignment-conflicts-001": (...args) => assert.equal(...args),
  "assignment-conflicts-002": (...args) => assert.equal(...args),
  "assignment-conflicts-003": (...args) => assert.match(...args),
  "assignment-conflicts-004": (...args) => assert.equal(...args),
  "assignment-conflicts-005": (...args) => assert.match(...args),
  "assignment-conflicts-006": (...args) => assert.equal(...args),
};
await runRetiredSchemaControllerScenario(retiredSchemaAssertions);
// RETIRED_SCHEMA_ASSERTIONS_END:assignment-conflicts
