import assert from "node:assert/strict";

import {
  addDefect,
  cancelDefectDeletion,
  confirmDefectDeletion,
  createDefectLibrary,
  createMissingEventDefect,
  createValidationDefect,
  defectLifecycleAction,
  editDefect,
  issueTriage,
  matchingDefects,
  requestDefectDeletion,
  restoreDefectLibrary,
  searchDefects,
  serializeDefectLibrary,
  triageEvent,
  updateDefectStatus,
} from "../dist/data-layer-defect-library.js";

let seed = 0x64656663;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

function issue(sample, overrides = {}) {
  const token = `case-${sample}`;
  return {
    sourceId:`source-${token}`,
    eventName:`event-${token}`,
    schemaId:`schema-${token}`,
    validationTarget:"payload",
    concretePath:`/products/${sample % 7}/sku`,
    templatePath:"/products/*/sku",
    ruleId:`rule-${token}`,
    ruleRevision:sample % 5 + 1,
    actual:`actual-${nextToken()}`,
    expected:`expected-${token}`,
    pageUrl:`https://example.test/${nextToken()}`,
    captureTime:`2026-07-14T14:${String(sample % 60).padStart(2, "0")}:00Z`,
    sourceName:`Source ${token}`,
    schemaName:`Schema ${token}`,
    ruleName:`Rule ${token}`,
    ...overrides,
  };
}

for (let sample = 0; sample < 200; sample += 1) {
  const id = `defect-${sample}-${nextToken()}`;
  const now = `2026-07-14T15:${String(sample % 60).padStart(2, "0")}:00Z`;
  const evidence = issue(sample);
  const report = {
    summary:`summary-${sample}-${nextToken()}`,
    description:`description-${nextToken()}`,
    evidence:{ original:true, sample },
  };
  const inputSnapshot = structuredClone({ evidence, report });
  const defect = createValidationDefect({ id, now, report, notes:`note-${id}`, issues:[evidence] });

  assert.deepEqual({ evidence, report }, inputSnapshot, "defect creation must not mutate its inputs");
  assert.equal(defect.issues[0].match.canonicalPath, "/products/*/sku");

  const initial = addDefect(createDefectLibrary(), defect);
  assert.equal(initial.added, true);
  assert.equal(initial.library.defects.length, 1);
  let library = initial.library;

  const changedEvidence = issue(sample, {
    actual:`changed-${nextToken()}`,
    expected:`changed-${nextToken()}`,
    pageUrl:`https://other.test/${nextToken()}`,
    captureTime:`2027-01-01T00:00:00Z`,
    sourceName:"Renamed source",
    schemaName:"Renamed schema",
    ruleName:"Renamed rule",
    concretePath:`/products/${(sample + 3) % 11}/sku`,
  });
  assert.equal(issueTriage(changedEvidence, library).state, "Reported");
  assert.deepEqual(matchingDefects(changedEvidence, library).map(({ id: defectId }) => defectId), [id]);

  const identityDifferences = [
    { sourceId:`other-${nextToken()}` },
    { eventName:`other-${nextToken()}` },
    { schemaId:`other-${nextToken()}` },
    { validationTarget:"raw input" },
    { concretePath:`/other/${nextToken()}`, templatePath:`/other/${nextToken()}` },
    { ruleId:`other-${nextToken()}` },
  ];
  for (const difference of identityDifferences) {
    assert.equal(issueTriage({ ...evidence, ...difference }, library).state, "New");
  }
  assert.equal(issueTriage({ ...evidence, ruleRevision:evidence.ruleRevision + 1 }, library).state, "Review required");

  const duplicate = createValidationDefect({
    id:`duplicate-${id}`,
    now,
    report:{ summary:`duplicate-${id}` },
    issues:[changedEvidence],
  });
  const rejectedDuplicate = addDefect(library, duplicate);
  assert.equal(rejectedDuplicate.added, false);
  assert.equal(rejectedDuplicate.library, library);
  assert.deepEqual(rejectedDuplicate.existing.map(({ id: defectId }) => defectId), [id]);
  const separateDuplicate = addDefect(library, duplicate, true);
  assert.equal(separateDuplicate.added, true);
  assert.equal(separateDuplicate.library.defects.length, 2);

  const unrelated = issue(sample, {
    eventName:`unrelated-${nextToken()}`,
    concretePath:`/unrelated/${nextToken()}`,
    templatePath:`/unrelated/${nextToken()}`,
  });
  assert.deepEqual(triageEvent([changedEvidence, unrelated], library), {
    state:"1 new and 1 reported",
    newCount:1,
    reportedCount:1,
    reviewRequiredCount:0,
    issues:["Reported", "New"],
  });

  const editedAt = `2026-07-15T15:${String(sample % 60).padStart(2, "0")}:00Z`;
  const edited = editDefect(library, id, {
    report:{ ...report, description:`edited-${nextToken()}` },
    notes:`search-note-${id}`,
  }, editedAt);
  assert.equal(edited.defects[0].createdAt, now);
  assert.equal(edited.defects[0].updatedAt, editedAt);
  assert.deepEqual(edited.defects[0].issues, defect.issues, "editable fields must not alter evidence");
  assert.equal(library.defects[0].updatedAt, now, "editing must not mutate the source library");

  const restored = restoreDefectLibrary(serializeDefectLibrary(edited));
  assert.deepEqual(restored, edited);
  restored.defects[0].notes = "mutated restored copy";
  assert.notEqual(restored.defects[0].notes, edited.defects[0].notes);
  assert.deepEqual(searchDefects(edited, {
    query:`search-note-${id}`,
    status:"Reported",
    type:"Validation issue",
    eventName:evidence.eventName,
    schema:evidence.schemaId,
    path:"products/*/sku",
  }).map(({ id: defectId }) => defectId), [id]);

  library = updateDefectStatus(edited, id, "Resolved", editedAt);
  assert.equal(defectLifecycleAction(library.defects[0]), "Reopen");
  assert.equal(issueTriage(changedEvidence, library).state, "Possible regression treated New");
  library = updateDefectStatus(library, id, "Reported", editedAt);
  assert.equal(defectLifecycleAction(library.defects[0]), "Resolve");
  assert.equal(issueTriage(changedEvidence, library).state, "Reported");
  library = updateDefectStatus(library, id, "Archived", editedAt);
  assert.equal(defectLifecycleAction(library.defects[0]), "none");
  assert.equal(issueTriage(changedEvidence, library).state, "New");

  const missing = createMissingEventDefect({
    id:`missing-${id}`,
    now,
    report:{ summary:`missing-${nextToken()}` },
  });
  const withMissing = addDefect(library, missing).library;
  assert.equal(matchingDefects(evidence, withMissing).some(({ id: defectId }) => defectId === missing.id), false);

  const requested = requestDefectDeletion(withMissing, id);
  assert.equal(requested.deletionConfirmationId, id);
  assert.deepEqual(cancelDefectDeletion(requested), withMissing);
  const confirmed = confirmDefectDeletion(requested);
  assert.equal(confirmed.defects.length, withMissing.defects.length - 1);
  assert.equal(confirmed.defects.some(({ id: defectId }) => defectId === id), false);
}

assert.deepEqual(restoreDefectLibrary(null), createDefectLibrary());
assert.deepEqual(restoreDefectLibrary("not json"), createDefectLibrary());
assert.deepEqual(restoreDefectLibrary('{"defects":[{"id":1}]}'), createDefectLibrary());
assert.deepEqual(restoreDefectLibrary('{"defects":[{"id":"defect","type":"Validation issue","status":"Reported","createdAt":"now","updatedAt":"now","report":{},"notes":"","issues":[{}]}]}'), createDefectLibrary());

console.log("defect library properties: 200 generated cases passed");
