/** Original retired assertions and their direct executable owners. */
export const group = {
  "group": "allowed-value expansion return and cleanup",
  "lines": "912-926",
  "checks": [
    {
      "id": "allowed-value-expansion-return-cleanup-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-promotion-workflow-test.mjs",
      "contract": "uiController.openAllowedValueExpansionReview(guidedCapture.id, expansionSchema.id, expansionEvidence, expansionTrigger) => true",
      "observable": "uiController.openAllowedValueExpansionReview(guidedCapture.id, expansionSchema.id, expansionEvidence, expansionTrigger)",
      "expected": "true"
    },
    {
      "id": "allowed-value-expansion-return-cleanup-002",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "allowed-value expansion persists the exact observed scalar in the Schema-owned working draft",
      "observable": "uiController.schemas().find(({ id }) => id === expansionSchema.id).workingDraft.attachedRules[0].allowedValues",
      "expected": "[\"product\", \"content\", \"checkout\"]"
    },
    {
      "id": "allowed-value-expansion-return-cleanup-003",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "allowed-value completion returns through the Capture port",
      "observable": "restoredGuidedCaptures.at(-1)",
      "expected": "[guidedCapture.id, \"/page_type\"]"
    },
    {
      "id": "allowed-value-expansion-return-cleanup-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "allowed-value confirmation disposes its dialog listeners symmetrically",
      "observable": "expansionConfirm.listenerCount()",
      "expected": "0"
    }
  ]
};
