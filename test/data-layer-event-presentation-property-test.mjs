import assert from "node:assert/strict";

import {
  canonicalCapturedEvent,
  importExistingHistory,
  importedOnce,
  markImported,
  nextSubscription,
  stopSubscription,
} from "../dist/data-layer-event-presentation.js";

for (let sample = 0; sample < 100; sample += 1) {
  const context = {
    sessionId: `session-${sample}`,
    sourceId: "event-history",
    sourceKind: "Data Layer",
    pageUrl: `https://example.test/${sample}`,
    destination: "event.history",
  };
  const inputs = Array.from({ length: (sample % 8) + 1 }, (_, index) => [
    `event-${index}`,
    { sample, index },
  ]);
  const events = importExistingHistory(context, inputs, "2026-01-01T00:00:00Z");

  assert.deepEqual(events.map((event) => event.name), inputs.map(([name]) => name));
  assert.equal(new Set(events.map((event) => event.id)).size, inputs.length);
  inputs[0][1].sample = -1;
  assert.equal(events[0].payload.sample, sample);

  const raw = { event: "purchase", nested: { sample } };
  const captured = canonicalCapturedEvent(context, raw, "now", inputs.length + 1);
  raw.nested.sample = -1;
  assert.equal(captured.payload.nested.sample, sample);
  assert.equal(captured.rawInput.nested.sample, sample);

  let subscription = nextSubscription(
    { imported: new Set(), activeCount: 0 },
    context.pageUrl,
    context.destination,
    "first",
  );
  subscription = markImported(subscription, context.pageUrl, context.destination, inputs.length);
  subscription = markImported(subscription, context.pageUrl, context.destination, inputs.length + 1);
  assert.equal(subscription.activeCount, 1);
  assert.ok(
    Array.from({ length: inputs.length + 1 }, (_, index) =>
      importedOnce(subscription, context.pageUrl, context.destination, index),
    ).every(Boolean),
  );
  assert.equal(stopSubscription(subscription).activeCount, 0);
}
