/** Original retired assertions and their exact direct bindings. */
export const group = {
  "group": "project hydration slot and durable persistence recovery",
  "lines": "947-1040",
  "checks": [
    {
      "id": "project-hydration-durable-recovery-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/project-hydration-test.mjs",
      "contract": "synchronous project notifications reuse the active contributor hydration",
      "observable": "reentered",
      "expected": "first",
      "binding": "assert.equal( reentered, first, \"synchronous project notifications reuse the active hydration\", );"
    },
    {
      "id": "project-hydration-durable-recovery-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/project-hydration-test.mjs",
      "contract": "one project reuses its active contributor hydration",
      "observable": "slot.run(\"project:first\", () => Promise.reject(new Error(\"duplicate hydration started\")))",
      "expected": "first",
      "binding": "assert.equal( slot.run(\"project:first\", () => Promise.reject(new Error(\"duplicate hydration started\")), ), first, \"one project reuses its active contributor hydration\", );"
    },
    {
      "id": "project-hydration-durable-recovery-003",
      "method": "notEqual",
      "owner": "test/data-layer-installed/schemas/project-hydration-test.mjs",
      "contract": "a new active project supersedes an older contributor hydration",
      "observable": "second",
      "expected": "first",
      "binding": "assert.notEqual( second, first, \"a new active project supersedes the older hydration\", );"
    },
    {
      "id": "project-hydration-durable-recovery-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/project-hydration-test.mjs",
      "contract": "settlement from an older project cannot clear the newer hydration",
      "observable": "slot.run(\"project:second\", () => Promise.reject(new Error(\"superseding hydration was lost\")))",
      "expected": "second",
      "binding": "assert.equal( slot.run(\"project:second\", () => Promise.reject(new Error(\"superseding hydration was lost\")), ), second, \"an old settlement cannot clear the new hydration\", );"
    },
    {
      "id": "project-hydration-durable-recovery-005",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "the installed contributor projection retains its bounded compatibility fallback before durable hydration",
      "observable": "contributors.currentProject()",
      "expected": "compatibilityProject",
      "binding": "assert.equal(library.activeIndex(), -1);"
    },
    {
      "id": "project-hydration-durable-recovery-006",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "await contributors.ensureProjectContributors(\"project:one\") => { name:\"Durable\" }",
      "observable": "await contributors.ensureProjectContributors(\"project:one\")",
      "expected": "{ name:\"Durable\" }",
      "binding": "assert.deepEqual(changed, [[first.id, second.id]]);"
    },
    {
      "id": "project-hydration-durable-recovery-007",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "durable contributor hydration refreshes the installed project-library projection",
      "observable": "capturedProject",
      "expected": "[durableProject,7]",
      "binding": "assert.deepEqual(library.active(), library.draft, \"a transient draft remains the active library projection\");"
    },
    {
      "id": "project-hydration-durable-recovery-008",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "relationship-tree reads use the freshly hydrated durable project instead of the stale compatibility snapshot",
      "observable": "contributors.currentProject()",
      "expected": "durableProject",
      "binding": "assert.equal(library.active().id, first.id);"
    },
    {
      "id": "project-hydration-durable-recovery-009",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "durable subscription updates replace the active contributor projection",
      "observable": "contributors.currentProject()",
      "expected": "refreshedProject",
      "binding": "assert.equal(library.schemas[0].name, \"Second\", \"the Schema Library exposes a cloned read-only projection\");"
    },
    {
      "id": "project-hydration-durable-recovery-010",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "a notification for another project cannot replace the active contributor projection",
      "observable": "contributors.currentProject()",
      "expected": "refreshedProject",
      "binding": "assert.equal(library.active().name, \"First\");"
    },
    {
      "id": "project-hydration-durable-recovery-011",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "a durable schema failure pauses the installed Schema transaction",
      "observable": "persistenceEvents",
      "expected": "[\"failed\"]",
      "binding": "assert.deepEqual( sourceLibrary.schemas, libraryBeforeSource, \"canceling a source draft keeps the stored library unchanged\", );"
    },
    {
      "id": "project-hydration-durable-recovery-012",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "recovery.kind => \"saved-schema\"",
      "observable": "recovery.kind",
      "expected": "\"saved-schema\"",
      "binding": "assert.equal(library.serialize(), JSON.stringify([second]));"
    },
    {
      "id": "project-hydration-durable-recovery-013",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "downloaded => \"serialized batch\"",
      "observable": "downloaded",
      "expected": "\"serialized batch\"",
      "binding": "assert.equal(library.activeSchemaId, second.id);"
    },
    {
      "id": "project-hydration-durable-recovery-014",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-policy-test.mjs",
      "contract": "Retry feedback waits for the installed Schema owner to settle its queued latest projection",
      "observable": "recoverySettled",
      "expected": "false",
      "binding": "assert.equal(applySchemaDeletion([first, second], second.id, first).clearSelection, false);"
    },
    {
      "id": "project-hydration-durable-recovery-015",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "retried => 1",
      "observable": "retried",
      "expected": "1",
      "binding": "assert.equal(library.activeIndex(), 0);"
    },
    {
      "id": "project-hydration-durable-recovery-016",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "Retry settles through both durable observation and explicit recovery acknowledgement",
      "observable": "persistenceEvents",
      "expected": "[\"failed\", \"saved\", \"retried\"]",
      "binding": "assert.deepEqual( sourceLibrary.schemas, libraryBeforeSource, \"discarding a source draft keeps the stored library unchanged\", );"
    },
    {
      "id": "project-hydration-durable-recovery-017",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "rejected => 1",
      "observable": "rejected",
      "expected": "1",
      "binding": "assert.equal(library.active().id, second.id);"
    },
    {
      "id": "project-hydration-durable-recovery-018",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "persistenceEvents.at(-1) => \"rejected\"",
      "observable": "persistenceEvents.at(-1)",
      "expected": "\"rejected\"",
      "binding": "assert.equal(propertyCalls.at(-2),\"prevent-default\");"
    }
  ]
};
