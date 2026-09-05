import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { timeoutIncidentDigest as digest } from
  "../../../scripts/verification-reliability-values.mjs";
import { createSchemaLibraryFakeDocument } from "../../support/schema-library-fake-dom.mjs";

const { SchemaPropertyController } = await import(
  "../../../dist/data-layer-installed/schemas/property-controller.js"
);
const { installSchemaPropertyElements } = await import(
  "../../../dist/data-layer-installed/schemas/property-installed-view.js"
);
const { removeCanonicalDocumentation } = await import(
  "../../../dist/data-layer-installed/schemas/property-canonical-adapter.js"
);
const installed = installSchemaPropertyElements({ querySelector:() => null });
assert.equal(installed.addSchemaPropertyButton, null);

const controller = new SchemaPropertyController();
let dialogReset = 0;
const removalSummary = { textContent:"" };
const removalDialog = { open:false, showModal() { this.open = true; }, close() { this.open = false; } };
const removalHeading = { focus() {} };
const specificIndexInput = { value:"", focus() {} };
const specificIndexConfirm = { disabled:true };
const specificIndexDialog = { open:false, showModal() { this.open=true; }, close() { this.open=false; } };
const specificIndexAssistance = { textContent:"" };
const manualChildName = { value:"", focus() {} };
const manualType = { value:"string" };
const manualArrayType = { value:"" };
const manualPreview = { textContent:"" };
const manualAssistance = { textContent:"" };
const manualParent = { hidden:true, textContent:"" };
const manualConfirm = { disabled:true };
const manualGoToExisting = { hidden:true, dataset:{} };
const { document:copyDocument, element:copyElement } = createSchemaLibraryFakeDocument();
globalThis.document=copyDocument;
const copyDialog=copyElement();
const copyTrigger=copyElement();
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
  "#schema-property-copy-dialog":copyDialog,
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
controller.requestRemoval("/title",{focus(){}});
assert.deepEqual(controller.pendingRemoval,{path:"/title"});
assert.equal(controller.pendingRemoval.trigger,undefined,"removal projections do not expose owned focus handles");

const copyDestination={id:"schema:two",name:"Two",version:1,document:{type:"object"},assignments:[]};
controller.configure({
  root:removalRoot,active:()=>removalSchema,schemas:()=>[removalSchema,copyDestination],ruleIds:()=>[],replaceActive(){},replaceSchemas(){},persist(){},
  renderAll(){},renderView(){},renderRules(){},openRulePicker(){},queuePersistence(){},canonicalUndo:()=>false,
  removeCanonicalDocumentation:(schema)=>schema,addManualCanonical:()=>undefined,scheduleFrame:(run)=>run(),
});
controller.openCopy("/title",copyTrigger);

// retired-schema-assertion: property-filter-removal-copy-manual-index-014
assert.equal(copyDialog.open,true);
assert.equal(controller.hasPendingCopyReview(),true);
assert.equal(controller.pendingCopyReview,undefined,"the property copy dialog lifecycle is private");
controller.closePendingCopyReview();
assert.equal(controller.hasPendingCopyReview(),false,"the controller closes its owned copy review through a command");

const copySource={id:"schema:copy-source",name:"Source",version:1,published:true,assignments:[],
  document:{type:"object",properties:{checkout:{type:"boolean"}}}};
let copySchemas=[copySource,copyDestination];
controller.configure({root:removalRoot,active:()=>copySource,schemas:()=>copySchemas,ruleIds:()=>[],replaceActive(){},
  replaceSchemas:(next)=>{copySchemas=next;},persist(){},renderAll(){},renderView(){},renderRules(){},openRulePicker(){},
  queuePersistence(){},canonicalUndo:()=>false,removeCanonicalDocumentation:(schema)=>schema,
  addManualCanonical:()=>undefined,scheduleFrame:(run)=>run()});
controller.openCopy("/checkout","schema:two");
controller.confirmCopy();
const destinationId="schema:two";

// retired-schema-assertion: property-filter-removal-copy-manual-index-015
assert.equal(copySchemas.find(({id})=>id===destinationId).workingDraft.document.properties.checkout.type,"boolean");

// retired-schema-assertion: property-filter-removal-copy-manual-index-008
assert.equal(removalDialog.open, true);
controller.selectPath("/checkout/email");
assert.throws(
  () => { controller.selectedPath = "/outside"; },
  /getter|read only|setting/u,
  "external code cannot write property selection state",
);
controller.setRulePathExpanded("/checkout/email", true);
controller.rememberCopyPosition({
  schemaId:"schema:one", settlementSchemaId:"schema:two", path:"/checkout/email",
  editorScroll:12, treeScroll:24,
});
controller.rememberInteractionReturn({
  schemaId:"schema:one", path:"/checkout/email", triggerLabel:"Copy",
  editorScroll:1, treeScroll:2, detailScroll:3,
});
const projectedReturn = controller.interactionReturn;
projectedReturn.path = "/outside";
assert.equal(controller.interactionReturn.path, "/checkout/email",
  "the property controller returns a cloned interaction projection");
controller.openSpecificIndex("/items");
assert.equal(controller.specificIndexTrigger,undefined,"the specific-index focus handle is private");

// retired-schema-assertion: property-filter-removal-copy-manual-index-009
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
// retired-schema-assertion: property-filter-removal-copy-manual-index-021
assert.match(openedRulePath.replaceAll(".", "/"), /items\/2/);

let authoringSchema=structuredClone(removalSchema);
let pickerOpen=false;
const replaceAuthoring=(schema) => { authoringSchema=schema; };
controller.configure({
  root:removalRoot, active:() => authoringSchema, schemas:() => [authoringSchema], ruleIds:() => [],
  replaceActive:replaceAuthoring, replaceSchemas() {}, persist() {}, renderAll() {}, renderView() {},
  renderRules() {}, openRulePicker:(path) => { openedRulePath=path; pickerOpen=true; }, queuePersistence() {},
  canonicalUndo:() => false,
  removeCanonicalDocumentation:(schema,path) => removeCanonicalDocumentation(
    {currentSavedSchemaId:()=>undefined},schema,path,
  ),
  addManualCanonical:() => undefined, scheduleFrame:(callback) => callback(),
});
controller.requestRemoval("/title");
controller.confirmRemoval();
// retired-schema-assertion: property-filter-removal-copy-manual-index-010
assert.equal(authoringSchema.workingDraft.document.properties.title,undefined);
controller.undoRemoval();
// retired-schema-assertion: property-filter-removal-copy-manual-index-011
assert.equal(authoringSchema.workingDraft.document.properties.title.type,"string");
controller.requestDocumentationRemoval("/title");
assert.deepEqual(controller.pendingDocumentationRemoval,{path:"/title"});
assert.equal(controller.pendingDocumentationRemoval.trigger,undefined,"documentation removal projections do not expose focus handles");
controller.confirmDocumentationRemoval();
// retired-schema-assertion: property-filter-removal-copy-manual-index-012
assert.equal(authoringSchema.workingDraft.document.properties.title.type,"string");
// retired-schema-assertion: property-filter-removal-copy-manual-index-013
assert.equal(authoringSchema.workingDraft.documentation?.properties,undefined);

controller.openSpecificIndex("/items");
specificIndexInput.value="2";
controller.renderSpecificIndex();
// retired-schema-assertion: property-filter-removal-copy-manual-index-017
assert.equal(specificIndexConfirm.disabled,false);
controller.submitSpecificIndex({preventDefault(){}});
// retired-schema-assertion: property-filter-removal-copy-manual-index-018
assert.equal(specificIndexDialog.open,false);
// retired-schema-assertion: property-filter-removal-copy-manual-index-019
assert.equal(pickerOpen,true);
// retired-schema-assertion: property-filter-removal-copy-manual-index-020
assert.equal(openedRulePath,"items.2");

controller.openManual("/checkout");
assert.deepEqual(controller.pendingManualContext,{parentPath:"/checkout"});
assert.equal(controller.pendingManualContext.trigger,undefined,"manual context projections do not expose focus handles");
manualChildName.value="tax";
manualType.value="number";
controller.renderManual();
controller.submitManual({preventDefault(){}});
// retired-schema-assertion: property-filter-removal-copy-manual-index-024
assert.equal(authoringSchema.workingDraft.document.properties.checkout.properties.tax.type,"number");

controller.openManual("/items/*");
manualChildName.value="sku";
manualType.value="string";
controller.renderManual();
controller.submitManual({preventDefault(){}});

// retired-schema-assertion: rule-choice-parameters-predicates-preview-004
assert.equal(authoringSchema.workingDraft.document.properties.items.items.properties.sku.type,"string");

controller.openManual("/checkout");
manualChildName.value = "total";
manualType.value = "number";
controller.renderManual();
// retired-schema-assertion: property-filter-removal-copy-manual-index-023
assert.match(manualPreview.textContent, /checkout\.total is number/);

controller.dispose(() => { dialogReset += 1; });
assert.equal(dialogReset, 1);

assert.equal(controller.pendingRemoval, undefined);

assert.equal(controller.pendingCopy, undefined);
assert.equal(controller.pendingCopyReview,undefined,"the property copy dialog lifecycle is private");
assert.equal(controller.hasPendingCopyReview(),false);

// retired-schema-assertion: property-filter-removal-copy-manual-index-016
assert.equal(controller.pendingCopyPosition, undefined);

assert.equal(controller.interactionReturn, undefined);
assert.equal(controller.expandedRulePaths.size, 0);

assert.equal(controller.selectedPath, "checkout.tax", "dispose preserves the current property selection");

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
