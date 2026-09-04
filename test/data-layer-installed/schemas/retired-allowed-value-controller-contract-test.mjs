import assert from "node:assert/strict";
import { expansionSchema, fixture } from "./retired-canonical-controller-contract-test.mjs";
import { guidedCapture, guidedResult } from "./retired-guided-controller-contract-test.mjs";

const { element, elements, findByText, uiController } = fixture;

uiController.add(expansionSchema);
const expansionEvidence = { propertyPath:"/page_type", status:"warning", message:"Choose a known type", expected:"product,content", actual:"checkout",
  actualValue:"checkout", rule:"Known types", ruleId:"rule:allowed", ruleVersion:1, operator:"allowed-values", severity:"warning",
  schemaId:expansionSchema.id, schemaName:expansionSchema.name, schemaVersion:2 };
const expansionTrigger = element();
// retired-schema-assertion: allowed-value-expansion-return-cleanup-001
assert.equal(uiController.openAllowedValueExpansionReview(guidedCapture.id, expansionSchema.id, expansionEvidence, expansionTrigger), true);
let expansionConfirm = findByText(elements.get("#live-event-inspector"), "Confirm addition"); expansionConfirm.click();
// retired-schema-assertion: allowed-value-expansion-return-cleanup-002
assert.deepEqual(uiController.schemas().find(({ id }) => id === expansionSchema.id).workingDraft.attachedRules[0].allowedValues,
  ["product", "content", "checkout"], "allowed-value expansion persists the exact observed scalar in the Schema-owned working draft");
// retired-schema-assertion: allowed-value-expansion-return-cleanup-003
assert.deepEqual(fixture.restoredGuidedCaptures.at(-1), [guidedCapture.id, "/page_type"], "allowed-value completion returns through the Capture port");
// retired-schema-assertion: allowed-value-expansion-return-cleanup-004
assert.equal(expansionConfirm.listenerCount(), 0, "allowed-value confirmation disposes its dialog listeners symmetrically");
uiController.openAllowedValueExpansionReview(guidedCapture.id, expansionSchema.id, expansionEvidence, expansionTrigger);
expansionConfirm = findByText(elements.get("#live-event-inspector"), "Keep existing pending value");
const disposedCompletion = uiController.persistGuidedValidation(guidedResult("rule:guided-dispose", "checkout.postcode"));
const disposedRejection = disposedCompletion.then(() => undefined, (error) => error);

export { disposedRejection, expansionConfirm, fixture };
