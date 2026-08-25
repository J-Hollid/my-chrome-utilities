import assert from "node:assert/strict";
const { createSchemasInstalledController } = await import("../../dist/data-layer-installed/schemas/index.js");
const schema = { id:"schema:page", name:"Page", version:1, document:{ type:"object", properties:{ title:{ type:"string" } } },
  assignments:[], published:true };
const parentSchema = { id:"schema:parent", name:"Parent", version:2, document:{ type:"object", properties:{ title:{ type:"string" } } },
  assignments:[], attachedRules:[{ id:"rule:parent", version:1, propertyPath:"/title", enabled:true }], published:true };
const values = new Map([["my-chrome-utilities.schema-library.v1", JSON.stringify([schema])]]);
let changed = 0, guided;
const controller = createSchemasInstalledController({
  root:{ querySelector:() => null, querySelectorAll:() => [] },
  storage:{ getItem:(key) => values.get(key) ?? null, setItem:(key, value) => values.set(key, value), removeItem:(key) => values.delete(key) },
  relationshipViewStorage:{ getItem:()=>null, setItem() {} },
  changed:() => { changed += 1; }, runGuidedValidation:async (id) => { guided = id; },
  subscribe:() => () => {}, specificIndexSelected() {}, rulePickerChanged() {}, createRuleId:() => "rule:first",
  capturedAssignmentValue:() => undefined, renderAssignmentConditions() {},
  localRulePromotionDialog:{ open() {}, close() {} }, subscribeSchemaPersistence:() => () => {},
  downloadSchema() {},
  relationshipTree:()=>({ projectId:"no-project", nodes:[] }), openProjectLibrary() {}, openContributor() {},
  openContributorInStudio() {}, adoptSavedSchema() {}, renderSchemaSpecification() {}, reportMissingSchemaEvent() {},
  scheduleFrame:(callback)=>callback(),
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
await controller.runGuidedValidation(); assert.equal(guided, "schema:page");
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
    showModal() { this.open = true; }, close() { this.open = false; }, focus() { this.focused = true; },
    setAttribute(name, value) { this[name] = value; }, removeAttribute(name) { delete this[name]; },
    getAttribute(name) { return this[name] ?? null; }, replaceChildren(...children) { this.children = children; },
    append(...children) { this.children.push(...children); }, prepend(...children) { this.children.unshift(...children); },
    insertBefore(child) { this.children.push(child); }, before() {}, after() {}, contains() { return false; }, closest() { return null; },
    querySelectorAll() { return this.children.flatMap((child) => child.children?.[0] ? [child.children[0]] : []); },
    listenerCount:() => listeners.size,
  };
}
fakeDocument = { createElement:() => element(), body:element() };
const selectors = ["#schema-editor", "#schema-detail", "#schema-detail-empty", "#schema-editor-name",
  "#schema-search", "#schema-category-filter", "#schema-count", "#schema-list", "#schema-empty-state", "#schema-result",
  "#workspace-panel-data-layer", "#data-layer-panel-schemas",
  "#schema-editor-parent", "#schema-only-declared-properties", "#schema-inheritance-provenance",
  "#schema-rule-overrides", "#schema-rule-override-list", "#schema-inherited-rule-groups", "#schema-effective-rule-preview",
  "#schema-specification-builder", "#build-specification", "#build-historical-specification",
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
  "#confirm-schema-rule-revision", "#cancel-schema-rule-revision", "#schema-rule-sync-review",
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
elements.set("#side-panel-layered-profile-editor", element()); elements.set("#live-event-query", element());
const schemaMasterTab = Object.assign(element(), { textContent:"Schemas", dataset:{ schemaSubview:"schema-master" } });
const schemaRulesTab = Object.assign(element(), { textContent:"Rules", dataset:{ schemaSubview:"schema-rule-library" } });
const schemaMasterPanel = Object.assign(element(), { id:"schema-master" });
const schemaRulesPanel = Object.assign(element(), { id:"schema-rule-library" });
const uiValues = new Map([
  ["my-chrome-utilities.schema-library.v1", JSON.stringify([schema, parentSchema])],
  ["my-chrome-utilities.schema-rule-library.v1", JSON.stringify([
    { id:"rule:retired", name:"Retired rule", kind:"Required", version:1, enabled:true, attachments:[] },
  ])],
]);
let selectedSpecificIndex;
const rulePickerChanges = [];
let promotionDialogInput, persistenceListener, promotionRuleSequence = 0;
const schemaDownloads = [];
const relationshipActions = [];
let deferHydration = false, releaseHydration;
let closeSpecification;
const uiController = createSchemasInstalledController({
  root:{ ownerDocument:fakeDocument, querySelector:(selector) => elements.get(selector) ?? null,
    querySelectorAll:(selector) => selector.includes("role=tab") ? [schemaMasterTab, schemaRulesTab] : [schemaMasterPanel, schemaRulesPanel] },
  storage:{ getItem:(key) => uiValues.get(key) ?? null, setItem:(key, value) => uiValues.set(key, value), removeItem:(key) => uiValues.delete(key) },
  relationshipViewStorage:{ getItem:(key) => uiValues.get(`view:${key}`) ?? null, setItem:(key, value) => uiValues.set(`view:${key}`, value) },
  changed() {}, runGuidedValidation:async () => {}, subscribe:() => () => {},
  specificIndexSelected:(path) => { selectedSpecificIndex = path; },
  rulePickerChanged:(path, open) => rulePickerChanges.push(`${path}:${open}`),
  createRuleId:() => promotionRuleSequence++ === 0 ? "rule:checkout" : "rule:promoted",
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
  activeProjectId:()=>"project:one", ensureProjectSchemaContributors:()=>deferHydration
    ? new Promise((resolve)=>{ releaseHydration=resolve; }) : Promise.resolve({ name:"Project One" }),
});
uiController.mount();
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
elements.get("#schema-revision-selector").value = "1"; elements.get("#build-historical-specification").click();
assert.equal(relationshipActions.at(-1), "build:schema:page:historical:1"); closeSpecification();
elements.get("#schema-revision-selector").value = "1"; elements.get("#duplicate-schema-revision").click();
assert.equal(uiController.schemas().length, 3, "revision duplication remains schema-controller behavior");
assert.equal(elements.get("#schema-property-result-status").textContent, "1 of 1 properties");
elements.get("#schema-property-filter").value = "missing"; elements.get("#schema-property-filter").dispatch("input");
assert.equal(elements.get("#schema-property-empty").hidden, false);
assert.equal(elements.get("#schema-property-empty-message").textContent, "No properties match missing");
elements.get("#clear-schema-property-filter").click();
assert.equal(elements.get("#schema-property-filter").value, "");
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
assert.equal(selectedSpecificIndex, "items.2");
uiController.openManualProperty();
elements.get("#schema-manual-property-path").value = "checkout.total";
elements.get("#schema-manual-property-type").value = "number";
elements.get("#schema-manual-property-path").dispatch("input");
assert.match(elements.get("#schema-manual-property-preview").textContent, /checkout.total is number/);
elements.get("#schema-manual-property-form").dispatch("submit");
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId)
  .workingDraft.document.properties.checkout.properties.total.type, "number");
uiController.openManualProperty("/items/*");
elements.get("#schema-manual-property-child-name").value = "sku";
elements.get("#schema-manual-property-type").value = "string";
elements.get("#schema-manual-property-child-name").dispatch("input");
elements.get("#schema-manual-property-form").dispatch("submit");
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId)
  .workingDraft.document.properties.items.items.properties.sku.type, "string");
uiController.openRulePicker("items.*.sku");
assert.equal(elements.get("#schema-property-rule-picker").open, true);
assert.equal(uiController.rulePickerState().configuration.propertyType, "string");
elements.get("#schema-property-rule-picker").dispatch("cancel");
assert.deepEqual(rulePickerChanges, ["items.*.sku:true", "items.*.sku:false"]);
uiController.publish();
elements.get("#create-schema-rule").click();
elements.get("#schema-rule-name").value = "Checkout required";
elements.get("#schema-rule-types").value = "string"; elements.get("#schema-rule-operator").value = "required";
elements.get("#schema-rule-severity").value = "error"; elements.get("#schema-rule-message").value = "Checkout is required";
elements.get("#schema-rule-attachments").selectedOptions = [{ value:uiController.state().activeSchemaId }];
elements.get("#save-schema-rule").click();
assert.equal(uiController.rules().find(({ id }) => id === "rule:checkout").name, "Checkout required");
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId)
  .attachedRules.some(({ id }) => id === "rule:checkout"), true);
elements.get("#schema-rule-search").value = "checkout"; elements.get("#schema-rule-search").dispatch("input");
assert.match(elements.get("#schema-rule-list").textContent, /Checkout required/);
assert.equal(uiController.requestRuleRevision("rule:checkout", { name:"Checkout present", message:"Checkout must be present" }), true);
assert.equal(elements.get("#schema-rule-revision-review").open, true);
elements.get("#cancel-schema-rule-revision").click();
assert.equal(uiController.rules().find(({ id }) => id === "rule:checkout").version, 1, "cancel leaves a rule revision untouched");
uiController.requestRuleRevision("rule:checkout", { name:"Checkout present", message:"Checkout must be present" });
elements.get("#confirm-schema-rule-revision").click();
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
elements.get("#confirm-schema-rule-revision").click();
uiController.requestRuleUpgrade("rule:checkout", [uiController.state().activeSchemaId]);
assert.equal(elements.get("#schema-rule-upgrade-review").open, true);
elements.get("#confirm-schema-rule-upgrade").click();
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId)
  .attachedRules.find(({ id }) => id === "rule:checkout").version, 3, "upgrade changes the selected pinned attachment without publishing");
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
elements.get("#schema-export-choices").children[2].click();
assert.deepEqual(schemaDownloads, [], "cancelled export produces no download");
uiController.openExportChoices(); elements.get("#schema-export-choices").children[1].click();
assert.equal(elements.get("#schema-export-compatibility-review").open, true);
elements.get("#schema-export-compatibility-review").children[1].click();
assert.match(schemaDownloads[0], /schema.*\.json/, "confirmed standard export crosses the typed download port");
const persistenceSchemaId = uiController.state().activeSchemaId;
const persistenceSchema = uiController.schemas().find(({ id }) => id === persistenceSchemaId);
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
persistenceListener({ type:"rejected", schemaId:persistenceSchemaId, error:new Error("stale rejection") });
assert.equal(uiController.rules().some(({ id }) => id === "rule:guided-retry"), true, "settled transactions ignore stale durable events");
const rejectedCompletion = uiController.persistGuidedValidation(guidedResult("rule:guided-reject", "checkout.country"));
const observedRejection = rejectedCompletion.then(() => undefined, (error) => error);
persistenceListener({ type:"failed", schemaId:persistenceSchemaId, error:new Error("conflict") });
persistenceListener({ type:"rejected", schemaId:persistenceSchemaId, error:new Error("rejected by operator") });
assert.match(String(await observedRejection), /rejected by operator/);
assert.equal(uiController.rules().some(({ id }) => id === "rule:guided-reject"), false, "rejection restores the pre-transaction libraries");
const disposedCompletion = uiController.persistGuidedValidation(guidedResult("rule:guided-dispose", "checkout.postcode"));
const disposedRejection = disposedCompletion.then(() => undefined, (error) => error);
deferHydration = true; const staleHydration = uiController.hydrateActiveProjectForSchemas();
uiController.dispose();
releaseHydration({ name:"Stale Project" }); await staleHydration;
assert.notEqual(elements.get("#schema-result").textContent, "Loaded schema contributors for Stale Project.",
  "a durable hydration settling after disposal cannot render stale project state");
assert.match(String(await disposedRejection), /disposed before durable persistence settled/);
assert.equal(persistenceListener, undefined, "disposal detaches the durable persistence port");
assert.equal([...elements.values()].reduce((count, item) => count + item.listenerCount(), 0), 0,
  "Schemas removes every editor and revision listener it owns");
