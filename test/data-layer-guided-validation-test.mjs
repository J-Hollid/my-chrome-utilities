import assert from "node:assert/strict";

import {
  addAllowedValue,
  advanceGuidedValidation,
  compatibleRequirements,
  createGuidedValidationDraft,
  pathConditionResult,
  pathConditionsResult,
  publishGuidedValidation,
  selectGuidedProperty,
  setAllowedValue,
  setExpectedType,
  setGuidedRequirement,
  setGuidedSchemaDestination,
  setGuidedScope,
  schemaDestinationOptions,
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

const initial = createGuidedValidationDraft(event);
assert.equal(initial.stage, "property");
assert.equal(initial.scope.kind, "domain-all-paths");
assert.equal(initial.scope.domain, "127.0.0.1");
assert.equal(initial.scope.pathname, "/");
assert.equal(initial.advanced.severity, "Error");
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
const destinationStage = advanceGuidedValidation(advanceGuidedValidation(advanceGuidedValidation(scoped)));
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
assert.deepEqual(schemaDestinationOptions(destinationStage, candidates).map(({ name, available, explanation }) => ({ name, available, explanation })), [
  { name:"Generic pageview", available:true, explanation:"page_type will be added" },
  { name:"Product listing", available:true, explanation:"page_type accepts String rules" },
  { name:"Numeric page types", available:false, explanation:"page_type expects Number" },
  { name:"Raw pageview", available:false, explanation:"schema validates raw input, not payload" },
]);
const existingDestination = setGuidedSchemaDestination(destinationStage, { kind:"existing", schemaId:"schema:listing:3", schemaName:"Product listing", schemaVersion:3, matchingAssignment:true });
const reviewed = advanceGuidedValidation(existingDestination);
assert.equal(reviewed.stage, "review");
assert.equal(reviewed.property.path, "page_type");
assert.match(reviewed.review, /pageview on 127\.0\.0\.1 requires page_type to be product_list or homepage/);
assert.match(reviewed.review, /Product listing version 4 will be created while version 3 remains unchanged/);

const local = publishGuidedValidation(reviewed, false);
assert.equal(local.schema.rules.length, 1);
assert.equal(local.reusableRules.length, 0);
assert.equal(local.assignment.enabled, true);
assert.equal(local.assignment.sourceId, "event-history");
assert.equal(local.assignment.eventName, "pageview");
assert.equal(local.assignment.target, "payload");
assert.equal(local.assignment.versionPolicy, "pinned");
assert.equal(local.destination.kind, "existing");
assert.equal(local.destination.assignmentAction, "reuse the matching enabled assignment");
assert.equal(local.schema.version, 4);
assert.match(local.readableRequirement, /page_type must be product_list or homepage/);

const reusable = publishGuidedValidation(reviewed, true);
assert.equal(reusable.reusableRules.length, 1);
assert.equal(reusable.schema.rules[0].reusableRuleId, reusable.reusableRules[0].id);
