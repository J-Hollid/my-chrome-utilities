import assert from "node:assert/strict";

import {
  cancelSavedSessionDeletion,
  confirmSavedSessionDeletion,
  createSavedSessionLibrary,
  exportSavedSession,
  importSavedSession,
  openSavedSession,
  requestSavedSessionDeletion,
  renameSavedSession,
  resumeSavedSession,
  saveCompletedSession,
  savedSessionSummary,
  searchSavedSessions,
} from "../dist/data-layer-saved-sessions.js";

const completed = {
  id: "active-1",
  pageScope: "https://example.test/checkout",
  startedAt: "2026-07-10T10:00:00Z",
  endedAt: "2026-07-10T10:02:00Z",
  provenance: { capture: "live observer" },
  events: [{ id: "event-1", sourceId: "history", sourceName: "Event history", name: "purchase", payload: { value: 49.95 }, rawInput: ["purchase", 49.95], pageUrl: "https://example.test/checkout", captureOrder: 1, provenance: { adapter: "history" } }],
};

let library = createSavedSessionLibrary();
library = saveCompletedSession(library, completed, "Checkout journey");
assert.equal(library.sessions[0].name, "Checkout journey");
assert.deepEqual(savedSessionSummary(library.sessions[0]), {
  captureDate: "2026-07-10",
  pageScope: "https://example.test/checkout",
  duration: "120s",
  sourceCount: 1,
  eventCount: 1,
  validationSummary: "Not checked",
});
completed.events[0].payload.value = 0;
assert.equal(library.sessions[0].events[0].payload.value, 49.95);
assert.throws(() => { library.sessions[0].events.push(completed.events[0]); }, TypeError);

const archived = openSavedSession(library, library.sessions[0].id);
assert.equal(archived.mode, "Archived");
assert.equal(archived.startLiveObserver, false);
const resumed = resumeSavedSession(archived, "https://example.test/confirmation");
assert.equal(resumed.activeSession.parentSavedSessionId, archived.session.id);
assert.equal(archived.session.events.length, 1);

const restored = importSavedSession(createSavedSessionLibrary(), exportSavedSession(archived.session));
assert.deepEqual(restored.sessions[0].events, archived.session.events);
assert.deepEqual(restored.sessions[0].provenance, archived.session.provenance);
assert.equal(restored.sessions[0].immutable, true);
assert.throws(() => importSavedSession(createSavedSessionLibrary(), "{}"), /Invalid saved session export/);
library = renameSavedSession(library, archived.session.id, "Checkout archive");
assert.equal(library.sessions[0].name, "Checkout archive");
assert.deepEqual(searchSavedSessions(library, "purchase").map(({ name }) => name), ["Checkout archive"]);

library = requestSavedSessionDeletion(library, archived.session.id);
assert.equal(library.deletionConfirmation?.name, "Checkout archive");
library = cancelSavedSessionDeletion(library);
assert.equal(library.sessions.length, 1);
library = requestSavedSessionDeletion(library, archived.session.id);
library = confirmSavedSessionDeletion(library);
assert.equal(library.sessions.length, 0);
