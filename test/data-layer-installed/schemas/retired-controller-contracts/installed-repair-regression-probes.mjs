/** Original retired assertions and their exact direct bindings. */
export const group = {
  "group": "installed repair-regression probes",
  "lines": "1041-1186",
  "checks": [
    {
      "id": "installed-repair-regression-probes-001",
      "method": "deepEqual",
      "owner": "test/data-layer-installed/schemas/property-controller-test.mjs",
      "contract": "observed => expectedRepairResult",
      "observable": "observed",
      "expected": "expectedRepairResult",
      "binding": "assert.deepEqual(observed, expectedRepairResult);"
    }
  ]
};
