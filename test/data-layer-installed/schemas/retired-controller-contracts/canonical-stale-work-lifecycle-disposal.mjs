/** Original retired assertions and their exact direct bindings. */
export const group = {
  "group": "canonical stale-work and aggregate lifecycle disposal",
  "lines": "927-946",
  "checks": [
    {
      "id": "canonical-stale-work-lifecycle-disposal-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "uiController.openSavedCanonical(persistenceSchemaId) => true",
      "observable": "uiController.openSavedCanonical(persistenceSchemaId)",
      "expected": "true",
      "binding": "assert.equal(lifecycle.mount(), true);"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/assignment-controller-test.mjs",
      "contract": "Schemas removes its on-demand canonical table host during disposal",
      "observable": "elements.get(\"#schema-editor\").querySelector(\"#compact-canonical-table-editor\")",
      "expected": "undefined",
      "binding": "assert.equal(behaviorController.editing,undefined);"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "a settlement completing after disposal cannot reopen stale canonical UI",
      "observable": "elements.get(\"#compact-canonical-context\").hidden",
      "expected": "true",
      "binding": "assert.equal(actions, 1, \"one input runs one owned action\");"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-004",
      "method": "notEqual",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "a durable hydration settling after disposal cannot render stale project state",
      "observable": "elements.get(\"#schema-result\").textContent",
      "expected": "\"Loaded schema contributors for Stale Project.\"",
      "binding": "assert.notEqual(firstGeneration, lifecycle.generation(), \"a remount changes the direct lifecycle generation\");"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-005",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "String(await disposedRejection) => /disposed before durable persistence settled/",
      "observable": "String(await disposedRejection)",
      "expected": "/disposed before durable persistence settled/",
      "binding": "assert.match(String(lifecycle.generation()), /^\\d+$/, \"the direct lifecycle exposes a numeric generation\");"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-006",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "disposal detaches the durable persistence port",
      "observable": "persistenceListener",
      "expected": "undefined",
      "binding": "assert.equal(controller.pendingBase, undefined);"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-007",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "Schemas disposes the layered Profile editor with its owner lifecycle",
      "observable": "layeredProfileDisposals",
      "expected": "1",
      "binding": "assert.equal(lifecycle.dispose(), true);"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-008",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "disposal removes the guided continuation choice listener",
      "observable": "guidedChoice.listenerCount()",
      "expected": "0",
      "binding": "assert.equal(actions, 1, \"dispose removes the owned listener\");"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-009",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "disposal removes the open allowed-value dialog listeners",
      "observable": "expansionConfirm.listenerCount()",
      "expected": "0",
      "binding": "assert.equal(lifecycle.mount(), true);"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-010",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "Schemas removes every editor and revision listener it owns",
      "observable": "retainedSchemaListeners",
      "expected": "[]",
      "binding": "assert.deepEqual([lifecycle.isCurrent(firstGeneration), actions], [false, 2], \"the direct lifecycle rejects stale work and retains only owned actions\");"
    }
  ]
};
