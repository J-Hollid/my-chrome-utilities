/** Original retired assertions and their direct executable owners. */
export const group = {
  "group": "canonical saved editing, history, settlement, and overlays",
  "lines": "794-911",
  "checks": [
    {
      "id": "canonical-edit-history-settlement-overlay-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "uiController.openSavedCanonical(persistenceSchemaId) => true",
      "observable": "uiController.openSavedCanonical(persistenceSchemaId)",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-002",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "Schemas creates the compact canonical table host on demand with the legacy ID",
      "observable": "ownedCanonicalTableHost",
      "expected": "truthy"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-persistence-workflow-test.mjs",
      "contract": "canonicalTableMounts => 1",
      "observable": "canonicalTableMounts",
      "expected": "1"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-persistence-workflow-test.mjs",
      "contract": "canonicalTableOptions.host => ownedCanonicalTableHost",
      "observable": "canonicalTableOptions.host",
      "expected": "ownedCanonicalTableHost"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-005",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "canonicalTableOptions.conceptSuggestions() => [\"Checkout concept\"]",
      "observable": "canonicalTableOptions.conceptSuggestions()",
      "expected": "[\"Checkout concept\"]"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-006",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "a saved-schema policy edit remains busy until its durable acknowledgement",
      "observable": "uiController.canonicalState().settlementPending",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-007",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "the installed editor exposes the pending settlement synchronously instead of relying on its duration",
      "observable": "elements.get(\"#schema-editor\")[\"aria-busy\"]",
      "expected": "\"true\""
    },
    {
      "id": "canonical-edit-history-settlement-overlay-008",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "the matching saved acknowledgement releases policy presentation before the broader queue drains",
      "observable": "durableAcknowledgementReleasedPolicyPresentation",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-009",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "uiController.canonicalFacet(canonicalPropertyId) => /Canonical facets/",
      "observable": "uiController.canonicalFacet(canonicalPropertyId)",
      "expected": "/Canonical facets/"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-010",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "uiController.canonicalCommandScope({ kind:\"rename\", baseRevision:canonicalBefore.revision, propertyId:canonicalPropertyId, name:\"Renamed canonical property\" }) => canonicalBefore.n",
      "observable": "uiController.canonicalCommandScope({ kind:\"rename\", baseRevision:canonicalBefore.revision, propertyId:canonicalPropertyId, name:\"Renamed canonical property\" })",
      "expected": "canonicalBefore.nodes[canonicalPropertyId].name"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-011",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "canonical commands settle through the Schema durable port",
      "observable": "await uiController.dispatchCanonical({ kind:\"rename\", baseRevision:canonicalBefore.revision, propertyId:canonicalPropertyId, name:\"Renamed canonical property\" })",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-012",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "uiController.pendingCanonicalHistory(\"project:one\", \"Rename canonical property\").operationId => historyIdentity.operationId",
      "observable": "uiController.pendingCanonicalHistory(\"project:one\", \"Rename canonical property\").operationId",
      "expected": "historyIdentity.operationId"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-013",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "durably acknowledged history becomes available atomically",
      "observable": "uiController.canonicalState().historyPending",
      "expected": "false"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-014",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "await uiController.dispatchCanonical({ kind:\"rename\", baseRevision:canonicalAfter.revision, propertyId:canonicalPropertyId, name:\"Rejected canonical property\" }) => false",
      "observable": "await uiController.dispatchCanonical({ kind:\"rename\", baseRevision:canonicalAfter.revision, propertyId:canonicalPropertyId, name:\"Rejected canonical property\" })",
      "expected": "false"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-015",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "a rejected durable settlement preserves the exact command for recovery",
      "observable": "uiController.canonicalState().pending",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-016",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "Retry rebases only the preserved command onto current canonical state",
      "observable": "uiController.canonicalState().pending",
      "expected": "false"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-017",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "await uiController.persistCanonicalProjection(projectedCanonical, \"schema name\") => true",
      "observable": "await uiController.persistCanonicalProjection(projectedCanonical, \"schema name\")",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-018",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "settling a canonical projection refreshes publication readiness in the installed schema editor",
      "observable": "canonicalProjectionSettlementReady",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-019",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "projection metadata uses the same serialized settlement queue",
      "observable": "uiController.canonicalProjection().name",
      "expected": "\"Canonical metadata name\""
    },
    {
      "id": "canonical-edit-history-settlement-overlay-020",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "an already-settled canonical projection resumes idempotently",
      "observable": "await uiController.resumeCanonicalProjection()",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-021",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/library-import-workflow-test.mjs",
      "contract": "an installed contributor presents its canonical revision instead of the unrelated Saved Schema draft status alone",
      "observable": "elements.get(\"#schema-editor-status\").textContent",
      "expected": "/Context contract · Schema revision 0/u"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-022",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/canonical-persistence-workflow-test.mjs",
      "contract": "compact context actions and view controls execute through the adapter contract",
      "observable": "[undoCount, redoCount, contextActionCount, customCanonical.view]",
      "expected": "[1, 1, 1, \"table\"]"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-023",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "the installed compact context presents an empty durable-history outcome instead of discarding it",
      "observable": "emptyHistoryFeedbackPresented",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-024",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "the installed compact context exposes command feedback through its accessible result boundary",
      "observable": "elements.get(\"#compact-canonical-context\").children.some((child) => child[\"aria-label\"] === \"Compact canonical command result\")",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-025",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "renderedContextCount > 0 => truthy",
      "observable": "renderedContextCount > 0",
      "expected": "truthy"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-026",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "elements.get(\"#compact-canonical-context\").dataset.customContext => \"rendered\"",
      "observable": "elements.get(\"#compact-canonical-context\").dataset.customContext",
      "expected": "\"rendered\""
    },
    {
      "id": "canonical-edit-history-settlement-overlay-027",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "migration conflict resolution remains controller-owned",
      "observable": "migrationResolution",
      "expected": "[\"conflict:1\", \"number\"]"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-028",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "migrationCancelled => 1",
      "observable": "migrationCancelled",
      "expected": "1"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-029",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "migrationResolutionControl.listenerCount() => 0",
      "observable": "migrationResolutionControl.listenerCount()",
      "expected": "0"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-030",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "migrationConfirmed => 1",
      "observable": "migrationConfirmed",
      "expected": "1"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-031",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "migration confirmation rerender disposes its controls",
      "observable": "migrationConfirm.listenerCount()",
      "expected": "0"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-032",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "await uiController.dispatchCanonical({ kind:\"rename\", baseRevision:customCanonical.revision, propertyId:canonicalPropertyId, name:\"Conflicting rename\" }) => false",
      "observable": "await uiController.dispatchCanonical({ kind:\"rename\", baseRevision:customCanonical.revision, propertyId:canonicalPropertyId, name:\"Conflicting rename\" })",
      "expected": "false"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-033",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "compact context rerender disposes replaced review controls",
      "observable": "compareControl.listenerCount()",
      "expected": "0"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-034",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "Compare exposes the pending command base against the latest revision",
      "observable": "uiController.canonicalState().reviewVisible",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-035",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "Reject clears the preserved compact canonical command",
      "observable": "uiController.canonicalState().pending",
      "expected": "false"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-036",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "uiController.openSavedCanonical(persistenceSchemaId) => true",
      "observable": "uiController.openSavedCanonical(persistenceSchemaId)",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-037",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "the saved canonical property resolves into its staged rule editor",
      "observable": "uiController.openCanonicalRuleEditor(canonicalPropertyId)",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-038",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "the canonical rule editor starts with the staged rule-adder used by the installed schema workspace",
      "observable": "findByText(elements.get(\"#schema-property-rule-picker\"), \"Add rule\")",
      "expected": "truthy"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-039",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "compact property actions are live disposable controls",
      "observable": "compactDocumentationControl?.listenerCount() > 0",
      "expected": "truthy"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-040",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "await uiController.compactPropertyAction(canonicalPropertyId, \"documentation\", \"Checkout property\") => true",
      "observable": "await uiController.compactPropertyAction(canonicalPropertyId, \"documentation\", \"Checkout property\")",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-041",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "canonical property rerender disposes the replaced action controls",
      "observable": "compactDocumentationControl.listenerCount()",
      "expected": "0"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-042",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "uiController.canonicalDocument().nodes[canonicalPropertyId].documentation.description => \"Checkout property\"",
      "observable": "uiController.canonicalDocument().nodes[canonicalPropertyId].documentation.description",
      "expected": "\"Checkout property\""
    },
    {
      "id": "canonical-edit-history-settlement-overlay-043",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "await uiController.compactPropertyAction(canonicalPropertyId, \"presence\", \"required\") => true",
      "observable": "await uiController.compactPropertyAction(canonicalPropertyId, \"presence\", \"required\")",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-044",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-controller-test.mjs",
      "contract": "uiController.canonicalDocument().nodes[canonicalPropertyId].presence.mode => \"required\"",
      "observable": "uiController.canonicalDocument().nodes[canonicalPropertyId].presence.mode",
      "expected": "\"required\""
    },
    {
      "id": "canonical-edit-history-settlement-overlay-045",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "await uiController.compactPropertyAction(canonicalPropertyId, \"custom-example\", \"sample\") => true",
      "observable": "await uiController.compactPropertyAction(canonicalPropertyId, \"custom-example\", \"sample\")",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-046",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/rule-controller-test.mjs",
      "contract": "uiController.canonicalDocument().nodes[canonicalPropertyId].documentation.example => { method:\"custom\", value:\"sample\" }",
      "observable": "uiController.canonicalDocument().nodes[canonicalPropertyId].documentation.example",
      "expected": "{ method:\"custom\", value:\"sample\" }"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-047",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "await uiController.compactPropertyAction(canonicalPropertyId, \"expected\", \"expected\") => true",
      "observable": "await uiController.compactPropertyAction(canonicalPropertyId, \"expected\", \"expected\")",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-048",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "await uiController.compactPropertyAction(canonicalPropertyId, \"reset-expected\") => true",
      "observable": "await uiController.compactPropertyAction(canonicalPropertyId, \"reset-expected\")",
      "expected": "true"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-049",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "uiController.canonicalDocument().nodes[canonicalPropertyId].expectedValue => undefined",
      "observable": "uiController.canonicalDocument().nodes[canonicalPropertyId].expectedValue",
      "expected": "undefined"
    },
    {
      "id": "canonical-edit-history-settlement-overlay-050",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/guided-validation-controller-test.mjs",
      "contract": "promotion persistence normalizes historical rule snapshots",
      "observable": "uiController.storePromotionRules([{ id:\"rule:history\", name:\"Current\", kind:\"Required\", version:2, enabled:true, revisionHistory:[{ id:\"rule:history\", name:\"Previous\", kind:\"Required\", version:1, enabled:false }] }])[0].revisionHistory",
      "expected": "[{ name:\"Previous\", kind:\"Required\", version:1, enabled:false }]"
    }
  ]
};
