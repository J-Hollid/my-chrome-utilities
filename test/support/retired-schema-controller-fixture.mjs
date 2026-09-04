import { createSchemasInstalledController } from "../../dist/data-layer-installed/schemas/index.js";

export function createRetiredSchemaControllerFixture() {
const schema = { id:"schema:page", name:"Page", version:1, document:{ type:"object", properties:{ title:{ type:"string" } } },
  assignments:[], published:true };
const parentSchema = { id:"schema:parent", name:"Parent", version:2, document:{ type:"object", properties:{ title:{ type:"string" } } },
  assignments:[], attachedRules:[{ id:"rule:parent", version:1, propertyPath:"/title", enabled:true }], published:true };

let fakeDocument;
function element() {
  const listeners = new Map();
  return { id:"", value:"", textContent:"", hidden:false, disabled:false, open:false, isConnected:true, dataset:{}, style:{ setProperty() {} }, children:[], ownerDocument:fakeDocument, scrollTop:0,
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); },
    dispatch(type, event = {}) { listeners.get(type)?.({ preventDefault() {}, target:this, currentTarget:this, ...event }); },
    click() { this.onclick?.(); this.dispatch("click"); },
    showModal() { this.open = true; }, close() { this.open = false; }, focus(options) { this.focused = true; this.focusOptions = options; },
    setAttribute(name, value) { this[name] = value; }, removeAttribute(name) { delete this[name]; },
    getAttribute(name) { return this[name] ?? null; }, replaceChildren(...children) { this.children = children; },
    cloneNode() { return Object.assign(element(), { id:this.id, isConnected:this.isConnected }); },
    replaceWith(next) { listeners.clear(); this.isConnected = false; next.isConnected = true;
      for (const [selector, current] of elements) if (current === this) elements.set(selector, next); },
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
const selectors = ["#schema-editor", "#schema-detail", "#schema-detail-empty", "#schema-editor-name", "#schema-editor-status",
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
    { id:"rule:quantities", name:"Reusable quantities", kind:"Allowed values", version:3,
      operator:"allowed-values", parameters:"1,2", applicableType:"number", enabled:true },
  ])],
]);
let promotionDialogInput, persistenceListener, promotionRuleSequence = 0;
const schemaDownloads = [];
const relationshipActions = [];
let deferHydration = false, releaseHydration, projectContributorsAvailable = false;
let closeSpecification;
const restoredGuidedCaptures = [];
let canonicalSettlementMode = "resolve", releaseCanonicalSettlement;
let layeredProfileMounts = 0, layeredProfileDisposals = 0;
let liveRevalidations = 0, continuationPreparation, continuationCommit, continuationFailure;
let publicationFeedbackRetainedAfterRelationshipTreeRerender = false;
let durableAcknowledgementReleasedPolicyPresentation = false;
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
    }))] }, ...(projectContributorsAvailable ? [{ key:"project:one", name:"Project One", kind:"branch", role:"Structural ancestor",
      relationshipPath:"Project One", children:[{ key:"page:checkout", name:"Checkout", kind:"contributor", role:"Page", category:"Pages",
        targetKey:"pages:checkout", relationshipPath:"Pages / Checkout", children:[] }] }] : [])] }),
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
    ? new Promise((resolve)=>{ releaseHydration=(value)=>{ projectContributorsAvailable=true;resolve(value); }; })
    : (projectContributorsAvailable=true,Promise.resolve({ name:"Project One" })),
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
  return {
    element, elements, fakeDocument, findByText, relationshipActions, schema, parentSchema,
    schemaDownloads, schemaMasterPanel, schemaMasterTab, schemaRulesPanel, schemaRulesTab,
    uiController, uiValues,
    get closeSpecification() { return closeSpecification; },
    get layeredProfileMounts() { return layeredProfileMounts; },
    get layeredProfileDisposals() { return layeredProfileDisposals; },
    get liveRevalidations() { return liveRevalidations; },
    get continuationCommit() { return continuationCommit; },
    get continuationPreparation() { return continuationPreparation; },
    get canonicalTableMounts() { return canonicalTableMounts; },
    get canonicalTableOptions() { return canonicalTableOptions; },
    get canonicalTableRenders() { return canonicalTableRenders; },
    set canonicalSettlementMode(value) { canonicalSettlementMode = value; },
    get releaseCanonicalSettlement() { return releaseCanonicalSettlement; },
    set deferHydration(value) { deferHydration = value; },
    get releaseHydration() { return releaseHydration; },
    set durableAcknowledgementReleasedPolicyPresentation(value) {
      durableAcknowledgementReleasedPolicyPresentation = value;
    },
    get durableAcknowledgementReleasedPolicyPresentation() {
      return durableAcknowledgementReleasedPolicyPresentation;
    },
    set continuationFailure(value) { continuationFailure = value; },
    get persistenceListener() { return persistenceListener; },
    get promotionDialogInput() { return promotionDialogInput; },
    set promotionRuleSequence(value) { promotionRuleSequence = value; },
    get restoredGuidedCaptures() { return restoredGuidedCaptures; },
    get publicationFeedbackRetainedAfterRelationshipTreeRerender() {
      return publicationFeedbackRetainedAfterRelationshipTreeRerender;
    },
    set publicationFeedbackRetainedAfterRelationshipTreeRerender(value) {
      publicationFeedbackRetainedAfterRelationshipTreeRerender = value;
    },
    get schemaStorageWrites() { return schemaStorageWrites; },
  };
}
