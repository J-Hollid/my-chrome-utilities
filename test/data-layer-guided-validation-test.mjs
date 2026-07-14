import assert from "node:assert/strict";

import {
  addAllowedValue,
  applyGuidedSchemaCandidate,
  assignmentConfigurationRequired,
  assignmentDraftAfterGuidedSave,
  assignmentGuidedAction,
  assignmentScopeSummary,
  advanceGuidedValidation,
  compatibleRequirements,
  createGuidedContinuationDraft,
  createGuidedValidationDraft,
  createGuidedValidationForProperty,
  guidedValidationStages,
  guidedAssignmentsMatch,
  guidedAssignmentCoversEvent,
  pathConditionResult,
  pathConditionsResult,
  publishGuidedValidation,
  retargetGuidedValidation,
  resolveGuidedPrefillReplacement,
  resolveGuidedTargetReplacement,
  selectGuidedProperty,
  selectGuidedContinuationProperty,
  setAllowedValue,
  setExpectedType,
  setGuidedRequirement,
  setGuidedSchemaDestination,
  setGuidedScope,
  schemaDestinationOptions,
  searchSchemaDestinationOptions,
  validateNewSchemaName,
  validateAllowedValues,
} from "../dist/data-layer-guided-validation.js";

const event = {
  id:"event:pageview",
  name:"pageview",
  sourceId:"event-history",
  pageUrl:"http://127.0.0.1:4173/",
  payload:{ page_type:"product_list", count:2, active:true, products:[], commerce:{} },
};
const orderEvent = {
  id:"event:order-complete",
  name:"order_complete",
  sourceId:"event-history",
  pageUrl:"https://shop.example/orders/confirmed",
  payload:{ order_id:"ORDER-1", currency:"EUR", value:42 },
};
const orderAssignment = {
  id:"assignment:orders",
  name:"shop order pages",
  sourceId:"event-history",
  eventName:"order_complete",
  target:"payload",
  domainCondition:"*.example",
  pathnameCondition:"/orders/*",
  priority:250,
  versionPolicy:"follow latest",
  enabled:true,
};
assert.equal(guidedAssignmentCoversEvent(orderAssignment, orderEvent, "payload"), true);
assert.equal(guidedAssignmentCoversEvent({ ...orderAssignment, pathnameCondition:"/products/*" }, orderEvent, "payload"), false);
assert.equal(guidedAssignmentCoversEvent({ ...orderAssignment, enabled:false }, orderEvent, "payload"), false);

const orderPropertyDraft = setGuidedRequirement(
  createGuidedValidationForProperty(orderEvent, "order_id"),
  "Must be present",
);
const orderSchema = {
  id:"schema-order-completed",
  name:"Order completed",
  version:3,
  target:"payload",
  propertyTypes:{},
  assignments:[orderAssignment],
};
const coveredOrderDraft = applyGuidedSchemaCandidate(orderPropertyDraft, orderSchema);
assert.equal(assignmentConfigurationRequired(coveredOrderDraft), false);
assert.ok(!guidedValidationStages(coveredOrderDraft).includes("scope"));
assert.equal(coveredOrderDraft.assignmentResolution.coveringAssignments.length, 1);
assert.equal(assignmentGuidedAction(coveredOrderDraft), "reuse the covering assignment");
const coveredOrderReview = advanceGuidedValidation(advanceGuidedValidation(coveredOrderDraft));
assert.equal(coveredOrderReview.stage, "review");
assert.equal(publishGuidedValidation(coveredOrderReview, false).destination.assignmentAction, "reuse the covering assignment");

const uncoveredOrderDraft = applyGuidedSchemaCandidate(orderPropertyDraft, {
  ...orderSchema,
  assignments:[{ ...orderAssignment, pathnameCondition:"/products/*" }],
});
assert.equal(assignmentConfigurationRequired(uncoveredOrderDraft), true);
assert.ok(guidedValidationStages(uncoveredOrderDraft).includes("scope"));
assert.equal(assignmentGuidedAction(uncoveredOrderDraft), "add the reviewed assignment as a pending change");

const twoCoveringOrderDraft = applyGuidedSchemaCandidate(orderPropertyDraft, {
  ...orderSchema,
  assignments:[
    orderAssignment,
    { ...orderAssignment, id:"assignment:orders-secondary", name:"secondary order coverage", priority:100 },
  ],
});
assert.equal(assignmentConfigurationRequired(twoCoveringOrderDraft), false);
assert.equal(twoCoveringOrderDraft.assignmentResolution.coveringAssignments.length, 2);
assert.equal(assignmentGuidedAction(twoCoveringOrderDraft), "reuse existing schema coverage");

const pendingCoveredOrderDraft = applyGuidedSchemaCandidate(orderPropertyDraft, {
  ...orderSchema,
  assignments:[{ ...orderAssignment, pending:true }],
});
assert.equal(assignmentGuidedAction(pendingCoveredOrderDraft), "reuse the covering pending assignment");
const preservedAssignments = assignmentDraftAfterGuidedSave(
  [orderAssignment],
  { ...orderAssignment, id:"assignment:replacement", name:"replacement" },
  "reuse the covering pending assignment",
);
assert.deepEqual(preservedAssignments, [orderAssignment]);
assert.equal(preservedAssignments[0].priority, 250);
assert.equal(preservedAssignments[0].versionPolicy, "follow latest");
assert.equal(assignmentDraftAfterGuidedSave(
  [orderAssignment],
  { ...orderAssignment, id:"assignment:confirmed", name:"confirmed orders", pathnameCondition:"/confirmed/*" },
  "add the reviewed assignment as a pending change",
).length, 2);
const propertyEntry = createGuidedValidationForProperty({ ...event, payload:{ oOrder:{ orderId:"ORDER-1", products:[{ sku:"A" }, { sku:"B" }] } } }, "/oOrder/products/*/sku");
assert.equal(propertyEntry.stage, "destination"); assert.equal(propertyEntry.property.path, "/oOrder/products/*/sku"); assert.equal(propertyEntry.property.detectedType, "String"); assert.equal(propertyEntry.property.observedValue, "A"); assert.ok(!guidedValidationStages(propertyEntry).includes("property"));
const retargetedEntry = retargetGuidedValidation(propertyEntry, '$["oOrder"]["products"][*]["missing"]', "Number");
assert.equal(retargetedEntry.property.path, '$["oOrder"]["products"][*]["missing"]');
assert.equal(retargetedEntry.property.detectedType, "Number");
assert.equal(retargetedEntry.property.expectedType, "Number");
assert.equal(retargetedEntry.property.observedValue, undefined);
assert.equal(retargetedEntry.stage, "destination");
assert.equal(retargetedEntry.propertyEntry, true);
const incompatibleRetarget = retargetGuidedValidation(setGuidedRequirement(propertyEntry, "Must match a pattern"), '$["oOrder"]["products"]');
assert.equal(incompatibleRetarget.requirementCorrectionRequired, true);
assert.ok(incompatibleRetarget.targetReplacementReview);
const acceptedRetarget = resolveGuidedTargetReplacement(incompatibleRetarget, "accept");
assert.equal(acceptedRetarget.requirement, undefined);
assert.equal(acceptedRetarget.requirementCorrectionRequired, false);

const initial = createGuidedValidationDraft(event);
assert.equal(initial.stage, "property");
assert.equal(initial.scope.kind, "domain-all-paths");
assert.equal(initial.scope.domain, "127.0.0.1");
assert.equal(initial.scope.pathname, "/");
assert.equal(initial.advanced.severity, "Error");

const continuationCandidate = {
  id:"schema-product-listing",
  name:"Product listing",
  version:3,
  target:"payload",
  propertyTypes:{ page_name:"String" },
  assignments:[{ id:"assignment:product", name:"Product pages", sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"127.0.0.1", pathnameCondition:"/", enabled:true }],
};
const continuation = createGuidedContinuationDraft(event, continuationCandidate);
assert.equal(continuation.stage, "property");
assert.deepEqual(continuation.continuation, { schemaId:"schema-product-listing", schemaName:"Product listing", schemaVersion:3 });
assert.deepEqual(guidedValidationStages(continuation), ["property", "requirement", "review"]);
assert.equal(continuation.destination.schemaId, "schema-product-listing");
assert.equal(continuation.assignmentResolution.selection, "the compatible assignment");
assert.equal(continuation.prefillSources.target, "Product listing version 3");
assert.match(continuation.prefillSources.domain, /Product pages assignment/);
const continuedProperty = selectGuidedContinuationProperty(continuation, "page_name", continuationCandidate);
assert.equal(advanceGuidedValidation(continuedProperty).stage, "requirement");
assert.equal(continuedProperty.destination.schemaId, "schema-product-listing");
assert.equal(continuedProperty.property.expectedType, "String");
const noAssignmentContinuation = selectGuidedContinuationProperty(createGuidedContinuationDraft(event, { ...continuationCandidate, assignments:[] }), "page_name", { ...continuationCandidate, assignments:[] });
assert.equal(noAssignmentContinuation.assignmentResolution.selection, "Create a new assignment");
assert.equal(noAssignmentContinuation.destination.schemaId, "schema-product-listing");
const twoAssignments = [
  continuationCandidate.assignments[0],
  { ...continuationCandidate.assignments[0], id:"assignment:alternate", name:"Alternate product pages", domainCondition:"shop.example" },
];
const ambiguousCandidate = { ...continuationCandidate, assignments:twoAssignments };
const ambiguousContinuation = selectGuidedContinuationProperty(createGuidedContinuationDraft(event, ambiguousCandidate), "page_name", ambiguousCandidate);
assert.equal(ambiguousContinuation.assignmentResolution.selection, "the compatible assignment");
assert.deepEqual(ambiguousContinuation.assignmentResolution.compatibleAssignments.map(({ name }) => name), ["Product pages", "Alternate product pages"]);
assert.deepEqual(ambiguousContinuation.assignmentResolution.coveringAssignments.map(({ name }) => name), ["Product pages"]);
assert.equal(advanceGuidedValidation(ambiguousContinuation).stage, "requirement");
assert.equal(initial.advanced.versionPolicy, "Pinned");
assert.equal(initial.persisted, false);

const selected = selectGuidedProperty(initial, "page_type");
assert.deepEqual(selected.property, {
  path:"page_type",
  observedValue:"product_list",
  detectedType:"String",
  expectedType:"String",
  typeSource:"detected from this event",
});
assert.equal(advanceGuidedValidation(selected).stage, "destination");
assert.deepEqual(compatibleRequirements("String"), [
  "Must be present",
  "Must be one of these values",
  "Must match a pattern",
  "Must have this length",
]);
assert.ok(!compatibleRequirements("Number").includes("Must match a pattern"));
assert.ok(compatibleRequirements("Array").includes("Must contain this many items"));
assert.ok(compatibleRequirements("Object").includes("Allow only these properties"));
assert.ok(compatibleRequirements("Boolean").includes("Must equal this value"));

const allowed = setGuidedRequirement(selected, "Must be one of these values");
assert.deepEqual(allowed.allowedValues, ["product_list"]);
const twoValues = setAllowedValue(addAllowedValue(allowed), 1, "homepage");
assert.deepEqual(validateAllowedValues(twoValues.allowedValues), { valid:true, assistance:"2 allowed values" });
assert.deepEqual(validateAllowedValues([]), { valid:false, assistance:"Add at least one allowed value" });
assert.deepEqual(validateAllowedValues(["homepage", "homepage"]), { valid:false, assistance:"Remove or change the duplicate homepage" });
assert.deepEqual(validateAllowedValues(["product_list", ""]), { valid:false, assistance:"Enter a value or remove the blank item" });

const overridden = setExpectedType(setGuidedRequirement(selected, "Must match a pattern"), "Number");
assert.equal(overridden.property.typeSource, "explicit override");
assert.equal(overridden.preview.currentEventPasses, false);
assert.match(overridden.preview.message, /observed as String but Number is expected/);
assert.equal(overridden.requirementCorrectionRequired, true);

assert.deepEqual(pathConditionResult({ matchType:"Exact path", expression:"/products" }, "/products"), { valid:true, matches:true });
assert.deepEqual(pathConditionResult({ matchType:"Exact path", expression:"/products" }, "/products/field-notebook"), { valid:true, matches:false });
assert.deepEqual(pathConditionResult({ matchType:"Path pattern", expression:"/products/*" }, "/products/field-notebook"), { valid:true, matches:true });
assert.deepEqual(pathConditionResult({ matchType:"Regular expression", expression:"^/products/[a-z-]+$" }, "/shop/products/field-notebook"), { valid:true, matches:false });
assert.equal(pathConditionResult({ matchType:"Regular expression", expression:"[" }, "/").valid, false);
assert.equal(pathConditionResult({ matchType:"Exact path", expression:"/products" }, "https://127.0.0.1/products?sort=price#details").matches, true);
assert.deepEqual(pathConditionsResult([
  { matchType:"Exact path", expression:"/" },
  { matchType:"Path pattern", expression:"/products/*" },
], "/products/field-notebook"), {
  valid:true,
  matches:true,
  matchingCondition:{ matchType:"Path pattern", expression:"/products/*" },
});

const scoped = setGuidedScope(twoValues, {
  kind:"selected-paths",
  domain:"127.0.0.1",
  pathname:"/",
  conditions:[
    { matchType:"Exact path", expression:"/" },
    { matchType:"Path pattern", expression:"/products/*" },
  ],
});
const destinationStage = advanceGuidedValidation(selected);
assert.equal(destinationStage.stage, "destination");
assert.equal(destinationStage.destination, undefined);
assert.deepEqual(validateNewSchemaName("", ["Existing pageview"]), { valid:false, assistance:"Enter a name for the new schema" });
assert.deepEqual(validateNewSchemaName("Existing pageview", ["Existing pageview"]), { valid:false, assistance:"Choose the existing schema or enter another name" });
assert.deepEqual(validateNewSchemaName("Signal Shop pageview", ["Existing pageview"]), { valid:true, assistance:"New schema Signal Shop pageview will be created" });
const candidates = [
  { id:"schema:generic:1", name:"Generic pageview", version:1, target:"payload", propertyTypes:{} },
  { id:"schema:listing:3", name:"Product listing", version:3, target:"payload", propertyTypes:{ page_type:"String" }, assignments:[{ sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"127.0.0.1", enabled:true }] },
  { id:"schema:numeric:1", name:"Numeric page types", version:1, target:"payload", propertyTypes:{ page_type:"Number" } },
  { id:"schema:raw:1", name:"Raw pageview", version:1, target:"raw input", propertyTypes:{} },
];
const searchableCandidate = {
  id:"schema:searchable:4",
  name:"Product listing",
  version:4,
  target:"payload",
  propertyTypes:{ page_type:"String" },
  assignments:[{
    sourceId:"event-history",
    eventName:"pageview",
    target:"payload",
    domainCondition:"shop.example",
    pathConditions:[{ matchType:"Path pattern", expression:"/products/*" }],
    enabled:true,
  }],
};
for (const query of ["Product listing", "version 4", "payload", "page_type", "pageview", "shop.example", "/products/*"]) {
  assert.deepEqual(searchSchemaDestinationOptions(destinationStage, [searchableCandidate, { id:"schema:other:1", name:"Other", version:1, target:"raw input", propertyTypes:{ count:"Number" }, assignments:[] }], query).map(({ id }) => id), ["schema:searchable:4"]);
}
assert.deepEqual(searchSchemaDestinationOptions(destinationStage, [searchableCandidate], "missing-schema"), []);
assert.equal(assignmentScopeSummary(searchableCandidate.assignments), "pageview · shop.example · /products/*");
assert.equal(assignmentScopeSummary([]), "No assignments");

const schemaWithOneAssignment = {
  id:"schema:generic:4",
  name:"Generic pageview",
  version:4,
  target:"payload",
  propertyTypes:{ page_type:"String" },
  assignments:[{
    id:"assignment:generic-shop",
    name:"Generic shop pages",
    sourceId:"event-history",
    eventName:"pageview",
    target:"payload",
    domainCondition:"shop.example",
    pathConditions:[{ matchType:"Path pattern", expression:"/products/*" }],
    enabled:true,
  }],
};
const shopSelected = selectGuidedProperty(
  createGuidedValidationDraft({
    ...event,
    pageUrl:"https://shop.example/products/field-notebook",
  }),
  "page_type",
);
const schemaPrefilled = applyGuidedSchemaCandidate(
  { ...shopSelected, stage:"destination" },
  schemaWithOneAssignment,
);
assert.equal(schemaPrefilled.assignmentResolution.selection, "the compatible assignment");
assert.equal(schemaPrefilled.property.expectedType, "String");
assert.equal(schemaPrefilled.advanced.target, "payload");
assert.equal(schemaPrefilled.advanced.sourceId, "event-history");
assert.equal(schemaPrefilled.event.name, "pageview");
assert.equal(schemaPrefilled.scope.domain, "shop.example");
assert.deepEqual(schemaPrefilled.scope.conditions, [{ matchType:"Path pattern", expression:"/products/*" }]);
assert.equal(schemaPrefilled.prefillSources.expectedType, "Generic pageview version 4");
assert.equal(schemaPrefilled.prefillSources.domain, "Generic shop pages assignment");
assert.equal(advanceGuidedValidation(schemaPrefilled).stage, "requirement");

const withoutCompatibleAssignment = applyGuidedSchemaCandidate(
  { ...shopSelected, stage:"destination" },
  { ...schemaWithOneAssignment, assignments:[] },
);
assert.equal(withoutCompatibleAssignment.assignmentResolution.selection, "Create a new assignment");
assert.equal(withoutCompatibleAssignment.scope.domain, "shop.example");

const withTwoCompatibleAssignments = applyGuidedSchemaCandidate(
  { ...shopSelected, stage:"destination" },
  {
    ...schemaWithOneAssignment,
    assignments:[
      schemaWithOneAssignment.assignments[0],
      { ...schemaWithOneAssignment.assignments[0], id:"assignment:generic-all", name:"Generic all shops", domainCondition:"*.example" },
    ],
  },
);
assert.equal(withTwoCompatibleAssignments.assignmentResolution.selection, "required from readable assignment choices");
assert.equal(withTwoCompatibleAssignments.scope.domain, "shop.example");

const operatorScoped = setGuidedScope(schemaPrefilled, {
  ...schemaPrefilled.scope,
  domain:"operator.example",
});
const replacementProposed = applyGuidedSchemaCandidate(operatorScoped, {
  ...schemaWithOneAssignment,
  id:"schema:generic:5",
  version:5,
  assignments:[{ ...schemaWithOneAssignment.assignments[0], id:"assignment:generic-new", name:"Generic replacement", domainCondition:"*.example" }],
});
assert.equal(replacementProposed.scope.domain, "operator.example");
assert.deepEqual(replacementProposed.prefillReplacementReview?.map(({ field, currentValue, proposedValue }) => ({ field, currentValue, proposedValue })), [
  { field:"domain", currentValue:"operator.example", proposedValue:"*.example" },
]);
assert.equal(resolveGuidedPrefillReplacement(replacementProposed, "keep").scope.domain, "operator.example");
assert.equal(resolveGuidedPrefillReplacement(replacementProposed, "accept").scope.domain, "*.example");
const matchedBeforeRoutingEdit = applyGuidedSchemaCandidate({
  ...setGuidedRequirement(shopSelected, "Must be one of these values"),
  allowedValues:["product_list", "homepage"],
  stage:"destination",
}, schemaWithOneAssignment);
const routingEditedAfterDestination = setGuidedScope(matchedBeforeRoutingEdit, {
  ...matchedBeforeRoutingEdit.scope,
  kind:"current-path",
  pathname:"/operator-selected",
  conditions:[],
});
const editedRoutingReview = advanceGuidedValidation(advanceGuidedValidation(advanceGuidedValidation(routingEditedAfterDestination)));
assert.equal(publishGuidedValidation(editedRoutingReview, false).destination.assignmentAction, "add the reviewed assignment as a pending change");
assert.deepEqual(schemaDestinationOptions(destinationStage, candidates).map(({ name, available, explanation }) => ({ name, available, explanation })), [
  { name:"Generic pageview", available:true, explanation:"page_type will be added" },
  { name:"Product listing", available:true, explanation:"page_type accepts String rules" },
  { name:"Numeric page types", available:false, explanation:"page_type expects Number" },
  { name:"Raw pageview", available:false, explanation:"schema validates raw input, not payload" },
]);
assert.equal(guidedAssignmentsMatch(
  candidates[1].assignments[0],
  { sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"127.0.0.1" },
), true);
assert.equal(guidedAssignmentsMatch(
  candidates[1].assignments[0],
  { sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"127.0.0.1", pathnameCondition:"/products" },
), false);
const existingDestination = setGuidedSchemaDestination({ ...scoped, stage:"destination" }, { kind:"existing", schemaId:"schema:listing:3", schemaName:"Product listing", schemaVersion:3, matchingAssignment:true });
const reviewed = advanceGuidedValidation(advanceGuidedValidation(advanceGuidedValidation(existingDestination)));
assert.equal(reviewed.stage, "review");
assert.equal(reviewed.property.path, "page_type");
assert.match(reviewed.review, /pageview on 127\.0\.0\.1 requires page_type to be product_list or homepage/);
assert.match(reviewed.review, /rule will be added to the Product listing working draft based on version 3/);
assert.match(reviewed.review, /version 3 remains current until the working draft is published/);
assert.doesNotMatch(reviewed.review, /version 4/);

const local = publishGuidedValidation(reviewed, false);
assert.equal(local.schema.rules.length, 1);
assert.equal(local.reusableRules.length, 0);
assert.equal(local.assignment.enabled, true);
assert.equal(local.assignment.sourceId, "event-history");
assert.equal(local.assignment.eventName, "pageview");
assert.equal(local.assignment.target, "payload");
assert.equal(local.assignment.versionPolicy, "pinned");
assert.equal(local.destination.kind, "existing");
assert.equal(local.destination.assignmentAction, "reuse the covering assignment");
assert.equal(local.schema.version, 3);
assert.equal(local.schema.id, "schema:listing:3");
assert.equal(local.schema.pending, true);
assert.match(local.readableRequirement, /page_type must be product_list or homepage/);

const reusable = publishGuidedValidation(reviewed, true);
assert.equal(reusable.reusableRules.length, 1);
assert.equal(reusable.schema.rules[0].reusableRuleId, reusable.reusableRules[0].id);
