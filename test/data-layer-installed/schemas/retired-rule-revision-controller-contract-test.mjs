import assert from "node:assert/strict";
import { fixture } from "./retired-rule-choice-controller-contract-test.mjs";

const { elements, findByText, uiController } = fixture;

uiController.publish();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-001
assert.ok(fixture.liveRevalidations > 0, "schema publication revalidates the current Live view through its typed port");
elements.get("#create-schema-rule").click();
elements.get("#schema-rule-name").value = "Checkout required";
elements.get("#schema-rule-types").value = "string"; elements.get("#schema-rule-operator").value = "required";
elements.get("#schema-rule-severity").value = "error"; elements.get("#schema-rule-message").value = "Checkout is required";
elements.get("#schema-rule-attachments").selectedOptions = [{ value:uiController.state().activeSchemaId }];
elements.get("#save-schema-rule").click();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-002
assert.equal(uiController.rules().find(({ id }) => id === "rule:checkout").name, "Checkout required");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-003
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId)
  .attachedRules.some(({ id }) => id === "rule:checkout"), true);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-004
assert.equal(uiController.updateAttachedRule(uiController.state().activeSchemaId, "rule:checkout", false), true);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-005
assert.equal(uiController.updateAttachedRule(uiController.state().activeSchemaId, "rule:checkout", true), true);
elements.get("#schema-rule-search").value = "checkout"; elements.get("#schema-rule-search").dispatch("input");
const checkoutRuleRow = elements.get("#schema-rule-list").children.find(({ children }) => /Checkout required/.test(children[0].textContent));
// retired-schema-assertion: rule-revision-attachment-sync-deletion-006
assert.ok(checkoutRuleRow); const disableRuleButton = findByText(checkoutRuleRow, "Disable"); disableRuleButton.click();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-007
assert.equal(uiController.rules().find(({ id }) => id === "rule:checkout").enabled, false);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-008
assert.equal(disableRuleButton.listenerCount(), 0, "rerender disposes the replaced rule-row action listeners");
findByText(elements.get("#schema-rule-list").children[0], "Enable").click();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-009
assert.equal(uiController.requestRuleRevision("rule:checkout", { name:"Checkout present", message:"Checkout must be present" }), true);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-010
assert.equal(elements.get("#schema-rule-revision-review").open, true);
elements.get("#cancel-schema-rule-revision").click();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-011
assert.equal(uiController.rules().find(({ id }) => id === "rule:checkout").version, 1, "cancel leaves a rule revision untouched");
uiController.requestRuleRevision("rule:checkout", { name:"Checkout present", message:"Checkout must be present" });
elements.get("#confirm-schema-rule-revision-review").click();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-012
assert.equal(uiController.rules().find(({ id }) => id === "rule:checkout").version, 2);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-013
assert.equal(uiController.rules().find(({ id }) => id === "rule:checkout").revisionHistory[0].name, "Checkout required");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-014
assert.equal(uiController.requestRuleSync("rule:checkout"), true);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-015
assert.match(elements.get("#schema-rule-sync-review-summary").textContent, /1 schemas and 1 attachments/);
const versionBeforeSync = uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).version;
uiController.confirmRuleSync();
const syncedSchema = uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-016
assert.equal(syncedSchema.version, versionBeforeSync + 1, "sync publishes exactly one reviewed schema revision");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-017
assert.equal(syncedSchema.attachedRules.find(({ id }) => id === "rule:checkout").version, 2);
uiController.requestRuleRevision("rule:checkout", { severity:"warning" });
elements.get("#confirm-schema-rule-revision-review").click();
uiController.requestRuleUpgrade("rule:checkout", [uiController.state().activeSchemaId]);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-018
assert.equal(elements.get("#schema-rule-upgrade-review").open, true);
elements.get("#confirm-schema-rule-upgrade").click();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-019
assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId)
  .attachedRules.find(({ id }) => id === "rule:checkout").version, 3, "upgrade changes the selected pinned attachment without publishing");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-020
assert.equal(uiController.ruleState().approvedRuleRevisionId, "rule:checkout");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-021
assert.equal(uiController.ruleState().approvedRuleAttachmentUpdateId, "rule:checkout");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-022
assert.equal(uiController.editReusableRule("rule:retired"), true); elements.get("#schema-rule-name").value = "Retired rule reviewed";
elements.get("#schema-rule-attachments").selectedOptions = []; elements.get("#save-schema-rule").click();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-023
assert.equal(elements.get("#schema-rule-revision-review").open, true, "editing a reusable rule requires revision review");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-024
assert.match(elements.get("#schema-rule-revision-review-summary").textContent, /; examples .* → .*\.$/u,
  "reusable-rule revision review preserves the examples comparison");
elements.get("#confirm-schema-rule-revision-review").click();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-025
assert.equal(uiController.rules().find(({ id }) => id === "rule:retired").version, 2);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-026
assert.deepEqual(uiController.ruleState().pendingRuleSnapshotMetadata, { id:"rule:retired", version:1, attachments:[] });
elements.get("#create-schema-rule").click();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-027
assert.equal(uiController.ruleState().editingReusableSchemaRuleId, undefined,
  "Create rule clears the identity of the previously edited reusable rule");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-028
assert.equal(uiController.requestRuleDeletion("rule:checkout"), false, "attached rules cannot be deleted");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-029
assert.equal(uiController.requestRuleDeletion("rule:retired"), true);
elements.get("#cancel-schema-rule-delete").click();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-030
assert.equal(uiController.rules().some(({ id }) => id === "rule:retired"), true);
uiController.requestRuleDeletion("rule:retired"); elements.get("#confirm-schema-rule-delete").click();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-031
assert.equal(uiController.rules().some(({ id }) => id === "rule:retired"), false);

export { fixture };
