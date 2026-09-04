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
const specificIndexInput = { value:"" };
const specificIndexConfirm = { disabled:true };
const specificIndexDialog = { open:false, showModal() { this.open=true; }, close() { this.open=false; } };
const specificIndexAssistance = { textContent:"" };
const manualChildName = { value:"" };
const manualType = { value:"string" };
const manualArrayType = { value:"" };
const manualPreview = { textContent:"" };
const manualAssistance = { textContent:"" };
const manualParent = { hidden:true, textContent:"" };
const manualConfirm = { disabled:true };
const manualGoToExisting = { hidden:true, dataset:{} };
const inertVisibility = () => ({ hidden:false });
const propertyElements = {
  "#schema-property-removal-summary":removalSummary,
  "#schema-property-removal-dialog":removalDialog,
  "#schema-property-removal-heading":removalHeading,
  "#schema-specific-index":specificIndexInput,
  "#confirm-schema-specific-index":specificIndexConfirm,
  "#schema-specific-index-dialog":specificIndexDialog,
  "#schema-specific-index-assistance":specificIndexAssistance,
  "#schema-manual-property-child-name":manualChildName,
  "#schema-manual-property-type":manualType,
  "#schema-manual-array-item-type":manualArrayType,
  "#schema-manual-property-preview":manualPreview,
  "#schema-manual-property-assistance":manualAssistance,
  "#schema-manual-property-parent-context":manualParent,
  "#confirm-schema-manual-property":manualConfirm,
  "#go-to-existing-schema-property":manualGoToExisting,
  "#schema-manual-property-path-label":inertVisibility(),
  "#schema-manual-property-path":inertVisibility(),
  "#schema-manual-property-child-name-label":inertVisibility(),
  "#schema-manual-array-type-group":inertVisibility(),
};
const removalRoot = { querySelector:(selector) => propertyElements[selector] ?? null };
const removalSchema = {
  id:"schema:one", name:"One", version:1, published:true, assignments:[],
  document:{ type:"object", properties:{ title:{ type:"string" } } },
  workingDraft:{ baseVersion:1, sourceVersion:1,
    document:{ type:"object", properties:{
      title:{ type:"string" },
      checkout:{ type:"object", properties:{ total:{ type:"number" } } },
      items:{ type:"array", items:{ type:"object", properties:{ sku:{ type:"string" } } } },
    } },
    assignments:[], pendingChanges:[],
    documentation:{ properties:{ "/title":{ displayName:"Title", description:"Page title" } } },
  },
};
controller.configure({
  root:removalRoot, active:() => removalSchema, replaceActive() {}, persist() {}, renderAll() {},
  renderView() {}, canonicalUndo:() => false,
});
controller.requestRemoval("/title");

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

assert.match(removalSummary.textContent, /Documentation entries: \/title/);

specificIndexInput.value = "2";
controller.renderSpecificIndex();
let openedRulePath;
controller.configure({
  root:removalRoot, active:() => removalSchema, schemas:() => [removalSchema], ruleIds:() => [],
  replaceActive() {}, replaceSchemas() {}, persist() {}, renderAll() {}, renderView() {},
  renderRules() {}, openRulePicker:(path) => { openedRulePath = path; }, queuePersistence() {},
  canonicalUndo:() => false, removeCanonicalDocumentation:(schema) => schema,
  addManualCanonical:() => undefined, scheduleFrame:(callback) => callback(),
});
controller.submitSpecificIndex({ preventDefault() {} });
assert.match(openedRulePath.replaceAll(".", "/"), /items\/2/);

controller.pendingManualContext = { parentPath:"/checkout" };
manualChildName.value = "total";
manualType.value = "number";
controller.renderManual();
assert.match(manualPreview.textContent, /checkout\.total is number/);

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
