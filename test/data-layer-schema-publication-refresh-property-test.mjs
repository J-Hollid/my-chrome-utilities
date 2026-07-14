import assert from "node:assert/strict";

import { revalidateCurrentLiveSession } from "../dist/data-layer-schema-publication-refresh.js";

let seed = 0x70756272;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

function schema({ id, name, version, key, assignments = [], revisionHistory = [] }) {
  return {
    id,
    name,
    version,
    published:true,
    document:{ type:"object", required:[key], properties:{ [key]:{ type:"string" } } },
    assignments,
    revisionHistory,
  };
}

for (let sample = 0; sample < 200; sample += 1) {
  const schemaId = `schema-${sample}-${nextToken()}`;
  const eventName = `event-${sample}-${nextToken()}`;
  const currentVersion = sample % 7 + 2;
  const previousVersion = currentVersion - 1;
  const latestKey = `latest_${sample}`;
  const previousKey = `previous_${sample}`;
  const manualKey = `manual_${sample}`;
  const automaticTarget = sample % 2 === 0 ? "payload" : "raw input";
  const manualTarget = sample % 3 === 0 ? "raw input" : "payload";
  const pinned = sample % 4 === 0;
  const assignment = {
    id:`assignment-${sample}`,
    schemaId,
    sourceId:"history",
    eventName,
    target:automaticTarget,
    enabled:true,
    priority:10,
    versionPolicy:pinned ? "pinned" : "follow latest",
    ...(pinned ? { schemaVersion:previousVersion } : {}),
  };
  const previous = schema({
    id:schemaId,
    name:`Published ${sample}`,
    version:previousVersion,
    key:previousKey,
    assignments:[assignment],
  });
  const published = schema({
    id:schemaId,
    name:`Published ${sample}`,
    version:currentVersion,
    key:latestKey,
    assignments:[assignment],
    revisionHistory:[previous],
  });
  const manual = schema({
    id:`manual-${sample}`,
    name:`Manual ${sample}`,
    version:sample % 5 + 1,
    key:manualKey,
    assignments:[{
      sourceId:"manual-only",
      eventName:"never",
      target:manualTarget,
      enabled:true,
    }],
  });
  const publishedSchemas = [published, manual];
  const eventCount = 3 + sample % 4;
  const manualIndex = 1;
  const unmatchedIndex = 2;
  const events = Array.from({ length:eventCount }, (_, index) => {
    const isManual = index === manualIndex;
    const isUnmatched = index === unmatchedIndex;
    const expectedKey = isManual ? manualKey : pinned ? previousKey : latestKey;
    const target = isManual ? manualTarget : automaticTarget;
    const hasRequiredValue = (sample + index) % 2 === 0;
    const targetValue = hasRequiredValue ? { [expectedKey]:`value-${nextToken()}` } : {};
    return {
      id:`event-${sample}-${index}`,
      name:isUnmatched ? `unmatched-${sample}` : eventName,
      sourceId:"history",
      sourceName:"Event history",
      captureTime:`2026-07-14T${String(index).padStart(2, "0")}:00:00Z`,
      pageUrl:`https://example.test/${sample}/${index}`,
      payload:target === "payload" ? targetValue : { untouched:`payload-${nextToken()}` },
      rawInput:target === "raw input" ? targetValue : [eventName, { untouched:`raw-${nextToken()}` }],
      captureOrder:index + 1,
      validation:"Valid",
      validationDetails:{
        schema:{ id:schemaId, name:`Published ${sample}`, version:previousVersion },
        issues:[],
        evaluations:[],
      },
      defectTriage:{ state:"stale", issueStates:["Reported"] },
    };
  });
  const state = {
    view:"Live",
    status:sample % 2 === 0 ? "Live" : "Paused",
    pageUrl:`https://example.test/${sample}`,
    sources:[],
    events,
    listVisible:sample % 3 !== 0,
    inspectorEventId:events[sample % events.length].id,
    query:{ conditions:[{ id:`query-${sample}`, field:"Event name", operator:"is", values:[eventName] }] },
  };
  const overrides = { [events[manualIndex].id]:manual.id };
  const inputSnapshot = structuredClone({ state, publishedSchemas, overrides });

  const refreshed = revalidateCurrentLiveSession(state, publishedSchemas, overrides);

  assert.deepEqual({ state, publishedSchemas, overrides }, inputSnapshot,
    "refresh must not mutate captured state, published schemas, or overrides");
  assert.notEqual(refreshed.state, state);
  assert.deepEqual(refreshed.revalidatedEventIds, events.map(({ id }) => id));
  assert.equal(refreshed.state.events.length, events.length);
  assert.deepEqual({ ...refreshed.state, events:[] }, { ...state, events:[] },
    "refresh must preserve active session interaction state");

  refreshed.state.events.forEach((after, index) => {
    const before = events[index];
    assert.notEqual(after, before);
    assert.equal("defectTriage" in after, false, "stale defect triage must be discarded");
    const {
      validation:_beforeValidation,
      validationDetails:_beforeDetails,
      defectTriage:_beforeTriage,
      ...beforeCapture
    } = before;
    const {
      validation:_afterValidation,
      validationDetails:_afterDetails,
      defectTriage:_afterTriage,
      ...afterCapture
    } = after;
    assert.deepEqual(afterCapture, beforeCapture, "refresh must conserve captured event evidence and ordering");

    if (index === unmatchedIndex) {
      assert.equal(after.validation, "Not checked");
      assert.equal(after.validationDetails.schema, undefined);
      return;
    }
    const isManual = index === manualIndex;
    const expectedVersion = isManual ? manual.version : pinned ? previousVersion : currentVersion;
    const target = isManual ? manualTarget : automaticTarget;
    const targetValue = target === "payload" ? before.payload : before.rawInput;
    const expectedKey = isManual ? manualKey : pinned ? previousKey : latestKey;
    assert.equal(after.validationDetails.schema.version, expectedVersion);
    assert.equal(after.validationDetails.schema.id, isManual ? manual.id : schemaId);
    assert.equal(after.validation, Object.hasOwn(targetValue, expectedKey) ? "Valid" : "1 issues");
  });

  const repeated = revalidateCurrentLiveSession(refreshed.state, publishedSchemas, overrides);
  assert.deepEqual(repeated, refreshed, "refresh must be idempotent for an unchanged publication snapshot");
}

console.log("schema publication refresh properties: 200 generated cases passed");
