/** Original retired assertions and their exact direct bindings. */
export const group = {
  "group": "allowed-value expansion return and cleanup",
  "lines": "912-926",
  "checks": [
    {
      "id": "allowed-value-expansion-return-cleanup-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "uiController.openAllowedValueExpansionReview(guidedCapture.id, expansionSchema.id, expansionEvidence, expansionTrigger) => true",
      "observable": "uiController.openAllowedValueExpansionReview(guidedCapture.id, expansionSchema.id, expansionEvidence, expansionTrigger)",
      "expected": "true",
      "binding": "assert.equal(controller.openAllowedValueExpansion(guidedCapture.id,expansionSchema.id,expansionEvidence,expansionTrigger),true);"
    },
    {
      "id": "allowed-value-expansion-return-cleanup-002",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "allowed-value expansion persists the exact observed scalar in the Schema-owned working draft",
      "observable": "uiController.schemas().find(({ id }) => id === expansionSchema.id).workingDraft.attachedRules[0].allowedValues",
      "expected": "[\"product\", \"content\", \"checkout\"]",
      "binding": "assert.deepEqual(expansionSchemas.find(({id})=>id===expansionSchema.id).workingDraft.attachedRules[0].allowedValues, [\"product\",\"content\",\"checkout\"],\"allowed-value expansion persists the exact observed scalar in the Schema-owned working draft\");"
    },
    {
      "id": "allowed-value-expansion-return-cleanup-003",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "allowed-value completion returns through the Capture port",
      "observable": "restoredGuidedCaptures.at(-1)",
      "expected": "[guidedCapture.id, \"/page_type\"]",
      "binding": "assert.deepEqual(restoredGuidedCaptures.at(-1),[guidedCapture.id,\"/page_type\"],\"allowed-value completion returns through the Capture port\");"
    },
    {
      "id": "allowed-value-expansion-return-cleanup-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "allowed-value confirmation disposes its dialog listeners symmetrically",
      "observable": "expansionConfirm.listenerCount()",
      "expected": "0",
      "binding": "assert.equal(expansionConfirm.listenerCount(),0,\"allowed-value confirmation disposes its dialog listeners symmetrically\");"
    }
  ]
};
