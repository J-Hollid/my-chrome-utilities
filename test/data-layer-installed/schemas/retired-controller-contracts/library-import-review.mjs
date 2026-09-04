/** Original retired assertions and their exact direct bindings. */
export const group = {
  "group": "library import review",
  "lines": "639-645",
  "checks": [
    {
      "id": "library-import-review-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-library-import-controller-contract-test.mjs",
      "contract": "elements.get(\"#schema-import-review\").open => true",
      "observable": "elements.get(\"#schema-import-review\").open",
      "expected": "true",
      "binding": "assert.equal(elements.get(\"#schema-import-review\").open, true);"
    },
    {
      "id": "library-import-review-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-library-import-controller-contract-test.mjs",
      "contract": "cancel leaves both libraries untouched",
      "observable": "uiController.schemas().some(({ id }) => id === importedSchema.id)",
      "expected": "false",
      "binding": "assert.equal(uiController.schemas().some(({ id }) => id === importedSchema.id), false, \"cancel leaves both libraries untouched\");"
    },
    {
      "id": "library-import-review-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-library-import-controller-contract-test.mjs",
      "contract": "uiController.schemas().some(({ id }) => id === importedSchema.id) => true",
      "observable": "uiController.schemas().some(({ id }) => id === importedSchema.id)",
      "expected": "true",
      "binding": "assert.equal(uiController.schemas().some(({ id }) => id === importedSchema.id), true);"
    }
  ]
};
