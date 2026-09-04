/** Original retired assertions and their direct executable owners. */
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
      "expected": "true"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-002",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/assignment-controller-test.mjs",
      "contract": "Schemas removes its on-demand canonical table host during disposal",
      "observable": "elements.get(\"#schema-editor\").querySelector(\"#compact-canonical-table-editor\")",
      "expected": "undefined"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-003",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "a settlement completing after disposal cannot reopen stale canonical UI",
      "observable": "elements.get(\"#compact-canonical-context\").hidden",
      "expected": "true"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-004",
      "method": "notEqual",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "a durable hydration settling after disposal cannot render stale project state",
      "observable": "elements.get(\"#schema-result\").textContent",
      "expected": "\"Loaded schema contributors for Stale Project.\""
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-005",
      "method": "match",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "String(await disposedRejection) => /disposed before durable persistence settled/",
      "observable": "String(await disposedRejection)",
      "expected": "/disposed before durable persistence settled/"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-006",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/canonical-editor-controller-test.mjs",
      "contract": "disposal detaches the durable persistence port",
      "observable": "persistenceListener",
      "expected": "undefined"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-007",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "Schemas disposes the layered Profile editor with its owner lifecycle",
      "observable": "layeredProfileDisposals",
      "expected": "1"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-008",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "disposal removes the guided continuation choice listener",
      "observable": "guidedChoice.listenerCount()",
      "expected": "0"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-009",
      "method": "equal",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "disposal removes the open allowed-value dialog listeners",
      "observable": "expansionConfirm.listenerCount()",
      "expected": "0"
    },
    {
      "id": "canonical-stale-work-lifecycle-disposal-010",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/lifecycle-test.mjs",
      "contract": "Schemas removes every editor and revision listener it owns",
      "observable": "retainedSchemaListeners",
      "expected": "[]"
    }
  ]
};
