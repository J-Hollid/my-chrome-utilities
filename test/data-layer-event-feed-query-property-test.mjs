import assert from "node:assert/strict";

import {
  applyQueryCondition,
  clearEventFeedQuery,
  eventFeedQueryFields,
  eventFeedQuerySuggestions,
  filterEventsByQuery,
  observedPayloadPaths,
  queryConditionComplete,
  removeQueryCondition,
} from "../dist/data-layer-event-feed-query.js";

let randomState = 0x6d2b79f5;
function random() {
  randomState = Math.imul(randomState ^ (randomState >>> 15), 1 | randomState);
  randomState ^= randomState + Math.imul(randomState ^ (randomState >>> 7), 61 | randomState);
  return ((randomState ^ (randomState >>> 14)) >>> 0) / 4294967296;
}

function randomIndex(length) {
  return Math.floor(random() * length);
}

const names = ["checkout", "pageview", "purchase", "refund", "signup"];

for (let sample = 0; sample < 200; sample += 1) {
  const eventCount = 1 + randomIndex(30);
  const events = Array.from({ length: eventCount }, (_, index) => ({
    id: `event-${sample}-${index}`,
    name: names[randomIndex(names.length)],
    sourceId: `source-${index % 3}`,
    captureTime: `${index}`,
  }));
  const originalEvents = structuredClone(events);
  const emptyQuery = { conditions: [] };

  const unfiltered = filterEventsByQuery(events, emptyQuery);
  assert.deepEqual(unfiltered, events, "an empty query must preserve every event in capture order");
  assert.notEqual(unfiltered, events, "filtering must not expose the mutable input array");

  const leftName = names[randomIndex(names.length)];
  const rightName = names[randomIndex(names.length)];
  const left = { id: "left", field: "Event name", operator: "is", values: [leftName] };
  const right = { id: "right", field: "Event name", operator: "is not", values: [rightName] };
  const leftQuery = applyQueryCondition(emptyQuery, left);
  const rightQuery = applyQueryCondition(emptyQuery, right);
  const combined = applyQueryCondition(leftQuery, right);
  const leftIds = new Set(filterEventsByQuery(events, leftQuery).map(({ id }) => id));
  const rightIds = new Set(filterEventsByQuery(events, rightQuery).map(({ id }) => id));
  const expectedIntersection = events.filter(({ id }) => leftIds.has(id) && rightIds.has(id)).map(({ id }) => id);
  assert.deepEqual(filterEventsByQuery(events, combined).map(({ id }) => id), expectedIntersection, "conditions must be AND-composed");

  const selectedNames = [leftName, rightName];
  const either = applyQueryCondition(emptyQuery, { id: "either", field: "Event name", operator: "is", values: selectedNames });
  assert.deepEqual(
    filterEventsByQuery(events, either).map(({ id }) => id),
    events.filter(({ name }) => selectedNames.includes(name)).map(({ id }) => id),
    "values within one condition must be OR-composed",
  );
  const neither = applyQueryCondition(emptyQuery, { id:"neither", field:"Event name", operator:"is not", values:selectedNames });
  assert.deepEqual(
    filterEventsByQuery(events, neither).map(({ id }) => id),
    events.filter(({ name }) => !selectedNames.includes(name)).map(({ id }) => id),
    "negative values must exclude every selected alternative",
  );

  const normalized = applyQueryCondition(emptyQuery, { id: "normalized", field: "Event name", operator: "is", values: [` ${leftName} `, leftName, ""] });
  assert.deepEqual(normalized.conditions[0].values, [leftName], "condition values must be trimmed and deduplicated");
  assert.deepEqual(removeQueryCondition(combined, "right"), leftQuery, "removing a condition must preserve the others");
  assert.deepEqual(clearEventFeedQuery(combined), emptyQuery, "clearing must restore the empty query");

  const suggestions = eventFeedQuerySuggestions(events, "Event name");
  assert.deepEqual(suggestions, [...new Set(events.map(({ name }) => name))].sort(), "suggestions must be distinct and sorted");

  const payloadEvents = events.map((event, index) => ({
    ...event,
    payload: { custom: { [`field_${index % 7}`]: { value: `value-${index % 11}` } } },
  }));
  const originalPayloadEvents = structuredClone(payloadEvents);
  const expectedPaths = [...new Set(payloadEvents.map((_, index) => `custom.field_${index % 7}.value`))]
    .sort((left, right) => left.localeCompare(right));
  assert.deepEqual(observedPayloadPaths(payloadEvents), expectedPaths, "observed payload paths must be distinct and sorted");
  assert.deepEqual(
    eventFeedQueryFields(payloadEvents),
    ["Event name", "Source", "Adapter kind", "Pathname", "Payload property", "Validation state", "Schema", "Validation rule", "Rule severity", "Affected property"],
    "payload paths must remain behind one stable top-level field",
  );
  assert.deepEqual(eventFeedQuerySuggestions(payloadEvents, "Payload property"), [], "the payload picker field must not behave like a filterable leaf path");
  assert.equal(queryConditionComplete({ id: "picker", field: "Payload property", operator: "is", values: ["anything"] }), false, "the payload picker field must not form a condition");

  const selectedIndex = randomIndex(payloadEvents.length);
  const selectedPath = `custom.field_${selectedIndex % 7}.value`;
  const selectedValue = `value-${selectedIndex % 11}`;
  const payloadQuery = applyQueryCondition(emptyQuery, { id: "payload", field: `Payload · ${selectedPath}`, operator: "is", values: [selectedValue] });
  const expectedPayloadMatches = payloadEvents.filter(({ payload }) => payload.custom[`field_${selectedIndex % 7}`]?.value === selectedValue);
  assert.deepEqual(filterEventsByQuery(payloadEvents, payloadQuery), expectedPayloadMatches, "arbitrary observed payload paths must filter their leaf values");

  const futurePath = `future.path_${sample}.code`;
  const futureQuery = applyQueryCondition(emptyQuery, { id: "future", field: `Payload · ${futurePath}`, operator: "is", values: ["later"] });
  const futureEvent = { ...events[0], id: `future-${sample}`, payload: { future: { [`path_${sample}`]: { code: "later" } } } };
  assert.deepEqual(filterEventsByQuery(payloadEvents, futureQuery), [], "an unseen custom path must not match existing events");
  assert.deepEqual(filterEventsByQuery([...payloadEvents, futureEvent], futureQuery), [futureEvent], "an unseen custom path must match a later event without rebuilding the query");
  assert.deepEqual(payloadEvents, originalPayloadEvents, "payload-path discovery and filtering must not mutate captured events");
  assert.deepEqual(events, originalEvents, "query operations must not mutate captured events");
}
