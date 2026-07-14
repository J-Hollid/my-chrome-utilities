import assert from "node:assert/strict";
import { assignSchema, assignableSchemas, createSchema, createSchemaLibraryExport, createSchemaWorkingDraft, discardSchemaWorkingDraft, duplicateSchema, duplicateSchemaRevision, exportSchema, filterByValidation, importSchema, migrateSchemaLibrary, publishSchemaWorkingDraft, resolveSchemaAssignment, restoreSchemaLibrary, restoreSchemaRevisionDraft, revalidateExplicitly, reviseSchema, schemaInheritanceConflict, schemaInheritanceError, schemaRevision, schemaRevisionChoices, searchSchemas, serializeSchemaLibrary, serializeSchemaLibraryExport, updateSchemaWorkingDraft, validateEvent, validateWithSchema, validationSummary } from "../dist/data-layer-schema-verification.js";
import { typedComparisonValue } from "../dist/data-layer-conditional-validation-rules.js";
let schema = createSchema("Purchase event", 2, { type: "object", required: ["transaction_id"], properties: { transaction_id: { type: "string" }, revenue: { type: "number" } } });
schema = assignSchema(schema, { sourceId: "history", eventName: "purchase", target: "payload" });
const valid = validateEvent({ sourceId: "history", eventName: "purchase", payload: { transaction_id: "test-123", revenue: 49.95 }, rawInput: [] }, [schema]);
assert.equal(valid.state, "Valid");
const invalid = validateEvent({ sourceId: "history", eventName: "purchase", payload: { revenue: "bad" }, rawInput: [] }, [schema]);
assert.equal(invalid.state, "2 issues"); assert.deepEqual(invalid.issues[0], { instancePath: "/transaction_id", message: "Required value", expected: "string", actual: "missing", schemaName: "Purchase event", schemaVersion: 2, schemaLocation: "#/required" });
assert.equal(validateEvent({ sourceId: "history", eventName: "offer_view", payload: {}, rawInput: [] }, [schema]).state, "Not checked");
assert.deepEqual(validationSummary([valid, invalid, { state: "1 warnings", issues: [] }, { state: "Not checked", issues: [] }, { state: "Assignment error", issues: [] }]), { "Not checked": 1, Valid: 1, Warnings: 1, Issues: 1, "Assignment error": 1 });
assert.equal(filterByValidation([{ validation: "Valid" }, { validation: "2 issues" }], "2 issues").length, 1);
assert.equal(searchSchemas([schema], "history").length, 1); assert.deepEqual(importSchema(exportSchema(schema)), schema);
const revised = reviseSchema(schema, { type: "object", required: ["revenue"] }); assert.equal(revised.version, 3); assert.equal(revised.revisionHistory?.[0]?.version, 2); assert.equal(revalidateExplicitly({ sourceId: "history", eventName: "purchase", payload: {}, rawInput: [] }, [schema, revised], 2).schema.version, 2);
assert.equal(duplicateSchema(schema, "Purchase copy").name, "Purchase copy");
const parent = createSchema("Parent", 1, {});
assert.equal(schemaInheritanceError({ ...createSchema("Child", 1, {}), parentSchemaId:parent.id }, [parent]), undefined);
assert.match(schemaInheritanceError({ ...createSchema("Orphan", 1, {}), parentSchemaId:"schema:missing:1" }, [parent]), /does not exist/);
assert.match(schemaInheritanceError({ ...parent, parentSchemaId:parent.id }, [parent]), /cannot inherit from itself/);
const inheritedParent = createSchema("Inherited parent", 1, { type:"object", required:["account_id"], properties:{ account_id:{ type:"string" } } });
const inheritedChild = { ...assignSchema(createSchema("Inherited child", 1, { type:"object", properties:{ amount:{ type:"number" } } }), { sourceId:"history", eventName:"inherited", target:"payload" }), parentSchemaId:inheritedParent.id };
assert.equal(validateEvent({ sourceId:"history", eventName:"inherited", payload:{ amount:1 }, rawInput:[] }, [inheritedParent, inheritedChild]).state, "1 issues");
assert.deepEqual(validateEvent({ sourceId:"history", eventName:"inherited", payload:{ amount:1 }, rawInput:[] }, [inheritedParent, inheritedChild]).inheritedFrom, [{ id:inheritedParent.id, name:"Inherited parent", version:1 }]);
assert.equal(validateEvent({ sourceId:"history", eventName:"inherited", payload:{ amount:1 }, rawInput:[] }, [inheritedParent, { ...inheritedChild, inheritedRuleOverrides:{ account_id:"disabled" } }]).state, "Valid");
assert.match(schemaInheritanceConflict({ ...inheritedChild, document:{ type:"object", properties:{ account_id:{ type:"number" } } } }, [inheritedParent]), /Inheritance conflict/);
const inheritedRuleParent = { ...createSchema("Inherited rule parent", 4, { type:"object" }), attachedRules:[{ id:"rule:channel", name:"Known channels", version:2, propertyPath:"channel", operator:"allowed-values", parameters:"channel:web,app", severity:"warning", message:"Choose a known channel" }] };
const inheritedRuleChild = { ...assignSchema(createSchema("Inherited rule child", 1, { type:"object" }), { sourceId:"history", eventName:"inherited-rule", target:"payload" }), parentSchemaId:inheritedRuleParent.id };
assert.deepEqual(validateEvent({ sourceId:"history", eventName:"inherited-rule", payload:{ channel:"email" }, rawInput:[] }, [inheritedRuleParent, inheritedRuleChild]).issues, [{ instancePath:"/channel", message:"Choose a known channel", expected:"web,app", actual:"email", schemaName:"Inherited rule parent", schemaVersion:4, schemaLocation:"#/attachedRules/rule:channel", rule:"Known channels v2", severity:"warning", origin:"Inherited rule parent v4", allowedValues:["web", "app"] }]);
const configuredRule = assignSchema({ ...createSchema("Configured rule", 3, { type:"object" }), attachedRules:[{ id:"rule:page-type", name:"Known page types", version:7, operator:"allowed-values", parameters:"page_type:product,checkout", severity:"warning", message:"Choose a supported page type" }] }, { sourceId:"history", eventName:"configured", target:"payload" });
assert.equal(validateEvent({ sourceId:"history", eventName:"configured", payload:{ page_type:"unknown" }, rawInput:[] }, [configuredRule]).state, "1 warnings");
assert.deepEqual(validateEvent({ sourceId:"history", eventName:"configured", payload:{ page_type:"unknown" }, rawInput:[] }, [configuredRule]).issues, [{ instancePath:"/page_type", message:"Choose a supported page type", expected:"product,checkout", actual:"unknown", schemaName:"Configured rule", schemaVersion:3, schemaLocation:"#/attachedRules/rule:page-type", rule:"Known page types v7", severity:"warning", origin:"Configured rule v3", allowedValues:["product", "checkout"] }]);
assert.equal(validateEvent({ sourceId:"history", eventName:"configured", payload:{ page_type:"unknown" }, rawInput:[] }, [{ ...configuredRule, document:{ type:"object", required:["event_id"], properties:{ event_id:{ type:"string" } } } }]).state, "1 error and 1 warning");
assert.deepEqual(validateEvent({ sourceId:"history", eventName:"configured", payload:{ page_type:"product" }, rawInput:[] }, [configuredRule]).evaluations, [{ propertyPath:"page_type", status:"pass", message:"Choose a supported page type", expected:"product,checkout", actual:"product", rule:"Known page types", ruleVersion:7, severity:"warning", schemaName:"Configured rule", schemaVersion:3 }]);
const rangedRule = assignSchema({ ...createSchema("Ranged rule", 1, { type:"object", properties:{ revenue:{ type:"number" } } }), attachedRules:[{ id:"rule:revenue", name:"Expected revenue", version:1, propertyPath:"/revenue", operator:"numeric-range", parameters:"10,20" }] }, { sourceId:"history", eventName:"ranged", target:"payload" });
assert.equal(validateEvent({ sourceId:"history", eventName:"ranged", payload:{ revenue:15 }, rawInput:[] }, [rangedRule]).state, "Valid");
assert.equal(validateEvent({ sourceId:"history", eventName:"ranged", payload:{ revenue:25 }, rawInput:[] }, [rangedRule]).issues[0].message, "Value is outside range");
const productCondition = { propertyPath:"/page_type", operator:"Equals", comparison:typedComparisonValue("product_detail"), detectedType:"string" };
const conditionalProduct = assignSchema({
  ...createSchema("Product event", 1, { type:"object", properties:{ page_type:{ type:"string" }, oOrder:{ type:"object", properties:{ aProducts:{ type:"array" } } } } }),
  attachedRules:[{
    id:"rule:products-required", name:"Product detail products", version:1,
    propertyPath:"/oOrder/aProducts", operator:"item-count", parameters:"1", severity:"error",
    conditionGroup:{ operator:"All", predicates:[productCondition] },
  }],
}, { sourceId:"history", eventName:"product_detail", target:"payload" });
const conditionalResult = (payload) => validateEvent({ sourceId:"history", eventName:"product_detail", payload, rawInput:[] }, [conditionalProduct]);
for (const payload of [
  { page_type:"product_detail", oOrder:{} },
  { page_type:"product_detail", oOrder:{ aProducts:[] } },
]) {
  const result = conditionalResult(payload);
  assert.equal(result.state, "1 issues");
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].instancePath, "/oOrder/aProducts");
  assert.equal(result.issues[0].conditionSummary, "When page_type equals product_detail, oOrder.aProducts must contain at least 1 item");
  assert.equal(result.evaluations[0].status, "error");
}
const passingConditional = conditionalResult({ page_type:"product_detail", oOrder:{ aProducts:[{ sku:"ABC" }] } });
assert.equal(passingConditional.state, "Valid");
assert.equal(passingConditional.evaluations[0].status, "pass");
const inapplicableConditional = conditionalResult({ page_type:"category", oOrder:{} });
assert.equal(inapplicableConditional.state, "Valid");
assert.equal(inapplicableConditional.issues.length, 0);
assert.equal(inapplicableConditional.evaluations[0].status, "not-applicable");
assert.match(inapplicableConditional.evaluations[0].message, /page_type equals product_detail/);
assert.equal(inapplicableConditional.evaluations[0].propertyPath, "/oOrder/aProducts");
assert.equal(inapplicableConditional.evaluations.some(({ propertyPath }) => propertyPath === "/page_type"), false);
const generic = assignSchema(createSchema("Generic page view", 4, { type:"object" }), { id:"generic", name:"generic-page-view", sourceId:"history", eventName:"page_view", target:"payload", priority:10, enabled:true });
const order = assignSchema(createSchema("Order confirmation", 2, { type:"object" }), { id:"order", name:"order-confirmation", sourceId:"history", eventName:"page_view", target:"payload", priority:100, domainCondition:"shop.example", pathnameCondition:"/order-confirmation", enabled:true });
assert.equal(resolveSchemaAssignment({ sourceId:"history", eventName:"page_view" }, "https://shop.example/order-confirmation?order=42#done", [generic, order]).schema.name, "Order confirmation");
assert.equal(resolveSchemaAssignment({ sourceId:"history", eventName:"page_view" }, "https://uk.shop.example/products", [assignSchema(generic, { id:"wildcard", name:"wildcard", sourceId:"history", eventName:"page_view", target:"payload", priority:20, domainCondition:"*.shop.example" })]).assignment.name, "wildcard");
const selectedPaths = assignSchema(createSchema("Selected paths", 1, { type:"object" }), { id:"selected-paths", sourceId:"history", eventName:"page_view", target:"payload", priority:50, domainCondition:"shop.example", pathConditions:[{ matchType:"Exact path", expression:"/" }, { matchType:"Path pattern", expression:"/products/*" }] });
assert.equal(resolveSchemaAssignment({ sourceId:"history", eventName:"page_view" }, "https://shop.example/products/field-notebook", [generic, selectedPaths]).schema.name, "Selected paths");
assert.equal(resolveSchemaAssignment({ sourceId:"history", eventName:"page_view" }, "https://shop.example/checkout", [generic, selectedPaths]).schema.name, "Generic page view");
const mixedValidityPaths = assignSchema(createSchema("Mixed path conditions", 1, { type:"object" }), { id:"mixed-paths", sourceId:"history", eventName:"page_view", target:"payload", priority:60, domainCondition:"shop.example", pathConditions:[{ matchType:"Regular expression", expression:"[" }, { matchType:"Exact path", expression:"/products/field-notebook" }] });
assert.equal(resolveSchemaAssignment({ sourceId:"history", eventName:"page_view" }, "https://shop.example/products/field-notebook", [generic, mixedValidityPaths]).schema.name, "Mixed path conditions");
const tied = assignSchema(createSchema("Tied", 1, {}), { id:"tied", name:"tied", sourceId:"history", eventName:"page_view", target:"payload", priority:100 });
assert.match(resolveSchemaAssignment({ sourceId:"history", eventName:"page_view" }, "https://shop.example/order-confirmation", [order, tied]).error, /Assignment error/);
assert.equal(validateEvent({ sourceId:"history", eventName:"page_view", payload:{}, rawInput:[] }, [order, tied], "https://shop.example/order-confirmation").state, "Assignment error");
assert.deepEqual(restoreSchemaLibrary(serializeSchemaLibrary([generic, order])), [generic, order]);
const exportSnapshot = createSchemaLibraryExport([generic], [{ id:"rule:a", parameters:"product" }]);
generic.name = "Changed after export";
assert.equal(exportSnapshot.version, 1);
assert.equal(exportSnapshot.schemas[0].name, "Generic page view");
assert.notEqual(exportSnapshot.schemas[0], generic);
assert.deepEqual(exportSnapshot.rules, [{ id:"rule:a", parameters:"product" }]);
assert.deepEqual(JSON.parse(serializeSchemaLibraryExport([generic, order], [{ id:"rule:a" }, { id:"rule:b" }])), { version:1, schemas:[generic, order], rules:[{ id:"rule:a" }, { id:"rule:b" }] });

const stableProduct = {
  ...createSchema("Product listing", 3, { type:"object", properties:{ product_id:{ type:"string" } } }),
  id:"schema-product-listing",
  assignments:[{ id:"assignment:product", name:"Product pages", schemaId:"schema-product-listing", schemaVersion:3, sourceId:"history", eventName:"pageview", target:"payload", versionPolicy:"pinned", enabled:true }],
};
const firstDraft = createSchemaWorkingDraft(stableProduct);
assert.equal(firstDraft.version, 3);
assert.equal(firstDraft.workingDraft.baseVersion, 3);
assert.deepEqual(firstDraft.document, stableProduct.document);
assert.deepEqual(firstDraft.workingDraft.pendingChanges, []);
const pageTypeDraft = updateSchemaWorkingDraft(firstDraft, {
  document:{ type:"object", properties:{ product_id:{ type:"string" }, page_type:{ type:"string" } } },
  attachedRules:[{ id:"rule:page-type", version:1, propertyPath:"page_type", operator:"allowed-values", parameters:"page_type:product,listing" }],
}, "Add page_type rule");
const twoChangeDraft = updateSchemaWorkingDraft(pageTypeDraft, {
  document:{ type:"object", properties:{ product_id:{ type:"string" }, page_type:{ type:"string" }, page_name:{ type:"string" } } },
}, "Add page_name rule");
assert.equal(twoChangeDraft.version, 3);
assert.equal(twoChangeDraft.id, "schema-product-listing");
assert.equal(twoChangeDraft.document.properties.page_type, undefined);
assert.deepEqual(twoChangeDraft.workingDraft.pendingChanges, ["Add page_type rule", "Add page_name rule"]);
assert.deepEqual(restoreSchemaLibrary(serializeSchemaLibrary([twoChangeDraft]))[0].workingDraft, {
  ...twoChangeDraft.workingDraft,
  attachedRules:[{ ...twoChangeDraft.workingDraft.attachedRules[0], propertyPath:"/page_type", parameters:"product,listing" }],
});

const inheritedProduct = {
  ...stableProduct,
  parentSchemaId:"schema-parent",
  attachedRules:[{ id:"rule:legacy", version:1 }],
  inheritedRuleOverrides:{ "rule:legacy":"disabled" },
};
const clearedInheritance = publishSchemaWorkingDraft(updateSchemaWorkingDraft(inheritedProduct, {
  parentSchemaId:undefined,
  attachedRules:[],
  inheritedRuleOverrides:undefined,
}, "Clear inherited configuration"));
assert.equal(clearedInheritance.parentSchemaId, undefined);
assert.deepEqual(clearedInheritance.attachedRules, []);
assert.equal(clearedInheritance.inheritedRuleOverrides, undefined);

const pendingAssignment = { id:"assignment:checkout", name:"Checkout pages", schemaId:"schema-product-listing", schemaVersion:4, sourceId:"history", eventName:"checkout", target:"payload", versionPolicy:"follow latest", enabled:true };
const readyDraft = updateSchemaWorkingDraft(twoChangeDraft, { assignments:[...twoChangeDraft.assignments, pendingAssignment] }, "Add Checkout pages assignment");
assert.equal(resolveSchemaAssignment({ sourceId:"history", eventName:"checkout" }, "https://shop.example/checkout", [readyDraft]).schema, undefined);
const publishedProduct = publishSchemaWorkingDraft(readyDraft);
assert.equal(publishedProduct.id, "schema-product-listing");
assert.equal(publishedProduct.version, 4);
assert.equal(publishedProduct.workingDraft, undefined);
assert.deepEqual(publishedProduct.revisionHistory.map(({ version }) => version), [3]);
assert.ok(publishedProduct.document.properties.page_type);
assert.equal(resolveSchemaAssignment({ sourceId:"history", eventName:"checkout" }, "https://shop.example/checkout", [publishedProduct]).schema.version, 4);
assert.deepEqual(schemaRevisionChoices(publishedProduct), [3]);
assert.equal(schemaRevision(publishedProduct, 3).document.properties.page_type, undefined);
assert.equal(assignableSchemas([publishedProduct]).length, 1);

const pinnedProduct = { ...publishedProduct, assignments:[publishedProduct.assignments[0]] };
assert.equal(resolveSchemaAssignment({ sourceId:"history", eventName:"pageview" }, "https://shop.example/products", [pinnedProduct]).schema.version, 3);
const latestProduct = { ...publishedProduct, assignments:[{ ...publishedProduct.assignments[0], versionPolicy:"follow latest" }] };
assert.equal(resolveSchemaAssignment({ sourceId:"history", eventName:"pageview" }, "https://shop.example/products", [latestProduct]).schema.version, 4);

const restoredFromTwo = restoreSchemaRevisionDraft(publishedProduct, 3);
assert.equal(restoredFromTwo.version, 4);
assert.equal(restoredFromTwo.workingDraft.baseVersion, 4);
assert.equal(restoredFromTwo.workingDraft.sourceVersion, 3);
assert.deepEqual(discardSchemaWorkingDraft(restoredFromTwo), publishedProduct);
const duplicateFromThree = duplicateSchemaRevision(publishedProduct, 3);
assert.equal(duplicateFromThree.published, false);
assert.equal(duplicateFromThree.version, 1);
assert.match(duplicateFromThree.name, /Product listing revision 3 copy/);
assert.deepEqual(duplicateFromThree.document, schemaRevision(publishedProduct, 3).document);
assert.deepEqual(assignableSchemas([publishedProduct, duplicateFromThree]), [publishedProduct]);

const legacySchemas = [1, 2, 3, 4].map((version) => ({
  ...createSchema("Product listing", version, { type:"object", properties:{ [`revision_${version}`]:{ type:"string" } } }),
  assignments:version === 3 ? [{ id:"assignment:pinned", schemaId:`schema:product-listing:${version}`, schemaVersion:3, sourceId:"history", eventName:"pageview", target:"payload", versionPolicy:"pinned", enabled:true }] : version === 4 ? [{ id:"assignment:latest", schemaId:`schema:product-listing:${version}`, sourceId:"history", eventName:"purchase", target:"payload", versionPolicy:"follow latest", enabled:true }] : [],
}));
const migrated = migrateSchemaLibrary(legacySchemas);
assert.equal(migrated.length, 1);
assert.equal(migrated[0].id, "schema-product-listing");
assert.equal(migrated[0].version, 4);
assert.deepEqual(migrated[0].revisionHistory.map(({ version }) => version), [1, 2, 3]);
assert.deepEqual(migrated[0].assignments.map(({ schemaId, schemaVersion, versionPolicy }) => [schemaId, schemaVersion, versionPolicy]), [
  ["schema-product-listing", 3, "pinned"],
  ["schema-product-listing", undefined, "follow latest"],
]);
assert.deepEqual(restoreSchemaLibrary(serializeSchemaLibrary(legacySchemas)), migrated);

const documentedV3 = {
  ...assignSchema(createSchema("Documented product", 3, { type:"object", properties:{ page_type:{ type:"string" } } }), { sourceId:"history", eventName:"documented", target:"payload", versionPolicy:"pinned", schemaVersion:3 }),
  documentation:{ description:"Revision 3 schema", properties:{ "/page_type":{ displayName:"Page classification", description:"Revision 3 description" } } },
};
const documentedDraft = updateSchemaWorkingDraft(documentedV3, {
  documentation:{ description:"Revision 4 schema", properties:{ "/page_type":{ displayName:"Page classification", description:"Revision 4 description" } } },
}, "Update documentation");
assert.equal(documentedDraft.documentation.properties["/page_type"].description, "Revision 3 description");
assert.equal(documentedDraft.workingDraft.documentation.properties["/page_type"].description, "Revision 4 description");
const documentedV4 = publishSchemaWorkingDraft(documentedDraft);
assert.equal(documentedV4.documentation.properties["/page_type"].description, "Revision 4 description");
assert.equal(schemaRevision(documentedV4, 3).documentation.properties["/page_type"].description, "Revision 3 description");
const documentedValidation = validateEvent({ sourceId:"history", eventName:"documented", payload:{ page_type:"product_detail" }, rawInput:[] }, [documentedV4], "https://shop.example/product");
assert.equal(documentedValidation.documentation.properties["/page_type"].description, "Revision 3 description");
assert.deepEqual(restoreSchemaLibrary(serializeSchemaLibrary([documentedV4])), [documentedV4]);
assert.equal(validateWithSchema({ sourceId:"history", eventName:"legacy", payload:{}, rawInput:[] }, createSchema("Legacy", 1, { type:"object" }), []).documentation, undefined);

const documentedParent = { ...createSchema("Documented parent", 2, { type:"object" }), documentation:{ properties:{ "/currency":{ displayName:"Currency", description:"Inherited currency" } } } };
const documentedChild = { ...createSchema("Documented child", 3, { type:"object" }), parentSchemaId:documentedParent.id, documentation:{ properties:{ "/page_type":{ displayName:"Page type", description:"Local page type" } } } };
const documentedCopy = duplicateSchema(documentedChild, "Documented copy", [documentedParent, documentedChild]);
assert.deepEqual(Object.keys(documentedCopy.documentation.properties).sort(), ["/currency", "/page_type"]);
documentedCopy.documentation.properties["/currency"].description = "Copy only";
assert.equal(documentedParent.documentation.properties["/currency"].description, "Inherited currency");
