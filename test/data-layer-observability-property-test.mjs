import assert from "node:assert/strict";

import {
  duplicateTemplate,
  eventFeed,
  normalizeSourceEvent,
  reviseTemplate,
  runnableSteps,
  saveEventTemplate,
  saveSession,
  sequenceFromSession,
} from "../dist/data-layer-observability.js";

function event(sample, index) {
  return {
    id: `event-${sample}-${index}`,
    sessionId: `session-${sample}`,
    sourceId: `source-${index % 3}`,
    sourceKind: "page",
    name: `event-${index}`,
    captureTime: `2026-01-01T00:00:${String(9 - index).padStart(2, "0")}.000Z`,
    pageUrl: `https://example.test/${sample}`,
    payload: { index, nested: { sample } },
    rawInput: { index },
    provenance: "captured",
  };
}

for (let sample = 0; sample < 100; sample += 1) {
  const events = Array.from({ length: (sample % 5) + 1 }, (_, index) =>
    normalizeSourceEvent(event(sample, index)),
  );
  const template = saveEventTemplate(events[0], `Template ${sample}`, "queue");
  const revised = reviseTemplate(template, { revised: sample });
  const copy = duplicateTemplate(revised, `Copy ${sample}`);

  events[0].payload.nested.sample = -1;
  assert.equal(template.payload.nested.sample, sample);
  assert.equal(template.version, 1);
  assert.equal(revised.version, 2);
  assert.deepEqual(revised.payload, { revised: sample });
  assert.equal(copy.id, `${template.id}:copy`);
  assert.equal(copy.version, revised.version);

  const session = saveSession(
    `saved-${sample}`,
    `Saved ${sample}`,
    events,
    "2026-01-01T00:00:00.000Z",
  );
  const expectedSourceIds = [...new Set(events.map(({ sourceId }) => sourceId))];
  assert.deepEqual(session.sourceIds, expectedSourceIds);
  assert.deepEqual(
    eventFeed(events).map(({ id }) => id),
    [...events]
      .sort((left, right) => left.captureTime.localeCompare(right.captureTime))
      .map(({ id }) => id),
  );

  const sourceId = events[0].sourceId;
  assert.ok(eventFeed(events, sourceId).every((item) => item.sourceId === sourceId));

  const templates = events
    .filter((_, index) => index % 2 === 0)
    .map((item) => saveEventTemplate(item, item.name, "queue"));
  const sequence = sequenceFromSession(session, `Sequence ${sample}`, templates);
  const expectedEventIds = events
    .filter((_, index) => index % 2 === 0)
    .map(({ id }) => id);
  assert.deepEqual(
    sequence.steps.map(({ templateId }) => templateId),
    expectedEventIds.map((id) => `template:${id}`),
  );

  const adapters = expectedSourceIds.map((id, index) => ({
    id,
    name: id,
    kind: "page",
    destination: "queue",
    enabled: true,
    status: "ready",
    capabilities: index % 2 === 0 ? ["push"] : ["inspect"],
  }));
  const runnable = runnableSteps(sequence, templates, adapters);
  assert.ok(runnable.every((step) => {
    const templateForStep = templates.find(({ id }) => id === step.templateId);
    const adapter = adapters.find(({ id }) => id === templateForStep?.sourceId);
    return step.enabled && adapter?.capabilities.includes("push");
  }));
}
