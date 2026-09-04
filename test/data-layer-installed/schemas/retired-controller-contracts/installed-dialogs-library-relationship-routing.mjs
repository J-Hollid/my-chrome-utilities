/** Original retired assertions and their direct executable owners. */
export const group = {
  "group": "installed dialogs, library projection, and relationship routing",
  "lines": "210-246",
  "checks": [
    {
      "id": "installed-dialogs-library-relationship-routing-001",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/relationship-tree-controller-test.mjs",
      "contract": "Schemas creates ${selector} from a minimal dialog host",
      "observable": "created",
      "expected": "truthy"
    },
    {
      "id": "installed-dialogs-library-relationship-routing-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/editor-route-controller-test.mjs",
      "contract": "Schemas preserves the installed browser contract for rule revision confirmation",
      "observable": "elements.get(\"#confirm-schema-rule-revision-review\").id",
      "expected": "\"confirm-schema-rule-revision-review\""
    },
    {
      "id": "installed-dialogs-library-relationship-routing-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/editor-route-controller-test.mjs",
      "contract": "Schemas mounts the layered Profile editor exactly once",
      "observable": "layeredProfileMounts",
      "expected": "1"
    },
    {
      "id": "installed-dialogs-library-relationship-routing-004",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "Schemas replaces the legacy rule-kind choices with canonical value types at its installed boundary",
      "observable": "elements.get(\"#schema-rule-types\").children.map(({ value }) => value)",
      "expected": "[\"string\", \"number\", \"boolean\", \"object\", \"array\"]"
    },
    {
      "id": "installed-dialogs-library-relationship-routing-005",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-import-workflow-test.mjs",
      "contract": "Schemas migrates parameter-backed reusable allowed values at the installed storage boundary",
      "observable": "uiController.rules().find(({ id }) => id === \"rule:quantities\")?.allowedValues",
      "expected": "[1, 2]"
    },
    {
      "id": "installed-dialogs-library-relationship-routing-006",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/editor-route-controller-test.mjs",
      "contract": "uiController.rules().find(({ id }) => id === \"rule:quantities\")?.parameters => undefined",
      "observable": "uiController.rules().find(({ id }) => id === \"rule:quantities\")?.parameters",
      "expected": "undefined"
    },
    {
      "id": "installed-dialogs-library-relationship-routing-007",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "Schemas persists the canonical reusable-rule migration for future installed owners",
      "observable": "JSON.parse(uiValues.get(\"my-chrome-utilities.schema-rule-library.v1\")) .find(({ id }) => id === \"rule:quantities\").allowedValues",
      "expected": "[1, 2]"
    },
    {
      "id": "installed-dialogs-library-relationship-routing-008",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/editor-route-controller-test.mjs",
      "contract": "elements.get(\"#schema-result\").textContent => \"Loaded schema contributors for Project One.\"",
      "observable": "elements.get(\"#schema-result\").textContent",
      "expected": "\"Loaded schema contributors for Project One.\""
    },
    {
      "id": "installed-dialogs-library-relationship-routing-009",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas/relationship-tree-controller-test.mjs",
      "contract": "the Schema owner renders saved relationship-tree rows",
      "observable": "initialSavedRow",
      "expected": "truthy"
    },
    {
      "id": "installed-dialogs-library-relationship-routing-010",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-editor-relationship-factory-test.mjs",
      "contract": "relationshipActions => [\"adopt:schema:page\", \"build:schema:page:published:1\", \"missing:schema:page\"]",
      "observable": "relationshipActions",
      "expected": "[\"adopt:schema:page\", \"build:schema:page:published:1\", \"missing:schema:page\"]"
    },
    {
      "id": "installed-dialogs-library-relationship-routing-011",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/relationship-tree-controller-test.mjs",
      "contract": "elements.get(\"#schema-specification-builder\").hidden => false",
      "observable": "elements.get(\"#schema-specification-builder\").hidden",
      "expected": "false"
    },
    {
      "id": "installed-dialogs-library-relationship-routing-012",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/editor-route-controller-test.mjs",
      "contract": "elements.get(\"#schema-specification-builder\").hidden => true",
      "observable": "elements.get(\"#schema-specification-builder\").hidden",
      "expected": "true"
    },
    {
      "id": "installed-dialogs-library-relationship-routing-013",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "relationshipActions.slice(-2) => [\"open:pages:checkout\", \"studio:pages:checkout\"]",
      "observable": "relationshipActions.slice(-2)",
      "expected": "[\"open:pages:checkout\", \"studio:pages:checkout\"]"
    },
    {
      "id": "installed-dialogs-library-relationship-routing-014",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/relationship-tree-controller-test.mjs",
      "contract": "opening a relationship-tree contributor marks its installed row as selected",
      "observable": "elements.get(\"#schema-list\").children.find(({ dataset }) => dataset.schemaEntryKey === \"pages:checkout\").getAttribute(\"aria-selected\")",
      "expected": "\"true\""
    },
    {
      "id": "installed-dialogs-library-relationship-routing-015",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/relationship-tree-controller-test.mjs",
      "contract": "uiValues.get(\"view:my-chrome-utilities.schema-relationship-tree-view.v1:project:one\") => /\"scrollTop\":37/",
      "observable": "uiValues.get(\"view:my-chrome-utilities.schema-relationship-tree-view.v1:project:one\")",
      "expected": "/\"scrollTop\":37/"
    },
    {
      "id": "installed-dialogs-library-relationship-routing-016",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/editor-route-controller-test.mjs",
      "contract": "tree keyboard navigation remains controller-owned",
      "observable": "treeControls.at(-1).focused",
      "expected": "true"
    }
  ]
};
