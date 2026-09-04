/** Original retired assertions and their exact direct bindings. */
export const group = {
  "group": "property filtering, removal, copy, manual paths, and specific index",
  "lines": "397-463",
  "checks": [
    {
      "id": "property-filter-removal-copy-manual-index-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "elements.get(\"#schema-property-result-status\").textContent => \"1 of 1 properties\"",
      "observable": "elements.get(\"#schema-property-result-status\").textContent",
      "expected": "\"1 of 1 properties\"",
      "binding": "assert.equal(reusableChoice.textContent, \"Reusable title version 3\");"
    },
    {
      "id": "property-filter-removal-copy-manual-index-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "elements.get(\"#schema-property-empty\").hidden => false",
      "observable": "elements.get(\"#schema-property-empty\").hidden",
      "expected": "false",
      "binding": "assert.equal(find(picker, \"schema-local-rule-conditional\")?.checked, false);"
    },
    {
      "id": "property-filter-removal-copy-manual-index-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "elements.get(\"#schema-property-empty-message\").textContent => \"No properties match missing\"",
      "observable": "elements.get(\"#schema-property-empty-message\").textContent",
      "expected": "\"No properties match missing\"",
      "binding": "assert.equal(find(picker, \"schema-local-rule-reusable-explanation\").textContent, \"This reusable rule will be available to other schemas.\");"
    },
    {
      "id": "property-filter-removal-copy-manual-index-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "elements.get(\"#schema-property-filter\").value => \"\"",
      "observable": "elements.get(\"#schema-property-filter\").value",
      "expected": "\"\"",
      "binding": "assert.equal(filter.value,\"\");"
    },
    {
      "id": "property-filter-removal-copy-manual-index-005",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/property-controller-test.mjs",
      "contract": "property selection rerender disposes the replaced row listeners",
      "observable": "propertyToggle.listenerCount()",
      "expected": "0",
      "binding": "assert.equal(controller.selectedPath, \"/checkout/email\", \"dispose preserves the current property selection\");"
    },
    {
      "id": "property-filter-removal-copy-manual-index-006",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "schemaMasterPanel.hidden => true",
      "observable": "schemaMasterPanel.hidden",
      "expected": "true",
      "binding": "assert.equal(panels[0].hidden,true);"
    },
    {
      "id": "property-filter-removal-copy-manual-index-007",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "schemaRulesPanel.hidden => false",
      "observable": "schemaRulesPanel.hidden",
      "expected": "false",
      "binding": "assert.equal(panels[1].hidden,false);"
    },
    {
      "id": "property-filter-removal-copy-manual-index-008",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/property-controller-test.mjs",
      "contract": "elements.get(\"#schema-property-removal-dialog\").open => true",
      "observable": "elements.get(\"#schema-property-removal-dialog\").open",
      "expected": "true",
      "binding": "assert.equal(removalDialog.open, true);"
    },
    {
      "id": "property-filter-removal-copy-manual-index-009",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/property-controller-test.mjs",
      "contract": "elements.get(\"#schema-property-removal-summary\").textContent => /Documentation entries: \\/title/",
      "observable": "elements.get(\"#schema-property-removal-summary\").textContent",
      "expected": "/Documentation entries: \\/title/",
      "binding": "assert.match(removalSummary.textContent, /Documentation entries: \\/title/);"
    },
    {
      "id": "property-filter-removal-copy-manual-index-010",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/property-controller-test.mjs",
      "contract": "uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).workingDraft.document.properties.title => undefined",
      "observable": "uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).workingDraft.document.properties.title",
      "expected": "undefined",
      "binding": "assert.equal(controller.pendingRemoval, undefined);"
    },
    {
      "id": "property-filter-removal-copy-manual-index-011",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "Undo restores the exact property definition",
      "observable": "uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).workingDraft.document.properties.title.type",
      "expected": "\"string\"",
      "binding": "assert.equal(library.activeSchemaId,\"schema:one\");"
    },
    {
      "id": "property-filter-removal-copy-manual-index-012",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "documentationDraft.document.properties.title.type => \"string\"",
      "observable": "documentationDraft.document.properties.title.type",
      "expected": "\"string\"",
      "binding": "assert.equal(propertyCalls.at(-1),\"render-manual\");"
    },
    {
      "id": "property-filter-removal-copy-manual-index-013",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/property-controller-test.mjs",
      "contract": "documentation-only removal leaves the schema property intact",
      "observable": "documentationDraft.documentation.properties",
      "expected": "undefined",
      "binding": "assert.equal(controller.pendingCopy, undefined);"
    },
    {
      "id": "property-filter-removal-copy-manual-index-014",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "elements.get(\"#schema-property-copy-dialog\").open => true",
      "observable": "elements.get(\"#schema-property-copy-dialog\").open",
      "expected": "true",
      "binding": "assert.equal(calls.at(-1),\"restore-revision\");"
    },
    {
      "id": "property-filter-removal-copy-manual-index-015",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "uiController.schemas().find(({ id }) => id === destinationId).workingDraft.document.properties.checkout.type => \"boolean\"",
      "observable": "uiController.schemas().find(({ id }) => id === destinationId).workingDraft.document.properties.checkout.type",
      "expected": "\"boolean\"",
      "binding": "assert.equal(picker.children[0].id, \"schema-property-rule-picker-heading\");"
    },
    {
      "id": "property-filter-removal-copy-manual-index-016",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/property-controller-test.mjs",
      "contract": "property-copy undo restores the complete destination schema state",
      "observable": "uiController.schemas().find(({ id }) => id === destinationId).workingDraft",
      "expected": "undefined",
      "binding": "assert.equal(controller.pendingCopyPosition, undefined);"
    },
    {
      "id": "property-filter-removal-copy-manual-index-017",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "elements.get(\"#confirm-schema-specific-index\").disabled => false",
      "observable": "elements.get(\"#confirm-schema-specific-index\").disabled",
      "expected": "false",
      "binding": "assert.equal(reusableChoice.disabled, false);"
    },
    {
      "id": "property-filter-removal-copy-manual-index-018",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "elements.get(\"#schema-specific-index-dialog\").open => false",
      "observable": "elements.get(\"#schema-specific-index-dialog\").open",
      "expected": "false",
      "binding": "assert.equal(find(picker, \"schema-local-rule-reusable\")?.checked, false);"
    },
    {
      "id": "property-filter-removal-copy-manual-index-019",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "an accepted specific index transitions directly into the controller-owned rule picker",
      "observable": "elements.get(\"#schema-property-rule-picker\").open",
      "expected": "true",
      "binding": "assert.equal(propertyCalls.at(-1),\"confirm-removal\");"
    },
    {
      "id": "property-filter-removal-copy-manual-index-020",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "uiController.rulePickerState().path => \"items.2\"",
      "observable": "uiController.rulePickerState().path",
      "expected": "\"items.2\"",
      "binding": "assert.equal(propertyCalls.at(-1),\"undo-removal\");"
    },
    {
      "id": "property-filter-removal-copy-manual-index-021",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/property-controller-test.mjs",
      "contract": "the dotted controller path retains the accepted canonical array index",
      "observable": "elements.get(\"#schema-property-rule-picker\").dataset.conditionPreview",
      "expected": "/items\\/2/",
      "binding": "assert.match(openedRulePath.replaceAll(\".\", \"/\"), /items\\/2/);"
    },
    {
      "id": "property-filter-removal-copy-manual-index-022",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/property-controller-test.mjs",
      "contract": "closing the owned rule picker clears its transition state without an external callback",
      "observable": "uiController.rulePickerState().path",
      "expected": "undefined",
      "binding": "assert.equal(controller.interactionReturn, undefined);"
    },
    {
      "id": "property-filter-removal-copy-manual-index-023",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/property-controller-test.mjs",
      "contract": "elements.get(\"#schema-manual-property-preview\").textContent => /checkout.total is number/",
      "observable": "elements.get(\"#schema-manual-property-preview\").textContent",
      "expected": "/checkout.total is number/",
      "binding": "assert.match(manualPreview.textContent, /checkout\\.total is number/);"
    },
    {
      "id": "property-filter-removal-copy-manual-index-024",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId) .workingDraft.document.properties.checkout.properties.total.type => \"number\"",
      "observable": "uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId) .workingDraft.document.properties.checkout.properties.total.type",
      "expected": "\"number\"",
      "binding": "assert.equal(find(picker, \"schema-local-rule-message\")?.value, \"\");"
    }
  ]
};
