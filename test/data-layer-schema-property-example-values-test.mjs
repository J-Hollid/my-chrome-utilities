import assert from "node:assert/strict";

import {
  createExamplePrefillState,
  exampleValueFromInput,
  prefillExampleOnce,
  schemaPropertyExampleChoices,
  schemaPropertyExampleConflicts,
  schemaPropertyExampleInputType,
} from "../dist/data-layer-schema-property-example-values.js";
import {
  resolveEffectiveSchemaDocumentation,
  resolvePropertyDocumentation,
  setPropertyDocumentation,
} from "../dist/data-layer-schema-documentation.js";
import { applySchemaPropertyCopy, planSchemaPropertyCopy, schemaPropertyCopySource, undoSchemaPropertyCopy } from "../dist/data-layer-schema-property-copy.js";
import { removeSchemaProperty, undoSchemaPropertyRemoval } from "../dist/data-layer-schema-property-removal.js";
import { createSchemaWorkingDraft, publishSchemaWorkingDraft, updateSchemaWorkingDraft } from "../dist/data-layer-schema-verification.js";
import { defectCapturedEvent } from "../dist/data-layer-defect-report-browser.js";
import { expectedPayloadFields, setExpectedPayloadValue, createExpectedPayloadDraft, expectedPayloadEvaluation } from "../dist/data-layer-unified-defect-builder.js";

const schema = {
  id:"product", name:"Product detail", version:3,
  document:{
    type:"object",
    properties:{
      login_status:{ type:"string" },
      product_id:{ type:"number" },
      consent:{ type:"boolean" },
      category:{},
      products:{ type:"array", items:{ type:"object", properties:{ id:{ type:"number" } } } },
    },
  },
  assignments:[],
  attachedRules:[{
    id:"allowed-login", name:"Allowed login status", version:1,
    propertyPath:"/login_status", operator:"allowed-values",
    allowedValues:["not logged in", "logged in"],
  }],
};

assert.deepEqual(schemaPropertyExampleChoices(schema, "/login_status"), ["not logged in", "logged in"]);
const inheritedRuleParent = { ...schema, id:"allowed-parent" };
const inheritedRuleChild = { ...schema, id:"allowed-child", parentSchemaId:"allowed-parent", attachedRules:[] };
assert.deepEqual(
  schemaPropertyExampleChoices(inheritedRuleChild, "/login_status", [inheritedRuleParent, inheritedRuleChild]),
  ["not logged in", "logged in"],
);
assert.equal(
  schemaPropertyExampleInputType(
    { ...inheritedRuleChild, document:{ type:"object" } },
    "/product_id",
    undefined,
    [inheritedRuleParent, { ...inheritedRuleChild, document:{ type:"object" } }],
  ),
  "number",
);
assert.deepEqual(exampleValueFromInput("robot", "string"), { value:"robot", selectionMethod:"custom" });
assert.deepEqual(exampleValueFromInput("1", "number"), { value:1, selectionMethod:"custom" });
assert.deepEqual(exampleValueFromInput("false", "boolean"), { value:false, selectionMethod:"custom" });
assert.deepEqual(exampleValueFromInput("null", "null"), { value:null, selectionMethod:"custom" });
assert.equal(exampleValueFromInput("not-a-number", "number"), undefined);
assert.equal(schemaPropertyExampleConflicts({ value:"guest", selectionMethod:"custom" }, ["not logged in", "logged in"]), true);

const original = structuredClone(schema);
const withAllowedExample = setPropertyDocumentation({}, "/login_status", {
  displayName:"",
  description:"",
  example:{ value:"logged in", selectionMethod:"allowed value" },
});
assert.deepEqual(withAllowedExample.properties["/login_status"].example, { value:"logged in", selectionMethod:"allowed value" });
assert.deepEqual(schema, original, "example editing must not mutate schema definitions or rules");

const parent = {
  ...schema,
  id:"generic", name:"Generic page", version:2,
  documentation:{ properties:{
    "/login_status":{ displayName:"", description:"", example:{ value:"not logged in", selectionMethod:"custom" } },
    "/products/*/id":{ displayName:"Product identifier", description:"Stable product identifier", example:{ value:1, selectionMethod:"custom" } },
  } },
};
const child = { ...schema, parentSchemaId:"generic", documentation:withAllowedExample };
const effective = resolveEffectiveSchemaDocumentation(child, [parent, child]);
assert.deepEqual(effective.properties["/login_status"].example, { value:"logged in", selectionMethod:"allowed value" });
assert.equal(effective.properties["/login_status"].inherited, false);
const wildcard = resolvePropertyDocumentation(effective, "/products/2/id");
assert.equal(wildcard.example.value, 1);
assert.equal(wildcard.mappingPath, "/products/*/id");
assert.equal(wildcard.origin.name, "Generic page");

const documentedSchema = { ...schema, documentation:parent.documentation };
const expectedId = expectedPayloadFields(documentedSchema).find(({ pointer }) => pointer === "/products/0/id");
assert.deepEqual(expectedId.example, { value:1, selectionMethod:"custom" });
const inheritedExpectedId = expectedPayloadFields(
  { ...schema, id:"expected-child", parentSchemaId:"generic", documentation:{ properties:{} } },
  [parent, { ...schema, id:"expected-child", parentSchemaId:"generic", documentation:{ properties:{} } }],
).find(({ pointer }) => pointer === "/products/0/id");
assert.deepEqual(inheritedExpectedId.example, { value:1, selectionMethod:"custom" });
let expectedDraft = createExpectedPayloadDraft(documentedSchema);
expectedDraft = setExpectedPayloadValue(documentedSchema, expectedDraft, "/products/0/id", { method:"custom", value:expectedId.example.value });
assert.deepEqual(expectedDraft.payload, { products:[{ id:1 }] });
assert.equal(expectedPayloadEvaluation(documentedSchema, expectedDraft).state, "Valid");

const issueEvent = defectCapturedEvent({
  id:"event", name:"pageview", sourceId:"history", sourceName:"Event history", captureTime:"2026-07-15T10:30:00Z",
  payload:{ login_status:"guest" },
  validationDetails:{
    schema:{ id:"product", name:"Product detail", version:3 },
    documentation:resolveEffectiveSchemaDocumentation(documentedSchema, [documentedSchema]),
    evaluations:[],
    issues:[{ instancePath:"/login_status", message:"Value is not allowed", expected:"not logged in,logged in", actual:"guest", schemaName:"Product detail", schemaVersion:3, schemaLocation:"#/properties/login_status", rule:"Allowed login status v1", severity:"error", allowedValues:["not logged in","logged in"] }],
  },
});
assert.deepEqual(issueEvent.issues[0].example, { value:"not logged in", selectionMethod:"custom" });

const pristine = createExamplePrefillState();
const first = prefillExampleOnce(pristine, "/login_status", "logged in");
assert.deepEqual(first, { values:{ "/login_status":"logged in" }, initialized:["/login_status"] });
const edited = { ...first, values:{ ...first.values, "/login_status":"member" } };
assert.equal(prefillExampleOnce(edited, "/login_status", "changed later").values["/login_status"], "member");
const independent = prefillExampleOnce(edited, "/product_name", undefined);
assert.equal(independent.values["/product_name"], "");
assert.equal(independent.values["/login_status"], "member");

const current = { ...schema, published:true, documentation:parent.documentation, revisionHistory:[] };
const draft = updateSchemaWorkingDraft(createSchemaWorkingDraft(current), {
  documentation:setPropertyDocumentation(parent.documentation, "/login_status", {
    displayName:"", description:"", example:{ value:"logged in", selectionMethod:"allowed value" },
  }),
}, "Change /login_status example");
const published = publishSchemaWorkingDraft(draft);
assert.deepEqual(published.documentation.properties["/login_status"].example, { value:"logged in", selectionMethod:"allowed value" });
assert.deepEqual(published.revisionHistory[0].documentation.properties["/login_status"].example, { value:"not logged in", selectionMethod:"custom" });

const destination = { id:"destination", name:"Destination", version:1, published:true, document:{ type:"object", properties:{} }, assignments:[] };
const copyPlan = planSchemaPropertyCopy({
  source:schemaPropertyCopySource(current, { surface:"current" }),
  destination,
  selectedPath:"/login_status",
  schemas:[current, destination],
  reusableRuleIds:[],
});
const copied = applySchemaPropertyCopy(copyPlan);
assert.deepEqual(copied.schema.workingDraft.documentation.properties["/login_status"].example, { value:"not logged in", selectionMethod:"custom" });
assert.deepEqual(undoSchemaPropertyCopy(copied).schema, destination);

const removal = removeSchemaProperty(current.document, current.attachedRules, "/products", current.documentation);
assert.equal(removal.documentation.properties?.["/products/*/id"], undefined);
assert.deepEqual(undoSchemaPropertyRemoval(removal).documentation.properties["/products/*/id"].example, { value:1, selectionMethod:"custom" });

console.log("schema property example value tests passed");
