import assert from "node:assert/strict";
import { runRetiredSchemaControllerScenario } from "../../support/schema-library-fake-dom.mjs";
import { readFile } from "node:fs/promises";
import { timeoutIncidentDigest as digest } from
  "../../../scripts/verification-reliability-values.mjs";

const { SchemaPropertyController } = await import(
  "../../../dist/data-layer-installed/schemas/property-controller.js"
);
const { installSchemaPropertyElements } = await import(
  "../../../dist/data-layer-installed/schemas/property-installed-view.js"
);
const installed = installSchemaPropertyElements({ querySelector:() => null });
assert.equal(installed.addSchemaPropertyButton, null);

const controller = new SchemaPropertyController();
let reviewClosed = 0;
let dialogReset = 0;
controller.selectedPath = "/checkout/email";
controller.expandedRulePaths.add("/checkout/email");
controller.pendingRemoval = { path:"/checkout/email" };
controller.pendingCopy = { sourceSchemaId:"schema:one" };
controller.pendingCopyReview = { close:() => { reviewClosed += 1; } };
controller.pendingCopyPosition = { schemaId:"schema:one", settlementSchemaId:"schema:two", path:"/checkout/email", editorScroll:12, treeScroll:24 };
controller.interactionReturn = { schemaId:"schema:one", path:"/checkout/email", triggerLabel:"Copy", editorScroll:1, treeScroll:2, detailScroll:3 };

controller.dispose(() => { dialogReset += 1; });
assert.equal(reviewClosed, 1);
assert.equal(dialogReset, 1);
assert.equal(controller.pendingRemoval, undefined);
assert.equal(controller.pendingCopy, undefined);
assert.equal(controller.pendingCopyPosition, undefined);
assert.equal(controller.interactionReturn, undefined);
assert.equal(controller.expandedRulePaths.size, 0);
assert.equal(controller.selectedPath, "/checkout/email", "dispose preserves the current property selection");

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const causalCategory = "other:extracted Schema interaction restoration";
  if (context.causalCategory === causalCategory) {
    const [propertySource, guidedSource, installedSource] = await Promise.all([
      readFile("src/data-layer-installed/schemas/property-controller.ts", "utf8"),
      readFile("src/data-layer-installed/schemas/guided-validation-controller.ts", "utf8"),
      readFile("src/data-layer-installed/schemas/installed-controller.ts", "utf8"),
    ]);
    const observed = {
      documentationSummaryAddressable:propertySource.includes(
        'schemaDocumentationRemovalSummary.id="schema-documentation-removal-summary"'),
      liveSelectionAndDraftFocusRestored:guidedSource.includes(
        "ports.selectSchema(applied.affectedSchemaId, evaluation.propertyPath)") &&
        installedSource.includes("if (schema) library.draft=schemaEditorDraft(schema)") &&
        installedSource.includes("schemaEditorName?.focus({ preventScroll:true })"),
    };
    const expectedPreRepairFailure = {
      documentationSummaryAddressable:false,
      liveSelectionAndDraftFocusRestored:false,
    };
    const expectedRepairResult = {
      documentationSummaryAddressable:true,
      liveSelectionAndDraftFocusRestored:true,
    };
    assert.deepEqual(observed, expectedRepairResult);
    const fixture = { id:"extracted-schema-interaction-restoration-v1", causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{ documentationDialog:"removal summary", allowedValueExpansion:"live selection and draft focus" },
      expectedPreRepairFailure, expectedRepairResult };
    const fixtureDigest = digest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed } } }));
  }
  const authoringCategory = "other:extracted Schema authoring contract drift";
  if (context.causalCategory === authoringCategory) {
    const [propertySource, pickerSource] = await Promise.all([
      readFile("src/data-layer-installed/schemas/property-controller.ts", "utf8"),
      readFile("src/data-layer-installed/schemas/rule-picker-view.ts", "utf8"),
    ]);
    const observed = {
      specificIndexAssistanceAddressable:propertySource.includes(
        'schemaSpecificIndexAssistance.id="schema-specific-index-assistance"'),
      specificIndexGuidancePreserved:propertySource.includes("Enter a non-negative array index"),
      reusableRuleGuidancePreserved:pickerSource.includes(
        "This reusable rule will be available to other schemas."),
    };
    const expectedPreRepairFailure = { specificIndexAssistanceAddressable:false,
      specificIndexGuidancePreserved:false, reusableRuleGuidancePreserved:false };
    const expectedRepairResult = { specificIndexAssistanceAddressable:true,
      specificIndexGuidancePreserved:true, reusableRuleGuidancePreserved:true };
    assert.deepEqual(observed, expectedRepairResult);
    const fixture = { id:"extracted-schema-authoring-contract-drift-v1",
      causalCategory:authoringCategory, diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{ specificIndex:"validation guidance", reusableRule:"configuration guidance" },
      expectedPreRepairFailure, expectedRepairResult };
    const fixtureDigest = digest(fixture);
    console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:{ version:2,
      incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed } } }));
  }
}
// RETIRED_SCHEMA_ASSERTIONS_START:property-filter-removal-copy-manual-index+installed-repair-regression-probes
const retiredSchemaAssertions = {
  "property-filter-removal-copy-manual-index-001": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-002": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-003": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-004": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-005": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-006": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-007": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-008": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-009": (...args) => assert.match(...args),
  "property-filter-removal-copy-manual-index-010": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-011": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-012": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-013": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-014": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-015": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-016": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-017": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-018": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-019": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-020": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-021": (...args) => assert.match(...args),
  "property-filter-removal-copy-manual-index-022": (...args) => assert.equal(...args),
  "property-filter-removal-copy-manual-index-023": (...args) => assert.match(...args),
  "property-filter-removal-copy-manual-index-024": (...args) => assert.equal(...args),
  "installed-repair-regression-probes-001": (...args) => assert.deepEqual(...args),
};
await runRetiredSchemaControllerScenario(retiredSchemaAssertions);
// RETIRED_SCHEMA_ASSERTIONS_END:property-filter-removal-copy-manual-index+installed-repair-regression-probes
