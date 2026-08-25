import assert from "node:assert/strict";
import { verifyPreparedInstalledController } from "../support/data-layer-installed-controller-contract.mjs";
await verifyPreparedInstalledController("schemas");
const { createSchemasInstalledController } = await import("../../dist/data-layer-installed/schemas/index.js");
const schema = { id:"schema:page", name:"Page", version:1, document:{ type:"object", properties:{ title:{ type:"string" } } },
  assignments:[], published:true };
const parentSchema = { id:"schema:parent", name:"Parent", version:2, document:{ type:"object", properties:{ title:{ type:"string" } } },
  assignments:[], attachedRules:[{ id:"rule:parent", version:1, propertyPath:"/title", enabled:true }], published:true };
const values = new Map([["my-chrome-utilities.schema-library.v1", JSON.stringify([schema])]]);
let changed = 0;
const controller = createSchemasInstalledController({
  root:{ querySelector:() => null, querySelectorAll:() => [] },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value), removeItem:(key) => values.delete(key) },
  relationshipViewStorage:{ getItem:()=>null, setItem() {} },
  changed:() => { changed += 1; }, subscribe:() => () => {}, createRuleId:() => "rule:first",
  capturedAssignmentValue:() => undefined, renderAssignmentConditions() {},
  localRulePromotionDialog:{ open() {}, close() {} }, subscribeSchemaPersistence:() => () => {},
  downloadSchema() {},
  relationshipTree:()=>({ projectId:"no-project", nodes:[] }), openProjectLibrary() {}, openContributor() {},
  openContributorInStudio() {}, adoptSavedSchema() {}, renderSchemaSpecification() {}, reportMissingSchemaEvent() {},
  scheduleFrame:(callback)=>callback(), restoreGuidedCapture() {}, mountLayeredProfileEditor:() => undefined,
  showSchemasView() {},
  canonicalConceptSuggestions:() => [],
  activeProjectId:()=>undefined, ensureProjectSchemaContributors:async()=>({ name:"" }),
});
controller.mount(); controller.open("schema:page"); controller.beginDraft();
controller.updateDraft({ document:{ type:"object", required:["title"], properties:{ title:{ type:"string" } } } }, "Require title");
assert.equal(controller.state().draftDirty, true);
const evaluation = controller.validate({ sourceId:"history", eventName:"page_view", payload:{}, rawInput:{} });
assert.equal(evaluation.state, "Not checked", "unassigned events retain the exact validation contract");
const published = controller.publish();
assert.equal(published.version, 2, "Schemas exclusively owns draft publication");
assert.equal(published.document.required[0], "title");
await controller.runGuidedValidation();
assert.ok(changed >= 3);
controller.dispose(); controller.mount();
assert.equal(controller.state().activeSchemaId, "schema:page");
assert.equal(controller.state().draftDirty, false);

let fakeDocument;
function element() {
  const listeners = new Map();
  return { id:"", value:"", textContent:"", hidden:false, disabled:false, open:false, isConnected:true, dataset:{}, children:[], ownerDocument:fakeDocument, scrollTop:0,
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); },
    dispatch(type, event = {}) { listeners.get(type)?.({ preventDefault() {}, target:this, currentTarget:this, ...event }); },
    click() { this.onclick?.(); this.dispatch("click"); },
    showModal() { this.open = true; }, close() { this.open = false; }, focus(options) { this.focused = true; this.focusOptions = options; },
    setAttribute(name, value) { this[name] = value; }, removeAttribute(name) { delete this[name]; },
    getAttribute(name) { return this[name] ?? null; }, replaceChildren(...children) { this.children = children; },
    append(...children) { for (const child of children) if (child && typeof child === "object") { child.isConnected = true; child.parentElement = this; } this.children.push(...children); },
    prepend(...children) { for (const child of children) if (child && typeof child === "object") { child.isConnected = true; child.parentElement = this; } this.children.unshift(...children); },
    insertBefore(child) { child.isConnected = true; child.parentElement = this; this.children.push(child); }, before() {}, after() {},
    remove() { this.removed = true; this.isConnected = false; if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((child) => child !== this); }, contains() { return false; }, closest() { return null; },
    querySelector(selector) { if (selector === 'input[name="allowed-value-expansion-destination"]:checked') {
        const visitInput = (children) => children.find((child) => child.name === "allowed-value-expansion-destination" && child.checked)
          ?? children.map((child) => visitInput(child.children ?? [])).find(Boolean); return visitInput(this.children); }
      const id = selector.startsWith("#") ? selector.slice(1) : undefined;
      const visit = (children) => children.find((child) => id && child.id === id) ?? children.map((child) => visit(child.children ?? [])).find(Boolean);
      return visit(this.children); },
    querySelectorAll() { return this.children.flatMap((child) => child.children?.[0] ? [child.children[0]] : []); },
    listenerCount:() => listeners.size,
  };
}
function findByText(root, text) {
  if (root?.textContent === text) return root;
  for (const child of root?.children ?? []) { const found = findByText(child, text); if (found) return found; }
}
fakeDocument = { createElement:() => Object.assign(element(), { isConnected:false }), body:element() };
globalThis.document = fakeDocument;
const selectors = ["#schema-editor", "#schema-detail", "#schema-detail-empty", "#schema-editor-name",
  "#schema-search", "#schema-category-filter", "#schema-count", "#schema-list", "#schema-empty-state", "#schema-result",
  "#create-schema", "#recheck-schema-validation", "#schema-validation-issues", "#schema-validation-record-list", "#guided-validation-flow", "#live-event-inspector",
  "#workspace-panel-data-layer", "#data-layer-panel-schemas",
  "#schema-editor-parent", "#schema-only-declared-properties", "#schema-inheritance-provenance",
  "#schema-rule-overrides", "#schema-rule-override-list", "#schema-inherited-rule-groups", "#schema-effective-rule-preview",
  "#schema-specification-builder", "#build-specification", "#build-historical-specification",
  "#compact-canonical-context",
  "#schema-editor-name-assistance", "#schema-editor-description", "#save-schema-description", "#schema-description-origin",
  "#schema-editor-target", "#save-schema", "#save-schema-reason", "#schema-revision-review",
  "#schema-revision-review-summary", "#confirm-schema-revision", "#cancel-schema-revision",
  "#close-schema-editor-review", "#schema-close-review-summary", "#discard-schema-draft", "#keep-editing-schema",
  "#close-schema-editor", "#save-and-close-schema", "#save-schema-close-review", "#discard-working-schema-draft",
  "#schema-revision-selector", "#schema-revision-comparison", "#duplicate-schema-revision", "#restore-schema-revision",
  "#add-schema-property", "#schema-property-view-controls", "#schema-property-filter-label", "#schema-property-filter",
  "#schema-property-sort-label", "#schema-property-sort", "#schema-property-result-status", "#schema-property-empty",
  "#schema-property-empty-message", "#clear-schema-property-filter", "#schema-property-tree",
  "#schema-property-removal-feedback", "#undo-schema-property-removal", "#schema-property-removal-dialog",
  "#schema-property-removal-heading", "#schema-property-removal-summary", "#confirm-schema-property-removal",
  "#cancel-schema-property-removal", "#schema-documentation-removal-dialog", "#schema-documentation-removal-heading",
  "#schema-documentation-removal-summary", "#confirm-schema-documentation-removal", "#cancel-schema-documentation-removal",
  "#schema-property-copy-feedback", "#undo-schema-property-copy", "#schema-property-copy-dialog",
  "#schema-specific-index-dialog", "#schema-specific-index-form", "#schema-specific-index-heading",
  "#schema-specific-index-label", "#schema-specific-index", "#schema-specific-index-assistance",
  "#confirm-schema-specific-index", "#cancel-schema-specific-index", "#schema-manual-property-dialog",
  "#schema-manual-property-form", "#schema-manual-property-heading", "#schema-manual-property-path-label",
  "#schema-manual-property-path", "#schema-manual-property-parent-context", "#schema-manual-property-child-name-label",
  "#schema-manual-property-child-name", "#schema-manual-property-type-label", "#schema-manual-property-type",
  "#schema-manual-array-type-group", "#schema-manual-array-item-type", "#schema-manual-property-preview",
  "#schema-manual-property-assistance", "#go-to-existing-schema-property", "#confirm-schema-manual-property",
  "#cancel-schema-manual-property", "#schema-property-rule-picker", "#create-schema-rule", "#schema-rule-editor",
  "#schema-rule-name", "#schema-rule-parameters", "#schema-rule-types", "#schema-rule-operator",
  "#schema-rule-severity", "#schema-rule-message", "#schema-rule-examples", "#save-schema-rule",
  "#schema-rule-list", "#schema-rule-search", "#schema-rule-attachments", "#update-schema-rule-attachments",
  "#schema-rule-upgrade-review", "#schema-rule-upgrade-review-summary", "#confirm-schema-rule-upgrade",
  "#cancel-schema-rule-upgrade", "#schema-rule-revision-review", "#schema-rule-revision-review-summary",
  "#confirm-schema-rule-revision-review", "#cancel-schema-rule-revision", "#schema-rule-sync-review",
  "#schema-rule-sync-review-summary", "#confirm-schema-rule-sync", "#cancel-schema-rule-sync",
  "#export-schema-rules", "#schema-rule-delete-review", "#schema-rule-delete-review-summary",
  "#confirm-schema-rule-delete", "#cancel-schema-rule-delete"];
selectors.push("#create-schema-assignment", "#schema-assignment-editor", "#schema-assignment-source",
  "#schema-assignment-event", "#schema-assignment-priority", "#save-schema-assignment", "#schema-assignment-target",
  "#schema-assignment-domain", "#schema-assignment-pathname", "#schema-assignment-version-policy",
  "#schema-assignment-enabled", "#schema-assignment-list", "#schema-assignment-conflicts",
  "#schema-assignment-schema", "#schema-assignment-data-conditions", "#import-schema", "#schema-library-import-file",
  "#schema-import-review", "#schema-import-review-summary", "#replace-schema-library", "#append-schema-library",
  "#cancel-schema-import", "#schema-delete-review", "#schema-delete-review-summary", "#confirm-schema-delete",
  "#cancel-schema-delete");
selectors.push("#export-schema", "#schema-export-choices", "#schema-export-compatibility-review");
const elements = new Map(selectors.map((selector) => [selector, element()]));
for (const selector of ["#schema-rule-revision-review", "#schema-rule-revision-review-summary",
  "#confirm-schema-rule-revision-review", "#cancel-schema-rule-revision"]) elements.delete(selector);
elements.set("#side-panel-layered-profile-editor", element()); elements.set("#live-event-query", element());
const schemaMasterTab = Object.assign(element(), { textContent:"Schemas", dataset:{}, "aria-controls":"schema-master" });
const schemaRulesTab = Object.assign(element(), { textContent:"Rules", dataset:{}, "aria-controls":"schema-rule-library" });
const schemaMasterPanel = Object.assign(element(), { id:"schema-master" });
const schemaRulesPanel = Object.assign(element(), { id:"schema-rule-library" });
const uiValues = new Map([
  ["my-chrome-utilities.schema-library.v1", JSON.stringify([schema, parentSchema])],
  ["my-chrome-utilities.schema-rule-library.v1", JSON.stringify([
    { id:"rule:retired", name:"Retired rule", kind:"Required", version:1, enabled:true, attachments:[] },
  ])],
]);
let promotionDialogInput, persistenceListener, promotionRuleSequence = 0;
const schemaDownloads = [];
const relationshipActions = [];
let deferHydration = false, releaseHydration;
let closeSpecification;
const restoredGuidedCaptures = [];
let canonicalSettlementMode = "resolve", releaseCanonicalSettlement;
let layeredProfileMounts = 0, layeredProfileDisposals = 0;
let liveRevalidations = 0, continuationPreparation, continuationCommit, continuationFailure;
let canonicalTableMounts = 0, canonicalTableRenders = 0, canonicalTableOptions;
let schemaStorageWrites = 0;
const uiRoot = { ownerDocument:fakeDocument,
  querySelector:(selector) => elements.get(selector) ?? fakeDocument.body.querySelector(selector) ?? null,
  querySelectorAll:(selector) => selector.includes("role=tab") ? [schemaMasterTab, schemaRulesTab] : [schemaMasterPanel, schemaRulesPanel] };
const uiController = createSchemasInstalledController({
  root:uiRoot,
  storage:{ getItem:(key) => uiValues.get(key) ?? null, setItem:(key, value) => { if (key === "my-chrome-utilities.schema-library.v1") schemaStorageWrites += 1; uiValues.set(key, value); }, removeItem:(key) => uiValues.delete(key) },
  relationshipViewStorage:{ getItem:(key) => uiValues.get(`view:${key}`) ?? null, setItem:(key, value) => uiValues.set(`view:${key}`, value) },
  changed() {}, subscribe:() => () => {},
  canonicalConceptSuggestions:() => ["Checkout concept"],
  createCanonicalTableEditor:(options) => { canonicalTableMounts += 1; canonicalTableOptions = options;
    return { render:() => { canonicalTableRenders += 1; } }; },
  createRuleId:() => ["rule:conditional", "rule:checkout", "rule:promoted"][promotionRuleSequence++] ?? `rule:${promotionRuleSequence}`,
  capturedAssignmentValue:(target) => target === "payload" ? { checkout:{ total:12 } } : { raw:true },
  renderAssignmentConditions:(root, state) => { root.textContent = `${state.target}:${state.group?.predicates.length ?? 0}`; },
  localRulePromotionDialog:{ open:(input) => { promotionDialogInput = input; }, close:() => { promotionDialogInput = undefined; } },
  subscribeSchemaPersistence:(listener) => { persistenceListener = listener; return () => { if (persistenceListener === listener) persistenceListener = undefined; }; },
  downloadSchema:(_value, filename) => schemaDownloads.push(filename),
  relationshipTree:(currentSchemas) => ({ projectId:"project:one", nodes:[{ key:"saved-schemas", name:"Saved schemas",
    kind:"branch", role:"Structural ancestor", relationshipPath:"Saved schemas", children:[...currentSchemas.map((candidate) => ({
      key:`saved:${candidate.id}`, name:candidate.name, kind:"contributor", role:"Saved schema", category:"Saved schemas",
      targetKey:`saved:${candidate.id}`, relationshipPath:`Saved schemas / ${candidate.name}`, children:[],
    })), { key:"page:checkout", name:"Checkout", kind:"contributor", role:"Page", category:"Pages",
      targetKey:"pages:checkout", relationshipPath:"Pages / Checkout", children:[] }] }] }),
  openProjectLibrary:(create) => relationshipActions.push(`project:${create}`),
  openContributor:(key) => relationshipActions.push(`open:${key}`),
  openContributorInStudio:(key) => relationshipActions.push(`studio:${key}`),
  adoptSavedSchema:(candidate) => relationshipActions.push(`adopt:${candidate.id}`),
  renderSchemaSpecification:(_root, candidate, _schemas, surface, close) => {
    relationshipActions.push(`build:${candidate.id}:${surface}`); closeSpecification = close;
  },
  reportMissingSchemaEvent:(id) => relationshipActions.push(`missing:${id}`), scheduleFrame:(callback)=>callback(),
  showSchemasView:() => relationshipActions.push("view:Schemas"),
  restoreGuidedCapture:(eventId, propertyPath) => restoredGuidedCaptures.push([eventId, propertyPath]),
  mountLayeredProfileEditor:() => { layeredProfileMounts += 1; return { dispose:() => { layeredProfileDisposals += 1; } }; },
  activeProjectId:()=>"project:one", ensureProjectSchemaContributors:()=>deferHydration
    ? new Promise((resolve)=>{ releaseHydration=resolve; }) : Promise.resolve({ name:"Project One" }),
  settleCanonical:() => canonicalSettlementMode === "reject" ? Promise.reject(new Error("canonical conflict"))
    : canonicalSettlementMode === "defer" ? new Promise((resolve) => { releaseCanonicalSettlement = resolve; }) : Promise.resolve(),
  revalidateCurrentLive:(currentSchemas) => { liveRevalidations += 1; return currentSchemas.length; },
  prepareCapturedValidationContinuation:async (record) => { continuationPreparation = record; if(continuationFailure)throw continuationFailure; return { projectName:"Project One",
    summary:`${record.eventName} · ${record.state} · ${record.schemaName} revision ${record.schemaVersion} → Project One.`,
    review:"Evaluated result capture:one. Proposed reviewed expectations: outcome Valid; issue paths and codes none. Proposed Profile requirements: /email (string, required). Each requirement retains this evidence identity.",
    suggestedName:"Checkout captured validation", events:[{id:"event:checkout",name:"Checkout"}], pages:[{id:"page:checkout",name:"Checkout"}],
    flowSteps:[{id:"step:checkout",name:"Checkout / Submit"}], profiles:[{id:"profile:checkout",name:"Checkout profile"}],
    commit:async (input) => { continuationCommit = input; return { entityName:"Checkout profile", kind:"profiles" }; } }; },
});
for (const selector of ["#schema-rule-revision-review", "#schema-rule-revision-review-summary",
  "#confirm-schema-rule-revision-review", "#cancel-schema-rule-revision"]) {
  const created = fakeDocument.body.querySelector(selector); assert.ok(created, `Schemas creates ${selector} from a minimal dialog host`);
  elements.set(selector, created);
}
assert.equal(elements.get("#confirm-schema-rule-revision-review").id, "confirm-schema-rule-revision-review",
  "Schemas preserves the installed browser contract for rule revision confirmation");
uiController.mount();
assert.equal(layeredProfileMounts, 1, "Schemas mounts the layered Profile editor exactly once");
await uiController.hydrateActiveProjectForSchemas();
assert.equal(elements.get("#schema-result").textContent, "Loaded schema contributors for Project One.");
const initialSavedRow = elements.get("#schema-list").children.find(({ dataset }) => dataset.schemaEntryKey === "saved:schema:page");
assert.ok(initialSavedRow, "the Schema owner renders saved relationship-tree rows");
initialSavedRow.children[2].click(); initialSavedRow.children[3].click(); initialSavedRow.children[5].click();
assert.deepEqual(relationshipActions, ["adopt:schema:page", "build:schema:page:published:1", "missing:schema:page"]);
assert.equal(elements.get("#schema-specification-builder").hidden, false);
closeSpecification(); assert.equal(elements.get("#schema-specification-builder").hidden, true);
const contributorRow = elements.get("#schema-list").children.find(({ dataset }) => dataset.schemaEntryKey === "pages:checkout");
contributorRow.children[0].click(); contributorRow.children[1].click();
assert.deepEqual(relationshipActions.slice(-2), ["open:pages:checkout", "studio:pages:checkout"]);
await Promise.resolve();
elements.get("#workspace-panel-data-layer").scrollTop = 37; elements.get("#workspace-panel-data-layer").dispatch("scroll");
assert.match(uiValues.get("view:my-chrome-utilities.schema-relationship-tree-view.v1:project:one"), /"scrollTop":37/);
const treeControls = elements.get("#schema-list").querySelectorAll();
elements.get("#schema-list").dispatch("keydown", { target:treeControls[0], key:"End" });
assert.equal(treeControls.at(-1).focused, true, "tree keyboard navigation remains controller-owned");
uiController.open("schema:page"); uiController.beginDraft();
const sourceLibraryBefore = uiController.schemas();
const sourceStorageBefore = uiValues.get("my-chrome-utilities.schema-library.v1");
const richSourceSchema = uiController.openSchemaFromSource({ name:"Checkout", sourceId:"gtm", eventName:"checkout",
  payload:{ total:12, coupon:"SAVE" }, label:"Library template" });
assert.deepEqual(richSourceSchema.assignments, [{ sourceId:"gtm", eventName:"checkout", target:"payload" }]);
assert.deepEqual(richSourceSchema.workingDraft.assignments, [{ sourceId:"gtm", eventName:"checkout", target:"payload" }]);
assert.equal(uiController.guidedState().selectedSchemaPropertyPath, "total");
assert.equal(elements.get("#schema-result").textContent, "Library template fields loaded into a new schema draft.");
assert.equal(elements.get("#schema-editor-name").focused, true);
assert.equal(relationshipActions.at(-1), "view:Schemas");
assert.deepEqual(elements.get("#schema-property-tree").children.map(({ dataset }) => dataset.schemaPropertyCanonicalPath),
  ["/total", "/coupon"], "source-created properties retain the canonical property-row browser contract");
assert.deepEqual(elements.get("#schema-property-tree").children.map(({ children }) => children[0].textContent),
  ["total", "coupon"], "source-created property rows expose their canonical labels as headings");
elements.get("#schema-editor-target").value = "raw input"; elements.get("#schema-editor-target").dispatch("input");
assert.equal(uiController.state().transientDraft.workingDraft.assignments[0].target, "raw input",
  "schema target input updates the transient draft through the exact installed event type");
elements.get("#schema-editor-target").value = "payload"; elements.get("#schema-editor-target").dispatch("input");
assert.deepEqual(uiController.schemas(), sourceLibraryBefore, "opening a source does not append transient editor state to the Schema Library");
assert.equal(uiValues.get("my-chrome-utilities.schema-library.v1"), sourceStorageBefore,
  "opening a source performs no premature Schema Library storage write");
const primitiveSourceSchema = uiController.openSchemaFromSource({ name:"Consent", sourceId:"page", eventName:"consent",
  payload:true, label:"Captured event" });
assert.equal(primitiveSourceSchema.workingDraft.document.type, "object");
assert.equal(primitiveSourceSchema.workingDraft.document.properties.value.type, "boolean",
  "primitive source payloads remain editable through the legacy value wrapper");
assert.deepEqual(primitiveSourceSchema.workingDraft.assignments, [{ sourceId:"page", eventName:"consent", target:"payload" }]);
assert.equal(uiController.guidedState().selectedSchemaPropertyPath, "value");
const arraySourceSchema = uiController.openSchemaFromSource({ name:"Products", sourceId:"gtm", eventName:"products",
  payload:[{ sku:"A", quantity:2 }], label:"Captured event" });
assert.equal(arraySourceSchema.workingDraft.document.properties.value.type, "array");
assert.equal(arraySourceSchema.workingDraft.document.properties.value.items.type, "object");
assert.equal(arraySourceSchema.workingDraft.document.properties.value.items.properties.quantity.type, "number",
  "array source inference recursively preserves the first item schema");
const emptyArraySchema = uiController.openSchemaFromSource({ name:"Empty products", sourceId:"gtm", eventName:"products",
  payload:[], label:"Captured event" });
assert.deepEqual(emptyArraySchema.workingDraft.document.properties.value, { type:"array", items:{} },
  "empty arrays retain an explicit empty item schema");
assert.deepEqual(uiController.schemas(), sourceLibraryBefore); assert.equal(uiValues.get("my-chrome-utilities.schema-library.v1"), sourceStorageBefore);
elements.get("#save-schema").click();
assert.equal(elements.get("#schema-revision-review").open, true, "a transient Source draft reaches the publication review");
elements.get("#cancel-schema-revision").click();
assert.deepEqual(uiController.schemas(), sourceLibraryBefore); assert.equal(uiValues.get("my-chrome-utilities.schema-library.v1"), sourceStorageBefore,
  "canceling Source publication leaves both the library and storage unchanged");
elements.get("#discard-schema-draft").click();
assert.deepEqual(uiController.schemas(), sourceLibraryBefore); assert.equal(uiValues.get("my-chrome-utilities.schema-library.v1"), sourceStorageBefore,
  "discarding a transient Source draft leaves no stored schema behind");
uiController.openSchemaFromSource({ name:"Checkout", sourceId:"gtm", eventName:"checkout",
  payload:{ total:12, coupon:"SAVE" }, label:"Library template" });
elements.get("#save-schema").click(); const sourceWritesBeforePublish = schemaStorageWrites; elements.get("#confirm-schema-revision").click();
assert.equal(uiController.schemas().length, sourceLibraryBefore.length + 1, "confirming Source publication appends exactly one schema");
assert.deepEqual(uiController.schemas().at(-1).assignments, [{ sourceId:"gtm", eventName:"checkout", target:"payload" }]);
assert.equal(uiController.schemas().at(-1).document.properties.total.type, "number");
assert.equal(schemaStorageWrites, sourceWritesBeforePublish + 1, "Source confirmation performs the first and only library write");
assert.equal(uiController.state().activeSchemaId, undefined); assert.equal(elements.get("#schema-editor").hidden, true);
assert.equal(elements.get("#schema-revision-review").open, false, "Source publication closes the review and returns to the list");
uiController.replace(sourceLibraryBefore);
const newLibraryBefore = uiController.schemas(), newStorageBefore = uiValues.get("my-chrome-utilities.schema-library.v1");
elements.get("#create-schema").click(); elements.get("#schema-editor-name").value = "Transient New"; elements.get("#schema-editor-name").dispatch("input");
assert.deepEqual(uiController.schemas(), newLibraryBefore); assert.equal(uiValues.get("my-chrome-utilities.schema-library.v1"), newStorageBefore,
  "New Schema editing remains transient before confirmation");
elements.get("#save-schema").click(); elements.get("#cancel-schema-revision").click();
elements.get("#close-schema-editor").click();
assert.deepEqual(uiController.schemas(), newLibraryBefore); assert.equal(uiValues.get("my-chrome-utilities.schema-library.v1"), newStorageBefore,
  "cancel and close remove a transient New Schema without library mutation");
assert.equal(elements.get("#close-schema-editor-review").open, false, "close does not route a transient draft through discard review");
elements.get("#create-schema").click(); elements.get("#schema-editor-name").value = "Published New"; elements.get("#schema-editor-name").dispatch("input");
const newWritesBeforeReview = schemaStorageWrites; elements.get("#save-and-close-schema").click();
assert.equal(elements.get("#schema-revision-review").open, true); assert.deepEqual(uiController.schemas(), newLibraryBefore);
assert.equal(schemaStorageWrites, newWritesBeforeReview, "save-and-close waits for revision confirmation before persistence");
const newWritesBeforePublish = schemaStorageWrites; elements.get("#confirm-schema-revision").click();
assert.equal(uiController.schemas().length, newLibraryBefore.length + 1, "confirming New Schema appends exactly once");
assert.equal(uiController.schemas().at(-1).name, "Published New");
assert.equal(schemaStorageWrites, newWritesBeforePublish + 1, "New Schema confirmation performs its first library write");
assert.equal(uiController.state().activeSchemaId, undefined); assert.equal(elements.get("#schema-editor").hidden, true,
  "New Schema publication clears transient editor state");
uiController.replace(sourceLibraryBefore);
uiController.openSchemaFromSource({ name:"Review boundary", sourceId:"page", eventName:"review", payload:{ ready:true }, label:"Captured event" });
const closeReviewWrites = schemaStorageWrites; elements.get("#save-schema-close-review").click();
assert.equal(elements.get("#schema-revision-review").open, true); assert.deepEqual(uiController.schemas(), sourceLibraryBefore);
assert.equal(schemaStorageWrites, closeReviewWrites, "close-review save also delegates to confirmation without eager publication");
elements.get("#cancel-schema-revision").click(); elements.get("#discard-schema-draft").click();
uiController.open("schema:page"); uiController.beginDraft();
elements.get("#build-specification").click();
assert.equal(relationshipActions.at(-1), "build:schema:page:working-draft"); closeSpecification();
elements.get("#schema-editor-parent").value = "schema:parent"; elements.get("#schema-editor-parent").dispatch("change");
assert.equal(uiController.schemas().find(({ id }) => id === "schema:page").workingDraft.parentSchemaId, "schema:parent");
assert.match(elements.get("#schema-inheritance-provenance").textContent, /Parent v2/);
assert.equal(elements.get("#schema-inherited-rule-groups").hidden, false);
assert.match(elements.get("#schema-inherited-rule-groups").children[0].children[0].textContent, /Active inherited \(1\)/);
elements.get("#schema-only-declared-properties").checked = true; elements.get("#schema-only-declared-properties").dispatch("change");
assert.equal(uiController.schemas().find(({ id }) => id === "schema:page").workingDraft.document.additionalProperties, false);
elements.get("#schema-editor-name").value = "Page checkout"; elements.get("#schema-editor-name").dispatch("input");
elements.get("#schema-editor-description").value = "Checkout payload"; elements.get("#save-schema-description").click();
elements.get("#save-schema").click();
assert.equal(elements.get("#schema-revision-review").open, true, "saving opens the controller-owned revision review");
elements.get("#confirm-schema-revision").click();
assert.equal(uiController.schemas()[0].version, 2);
assert.equal(uiController.schemas()[0].name, "Page checkout");
assert.equal(uiController.schemas()[0].documentation.description, "Checkout payload");
assert.equal(uiController.state().activeSchemaId, undefined); assert.equal(elements.get("#schema-editor").hidden, true,
  "stored-schema publication clears editor state and returns to the list");
uiController.open("schema:page");
assert.deepEqual(elements.get("#schema-revision-selector").children.map(({ value, textContent }) => ({ value, textContent })),
  [{ value:"1", textContent:"Revision 1" }], "opening a published schema renders its historical revision choices");
elements.get("#schema-revision-selector").value = "1"; elements.get("#restore-schema-revision").click();
assert.equal(elements.get("#schema-revision-comparison").textContent,
  "Revision 1 compared with current revision 2. 1 historical properties; 1 current properties.");
assert.equal(elements.get("#schema-revision-review").open, true);
assert.equal(uiController.schemas().find(({ id }) => id === "schema:page").workingDraft, undefined,
  "requesting historical restoration does not mutate the current schema before confirmation");
elements.get("#cancel-schema-revision").click();
assert.equal(uiController.schemas().find(({ id }) => id === "schema:page").workingDraft, undefined,
  "cancelling historical restoration leaves the current schema unchanged");
elements.get("#restore-schema-revision").click(); elements.get("#confirm-schema-revision").click();
assert.equal(uiController.schemas().find(({ id }) => id === "schema:page").workingDraft.sourceVersion, 1,
  "confirming historical restoration creates a working draft from the selected revision");
elements.get("#discard-working-schema-draft").click(); uiController.open("schema:page");
elements.get("#schema-revision-selector").value = "1"; elements.get("#build-historical-specification").click();
assert.equal(relationshipActions.at(-1), "build:schema:page:historical:1"); closeSpecification();
elements.get("#schema-revision-selector").value = "1"; elements.get("#duplicate-schema-revision").click();
assert.equal(uiController.schemas().length, 3, "revision duplication remains schema-controller behavior");
const lifecycleSchemaId = uiController.state().activeSchemaId;
uiController.beginDraft();
const storedDraftStorage = uiValues.get("my-chrome-utilities.schema-library.v1"), storedDraftWrites = schemaStorageWrites;
elements.get("#close-schema-editor").click();
assert.equal(uiController.state().activeSchemaId, undefined); assert.equal(elements.get("#close-schema-editor-review").open, false);
assert.equal(schemaStorageWrites, storedDraftWrites); assert.equal(uiValues.get("my-chrome-utilities.schema-library.v1"), storedDraftStorage);
assert.ok(uiController.schemas().find(({ id }) => id === lifecycleSchemaId).workingDraft,
  "close retains the stored working draft without another persistence write");
assert.equal(elements.get("#schema-result").textContent, "Working draft retained without publishing.");
uiController.open(lifecycleSchemaId); const abandonWrites = schemaStorageWrites; elements.get("#discard-schema-draft").click();
assert.equal(schemaStorageWrites, abandonWrites); assert.ok(uiController.schemas().find(({ id }) => id === lifecycleSchemaId).workingDraft,
  "discard-schema-draft abandons editor state without discarding the stored working draft");
uiController.open(lifecycleSchemaId); const discardStoredWrites = schemaStorageWrites; elements.get("#discard-working-schema-draft").click();
assert.equal(schemaStorageWrites, discardStoredWrites + 1); assert.equal(uiController.schemas().find(({ id }) => id === lifecycleSchemaId).workingDraft, undefined,
  "discard-working-schema-draft is the distinct operation that mutates the stored library");
uiController.open(lifecycleSchemaId); uiController.beginDraft();
assert.equal(elements.get("#schema-property-result-status").textContent, "1 of 1 properties");
elements.get("#schema-property-filter").value = "missing"; elements.get("#schema-property-filter").dispatch("input");
assert.equal(elements.get("#schema-property-empty").hidden, false);
assert.equal(elements.get("#schema-property-empty-message").textContent, "No properties match missing");
elements.get("#clear-schema-property-filter").click();
assert.equal(elements.get("#schema-property-filter").value, "");
const propertyToggle = elements.get("#schema-property-tree").children[0].children[7]; propertyToggle.click();
assert.equal(propertyToggle.listenerCount(), 0, "property action rerender disposes the replaced row listeners");
schemaRulesTab.click();
assert.equal(schemaMasterPanel.hidden, true); assert.equal(schemaRulesPanel.hidden, false);
uiController.beginDraft();
uiController.updateDraft({ documentation:{ properties:{ "/title":{ displayName:"Title", description:"Page title" } } } });
uiController.requestPropertyRemoval("/title");
assert.equal(elements.get("#schema-property-removal-dialog").open, true);
assert.match(elements.get("#schema-property-removal-summary").textContent, /Documentation entries: \/title/);
elements.get("#confirm-schema-property-removal").click();
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).workingDraft.document.properties.title,
  undefined);
elements.get("#undo-schema-property-removal").click();
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).workingDraft.document.properties.title.type,
  "string", "Undo restores the exact property definition");
uiController.requestDocumentationRemoval("/title");
elements.get("#confirm-schema-documentation-removal").click();
const documentationDraft = uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).workingDraft;
assert.equal(documentationDraft.document.properties.title.type, "string");
assert.equal(documentationDraft.documentation.properties, undefined,
  "documentation-only removal leaves the schema property intact");
const sourceId = uiController.state().activeSchemaId;
const destinationId = uiController.schemas().find(({ id }) => id !== sourceId).id;
uiController.updateDraft({ document:{ type:"object", properties:{ title:{ type:"string" }, checkout:{ type:"boolean" } } } });
uiController.requestPropertyCopy("/checkout", destinationId);
assert.equal(elements.get("#schema-property-copy-dialog").open, true);
uiController.confirmPropertyCopy();
assert.equal(uiController.schemas().find(({ id }) => id === destinationId).workingDraft.document.properties.checkout.type, "boolean");
elements.get("#undo-schema-property-copy").click();
assert.equal(uiController.schemas().find(({ id }) => id === destinationId).workingDraft, undefined,
  "property-copy undo restores the complete destination schema state");
uiController.updateDraft({ document:{ type:"object", properties:{ items:{ type:"array", items:{ type:"object",
  properties:{ name:{ type:"string" } } } } } } });
uiController.openSpecificIndex("/items");
elements.get("#schema-specific-index").value = "2"; elements.get("#schema-specific-index").dispatch("input");
assert.equal(elements.get("#confirm-schema-specific-index").disabled, false);
elements.get("#schema-specific-index-form").dispatch("submit");
assert.equal(elements.get("#schema-specific-index-dialog").open, false);
assert.equal(elements.get("#schema-property-rule-picker").open, true,
  "an accepted specific index transitions directly into the controller-owned rule picker");
assert.equal(uiController.rulePickerState().path, "items.2");
assert.match(elements.get("#schema-property-rule-picker").dataset.conditionPreview, /items\/2/,
  "the dotted controller path retains the accepted canonical array index");
elements.get("#schema-property-rule-picker").dispatch("cancel");
assert.equal(uiController.rulePickerState().path, undefined,
  "closing the owned rule picker clears its transition state without an external callback");
uiController.openManualProperty();
elements.get("#schema-manual-property-path").value = "checkout.total";
elements.get("#schema-manual-property-type").value = "number";
elements.get("#schema-manual-property-path").dispatch("input");
assert.match(elements.get("#schema-manual-property-preview").textContent, /checkout.total is number/);
elements.get("#schema-manual-property-form").dispatch("submit");
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId)
  .workingDraft.document.properties.checkout.properties.total.type, "number");
uiController.openContextualManualProperty("/items/*");
elements.get("#schema-manual-property-child-name").value = "sku";
elements.get("#schema-manual-property-type").value = "string";
elements.get("#schema-manual-property-child-name").dispatch("input");
elements.get("#schema-manual-property-form").dispatch("submit");
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId)
  .workingDraft.document.properties.items.items.properties.sku.type, "string");
uiController.openRulePicker("items.*.sku");
assert.equal(elements.get("#schema-property-rule-picker").open, true);
assert.equal(uiController.rulePickerState().configuration.propertyType, "string");
assert.match(elements.get("#schema-property-rule-picker").dataset.conditionPreview, /items\/\*\/sku/);
assert.deepEqual(uiController.conditionPredicate("checkout.total"), { operator:"All", predicates:[{
  propertyPath:"/checkout/total", operator:"Equals", comparison:{ type:"number", value:12 },
}] }, "sampled primitive condition values become typed Equals comparisons");
elements.get("#schema-property-rule-picker").dispatch("cancel");
assert.equal(uiController.rulePickerState().path, undefined,
  "rule-picker close owns its state transition after removal of the notification-only port");
uiController.openRulePicker("checkout.total");
for (const id of ["schema-local-rule-configuration", "schema-property-rule-picker-heading", "schema-local-rule-parameters",
  "schema-local-rule-assistance", "schema-local-rule-severity", "schema-local-rule-message", "schema-local-rule-enabled",
  "schema-local-rule-conditional", "schema-local-rule-reusable"]) {
  assert.ok(elements.get("#schema-property-rule-picker").querySelector(`#${id}`), `Schemas creates dynamic rule control #${id}`);
}
const conditionalControl = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-conditional");
conditionalControl.checked = true; conditionalControl.dispatch("change");
assert.deepEqual(uiController.rulePickerState().configuration.conditions[0].comparison, { type:"number", value:12 },
  "the live conditional editor seeds its predicate from the sampled typed value");
const reusableControl = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-reusable");
reusableControl.checked = true; reusableControl.dispatch("change");
const conditionGroup = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-condition-group");
conditionGroup.value = "Any"; conditionGroup.dispatch("change");
assert.equal(uiController.rulePickerState().configuration.conditionGroupOperator, "Any");
const conditionProperty = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-condition-property-0");
conditionProperty.value = "/checkout/total"; conditionProperty.dispatch("change");
const conditionComparison = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-condition-value-0");
conditionComparison.value = "13"; conditionComparison.dispatch("input");
assert.deepEqual(uiController.rulePickerState().configuration.conditions[0].comparison, { type:"number", value:13 });
elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-condition-add").click();
assert.equal(uiController.rulePickerState().configuration.conditions.length, 2, "the live editor adds conditional predicates");
elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-condition-remove-1").click();
assert.equal(uiController.rulePickerState().configuration.conditions.length, 1, "the live editor removes conditional predicates");
const conditionOperator = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-condition-operator-0");
conditionOperator.value = "Exists"; conditionOperator.dispatch("change");
assert.equal(uiController.rulePickerState().configuration.conditions[0].comparison, undefined);
const severityControl = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-severity");
severityControl.value = "warning"; severityControl.dispatch("change");
const messageControl = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-message");
messageControl.value = "Observed checkout total is required"; messageControl.dispatch("input");
const enabledControl = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-enabled");
enabledControl.checked = false; enabledControl.dispatch("change");
const configuredName = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-name");
configuredName.value = "Sampled checkout total"; configuredName.dispatch("input");
const configuredDescription = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-description");
configuredDescription.value = "Created from the current capture"; configuredDescription.dispatch("input");
elements.get("#schema-property-rule-picker").children[0].dispatch("submit");
assert.equal(uiController.rules().some(({ name }) => name === "Sampled checkout total"), true,
  "the live rule form commits its validated reusable rule through Schema ownership");
assert.equal(uiController.rules().find(({ name }) => name === "Sampled checkout total").severity, "warning");
uiController.openRulePicker("checkout.total"); uiController.configureRule("Exact value");
const exactValueControl = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-exactValue");
exactValueControl.value = "12"; exactValueControl.dispatch("input");
assert.equal(uiController.rulePickerState().configuration.exactValue, "12", "parameter controls update the live rule configuration");
elements.get("#schema-property-rule-picker").children[0].children.at(-1).click();
uiController.openRulePicker("checkout.total"); uiController.configureRule("Allowed values");
let allowedValue = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-allowed-value-1");
allowedValue.value = "12"; allowedValue.dispatch("input");
findByText(elements.get("#schema-property-rule-picker"), "Add another value").click();
allowedValue = elements.get("#schema-property-rule-picker").querySelector("#schema-local-rule-allowed-value-2"); allowedValue.value = "13"; allowedValue.dispatch("input");
assert.deepEqual(uiController.rulePickerState().configuration.allowedValues, ["12", "13"]);
findByText(elements.get("#schema-property-rule-picker"), "Remove value 1").click();
assert.deepEqual(uiController.rulePickerState().configuration.allowedValues, ["13"]);
elements.get("#schema-property-rule-picker").children[0].children.at(-1).click();
uiController.openRulePicker("checkout.total");
elements.get("#schema-property-rule-picker").children[0].children.at(-2).click();
assert.ok(elements.get("#schema-property-rule-picker").querySelector("#schema-property-rule-picker-heading"));
assert.ok(elements.get("#schema-property-rule-picker").querySelector("#schema-property-rule-results"),
  "Schemas preserves the dynamic legacy rule-results ID when returning to rule choices");
const pickerSearch = elements.get("#schema-property-rule-picker").querySelector("#schema-property-rule-search"); pickerSearch.value = "missing"; pickerSearch.dispatch("input");
assert.equal(elements.get("#schema-property-rule-picker").children[2].children[0].id, "schema-property-rule-empty");
assert.equal(elements.get("#schema-property-rule-picker").children[2].children[1].textContent, "Clear search");
elements.get("#schema-property-rule-picker").children[2].children[1].click();
assert.ok(elements.get("#schema-property-rule-picker").children[2].children.length > 1, "clearing restores compatible rule choices");
elements.get("#schema-property-rule-picker").children.at(-1).click();
uiController.publish();
assert.ok(liveRevalidations > 0, "schema publication revalidates the current Live view through its typed port");
elements.get("#create-schema-rule").click();
elements.get("#schema-rule-name").value = "Checkout required";
elements.get("#schema-rule-types").value = "string"; elements.get("#schema-rule-operator").value = "required";
elements.get("#schema-rule-severity").value = "error"; elements.get("#schema-rule-message").value = "Checkout is required";
elements.get("#schema-rule-attachments").selectedOptions = [{ value:uiController.state().activeSchemaId }];
elements.get("#save-schema-rule").click();
assert.equal(uiController.rules().find(({ id }) => id === "rule:checkout").name, "Checkout required");
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId)
  .attachedRules.some(({ id }) => id === "rule:checkout"), true);
assert.equal(uiController.updateAttachedRule(uiController.state().activeSchemaId, "rule:checkout", false), true);
assert.equal(uiController.updateAttachedRule(uiController.state().activeSchemaId, "rule:checkout", true), true);
elements.get("#schema-rule-search").value = "checkout"; elements.get("#schema-rule-search").dispatch("input");
const checkoutRuleRow = elements.get("#schema-rule-list").children.find(({ children }) => /Checkout required/.test(children[0].textContent));
assert.ok(checkoutRuleRow); const disableRuleButton = checkoutRuleRow.children[5]; disableRuleButton.click();
assert.equal(uiController.rules().find(({ id }) => id === "rule:checkout").enabled, false);
assert.equal(disableRuleButton.listenerCount(), 0, "rerender disposes the replaced rule-row action listeners");
elements.get("#schema-rule-list").children[0].children[5].click();
assert.equal(uiController.requestRuleRevision("rule:checkout", { name:"Checkout present", message:"Checkout must be present" }), true);
assert.equal(elements.get("#schema-rule-revision-review").open, true);
elements.get("#cancel-schema-rule-revision").click();
assert.equal(uiController.rules().find(({ id }) => id === "rule:checkout").version, 1, "cancel leaves a rule revision untouched");
uiController.requestRuleRevision("rule:checkout", { name:"Checkout present", message:"Checkout must be present" });
elements.get("#confirm-schema-rule-revision-review").click();
assert.equal(uiController.rules().find(({ id }) => id === "rule:checkout").version, 2);
assert.equal(uiController.rules().find(({ id }) => id === "rule:checkout").revisionHistory[0].name, "Checkout required");
assert.equal(uiController.requestRuleSync("rule:checkout"), true);
assert.match(elements.get("#schema-rule-sync-review-summary").textContent, /1 schemas and 1 attachments/);
const versionBeforeSync = uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).version;
uiController.confirmRuleSync();
const syncedSchema = uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId);
assert.equal(syncedSchema.version, versionBeforeSync + 1, "sync publishes exactly one reviewed schema revision");
assert.equal(syncedSchema.attachedRules.find(({ id }) => id === "rule:checkout").version, 2);
uiController.requestRuleRevision("rule:checkout", { severity:"warning" });
elements.get("#confirm-schema-rule-revision-review").click();
uiController.requestRuleUpgrade("rule:checkout", [uiController.state().activeSchemaId]);
assert.equal(elements.get("#schema-rule-upgrade-review").open, true);
elements.get("#confirm-schema-rule-upgrade").click();
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId)
  .attachedRules.find(({ id }) => id === "rule:checkout").version, 3, "upgrade changes the selected pinned attachment without publishing");
assert.equal(uiController.ruleState().approvedRuleRevisionId, "rule:checkout");
assert.equal(uiController.ruleState().approvedRuleAttachmentUpdateId, "rule:checkout");
assert.equal(uiController.editReusableRule("rule:retired"), true); elements.get("#schema-rule-name").value = "Retired rule reviewed";
elements.get("#schema-rule-attachments").selectedOptions = []; elements.get("#save-schema-rule").click();
assert.equal(elements.get("#schema-rule-revision-review").open, true, "editing a reusable rule requires revision review");
assert.match(elements.get("#schema-rule-revision-review-summary").textContent, /; examples .* → .*\.$/u,
  "reusable-rule revision review preserves the examples comparison");
elements.get("#confirm-schema-rule-revision-review").click();
assert.equal(uiController.rules().find(({ id }) => id === "rule:retired").version, 2);
assert.deepEqual(uiController.ruleState().pendingRuleSnapshotMetadata, { id:"rule:retired", version:1, attachments:[] });
elements.get("#create-schema-rule").click();
assert.equal(uiController.ruleState().editingReusableSchemaRuleId, undefined,
  "Create rule clears the identity of the previously edited reusable rule");
assert.equal(uiController.requestRuleDeletion("rule:checkout"), false, "attached rules cannot be deleted");
assert.equal(uiController.requestRuleDeletion("rule:retired"), true);
elements.get("#cancel-schema-rule-delete").click();
assert.equal(uiController.rules().some(({ id }) => id === "rule:retired"), true);
uiController.requestRuleDeletion("rule:retired"); elements.get("#confirm-schema-rule-delete").click();
assert.equal(uiController.rules().some(({ id }) => id === "rule:retired"), false);
elements.get("#schema-assignment-schema").value = uiController.state().activeSchemaId;
elements.get("#create-schema-assignment").click();
elements.get("#schema-assignment-source").value = "gtm"; elements.get("#schema-assignment-event").value = "checkout";
elements.get("#schema-assignment-priority").value = "20"; elements.get("#schema-assignment-target").value = "payload";
elements.get("#schema-assignment-domain").value = "shop.example"; elements.get("#schema-assignment-pathname").value = "/checkout";
elements.get("#schema-assignment-version-policy").value = "follow latest"; elements.get("#schema-assignment-enabled").checked = true;
elements.get("#save-schema-assignment").click();
const assignedSchema = uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId);
assert.equal(assignedSchema.assignments[0].eventName, "checkout");
assert.equal(assignedSchema.assignments[0].versionPolicy, "follow latest");
assert.match(elements.get("#schema-assignment-list").children[0].children[0].textContent, /gtm\/checkout/);
elements.get("#schema-assignment-list").children[0].children[2].click();
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).assignments.length, 2,
  "assignment duplication preserves the complete assignment contract");
assert.match(elements.get("#schema-assignment-conflicts").textContent, /Assignment conflict/);
elements.get("#schema-assignment-list").children[1].children[3].click();
assert.equal(elements.get("#schema-assignment-conflicts").textContent, "", "disabled duplicates no longer conflict");
const importedSchema = { id:"schema:imported", name:"Imported", version:1, document:{ type:"object" }, assignments:[], published:true };
uiController.reviewLibraryImport(JSON.stringify({ version:1, schemas:[importedSchema], rules:[] }));
assert.equal(elements.get("#schema-import-review").open, true);
elements.get("#cancel-schema-import").click();
assert.equal(uiController.schemas().some(({ id }) => id === importedSchema.id), false, "cancel leaves both libraries untouched");
uiController.reviewLibraryImport(JSON.stringify({ version:1, schemas:[importedSchema], rules:[] }));
elements.get("#append-schema-library").click();
assert.equal(uiController.schemas().some(({ id }) => id === importedSchema.id), true);
assert.equal(uiController.requestDeletion(importedSchema.id), true);
assert.match(elements.get("#schema-delete-review-summary").textContent, /Imported v1/);
elements.get("#cancel-schema-delete").click();
assert.equal(uiController.schemas().some(({ id }) => id === importedSchema.id), true);
uiController.requestDeletion(importedSchema.id); elements.get("#confirm-schema-delete").click();
assert.equal(uiController.schemas().some(({ id }) => id === importedSchema.id), false);
assert.equal(uiController.openExportChoices(), true);
assert.equal(elements.get("#schema-export-choices").open, true);
assert.equal(elements.get("#schema-export-choices").children[0].textContent, "Export Schema Library");
assert.equal(elements.get("#schema-export-choices").children[3].textContent, "JSON Schema Draft 2020-12 bundle");
assert.equal(elements.get("#schema-export-choices").children[4].textContent, "For third-party standards-based validation; not extension configuration.");
elements.get("#schema-export-choices").children[5].click();
assert.deepEqual(schemaDownloads, [], "cancelled export produces no download");
uiController.openExportChoices(); elements.get("#schema-export-choices").children[3].click();
assert.equal(elements.get("#schema-export-compatibility-review").open, true);
assert.equal(elements.get("#schema-export-compatibility-review").children[0].textContent, "JSON Schema Draft 2020-12 compatibility review");
assert.equal(elements.get("#schema-export-compatibility-review").children[2]["aria-label"], "Standard export conversions");
assert.equal(uiController.omittedRuleStatus(1), "1 omitted rule");
elements.get("#schema-export-compatibility-review").children[4].click();
assert.match(schemaDownloads[0], /schema.*\.json/, "confirmed standard export crosses the typed download port");
const publishedExportCount=uiController.schemas().filter(({published,version})=>published!==false&&version>0).length;
assert.equal(elements.get("#schema-result").textContent,`Exported JSON Schema Draft 2020-12 bundle · ${publishedExportCount} schemas · 2 omitted rules.`);
assert.deepEqual(elements.get("#export-schema").focusOptions,{preventScroll:true},"export completion restores trigger focus without scrolling");
uiController.openExportChoices();elements.get("#schema-export-choices").children[1].click();
assert.equal(elements.get("#schema-result").textContent,`Exported Extension backup · ${uiController.schemas().length} schemas and ${uiController.rules().length} rules.`);
const exportedSchemaId=uiController.state().activeSchemaId;uiController.openExportChoices(exportedSchemaId);elements.get("#schema-export-choices").children[1].click();
const exportedSchema=uiController.schemas().find(({id})=>id===exportedSchemaId);
assert.equal(elements.get("#schema-result").textContent,`Exported Extension schema package · ${exportedSchema.name} revision ${exportedSchema.version}.`);
uiController.openExportChoices(exportedSchemaId);elements.get("#schema-export-choices").children[3].click();elements.get("#schema-export-compatibility-review").children[4].click();
assert.equal(elements.get("#schema-result").textContent,`Exported JSON Schema Draft 2020-12 · ${exportedSchema.name} revision ${exportedSchema.version} · 0 omitted rules.`);
const persistenceSchemaId = uiController.state().activeSchemaId;
uiController.beginDraft();
const persistenceSchema = uiController.schemas().find(({ id }) => id === persistenceSchemaId);
const guidedCapture = { id:"capture:checkout", sourceId:"gtm", name:"checkout", payload:{ checkout:{ email:"buyer@example.test" } }, rawInput:{} };
const unboundGuidedCapture = { id:"capture:pageview", sourceId:"gtm", name:"pageview", payload:{ page_type:"home" }, rawInput:{} };
await uiController.openGuidedLiveProperty(unboundGuidedCapture, "/page_type");
assert.equal(uiController.guidedDraft().continuation, undefined,
  "a live property without an explicit continuation keeps the guided destination picker available");
uiController.closeGuided();
assert.deepEqual(restoredGuidedCaptures.at(-1), [unboundGuidedCapture.id, "/page_type"],
  "closing an unbound live-property flow returns to the originating captured property");
const schemaPaths = uiController.schemaDocumentPaths(persistenceSchema.workingDraft.document);
assert.ok(schemaPaths.length > 0); assert.ok(uiController.schemaPropertyAt(persistenceSchema.workingDraft.document, schemaPaths[0]));
const definedDocument = uiController.defineSchemaProperty({ type:"object" }, { path:"sample", type:"string" });
assert.equal(uiController.schemaPropertyType(definedDocument, "/sample"), "string");
uiController.setManualSchemaOverride(guidedCapture.id, persistenceSchemaId);
await uiController.openGuidedProperty(guidedCapture, persistenceSchema, "checkout.email");
assert.equal(elements.get("#guided-validation-flow").dataset.eventId, guidedCapture.id);
assert.equal(uiController.guidedDraft().continuation.schemaId, persistenceSchemaId,
  "the Schema-owned guided flow exposes the real continuation draft");
assert.match(uiValues.get("my-chrome-utilities.guided-validation-continuations.v1"), /schema:page/,
  "guided continuation selection is persisted by the Schema owner");
assert.equal(uiController.guidedContinuation(guidedCapture).schemaId, persistenceSchemaId,
  "guided continuation remains bound to the selected working draft");
const guidedContinuation = uiController.guidedContinuation(guidedCapture);
guidedContinuation.review(); assert.equal(uiController.state().activeSchemaId, persistenceSchemaId);
guidedContinuation.useDifferent();
const guidedPicker = elements.get("#guided-validation-flow").children[0];
assert.equal(guidedPicker.id, "guided-continuation-schema-picker");
assert.equal(guidedPicker.children[0].id, "guided-continuation-schema-picker-heading");
assert.equal(guidedPicker["aria-labelledby"], "guided-continuation-schema-picker-heading",
  "the controller-owned guided picker preserves its exact legacy accessible identity");
const guidedChoice = guidedPicker.children[1].children[0];
assert.ok(guidedChoice.listenerCount() > 0, "the continuation picker owns its live choice listener");
guidedPicker.children[2].click();
assert.equal(elements.get("#guided-validation-flow").children.length, 0, "cancelling removes the guided continuation picker");
assert.equal(guidedChoice.listenerCount(), 0, "cancelling disposes the guided continuation choice listener immediately");
guidedContinuation.useDifferent();
elements.get("#guided-validation-flow").children[0].children[1].children[0].click();
assert.deepEqual(restoredGuidedCaptures.at(-1), [guidedCapture.id, undefined],
  "choosing a continuation restores the captured event through the explicit Capture port");
await uiController.openGuidedProperty(guidedCapture, persistenceSchema, "checkout.email");
const declarationTrigger = element();
assert.equal(uiController.openLivePropertyDeclaration(guidedCapture, "checkout.email", declarationTrigger), true);
const declarationDialog = elements.get("#guided-validation-flow").children[0];
const declarationConfirm = declarationDialog.children[3];
declarationConfirm.click();
assert.ok(uiController.schemaDocumentPaths(uiController.schemas().find(({ id }) => id === persistenceSchemaId).workingDraft.document).includes("/checkout/email"),
  "the live declaration commits the observed property into the selected Schema draft");
assert.deepEqual(restoredGuidedCaptures.at(-1), [guidedCapture.id, "checkout.email"],
  "live declaration completion returns through the explicit Capture port");
assert.equal(declarationConfirm.listenerCount(), 0, "closing the live declaration disposes its confirm listener");
const validationRecords = uiController.recheckCaptured([guidedCapture]);
assert.equal(validationRecords.length, 1); assert.equal(elements.get("#schema-validation-record-list").children.length, 1);
assert.equal(elements.get("#schema-validation-record-list").children[0].children[1].disabled, true,
  "ordinary validateEvent results cannot continue without canonical evaluator evidence");
uiController.recordCapturedValidation({ eventId:guidedCapture.id, eventName:"checkout", state:"Valid", checkedAt:"2026-08-25T10:00:00.000Z",
  schemaId:persistenceSchemaId, schemaName:"Page guided", schemaVersion:1, target:"payload", assignmentId:"assignment:checkout",
  assignmentName:"Checkout assignment", assignmentEvidence:"canonical winner", issueCodes:[], evaluated:{ resultIdentity:"evaluation:checkout:1",
    winner:{ schemaId:persistenceSchemaId, schemaRevision:1 }, issueDetails:[] } });
const continuationTrigger = elements.get("#schema-validation-record-list").children[1].children[1];
continuationTrigger.click(); await Promise.resolve();
assert.equal(continuationPreparation.eventId, guidedCapture.id);
let continuationDialog = elements.get("#guided-validation-flow").children[0];
assert.equal(continuationDialog.children[0].textContent, "Continue captured validation in project");
assert.equal(continuationDialog.children[4].children[0].children[0].textContent, "Event validation Test case");
assert.equal(continuationDialog.children[9].textContent, "Create Test case and open in Specification Studio");
continuationDialog.children[10].click();
assert.ok(continuationTrigger.listenerCount() > 0, "cancelling a continuation keeps its existing row action live");
assert.equal(continuationTrigger.focused, true, "cancel restores focus to the continuation row action");
continuationTrigger.focused = false;
continuationTrigger.click(); await Promise.resolve();
continuationDialog = elements.get("#guided-validation-flow").children[0];
const continuationDestination = continuationDialog.children[4].children[0], continuationProfile = continuationDialog.children[8].children[0], continuationConfirm = continuationDialog.children[9];
continuationDestination.value = "profile"; continuationDestination.dispatch("change");
assert.equal(continuationConfirm.textContent, "Add requirements and open Profile"); continuationProfile.value = "profile:checkout"; continuationConfirm.click(); await Promise.resolve();
assert.deepEqual(continuationCommit, { destination:"profile", name:"Checkout captured validation", eventId:"event:checkout", profileId:"profile:checkout" },
  "captured continuation commits the explicitly reviewed project destination");
assert.equal(elements.get("#schema-result").textContent, "Saved evaluated capture evidence in Checkout profile; opening it in Specification Studio.");
assert.equal(continuationTrigger.focused, false, "successful routing does not take the cancel-only trigger-focus path");
assert.equal(continuationConfirm.listenerCount(), 0, "captured continuation completion disposes its dialog listeners");
continuationFailure=new Error("Create or open a Specification Project before continuing captured validation.");continuationTrigger.click();await Promise.resolve();
assert.equal(elements.get("#schema-result").textContent,"Create or open a Specification Project before continuing captured validation.",
  "guarded continuation failure is rendered by the Schema owner without opening stale review UI");continuationFailure=undefined;
uiController.updateDraft({ attachedRules:[...(persistenceSchema.workingDraft?.attachedRules ?? persistenceSchema.attachedRules ?? []),
  { id:"local:email", name:"Email required", version:1, propertyPath:"/checkout/email", operator:"required", enabled:true }] });
assert.equal(uiController.requestLocalRulePromotion("/checkout/email", "local:email"), true);
const promotionCompletion = Promise.resolve(promotionDialogInput.confirm({ action:"create", name:"Reusable email" }));
assert.equal(uiController.rules().some(({ id }) => id === "rule:promoted"), true, "promotion writes its optimistic rule snapshot");
persistenceListener({ type:"saved", schemaId:persistenceSchemaId }); await promotionCompletion;
assert.equal(uiController.schemas().find(({ id }) => id === persistenceSchemaId).workingDraft.attachedRules
  .some(({ id }) => id === "rule:promoted"), true, "durable success retains the promoted replacement");
const guidedResult = (id, path) => ({
  schema:{ id:persistenceSchemaId, name:"Page guided", version:1, pending:true,
    rules:[{ path, expectedType:"String", requirement:"Must be present", values:[], reusableRuleId:id }] },
  reusableRules:[{ id, name:`Guided ${path}`, version:1, requirement:"Must be present", values:[] }],
  assignment:{ id:`assignment:${id}`, name:`Assignment ${id}`, schemaId:persistenceSchemaId, sourceId:"gtm",
    eventName:"checkout", target:"payload", priority:30, versionPolicy:"pinned", enabled:true },
  destination:{ kind:"existing", previousSchemaId:persistenceSchemaId, previousVersion:1,
    assignmentAction:"add the reviewed assignment as a pending change" }, readableRequirement:"Must be present",
});
const retryCompletion = uiController.persistGuidedValidation(guidedResult("rule:guided-retry", "checkout.phone"));
persistenceListener({ type:"failed", schemaId:persistenceSchemaId, error:new Error("offline") });
assert.equal(uiController.rules().some(({ id }) => id === "rule:guided-retry"), false, "guided failure pauses optimistic Rule Library state");
persistenceListener({ type:"retried", schemaId:persistenceSchemaId }); await retryCompletion;
assert.equal(uiController.rules().some(({ id }) => id === "rule:guided-retry"), true, "retry reapplies the reviewed snapshot exactly once");
assert.equal(uiController.guidedState().selectedSchemaPropertyPath, "checkout.email",
  "guided completion restores the exact controller-owned property return");
persistenceListener({ type:"rejected", schemaId:persistenceSchemaId, error:new Error("stale rejection") });
assert.equal(uiController.rules().some(({ id }) => id === "rule:guided-retry"), true, "settled transactions ignore stale durable events");
const rejectedCompletion = uiController.persistGuidedValidation(guidedResult("rule:guided-reject", "checkout.country"));
const observedRejection = rejectedCompletion.then(() => undefined, (error) => error);
persistenceListener({ type:"failed", schemaId:persistenceSchemaId, error:new Error("conflict") });
persistenceListener({ type:"rejected", schemaId:persistenceSchemaId, error:new Error("rejected by operator") });
assert.match(String(await observedRejection), /rejected by operator/);
assert.equal(uiController.rules().some(({ id }) => id === "rule:guided-reject"), false, "rejection restores the pre-transaction libraries");
assert.equal(uiController.openSavedCanonical(persistenceSchemaId), true);
const ownedCanonicalTableHost = elements.get("#schema-editor").querySelector("#compact-canonical-table-editor");
assert.ok(ownedCanonicalTableHost, "Schemas creates the compact canonical table host on demand with the legacy ID");
assert.equal(canonicalTableMounts, 1); assert.equal(canonicalTableOptions.host, ownedCanonicalTableHost);
assert.deepEqual(canonicalTableOptions.conceptSuggestions(), ["Checkout concept"]);
const canonicalBefore = uiController.canonicalDocument();
const canonicalPropertyId = Object.keys(canonicalBefore.nodes)[0];
assert.match(uiController.canonicalFacet(canonicalPropertyId), /Canonical facets/);
assert.equal(uiController.canonicalCommandScope({ kind:"rename", baseRevision:canonicalBefore.revision,
  propertyId:canonicalPropertyId, name:"Renamed canonical property" }), canonicalBefore.nodes[canonicalPropertyId].name);
assert.equal(await uiController.dispatchCanonical({ kind:"rename", baseRevision:canonicalBefore.revision,
  propertyId:canonicalPropertyId, name:"Renamed canonical property" }), true, "canonical commands settle through the Schema durable port");
const canonicalAfter = uiController.canonicalDocument();
const historyIdentity = uiController.beginCanonicalHistory("project:one", "Rename canonical property", canonicalBefore, canonicalAfter);
assert.equal(uiController.pendingCanonicalHistory("project:one", "Rename canonical property").operationId, historyIdentity.operationId);
uiController.completeCanonicalHistory(historyIdentity);
assert.equal(uiController.canonicalState().historyPending, false, "durably acknowledged history becomes available atomically");
canonicalSettlementMode = "reject";
assert.equal(await uiController.dispatchCanonical({ kind:"rename", baseRevision:canonicalAfter.revision,
  propertyId:canonicalPropertyId, name:"Rejected canonical property" }), false);
assert.equal(uiController.canonicalState().pending, true, "a rejected durable settlement preserves the exact command for recovery");
canonicalSettlementMode = "resolve"; uiController.retryCanonical(); await Promise.resolve(); await Promise.resolve();
assert.equal(uiController.canonicalState().pending, false, "Retry rebases only the preserved command onto current canonical state");
const projectedCanonical = uiController.canonicalProjection(); projectedCanonical.name = "Canonical metadata name";
assert.equal(await uiController.persistCanonicalProjection(projectedCanonical, "schema name"), true);
assert.equal(uiController.canonicalProjection().name, "Canonical metadata name", "projection metadata uses the same serialized settlement queue");
assert.equal(await uiController.resumeCanonicalProjection(), true, "an already-settled canonical projection resumes idempotently");
let customCanonical = structuredClone(uiController.canonicalDocument()), undoCount = 0, redoCount = 0, contextActionCount = 0, renderedContextCount = 0;
uiController.openCanonical({ key:"test:canonical-context", label:"Context contract", load:() => customCanonical,
  dispatch:(command) => { if (command.kind === "rename") return { status:"conflict", document:customCanonical, propertyId:command.propertyId, message:"newer draft" };
    if (command.kind === "view") customCanonical = { ...customCanonical, view:command.view }; return { status:"applied", document:customCanonical }; },
  onUndo:() => { undoCount += 1; }, onRedo:() => { redoCount += 1; }, actions:[{ label:"Inspect", run:() => { contextActionCount += 1; } }],
  renderContext:(host) => { renderedContextCount += 1; host.dataset.customContext = "rendered"; } });
let canonicalControls = elements.get("#compact-canonical-context").children;
canonicalControls.find(({ textContent }) => textContent === "Undo").click(); canonicalControls.find(({ textContent }) => textContent === "Redo").click();
canonicalControls.find(({ textContent }) => textContent === "Inspect").click(); canonicalControls.find(({ textContent }) => textContent === "Table").click();
await Promise.resolve();
assert.deepEqual([undoCount, redoCount, contextActionCount, customCanonical.view], [1, 1, 1, "table"],
  "compact context actions and view controls execute through the adapter contract");
assert.ok(renderedContextCount > 0); assert.equal(elements.get("#compact-canonical-context").dataset.customContext, "rendered");
let migrationResolution, migrationCancelled = 0, migrationConfirmed = 0;
const migrationAdapter = { key:"test:canonical-migration", label:"Migration contract", load:() => customCanonical,
  dispatch:() => ({ status:"applied", document:customCanonical }), migration:{ summary:"One legacy facet needs review",
    conflicts:[{ id:"conflict:1", label:"Resolve title type", choices:[{ id:"string", label:"String" }, { id:"number", label:"Number" }] }],
    resolve:(conflict, choice) => { migrationResolution = [conflict, choice]; }, cancel:() => { migrationCancelled += 1; migrationAdapter.migration = undefined; },
    confirm:async () => { migrationConfirmed += 1; migrationAdapter.migration = undefined; } } };
uiController.openCanonical(migrationAdapter);
let migrationReview = elements.get("#compact-canonical-context").children.find((child) => child["aria-label"] === "Canonical schema migration review");
const migrationResolutionControl = migrationReview.children[0]; migrationResolutionControl.value = "number"; migrationResolutionControl.dispatch("change");
assert.deepEqual(migrationResolution, ["conflict:1", "number"], "migration conflict resolution remains controller-owned");
migrationReview.children.at(-2).click(); assert.equal(migrationCancelled, 1); assert.equal(migrationResolutionControl.listenerCount(), 0);
migrationAdapter.migration = { summary:"Migration ready", conflicts:[], resolve() {}, cancel() {},
  confirm:async () => { migrationConfirmed += 1; migrationAdapter.migration = undefined; } };
uiController.openCanonical(migrationAdapter); migrationReview = elements.get("#compact-canonical-context").children.find((child) => child["aria-label"] === "Canonical schema migration review");
const migrationConfirm = migrationReview.children.at(-1); migrationConfirm.click(); await Promise.resolve();
assert.equal(migrationConfirmed, 1); assert.equal(migrationConfirm.listenerCount(), 0, "migration confirmation rerender disposes its controls");
uiController.openCanonical({ key:"test:canonical-context", label:"Context contract", load:() => customCanonical,
  dispatch:(command) => { if (command.kind === "rename") return { status:"conflict", document:customCanonical, propertyId:command.propertyId, message:"newer draft" };
    if (command.kind === "view") customCanonical = { ...customCanonical, view:command.view }; return { status:"applied", document:customCanonical }; } });
assert.equal(await uiController.dispatchCanonical({ kind:"rename", baseRevision:customCanonical.revision,
  propertyId:canonicalPropertyId, name:"Conflicting rename" }), false);
canonicalControls = elements.get("#compact-canonical-context").children;
const compareControl = canonicalControls.find(({ textContent }) => textContent === "Compare latest property"); compareControl.click();
assert.equal(compareControl.listenerCount(), 0, "compact context rerender disposes replaced review controls");
assert.equal(uiController.canonicalState().reviewVisible, true, "Compare exposes the pending command base against the latest revision");
elements.get("#compact-canonical-context").children.find(({ textContent }) => textContent === "Reject local edit").click();
assert.equal(uiController.canonicalState().pending, false, "Reject clears the preserved compact canonical command");
assert.equal(uiController.openSavedCanonical(persistenceSchemaId), true); uiController.openCanonicalPropertyActions(canonicalPropertyId);
assert.equal(uiController.openCanonicalRuleEditor(canonicalPropertyId), true,
  "the saved canonical property resolves into its staged rule editor");
assert.ok(findByText(elements.get("#schema-property-rule-picker"), "Add rule"),
  "the canonical rule editor starts with the staged rule-adder used by the installed schema workspace");
elements.get("#schema-property-rule-picker").dispatch("cancel");
const compactDocumentationControl = elements.get("#compact-canonical-context").children.find(({ textContent }) => textContent === "Save documentation");
assert.ok(compactDocumentationControl?.listenerCount() > 0, "compact property actions are live disposable controls");
assert.equal(await uiController.compactPropertyAction(canonicalPropertyId, "documentation", "Checkout property"), true);
assert.equal(compactDocumentationControl.listenerCount(), 0, "canonical property rerender disposes the replaced action controls");
assert.equal(uiController.canonicalDocument().nodes[canonicalPropertyId].documentation.description, "Checkout property");
assert.equal(await uiController.compactPropertyAction(canonicalPropertyId, "presence", "required"), true);
assert.equal(uiController.canonicalDocument().nodes[canonicalPropertyId].presence.mode, "required");
assert.equal(await uiController.compactPropertyAction(canonicalPropertyId, "custom-example", "sample"), true);
assert.deepEqual(uiController.canonicalDocument().nodes[canonicalPropertyId].documentation.example, { method:"custom", value:"sample" });
assert.equal(await uiController.compactPropertyAction(canonicalPropertyId, "expected", "expected"), true);
assert.equal(await uiController.compactPropertyAction(canonicalPropertyId, "reset-expected"), true);
assert.equal(uiController.canonicalDocument().nodes[canonicalPropertyId].expectedValue, undefined);
assert.deepEqual(uiController.storePromotionRules([{ id:"rule:history", name:"Current", kind:"Required", version:2, enabled:true,
  revisionHistory:[{ id:"rule:history", name:"Previous", kind:"Required", version:1, enabled:false }] }])[0].revisionHistory,
  [{ name:"Previous", kind:"Required", version:1, enabled:false }], "promotion persistence normalizes historical rule snapshots");
const expansionSchema = { id:"schema:expansion", name:"Expansion", version:2, published:true,
  document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[],
  attachedRules:[{ id:"rule:allowed", name:"Known types", version:1, propertyPath:"/page_type", operator:"allowed-values", parameters:"product,content" }],
  workingDraft:{ baseVersion:2, sourceVersion:2, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[],
    attachedRules:[{ id:"rule:allowed", name:"Known types", version:1, propertyPath:"/page_type", operator:"allowed-values", parameters:"product,content" }], pendingChanges:[] } };
uiController.add(expansionSchema);
const expansionEvidence = { propertyPath:"/page_type", status:"warning", message:"Choose a known type", expected:"product,content", actual:"checkout",
  actualValue:"checkout", rule:"Known types", ruleId:"rule:allowed", ruleVersion:1, operator:"allowed-values", severity:"warning",
  schemaId:expansionSchema.id, schemaName:expansionSchema.name, schemaVersion:2 };
const expansionTrigger = element();
assert.equal(uiController.openAllowedValueExpansionReview(guidedCapture.id, expansionSchema.id, expansionEvidence, expansionTrigger), true);
let expansionConfirm = findByText(elements.get("#live-event-inspector"), "Confirm addition"); expansionConfirm.click();
assert.deepEqual(uiController.schemas().find(({ id }) => id === expansionSchema.id).workingDraft.attachedRules[0].allowedValues,
  ["product", "content", "checkout"], "allowed-value expansion persists the exact observed scalar in the Schema-owned working draft");
assert.deepEqual(restoredGuidedCaptures.at(-1), [guidedCapture.id, "/page_type"], "allowed-value completion returns through the Capture port");
assert.equal(expansionConfirm.listenerCount(), 0, "allowed-value confirmation disposes its dialog listeners symmetrically");
uiController.openAllowedValueExpansionReview(guidedCapture.id, expansionSchema.id, expansionEvidence, expansionTrigger);
expansionConfirm = findByText(elements.get("#live-event-inspector"), "Keep existing pending value");
const disposedCompletion = uiController.persistGuidedValidation(guidedResult("rule:guided-dispose", "checkout.postcode"));
const disposedRejection = disposedCompletion.then(() => undefined, (error) => error);
assert.equal(uiController.openSavedCanonical(persistenceSchemaId), true);
canonicalSettlementMode = "defer"; const beforeDisposeCanonical = uiController.canonicalDocument();
const staleCanonicalSettlement = uiController.dispatchCanonical({ kind:"rename", baseRevision:beforeDisposeCanonical.revision,
  propertyId:canonicalPropertyId, name:"Settles after disposal" });
deferHydration = true; const staleHydration = uiController.hydrateActiveProjectForSchemas();
uiController.dispose();
assert.equal(elements.get("#schema-editor").querySelector("#compact-canonical-table-editor"), undefined,
  "Schemas removes its on-demand canonical table host during disposal");
releaseCanonicalSettlement(); await staleCanonicalSettlement;
assert.equal(elements.get("#compact-canonical-context").hidden, true, "a settlement completing after disposal cannot reopen stale canonical UI");
releaseHydration({ name:"Stale Project" }); await staleHydration;
assert.notEqual(elements.get("#schema-result").textContent, "Loaded schema contributors for Stale Project.",
  "a durable hydration settling after disposal cannot render stale project state");
assert.match(String(await disposedRejection), /disposed before durable persistence settled/);
assert.equal(persistenceListener, undefined, "disposal detaches the durable persistence port");
assert.equal(layeredProfileDisposals, 1, "Schemas disposes the layered Profile editor with its owner lifecycle");
assert.equal(guidedChoice.listenerCount(), 0, "disposal removes the guided continuation choice listener");
assert.equal(expansionConfirm.listenerCount(), 0, "disposal removes the open allowed-value dialog listeners");
assert.equal([...elements.values()].reduce((count, item) => count + item.listenerCount(), 0), 0,
  "Schemas removes every editor and revision listener it owns");

{
  const { createDurableSchemaPersistenceCoordination } = await import("../../dist/data-layer-installed/runtime.js");
  let savedListener = () => {};
  let recovery;
  let retried = 0;
  let rejected = 0;
  let downloaded = "";
  const target = new EventTarget();
  const pending = { batch:{ upserts:[{ schema:{ id:"schema:page", name:"Page" } }], deletes:[],
    label:"Save Page in the Saved Schema Library", names:["Page"] }, error:new Error("quota") };
  let failed = pending;
  const coordination = createDurableSchemaPersistenceCoordination({
    runtime:{
      repository:{ subscribeSavedSchemas:(listener) => { savedListener = listener; return () => { savedListener = () => {}; }; } },
      failedSchemaSave:() => failed,
      retryFailedSchemaSave:async () => { retried += 1; failed = undefined;
        savedListener({ schemaId:"schema:page", token:"next", deleted:false }); },
      resolveFailedSchemaSave:async () => { rejected += 1; },
      exportUnsavedSchemas:() => "serialized batch",
    },
    repositoryUi:{ reportSaveFailure:async (input) => { recovery = input; } },
    eventTarget:target,
    origin:() => undefined,
    download:(serialized) => { downloaded = serialized; },
  });
  const persistenceEvents = [];
  coordination.subscribe((event) => persistenceEvents.push(event.type));
  target.dispatchEvent(new CustomEvent("durable-project-save-failed", { detail:{ error:pending.error } }));
  await Promise.resolve();
  assert.deepEqual(persistenceEvents, ["failed"], "a durable schema failure pauses the installed Schema transaction");
  assert.equal(recovery.kind, "saved-schema"); recovery.exportUnsaved();
  assert.equal(downloaded, "serialized batch"); await recovery.retry();
  assert.equal(retried, 1);
  assert.deepEqual(persistenceEvents, ["failed", "saved", "retried"],
    "Retry settles through both durable observation and explicit recovery acknowledgement");
  await recovery.reject(); assert.equal(rejected, 1); assert.equal(persistenceEvents.at(-1), "rejected");
  coordination.dispose();
}
