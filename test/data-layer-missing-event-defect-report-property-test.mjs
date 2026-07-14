import assert from "node:assert/strict";

import {
  changeMissingEventInterval,
  changeMissingEventScope,
  confirmMissingEventExpectation,
  createMissingEventDraft,
  createMissingEventReport,
  generateMissingEventRepresentations,
  overrideMissingEventWarning,
  selectMissingEventSchema,
  verifyMissingEventAbsence,
} from "../dist/data-layer-missing-event-defect-report.js";
import { missingEventVisits } from "../dist/data-layer-missing-event-defect-report-ui.js";

let seed = 0x6d697373;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

for (let sample = 0; sample < 200; sample += 1) {
  const sourceId = `source-${nextToken()}`;
  const eventName = `event-${nextToken()}`;
  const pathname = `/checkout/${nextToken()}`;
  const pageUrl = `https://shop.example${pathname}`;
  const start = Date.UTC(2026, 6, 14, 12, sample % 50, 0);
  const iso = (offsetSeconds) => new Date(start + offsetSeconds * 1000).toISOString();
  const matchingCount = sample % 4;
  const matchingEvents = Array.from({ length:matchingCount }, (_, index) => ({
    id:`match-${sample}-${index}`,
    name:eventName,
    sourceId,
    pageUrl,
    captureTime:iso(10 + index),
    validation:index % 2 ? "1 issues" : "Valid",
    payload:{ transactionId:`order-${nextToken()}` },
  }));
  const decoys = [
    { id:`wrong-name-${sample}`, name:`other-${eventName}`, sourceId, pageUrl, captureTime:iso(12), validation:"Valid" },
    { id:`wrong-source-${sample}`, name:eventName, sourceId:`other-${sourceId}`, pageUrl, captureTime:iso(13), validation:"Valid" },
    { id:`wrong-page-${sample}`, name:eventName, sourceId, pageUrl:`${pageUrl}/complete`, captureTime:iso(14), validation:"Valid" },
    { id:`outside-interval-early-${sample}`, name:eventName, sourceId, pageUrl, captureTime:iso(-1), validation:"Valid" },
    { id:`outside-interval-late-${sample}`, name:eventName, sourceId, pageUrl, captureTime:iso(61), validation:"Valid" },
  ];
  const events = [decoys[0], ...matchingEvents, ...decoys.slice(1)];
  const sameVisitMatches = [...matchingEvents, ...decoys.slice(3)];
  const visit = {
    id:`visit-${sample}`,
    pageUrl,
    pathname,
    startedAt:iso(0),
    endedAt:iso(60),
    events,
    immutable:sample % 2 === 0,
  };
  const emptyPageUrl = `https://shop.example/empty/${nextToken()}`;
  const emptyVisit = {
    id:`empty-${sample}`,
    pageUrl:emptyPageUrl,
    pathname:new URL(emptyPageUrl).pathname,
    startedAt:iso(120),
    endedAt:iso(180),
    events:[],
  };
  const assignment = {
    id:`assignment-${sample}`,
    name:`Assignment ${sample}`,
    sourceId,
    eventName,
    target:sample % 2 ? "raw input" : "payload",
    domainCondition:"shop.example",
    pathnameCondition:pathname,
    enabled:true,
  };
  const schema = {
    id:`schema-${sample}`,
    name:`Schema ${nextToken()}`,
    version:sample + 1,
    document:{ type:"object" },
    assignments:[assignment],
    attachedRules:[{ id:`rule-${sample}`, version:1, propertyPath:"/transactionId", operator:"required" }],
    documentation:{ description:`Expected event ${sample}` },
  };
  const inputs = { visits:[visit, emptyVisit], schemas:[schema] };
  const inputSnapshot = structuredClone(inputs);

  let draft = createMissingEventDraft("property test", inputs.visits, inputs.schemas);
  draft = selectMissingEventSchema(draft, schema.id);
  draft = verifyMissingEventAbsence(confirmMissingEventExpectation(draft));

  assert.equal(draft.verification.matchingCount, sameVisitMatches.length);
  assert.equal(draft.verification.warningVisible, true);
  assert.deepEqual(draft.verification.matches.map(({ id }) => id), sameVisitMatches.map(({ id }) => id));
  assert.deepEqual(inputs, inputSnapshot, "draft and verification operations must not mutate their inputs");

  assert.throws(() => createMissingEventReport(draft), /explicit override/i);
  draft = overrideMissingEventWarning(draft, `fixture ${sample}`);

  const timelineIds = events.filter((_, index) => index % 2 === sample % 2).map(({ id }) => id);
  const manualSteps = [`Choose product ${sample}`, `Submit ${nextToken()}`];
  const report = createMissingEventReport(draft, timelineIds, manualSteps);
  assert.equal(report.type, "Missing event");
  assert.equal(report.capturedEventId, undefined);
  assert.equal(report.capture, undefined);
  assert.equal(report.payload, undefined);
  assert.deepEqual(report.validationIssues, []);
  assert.equal(report.schema.id, schema.id);
  assert.equal(report.schema.version, schema.version);
  assert.deepEqual(report.matchingEventEvidence.map(({ id }) => id), sameVisitMatches.map(({ id }) => id));
  assert.deepEqual(report.timeline.map(({ id }) => id), events.filter(({ id }) => timelineIds.includes(id)).map(({ id }) => id));
  assert.deepEqual(report.reproductionSteps, [`Visit ${pathname}`, ...manualSteps, `Expect at least one matching ${eventName} event`]);
  assert.equal(Boolean(report.override), true);

  const representations = generateMissingEventRepresentations(report);
  for (const representation of [representations.previewText, representations.jiraText, representations.previewHtml]) {
    assert.match(representation, /Missing event/);
    assert.match(representation, /no matching[^.\n<]*event was captured/i);
    assert.ok(representation.includes(`${schema.name} revision ${schema.version}`));
    assert.doesNotMatch(representation, /Actual JSON|validation differences/i);
    assert.equal(/Explicit override/.test(representation), true);
  }
  assert.deepEqual(representations.expectedPayload, {});

  let changedScope = changeMissingEventScope(draft, emptyVisit.id);
  changedScope = verifyMissingEventAbsence(changedScope);
  assert.equal(changedScope.verification.matchingCount, 0);
  assert.equal(changedScope.override, undefined);
  changedScope = verifyMissingEventAbsence(changeMissingEventScope(changedScope, visit.id));
  assert.equal(changedScope.verification.matchingCount, sameVisitMatches.length);
  assert.equal(changedScope.override, undefined);

  let changedInterval = changeMissingEventInterval(draft, iso(30), iso(60));
  changedInterval = verifyMissingEventAbsence(changedInterval);
  assert.equal(changedInterval.verification.matchingCount, sameVisitMatches.length,
    "absence evidence is scoped by immutable page-visit identity, not editable timestamps");
  assert.equal(changedInterval.override, undefined);
  changedInterval = verifyMissingEventAbsence(changeMissingEventInterval(changedInterval, iso(0), iso(60)));
  assert.equal(changedInterval.verification.matchingCount, sameVisitMatches.length);

  const chronology = [
    { ...decoys[0], pageUrl, captureTime:iso(1) },
    { ...decoys[1], pageUrl, captureTime:iso(2) },
    { ...decoys[2], pageUrl:emptyPageUrl, captureTime:iso(3) },
  ];
  const chronologySnapshot = structuredClone(chronology);
  const grouped = missingEventVisits(chronology, emptyPageUrl, true);
  assert.deepEqual(grouped.map(({ pageUrl:eventPage, events:groupEvents }) => [eventPage, groupEvents.map(({ id }) => id)]), [
    [pageUrl, chronology.slice(0, 2).map(({ id }) => id)],
    [emptyPageUrl, [chronology[2].id]],
  ]);
  assert.ok(grouped.every(({ immutable }) => immutable));
  assert.deepEqual(chronology, chronologySnapshot, "visit grouping must preserve captured chronology");
}

console.log("missing-event defect report properties: 200 generated cases passed");
