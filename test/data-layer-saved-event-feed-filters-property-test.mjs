import assert from "node:assert/strict";

import {
  applySavedEventFeedFilter,
  commitSavedEventFeedFilterLibrary,
  createSavedEventFeedFilter,
  deleteSavedEventFeedFilter,
  eventFeedFilterDisplayState,
  inspectSavedEventFeedFilter,
  renameSavedEventFeedFilter,
  restoreSavedEventFeedFilterLibrary,
  restoreSavedEventFeedWorkingView,
  savedEventFeedFilterNameResult,
  savedEventFeedFilterQueryEqual,
  serializeSavedEventFeedFilterLibrary,
  serializeSavedEventFeedWorkingView,
  setDefaultSavedEventFeedFilter,
  updateSavedEventFeedFilter,
} from "../dist/data-layer-saved-event-feed-filters.js";

let seed = 0x66696c74;

function token() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

for (let sample = 0; sample < 200; sample += 1) {
  const eventValue = `event-${sample}-${token()}`;
  const payloadValue = `code-${sample}-${token()}`;
  const sourceValue = `source-${sample}-${token()}`;
  const firstId = `filter:first:${sample}:${token()}`;
  const secondId = `filter:second:${sample}:${token()}`;
  const firstName = `Zulu ${sample} ${token()}`;
  const secondName = `Alpha ${sample} ${token()}`;
  const renamedName = `Middle ${sample} ${token()}`;
  const firstQuery = { conditions:[
    { id:`editor:${token()}`, field:"Event name", operator:"is", values:[eventValue] },
    { id:`editor:${token()}`, field:"Payload · commerce.code", operator:"is", values:[payloadValue, `alternate-${sample}`] },
  ] };
  const secondQuery = { conditions:[
    { id:`editor:${token()}`, field:"Source", operator:"is", values:[sourceValue] },
  ] };
  const inputsSnapshot = structuredClone({ firstQuery, secondQuery });

  const empty = restoreSavedEventFeedFilterLibrary(null);
  const firstResult = createSavedEventFeedFilter(empty, `  ${firstName}  `, firstQuery, firstId);
  const first = firstResult.filter;
  let library = firstResult.library;
  assert.equal(first.name, firstName, "saved names must be trimmed without changing identity");
  assert.deepEqual(first.conditions.map(({ id }) => id), [
    `${firstId}:condition:1`,
    `${firstId}:condition:2`,
  ], "persisted condition identities must be independent of transient editor identities");
  assert.deepEqual(first.conditions.map(({ field, operator, values }) => ({ field, operator, values })),
    firstQuery.conditions.map(({ field, operator, values }) => ({ field, operator, values })),
    "condition order and selected-value order must be conserved");
  assert.deepEqual(empty, { version:1, filters:[] }, "creation must not mutate the prior library");

  const secondResult = createSavedEventFeedFilter(library, secondName, secondQuery, secondId);
  library = secondResult.library;
  assert.deepEqual(library.filters.map(({ name }) => name), [secondName, firstName].sort((left, right) => left.localeCompare(right)),
    "saved filters must retain canonical name ordering");
  assert.deepEqual(savedEventFeedFilterNameResult(library, ` ${firstName.toUpperCase()} `), {
    accepted:false,
    assistance:"A saved filter with this name exists",
  }, "name uniqueness must be trimmed and case insensitive");

  const serialized = serializeSavedEventFeedFilterLibrary(library);
  const restored = restoreSavedEventFeedFilterLibrary(serialized);
  assert.deepEqual(restored, library, "saved-filter libraries must round-trip through storage");
  restored.filters.find(({ id }) => id === firstId).conditions[0].values[0] = `restored-mutation-${sample}`;
  assert.equal(library.filters.find(({ id }) => id === firstId).conditions[0].values[0], eventValue,
    "restoration must not expose aliases into the serialized library");

  const sessionId = `session:${sample}:${token()}`;
  const workingSerialized = serializeSavedEventFeedWorkingView(sessionId, firstQuery, firstId);
  const working = restoreSavedEventFeedWorkingView(workingSerialized, sessionId, library);
  assert.deepEqual(working, { version:1, sessionId, query:firstQuery, activeFilterId:firstId });
  assert.equal(restoreSavedEventFeedWorkingView(workingSerialized, `${sessionId}:other`, library), undefined,
    "working views must not cross testing-session boundaries");

  const applied = applySavedEventFeedFilter(secondQuery, first);
  assert.equal(savedEventFeedFilterQueryEqual(first, applied), true);
  assert.equal(savedEventFeedFilterQueryEqual(first, {
    conditions:applied.conditions.map((condition, index) => ({ ...condition, id:`replacement:${index}:${token()}` })),
  }), true, "semantic equality must ignore transient condition identities");
  assert.deepEqual(secondQuery, inputsSnapshot.secondQuery, "applying a saved filter must replace without mutating the working query");
  applied.conditions[0].values[0] = `applied-mutation-${sample}`;
  assert.equal(first.conditions[0].values[0], eventValue,
    "applied working queries must not mutate saved definitions through aliases");

  assert.deepEqual(eventFeedFilterDisplayState(firstQuery, firstId, library), {
    label:firstName,
    save:"none",
    modified:false,
  });
  assert.deepEqual(eventFeedFilterDisplayState(secondQuery, firstId, library), {
    label:`${firstName} · Modified`,
    save:"update-or-copy",
    modified:true,
  });

  const events = [{
    name:eventValue,
    sourceId:`source-id-${sample}`,
    sourceName:sourceValue,
    payload:{ commerce:{ code:payloadValue } },
  }];
  const observed = inspectSavedEventFeedFilter(first, events);
  assert.deepEqual(observed.conditions.map(({ status }) => status), ["observed", "observed"]);
  assert.equal(observed.ready, true);
  assert.equal(savedEventFeedFilterQueryEqual(first, observed.query), true);
  const absent = inspectSavedEventFeedFilter(first, []);
  assert.deepEqual(absent.conditions.map(({ status }) => status), ["not observed", "not observed"]);
  assert.equal(absent.ready, true, "unobserved values must remain usable rather than becoming invalid");
  const unsupported = inspectSavedEventFeedFilter({
    ...first,
    conditions:[first.conditions[0], { ...first.conditions[1], field:`Future field ${sample}` }],
  }, events);
  assert.deepEqual(unsupported.conditions.map(({ status }) => status), ["observed", "needs repair"]);
  assert.equal(unsupported.ready, false);
  assert.equal(unsupported.query.conditions.length, 2, "unsupported conditions must be retained for repair");

  library = setDefaultSavedEventFeedFilter(library, firstId).library;
  const beforeRename = structuredClone(library);
  const renamed = renameSavedEventFeedFilter(library, firstId, ` ${renamedName} `);
  library = renamed.library;
  assert.equal(renamed.filter.id, firstId);
  assert.equal(library.defaultFilterId, firstId);
  assert.deepEqual(renamed.filter.conditions, beforeRename.filters.find(({ id }) => id === firstId).conditions,
    "rename must conserve the exact saved definition");
  assert.equal(beforeRename.filters.find(({ id }) => id === firstId).name, firstName,
    "rename must not mutate the prior library");

  const beforeUpdate = structuredClone(library);
  const updated = updateSavedEventFeedFilter(library, firstId, secondQuery);
  library = updated.library;
  assert.equal(updated.filter.id, firstId);
  assert.equal(updated.filter.name, renamedName);
  assert.equal(library.defaultFilterId, firstId);
  assert.equal(savedEventFeedFilterQueryEqual(updated.filter, secondQuery), true);
  assert.deepEqual(beforeUpdate.filters.find(({ id }) => id === firstId).conditions,
    beforeRename.filters.find(({ id }) => id === firstId).conditions,
    "update must not mutate the prior saved definition");

  const currentSnapshot = structuredClone(library);
  const proposed = setDefaultSavedEventFeedFilter(library, secondId).library;
  const failed = commitSavedEventFeedFilterLibrary(library, proposed, () => { throw new Error("quota"); }, "Set default failed");
  assert.equal(failed.committed, false);
  assert.equal(failed.library, library, "failed storage must return the exact committed library");
  assert.deepEqual(failed.library, currentSnapshot);
  const writes = [];
  const committed = commitSavedEventFeedFilterLibrary(library, proposed, (value) => writes.push(value), "Set default failed");
  assert.equal(committed.committed, true);
  assert.equal(committed.library, proposed);
  assert.deepEqual(writes, [serializeSavedEventFeedFilterLibrary(proposed)]);

  const workingSnapshot = structuredClone(firstQuery);
  const deleted = deleteSavedEventFeedFilter(library, firstId, firstQuery);
  assert.equal(deleted.library.filters.some(({ id }) => id === firstId), false);
  assert.equal(deleted.library.defaultFilterId, undefined);
  assert.deepEqual(deleted.workingQuery, workingSnapshot, "delete must conserve the active working query");
  assert.deepEqual(library, currentSnapshot, "delete must not mutate the committed library");
  assert.deepEqual({ firstQuery, secondQuery }, inputsSnapshot, "all operations must leave their query inputs unchanged");

  assert.deepEqual(restoreSavedEventFeedFilterLibrary(`not-json-${sample}`), { version:1, filters:[] });
  assert.deepEqual(restoreSavedEventFeedFilterLibrary(JSON.stringify({ version:2, filters:library.filters })), { version:1, filters:[] });
  assert.deepEqual(restoreSavedEventFeedFilterLibrary(JSON.stringify({ version:1, filters:[{ ...first, conditions:[{ broken:true }] }] })), { version:1, filters:[] });
}

console.log("saved event feed filter properties: 200 generated cases passed");
