/** Original retired assertions and their direct executable owners. */
export const group = {
  "group": "public composition, persistence, and remount",
  "lines": "1-49",
  "checks": [
    {
      "id": "public-composition-persistence-remount-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "controller.state().draftDirty => true",
      "observable": "controller.state().draftDirty",
      "expected": "true"
    },
    {
      "id": "public-composition-persistence-remount-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "unassigned events retain the exact validation contract",
      "observable": "evaluation.state",
      "expected": "\"Not checked\""
    },
    {
      "id": "public-composition-persistence-remount-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "Schemas exclusively owns draft publication",
      "observable": "published.version",
      "expected": "2"
    },
    {
      "id": "public-composition-persistence-remount-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "published.document.required[0] => \"title\"",
      "observable": "published.document.required[0]",
      "expected": "\"title\""
    },
    {
      "id": "public-composition-persistence-remount-005",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "schema persistence stages changed schemas before migration-only settled projections",
      "observable": "untouchedSchemaProjectionPreserved",
      "expected": "true"
    },
    {
      "id": "public-composition-persistence-remount-006",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "changed >= 3 => truthy",
      "observable": "changed >= 3",
      "expected": "truthy"
    },
    {
      "id": "public-composition-persistence-remount-007",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "controller.state().activeSchemaId => \"schema:page\"",
      "observable": "controller.state().activeSchemaId",
      "expected": "\"schema:page\""
    },
    {
      "id": "public-composition-persistence-remount-008",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "controller.state().draftDirty => false",
      "observable": "controller.state().draftDirty",
      "expected": "false"
    }
  ]
};
