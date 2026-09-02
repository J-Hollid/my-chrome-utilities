const CANONICAL_FOCUSED_KINDS = [
  "unit",
  "property",
  "acceptance",
  "browser",
  "checkpoint",
  "package",
];

const EXPECTED_KEYS = ["focusedKinds", "incidentAware", "rawDiagnosticIneligible"];

export function validateVtd014SharedBoundary(boundary) {
  if (!boundary || JSON.stringify(Object.keys(boundary).sort()) !== JSON.stringify(EXPECTED_KEYS)) {
    throw new Error("VTD-014 shared incident boundary evidence is incomplete");
  }
  if (JSON.stringify(boundary.focusedKinds) !== JSON.stringify(CANONICAL_FOCUSED_KINDS)) {
    throw new Error("VTD-014 shared incident boundary has non-canonical focused kinds");
  }
  if (boundary.incidentAware !== true) {
    throw new Error("VTD-014 shared incident boundary is not incident-aware");
  }
  if (boundary.rawDiagnosticIneligible !== true) {
    throw new Error("VTD-014 shared incident boundary permits raw diagnostic evidence");
  }
  return Object.freeze({ ...boundary, focusedKinds:Object.freeze([...boundary.focusedKinds]) });
}

export async function prepareVtd014SharedBoundary({
  store,
  registeredFailure,
  rawDiagnosticIneligible,
}) {
  const persisted = await store.read(registeredFailure.id);
  return validateVtd014SharedBoundary({
    focusedKinds:[...CANONICAL_FOCUSED_KINDS],
    incidentAware:persisted.id === registeredFailure.id &&
      persisted.state === "unresolved" &&
      persisted.failureDigest === registeredFailure.failureDigest &&
      persisted.failure.runnerRunId === registeredFailure.failure.runnerRunId &&
      persisted.failure.sourceReceipt === registeredFailure.failure.sourceReceipt &&
      persisted.retry == null,
    rawDiagnosticIneligible,
  });
}

export function assertVtd014SharedBoundaryRejectsMissingIncident(assert) {
  const valid = {
    focusedKinds:[...CANONICAL_FOCUSED_KINDS],
    incidentAware:true,
    rawDiagnosticIneligible:true,
  };
  assert.throws(() => validateVtd014SharedBoundary({ ...valid, incidentAware:false }),
    /not incident-aware/u);
  const { incidentAware:discarded, ...missing } = valid;
  assert.equal(discarded, true);
  assert.throws(() => validateVtd014SharedBoundary(missing), /incomplete/u);
}
