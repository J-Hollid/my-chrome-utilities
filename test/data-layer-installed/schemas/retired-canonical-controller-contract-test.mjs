import assert from "node:assert/strict";
import { fixture, persistenceSchemaId } from "./retired-guided-controller-contract-test.mjs";

const { elements, findByText, uiController } = fixture;

// retired-schema-assertion: canonical-edit-history-settlement-overlay-001
assert.equal(uiController.openSavedCanonical(persistenceSchemaId), true);
const ownedCanonicalTableHost = elements.get("#schema-editor").querySelector("#compact-canonical-table-editor");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-002
assert.ok(ownedCanonicalTableHost, "Schemas creates the compact canonical table host on demand with the legacy ID");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-003
assert.equal(fixture.canonicalTableMounts, 1);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-004
assert.equal(fixture.canonicalTableOptions.host, ownedCanonicalTableHost);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-005
assert.deepEqual(fixture.canonicalTableOptions.conceptSuggestions(), ["Checkout concept"]);
fixture.canonicalSettlementMode = "defer";
elements.get("#schema-only-declared-properties").checked = true;
elements.get("#schema-only-declared-properties").dispatch("change");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-006
assert.equal(uiController.canonicalState().settlementPending, true,
  "a saved-schema policy edit remains busy until its durable acknowledgement");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-007
assert.equal(elements.get("#schema-editor")["aria-busy"], "true",
  "the installed editor exposes the pending settlement synchronously instead of relying on its duration");
fixture.persistenceListener({ type:"saved", schemaId:persistenceSchemaId });
fixture.durableAcknowledgementReleasedPolicyPresentation = !uiController.canonicalState().settlementPending;
// retired-schema-assertion: canonical-edit-history-settlement-overlay-008
assert.equal(fixture.durableAcknowledgementReleasedPolicyPresentation, true,
  "the matching saved acknowledgement releases policy presentation before the broader queue drains");
fixture.releaseCanonicalSettlement(); await Promise.resolve(); fixture.canonicalSettlementMode = "resolve";
const canonicalBefore = uiController.canonicalDocument();
const canonicalPropertyId = Object.keys(canonicalBefore.nodes)[0];
// retired-schema-assertion: canonical-edit-history-settlement-overlay-009
assert.match(uiController.canonicalFacet(canonicalPropertyId), /Canonical facets/);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-010
assert.equal(uiController.canonicalCommandScope({ kind:"rename", baseRevision:canonicalBefore.revision,
  propertyId:canonicalPropertyId, name:"Renamed canonical property" }), canonicalBefore.nodes[canonicalPropertyId].name);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-011
assert.equal(await uiController.dispatchCanonical({ kind:"rename", baseRevision:canonicalBefore.revision,
  propertyId:canonicalPropertyId, name:"Renamed canonical property" }), true, "canonical commands settle through the Schema durable port");
const canonicalAfter = uiController.canonicalDocument();
const historyIdentity = uiController.beginCanonicalHistory("project:one", "Rename canonical property", canonicalBefore, canonicalAfter);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-012
assert.equal(uiController.pendingCanonicalHistory("project:one", "Rename canonical property").operationId, historyIdentity.operationId);
uiController.completeCanonicalHistory(historyIdentity);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-013
assert.equal(uiController.canonicalState().historyPending, false, "durably acknowledged history becomes available atomically");
fixture.canonicalSettlementMode = "reject";
// retired-schema-assertion: canonical-edit-history-settlement-overlay-014
assert.equal(await uiController.dispatchCanonical({ kind:"rename", baseRevision:canonicalAfter.revision,
  propertyId:canonicalPropertyId, name:"Rejected canonical property" }), false);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-015
assert.equal(uiController.canonicalState().pending, true, "a rejected durable settlement preserves the exact command for recovery");
fixture.canonicalSettlementMode = "resolve"; uiController.retryCanonical(); await Promise.resolve(); await Promise.resolve();
// retired-schema-assertion: canonical-edit-history-settlement-overlay-016
assert.equal(uiController.canonicalState().pending, false, "Retry rebases only the preserved command onto current canonical state");
const projectedCanonical = uiController.canonicalProjection(); projectedCanonical.name = "Canonical metadata name";
// retired-schema-assertion: canonical-edit-history-settlement-overlay-017
assert.equal(await uiController.persistCanonicalProjection(projectedCanonical, "schema name"), true);
const canonicalProjectionSettlementReady = !elements.get("#save-schema").disabled;
// retired-schema-assertion: canonical-edit-history-settlement-overlay-018
assert.equal(canonicalProjectionSettlementReady, true,
  "settling a canonical projection refreshes publication readiness in the installed schema editor");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-019
assert.equal(uiController.canonicalProjection().name, "Canonical metadata name", "projection metadata uses the same serialized settlement queue");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-020
assert.equal(await uiController.resumeCanonicalProjection(), true, "an already-settled canonical projection resumes idempotently");
let customCanonical = structuredClone(uiController.canonicalDocument()), undoCount = 0, redoCount = 0, contextActionCount = 0, renderedContextCount = 0;
uiController.openCanonical({ key:"test:canonical-context", label:"Context contract", load:() => customCanonical,
  dispatch:(command) => { if (command.kind === "rename") return { status:"conflict", document:customCanonical, propertyId:command.propertyId, message:"newer draft" };
    if (command.kind === "view") customCanonical = { ...customCanonical, view:command.view }; return { status:"applied", document:customCanonical }; },
  onUndo:() => { undoCount += 1; return "No page-scoped canonical command is available to Undo."; },
  onRedo:() => { redoCount += 1; }, actions:[{ label:"Inspect", run:() => { contextActionCount += 1; } }],
  renderContext:(host) => { renderedContextCount += 1; host.dataset.customContext = "rendered"; } });
// retired-schema-assertion: canonical-edit-history-settlement-overlay-021
assert.match(elements.get("#schema-editor-status").textContent, /Context contract · Schema revision 0/u,
  "an installed contributor presents its canonical revision instead of the unrelated Saved Schema draft status alone");
let canonicalControls = elements.get("#compact-canonical-context").children;
canonicalControls.find(({ textContent }) => textContent === "Undo").click(); canonicalControls.find(({ textContent }) => textContent === "Redo").click();
canonicalControls.find(({ textContent }) => textContent === "Inspect").click(); canonicalControls.find(({ textContent }) => textContent === "Table").click();
await Promise.resolve();
// retired-schema-assertion: canonical-edit-history-settlement-overlay-022
assert.deepEqual([undoCount, redoCount, contextActionCount, customCanonical.view], [1, 1, 1, "table"],
  "compact context actions and view controls execute through the adapter contract");
const emptyHistoryFeedbackPresented = elements.get("#compact-canonical-context").children.some(({ textContent }) =>
  textContent === "No page-scoped canonical command is available to Undo.");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-023
assert.equal(emptyHistoryFeedbackPresented, true,
"the installed compact context presents an empty durable-history outcome instead of discarding it");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-024
assert.equal(elements.get("#compact-canonical-context").children.some((child) =>
  child["aria-label"] === "Compact canonical command result"), true,
"the installed compact context exposes command feedback through its accessible result boundary");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-025
assert.ok(renderedContextCount > 0);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-026
assert.equal(elements.get("#compact-canonical-context").dataset.customContext, "rendered");
let migrationResolution, migrationCancelled = 0, migrationConfirmed = 0;
const migrationAdapter = { key:"test:canonical-migration", label:"Migration contract", load:() => customCanonical,
  dispatch:() => ({ status:"applied", document:customCanonical }), migration:{ summary:"One legacy facet needs review",
    conflicts:[{ id:"conflict:1", label:"Resolve title type", choices:[{ id:"string", label:"String" }, { id:"number", label:"Number" }] }],
    resolve:(conflict, choice) => { migrationResolution = [conflict, choice]; }, cancel:() => { migrationCancelled += 1; migrationAdapter.migration = undefined; },
    confirm:async () => { migrationConfirmed += 1; migrationAdapter.migration = undefined; } } };
uiController.openCanonical(migrationAdapter);
let migrationReview = elements.get("#compact-canonical-context").children.find((child) => child["aria-label"] === "Canonical schema migration review");
const migrationResolutionControl = migrationReview.children[0]; migrationResolutionControl.value = "number"; migrationResolutionControl.dispatch("change");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-027
assert.deepEqual(migrationResolution, ["conflict:1", "number"], "migration conflict resolution remains controller-owned");
migrationReview.children.at(-2).click();
// retired-schema-assertion: canonical-edit-history-settlement-overlay-028
assert.equal(migrationCancelled, 1);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-029
assert.equal(migrationResolutionControl.listenerCount(), 0);
migrationAdapter.migration = { summary:"Migration ready", conflicts:[], resolve() {}, cancel() {},
  confirm:async () => { migrationConfirmed += 1; migrationAdapter.migration = undefined; } };
uiController.openCanonical(migrationAdapter); migrationReview = elements.get("#compact-canonical-context").children.find((child) => child["aria-label"] === "Canonical schema migration review");
const migrationConfirm = migrationReview.children.at(-1); migrationConfirm.click(); await Promise.resolve();
// retired-schema-assertion: canonical-edit-history-settlement-overlay-030
assert.equal(migrationConfirmed, 1);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-031
assert.equal(migrationConfirm.listenerCount(), 0, "migration confirmation rerender disposes its controls");
uiController.openCanonical({ key:"test:canonical-context", label:"Context contract", load:() => customCanonical,
  dispatch:(command) => { if (command.kind === "rename") return { status:"conflict", document:customCanonical, propertyId:command.propertyId, message:"newer draft" };
    if (command.kind === "view") customCanonical = { ...customCanonical, view:command.view }; return { status:"applied", document:customCanonical }; } });
// retired-schema-assertion: canonical-edit-history-settlement-overlay-032
assert.equal(await uiController.dispatchCanonical({ kind:"rename", baseRevision:customCanonical.revision,
  propertyId:canonicalPropertyId, name:"Conflicting rename" }), false);
canonicalControls = elements.get("#compact-canonical-context").children;
const compareControl = canonicalControls.find(({ textContent }) => textContent === "Compare latest property"); compareControl.click();
// retired-schema-assertion: canonical-edit-history-settlement-overlay-033
assert.equal(compareControl.listenerCount(), 0, "compact context rerender disposes replaced review controls");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-034
assert.equal(uiController.canonicalState().reviewVisible, true, "Compare exposes the pending command base against the latest revision");
elements.get("#compact-canonical-context").children.find(({ textContent }) => textContent === "Reject local edit").click();
// retired-schema-assertion: canonical-edit-history-settlement-overlay-035
assert.equal(uiController.canonicalState().pending, false, "Reject clears the preserved compact canonical command");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-036
assert.equal(uiController.openSavedCanonical(persistenceSchemaId), true); uiController.openCanonicalPropertyActions(canonicalPropertyId);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-037
assert.equal(uiController.openCanonicalRuleEditor(canonicalPropertyId), true,
  "the saved canonical property resolves into its staged rule editor");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-038
assert.ok(findByText(elements.get("#schema-property-rule-picker"), "Add rule"),
  "the canonical rule editor starts with the staged rule-adder used by the installed schema workspace");
elements.get("#schema-property-rule-picker").dispatch("cancel");
const compactDocumentationControl = elements.get("#compact-canonical-context").children.find(({ textContent }) => textContent === "Save documentation");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-039
assert.ok(compactDocumentationControl?.listenerCount() > 0, "compact property actions are live disposable controls");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-040
assert.equal(await uiController.compactPropertyAction(canonicalPropertyId, "documentation", "Checkout property"), true);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-041
assert.equal(compactDocumentationControl.listenerCount(), 0, "canonical property rerender disposes the replaced action controls");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-042
assert.equal(uiController.canonicalDocument().nodes[canonicalPropertyId].documentation.description, "Checkout property");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-043
assert.equal(await uiController.compactPropertyAction(canonicalPropertyId, "presence", "required"), true);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-044
assert.equal(uiController.canonicalDocument().nodes[canonicalPropertyId].presence.mode, "required");
// retired-schema-assertion: canonical-edit-history-settlement-overlay-045
assert.equal(await uiController.compactPropertyAction(canonicalPropertyId, "custom-example", "sample"), true);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-046
assert.deepEqual(uiController.canonicalDocument().nodes[canonicalPropertyId].documentation.example, { method:"custom", value:"sample" });
// retired-schema-assertion: canonical-edit-history-settlement-overlay-047
assert.equal(await uiController.compactPropertyAction(canonicalPropertyId, "expected", "expected"), true);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-048
assert.equal(await uiController.compactPropertyAction(canonicalPropertyId, "reset-expected"), true);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-049
assert.equal(uiController.canonicalDocument().nodes[canonicalPropertyId].expectedValue, undefined);
// retired-schema-assertion: canonical-edit-history-settlement-overlay-050
assert.deepEqual(uiController.storePromotionRules([{ id:"rule:history", name:"Current", kind:"Required", version:2, enabled:true,
  revisionHistory:[{ id:"rule:history", name:"Previous", kind:"Required", version:1, enabled:false }] }])[0].revisionHistory,
  [{ name:"Previous", kind:"Required", version:1, enabled:false }], "promotion persistence normalizes historical rule snapshots");
const expansionSchema = { id:"schema:expansion", name:"Expansion", version:2, published:true,
  document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[],
  attachedRules:[{ id:"rule:allowed", name:"Known types", version:1, propertyPath:"/page_type", operator:"allowed-values", parameters:"product,content" }],
  workingDraft:{ baseVersion:2, sourceVersion:2, document:{ type:"object", properties:{ page_type:{ type:"string" } } }, assignments:[],
    attachedRules:[{ id:"rule:allowed", name:"Known types", version:1, propertyPath:"/page_type", operator:"allowed-values", parameters:"product,content" }], pendingChanges:[] } };

export { canonicalPropertyId, expansionSchema, fixture, persistenceSchemaId };
