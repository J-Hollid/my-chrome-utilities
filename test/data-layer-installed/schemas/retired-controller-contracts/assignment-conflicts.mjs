/** Original retired assertions and their exact direct bindings. */
export const group = {
  "group": "assignments and conflicts",
  "lines": "621-638",
  "checks": [
    {
      "id": "assignment-conflicts-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-assignment-controller-contract-test.mjs",
      "contract": "assignedSchema.assignments[0].eventName => \"checkout\"",
      "observable": "assignedSchema.assignments[0].eventName",
      "expected": "\"checkout\"",
      "binding": "assert.equal(assignedSchema.assignments[0].eventName, \"checkout\");"
    },
    {
      "id": "assignment-conflicts-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-assignment-controller-contract-test.mjs",
      "contract": "assignedSchema.assignments[0].versionPolicy => \"follow latest\"",
      "observable": "assignedSchema.assignments[0].versionPolicy",
      "expected": "\"follow latest\"",
      "binding": "assert.equal(assignedSchema.assignments[0].versionPolicy, \"follow latest\");"
    },
    {
      "id": "assignment-conflicts-003",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/retired-assignment-controller-contract-test.mjs",
      "contract": "elements.get(\"#schema-assignment-list\").children[0].children[0].textContent => /gtm\\/checkout/",
      "observable": "elements.get(\"#schema-assignment-list\").children[0].children[0].textContent",
      "expected": "/gtm\\/checkout/",
      "binding": "assert.match(elements.get(\"#schema-assignment-list\").children[0].children[0].textContent, /gtm\\/checkout/);"
    },
    {
      "id": "assignment-conflicts-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-assignment-controller-contract-test.mjs",
      "contract": "assignment duplication preserves the complete assignment contract",
      "observable": "uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).assignments.length",
      "expected": "2",
      "binding": "assert.equal(uiController.schemas().find(({ id }) => id === uiController.state().activeSchemaId).assignments.length, 2, \"assignment duplication preserves the complete assignment contract\");"
    },
    {
      "id": "assignment-conflicts-005",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/retired-assignment-controller-contract-test.mjs",
      "contract": "elements.get(\"#schema-assignment-conflicts\").textContent => /Assignment conflict/",
      "observable": "elements.get(\"#schema-assignment-conflicts\").textContent",
      "expected": "/Assignment conflict/",
      "binding": "assert.match(elements.get(\"#schema-assignment-conflicts\").textContent, /Assignment conflict/);"
    },
    {
      "id": "assignment-conflicts-006",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-assignment-controller-contract-test.mjs",
      "contract": "disabled duplicates no longer conflict",
      "observable": "elements.get(\"#schema-assignment-conflicts\").textContent",
      "expected": "\"\"",
      "binding": "assert.equal(elements.get(\"#schema-assignment-conflicts\").textContent, \"\", \"disabled duplicates no longer conflict\");"
    }
  ]
};
