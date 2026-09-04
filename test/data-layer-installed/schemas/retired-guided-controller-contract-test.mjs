import assert from "node:assert/strict";
import { fixture } from "./retired-library-export-controller-contract-test.mjs";

const { element, elements, uiController, uiValues } = fixture;

const persistenceSchemaId = uiController.state().activeSchemaId;
uiController.beginDraft();
const persistenceSchema = uiController.schemas().find(({ id }) => id === persistenceSchemaId);
const guidedCapture = { id:"capture:checkout", sourceId:"gtm", name:"checkout", payload:{ checkout:{ email:"buyer@example.test" } }, rawInput:{} };
const unboundGuidedCapture = { id:"capture:pageview", sourceId:"gtm", name:"pageview", payload:{ page_type:"home" }, rawInput:{} };
await uiController.openGuidedLiveProperty(unboundGuidedCapture, "/page_type");
// retired-schema-assertion: guided-selection-continuation-promotion-001
assert.equal(uiController.guidedDraft().continuation, undefined,
  "a live property without an explicit continuation keeps the guided destination picker available");
uiController.closeGuided();
// retired-schema-assertion: guided-selection-continuation-promotion-002
assert.deepEqual(fixture.restoredGuidedCaptures.at(-1), [unboundGuidedCapture.id, "/page_type"],
  "closing an unbound live-property flow returns to the originating captured property");
const schemaPaths = uiController.schemaDocumentPaths(persistenceSchema.workingDraft.document);
// retired-schema-assertion: guided-selection-continuation-promotion-003
assert.ok(schemaPaths.length > 0);
// retired-schema-assertion: guided-selection-continuation-promotion-004
assert.ok(uiController.schemaPropertyAt(persistenceSchema.workingDraft.document, schemaPaths[0]));
const definedDocument = uiController.defineSchemaProperty({ type:"object" }, { path:"sample", type:"string" });
// retired-schema-assertion: guided-selection-continuation-promotion-005
assert.equal(uiController.schemaPropertyType(definedDocument, "/sample"), "string");
uiController.setManualSchemaOverride(guidedCapture.id, persistenceSchemaId);
await uiController.openGuidedProperty(guidedCapture, persistenceSchema, "checkout.email");
// retired-schema-assertion: guided-selection-continuation-promotion-006
assert.equal(elements.get("#guided-validation-flow").dataset.eventId, guidedCapture.id);
// retired-schema-assertion: guided-selection-continuation-promotion-007
assert.equal(uiController.guidedDraft().continuation.schemaId, persistenceSchemaId,
  "the Schema-owned guided flow exposes the real continuation draft");
// retired-schema-assertion: guided-selection-continuation-promotion-008
assert.match(uiValues.get("my-chrome-utilities.guided-validation-continuations.v1"), /schema:page/,
  "guided continuation selection is persisted by the Schema owner");
// retired-schema-assertion: guided-selection-continuation-promotion-009
assert.equal(uiController.guidedContinuation(guidedCapture).schemaId, persistenceSchemaId,
  "guided continuation remains bound to the selected working draft");
const guidedContinuation = uiController.guidedContinuation(guidedCapture);
guidedContinuation.review();
// retired-schema-assertion: guided-selection-continuation-promotion-010
assert.equal(uiController.state().activeSchemaId, persistenceSchemaId);
guidedContinuation.useDifferent();
const guidedPicker = elements.get("#guided-validation-flow").children[0];
// retired-schema-assertion: guided-selection-continuation-promotion-011
assert.equal(guidedPicker.id, "guided-continuation-schema-picker");
// retired-schema-assertion: guided-selection-continuation-promotion-012
assert.equal(guidedPicker.children[0].id, "guided-continuation-schema-picker-heading");
// retired-schema-assertion: guided-selection-continuation-promotion-013
assert.equal(guidedPicker["aria-labelledby"], "guided-continuation-schema-picker-heading",
  "the controller-owned guided picker preserves its exact legacy accessible identity");
const guidedChoice = guidedPicker.children[1].children[0];
// retired-schema-assertion: guided-selection-continuation-promotion-014
assert.ok(guidedChoice.listenerCount() > 0, "the continuation picker owns its live choice listener");
guidedPicker.children[2].click();
// retired-schema-assertion: guided-selection-continuation-promotion-015
assert.equal(elements.get("#guided-validation-flow").children.length, 0, "cancelling removes the guided continuation picker");
// retired-schema-assertion: guided-selection-continuation-promotion-016
assert.equal(guidedChoice.listenerCount(), 0, "cancelling disposes the guided continuation choice listener immediately");
guidedContinuation.useDifferent();
elements.get("#guided-validation-flow").children[0].children[1].children[0].click();
// retired-schema-assertion: guided-selection-continuation-promotion-017
assert.deepEqual(fixture.restoredGuidedCaptures.at(-1), [guidedCapture.id, undefined],
  "choosing a continuation restores the captured event through the explicit Capture port");
await uiController.openGuidedProperty(guidedCapture, persistenceSchema, "checkout.email");
const declarationTrigger = element();
// retired-schema-assertion: guided-selection-continuation-promotion-018
assert.equal(uiController.openLivePropertyDeclaration(guidedCapture, "checkout.email", declarationTrigger), true);
const declarationDialog = elements.get("#guided-validation-flow").children[0];
const declarationConfirm = declarationDialog.children[3];
declarationConfirm.click();
// retired-schema-assertion: guided-selection-continuation-promotion-019
assert.ok(uiController.schemaDocumentPaths(uiController.schemas().find(({ id }) => id === persistenceSchemaId).workingDraft.document).includes("/checkout/email"),
  "the live declaration commits the observed property into the selected Schema draft");
// retired-schema-assertion: guided-selection-continuation-promotion-020
assert.deepEqual(fixture.restoredGuidedCaptures.at(-1), [guidedCapture.id, "checkout.email"],
  "live declaration completion returns through the explicit Capture port");
// retired-schema-assertion: guided-selection-continuation-promotion-021
assert.equal(declarationConfirm.listenerCount(), 0, "closing the live declaration disposes its confirm listener");
const validationRecords = uiController.recheckCaptured([guidedCapture]);
// retired-schema-assertion: guided-selection-continuation-promotion-022
assert.equal(validationRecords.length, 1);
// retired-schema-assertion: guided-selection-continuation-promotion-023
assert.equal(elements.get("#schema-validation-record-list").children.length, 1);
// retired-schema-assertion: guided-selection-continuation-promotion-024
assert.equal(elements.get("#schema-validation-record-list").children[0].children[1].disabled, true,
  "ordinary validateEvent results cannot continue without canonical evaluator evidence");
uiController.recordCapturedValidation({ eventId:guidedCapture.id, eventName:"checkout", state:"Valid", checkedAt:"2026-08-25T10:00:00.000Z",
  schemaId:persistenceSchemaId, schemaName:"Page guided", schemaVersion:1, target:"payload", assignmentId:"assignment:checkout",
  assignmentName:"Checkout assignment", assignmentEvidence:"canonical winner", issueCodes:[], evaluated:{ resultIdentity:"evaluation:checkout:1",
    winner:{ schemaId:persistenceSchemaId, schemaRevision:1 }, issueDetails:[] } });
const continuationTrigger = elements.get("#schema-validation-record-list").children[1].children[1];
continuationTrigger.click(); await Promise.resolve();
// retired-schema-assertion: guided-selection-continuation-promotion-025
assert.equal(fixture.continuationPreparation.eventId, guidedCapture.id);
let continuationDialog = elements.get("#guided-validation-flow").children[0];
// retired-schema-assertion: guided-selection-continuation-promotion-026
assert.equal(continuationDialog.children[0].textContent, "Continue captured validation in project");
// retired-schema-assertion: guided-selection-continuation-promotion-027
assert.equal(continuationDialog.children[4].children[0].children[0].textContent, "Event validation Test case");
// retired-schema-assertion: guided-selection-continuation-promotion-028
assert.equal(continuationDialog.children[9].textContent, "Create Test case and open in Specification Studio");
continuationDialog.children[10].click();
// retired-schema-assertion: guided-selection-continuation-promotion-029
assert.ok(continuationTrigger.listenerCount() > 0, "cancelling a continuation keeps its existing row action live");
// retired-schema-assertion: guided-selection-continuation-promotion-030
assert.equal(continuationTrigger.focused, true, "cancel restores focus to the continuation row action");
continuationTrigger.focused = false;
continuationTrigger.click(); await Promise.resolve();
continuationDialog = elements.get("#guided-validation-flow").children[0];
const continuationDestination = continuationDialog.children[4].children[0], continuationProfile = continuationDialog.children[8].children[0], continuationConfirm = continuationDialog.children[9];
continuationDestination.value = "profile"; continuationDestination.dispatch("change");
// retired-schema-assertion: guided-selection-continuation-promotion-031
assert.equal(continuationConfirm.textContent, "Add requirements and open Profile"); continuationProfile.value = "profile:checkout"; continuationConfirm.click(); await Promise.resolve();
// retired-schema-assertion: guided-selection-continuation-promotion-032
assert.deepEqual(fixture.continuationCommit, { destination:"profile", name:"Checkout captured validation", eventId:"event:checkout", profileId:"profile:checkout" },
  "captured continuation commits the explicitly reviewed project destination");
// retired-schema-assertion: guided-selection-continuation-promotion-033
assert.equal(elements.get("#schema-result").textContent, "Saved evaluated capture evidence in Checkout profile; opening it in Specification Studio.");
// retired-schema-assertion: guided-selection-continuation-promotion-034
assert.equal(continuationTrigger.focused, false, "successful routing does not take the cancel-only trigger-focus path");
// retired-schema-assertion: guided-selection-continuation-promotion-035
assert.equal(continuationConfirm.listenerCount(), 0, "captured continuation completion disposes its dialog listeners");
fixture.continuationFailure=new Error("Create or open a Specification Project before continuing captured validation.");continuationTrigger.click();await Promise.resolve();
// retired-schema-assertion: guided-selection-continuation-promotion-036
assert.equal(elements.get("#schema-result").textContent,"Create or open a Specification Project before continuing captured validation.",
  "guarded continuation failure is rendered by the Schema owner without opening stale review UI");fixture.continuationFailure=undefined;
uiController.updateDraft({ attachedRules:[...(persistenceSchema.workingDraft?.attachedRules ?? persistenceSchema.attachedRules ?? []),
  { id:"local:email", name:"Email required", version:1, propertyPath:"/checkout/email", operator:"required", enabled:true }] });
fixture.promotionRuleSequence = 2;
// retired-schema-assertion: guided-selection-continuation-promotion-037
assert.equal(uiController.requestLocalRulePromotion("/checkout/email", "local:email"), true);
const promotionCompletion = Promise.resolve(fixture.promotionDialogInput.confirm({ action:"create", name:"Reusable email" }));
const promotedRuleId = uiController.rules().find(({ name }) => name === "Reusable email")?.id;
// retired-schema-assertion: guided-selection-continuation-promotion-038
assert.match(promotedRuleId, /^reusable-/, "promotion writes its optimistic rule snapshot");
fixture.persistenceListener({ type:"saved", schemaId:persistenceSchemaId }); await promotionCompletion;
// retired-schema-assertion: guided-selection-continuation-promotion-039
assert.equal(uiController.schemas().find(({ id }) => id === persistenceSchemaId).workingDraft.attachedRules
  .some(({ id }) => id === promotedRuleId), true, "durable success retains the promoted replacement");
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
fixture.persistenceListener({ type:"failed", schemaId:persistenceSchemaId, error:new Error("offline") });
// retired-schema-assertion: guided-selection-continuation-promotion-040
assert.equal(uiController.rules().some(({ id }) => id === "rule:guided-retry"), false, "guided failure pauses optimistic Rule Library state");
fixture.persistenceListener({ type:"retried", schemaId:persistenceSchemaId }); await retryCompletion;
// retired-schema-assertion: guided-selection-continuation-promotion-041
assert.equal(uiController.rules().some(({ id }) => id === "rule:guided-retry"), true, "retry reapplies the reviewed snapshot exactly once");
// retired-schema-assertion: guided-selection-continuation-promotion-042
assert.equal(uiController.guidedState().selectedSchemaPropertyPath, "checkout.email",
  "guided completion restores the exact controller-owned property return");
fixture.persistenceListener({ type:"rejected", schemaId:persistenceSchemaId, error:new Error("stale rejection") });
// retired-schema-assertion: guided-selection-continuation-promotion-043
assert.equal(uiController.rules().some(({ id }) => id === "rule:guided-retry"), true, "settled transactions ignore stale durable events");
const rejectedCompletion = uiController.persistGuidedValidation(guidedResult("rule:guided-reject", "checkout.country"));
const observedRejection = rejectedCompletion.then(() => undefined, (error) => error);
fixture.persistenceListener({ type:"failed", schemaId:persistenceSchemaId, error:new Error("conflict") });
fixture.persistenceListener({ type:"rejected", schemaId:persistenceSchemaId, error:new Error("rejected by operator") });
// retired-schema-assertion: guided-selection-continuation-promotion-044
assert.match(String(await observedRejection), /rejected by operator/);
// retired-schema-assertion: guided-selection-continuation-promotion-045
assert.equal(uiController.rules().some(({ id }) => id === "rule:guided-reject"), false, "rejection restores the pre-transaction libraries");

export { fixture, guidedCapture, guidedChoice, guidedResult, persistenceSchemaId };
