import assert from "node:assert/strict";

import {
  confirmSessionSave,
  createSessionSaveDraft,
  openSavedSessionLiveFeed,
  recordBackgroundLiveEvent,
  restoreSavedSessionLiveFeed,
  returnToCurrentLiveFeed,
  revalidateSavedSessionLiveFeed,
  serializeSavedSessionLiveFeed,
  updateSavedSessionLiveFeedView,
  unsavedEventCount,
} from "../dist/data-layer-saved-session-live-feed.js";
import {
  createSavedSessionLibrary,
  openSavedSession,
  resumeSavedSession,
} from "../dist/data-layer-saved-sessions.js";

const currentEvents = [
  { id:"current-page", name:"page_view", sourceId:"history", sourceName:"Event history", captureTime:"2026-07-13T09:00:00Z", pageUrl:"https://example.test/checkout", payload:{ page:"checkout" }, rawInput:["page_view"] },
  { id:"purchase", name:"purchase", sourceId:"history", sourceName:"Event history", captureTime:"2026-07-13T09:01:00Z", pageUrl:"https://example.test/checkout", payload:{ total:42 }, rawInput:["purchase", 42] },
];
const current = {
  view:"Live",
  status:"Live",
  pageUrl:"https://example.test/checkout",
  sources:[{ id:"history", name:"Event history", status:"Connected" }],
  events:currentEvents,
  query:{ conditions:[{ id:"purchase", field:"Event name", operator:"is", values:["purchase"] }] },
  inspectorEventId:"purchase",
  listVisible:true,
};

const savedEvents = Array.from({ length:18 }, (_, index) => ({
  id:`saved-${index + 1}`,
  name:index === 17 ? "purchase" : "event",
  sourceId:"history",
  sourceName:"Event history",
  captureTime:`2026-07-12T10:${String(index).padStart(2, "0")}:00Z`,
  pageUrl:"https://example.test/checkout",
  captureOrder:index + 1,
  payload:{ index:index + 1 },
  rawInput:["event", index + 1],
  provenance:{ adapter:"history" },
  validation:"Valid",
  validationDetails:{ schema:{ id:"checkout", name:"Checkout", version:3 }, issues:[], evaluations:[] },
}));

const draft = createSessionSaveDraft({
  id:"active-checkout",
  pageScope:"https://example.test/checkout",
  startedAt:"2026-07-12T10:00:00Z",
  endedAt:"2026-07-12T10:18:00Z",
  events:savedEvents,
});
assert.deepEqual(draft.summary, {
  pageScope:"https://example.test/checkout",
  eventCount:18,
  sourceCount:1,
  validationSummary:"18 valid",
});
assert.throws(() => confirmSessionSave(createSavedSessionLibrary(), draft, "  "), /non-blank/);
const library = confirmSessionSave(createSavedSessionLibrary(), draft, "Checkout journey");
assert.equal(library.sessions[0].events.length, 18);
assert.equal(library.sessions[0].name, "Checkout journey");

const saved = library.sessions[0];
const feed = openSavedSessionLiveFeed(current, saved, { scrollTop:480 });
assert.equal(feed.mode, "Saved session");
assert.equal(feed.readOnly, true);
assert.equal(feed.startLiveObserver, false);
assert.equal(feed.session.id, saved.id);
assert.notEqual(feed.session, saved);
assert.deepEqual(feed.savedView.events.map(({ id }) => id), savedEvents.map(({ id }) => id));
assert.deepEqual(feed.currentView.events.map(({ id }) => id), ["current-page", "purchase"]);
assert.notEqual(feed.savedView.events, saved.events);
assert.equal(feed.currentScrollTop, 480);

const analyzed = updateSavedSessionLiveFeedView(feed, {
  query:{ conditions:[{ id:"saved-purchase", field:"Event name", operator:"is", values:["purchase"] }] },
  inspectorEventId:"saved-18",
  scrollTop:275,
});
assert.equal(analyzed.savedView.inspectorEventId, "saved-18");
assert.equal(analyzed.savedScrollTop, 275);
assert.equal(saved.events.length, 18);
const closedAnalysis = updateSavedSessionLiveFeedView(analyzed, { scrollTop:300 });
assert.equal(closedAnalysis.savedView.inspectorEventId, undefined);
assert.equal(closedAnalysis.savedScrollTop, 300);

const withBackground = recordBackgroundLiveEvent(analyzed, {
  id:"new-live", name:"confirmation", sourceId:"history", captureTime:"2026-07-13T09:02:00Z",
});
assert.equal(withBackground.backgroundEventCount, 1);
assert.equal(withBackground.currentView.events.length, 3);
assert.equal(withBackground.savedView.events.length, 18);
assert.equal(withBackground.session.events.length, 18);

const returned = returnToCurrentLiveFeed(withBackground);
assert.deepEqual(returned.state.query, current.query);
assert.equal(returned.state.inspectorEventId, "purchase");
assert.equal(returned.scrollTop, 480);
assert.equal(returned.state.events.length, 3);
assert.equal(returned.newEventCount, 1);
assert.equal(returned.state.events.some(({ id }) => id === "saved-18"), false);

const restored = restoreSavedSessionLiveFeed(
  serializeSavedSessionLiveFeed(withBackground),
  library,
);
assert.equal(restored?.session.name, "Checkout journey");
assert.equal(restored?.savedView.inspectorEventId, "saved-18");
assert.equal(restored?.savedScrollTop, 275);
assert.equal(restored?.startLiveObserver, false);
assert.notEqual(restored?.session, saved);

const tampered = JSON.parse(serializeSavedSessionLiveFeed(withBackground));
tampered.savedView.events = [{
  id:"forged-event",
  name:"forged",
  sourceId:"forged-source",
  captureTime:"2026-07-14T00:00:00Z",
  payload:{ forged:true },
}];
tampered.savedView.pageUrl = "https://attacker.invalid/";
tampered.savedView.inspectorEventId = "forged-event";
const restoredFromTamperedView = restoreSavedSessionLiveFeed(JSON.stringify(tampered), library);
assert.deepEqual(restoredFromTamperedView?.savedView.events.map(({ id }) => id), savedEvents.map(({ id }) => id));
assert.equal(restoredFromTamperedView?.savedView.pageUrl, saved.pageScope);
assert.equal(restoredFromTamperedView?.savedView.inspectorEventId, undefined);

const compared = revalidateSavedSessionLiveFeed(withBackground, (event) => ({
  state:event.id === "saved-18" ? "1 issues" : "Valid",
  schema:{ name:"Checkout", version:4 },
}));
assert.deepEqual(compared.comparison?.revisions, [3, 4]);
assert.equal(compared.comparison?.results.length, 18);
assert.equal(compared.session.events[17].validation, "Valid");
assert.equal(compared.savedView.events[17].validation, "Valid");

const linked = resumeSavedSession(openSavedSession(library, saved.id), "https://example.test/confirmation");
assert.equal(linked.activeSession.parentSavedSessionId, saved.id);
assert.equal(linked.activeSession.events.length, 0);
assert.equal(saved.events.length, 18);

const laterEvents = [...savedEvents, { ...savedEvents[0], id:"later-1" }, { ...savedEvents[0], id:"later-2" }, { ...savedEvents[0], id:"later-3" }];
assert.equal(draft.completed.events.length, 18);
assert.equal(unsavedEventCount(draft, laterEvents), 3);
