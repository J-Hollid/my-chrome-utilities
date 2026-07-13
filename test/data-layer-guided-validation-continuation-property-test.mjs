import assert from "node:assert/strict";

import {
  continuationEventKey,
  restoreGuidedContinuationSelections,
  selectGuidedContinuation,
  selectedGuidedContinuation,
} from "../dist/data-layer-guided-validation-continuation.js";

let seed = 0x7f4a7c15;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

for (let sample = 0; sample < 200; sample += 1) {
  const event = { id:`capture-${sample}`, sourceId:`source-${nextToken()}`, name:`event-${nextToken()}` };
  const otherEvent = { ...event, id:`other-${sample}`, name:`other-${nextToken()}` };
  const schema = {
    id:`schema-${nextToken()}`,
    name:`Schema ${sample}`,
    version:sample + 1,
    workingDraft:{ pendingChanges:[`change-${sample}`] },
  };
  const otherSchema = {
    id:`other-schema-${nextToken()}`,
    name:`Other schema ${sample}`,
    version:sample + 2,
    workingDraft:{ pendingChanges:[] },
  };
  const publishedOnly = { ...schema, workingDraft:undefined };
  const initial = Object.freeze({ existing:"schema-existing" });

  assert.equal(
    continuationEventKey(event),
    `${event.sourceId}\u0000${event.name}`,
    "continuation identity must depend on the event source and name",
  );

  const selected = selectGuidedContinuation(initial, event, schema.id);
  assert.deepEqual(initial, { existing:"schema-existing" }, "selection must not mutate prior selections");
  assert.equal(selected.existing, "schema-existing", "selection must retain unrelated event context");
  assert.equal(selected[continuationEventKey(event)], schema.id, "selection must record the chosen stable schema identity");
  assert.equal(selectedGuidedContinuation(selected, event, [otherSchema, schema]), schema, "selection must resolve the chosen working draft");
  assert.equal(selectedGuidedContinuation(selected, event, [publishedOnly]), undefined, "selection must not resolve a schema without a working draft");

  const withOtherEvent = selectGuidedContinuation(selected, otherEvent, otherSchema.id);
  assert.equal(withOtherEvent[continuationEventKey(event)], schema.id, "selecting another event must preserve the original event context");
  assert.equal(selectedGuidedContinuation(withOtherEvent, otherEvent, [schema, otherSchema]), otherSchema, "each event must resolve its own working draft");
  assert.deepEqual(
    restoreGuidedContinuationSelections(JSON.stringify(withOtherEvent)),
    withOtherEvent,
    "continuation selections must round-trip through storage",
  );

  const mixedValues = JSON.stringify({
    [continuationEventKey(event)]:schema.id,
    number:sample,
    object:{ schemaId:schema.id },
    boolean:sample % 2 === 0,
    missing:null,
  });
  assert.deepEqual(
    restoreGuidedContinuationSelections(mixedValues),
    { [continuationEventKey(event)]:schema.id },
    "restoration must retain only string schema selections",
  );
}

for (const malformed of [null, "", "not json", "[]", "null", "42", "true"]) {
  assert.deepEqual(restoreGuidedContinuationSelections(malformed), {}, "malformed storage must restore an empty selection set");
}
