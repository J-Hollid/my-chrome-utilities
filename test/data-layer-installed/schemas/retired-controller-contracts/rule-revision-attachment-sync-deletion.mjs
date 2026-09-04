/** Original retired assertions and their exact direct bindings. */
export const group = {
  "group": "rule revision, attachment, sync, and deletion",
  "lines": "561-620",
  "checks": [
    {
      "id": "rule-revision-attachment-sync-deletion-001",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "schema publication revalidates the current Live view through its typed port",
      "observable": "liveRevalidations > 0",
      "expected": "truthy",
      "binding": "assert.ok(fixture.liveRevalidations > 0, \"schema publication revalidates the current Live view through its typed port\");"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.rules().find(({ id }) => id === \"rule:checkout\").name => \"Checkout required\"",
      "observable": "uiController.rules().find(({ id }) => id === \"rule:checkout\").name",
      "expected": "\"Checkout required\"",
      "binding": "assert.equal(uiController.rules().find(({ id }) => id === \"rule:checkout\").name, \"Checkout required\");"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId) .attachedRules.some(({ id }) => id === \"rule:checkout\") => true",
      "observable": "uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId) .attachedRules.some(({ id }) => id === \"rule:checkout\")",
      "expected": "true",
      "binding": "assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId) .attachedRules.some(({ id }) => id === \"rule:checkout\"), true);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.updateAttachedRule(uiController.state().activeSchemaId, \"rule:checkout\", false) => true",
      "observable": "uiController.updateAttachedRule(uiController.state().activeSchemaId, \"rule:checkout\", false)",
      "expected": "true",
      "binding": "assert.equal(uiController.updateAttachedRule(uiController.state().activeSchemaId, \"rule:checkout\", false), true);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-005",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.updateAttachedRule(uiController.state().activeSchemaId, \"rule:checkout\", true) => true",
      "observable": "uiController.updateAttachedRule(uiController.state().activeSchemaId, \"rule:checkout\", true)",
      "expected": "true",
      "binding": "assert.equal(uiController.updateAttachedRule(uiController.state().activeSchemaId, \"rule:checkout\", true), true);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-006",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "checkoutRuleRow => truthy",
      "observable": "checkoutRuleRow",
      "expected": "truthy",
      "binding": "assert.ok(checkoutRuleRow);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-007",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.rules().find(({ id }) => id === \"rule:checkout\").enabled => false",
      "observable": "uiController.rules().find(({ id }) => id === \"rule:checkout\").enabled",
      "expected": "false",
      "binding": "assert.equal(uiController.rules().find(({ id }) => id === \"rule:checkout\").enabled, false);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-008",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "rerender disposes the replaced rule-row action listeners",
      "observable": "disableRuleButton.listenerCount()",
      "expected": "0",
      "binding": "assert.equal(disableRuleButton.listenerCount(), 0, \"rerender disposes the replaced rule-row action listeners\");"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-009",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.requestRuleRevision(\"rule:checkout\", { name:\"Checkout present\", message:\"Checkout must be present\" }) => true",
      "observable": "uiController.requestRuleRevision(\"rule:checkout\", { name:\"Checkout present\", message:\"Checkout must be present\" })",
      "expected": "true",
      "binding": "assert.equal(uiController.requestRuleRevision(\"rule:checkout\", { name:\"Checkout present\", message:\"Checkout must be present\" }), true);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-010",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "elements.get(\"#schema-rule-revision-review\").open => true",
      "observable": "elements.get(\"#schema-rule-revision-review\").open",
      "expected": "true",
      "binding": "assert.equal(elements.get(\"#schema-rule-revision-review\").open, true);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-011",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "cancel leaves a rule revision untouched",
      "observable": "uiController.rules().find(({ id }) => id === \"rule:checkout\").version",
      "expected": "1",
      "binding": "assert.equal(uiController.rules().find(({ id }) => id === \"rule:checkout\").version, 1, \"cancel leaves a rule revision untouched\");"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-012",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.rules().find(({ id }) => id === \"rule:checkout\").version => 2",
      "observable": "uiController.rules().find(({ id }) => id === \"rule:checkout\").version",
      "expected": "2",
      "binding": "assert.equal(uiController.rules().find(({ id }) => id === \"rule:checkout\").version, 2);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-013",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.rules().find(({ id }) => id === \"rule:checkout\").revisionHistory[0].name => \"Checkout required\"",
      "observable": "uiController.rules().find(({ id }) => id === \"rule:checkout\").revisionHistory[0].name",
      "expected": "\"Checkout required\"",
      "binding": "assert.equal(uiController.rules().find(({ id }) => id === \"rule:checkout\").revisionHistory[0].name, \"Checkout required\");"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-014",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.requestRuleSync(\"rule:checkout\") => true",
      "observable": "uiController.requestRuleSync(\"rule:checkout\")",
      "expected": "true",
      "binding": "assert.equal(uiController.requestRuleSync(\"rule:checkout\"), true);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-015",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "elements.get(\"#schema-rule-sync-review-summary\").textContent => /1 schemas and 1 attachments/",
      "observable": "elements.get(\"#schema-rule-sync-review-summary\").textContent",
      "expected": "/1 schemas and 1 attachments/",
      "binding": "assert.match(elements.get(\"#schema-rule-sync-review-summary\").textContent, /1 schemas and 1 attachments/);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-016",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "sync publishes exactly one reviewed schema revision",
      "observable": "syncedSchema.version",
      "expected": "versionBeforeSync + 1",
      "binding": "assert.equal(syncedSchema.version, versionBeforeSync + 1, \"sync publishes exactly one reviewed schema revision\");"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-017",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "syncedSchema.attachedRules.find(({ id }) => id === \"rule:checkout\").version => 2",
      "observable": "syncedSchema.attachedRules.find(({ id }) => id === \"rule:checkout\").version",
      "expected": "2",
      "binding": "assert.equal(syncedSchema.attachedRules.find(({ id }) => id === \"rule:checkout\").version, 2);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-018",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "elements.get(\"#schema-rule-upgrade-review\").open => true",
      "observable": "elements.get(\"#schema-rule-upgrade-review\").open",
      "expected": "true",
      "binding": "assert.equal(elements.get(\"#schema-rule-upgrade-review\").open, true);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-019",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "upgrade changes the selected pinned attachment without publishing",
      "observable": "uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId) .attachedRules.find(({ id }) => id === \"rule:checkout\").version",
      "expected": "3",
      "binding": "assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId) .attachedRules.find(({ id }) => id === \"rule:checkout\").version, 3, \"upgrade changes the selected pinned attachment without publishing\");"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-020",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.ruleState().approvedRuleRevisionId => \"rule:checkout\"",
      "observable": "uiController.ruleState().approvedRuleRevisionId",
      "expected": "\"rule:checkout\"",
      "binding": "assert.equal(uiController.ruleState().approvedRuleRevisionId, \"rule:checkout\");"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-021",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.ruleState().approvedRuleAttachmentUpdateId => \"rule:checkout\"",
      "observable": "uiController.ruleState().approvedRuleAttachmentUpdateId",
      "expected": "\"rule:checkout\"",
      "binding": "assert.equal(uiController.ruleState().approvedRuleAttachmentUpdateId, \"rule:checkout\");"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-022",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.editReusableRule(\"rule:retired\") => true",
      "observable": "uiController.editReusableRule(\"rule:retired\")",
      "expected": "true",
      "binding": "assert.equal(uiController.editReusableRule(\"rule:retired\"), true);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-023",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "editing a reusable rule requires revision review",
      "observable": "elements.get(\"#schema-rule-revision-review\").open",
      "expected": "true",
      "binding": "assert.equal(elements.get(\"#schema-rule-revision-review\").open, true, \"editing a reusable rule requires revision review\");"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-024",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "reusable-rule revision review preserves the examples comparison",
      "observable": "elements.get(\"#schema-rule-revision-review-summary\").textContent",
      "expected": "/; examples .* → .*\\.$/u",
      "binding": "assert.match(elements.get(\"#schema-rule-revision-review-summary\").textContent, /; examples .* → .*\\.$/u, \"reusable-rule revision review preserves the examples comparison\");"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-025",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.rules().find(({ id }) => id === \"rule:retired\").version => 2",
      "observable": "uiController.rules().find(({ id }) => id === \"rule:retired\").version",
      "expected": "2",
      "binding": "assert.equal(uiController.rules().find(({ id }) => id === \"rule:retired\").version, 2);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-026",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.ruleState().pendingRuleSnapshotMetadata => { id:\"rule:retired\", version:1, attachments:[] }",
      "observable": "uiController.ruleState().pendingRuleSnapshotMetadata",
      "expected": "{ id:\"rule:retired\", version:1, attachments:[] }",
      "binding": "assert.deepEqual(uiController.ruleState().pendingRuleSnapshotMetadata, { id:\"rule:retired\", version:1, attachments:[] });"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-027",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "Create rule clears the identity of the previously edited reusable rule",
      "observable": "uiController.ruleState().editingReusableSchemaRuleId",
      "expected": "undefined",
      "binding": "assert.equal(uiController.ruleState().editingReusableSchemaRuleId, undefined, \"Create rule clears the identity of the previously edited reusable rule\");"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-028",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "attached rules cannot be deleted",
      "observable": "uiController.requestRuleDeletion(\"rule:checkout\")",
      "expected": "false",
      "binding": "assert.equal(uiController.requestRuleDeletion(\"rule:checkout\"), false, \"attached rules cannot be deleted\");"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-029",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.requestRuleDeletion(\"rule:retired\") => true",
      "observable": "uiController.requestRuleDeletion(\"rule:retired\")",
      "expected": "true",
      "binding": "assert.equal(uiController.requestRuleDeletion(\"rule:retired\"), true);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-030",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.rules().some(({ id }) => id === \"rule:retired\") => true",
      "observable": "uiController.rules().some(({ id }) => id === \"rule:retired\")",
      "expected": "true",
      "binding": "assert.equal(uiController.rules().some(({ id }) => id === \"rule:retired\"), true);"
    },
    {
      "id": "rule-revision-attachment-sync-deletion-031",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-revision-controller-contract-test.mjs",
      "contract": "uiController.rules().some(({ id }) => id === \"rule:retired\") => false",
      "observable": "uiController.rules().some(({ id }) => id === \"rule:retired\")",
      "expected": "false",
      "binding": "assert.equal(uiController.rules().some(({ id }) => id === \"rule:retired\"), false);"
    }
  ]
};
