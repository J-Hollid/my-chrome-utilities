import assert from "node:assert/strict";

import {
  buildValidationPropertyTree,
  propertyValidationSummary,
  validationVisual,
} from "../dist/data-layer-live-validation-presentation.js";

assert.deepEqual(validationVisual("Valid"), { badgeText:"Valid", symbol:"✓", symbolName:"check", treatment:"pass", summary:"Validation passed" });
assert.deepEqual(validationVisual("2 warnings"), { badgeText:"2 warnings", symbol:"⚠", symbolName:"warning", treatment:"warning", summary:"Validation completed with 2 warnings" });
assert.deepEqual(validationVisual("2 errors and 1 warning"), { badgeText:"2 errors and 1 warning", symbol:"!", symbolName:"error", treatment:"error", summary:"Validation failed, 2 errors, and 1 warning" });
assert.deepEqual(validationVisual("Not checked"), { badgeText:"Not checked", symbol:"○", symbolName:"neutral", treatment:"neutral", summary:"Validation not checked" });
assert.deepEqual(validationVisual("Assignment error"), { badgeText:"Assignment error", symbol:"!", symbolName:"error", treatment:"assignment-error", summary:"Validation assignment error" });

const passing = { propertyPath:"currency", status:"pass", message:"Allowed currency", expected:"EUR or USD", actual:"EUR", rule:"Known currencies", ruleVersion:2, severity:"error", schemaName:"Checkout", schemaVersion:4 };
const warning = { propertyPath:"page_type", status:"warning", message:"Prefer a known page type", expected:"product", actual:"legacy", rule:"Known page types", ruleVersion:3, severity:"warning", schemaName:"Pageview", schemaVersion:7 };
const error = { propertyPath:"page_type", status:"error", message:"Required page type", expected:"string", actual:"missing", rule:"Required fields", ruleVersion:1, severity:"error", schemaName:"Pageview", schemaVersion:7 };
assert.deepEqual(propertyValidationSummary([]), { status:"No rules", symbolName:"neutral", treatment:"neutral", errors:0, warnings:0, passed:0 });
assert.deepEqual(propertyValidationSummary([passing, { ...passing, rule:"ISO currency" }]), { status:"2 rules passed", symbolName:"check", treatment:"pass", errors:0, warnings:0, passed:2 });
assert.deepEqual(propertyValidationSummary([warning]), { status:"1 warning", symbolName:"warning", treatment:"warning", errors:0, warnings:1, passed:0 });
assert.deepEqual(propertyValidationSummary([passing, warning, error]), { status:"1 error and 1 warning", symbolName:"error", treatment:"error", errors:1, warnings:1, passed:1 });

const tree = buildValidationPropertyTree({ commerce:{ currency:"EUR", total:12 }, page_type:"legacy" }, [{ ...passing, propertyPath:"commerce.currency" }, warning, error], [
  { instancePath:"/commerce/order_id", message:"Required property", expected:"string", actual:"missing", rule:"Required fields v1", severity:"error", schemaName:"Checkout", schemaVersion:4, schemaLocation:"#/required" },
]);
const commerce = tree.find(({ path }) => path === "commerce");
assert.deepEqual(commerce.aggregate, { errors:1, warnings:0 });
assert.equal(commerce.children.find(({ path }) => path === "commerce.currency").summary.status, "1 rule passed");
assert.equal(tree.find(({ path }) => path === "page_type").summary.status, "1 error and 1 warning");
const missing = commerce.children.find(({ path }) => path === "commerce.order_id");
assert.equal(missing.missing, true);
assert.equal(missing.valueLabel, "Missing");
assert.equal(missing.summary.status, "1 error");
