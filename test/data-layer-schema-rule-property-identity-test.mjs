import assert from "node:assert/strict";

import {
  attachRuleToSchemaProperty,
  schemaPropertyRows,
} from "../dist/data-layer-schema-rule-property-identity.js";

const pathKeyed = {
  type:"object",
  properties:{
    "/page_type":{ type:"string", propertyOrigin:"manual" },
    "/page_levels":{ type:"array" },
    "/page_levels/0":{ type:"string" },
    products:{ type:"array", items:{ type:"object", properties:{ name:{ type:"string" } } } },
  },
};
const inherited = {
  type:"object",
  properties:{ "/customer/id":{ type:"string" } },
};

const rows = schemaPropertyRows(pathKeyed, [inherited]);
assert.deepEqual(
  rows.map(({ canonicalPath, displayPath, origin, schema }) => ({ canonicalPath, displayPath, origin, type:schema.type })),
  [
    { canonicalPath:"/page_type", displayPath:"page_type", origin:"local", type:"string" },
    { canonicalPath:"/page_levels", displayPath:"page_levels", origin:"local", type:"array" },
    { canonicalPath:"/page_levels/0", displayPath:"page_levels.0", origin:"local", type:"string" },
    { canonicalPath:"/products", displayPath:"products", origin:"local", type:"array" },
    { canonicalPath:"/products/*", displayPath:"products.*", origin:"local", type:"object" },
    { canonicalPath:"/products/*/name", displayPath:"products.*.name", origin:"local", type:"string" },
    { canonicalPath:"/customer/id", displayPath:"customer.id", origin:"inherited", type:"string" },
  ],
  "path-keyed, nested, array, and inherited definitions must share one ordered canonical row identity",
);
assert.equal(rows.filter(({ canonicalPath }) => canonicalPath === "/page_type").length, 1);

const draft = {
  id:"schema-page-view",
  name:"Page view",
  version:4,
  document:pathKeyed,
  assignments:[],
  attachedRules:[],
};
const documentBytes = JSON.stringify(draft.document);
const required = { id:"local-required", name:"Required for page_type", version:1, operator:"required", enabled:true };
const attached = attachRuleToSchemaProperty(draft, "/page_type", required);
assert.equal(JSON.stringify(attached.document), documentBytes, "attaching a rule must preserve schema document bytes");
assert.deepEqual(attached.attachedRules, [{ ...required, propertyPath:"/page_type" }]);
assert.deepEqual(schemaPropertyRows(attached.document, [inherited]).map(({ canonicalPath }) => canonicalPath), rows.map(({ canonicalPath }) => canonicalPath));

const allowed = { id:"local-allowed", name:"Allowed values for page_type", version:1, operator:"allowed-values", parameters:"product,content", enabled:true };
const distinct = attachRuleToSchemaProperty(attached, "page_type", allowed);
assert.equal(distinct.attachedRules.length, 2, "distinct local rules on one canonical property must be retained");
assert.equal(JSON.stringify(distinct.document), documentBytes);

const approved = { id:"rule-approved", name:"Approved page types", version:2, operator:"allowed-values", parameters:"product,content", enabled:true };
const reusable = attachRuleToSchemaProperty(distinct, "page_type", approved);
const retried = attachRuleToSchemaProperty(reusable, "/page_type", approved);
assert.deepEqual(retried, reusable, "retrying the same reusable identity and version must be idempotent");
assert.equal(retried.attachedRules.filter(({ id, version, propertyPath }) => id === approved.id && version === 2 && propertyPath === "/page_type").length, 1);

for (const canonicalPath of ["/page_levels/0", "/products/*/name", "/customer/id"]) {
  const before = JSON.stringify(retried.document);
  const next = attachRuleToSchemaProperty(retried, canonicalPath, { id:`rule:${canonicalPath}`, name:"Compatible", version:1, enabled:true });
  assert.equal(next.attachedRules.at(-1).propertyPath, canonicalPath);
  assert.equal(JSON.stringify(next.document), before, `${canonicalPath} attachment must not migrate its property definition`);
}

console.log("schema rule property identity: canonical rows and lossless attachments passed");
