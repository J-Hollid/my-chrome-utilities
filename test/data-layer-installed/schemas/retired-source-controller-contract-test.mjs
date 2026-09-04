import assert from "node:assert/strict";
import { fixture } from "./retired-installed-controller-contract-test.mjs";

const { elements, relationshipActions, uiController, uiValues } = fixture;

uiController.open("schema:page"); uiController.beginDraft();
const sourceLibraryBefore = uiController.schemas();
const sourceStorageBefore = uiValues.get("my-chrome-utilities.schema-library.v1");
const richSourceSchema = uiController.openSchemaFromSource({ name:"Checkout", sourceId:"gtm", eventName:"checkout",
  payload:{ total:12, coupon:"SAVE" }, label:"Library template" });
// retired-schema-assertion: source-drafts-revision-publication-close-001
assert.deepEqual(richSourceSchema.assignments, [{ sourceId:"gtm", eventName:"checkout", target:"payload" }]);
// retired-schema-assertion: source-drafts-revision-publication-close-002
assert.deepEqual(richSourceSchema.workingDraft.assignments, [{ sourceId:"gtm", eventName:"checkout", target:"payload" }]);
// retired-schema-assertion: source-drafts-revision-publication-close-003
assert.equal(uiController.guidedState().selectedSchemaPropertyPath, "total");
// retired-schema-assertion: source-drafts-revision-publication-close-004
assert.equal(elements.get("#schema-result").textContent, "Library template fields loaded into a new schema draft.");
// retired-schema-assertion: source-drafts-revision-publication-close-005
assert.equal(elements.get("#schema-editor-name").focused, true);
// retired-schema-assertion: source-drafts-revision-publication-close-006
assert.equal(relationshipActions.at(-1), "view:Schemas");
// retired-schema-assertion: source-drafts-revision-publication-close-007
assert.deepEqual(elements.get("#schema-property-tree").children.map(({ dataset }) => dataset.schemaPropertyCanonicalPath),
  ["/total", "/coupon"], "source-created properties retain the canonical property-row browser contract");
// retired-schema-assertion: source-drafts-revision-publication-close-008
assert.deepEqual(elements.get("#schema-property-tree").children.map(({ children }) => children[0].textContent),
  ["total", "coupon"], "source-created property rows expose their canonical labels as headings");
elements.get("#schema-editor-target").value = "raw input"; elements.get("#schema-editor-target").dispatch("input");
// retired-schema-assertion: source-drafts-revision-publication-close-009
assert.equal(uiController.state().transientDraft.workingDraft.assignments[0].target, "raw input",
  "schema target input updates the transient draft through the exact installed event type");
elements.get("#schema-editor-target").value = "payload"; elements.get("#schema-editor-target").dispatch("input");
// retired-schema-assertion: source-drafts-revision-publication-close-010
assert.deepEqual(uiController.schemas(), sourceLibraryBefore, "opening a source does not append transient editor state to the Schema Library");
// retired-schema-assertion: source-drafts-revision-publication-close-011
assert.equal(uiValues.get("my-chrome-utilities.schema-library.v1"), sourceStorageBefore,
  "opening a source performs no premature Schema Library storage write");
const primitiveSourceSchema = uiController.openSchemaFromSource({ name:"Consent", sourceId:"page", eventName:"consent",
  payload:true, label:"Captured event" });
// retired-schema-assertion: source-drafts-revision-publication-close-012
assert.equal(primitiveSourceSchema.workingDraft.document.type, "object");
// retired-schema-assertion: source-drafts-revision-publication-close-013
assert.equal(primitiveSourceSchema.workingDraft.document.properties.value.type, "boolean",
  "primitive source payloads remain editable through the legacy value wrapper");
// retired-schema-assertion: source-drafts-revision-publication-close-014
assert.deepEqual(primitiveSourceSchema.workingDraft.assignments, [{ sourceId:"page", eventName:"consent", target:"payload" }]);
// retired-schema-assertion: source-drafts-revision-publication-close-015
assert.equal(uiController.guidedState().selectedSchemaPropertyPath, "value");
const arraySourceSchema = uiController.openSchemaFromSource({ name:"Products", sourceId:"gtm", eventName:"products",
  payload:[{ sku:"A", quantity:2 }], label:"Captured event" });
// retired-schema-assertion: source-drafts-revision-publication-close-016
assert.equal(arraySourceSchema.workingDraft.document.properties.value.type, "array");
// retired-schema-assertion: source-drafts-revision-publication-close-017
assert.equal(arraySourceSchema.workingDraft.document.properties.value.items.type, "object");
// retired-schema-assertion: source-drafts-revision-publication-close-018
assert.equal(arraySourceSchema.workingDraft.document.properties.value.items.properties.quantity.type, "number",
  "array source inference recursively preserves the first item schema");
const emptyArraySchema = uiController.openSchemaFromSource({ name:"Empty products", sourceId:"gtm", eventName:"products",
  payload:[], label:"Captured event" });
// retired-schema-assertion: source-drafts-revision-publication-close-019
assert.deepEqual(emptyArraySchema.workingDraft.document.properties.value, { type:"array", items:{} },
  "empty arrays retain an explicit empty item schema");
// retired-schema-assertion: source-drafts-revision-publication-close-020
assert.deepEqual(uiController.schemas(), sourceLibraryBefore);
// retired-schema-assertion: source-drafts-revision-publication-close-021
assert.equal(uiValues.get("my-chrome-utilities.schema-library.v1"), sourceStorageBefore);
elements.get("#save-schema").click();
// retired-schema-assertion: source-drafts-revision-publication-close-022
assert.equal(elements.get("#schema-revision-review").open, true, "a transient Source draft reaches the publication review");
elements.get("#cancel-schema-revision").click();
// retired-schema-assertion: source-drafts-revision-publication-close-023
assert.deepEqual(uiController.schemas(), sourceLibraryBefore);
// retired-schema-assertion: source-drafts-revision-publication-close-024
assert.equal(uiValues.get("my-chrome-utilities.schema-library.v1"), sourceStorageBefore,
  "canceling Source publication leaves both the library and storage unchanged");
elements.get("#discard-schema-draft").click();
// retired-schema-assertion: source-drafts-revision-publication-close-025
assert.deepEqual(uiController.schemas(), sourceLibraryBefore);
// retired-schema-assertion: source-drafts-revision-publication-close-026
assert.equal(uiValues.get("my-chrome-utilities.schema-library.v1"), sourceStorageBefore,
  "discarding a transient Source draft leaves no stored schema behind");
uiController.openSchemaFromSource({ name:"Checkout", sourceId:"gtm", eventName:"checkout",
  payload:{ total:12, coupon:"SAVE" }, label:"Library template" });
elements.get("#save-schema").click(); const sourceWritesBeforePublish = fixture.schemaStorageWrites; elements.get("#confirm-schema-revision").click();
// retired-schema-assertion: source-drafts-revision-publication-close-027
assert.equal(uiController.schemas().length, sourceLibraryBefore.length + 1, "confirming Source publication appends exactly one schema");
// retired-schema-assertion: source-drafts-revision-publication-close-028
assert.equal(elements.get("#schema-result").textContent,
  "Published Checkout schema revision 1. Revalidated 3 current Live events.",
  "installed publication reports the exact current-Live revalidation outcome");
elements.get("#schema-search").dispatch("input");
fixture.publicationFeedbackRetainedAfterRelationshipTreeRerender = elements.get("#schema-result").textContent ===
  "Published Checkout schema revision 1. Revalidated 3 current Live events.";
// retired-schema-assertion: source-drafts-revision-publication-close-029
assert.equal(elements.get("#schema-result").textContent,
  "Published Checkout schema revision 1. Revalidated 3 current Live events.",
  "relationship-tree rerenders retain the completed publication outcome");
// retired-schema-assertion: source-drafts-revision-publication-close-030
assert.deepEqual(uiController.schemas().at(-1).assignments, [{ sourceId:"gtm", eventName:"checkout", target:"payload" }]);
// retired-schema-assertion: source-drafts-revision-publication-close-031
assert.equal(uiController.schemas().at(-1).document.properties.total.type, "number");
// retired-schema-assertion: source-drafts-revision-publication-close-032
assert.equal(fixture.schemaStorageWrites, sourceWritesBeforePublish + 1, "Source confirmation performs the first and only library write");
// retired-schema-assertion: source-drafts-revision-publication-close-033
assert.equal(uiController.state().activeSchemaId, undefined);
// retired-schema-assertion: source-drafts-revision-publication-close-034
assert.equal(elements.get("#schema-editor").hidden, true);
// retired-schema-assertion: source-drafts-revision-publication-close-035
assert.equal(elements.get("#schema-revision-review").open, false, "Source publication closes the review and returns to the list");
uiController.replace(sourceLibraryBefore);
const newLibraryBefore = uiController.schemas(), newStorageBefore = uiValues.get("my-chrome-utilities.schema-library.v1");
elements.get("#create-schema").click(); elements.get("#schema-editor-name").value = "Transient New"; elements.get("#schema-editor-name").dispatch("input");
// retired-schema-assertion: source-drafts-revision-publication-close-036
assert.deepEqual(uiController.schemas(), newLibraryBefore);
// retired-schema-assertion: source-drafts-revision-publication-close-037
assert.equal(uiValues.get("my-chrome-utilities.schema-library.v1"), newStorageBefore,
  "New Schema editing remains transient before confirmation");
elements.get("#save-schema").click(); elements.get("#cancel-schema-revision").click();
elements.get("#close-schema-editor").click();
// retired-schema-assertion: source-drafts-revision-publication-close-038
assert.deepEqual(uiController.schemas(), newLibraryBefore);
// retired-schema-assertion: source-drafts-revision-publication-close-039
assert.equal(uiValues.get("my-chrome-utilities.schema-library.v1"), newStorageBefore,
  "cancel and close remove a transient New Schema without library mutation");
// retired-schema-assertion: source-drafts-revision-publication-close-040
assert.equal(elements.get("#close-schema-editor-review").open, false, "close does not route a transient draft through discard review");
// retired-schema-assertion: source-drafts-revision-publication-close-041
assert.equal(elements.get("#schema-detail").hidden, false, "close keeps the empty Schema detail region in the wide layout");
// retired-schema-assertion: source-drafts-revision-publication-close-042
assert.equal(elements.get("#schema-detail-empty").hidden, false, "close restores the empty Schema detail content");
elements.get("#create-schema").click(); elements.get("#schema-editor-name").value = "Published New"; elements.get("#schema-editor-name").dispatch("input");
const newWritesBeforeReview = fixture.schemaStorageWrites; elements.get("#save-and-close-schema").click();
// retired-schema-assertion: source-drafts-revision-publication-close-043
assert.equal(elements.get("#schema-revision-review").open, true);
// retired-schema-assertion: source-drafts-revision-publication-close-044
assert.deepEqual(uiController.schemas(), newLibraryBefore);
// retired-schema-assertion: source-drafts-revision-publication-close-045
assert.equal(fixture.schemaStorageWrites, newWritesBeforeReview, "save-and-close waits for revision confirmation before persistence");
const newWritesBeforePublish = fixture.schemaStorageWrites; elements.get("#confirm-schema-revision").click();
// retired-schema-assertion: source-drafts-revision-publication-close-046
assert.equal(uiController.schemas().length, newLibraryBefore.length + 1, "confirming New Schema appends exactly once");
// retired-schema-assertion: source-drafts-revision-publication-close-047
assert.equal(uiController.schemas().at(-1).name, "Published New");
// retired-schema-assertion: source-drafts-revision-publication-close-048
assert.equal(fixture.schemaStorageWrites, newWritesBeforePublish + 1, "New Schema confirmation performs its first library write");
// retired-schema-assertion: source-drafts-revision-publication-close-049
assert.equal(uiController.state().activeSchemaId, undefined);
// retired-schema-assertion: source-drafts-revision-publication-close-050
assert.equal(elements.get("#schema-editor").hidden, true,
  "New Schema publication clears transient editor state");
uiController.replace(sourceLibraryBefore);
uiController.openSchemaFromSource({ name:"Review boundary", sourceId:"page", eventName:"review", payload:{ ready:true }, label:"Captured event" });
const closeReviewWrites = fixture.schemaStorageWrites; elements.get("#save-schema-close-review").click();
// retired-schema-assertion: source-drafts-revision-publication-close-051
assert.equal(elements.get("#schema-revision-review").open, true);
// retired-schema-assertion: source-drafts-revision-publication-close-052
assert.deepEqual(uiController.schemas(), sourceLibraryBefore);
// retired-schema-assertion: source-drafts-revision-publication-close-053
assert.equal(fixture.schemaStorageWrites, closeReviewWrites, "close-review save also delegates to confirmation without eager publication");
elements.get("#cancel-schema-revision").click(); elements.get("#discard-schema-draft").click();
uiController.open("schema:page"); uiController.beginDraft();
elements.get("#build-specification").click();
// retired-schema-assertion: source-drafts-revision-publication-close-054
assert.equal(relationshipActions.at(-1), "build:schema:page:working-draft"); fixture.closeSpecification();
elements.get("#schema-editor-parent").value = "schema:parent"; elements.get("#schema-editor-parent").dispatch("change");
// retired-schema-assertion: source-drafts-revision-publication-close-055
assert.equal(uiController.schemas().find(({ id }) => id === "schema:page").workingDraft.parentSchemaId, "schema:parent");
// retired-schema-assertion: source-drafts-revision-publication-close-056
assert.match(elements.get("#schema-inheritance-provenance").textContent, /Parent v2/);
// retired-schema-assertion: source-drafts-revision-publication-close-057
assert.equal(elements.get("#schema-inherited-rule-groups").hidden, false);
// retired-schema-assertion: source-drafts-revision-publication-close-058
assert.match(elements.get("#schema-inherited-rule-groups").children[0].children[0].textContent, /Active inherited \(1\)/);
elements.get("#schema-only-declared-properties").checked = true; elements.get("#schema-only-declared-properties").dispatch("change");
// retired-schema-assertion: source-drafts-revision-publication-close-059
assert.equal(uiController.schemas().find(({ id }) => id === "schema:page").workingDraft.document.additionalProperties, false);
elements.get("#schema-editor-name").value = "Page checkout"; elements.get("#schema-editor-name").dispatch("input");
elements.get("#schema-editor-description").value = "Checkout payload"; elements.get("#save-schema-description").click();
elements.get("#save-schema").click();
// retired-schema-assertion: source-drafts-revision-publication-close-060
assert.equal(elements.get("#schema-revision-review").open, true, "saving opens the controller-owned revision review");
elements.get("#confirm-schema-revision").click();
// retired-schema-assertion: source-drafts-revision-publication-close-061
assert.equal(uiController.schemas()[0].version, 2);
// retired-schema-assertion: source-drafts-revision-publication-close-062
assert.equal(uiController.schemas()[0].name, "Page checkout");
// retired-schema-assertion: source-drafts-revision-publication-close-063
assert.equal(uiController.schemas()[0].documentation.description, "Checkout payload");
// retired-schema-assertion: source-drafts-revision-publication-close-064
assert.equal(uiController.state().activeSchemaId, undefined);
// retired-schema-assertion: source-drafts-revision-publication-close-065
assert.equal(elements.get("#schema-editor").hidden, true,
  "stored-schema publication clears editor state and returns to the list");
uiController.open("schema:page");
// retired-schema-assertion: source-drafts-revision-publication-close-066
assert.deepEqual(elements.get("#schema-revision-selector").children.map(({ value, textContent }) => ({ value, textContent })),
  [{ value:"1", textContent:"Revision 1" }], "opening a published schema renders its historical revision choices");
elements.get("#schema-revision-selector").value = "1"; elements.get("#restore-schema-revision").click();
// retired-schema-assertion: source-drafts-revision-publication-close-067
assert.equal(elements.get("#schema-revision-comparison").textContent,
  "Revision 1 compared with current revision 2. 1 historical properties; 1 current properties.");
// retired-schema-assertion: source-drafts-revision-publication-close-068
assert.equal(elements.get("#schema-revision-review").open, true);
// retired-schema-assertion: source-drafts-revision-publication-close-069
assert.equal(uiController.schemas().find(({ id }) => id === "schema:page").workingDraft, undefined,
  "requesting historical restoration does not mutate the current schema before confirmation");
elements.get("#cancel-schema-revision").click();
// retired-schema-assertion: source-drafts-revision-publication-close-070
assert.equal(uiController.schemas().find(({ id }) => id === "schema:page").workingDraft, undefined,
  "cancelling historical restoration leaves the current schema unchanged");
elements.get("#restore-schema-revision").click(); elements.get("#confirm-schema-revision").click();
// retired-schema-assertion: source-drafts-revision-publication-close-071
assert.equal(uiController.schemas().find(({ id }) => id === "schema:page").workingDraft.sourceVersion, 1,
  "confirming historical restoration creates a working draft from the selected revision");
elements.get("#discard-working-schema-draft").click(); uiController.open("schema:page");
elements.get("#schema-revision-selector").value = "1"; elements.get("#build-historical-specification").click();
// retired-schema-assertion: source-drafts-revision-publication-close-072
assert.equal(relationshipActions.at(-1), "build:schema:page:historical:1"); fixture.closeSpecification();
elements.get("#schema-revision-selector").value = "1"; elements.get("#duplicate-schema-revision").click();
// retired-schema-assertion: source-drafts-revision-publication-close-073
assert.equal(uiController.schemas().length, 3, "revision duplication remains schema-controller behavior");
const lifecycleSchemaId = uiController.state().activeSchemaId;
uiController.beginDraft();
const storedDraftStorage = uiValues.get("my-chrome-utilities.schema-library.v1"), storedDraftWrites = fixture.schemaStorageWrites;
elements.get("#close-schema-editor").click();
// retired-schema-assertion: source-drafts-revision-publication-close-074
assert.equal(uiController.state().activeSchemaId, undefined);
// retired-schema-assertion: source-drafts-revision-publication-close-075
assert.equal(elements.get("#close-schema-editor-review").open, false);
// retired-schema-assertion: source-drafts-revision-publication-close-076
assert.equal(fixture.schemaStorageWrites, storedDraftWrites);
// retired-schema-assertion: source-drafts-revision-publication-close-077
assert.equal(uiValues.get("my-chrome-utilities.schema-library.v1"), storedDraftStorage);
// retired-schema-assertion: source-drafts-revision-publication-close-078
assert.ok(uiController.schemas().find(({ id }) => id === lifecycleSchemaId).workingDraft,
  "close retains the stored working draft without another persistence write");
// retired-schema-assertion: source-drafts-revision-publication-close-079
assert.equal(elements.get("#schema-result").textContent, "Working draft retained without publishing.");
uiController.open(lifecycleSchemaId); const abandonWrites = fixture.schemaStorageWrites; elements.get("#discard-schema-draft").click();
// retired-schema-assertion: source-drafts-revision-publication-close-080
assert.equal(fixture.schemaStorageWrites, abandonWrites);
// retired-schema-assertion: source-drafts-revision-publication-close-081
assert.ok(uiController.schemas().find(({ id }) => id === lifecycleSchemaId).workingDraft,
  "discard-schema-draft abandons editor state without discarding the stored working draft");
uiController.open(lifecycleSchemaId); const discardStoredWrites = fixture.schemaStorageWrites; elements.get("#discard-working-schema-draft").click();
// retired-schema-assertion: source-drafts-revision-publication-close-082
assert.equal(fixture.schemaStorageWrites, discardStoredWrites + 1);
// retired-schema-assertion: source-drafts-revision-publication-close-083
assert.equal(uiController.schemas().find(({ id }) => id === lifecycleSchemaId).workingDraft, undefined,
  "discard-working-schema-draft is the distinct operation that mutates the stored library");
uiController.open(lifecycleSchemaId); uiController.beginDraft();

export { fixture };
