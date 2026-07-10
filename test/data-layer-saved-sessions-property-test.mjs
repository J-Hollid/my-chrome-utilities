import assert from "node:assert/strict";

import {
  cancelSavedSessionDeletion,
  confirmSavedSessionDeletion,
  createSavedSessionLibrary,
  exportSavedSession,
  importSavedSession,
  openSavedSession,
  requestSavedSessionDeletion,
  resumeSavedSession,
  saveCompletedSession,
  savedSessionSummary,
} from "../dist/data-layer-saved-sessions.js";

for (let sample = 0; sample < 100; sample += 1) {
  const eventCount = (sample % 6) + 1;
  const events = Array.from({ length: eventCount }, (_, index) => ({
    id: `event-${sample}-${index}`,
    sourceId: `source-${index % 3}`,
    sourceName: `Source ${index % 3}`,
    name: index % 2 === 0 ? "pageview" : "purchase",
    payload: { sample, index },
    rawInput: [sample, index],
    captureOrder: index + 1,
  }));
  const completed = {
    id: `active-${sample}`,
    pageScope: `https://example.test/${sample}`,
    startedAt: "2026-01-01T00:00:00.000Z",
    endedAt: `2026-01-01T00:00:${String(sample % 60).padStart(2, "0")}.000Z`,
    events,
  };
  let library = saveCompletedSession(
    createSavedSessionLibrary(),
    completed,
    `Session ${sample}`,
  );
  const saved = library.sessions[0];

  events[0].payload.sample = -1;
  assert.equal(saved.events[0].payload.sample, sample);
  assert.equal(saved.immutable, true);
  assert.equal(savedSessionSummary(saved).eventCount, eventCount);
  assert.equal(
    savedSessionSummary(saved).sourceCount,
    new Set(events.map(({ sourceId }) => sourceId)).size,
  );

  const restored = importSavedSession(
    createSavedSessionLibrary(),
    exportSavedSession(saved),
  );
  assert.deepEqual(restored.sessions[0].events, saved.events);
  assert.equal(restored.sessions[0].immutable, true);

  const archived = openSavedSession(library, saved.id);
  const resumed = resumeSavedSession(archived, "https://example.test/resumed");
  assert.equal(resumed.activeSession.parentSavedSessionId, saved.id);
  assert.deepEqual(resumed.activeSession.events, []);
  assert.deepEqual(archived.session.events, saved.events);

  library = requestSavedSessionDeletion(library, saved.id);
  assert.equal(library.deletionConfirmation?.id, saved.id);
  assert.equal(cancelSavedSessionDeletion(library).sessions.length, 1);
  assert.equal(confirmSavedSessionDeletion(library).sessions.length, 0);
}
