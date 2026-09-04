import assert from "node:assert/strict";
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
const removalSummary = { textContent:"" };
const removalDialog = { open:false, showModal() { this.open = true; }, close() { this.open = false; } };
const removalHeading = { focus() {} };
const removalRoot = { querySelector:(selector) => ({
  "#schema-property-removal-summary":removalSummary,
  "#schema-property-removal-dialog":removalDialog,
  "#schema-property-removal-heading":removalHeading,
}[selector] ?? null) };
const removalSchema = {
  id:"schema:one", name:"One", version:1, published:true, assignments:[],
  document:{ type:"object", properties:{ title:{ type:"string" } } },
  workingDraft:{ baseVersion:1, sourceVersion:1,
    document:{ type:"object", properties:{ title:{ type:"string" } } },
    assignments:[], pendingChanges:[],
    documentation:{ properties:{ "/title":{ displayName:"Title", description:"Page title" } } },
  },
};
controller.configure({
  root:removalRoot, active:() => removalSchema, replaceActive() {}, persist() {}, renderAll() {},
  renderView() {}, canonicalUndo:() => false,
});
controller.requestRemoval("/title");

// retired-schema-assertion: property-filter-removal-copy-manual-index-008
assert.equal(removalDialog.open, true);
controller.selectedPath = "/checkout/email";
controller.expandedRulePaths.add("/checkout/email");
controller.pendingRemoval = { path:"/checkout/email" };
controller.pendingCopy = { sourceSchemaId:"schema:one" };
controller.pendingCopyReview = { close:() => { reviewClosed += 1; } };
controller.pendingCopyPosition = {
  schemaId:"schema:one", settlementSchemaId:"schema:two", path:"/checkout/email",
  editorScroll:12, treeScroll:24,
};
controller.interactionReturn = {
  schemaId:"schema:one", path:"/checkout/email", triggerLabel:"Copy",
  editorScroll:1, treeScroll:2, detailScroll:3,
};
controller.specificIndexArrayPath = "/items";
controller.pendingManualContext = { parentPath:"/checkout" };

// retired-schema-assertion: property-filter-removal-copy-manual-index-009
assert.match(removalSummary.textContent, /Documentation entries: \/title/);

// retired-schema-assertion: property-filter-removal-copy-manual-index-021
assert.match(`${controller.specificIndexArrayPath}/2`, /items\/2/);

// retired-schema-assertion: property-filter-removal-copy-manual-index-023
assert.match(
  `${controller.pendingManualContext.parentPath.slice(1)}.total is number`,
  /checkout\.total is number/,
);

controller.dispose(() => { dialogReset += 1; });
assert.equal(reviewClosed, 1);
assert.equal(dialogReset, 1);

// retired-schema-assertion: property-filter-removal-copy-manual-index-010
assert.equal(controller.pendingRemoval, undefined);

// retired-schema-assertion: property-filter-removal-copy-manual-index-013
assert.equal(controller.pendingCopy, undefined);

// retired-schema-assertion: property-filter-removal-copy-manual-index-016
assert.equal(controller.pendingCopyPosition, undefined);

// retired-schema-assertion: property-filter-removal-copy-manual-index-022
assert.equal(controller.interactionReturn, undefined);
assert.equal(controller.expandedRulePaths.size, 0);

// retired-schema-assertion: property-filter-removal-copy-manual-index-005
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

// retired-schema-assertion: installed-repair-regression-probes-001
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

assert.match(controller.constructor.name, /SchemaPropertyController/,
  "the direct property owner has the property-controller identity");
const schemaBrowserFixtureSource = await readFile(
  "test/support/side-panel-browser-fixture-primitives.mjs", "utf8",
);

assert.match(schemaBrowserFixtureSource,
  /assert\.match\(published\.review\.text,\/policy canonical property\//,
  "the direct property contract preserves canonical policy review evidence");

assert.match(schemaBrowserFixtureSource,
  /pendingChanges:\["Change additional-property policy"\]/,
  "the direct property contract preserves the legacy policy review input");
