import assert from "node:assert/strict";

import {
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

let seed = 0xa54ff53a;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

for (let sample = 0; sample < 200; sample += 1) {
  const savedCount = (sample % 7) + 1;
  const currentCount = (sample % 5) + 1;
  const pageScope = `https://example.test/${nextToken()}`;
  const savedEvents = Array.from({ length:savedCount }, (_, index) => ({
    id:`saved-${sample}-${index}`,
    name:index % 2 ? "purchase" : "page_view",
    sourceId:`source-${index % 3}`,
    sourceName:`Source ${index % 3}`,
    captureOrder:index + 1,
    ...(index % 2 ? { captureTime:`2026-07-12T10:${String(index).padStart(2, "0")}:00Z` } : {}),
    pageUrl:pageScope,
    payload:{ sample, index, token:nextToken() },
    rawInput:["saved", sample, index],
    validation:index % 3 === 0 ? "Valid" : index % 3 === 1 ? "1 issues" : "Not checked",
    validationDetails:{ schema:{ id:"checkout", name:"Checkout", version:3 }, issues:[], evaluations:[] },
  }));
  const session = {
    id:`session-${sample}`,
    name:`Session ${sample}`,
    immutable:true,
    pageScope,
    startedAt:"2026-07-12T10:00:00Z",
    endedAt:"2026-07-12T11:00:00Z",
    events:savedEvents,
  };
  const currentEvents = Array.from({ length:currentCount }, (_, index) => ({
    id:`current-${sample}-${index}`,
    name:"current",
    sourceId:"live",
    sourceName:"Live source",
    captureTime:`2026-07-13T09:${String(index).padStart(2, "0")}:00Z`,
    pageUrl:`${pageScope}/current`,
    payload:{ sample, index },
    rawInput:["current", sample, index],
  }));
  const current = {
    view:"Live",
    status:"Live",
    pageUrl:`${pageScope}/current`,
    sources:[{ id:"live", name:"Live source", status:"Connected" }],
    events:currentEvents,
    query:{ conditions:[{ id:"current", field:"Event name", operator:"is", values:["current"] }] },
    inspectorEventId:currentEvents.at(-1).id,
    listVisible:true,
  };
  const sessionSnapshot = structuredClone(session);
  const currentSnapshot = structuredClone(current);

  const draft = createSessionSaveDraft({
    id:`completed-${sample}`,
    pageScope,
    startedAt:session.startedAt,
    endedAt:session.endedAt,
    events:savedEvents,
  });
  const checked = savedEvents.filter(({ validation }) => validation !== "Not checked");
  const valid = checked.filter(({ validation }) => validation === "Valid").length;
  const expectedSummary = checked.length === 0
    ? "Not checked"
    : valid === checked.length
      ? `${valid} valid`
      : `${valid} valid, ${checked.length - valid} with issues`;
  assert.deepEqual(draft.summary, {
    pageScope,
    eventCount:savedCount,
    sourceCount:new Set(savedEvents.map(({ sourceId }) => sourceId)).size,
    validationSummary:expectedSummary,
  }, "save drafts must summarize the immutable event snapshot");
  assert.notEqual(draft.completed.events, savedEvents, "save drafts must clone event storage");
  assert.equal(unsavedEventCount(draft, savedEvents.slice(0, Math.max(0, savedCount - 1))), 0);
  assert.equal(unsavedEventCount(draft, [...savedEvents, ...currentEvents]), currentCount);

  const requestedScroll = sample % 2 ? sample * 3 : -sample;
  const feed = openSavedSessionLiveFeed(current, session, { scrollTop:requestedScroll });
  assert.equal(feed.currentScrollTop, Math.max(0, requestedScroll), "opening must clamp current scroll state");
  assert.deepEqual(feed.currentView, currentSnapshot, "opening must preserve current feed analysis state");
  assert.deepEqual(feed.savedView.events.map(({ id }) => id), savedEvents.map(({ id }) => id), "archive events must retain capture order");
  assert.equal(feed.savedView.sources.length, new Set(savedEvents.map(({ sourceId }) => sourceId)).size);
  assert.notEqual(feed.session, session, "opening must isolate the archived session boundary");
  assert.equal(feed.readOnly, true);
  assert.equal(feed.startLiveObserver, false);

  const selectedId = savedEvents.at(-1).id;
  const analyzed = updateSavedSessionLiveFeedView(feed, {
    query:{ conditions:[{ id:"saved", field:"Event name", operator:"is", values:["purchase"] }] },
    inspectorEventId:selectedId,
    listVisible:sample % 2 === 0,
    scrollTop:-sample,
  });
  assert.equal(analyzed.savedView.inspectorEventId, selectedId);
  assert.equal(analyzed.savedScrollTop, 0, "saved-feed scroll state must be nonnegative");
  assert.deepEqual(analyzed.currentView, currentSnapshot, "saved-feed analysis must not alter current-feed state");

  const backgroundEvent = {
    id:`background-${sample}`,
    name:"background",
    sourceId:"live",
    sourceName:"Live source",
    captureTime:"2026-07-13T10:00:00Z",
  };
  const withBackground = recordBackgroundLiveEvent(analyzed, backgroundEvent);
  assert.equal(withBackground.backgroundEventCount, 1, "a unique background event must increment the unread count once");
  assert.equal(withBackground.currentView.events.length, currentCount + 1);
  assert.deepEqual(withBackground.savedView.events.map(({ id }) => id), savedEvents.map(({ id }) => id), "background capture must not append to the archive");

  const returned = returnToCurrentLiveFeed(withBackground);
  assert.deepEqual(returned.state, withBackground.currentView);
  assert.notEqual(returned.state, withBackground.currentView, "returning must clone restored current state");
  assert.equal(returned.newEventCount, 1);

  const library = { sessions:[session] };
  const serialized = serializeSavedSessionLiveFeed(withBackground);
  const restored = restoreSavedSessionLiveFeed(serialized, library);
  assert.ok(restored, "valid persisted feed state must restore");
  assert.deepEqual(JSON.parse(serializeSavedSessionLiveFeed(restored)), JSON.parse(serialized), "saved-feed persistence must round trip stably");
  assert.equal(restored.startLiveObserver, false);
  assert.notEqual(restored.session, session, "restoring must isolate the archived session boundary");
  assert.equal(restoreSavedSessionLiveFeed(serialized, { sessions:[] }), undefined, "missing archives must invalidate persisted feed state");
  const tampered = JSON.parse(serialized);
  tampered.savedView.events = [{ id:`forged-${sample}`, name:"forged", sourceId:"forged", captureTime:session.startedAt }];
  tampered.savedView.pageUrl = "https://attacker.invalid/";
  tampered.savedView.inspectorEventId = `forged-${sample}`;
  const restoredFromTamperedView = restoreSavedSessionLiveFeed(JSON.stringify(tampered), library);
  assert.deepEqual(restoredFromTamperedView.savedView.events.map(({ id }) => id), savedEvents.map(({ id }) => id), "restore must derive archived events from the saved-session library");
  assert.equal(restoredFromTamperedView.savedView.pageUrl, pageScope, "restore must derive archive scope from the saved-session library");
  assert.equal(restoredFromTamperedView.savedView.inspectorEventId, undefined, "restore must discard inspector selections outside the archive");

  const compared = revalidateSavedSessionLiveFeed(withBackground, () => ({
    state:"Valid",
    schema:{ name:"Checkout", version:4 },
  }));
  assert.deepEqual(compared.comparison.revisions, [3, 4], "schema revisions must remain sorted and unique");
  assert.equal(compared.comparison.results.length, savedCount);
  assert.deepEqual(compared.session.events, savedEvents, "revalidation must preserve recorded validation evidence");
  assert.deepEqual(session, sessionSnapshot, "saved-feed transitions must not mutate the saved archive");
  assert.deepEqual(current, currentSnapshot, "saved-feed transitions must not mutate the current feed");
}

console.log("saved session Live feed properties: 200 generated cases passed");
