/** Original retired assertions and their direct executable owners. */
export const group = {
  "group": "assignments and conflicts",
  "lines": "621-638",
  "checks": [
    {
      "id": "assignment-conflicts-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/validation-controller-test.mjs",
      "contract": "assignedSchema.assignments[0].eventName => \"checkout\"",
      "observable": "assignedSchema.assignments[0].eventName",
      "expected": "\"checkout\""
    },
    {
      "id": "assignment-conflicts-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/assignment-controller-test.mjs",
      "contract": "assignedSchema.assignments[0].versionPolicy => \"follow latest\"",
      "observable": "assignedSchema.assignments[0].versionPolicy",
      "expected": "\"follow latest\""
    },
    {
      "id": "assignment-conflicts-003",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/rule-picker-views-test.mjs",
      "contract": "elements.get(\"#schema-assignment-list\").children[0].children[0].textContent => /gtm\\/checkout/",
      "observable": "elements.get(\"#schema-assignment-list\").children[0].children[0].textContent",
      "expected": "/gtm\\/checkout/"
    },
    {
      "id": "assignment-conflicts-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/assignment-controller-test.mjs",
      "contract": "assignment duplication preserves the complete assignment contract",
      "observable": "uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).assignments.length",
      "expected": "2"
    },
    {
      "id": "assignment-conflicts-005",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/library-export-workflow-test.mjs",
      "contract": "elements.get(\"#schema-assignment-conflicts\").textContent => /Assignment conflict/",
      "observable": "elements.get(\"#schema-assignment-conflicts\").textContent",
      "expected": "/Assignment conflict/"
    },
    {
      "id": "assignment-conflicts-006",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/assignment-controller-test.mjs",
      "contract": "disabled duplicates no longer conflict",
      "observable": "elements.get(\"#schema-assignment-conflicts\").textContent",
      "expected": "\"\""
    }
  ]
};
