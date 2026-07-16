import assert from "node:assert/strict";
import Ajv2020 from "ajv/dist/2020.js";

import {
  createExtensionSchemaPackage,
  exportJsonSchemaBundle,
  exportJsonSchemaResource,
  inspectJsonSchemaExport,
  jsonSchemaResourceId,
} from "../dist/data-layer-json-schema-export.js";

const parent = {
  id:"schema-generic", name:"Generic page view", version:3, published:true, assignments:[],
  document:{ type:"object", additionalProperties:false, properties:{
    page_type:{ type:"string" }, debug:{ type:"boolean" },
  } },
  attachedRules:[
    { id:"exact-page", name:"Exact page", version:1, propertyPath:"/page_type", operator:"exact-value", parameters:"product_detail" },
    { id:"forbid-debug", name:"No debug", version:1, propertyPath:"/debug", operator:"forbidden-property" },
  ],
};
const product = {
  id:"schema-product-detail", name:"Product detail", version:4, published:true, parentSchemaId:parent.id,
  assignments:[{ sourceId:"history", eventName:"product_detail", target:"payload" }],
  document:{ type:"object", properties:{
    page_name:{ type:"string" }, currency:{ type:"string" }, transaction_id:{ type:"string" }, product_id:{ type:"string" },
    revenue:{ type:"number" }, title:{ type:"string" }, items:{ type:"array", items:{ type:"object", properties:{} } },
    metadata:{ type:"object", properties:{ settings:{ type:"object", properties:{} } } },
  } },
  documentation:{ description:"Product event", properties:{
    "/page_name":{ displayName:"Page name", description:"Visible page title", example:{ value:"Notebook", selectionMethod:"custom" } },
  } },
  attachedRules:[
    { id:"required-name", name:"Required name", version:1, propertyPath:"/page_name", operator:"required" },
    { id:"allowed-currency", name:"Currencies", version:1, propertyPath:"/currency", operator:"allowed-values", allowedValues:["EUR","USD"] },
    { id:"transaction-pattern", name:"Transaction pattern", version:1, propertyPath:"/transaction_id", operator:"regular-expression", parameters:"^[A-Z]+-[0-9]+$" },
    { id:"digits", name:"Digits", version:1, propertyPath:"/product_id", operator:"digits-only" },
    { id:"non-empty", name:"Nonempty", version:1, propertyPath:"/page_name", operator:"non-empty-string" },
    { id:"range", name:"Revenue range", version:1, propertyPath:"/revenue", operator:"numeric-range", parameters:"0,1000" },
    { id:"title-count", name:"Title length", version:1, propertyPath:"/title", operator:"text-length", comparison:"<=", limit:50, parameters:"50" },
    { id:"item-count", name:"Items", version:1, propertyPath:"/items", operator:"item-count", comparison:">", limit:2, parameters:"2" },
    { id:"metadata-open", name:"Allow metadata", version:1, propertyPath:"/metadata", operator:"allow-undeclared-properties" },
    { id:"conditional-currency", name:"Conditional currency", version:1, propertyPath:"/currency", operator:"required", conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/page_type", operator:"Equals", comparison:{ type:"string", value:"product_detail" } }] } },
  ],
  revisionHistory:[{ ...parent, id:"history", name:"Old product", version:1 }],
  workingDraft:{ baseVersion:4, sourceVersion:4, document:{ type:"object", properties:{ pending:{ type:"string" } } }, assignments:[], pendingChanges:["pending"] },
};

const { document, filename, compatibility } = exportJsonSchemaResource(product, [parent, product]);
assert.equal(document.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(document.$id, jsonSchemaResourceId(product));
assert.equal(document.title, "Product detail");
assert.equal(document.description, "Product event");
assert.equal(filename, "product-detail-revision-4.schema.json");
assert.equal(document.properties.page_type.const, "product_detail");
assert.equal(document.not.anyOf[0].required[0], "debug");
assert.equal(document.required.includes("page_name"), true);
assert.deepEqual(document.properties.currency.enum, ["EUR", "USD"]);
assert.equal(document.properties.transaction_id.pattern, "^[A-Z]+-[0-9]+$");
assert.equal(document.properties.product_id.pattern, "^[0-9]+$");
assert.equal(document.properties.page_name.minLength, 1);
assert.deepEqual({ minimum:document.properties.revenue.minimum, maximum:document.properties.revenue.maximum }, { minimum:0, maximum:1000 });
assert.equal(document.properties.title.maxLength, 50);
assert.equal(document.properties.items.minItems, 3);
assert.equal(document.additionalProperties, false);
assert.equal(document.properties.metadata.additionalProperties, true);
assert.equal(document.properties.metadata.properties.settings.additionalProperties, false);
assert.equal(document.properties.page_name.description, "Visible page title");
assert.deepEqual(document.properties.page_name.examples, ["Notebook"]);
assert.deepEqual(document.allOf[0].if.properties.page_type.const, "product_detail");
assert.equal(document.allOf[0].then.required.includes("currency"), true);
assert.equal(JSON.stringify(document).includes("workingDraft"), false);
assert.equal(JSON.stringify(document).includes("severity"), false);
for (const extensionField of ["parentSchemaId", "attachedRules", "assignments", "message", "revisionHistory", "inheritedRuleOverrides", "propertyPath", "operator", "forbidden"]) {
  assert.equal(Object.prototype.hasOwnProperty.call(document, extensionField) || JSON.stringify(document).includes(`\"${extensionField}\"`), false, `Leaked extension field ${extensionField}`);
}
assert.equal(compatibility.omitted.length, 0);

for (const [operator, predicateFields] of [
  ["Equals", { const:"product_detail" }],
  ["Does not equal", { not:{ const:"internal" } }],
  ["Is one of", { enum:["product", "cart"] }],
  ["Matches pattern", { pattern:"^product_" }],
  ["Is greater than", { exclusiveMinimum:0 }],
  ["Is at least", { minimum:0 }],
]) {
  const numeric = operator === "Is greater than" || operator === "Is at least";
  const comparison = numeric ? { type:"number", value:0 } : { type:"string", value:operator === "Does not equal" ? "internal" : operator === "Matches pattern" ? "^product_" : "product_detail" };
  const predicate = { propertyPath:numeric ? "/revenue" : "/page_type", operator, comparison, ...(operator === "Is one of" ? { comparisons:[{ type:"string", value:"product" }, { type:"string", value:"cart" }] } : {}) };
  const candidate = { ...product, id:`conditional-${operator}`, attachedRules:[{ id:"conditional", name:"Conditional", version:1, propertyPath:"/currency", operator:"required", conditionGroup:{ operator:"All", predicates:[predicate] } }] };
  const conditional = exportJsonSchemaResource(candidate, [parent, candidate]).document.allOf[0];
  assert.deepEqual(conditional.if.properties[numeric ? "revenue" : "page_type"], predicateFields);
  assert.deepEqual(conditional.if.required, [numeric ? "revenue" : "page_type"]);
  assert.deepEqual(conditional.then.required, ["currency"]);
}
for (const [operator, expected] of [
  ["Exists", { required:["coupon"] }],
  ["Does not exist", { not:{ anyOf:[{ required:["coupon"] }] } }],
]) {
  const candidate = { ...product, id:`conditional-${operator}`, attachedRules:[{ id:"conditional", name:"Conditional", version:1, propertyPath:"/currency", operator:"required", conditionGroup:{ operator:"All", predicates:[{ propertyPath:"/coupon", operator }] } }] };
  assert.deepEqual(exportJsonSchemaResource(candidate, [parent, candidate]).document.allOf[0].if, expected);
}

const ajv = new Ajv2020({ strict:false });
assert.equal(ajv.validateSchema(document), true, JSON.stringify(ajv.errors));
const validate = ajv.compile(document);
const valid = { page_type:"product_detail", page_name:"Notebook", currency:"EUR", transaction_id:"ABC-1", product_id:"123", revenue:5, title:"x".repeat(50), items:[{},{},{}], metadata:{ source:"feed", settings:{} } };
assert.equal(validate(valid), true, JSON.stringify(validate.errors));
assert.equal(validate({ ...valid, debug:true }), false);
assert.equal(validate({ ...valid, title:"x".repeat(51) }), false);
assert.equal(validate({ ...valid, currency:undefined }), false);

for (const [operator, comparison, expected] of [
  ["text-length", ">", { minLength:51 }], ["text-length", ">=", { minLength:50 }], ["text-length", "==", { minLength:50, maxLength:50 }], ["text-length", "<", { maxLength:49 }], ["text-length", "<=", { maxLength:50 }],
  ["item-count", ">", { minItems:51 }], ["item-count", ">=", { minItems:50 }], ["item-count", "==", { minItems:50, maxItems:50 }], ["item-count", "<", { maxItems:49 }], ["item-count", "<=", { maxItems:50 }],
]) {
  const type = operator === "text-length" ? "string" : "array";
  const property = type === "string" ? { type } : { type, items:{ type:"string" } };
  const schema = { id:`schema-${operator}-${comparison}`, name:"Cardinality", version:1, published:true, assignments:[], document:{ type:"object", properties:{ value:property } }, attachedRules:[{ id:"rule", version:1, propertyPath:"/value", operator, comparison, limit:50, parameters:"50" }] };
  assert.deepEqual(Object.fromEntries(Object.entries(exportJsonSchemaResource(schema, [schema]).document.properties.value).filter(([key]) => key !== "type" && key !== "items")), expected);
}

for (const operator of ["text-length", "item-count"]) {
  const type = operator === "text-length" ? "string" : "array";
  const property = type === "string" ? { type } : { type, items:{ type:"string" } };
  const schema = { id:`schema-${operator}-impossible`, name:"Impossible cardinality", version:1, published:true, assignments:[], document:{ type:"object", properties:{ value:property } }, attachedRules:[{ id:"rule", version:1, propertyPath:"/value", operator, comparison:"<", limit:0, parameters:"0" }] };
  const exported = exportJsonSchemaResource(schema, [schema]).document;
  assert.deepEqual(exported.properties.value.not, {});
  assert.equal(ajv.validateSchema(exported), true, JSON.stringify(ajv.errors));
  const validateImpossible = ajv.compile(exported);
  assert.equal(validateImpossible({ value:type === "string" ? "" : [] }), false);
}

const unsupported = { ...product, id:"schema-unsupported", attachedRules:[...product.attachedRules, { id:"custom", name:"Partner contract", version:1, propertyPath:"/metadata", operator:"partner-contract", severity:"warning", message:"Custom" }] };
const review = inspectJsonSchemaExport(unsupported, [parent, unsupported]);
assert.deepEqual(review.omitted, [{ ruleId:"custom", ruleName:"Partner contract", propertyPath:"/metadata", behavior:"partner-contract" }]);
assert.equal(review.conversions.some(({ ruleId }) => ruleId === "custom"), false);
const lossy = exportJsonSchemaResource(unsupported, [parent, unsupported]);
assert.equal(JSON.stringify(lossy.document).includes("partner-contract"), false);
const warned = { ...product, id:"schema-warning", attachedRules:[{ id:"warning", name:"Warning", version:1, propertyPath:"/page_name", operator:"required", severity:"warning", message:"Use a page name" }] };
assert.match(inspectJsonSchemaExport(warned, [parent, warned]).conversions[0].conversion, /standard pass or fail assertion/);

const checkout = { id:"schema-checkout", name:"Checkout", version:2, published:true, assignments:[], document:{ type:"object", properties:{} } };
const draft = { id:"schema-draft", name:"Draft", version:0, published:false, assignments:[], document:{ type:"object" }, workingDraft:{ baseVersion:0, sourceVersion:0, document:{ type:"object" }, assignments:[], pendingChanges:[] } };
const bundle = exportJsonSchemaBundle([parent, product, checkout, draft]);
assert.equal(bundle.document.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(Object.keys(bundle.document.$defs).length, 3);
assert.equal(bundle.resourceIds.length, 3);
for (const resource of Object.values(bundle.document.$defs)) assert.equal(ajv.validateSchema(resource), true, JSON.stringify(ajv.errors));
const bundleRegistry = new Ajv2020({ strict:false });
for (const resource of Object.values(bundle.document.$defs)) bundleRegistry.addSchema(resource);
for (const id of bundle.resourceIds) assert.equal(typeof bundleRegistry.getSchema(id), "function", `Missing independently retrievable resource ${id}`);

const reusableRules = [{ id:"allowed-currency", name:"Currencies" }, { id:"unrelated", name:"Unrelated" }];
const extensionPackage = createExtensionSchemaPackage(product, [parent, product, checkout], reusableRules);
assert.deepEqual(extensionPackage.schemas.map(({ id }) => id), [parent.id, product.id]);
assert.deepEqual(extensionPackage.rules.map(({ id }) => id), ["allowed-currency"]);

console.log("JSON Schema Draft 2020-12 export tests passed");
