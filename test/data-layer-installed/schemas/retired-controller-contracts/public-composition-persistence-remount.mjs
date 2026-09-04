/** Original retired assertions and their exact direct bindings. */
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
      "expected": "true",
      "binding": "assert.equal(controller.state().draftDirty, true);"
    },
    {
      "id": "public-composition-persistence-remount-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "unassigned events retain the exact validation contract",
      "observable": "evaluation.state",
      "expected": "\"Not checked\"",
      "binding": "assert.equal(evaluation.state, \"Not checked\", \"unassigned events retain the exact validation contract\");"
    },
    {
      "id": "public-composition-persistence-remount-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "Schemas exclusively owns draft publication",
      "observable": "published.version",
      "expected": "2",
      "binding": "assert.equal(published.version, 2, \"Schemas exclusively owns draft publication\");"
    },
    {
      "id": "public-composition-persistence-remount-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "published.document.required[0] => \"title\"",
      "observable": "published.document.required[0]",
      "expected": "\"title\"",
      "binding": "assert.equal(published.document.required[0], \"title\");"
    },
    {
      "id": "public-composition-persistence-remount-005",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "schema persistence stages changed schemas before migration-only settled projections",
      "observable": "untouchedSchemaProjectionPreserved",
      "expected": "true",
      "binding": "assert.equal(persistedSchemas[0].id === schema.id && persistedSchemas[1].id === untouchedSchema.id, true, \"schema persistence stages changed schemas before migration-only settled projections\");"
    },
    {
      "id": "public-composition-persistence-remount-006",
      "method": "ok",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "changed >= 3 => truthy",
      "observable": "changed >= 3",
      "expected": "truthy",
      "binding": "assert.ok(changed >= 3);"
    },
    {
      "id": "public-composition-persistence-remount-007",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "controller.state().activeSchemaId => \"schema:page\"",
      "observable": "controller.state().activeSchemaId",
      "expected": "\"schema:page\"",
      "binding": "assert.equal(controller.state().activeSchemaId, \"schema:page\");"
    },
    {
      "id": "public-composition-persistence-remount-008",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas-composition-test.mjs",
      "contract": "controller.state().draftDirty => false",
      "observable": "controller.state().draftDirty",
      "expected": "false",
      "binding": "assert.equal(controller.state().draftDirty, false);"
    }
  ]
};
