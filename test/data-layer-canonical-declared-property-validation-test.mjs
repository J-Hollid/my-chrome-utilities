import assert from "node:assert/strict";

import { validateWithSchema } from "../dist/data-layer-schema-verification.js";

const event = (payload) => ({ sourceId:"history", eventName:"pageview", payload, rawInput:[] });
const assignment = { sourceId:"history", eventName:"pageview", target:"payload" };
const document = {
  type:"object",
  additionalProperties:false,
  required:["/page_type"],
  properties:{
    "/page_type":{ type:"string" },
    "/login_status":{ type:"string" },
    "/page_levels":{ type:"array" },
    "/page_levels/0":{ type:"string" },
  },
};
const schema = {
  id:"schema-generic-pageview",
  name:"Generic pageview",
  version:3,
  document,
  assignments:[assignment],
  attachedRules:[{ id:"page-type-values", name:"Page types", version:2, propertyPath:"/page_type", operator:"allowed-values", parameters:"product,content" }],
};
const documentBytes = JSON.stringify(document);

const valid = validateWithSchema(event({ page_type:"product", login_status:"logged in", page_levels:["product"] }), schema, [schema]);
assert.equal(valid.state, "Valid");
assert.deepEqual(valid.issues, [], "canonical path-keyed declarations must accept ordinary payload keys");
assert.equal(JSON.stringify(document), documentBytes, "validation must not migrate the stored schema document");

const extra = validateWithSchema(event({ page_type:"product", login_status:"logged in", page_levels:["product"], debug:true }), schema, [schema]);
assert.deepEqual(extra.issues, [{
  instancePath:"/debug",
  message:"Undeclared property",
  expected:"declared property",
  actual:"boolean",
  schemaName:"Generic pageview",
  schemaVersion:3,
  schemaLocation:"#/additionalProperties",
}]);

const wrongType = validateWithSchema(event({ page_type:42, login_status:"logged in", page_levels:["product"] }), schema, [schema]);
assert.deepEqual(wrongType.issues.map(({ instancePath, message }) => [instancePath, message]), [["/page_type", "Type mismatch"]]);
assert.equal(wrongType.issues.some(({ message }) => message === "Undeclared property"), false);
const normalizedSchema = { ...schema, document:{
  type:"object", additionalProperties:false, required:["page_type"], properties:{
    page_type:{ type:"string" }, login_status:{ type:"string" },
    page_levels:{ type:"array", items:{ type:"string" } },
  },
} };
assert.deepEqual(
  validateWithSchema(event({ page_type:42, login_status:"logged in", page_levels:["product"] }), normalizedSchema, [normalizedSchema]),
  wrongType,
  "equivalent nested and path-keyed declarations must suppress the same redundant rule failures",
);

const missing = validateWithSchema(event({ login_status:"logged in", page_levels:["product"] }), schema, [schema]);
assert.deepEqual(missing.issues.map(({ instancePath, message }) => [instancePath, message]), [["/page_type", "Required value"]]);

const disallowed = validateWithSchema(event({ page_type:"internal", login_status:"logged in", page_levels:["product"] }), schema, [schema]);
assert.deepEqual(disallowed.issues.map(({ instancePath, message }) => [instancePath, message]), [["/page_type", "Value is not allowed"]]);

const wrongItem = validateWithSchema(event({ page_type:"product", login_status:"logged in", page_levels:[42] }), schema, [schema]);
assert.deepEqual(wrongItem.issues.map(({ instancePath, message }) => [instancePath, message]), [["/page_levels/0", "Type mismatch"]]);

const parentDocument = { type:"object", properties:{ "/site_id":{ type:"string" } } };
const parent = { id:"schema-generic-event", name:"Generic event", version:2, document:parentDocument, assignments:[] };
const childDocument = { type:"object", additionalProperties:false, properties:{ "/page_type":{ type:"string" } } };
const child = { id:"schema-generic-pageview", name:"Generic pageview", version:3, parentSchemaId:parent.id, document:childDocument, assignments:[assignment] };
const parentBytes = JSON.stringify(parentDocument); const childBytes = JSON.stringify(childDocument);
const inherited = validateWithSchema(event({ site_id:"otelo", page_type:"product", debug:true }), child, [parent, child]);
assert.deepEqual(inherited.issues.map(({ instancePath, message }) => [instancePath, message]), [["/debug", "Undeclared property"]]);
assert.equal(JSON.stringify(parentDocument), parentBytes); assert.equal(JSON.stringify(childDocument), childBytes);

const openDocument = { ...document, additionalProperties:true };
assert.equal(validateWithSchema(event({ page_type:"product", login_status:"logged in", page_levels:["product"], debug:true }), { ...schema, document:openDocument }, [schema]).issues.length, 0);

console.log("canonical declared property validation: path-keyed, inherited, array, and rule checks passed");
