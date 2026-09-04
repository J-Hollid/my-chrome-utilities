/** Original retired assertions and their direct executable owners. */
export const group = {
  "group": "library deletion review",
  "lines": "646-651",
  "checks": [
    {
      "id": "library-deletion-review-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-deletion-workflow-test.mjs",
      "contract": "uiController.requestDeletion(importedSchema.id) => true",
      "observable": "uiController.requestDeletion(importedSchema.id)",
      "expected": "true"
    },
    {
      "id": "library-deletion-review-002",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/library-deletion-workflow-test.mjs",
      "contract": "elements.get(\"#schema-delete-review-summary\").textContent => /Imported v1/",
      "observable": "elements.get(\"#schema-delete-review-summary\").textContent",
      "expected": "/Imported v1/"
    },
    {
      "id": "library-deletion-review-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-deletion-workflow-test.mjs",
      "contract": "uiController.schemas().some(({ id }) => id === importedSchema.id) => true",
      "observable": "uiController.schemas().some(({ id }) => id === importedSchema.id)",
      "expected": "true"
    },
    {
      "id": "library-deletion-review-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/relationship-tree-controller-test.mjs",
      "contract": "uiController.schemas().some(({ id }) => id === importedSchema.id) => false",
      "observable": "uiController.schemas().some(({ id }) => id === importedSchema.id)",
      "expected": "false"
    }
  ]
};
