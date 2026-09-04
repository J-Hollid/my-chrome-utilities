/** Original retired assertions and their direct executable owners. */
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
      "expected": "first"
    },
    {
      "id": "project-hydration-durable-recovery-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/project-hydration-test.mjs",
      "contract": "one project reuses its active contributor hydration",
      "observable": "slot.run(\"project:first\", () => Promise.reject(new Error(\"duplicate hydration started\")))",
      "expected": "first"
    },
    {
      "id": "project-hydration-durable-recovery-003",
      "method": "notEqual",
      "owner": "test/data-layer-installed/schemas/project-hydration-test.mjs",
      "contract": "a new active project supersedes an older contributor hydration",
      "observable": "second",
      "expected": "first"
    },
    {
      "id": "project-hydration-durable-recovery-004",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/project-hydration-test.mjs",
      "contract": "settlement from an older project cannot clear the newer hydration",
      "observable": "slot.run(\"project:second\", () => Promise.reject(new Error(\"superseding hydration was lost\")))",
      "expected": "second"
    },
    {
      "id": "project-hydration-durable-recovery-005",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "the installed contributor projection retains its bounded compatibility fallback before durable hydration",
      "observable": "contributors.currentProject()",
      "expected": "compatibilityProject"
    },
    {
      "id": "project-hydration-durable-recovery-006",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "await contributors.ensureProjectContributors(\"project:one\") => { name:\"Durable\" }",
      "observable": "await contributors.ensureProjectContributors(\"project:one\")",
      "expected": "{ name:\"Durable\" }"
    },
    {
      "id": "project-hydration-durable-recovery-007",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "durable contributor hydration refreshes the installed project-library projection",
      "observable": "capturedProject",
      "expected": "[durableProject,7]"
    },
    {
      "id": "project-hydration-durable-recovery-008",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "relationship-tree reads use the freshly hydrated durable project instead of the stale compatibility snapshot",
      "observable": "contributors.currentProject()",
      "expected": "durableProject"
    },
    {
      "id": "project-hydration-durable-recovery-009",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "durable subscription updates replace the active contributor projection",
      "observable": "contributors.currentProject()",
      "expected": "refreshedProject"
    },
    {
      "id": "project-hydration-durable-recovery-010",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "a notification for another project cannot replace the active contributor projection",
      "observable": "contributors.currentProject()",
      "expected": "refreshedProject"
    },
    {
      "id": "project-hydration-durable-recovery-011",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "a durable schema failure pauses the installed Schema transaction",
      "observable": "persistenceEvents",
      "expected": "[\"failed\"]"
    },
    {
      "id": "project-hydration-durable-recovery-012",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "recovery.kind => \"saved-schema\"",
      "observable": "recovery.kind",
      "expected": "\"saved-schema\""
    },
    {
      "id": "project-hydration-durable-recovery-013",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "downloaded => \"serialized batch\"",
      "observable": "downloaded",
      "expected": "\"serialized batch\""
    },
    {
      "id": "project-hydration-durable-recovery-014",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-policy-test.mjs",
      "contract": "Retry feedback waits for the installed Schema owner to settle its queued latest projection",
      "observable": "recoverySettled",
      "expected": "false"
    },
    {
      "id": "project-hydration-durable-recovery-015",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "retried => 1",
      "observable": "retried",
      "expected": "1"
    },
    {
      "id": "project-hydration-durable-recovery-016",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "Retry settles through both durable observation and explicit recovery acknowledgement",
      "observable": "persistenceEvents",
      "expected": "[\"failed\", \"saved\", \"retried\"]"
    },
    {
      "id": "project-hydration-durable-recovery-017",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/library-controller-test.mjs",
      "contract": "rejected => 1",
      "observable": "rejected",
      "expected": "1"
    },
    {
      "id": "project-hydration-durable-recovery-018",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/installed-editor-workflow-test.mjs",
      "contract": "persistenceEvents.at(-1) => \"rejected\"",
      "observable": "persistenceEvents.at(-1)",
      "expected": "\"rejected\""
    }
  ]
};
