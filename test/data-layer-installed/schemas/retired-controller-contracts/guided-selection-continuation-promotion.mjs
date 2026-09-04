/** Original retired assertions and their direct executable owners. */
export const group = {
  "group": "guided selection, declaration, continuation, promotion, retry, and rejection",
  "lines": "676-793",
  "checks": [
    {
      "id": "guided-selection-continuation-promotion-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "a live property without an explicit continuation keeps the guided destination picker available",
      "observable": "uiController.guidedDraft().continuation",
      "expected": "undefined"
    },
    {
      "id": "guided-selection-continuation-promotion-002",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/validation-controller-test.mjs",
      "contract": "closing an unbound live-property flow returns to the originating captured property",
      "observable": "restoredGuidedCaptures.at(-1)",
      "expected": "[unboundGuidedCapture.id, \"/page_type\"]"
    },
    {
      "id": "guided-selection-continuation-promotion-003",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "schemaPaths.length > 0 => truthy",
      "observable": "schemaPaths.length > 0",
      "expected": "truthy"
    },
    {
      "id": "guided-selection-continuation-promotion-004",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "uiController.schemaPropertyAt(persistenceSchema.workingDraft.document, schemaPaths[0]) => truthy",
      "observable": "uiController.schemaPropertyAt(persistenceSchema.workingDraft.document, schemaPaths[0])",
      "expected": "truthy"
    },
    {
      "id": "guided-selection-continuation-promotion-005",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/assignment-controller-test.mjs",
      "contract": "uiController.schemaPropertyType(definedDocument, \"/sample\") => \"string\"",
      "observable": "uiController.schemaPropertyType(definedDocument, \"/sample\")",
      "expected": "\"string\""
    },
    {
      "id": "guided-selection-continuation-promotion-006",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/validation-controller-test.mjs",
      "contract": "elements.get(\"#guided-validation-flow\").dataset.eventId => guidedCapture.id",
      "observable": "elements.get(\"#guided-validation-flow\").dataset.eventId",
      "expected": "guidedCapture.id"
    },
    {
      "id": "guided-selection-continuation-promotion-007",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-guided-validation-factory-test.mjs",
      "contract": "the Schema-owned guided flow exposes the real continuation draft",
      "observable": "uiController.guidedDraft().continuation.schemaId",
      "expected": "persistenceSchemaId"
    },
    {
      "id": "guided-selection-continuation-promotion-008",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "guided continuation selection is persisted by the Schema owner",
      "observable": "uiValues.get(\"my-chrome-utilities.guided-validation-continuations.v1\")",
      "expected": "/schema:page/"
    },
    {
      "id": "guided-selection-continuation-promotion-009",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-guided-validation-factory-test.mjs",
      "contract": "guided continuation remains bound to the selected working draft",
      "observable": "uiController.guidedContinuation(guidedCapture).schemaId",
      "expected": "persistenceSchemaId"
    },
    {
      "id": "guided-selection-continuation-promotion-010",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/validation-controller-test.mjs",
      "contract": "uiController.state().activeSchemaId => persistenceSchemaId",
      "observable": "uiController.state().activeSchemaId",
      "expected": "persistenceSchemaId"
    },
    {
      "id": "guided-selection-continuation-promotion-011",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "guidedPicker.id => \"guided-continuation-schema-picker\"",
      "observable": "guidedPicker.id",
      "expected": "\"guided-continuation-schema-picker\""
    },
    {
      "id": "guided-selection-continuation-promotion-012",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "guidedPicker.children[0].id => \"guided-continuation-schema-picker-heading\"",
      "observable": "guidedPicker.children[0].id",
      "expected": "\"guided-continuation-schema-picker-heading\""
    },
    {
      "id": "guided-selection-continuation-promotion-013",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "the controller-owned guided picker preserves its exact legacy accessible identity",
      "observable": "guidedPicker[\"aria-labelledby\"]",
      "expected": "\"guided-continuation-schema-picker-heading\""
    },
    {
      "id": "guided-selection-continuation-promotion-014",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "the continuation picker owns its live choice listener",
      "observable": "guidedChoice.listenerCount() > 0",
      "expected": "truthy"
    },
    {
      "id": "guided-selection-continuation-promotion-015",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "cancelling removes the guided continuation picker",
      "observable": "elements.get(\"#guided-validation-flow\").children.length",
      "expected": "0"
    },
    {
      "id": "guided-selection-continuation-promotion-016",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "cancelling disposes the guided continuation choice listener immediately",
      "observable": "guidedChoice.listenerCount()",
      "expected": "0"
    },
    {
      "id": "guided-selection-continuation-promotion-017",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "choosing a continuation restores the captured event through the explicit Capture port",
      "observable": "restoredGuidedCaptures.at(-1)",
      "expected": "[guidedCapture.id, undefined]"
    },
    {
      "id": "guided-selection-continuation-promotion-018",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "uiController.openLivePropertyDeclaration(guidedCapture, \"checkout.email\", declarationTrigger) => true",
      "observable": "uiController.openLivePropertyDeclaration(guidedCapture, \"checkout.email\", declarationTrigger)",
      "expected": "true"
    },
    {
      "id": "guided-selection-continuation-promotion-019",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "the live declaration commits the observed property into the selected Schema draft",
      "observable": "uiController.schemaDocumentPaths(uiController.schemas().find(({ id }) => id === persistenceSchemaId).workingDraft.document).includes(\"/checkout/email\")",
      "expected": "truthy"
    },
    {
      "id": "guided-selection-continuation-promotion-020",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "live declaration completion returns through the explicit Capture port",
      "observable": "restoredGuidedCaptures.at(-1)",
      "expected": "[guidedCapture.id, \"checkout.email\"]"
    },
    {
      "id": "guided-selection-continuation-promotion-021",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "closing the live declaration disposes its confirm listener",
      "observable": "declarationConfirm.listenerCount()",
      "expected": "0"
    },
    {
      "id": "guided-selection-continuation-promotion-022",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/validation-controller-test.mjs",
      "contract": "validationRecords.length => 1",
      "observable": "validationRecords.length",
      "expected": "1"
    },
    {
      "id": "guided-selection-continuation-promotion-023",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/validation-controller-test.mjs",
      "contract": "elements.get(\"#schema-validation-record-list\").children.length => 1",
      "observable": "elements.get(\"#schema-validation-record-list\").children.length",
      "expected": "1"
    },
    {
      "id": "guided-selection-continuation-promotion-024",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "ordinary validateEvent results cannot continue without canonical evaluator evidence",
      "observable": "elements.get(\"#schema-validation-record-list\").children[0].children[1].disabled",
      "expected": "true"
    },
    {
      "id": "guided-selection-continuation-promotion-025",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/validation-controller-test.mjs",
      "contract": "continuationPreparation.eventId => guidedCapture.id",
      "observable": "continuationPreparation.eventId",
      "expected": "guidedCapture.id"
    },
    {
      "id": "guided-selection-continuation-promotion-026",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "continuationDialog.children[0].textContent => \"Continue captured validation in project\"",
      "observable": "continuationDialog.children[0].textContent",
      "expected": "\"Continue captured validation in project\""
    },
    {
      "id": "guided-selection-continuation-promotion-027",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/validation-controller-test.mjs",
      "contract": "continuationDialog.children[4].children[0].children[0].textContent => \"Event validation Test case\"",
      "observable": "continuationDialog.children[4].children[0].children[0].textContent",
      "expected": "\"Event validation Test case\""
    },
    {
      "id": "guided-selection-continuation-promotion-028",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "continuationDialog.children[9].textContent => \"Create Test case and open in Specification Studio\"",
      "observable": "continuationDialog.children[9].textContent",
      "expected": "\"Create Test case and open in Specification Studio\""
    },
    {
      "id": "guided-selection-continuation-promotion-029",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "cancelling a continuation keeps its existing row action live",
      "observable": "continuationTrigger.listenerCount() > 0",
      "expected": "truthy"
    },
    {
      "id": "guided-selection-continuation-promotion-030",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "cancel restores focus to the continuation row action",
      "observable": "continuationTrigger.focused",
      "expected": "true"
    },
    {
      "id": "guided-selection-continuation-promotion-031",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "continuationConfirm.textContent => \"Add requirements and open Profile\"",
      "observable": "continuationConfirm.textContent",
      "expected": "\"Add requirements and open Profile\""
    },
    {
      "id": "guided-selection-continuation-promotion-032",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/canonical-guided-validation-factory-test.mjs",
      "contract": "captured continuation commits the explicitly reviewed project destination",
      "observable": "continuationCommit",
      "expected": "{ destination:\"profile\", name:\"Checkout captured validation\", eventId:\"event:checkout\", profileId:\"profile:checkout\" }"
    },
    {
      "id": "guided-selection-continuation-promotion-033",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "elements.get(\"#schema-result\").textContent => \"Saved evaluated capture evidence in Checkout profile; opening it in Specification Studio.\"",
      "observable": "elements.get(\"#schema-result\").textContent",
      "expected": "\"Saved evaluated capture evidence in Checkout profile; opening it in Specification Studio.\""
    },
    {
      "id": "guided-selection-continuation-promotion-034",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/assignment-controller-test.mjs",
      "contract": "successful routing does not take the cancel-only trigger-focus path",
      "observable": "continuationTrigger.focused",
      "expected": "false"
    },
    {
      "id": "guided-selection-continuation-promotion-035",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "captured continuation completion disposes its dialog listeners",
      "observable": "continuationConfirm.listenerCount()",
      "expected": "0"
    },
    {
      "id": "guided-selection-continuation-promotion-036",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-deletion-workflow-test.mjs",
      "contract": "guarded continuation failure is rendered by the Schema owner without opening stale review UI",
      "observable": "elements.get(\"#schema-result\").textContent",
      "expected": "\"Create or open a Specification Project before continuing captured validation.\""
    },
    {
      "id": "guided-selection-continuation-promotion-037",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "uiController.requestLocalRulePromotion(\"/checkout/email\", \"local:email\") => true",
      "observable": "uiController.requestLocalRulePromotion(\"/checkout/email\", \"local:email\")",
      "expected": "true"
    },
    {
      "id": "guided-selection-continuation-promotion-038",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/rule-controller-test.mjs",
      "contract": "promotion writes its optimistic rule snapshot",
      "observable": "promotedRuleId",
      "expected": "/^reusable-/"
    },
    {
      "id": "guided-selection-continuation-promotion-039",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "durable success retains the promoted replacement",
      "observable": "uiController.schemas().find(({ id }) => id === persistenceSchemaId).workingDraft.attachedRules .some(({ id }) => id === promotedRuleId)",
      "expected": "true"
    },
    {
      "id": "guided-selection-continuation-promotion-040",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "guided failure pauses optimistic Rule Library state",
      "observable": "uiController.rules().some(({ id }) => id === \"rule:guided-retry\")",
      "expected": "false"
    },
    {
      "id": "guided-selection-continuation-promotion-041",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "retry reapplies the reviewed snapshot exactly once",
      "observable": "uiController.rules().some(({ id }) => id === \"rule:guided-retry\")",
      "expected": "true"
    },
    {
      "id": "guided-selection-continuation-promotion-042",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-controller-test.mjs",
      "contract": "guided completion restores the exact controller-owned property return",
      "observable": "uiController.guidedState().selectedSchemaPropertyPath",
      "expected": "\"checkout.email\""
    },
    {
      "id": "guided-selection-continuation-promotion-043",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "settled transactions ignore stale durable events",
      "observable": "uiController.rules().some(({ id }) => id === \"rule:guided-retry\")",
      "expected": "true"
    },
    {
      "id": "guided-selection-continuation-promotion-044",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "String(await observedRejection) => /rejected by operator/",
      "observable": "String(await observedRejection)",
      "expected": "/rejected by operator/"
    },
    {
      "id": "guided-selection-continuation-promotion-045",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "rejection restores the pre-transaction libraries",
      "observable": "uiController.rules().some(({ id }) => id === \"rule:guided-reject\")",
      "expected": "false"
    }
  ]
};
