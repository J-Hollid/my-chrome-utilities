import assert from "node:assert/strict";

import {
  createLiveObserverState,
  dataLayerViewForNavigationKey,
  dataLayerViews,
  filteredLiveEvents,
  liveEventWindow,
  pauseCapture,
  recordLiveEvent,
  resumeCapture,
  selectLiveEvent,
  setLiveFilter,
} from "../dist/data-layer-live-observer.js";

let seed = 0x9e3779b9;

function nextInteger(limit) {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed % limit;
}

function expectedView(current, key) {
  const index = dataLayerViews.indexOf(current);

  if (key === "Home") return dataLayerViews[0];
  if (key === "End") return dataLayerViews.at(-1);
  if (key === "ArrowRight") return dataLayerViews[(index + 1) % dataLayerViews.length];
  if (key === "ArrowLeft") return dataLayerViews[(index - 1 + dataLayerViews.length) % dataLayerViews.length];
  return undefined;
}

for (let sample = 0; sample < 100; sample += 1) {
  const sources = ["history", "analytics", "ads"].map((id) => ({
    id,
    name: id,
    status: "Connected",
  }));
  let state = createLiveObserverState({
    pageUrl: `https://example.test/${sample}`,
    sources,
  });
  let view = dataLayerViews[nextInteger(dataLayerViews.length)];

  for (const key of ["Home", "End", "ArrowLeft", "ArrowRight", "Escape"]) {
    assert.equal(dataLayerViewForNavigationKey(view, key), expectedView(view, key));
    view = expectedView(view, key) ?? view;
  }

  const eventCount = nextInteger(12) + 1;
  for (let index = 0; index < eventCount; index += 1) {
    state = recordLiveEvent(state, {
      id: `event-${sample}-${index}`,
      name: index % 2 === 0 ? "pageview" : "purchase",
      sourceId: sources[index % sources.length].id,
      sourceName: sources[index % sources.length].name,
      validation: index % 3 === 0 ? "2 issues" : "Valid",
      captureTime: `2026-01-01T00:00:${String(index).padStart(2, "0")}.000Z`,
    });
  }

  const beforePause = state.events;
  state = pauseCapture(state);
  state = recordLiveEvent(state, {
    id: `ignored-${sample}`,
    name: "ignored",
    sourceId: "history",
    captureTime: "2026-01-01T00:01:00.000Z",
  });
  assert.deepEqual(state.events, beforePause);
  state = resumeCapture(state);
  assert.equal(state.status, "Live");

  const sourceId = sources[nextInteger(sources.length)].id;
  const filtered = setLiveFilter(state, { kind: "source", value: sourceId });
  assert.ok(filteredLiveEvents(filtered).every((event) => event.sourceId === sourceId));
  const validationFiltered = setLiveFilter(state, {
    kind: "validation state",
    value: "2 issues",
  });
  assert.ok(
    filteredLiveEvents(validationFiltered).every(
      (event) => event.validation === "2 issues",
    ),
  );
  const windowSize = nextInteger(eventCount) + 1;
  assert.deepEqual(
    liveEventWindow(setLiveFilter(state, undefined), windowSize),
    state.events.slice(-windowSize),
  );
  assert.deepEqual(setLiveFilter(filtered, undefined).events, state.events);

  const selected = selectLiveEvent(state, state.events[0].id, "stacked");
  assert.equal(selected.listVisible, false);
  assert.equal(selected.inspectorEventId, state.events[0].id);
  assert.equal(selectLiveEvent(selected, state.events[0].id, "split").listVisible, true);
}
