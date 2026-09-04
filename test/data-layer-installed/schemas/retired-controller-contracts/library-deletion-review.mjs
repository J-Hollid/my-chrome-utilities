/** Original retired assertions and their exact direct bindings. */
export const group = {
  "group": "library deletion review",
  "lines": "646-651",
  "checks": [
    {
      "id": "library-deletion-review-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-library-deletion-controller-contract-test.mjs",
      "contract": "uiController.requestDeletion(importedSchema.id) => true",
      "observable": "uiController.requestDeletion(importedSchema.id)",
      "expected": "true",
      "binding": "assert.equal(uiController.requestDeletion(importedSchema.id), true);"
    },
    {
      "id": "library-deletion-review-002",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/retired-library-deletion-controller-contract-test.mjs",
      "contract": "elements.get(\"#schema-delete-review-summary\").textContent => /Imported v1/",
      "observable": "elements.get(\"#schema-delete-review-summary\").textContent",
      "expected": "/Imported v1/",
      "binding": "assert.match(elements.get(\"#schema-delete-review-summary\").textContent, /Imported v1/);"
    },
    {
      "id": "library-deletion-review-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-library-deletion-controller-contract-test.mjs",
      "contract": "uiController.schemas().some(({ id }) => id === importedSchema.id) => true",
      "observable": "uiController.schemas().some(({ id }) => id === importedSchema.id)",
      "expected": "true",
      "binding": "assert.equal(uiController.schemas().some(({ id }) => id === importedSchema.id), true);"
    },
    {
      "id": "library-deletion-review-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-library-deletion-controller-contract-test.mjs",
      "contract": "uiController.schemas().some(({ id }) => id === importedSchema.id) => false",
      "observable": "uiController.schemas().some(({ id }) => id === importedSchema.id)",
      "expected": "false",
      "binding": "assert.equal(uiController.schemas().some(({ id }) => id === importedSchema.id), false);"
    }
  ]
};
