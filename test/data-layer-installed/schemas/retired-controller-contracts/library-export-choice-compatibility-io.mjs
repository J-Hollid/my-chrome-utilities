/** Original retired assertions and their direct executable owners. */
export const group = {
  "group": "library export choice, compatibility, IO, status, and focus",
  "lines": "652-675",
  "checks": [
    {
      "id": "library-export-choice-compatibility-io-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-policy-test.mjs",
      "contract": "uiController.openExportChoices() => true",
      "observable": "uiController.openExportChoices()",
      "expected": "true"
    },
    {
      "id": "library-export-choice-compatibility-io-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-export-workflow-test.mjs",
      "contract": "elements.get(\"#schema-export-choices\").open => true",
      "observable": "elements.get(\"#schema-export-choices\").open",
      "expected": "true"
    },
    {
      "id": "library-export-choice-compatibility-io-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-export-workflow-test.mjs",
      "contract": "elements.get(\"#schema-export-choices\").children[0].textContent => \"Export Schema Library\"",
      "observable": "elements.get(\"#schema-export-choices\").children[0].textContent",
      "expected": "\"Export Schema Library\""
    },
    {
      "id": "library-export-choice-compatibility-io-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-export-workflow-test.mjs",
      "contract": "elements.get(\"#schema-export-choices\").children[3].textContent => \"JSON Schema Draft 2020-12 bundle\"",
      "observable": "elements.get(\"#schema-export-choices\").children[3].textContent",
      "expected": "\"JSON Schema Draft 2020-12 bundle\""
    },
    {
      "id": "library-export-choice-compatibility-io-005",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-policy-test.mjs",
      "contract": "elements.get(\"#schema-export-choices\").children[4].textContent => \"For third-party standards-based validation; not extension configuration.\"",
      "observable": "elements.get(\"#schema-export-choices\").children[4].textContent",
      "expected": "\"For third-party standards-based validation; not extension configuration.\""
    },
    {
      "id": "library-export-choice-compatibility-io-006",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-policy-test.mjs",
      "contract": "cancelled export produces no download",
      "observable": "schemaDownloads",
      "expected": "[]"
    },
    {
      "id": "library-export-choice-compatibility-io-007",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-export-workflow-test.mjs",
      "contract": "elements.get(\"#schema-export-compatibility-review\").open => true",
      "observable": "elements.get(\"#schema-export-compatibility-review\").open",
      "expected": "true"
    },
    {
      "id": "library-export-choice-compatibility-io-008",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-export-workflow-test.mjs",
      "contract": "elements.get(\"#schema-export-compatibility-review\").children[0].textContent => \"JSON Schema Draft 2020-12 compatibility review\"",
      "observable": "elements.get(\"#schema-export-compatibility-review\").children[0].textContent",
      "expected": "\"JSON Schema Draft 2020-12 compatibility review\""
    },
    {
      "id": "library-export-choice-compatibility-io-009",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "elements.get(\"#schema-export-compatibility-review\").children[2][\"aria-label\"] => \"Standard export conversions\"",
      "observable": "elements.get(\"#schema-export-compatibility-review\").children[2][\"aria-label\"]",
      "expected": "\"Standard export conversions\""
    },
    {
      "id": "library-export-choice-compatibility-io-010",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-export-workflow-test.mjs",
      "contract": "uiController.omittedRuleStatus(1) => \"1 omitted rule\"",
      "observable": "uiController.omittedRuleStatus(1)",
      "expected": "\"1 omitted rule\""
    },
    {
      "id": "library-export-choice-compatibility-io-011",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/library-policy-test.mjs",
      "contract": "confirmed standard export crosses the typed download port",
      "observable": "schemaDownloads[0]",
      "expected": "/schema.*\\.json/"
    },
    {
      "id": "library-export-choice-compatibility-io-012",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-export-workflow-test.mjs",
      "contract": "elements.get(\"#schema-result\").textContent => `Exported JSON Schema Draft 2020-12 bundle · ${publishedExportCount} schemas · 2 omitted rules.`",
      "observable": "elements.get(\"#schema-result\").textContent",
      "expected": "`Exported JSON Schema Draft 2020-12 bundle · ${publishedExportCount} schemas · 2 omitted rules.`"
    },
    {
      "id": "library-export-choice-compatibility-io-013",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-policy-test.mjs",
      "contract": "export completion restores trigger focus without scrolling",
      "observable": "elements.get(\"#export-schema\").focusOptions",
      "expected": "{preventScroll:true}"
    },
    {
      "id": "library-export-choice-compatibility-io-014",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-export-workflow-test.mjs",
      "contract": "elements.get(\"#schema-result\").textContent => `Exported Extension backup · ${uiController.schemas().length} schemas and ${uiController.rules().length} rules.`",
      "observable": "elements.get(\"#schema-result\").textContent",
      "expected": "`Exported Extension backup · ${uiController.schemas().length} schemas and ${uiController.rules().length} rules.`"
    },
    {
      "id": "library-export-choice-compatibility-io-015",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-policy-test.mjs",
      "contract": "elements.get(\"#schema-result\").textContent => `Exported Extension schema package · ${exportedSchema.name} revision ${exportedSchema.version}.`",
      "observable": "elements.get(\"#schema-result\").textContent",
      "expected": "`Exported Extension schema package · ${exportedSchema.name} revision ${exportedSchema.version}.`"
    },
    {
      "id": "library-export-choice-compatibility-io-016",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-policy-test.mjs",
      "contract": "elements.get(\"#schema-result\").textContent => `Exported JSON Schema Draft 2020-12 · ${exportedSchema.name} revision ${exportedSchema.version} · 0 omitted rules.`",
      "observable": "elements.get(\"#schema-result\").textContent",
      "expected": "`Exported JSON Schema Draft 2020-12 · ${exportedSchema.name} revision ${exportedSchema.version} · 0 omitted rules.`"
    }
  ]
};
