import assert from "node:assert/strict";

import {
  initialObservationActivationState,
  nextObservationActivation,
  observationActivationIsCurrent,
} from "../dist/data-layer-observation-activation.js";
import { canonicalCapturedEvent } from "../dist/data-layer-event-presentation.js";
import { historySnapshotPageObject } from "../dist/data-layer-live-observation.js";
import { attachHistoryArrayObserver } from "../dist/data-layer-observer.js";

function valueAtPath(root, path) {
  return path.split(".").reduce((value, part) => value[part], root);
}

for (let sample = 1; sample <= 100; sample += 1) {
  let activation = initialObservationActivationState;
  const generations = [];
  const activationCount = (sample % 12) + 1;

  for (let index = 0; index < activationCount; index += 1) {
    const previousGeneration = activation.generation;
    const next = nextObservationActivation(activation);
    activation = next.state;
    generations.push(next.generation);

    assert.equal(next.generation, previousGeneration + 1);
    assert.equal(observationActivationIsCurrent(activation, next.generation), true);
    assert.equal(observationActivationIsCurrent(activation, previousGeneration), false);
  }

  assert.deepEqual(
    generations,
    Array.from({ length: activationCount }, (_, index) => index + 1),
    "activation generations must be monotonic and gap-free",
  );

  const pathParts = Array.from(
    { length: (sample % 5) + 1 },
    (_, index) => `level${index}`,
  );
  const historyPath = pathParts.join(".");
  const rawValues = Array.from(
    { length: (sample % 7) + 1 },
    (_, index) => ({ event: `event-${sample}-${index}` }),
  );
  const snapshot = historySnapshotPageObject(
    pathParts.map((part) => ` ${part} `).join("."),
    rawValues,
  );

  assert.deepEqual(valueAtPath(snapshot, historyPath), rawValues);
  assert.notEqual(valueAtPath(snapshot, historyPath), rawValues);

  const pageUrl = `https://example.test/reload/${sample}`;
  const firstPageLoad = `load-${sample}-a`;
  const secondPageLoad = `load-${sample}-b`;
  const attach = (state, pageLoadId, requestId) =>
    attachHistoryArrayObserver(state, {
      historyPath,
      pageUrl,
      pageLoadId,
      pageObject: snapshot,
      requestId,
    });

  let observerState = attach({ sourceEvents: [] }, firstPageLoad, "first");
  observerState = attach(observerState, firstPageLoad, "repeat");
  assert.equal(observerState.sourceEvents.length, rawValues.length);

  observerState = attach(observerState, secondPageLoad, "reload");
  assert.equal(observerState.sourceEvents.length, rawValues.length * 2);
  assert.deepEqual(
    observerState.sourceEvents.map(({ pageLoadId }) => pageLoadId),
    [
      ...Array(rawValues.length).fill(firstPageLoad),
      ...Array(rawValues.length).fill(secondPageLoad),
    ],
  );
  assert.equal(
    new Set(observerState.sourceEvents.map(({ id }) => id)).size,
    observerState.sourceEvents.length,
    "equal URL, path, index, and payload must remain distinct across page loads",
  );

  const context = {
    sessionId: `session-${sample}`,
    sourceId: "event-history",
    sourceKind: "Data Layer",
    pageUrl,
    destination: historyPath,
  };
  const firstIdentity = canonicalCapturedEvent(
    { ...context, pageLoadId: firstPageLoad },
    rawValues[0],
    "now",
    1,
  );
  const secondIdentity = canonicalCapturedEvent(
    { ...context, pageLoadId: secondPageLoad },
    rawValues[0],
    "now",
    1,
  );
  assert.notEqual(firstIdentity.id, secondIdentity.id);
}
