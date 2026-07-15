import assert from "node:assert/strict";

import {
  confirmOccurrenceExpectation,
  createOccurrenceDefectDraft,
  createOccurrenceReport,
  occurrenceDefectIdentity,
  occurrenceIdentityMatches,
  renderOccurrenceReport,
  selectOccurrenceExpectedIdentity,
} from "../dist/data-layer-event-occurrence-defect-report.js";
import {
  addDefect,
  createDefectLibrary,
  createOccurrenceDefect,
  matchingOccurrenceDefects,
  restoreDefectLibrary,
  serializeDefectLibrary,
} from "../dist/data-layer-defect-library.js";

let state = 0x0cc0ffee;
function token() {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state.toString(36);
}

for (let sample = 0; sample < 200; sample += 1) {
  const sourceId = `source-${token()}`;
  const actualName = `actual-${token()}`;
  const expectedName = `expected-${token()}`;
  const pathname = `/products/${token()}`;
  const payload = {
    page_type:`product-${token()}`,
    product:{ id:sample, labels:[token(), token()] },
  };
  const actual = {
    id:`event-${token()}`,
    sourceId,
    sourceName:`Display ${token()}`,
    eventName:actualName,
    target:"payload",
    payload,
    validation:sample % 2 ? "Valid" : "1 issue",
    schema:{ id:`actual-schema-${sample}`, name:`Actual schema ${sample}`, version:sample + 1 },
    captureTime:new Date(Date.UTC(2026, 6, 15, 8, sample % 60)).toISOString(),
    pageUrl:`https://shop.example${pathname}`,
    visitId:`visit-${sample}`,
    pathname,
    pageLoadGeneration:`generation-${sample}`,
  };
  const actualSnapshot = structuredClone(actual);
  const actualAssignment = {
    id:`assignment-actual-${sample}`, sourceId, eventName:actualName, target:"payload", pathname,
  };
  const expectedAssignment = {
    id:`assignment-expected-${sample}`, sourceId, eventName:expectedName, target:"payload", pathname,
    schemaId:`expected-schema-${sample}`,
  };
  const expectedSchema = {
    id:expectedAssignment.schemaId,
    name:`Expected schema ${sample}`,
    version:sample + 2,
    document:{
      type:"object",
      required:["page_type", "product"],
      properties:{
        page_type:{ type:"string" },
        product:{
          type:"object", required:["id", "labels"],
          properties:{ id:{ type:"number" }, labels:{ type:"array", items:{ type:"string" } } },
        },
      },
    },
    assignments:[],
  };

  let unexpected = createOccurrenceDefectDraft(actual, "Unexpected event", {
    assignments:[actualAssignment], schemas:[expectedSchema], visitEvents:[actual],
  });
  assert.throws(() => confirmOccurrenceExpectation(unexpected), /override/i);
  unexpected = confirmOccurrenceExpectation(unexpected, { override:true });
  const unexpectedReport = createOccurrenceReport(unexpected);
  assert.equal(unexpectedReport.expectedPayload, undefined);
  assert.deepEqual(unexpectedReport.payloadCorrections, []);
  assert.deepEqual(unexpectedReport.actual, actualSnapshot);
  assert.notEqual(unexpectedReport.actual, actual);
  const unexpectedRendered = renderOccurrenceReport(unexpectedReport);
  assert.match(unexpectedRendered.text, new RegExp(actualName));
  assert.match(unexpectedRendered.text, new RegExp(pathname));

  const matchingExpectedEvent = {
    ...structuredClone(actual), id:`matching-${sample}`, eventName:expectedName,
  };
  let wrong = createOccurrenceDefectDraft(actual, "Wrong event name", {
    assignments:[expectedAssignment], schemas:[expectedSchema],
    visitEvents:sample % 2 ? [actual] : [actual, matchingExpectedEvent],
  });
  assert.equal(wrong.expectedIdentity.eventName, expectedName);
  assert.deepEqual(wrong.expectedPayload, payload);
  assert.notEqual(wrong.expectedPayload, payload);
  if (sample % 2) wrong = confirmOccurrenceExpectation(wrong);
  else {
    assert.throws(() => confirmOccurrenceExpectation(wrong), /override/i);
    wrong = confirmOccurrenceExpectation(wrong, { override:true });
  }
  const wrongReport = createOccurrenceReport(wrong);
  const wrongSnapshot = structuredClone(wrongReport);
  const rendered = renderOccurrenceReport(wrongReport);
  assert.match(rendered.text, new RegExp(actualName));
  assert.match(rendered.text, new RegExp(expectedName));
  assert.deepEqual(wrongReport, wrongSnapshot, "rendering must not mutate occurrence reports");

  const identity = occurrenceDefectIdentity(wrongReport);
  for (const volatileChange of [
    { payload:{ changed:token() } },
    { captureTime:`later-${token()}` },
    { pageLoadGeneration:`reload-${token()}` },
    { sourceName:`Renamed ${token()}` },
  ]) {
    const changed = { ...wrongReport, actual:{ ...wrongReport.actual, ...volatileChange } };
    assert.equal(occurrenceIdentityMatches(identity, occurrenceDefectIdentity(changed)), true);
  }
  for (const identityChange of [
    { sourceId:`other-${token()}` },
    { eventName:`other-${token()}` },
    { target:"raw input" },
    { pathname:`/other/${token()}` },
  ]) {
    const changed = { ...wrongReport, actual:{ ...wrongReport.actual, ...identityChange } };
    assert.equal(occurrenceIdentityMatches(identity, occurrenceDefectIdentity(changed)), false);
  }
  const otherMode = { ...wrongReport, mode:"Unexpected event", type:"Unexpected event" };
  assert.equal(occurrenceIdentityMatches(identity, occurrenceDefectIdentity(otherMode)), false);
  const otherExpected = {
    ...wrongReport,
    expectedIdentity:{ ...wrongReport.expectedIdentity, eventName:`other-expected-${token()}` },
  };
  assert.equal(occurrenceIdentityMatches(identity, occurrenceDefectIdentity(otherExpected)), false);

  const customDraft = selectOccurrenceExpectedIdentity(
    createOccurrenceDefectDraft(actual, "Wrong event name", {
      assignments:[], schemas:[], visitEvents:[actual],
    }),
    { sourceId, eventName:expectedName, target:"payload", pathname },
  );
  assert.throws(() => confirmOccurrenceExpectation(customDraft), /acknowledge/i);
  assert.equal(confirmOccurrenceExpectation(customDraft, { acknowledgeWarning:true }).confirmed, true);

  const defect = createOccurrenceDefect({
    id:`defect-${sample}`, now:actual.captureTime, report:wrongReport,
  });
  const added = addDefect(createDefectLibrary(), defect);
  const restored = restoreDefectLibrary(serializeDefectLibrary(added.library));
  assert.deepEqual(restored.defects[0].occurrenceMatch, defect.occurrenceMatch);
  assert.deepEqual(matchingOccurrenceDefects(identity, restored).map(({ id }) => id), [defect.id]);
  assert.deepEqual(actual, actualSnapshot, "occurrence report operations must conserve captured events");
}

console.log("event occurrence defect report properties: 200 generated cases passed");
