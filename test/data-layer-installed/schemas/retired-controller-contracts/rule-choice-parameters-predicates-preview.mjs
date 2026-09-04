/** Original retired assertions and their exact direct bindings. */
export const group = {
  "group": "rule choice, parameters, predicates, preview, and reusable metadata",
  "lines": "464-560",
  "checks": [
    {
      "id": "rule-choice-parameters-predicates-preview-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "uiController.attachReusableRule(activeSchemaForRuleIdentity, \"rule:quantities\", \"checkout.total\") => true",
      "observable": "uiController.attachReusableRule(activeSchemaForRuleIdentity, \"rule:quantities\", \"checkout.total\")",
      "expected": "true",
      "binding": "assert.equal(uiController.attachReusableRule(activeSchemaForRuleIdentity, \"rule:quantities\", \"checkout.total\"), true);"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "a reusable rule attached to one property remains available on another compatible property",
      "observable": "findByText(elements.get(\"#schema-property-rule-picker\"), \"Reusable quantities version 3\").disabled",
      "expected": "false",
      "binding": "assert.equal(findByText(elements.get(\"#schema-property-rule-picker\"), \"Reusable quantities version 3\").disabled, false, \"a reusable rule attached to one property remains available on another compatible property\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "canonical dotted and pointer paths identify the same property attachment",
      "observable": "findByText(elements.get(\"#schema-property-rule-picker\"), \"Reusable quantities version 3 · already attached\").disabled",
      "expected": "true",
      "binding": "assert.equal(findByText(elements.get(\"#schema-property-rule-picker\"), \"Reusable quantities version 3 · already attached\").disabled, true, \"canonical dotted and pointer paths identify the same property attachment\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId) .workingDraft.document.properties.items.items.properties.sku.type => \"string\"",
      "observable": "uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId) .workingDraft.document.properties.items.items.properties.sku.type",
      "expected": "\"string\"",
      "binding": "assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId) .workingDraft.document.properties.items.items.properties.sku.type, \"string\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-005",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "elements.get(\"#schema-property-rule-picker\").open => true",
      "observable": "elements.get(\"#schema-property-rule-picker\").open",
      "expected": "true",
      "binding": "assert.equal(elements.get(\"#schema-property-rule-picker\").open, true);"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-006",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "uiController.rulePickerState().configuration.propertyType => \"string\"",
      "observable": "uiController.rulePickerState().configuration.propertyType",
      "expected": "\"string\"",
      "binding": "assert.equal(uiController.rulePickerState().configuration.propertyType, \"string\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-007",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "elements.get(\"#schema-property-rule-picker\").dataset.conditionPreview => /items\\/\\*\\/sku/",
      "observable": "elements.get(\"#schema-property-rule-picker\").dataset.conditionPreview",
      "expected": "/items\\/\\*\\/sku/",
      "binding": "assert.match(elements.get(\"#schema-property-rule-picker\").dataset.conditionPreview, /items\\/\\*\\/sku/);"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-008",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "sampled primitive condition values become typed Equals comparisons",
      "observable": "uiController.conditionPredicate(\"checkout.total\")",
      "expected": "{ operator:\"All\", predicates:[{ propertyPath:\"/checkout/total\", operator:\"Equals\", comparison:{ type:\"number\", value:12 }, }] }",
      "binding": "assert.deepEqual(uiController.conditionPredicate(\"checkout.total\"), { operator:\"All\", predicates:[{ propertyPath:\"/checkout/total\", operator:\"Equals\", comparison:{ type:\"number\", value:12 }, }] }, \"sampled primitive condition values become typed Equals comparisons\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-009",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "rule-picker close owns its state transition after removal of the notification-only port",
      "observable": "uiController.rulePickerState().path",
      "expected": "undefined",
      "binding": "assert.equal(uiController.rulePickerState().path, undefined, \"rule-picker close owns its state transition after removal of the notification-only port\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-010",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "Schemas creates dynamic rule control #${id}",
      "observable": "elements.get(\"#schema-property-rule-picker\").querySelector(`#${id}`)",
      "expected": "truthy",
      "binding": "assert.ok(elements.get(\"#schema-property-rule-picker\").querySelector(`#${id}`), `Schemas creates dynamic rule control #${id}`);"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-011",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "the live conditional editor defaults to another schema property rather than its own consequence",
      "observable": "uiController.rulePickerState().configuration.conditions[0]",
      "expected": "{ propertyPath:\"/title\", operator:\"Exists\", detectedType:\"string\", }",
      "binding": "assert.deepEqual(uiController.rulePickerState().configuration.conditions[0], { propertyPath:\"/title\", operator:\"Exists\", detectedType:\"string\", }, \"the live conditional editor defaults to another schema property rather than its own consequence\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-012",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "uiController.rulePickerState().configuration.conditionGroupOperator => \"Any\"",
      "observable": "uiController.rulePickerState().configuration.conditionGroupOperator",
      "expected": "\"Any\"",
      "binding": "assert.equal(uiController.rulePickerState().configuration.conditionGroupOperator, \"Any\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-013",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "uiController.rulePickerState().configuration.conditions[0].comparison => { type:\"string\", value:\"13\" }",
      "observable": "uiController.rulePickerState().configuration.conditions[0].comparison",
      "expected": "{ type:\"string\", value:\"13\" }",
      "binding": "assert.deepEqual(uiController.rulePickerState().configuration.conditions[0].comparison, { type:\"string\", value:\"13\" });"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-014",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "the live editor adds conditional predicates",
      "observable": "uiController.rulePickerState().configuration.conditions.length",
      "expected": "2",
      "binding": "assert.equal(uiController.rulePickerState().configuration.conditions.length, 2, \"the live editor adds conditional predicates\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-015",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "the live editor removes conditional predicates",
      "observable": "uiController.rulePickerState().configuration.conditions.length",
      "expected": "1",
      "binding": "assert.equal(uiController.rulePickerState().configuration.conditions.length, 1, \"the live editor removes conditional predicates\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-016",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "uiController.rulePickerState().configuration.conditions[0].comparison => undefined",
      "observable": "uiController.rulePickerState().configuration.conditions[0].comparison",
      "expected": "undefined",
      "binding": "assert.equal(uiController.rulePickerState().configuration.conditions[0].comparison, undefined);"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-017",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "the live rule form commits its validated reusable rule through Schema ownership",
      "observable": "uiController.rules().some(({ name }) => name === \"Sampled checkout total\")",
      "expected": "true",
      "binding": "assert.equal(uiController.rules().some(({ name }) => name === \"Sampled checkout total\"), true, \"the live rule form commits its validated reusable rule through Schema ownership\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-018",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "uiController.rules().find(({ name }) => name === \"Sampled checkout total\").severity => \"warning\"",
      "observable": "uiController.rules().find(({ name }) => name === \"Sampled checkout total\").severity",
      "expected": "\"warning\"",
      "binding": "assert.equal(uiController.rules().find(({ name }) => name === \"Sampled checkout total\").severity, \"warning\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-019",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "parameter controls update the live rule configuration",
      "observable": "uiController.rulePickerState().configuration.exactValue",
      "expected": "\"12\"",
      "binding": "assert.equal(uiController.rulePickerState().configuration.exactValue, \"12\", \"parameter controls update the live rule configuration\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-020",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "uiController.rulePickerState().configuration.allowedValues => [\"12\", \"13\"]",
      "observable": "uiController.rulePickerState().configuration.allowedValues",
      "expected": "[\"12\", \"13\"]",
      "binding": "assert.deepEqual(uiController.rulePickerState().configuration.allowedValues, [\"12\", \"13\"]);"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-021",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "uiController.rulePickerState().configuration.allowedValues => [\"13\"]",
      "observable": "uiController.rulePickerState().configuration.allowedValues",
      "expected": "[\"13\"]",
      "binding": "assert.deepEqual(uiController.rulePickerState().configuration.allowedValues, [\"13\"]);"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-022",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "elements.get(\"#schema-property-rule-picker\").querySelector(\"#schema-property-rule-picker-heading\") => truthy",
      "observable": "elements.get(\"#schema-property-rule-picker\").querySelector(\"#schema-property-rule-picker-heading\")",
      "expected": "truthy",
      "binding": "assert.ok(elements.get(\"#schema-property-rule-picker\").querySelector(\"#schema-property-rule-picker-heading\"));"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-023",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "Schemas preserves the dynamic legacy rule-results ID when returning to rule choices",
      "observable": "elements.get(\"#schema-property-rule-picker\").querySelector(\"#schema-property-rule-results\")",
      "expected": "truthy",
      "binding": "assert.ok(elements.get(\"#schema-property-rule-picker\").querySelector(\"#schema-property-rule-results\"), \"Schemas preserves the dynamic legacy rule-results ID when returning to rule choices\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-024",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "elements.get(\"#schema-property-rule-picker\").children[2].children[0].id => \"schema-property-rule-empty\"",
      "observable": "elements.get(\"#schema-property-rule-picker\").children[2].children[0].id",
      "expected": "\"schema-property-rule-empty\"",
      "binding": "assert.equal(elements.get(\"#schema-property-rule-picker\").children[2].children[0].id, \"schema-property-rule-empty\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-025",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "elements.get(\"#schema-property-rule-picker\").children[2].children[1].textContent => \"Clear search\"",
      "observable": "elements.get(\"#schema-property-rule-picker\").children[2].children[1].textContent",
      "expected": "\"Clear search\"",
      "binding": "assert.equal(elements.get(\"#schema-property-rule-picker\").children[2].children[1].textContent, \"Clear search\");"
    },
    {
      "id": "rule-choice-parameters-predicates-preview-026",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/retired-rule-choice-controller-contract-test.mjs",
      "contract": "clearing restores compatible rule choices",
      "observable": "elements.get(\"#schema-property-rule-picker\").children[2].children.length > 1",
      "expected": "truthy",
      "binding": "assert.ok(elements.get(\"#schema-property-rule-picker\").children[2].children.length > 1, \"clearing restores compatible rule choices\");"
    }
  ]
};
