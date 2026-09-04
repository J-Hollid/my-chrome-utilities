/** Original retired assertions and their exact direct bindings. */
export const group = {
  "group": "canonical stale-work and aggregate lifecycle disposal",
  "lines": "927-946",
  "checks": [
    {
      "id": "canonical-stale-work-lifecycle-disposal-001",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-stale-work-controller-contract-test.mjs",
      "contract": "uiController.openSavedCanonical(persistenceSchemaId) => true",
      "observable": "uiController.openSavedCanonical(persistenceSchemaId)",
      "expected": "true",
      "binding": "assert.equal(uiController.openSavedCanonical(persistenceSchemaId), true);"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-stale-work-controller-contract-test.mjs",
      "contract": "Schemas removes its on-demand canonical table host during disposal",
      "observable": "elements.get(\"#schema-editor\").querySelector(\"#compact-canonical-table-editor\")",
      "expected": "undefined",
      "binding": "assert.equal(elements.get(\"#schema-editor\").querySelector(\"#compact-canonical-table-editor\"), undefined, \"Schemas removes its on-demand canonical table host during disposal\");"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-stale-work-controller-contract-test.mjs",
      "contract": "a settlement completing after disposal cannot reopen stale canonical UI",
      "observable": "elements.get(\"#compact-canonical-context\").hidden",
      "expected": "true",
      "binding": "assert.equal(elements.get(\"#compact-canonical-context\").hidden, true, \"a settlement completing after disposal cannot reopen stale canonical UI\");"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-004",
      "method": "notEqual",
      "owner": "test/data-layer-installed/schemas/retired-stale-work-controller-contract-test.mjs",
      "contract": "a durable hydration settling after disposal cannot render stale project state",
      "observable": "elements.get(\"#schema-result\").textContent",
      "expected": "\"Loaded schema contributors for Stale Project.\"",
      "binding": "assert.notEqual(elements.get(\"#schema-result\").textContent, \"Loaded schema contributors for Stale Project.\", \"a durable hydration settling after disposal cannot render stale project state\");"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-005",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/retired-stale-work-controller-contract-test.mjs",
      "contract": "String(await disposedRejection) => /disposed before durable persistence settled/",
      "observable": "String(await disposedRejection)",
      "expected": "/disposed before durable persistence settled/",
      "binding": "assert.match(String(await disposedRejection), /disposed before durable persistence settled/);"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-006",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-stale-work-controller-contract-test.mjs",
      "contract": "disposal detaches the durable persistence port",
      "observable": "persistenceListener",
      "expected": "undefined",
      "binding": "assert.equal(fixture.persistenceListener, undefined, \"disposal detaches the durable persistence port\");"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-007",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-stale-work-controller-contract-test.mjs",
      "contract": "Schemas disposes the layered Profile editor with its owner lifecycle",
      "observable": "layeredProfileDisposals",
      "expected": "1",
      "binding": "assert.equal(fixture.layeredProfileDisposals, 1, \"Schemas disposes the layered Profile editor with its owner lifecycle\");"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-008",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-stale-work-controller-contract-test.mjs",
      "contract": "disposal removes the guided continuation choice listener",
      "observable": "guidedChoice.listenerCount()",
      "expected": "0",
      "binding": "assert.equal(guidedChoice.listenerCount(), 0, \"disposal removes the guided continuation choice listener\");"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-009",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/retired-stale-work-controller-contract-test.mjs",
      "contract": "disposal removes the open allowed-value dialog listeners",
      "observable": "expansionConfirm.listenerCount()",
      "expected": "0",
      "binding": "assert.equal(expansionConfirm.listenerCount(), 0, \"disposal removes the open allowed-value dialog listeners\");"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-010",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/retired-stale-work-controller-contract-test.mjs",
      "contract": "Schemas removes every editor and revision listener it owns",
      "observable": "retainedSchemaListeners",
      "expected": "[]",
      "binding": "assert.deepEqual(retainedSchemaListeners, [], \"Schemas removes every editor and revision listener it owns\");"
    }
  ]
};
