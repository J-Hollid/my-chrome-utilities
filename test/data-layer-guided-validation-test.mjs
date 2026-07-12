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
  setGuidedScope,
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
const reviewed = advanceGuidedValidation(advanceGuidedValidation(advanceGuidedValidation(scoped)));
assert.equal(reviewed.stage, "review");
assert.equal(reviewed.property.path, "page_type");
assert.match(reviewed.review, /pageview on 127\.0\.0\.1 requires page_type to be product_list or homepage/);

const local = publishGuidedValidation(reviewed, false);
assert.equal(local.schema.rules.length, 1);
assert.equal(local.reusableRules.length, 0);
assert.equal(local.assignment.enabled, true);
assert.equal(local.assignment.sourceId, "event-history");
assert.equal(local.assignment.eventName, "pageview");
assert.equal(local.assignment.target, "payload");
assert.equal(local.assignment.versionPolicy, "pinned");
assert.match(local.readableRequirement, /page_type must be product_list or homepage/);

const reusable = publishGuidedValidation(reviewed, true);
assert.equal(reusable.reusableRules.length, 1);
assert.equal(reusable.schema.rules[0].reusableRuleId, reusable.reusableRules[0].id);
